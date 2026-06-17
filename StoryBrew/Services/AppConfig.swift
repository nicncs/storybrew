import Foundation

/// Resolves runtime configuration — currently just the story-engine API key.
///
/// Resolution order:
///   1. `ANTHROPIC_API_KEY` environment variable (handy for previews/tests/CI).
///   2. `Secrets.plist` bundled with the app (gitignored; see `Secrets.example.plist`).
///   3. `ANTHROPIC_API_KEY` in `Info.plist` (e.g. fed from an xcconfig build setting).
///
/// The key is never hard-coded in source.
enum AppConfig {
    static var anthropicAPIKey: String {
        if let env = ProcessInfo.processInfo.environment["ANTHROPIC_API_KEY"], !env.isEmpty {
            return env
        }
        if let url = Bundle.main.url(forResource: "Secrets", withExtension: "plist"),
           let dict = NSDictionary(contentsOf: url),
           let key = dict["ANTHROPIC_API_KEY"] as? String,
           !key.isEmpty {
            return key
        }
        if let key = Bundle.main.object(forInfoDictionaryKey: "ANTHROPIC_API_KEY") as? String,
           !key.isEmpty {
            return key
        }
        return ""
    }

    static var hasStoryEngineKey: Bool { !anthropicAPIKey.isEmpty }

    /// The engine the app uses. Falls back to the offline template engine when
    /// no key is configured so the app stays usable for demos.
    static func makeStoryEngine() -> StoryEngine {
        hasStoryEngineKey ? ClaudeStoryEngine(apiKey: anthropicAPIKey) : TemplateStoryEngine()
    }
}
