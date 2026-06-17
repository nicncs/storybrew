import Foundation

/// A distinct, reproducible voice character for the text-to-speech engine.
///
/// We don't hard-code Apple voice identifiers (they vary by device and OS),
/// so a profile describes *how* a voice should sound — gender lean, pitch and
/// pace — and `AudioService` resolves it to a concrete `AVSpeechSynthesisVoice`
/// at playback time. This keeps each character's voice recognisable across
/// devices without depending on a specific installed voice.
struct VoiceProfile: Codable, Equatable, Identifiable {
    enum GenderLean: String, Codable {
        case feminine
        case masculine
        case neutral
    }

    var id: String
    var displayName: String
    var genderLean: GenderLean
    /// 0.5 (deep) ... 2.0 (high). 1.0 is natural.
    var pitch: Float
    /// AVSpeechUtterance rate. ~0.5 is the default speaking rate.
    var rate: Float

    /// A palette of six clearly distinguishable voices. Characters are assigned
    /// from this palette in order so every character in a story sounds different.
    static let palette: [VoiceProfile] = [
        VoiceProfile(id: "bright",  displayName: "Bright",  genderLean: .feminine, pitch: 1.35, rate: 0.48),
        VoiceProfile(id: "warm",    displayName: "Warm",    genderLean: .masculine, pitch: 0.85, rate: 0.45),
        VoiceProfile(id: "bubbly",  displayName: "Bubbly",  genderLean: .feminine, pitch: 1.55, rate: 0.52),
        VoiceProfile(id: "gentle",  displayName: "Gentle",  genderLean: .neutral,  pitch: 1.05, rate: 0.46),
        VoiceProfile(id: "booming", displayName: "Booming", genderLean: .masculine, pitch: 0.7,  rate: 0.42),
        VoiceProfile(id: "chirpy",  displayName: "Chirpy",  genderLean: .feminine, pitch: 1.7,  rate: 0.5),
    ]

    /// The calm voice used for narration / the storyteller.
    static let narrator = VoiceProfile(
        id: "narrator",
        displayName: "Storyteller",
        genderLean: .neutral,
        pitch: 1.0,
        rate: 0.46
    )

    static func forIndex(_ index: Int) -> VoiceProfile {
        palette[index % palette.count]
    }
}
