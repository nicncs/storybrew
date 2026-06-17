import Foundation

/// Everything the engine needs to write one episode.
struct StoryRequest {
    var childAge: Int
    var characters: [Character]
    var theme: String

    // Series continuity (nil for a brand-new standalone story / first episode).
    var seriesTitle: String?
    var episodeNumber: Int
    /// Short summaries of earlier episodes so the new one stays consistent.
    var previousEpisodeSummaries: [String]

    var isSeriesEpisode: Bool { episodeNumber > 1 || seriesTitle != nil }
}

/// The raw story content an engine returns, before it becomes a persisted `Story`.
struct GeneratedStory: Codable {
    struct Line: Codable {
        var speaker: String
        var text: String
    }

    var title: String
    var summary: String
    var lines: [Line]
    var moralLesson: String
}

enum StoryEngineError: LocalizedError {
    case notConfigured(String)
    case blockedInput(String)
    case blockedOutput
    case network(String)
    case decoding(String)
    case empty

    var errorDescription: String? {
        switch self {
        case .notConfigured(let detail): return detail
        case .blockedInput(let reason): return reason
        case .blockedOutput:
            return "We couldn't make a story that felt right for little ones. Please try a different idea."
        case .network(let detail): return "We had trouble brewing the story. \(detail)"
        case .decoding(let detail): return "The story came back in a shape we didn't expect. \(detail)"
        case .empty: return "The storyteller went quiet. Please try again."
        }
    }
}

/// A pluggable story generator. The app ships `ClaudeStoryEngine`, but this
/// protocol lets you swap in a proxy/backend or an offline engine without
/// touching the UI or persistence layers.
protocol StoryEngine {
    func generate(_ request: StoryRequest) async throws -> GeneratedStory
}
