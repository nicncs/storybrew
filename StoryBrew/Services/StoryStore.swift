import Foundation
import Combine

/// The single source of truth for saved stories. Persists to a JSON file in the
/// app's Documents directory, so everything stays on-device. Drives the
/// playlist (approved stories) and supports deletion and series grouping.
@MainActor
final class StoryStore: ObservableObject {
    @Published private(set) var stories: [Story] = []

    private let fileURL: URL

    init(filename: String = "stories.json") {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.fileURL = documents.appendingPathComponent(filename)
        load()
    }

    // MARK: - Derived collections

    /// The playlist: approved stories, newest first.
    var playlist: [Story] {
        stories
            .filter { $0.approvalState == .approved }
            .sorted { $0.createdAt > $1.createdAt }
    }

    var hasPlaylist: Bool { !playlist.isEmpty }

    /// Approved episodes that belong to the same series as `story`, in order.
    func episodes(inSeriesOf story: Story) -> [Story] {
        guard let seriesID = story.seriesID else { return [story] }
        return stories
            .filter { $0.seriesID == seriesID }
            .sorted { $0.episodeNumber < $1.episodeNumber }
    }

    /// Summaries of approved earlier episodes, used to keep a new episode consistent.
    func previousSummaries(seriesID: UUID) -> [String] {
        stories
            .filter { $0.seriesID == seriesID && $0.approvalState == .approved }
            .sorted { $0.episodeNumber < $1.episodeNumber }
            .map(\.summary)
    }

    func nextEpisodeNumber(seriesID: UUID) -> Int {
        let highest = stories.filter { $0.seriesID == seriesID }.map(\.episodeNumber).max() ?? 0
        return highest + 1
    }

    // MARK: - Mutations

    func upsert(_ story: Story) {
        if let index = stories.firstIndex(where: { $0.id == story.id }) {
            stories[index] = story
        } else {
            stories.append(story)
        }
        save()
    }

    func approve(_ story: Story) {
        update(story.id) { $0.approvalState = .approved }
    }

    func reject(_ story: Story) {
        update(story.id) { $0.approvalState = .rejected }
    }

    func markAudioReady(_ storyID: UUID) {
        update(storyID) { $0.audioReady = true }
    }

    func delete(_ story: Story) {
        stories.removeAll { $0.id == story.id }
        save()
    }

    func delete(at offsets: IndexSet, in list: [Story]) {
        let ids = offsets.map { list[$0].id }
        stories.removeAll { ids.contains($0.id) }
        save()
    }

    private func update(_ id: UUID, _ change: (inout Story) -> Void) {
        guard let index = stories.firstIndex(where: { $0.id == id }) else { return }
        change(&stories[index])
        save()
    }

    // MARK: - Persistence

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        if let decoded = try? JSONDecoder.storyDecoder.decode([Story].self, from: data) {
            stories = decoded
        }
    }

    private func save() {
        guard let data = try? JSONEncoder.storyEncoder.encode(stories) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }
}

private extension JSONEncoder {
    static var storyEncoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

private extension JSONDecoder {
    static var storyDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
