import Foundation

/// Defence-in-depth content safety for a children's story app.
///
/// The primary guardrail is the engine's own system prompt (see
/// `ClaudeStoryEngine`), which instructs the model to write only positive,
/// age-appropriate stories. This type is a lightweight local backstop that
/// (a) rejects clearly unsafe *input themes* before we ever call an engine and
/// (b) sanity-checks *generated output* for disallowed content.
///
/// It is intentionally conservative and simple — it is not a substitute for the
/// model's safety behaviour, just a second line of defence.
enum StoryGuardrails {
    /// Word/phrase fragments we never want in a toddler/child story, grouped by
    /// the categories called out in the product requirements: extreme violence,
    /// bullying, sexual content, and discrimination.
    private static let blockedFragments: [String] = [
        // Extreme violence / weapons / gore
        "kill", "murder", "blood", "gun", "knife", "stab", "shoot", "weapon",
        "die ", "dead", "death", "corpse", "torture", "war ", "bomb", "gore",
        // Bullying / cruelty
        "bully", "stupid", "idiot", "loser", "ugly", "hate you", "shut up",
        "worthless", "nobody likes",
        // Sexual content
        "sex", "naked", "nude", "kiss on the lips", "porn",
        // Discrimination / slurs (category markers; explicit slurs intentionally omitted)
        "racist", "racism", "sexist",
        // Substances / self-harm
        "drug", "alcohol", "beer", "cigarette", "suicide", "self-harm",
    ]

    struct Check {
        let isAllowed: Bool
        let reason: String?
    }

    /// Screen a parent-supplied theme prompt before generation.
    static func screenInput(theme: String) -> Check {
        let normalised = theme.lowercased()
        if let hit = blockedFragments.first(where: { normalised.contains($0) }) {
            _ = hit
            return Check(
                isAllowed: false,
                reason: "Let's keep the story gentle and happy. Please rephrase the idea without scary, mean, or grown-up themes."
            )
        }
        if theme.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return Check(isAllowed: false, reason: "Please tell us what the story should be about.")
        }
        return Check(isAllowed: true, reason: nil)
    }

    /// Screen generated story text before it is shown to the parent.
    static func screenOutput(_ story: GeneratedStory) -> Bool {
        let haystack = (story.title + " " + story.summary + " " + story.moralLesson + " "
            + story.lines.map(\.text).joined(separator: " ")).lowercased()
        return !blockedFragments.contains(where: { haystack.contains($0) })
    }
}
