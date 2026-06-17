import Foundation

/// One spoken line of a story, attributed to a speaker so each line can be
/// read in that character's voice. Narration uses the reserved speaker name
/// `Story.narratorSpeaker`.
struct StoryLine: Codable, Equatable, Identifiable {
    var id: UUID
    var speaker: String
    var text: String

    init(id: UUID = UUID(), speaker: String, text: String) {
        self.id = id
        self.speaker = speaker
        self.text = text
    }
}

/// Where a story is in the parent review flow.
enum ApprovalState: String, Codable {
    /// Generated, waiting for a thumbs up / down.
    case pending
    /// Thumbs up — eligible for audio generation and the playlist.
    case approved
    /// Thumbs down — kept out of the playlist (parent can delete or regenerate).
    case rejected
}

/// A complete, short (≈2 minute) story. Stories may belong to a multi-episode
/// series via `seriesID` / `episodeNumber`.
struct Story: Codable, Equatable, Identifiable {
    static let narratorSpeaker = "Narrator"

    var id: UUID
    var title: String
    var summary: String
    var lines: [StoryLine]
    var moralLesson: String

    // Inputs that produced the story (kept for "next episode" continuity and review).
    var childAge: Int
    var theme: String
    var characters: [Character]

    // Series support.
    var seriesID: UUID?
    var seriesTitle: String?
    var episodeNumber: Int

    // Review + playback state.
    var approvalState: ApprovalState
    /// True once the parent has approved and audio has been prepared at least once.
    var audioReady: Bool
    var createdAt: Date

    init(
        id: UUID = UUID(),
        title: String,
        summary: String,
        lines: [StoryLine],
        moralLesson: String,
        childAge: Int,
        theme: String,
        characters: [Character],
        seriesID: UUID? = nil,
        seriesTitle: String? = nil,
        episodeNumber: Int = 1,
        approvalState: ApprovalState = .pending,
        audioReady: Bool = false,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.summary = summary
        self.lines = lines
        self.moralLesson = moralLesson
        self.childAge = childAge
        self.theme = theme
        self.characters = characters
        self.seriesID = seriesID
        self.seriesTitle = seriesTitle
        self.episodeNumber = episodeNumber
        self.approvalState = approvalState
        self.audioReady = audioReady
        self.createdAt = createdAt
    }

    /// Resolve the voice for a given line's speaker. Falls back to the narrator
    /// voice for narration or any speaker we can't match to a character.
    func voiceProfile(for speaker: String) -> VoiceProfile {
        if let match = characters.first(where: { $0.name.caseInsensitiveCompare(speaker) == .orderedSame }) {
            return match.voiceProfile
        }
        return VoiceProfile.narrator
    }

    /// Rough spoken-word duration estimate (~150 words/minute) for display.
    var estimatedReadingSeconds: Int {
        let words = lines.reduce(0) { $0 + $1.text.split(separator: " ").count }
        return max(20, Int(Double(words) / 150.0 * 60.0))
    }

    var plainText: String {
        lines.map { line in
            line.speaker == Story.narratorSpeaker ? line.text : "\(line.speaker): \(line.text)"
        }.joined(separator: "\n\n")
    }
}

// Identity-based hashing so `Story` works as a navigation value.
extension Story: Hashable {
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
