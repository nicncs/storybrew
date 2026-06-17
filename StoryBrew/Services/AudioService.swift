import Foundation
import AVFoundation

/// Reads a story aloud using on-device text-to-speech, giving each character a
/// distinct voice via their `VoiceProfile` (voice + pitch + rate).
///
/// Audio is synthesised on demand each time a story is played, so there are no
/// audio files to store or clean up — replaying is just re-running synthesis.
@MainActor
final class AudioService: NSObject, ObservableObject {
    @Published private(set) var isPlaying = false
    @Published private(set) var isPaused = false
    /// Index into the currently-playing story's `lines`, or nil when stopped.
    @Published private(set) var currentLineIndex: Int?
    /// The story currently loaded into the player.
    @Published private(set) var currentStoryID: UUID?

    private let synthesizer = AVSpeechSynthesizer()
    private var lines: [StoryLine] = []
    private var voiceResolutions: [String: AVSpeechSynthesisVoice?] = [:]
    private var availableEnglishVoices: [AVSpeechSynthesisVoice] = []
    /// Counters so progress tracking is correct even if two lines share text.
    private var startedCount = 0
    private var finishedCount = 0

    override init() {
        super.init()
        synthesizer.delegate = self
        availableEnglishVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix("en") }
    }

    // MARK: - Controls

    func play(_ story: Story) {
        stop()
        configureAudioSession()
        currentStoryID = story.id
        lines = story.lines
        voiceResolutions = resolveVoices(for: story)
        guard !lines.isEmpty else { return }

        startedCount = 0
        finishedCount = 0
        isPlaying = true
        isPaused = false
        for line in lines {
            synthesizer.speak(utterance(for: line, in: story))
        }
        currentLineIndex = 0
    }

    func pause() {
        guard isPlaying, !isPaused else { return }
        synthesizer.pauseSpeaking(at: .word)
        isPaused = true
    }

    func resume() {
        guard isPlaying, isPaused else { return }
        synthesizer.continueSpeaking()
        isPaused = false
    }

    func togglePlayPause(for story: Story) {
        if currentStoryID == story.id, isPlaying {
            isPaused ? resume() : pause()
        } else {
            play(story)
        }
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        isPlaying = false
        isPaused = false
        currentLineIndex = nil
        currentStoryID = nil
        lines = []
    }

    /// Whether this story is the one currently loaded in the player.
    func isCurrent(_ story: Story) -> Bool { currentStoryID == story.id }

    // MARK: - Synthesis helpers

    private func utterance(for line: StoryLine, in story: Story) -> AVSpeechUtterance {
        let profile = story.voiceProfile(for: line.speaker)
        let utterance = AVSpeechUtterance(string: line.text)
        utterance.pitchMultiplier = profile.pitch
        utterance.rate = profile.rate
        utterance.preUtteranceDelay = 0.15
        utterance.postUtteranceDelay = 0.25
        if let voice = voiceResolutions[profile.id] ?? nil {
            utterance.voice = voice
        }
        return utterance
    }

    /// Pick a concrete installed voice for each profile used in the story.
    private func resolveVoices(for story: Story) -> [String: AVSpeechSynthesisVoice?] {
        var profiles = story.characters.map(\.voiceProfile)
        profiles.append(.narrator)

        var result: [String: AVSpeechSynthesisVoice?] = [:]
        for (offset, profile) in profiles.enumerated() {
            result[profile.id] = pickVoice(for: profile, salt: offset)
        }
        return result
    }

    private func pickVoice(for profile: VoiceProfile, salt: Int) -> AVSpeechSynthesisVoice? {
        guard !availableEnglishVoices.isEmpty else {
            return AVSpeechSynthesisVoice(language: "en-US")
        }
        let candidates: [AVSpeechSynthesisVoice]
        switch profile.genderLean {
        case .feminine:
            candidates = availableEnglishVoices.filter { $0.gender == .female }
        case .masculine:
            candidates = availableEnglishVoices.filter { $0.gender == .male }
        case .neutral:
            candidates = availableEnglishVoices
        }
        let pool = candidates.isEmpty ? availableEnglishVoices : candidates
        // Stable pick so the same character keeps the same base voice.
        let index = abs(profile.id.hashValue &+ salt) % pool.count
        return pool[index]
    }

    private func configureAudioSession() {
        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [])
        try? session.setActive(true)
        #endif
    }
}

extension AudioService: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in
            guard isPlaying else { return }
            currentLineIndex = min(startedCount, max(0, lines.count - 1))
            startedCount += 1
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            guard isPlaying else { return }
            finishedCount += 1
            if finishedCount >= lines.count {
                stop()
            }
        }
    }
}
