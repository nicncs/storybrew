import Foundation

/// A tiny offline engine used for SwiftUI previews and as a graceful fallback
/// when no API key is configured. It stitches together a safe, generic little
/// story from the chosen characters so the rest of the app stays demonstrable
/// without a network call. Quality is intentionally basic.
struct TemplateStoryEngine: StoryEngine {
    func generate(_ request: StoryRequest) async throws -> GeneratedStory {
        let check = StoryGuardrails.screenInput(theme: request.theme)
        guard check.isAllowed else {
            throw StoryEngineError.blockedInput(check.reason ?? "Please try a gentler idea.")
        }

        let names = request.characters.map(\.name)
        let hero = names.first ?? "Ollie"
        let friend = names.dropFirst().first ?? hero

        var lines: [GeneratedStory.Line] = [
            .init(speaker: Story.narratorSpeaker,
                  text: "One sunny morning in the Whispering Woods, the friends set off on a little adventure about \(request.theme)."),
            .init(speaker: hero, text: "What a lovely day! Shall we explore together?"),
        ]
        if friend != hero {
            lines.append(.init(speaker: friend, text: "Yes please! Two friends are better than one."))
        }
        lines.append(.init(speaker: Story.narratorSpeaker,
                           text: "Along the way they shared, they helped one another, and they remembered to say thank you."))
        lines.append(.init(speaker: hero, text: "Working together made everything more fun."))
        lines.append(.init(speaker: Story.narratorSpeaker,
                           text: "And so, with happy hearts, they headed home as the stars came out. The end."))

        return GeneratedStory(
            title: "\(hero) and the \(request.theme.capitalized) Adventure",
            summary: "A gentle tale where \(names.joined(separator: ", ")) learn the joy of kindness.",
            lines: lines,
            moralLesson: "Being kind and helping our friends makes everyone happy."
        )
    }
}
