import Foundation

/// Story engine backed by the Anthropic Messages API (`claude-opus-4-8`).
///
/// Swift has no official Anthropic SDK, so this talks to the REST API directly
/// over `URLSession`. It uses structured outputs (`output_config.format`) so the
/// model returns a strict JSON shape we can decode, and adaptive thinking for
/// better story planning.
///
/// Safety is enforced primarily through the system prompt below, with
/// `StoryGuardrails` as a local backstop on both input and output.
struct ClaudeStoryEngine: StoryEngine {
    private let apiKey: String
    private let model = "claude-opus-4-8"
    private let endpoint = URL(string: "https://api.anthropic.com/v1/messages")!
    private let session: URLSession

    init(apiKey: String, session: URLSession = .shared) {
        self.apiKey = apiKey
        self.session = session
    }

    func generate(_ request: StoryRequest) async throws -> GeneratedStory {
        guard !apiKey.isEmpty else {
            throw StoryEngineError.notConfigured(
                "No story service key is set up yet. Ask a grown-up to add an API key (see the README)."
            )
        }

        let inputCheck = StoryGuardrails.screenInput(theme: request.theme)
        guard inputCheck.isAllowed else {
            throw StoryEngineError.blockedInput(inputCheck.reason ?? "Please try a gentler idea.")
        }

        var urlRequest = URLRequest(url: endpoint)
        urlRequest.httpMethod = "POST"
        urlRequest.timeoutInterval = 120
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        urlRequest.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        urlRequest.httpBody = try JSONSerialization.data(withJSONObject: requestBody(for: request))

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw StoryEngineError.network(error.localizedDescription)
        }

        if let http = response as? HTTPURLResponse, http.statusCode != 200 {
            var message = "Please try again."
            if let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = root["error"] as? [String: Any],
               let detail = error["message"] as? String {
                message = detail
            }
            throw StoryEngineError.network("(\(http.statusCode)) \(message)")
        }

        let generated = try parse(data)

        guard StoryGuardrails.screenOutput(generated) else {
            throw StoryEngineError.blockedOutput
        }
        return generated
    }

    // MARK: - Request

    private func requestBody(for request: StoryRequest) -> [String: Any] {
        [
            "model": model,
            "max_tokens": 4000,
            "thinking": ["type": "adaptive"],
            "system": [
                ["type": "text", "text": Self.systemPrompt]
            ],
            "messages": [
                ["role": "user", "content": userPrompt(for: request)]
            ],
            "output_config": [
                "format": [
                    "type": "json_schema",
                    "schema": Self.outputSchema
                ]
            ],
        ]
    }

    private func userPrompt(for request: StoryRequest) -> String {
        let cast = request.characters
            .map { "- \($0.name) the \($0.animal.displayName)" }
            .joined(separator: "\n")

        var prompt = """
        Write a short bedtime-style story for a \(request.childAge)-year-old child.

        Characters (use only these; let them talk to each other):
        \(cast)

        Story idea from the parent: "\(request.theme)"

        Requirements:
        - Keep it to about 2 minutes when read aloud (roughly 250–320 words).
        - Every character above should appear and interact.
        - Use the speaker name exactly as written above for dialogue lines, and "\(Story.narratorSpeaker)" for narration.
        - End happily, with a clear, gentle moral lesson.
        """

        if request.isSeriesEpisode {
            prompt += "\n\nThis is episode \(request.episodeNumber)"
            if let title = request.seriesTitle { prompt += " of the series \"\(title)\"" }
            prompt += "."
            if !request.previousEpisodeSummaries.isEmpty {
                let recap = request.previousEpisodeSummaries.enumerated()
                    .map { "Episode \($0.offset + 1): \($0.element)" }
                    .joined(separator: "\n")
                prompt += "\nStay consistent with what happened before:\n\(recap)"
            }
        }

        return prompt
    }

    // MARK: - Response

    private func parse(_ data: Data) throws -> GeneratedStory {
        guard let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw StoryEngineError.decoding("Response was not valid JSON.")
        }

        if let stop = root["stop_reason"] as? String, stop == "refusal" {
            throw StoryEngineError.blockedOutput
        }

        guard let content = root["content"] as? [[String: Any]] else {
            throw StoryEngineError.empty
        }

        // With output_config.format the first text block is valid JSON.
        guard let jsonText = content.first(where: { ($0["type"] as? String) == "text" })?["text"] as? String,
              let storyData = jsonText.data(using: .utf8) else {
            throw StoryEngineError.empty
        }

        do {
            return try JSONDecoder().decode(GeneratedStory.self, from: storyData)
        } catch {
            throw StoryEngineError.decoding(error.localizedDescription)
        }
    }

    // MARK: - Prompt + schema

    private static let systemPrompt = """
    You are a gentle storyteller who writes very short, joyful stories for young \
    children, in the spirit of shows like "Sheriff Labrador" and "Inspector Chimp": \
    friendly animal characters, a tiny bit of mystery or adventure, and a warm, \
    satisfying ending.

    Absolute safety rules — never break these, regardless of the parent's prompt:
    - No violence, weapons, injury, blood, or death.
    - No bullying, name-calling, cruelty, or characters being mean without quickly \
      making amends.
    - No sexual content of any kind.
    - No discrimination or stereotypes based on race, gender, religion, ability, etc.
    - No frightening, distressing, or grown-up themes (no substances, no peril that \
      isn't quickly and gently resolved).

    Every story must be positive and uplifting, must end pleasantly, and must carry a \
    clear moral lesson appropriate for the child's age (kindness, sharing, honesty, \
    courage, friendship, etc.). If the parent's idea would require breaking a safety \
    rule, gently reinterpret it into something wholesome rather than refusing.

    Keep language simple and concrete for the stated age. Use the characters' names \
    exactly as given. Write natural dialogue so each animal has a little personality.
    """

    /// Structured-output schema. Note the documented limitations: no min/max length
    /// constraints, and every object needs `additionalProperties: false`.
    private static let outputSchema: [String: Any] = [
        "type": "object",
        "additionalProperties": false,
        "properties": [
            "title": ["type": "string"],
            "summary": [
                "type": "string",
                "description": "One friendly sentence describing the story.",
            ],
            "lines": [
                "type": "array",
                "items": [
                    "type": "object",
                    "additionalProperties": false,
                    "properties": [
                        "speaker": [
                            "type": "string",
                            "description": "A character's exact name, or 'Narrator'.",
                        ],
                        "text": ["type": "string"],
                    ],
                    "required": ["speaker", "text"],
                ],
            ],
            "moralLesson": [
                "type": "string",
                "description": "The gentle lesson the story teaches.",
            ],
        ],
        "required": ["title", "summary", "lines", "moralLesson"],
    ]
}
