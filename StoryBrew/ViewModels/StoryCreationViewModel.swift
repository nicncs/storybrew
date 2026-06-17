import Foundation

/// Drives the "make a story" flow: parent inputs → generation → a draft story
/// ready for thumbs up / down review.
@MainActor
final class StoryCreationViewModel: ObservableObject {
    /// A character being assembled in the picker (before it becomes a `Character`).
    struct Draft: Identifiable, Equatable {
        let id = UUID()
        var name: String
        var animal: AnimalType
    }

    enum Phase: Equatable {
        case editing
        case generating
        case error(String)
    }

    // Inputs
    @Published var childAge: Int = 4
    @Published var theme: String = ""
    @Published var drafts: [Draft] = []

    // Series continuation (set when making the next episode of an existing story).
    @Published var continuingSeriesID: UUID?
    @Published var continuingSeriesTitle: String?
    private var episodeNumber: Int = 1
    private var previousSummaries: [String] = []

    @Published private(set) var phase: Phase = .editing

    let minAge = 1
    let maxAge = 10
    let maxCharacters = 5

    private let engine: StoryEngine

    init(engine: StoryEngine = AppConfig.makeStoryEngine()) {
        self.engine = engine
    }

    var canAddCharacter: Bool { drafts.count < maxCharacters }

    var canGenerate: Bool {
        !drafts.isEmpty
            && drafts.allSatisfy { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
            && !theme.trimmingCharacters(in: .whitespaces).isEmpty
            && phase != .generating
    }

    var isContinuingSeries: Bool { continuingSeriesID != nil }

    // MARK: - Character editing

    func addCharacter(_ animal: AnimalType) {
        guard canAddCharacter else { return }
        drafts.append(Draft(name: animal.suggestedName, animal: animal))
    }

    func removeCharacter(_ draft: Draft) {
        drafts.removeAll { $0.id == draft.id }
    }

    /// Prepare the form to write the next episode of an existing series.
    ///
    /// If the source story is a standalone (no series yet), it is promoted in
    /// place to be episode 1 of a new series so the original and the new episode
    /// group together.
    func configureForNextEpisode(of story: Story, store: StoryStore) {
        let seriesID = story.seriesID ?? story.id
        let seriesTitle = story.seriesTitle ?? story.title

        if story.seriesID == nil {
            var promoted = story
            promoted.seriesID = seriesID
            promoted.seriesTitle = seriesTitle
            promoted.episodeNumber = 1
            store.upsert(promoted)
        }

        continuingSeriesID = seriesID
        continuingSeriesTitle = seriesTitle
        childAge = story.childAge
        theme = story.theme
        drafts = story.characters.map { Draft(name: $0.name, animal: $0.animal) }
        episodeNumber = store.nextEpisodeNumber(seriesID: seriesID)
        previousSummaries = store.previousSummaries(seriesID: seriesID)
    }

    // MARK: - Generation

    /// Build characters from the drafts, assigning each a distinct voice.
    private func buildCharacters() -> [Character] {
        drafts.enumerated().map { index, draft in
            Character(
                name: draft.name.trimmingCharacters(in: .whitespaces),
                animal: draft.animal,
                voiceProfile: .forIndex(index)
            )
        }
    }

    /// Generate a story and return it as a `pending` draft for review.
    /// Returns nil if generation failed (phase carries the error).
    func generate() async -> Story? {
        phase = .generating
        let characters = buildCharacters()
        let request = StoryRequest(
            childAge: childAge,
            characters: characters,
            theme: theme.trimmingCharacters(in: .whitespaces),
            seriesTitle: continuingSeriesTitle,
            episodeNumber: episodeNumber,
            previousEpisodeSummaries: previousSummaries
        )

        do {
            let generated = try await engine.generate(request)
            phase = .editing
            return Story(
                title: generated.title,
                summary: generated.summary,
                lines: generated.lines.map { StoryLine(speaker: $0.speaker, text: $0.text) },
                moralLesson: generated.moralLesson,
                childAge: childAge,
                theme: request.theme,
                characters: characters,
                seriesID: continuingSeriesID,
                seriesTitle: continuingSeriesTitle,
                episodeNumber: episodeNumber,
                approvalState: .pending
            )
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            phase = .error(message)
            return nil
        }
    }

    func dismissError() {
        if case .error = phase { phase = .editing }
    }
}
