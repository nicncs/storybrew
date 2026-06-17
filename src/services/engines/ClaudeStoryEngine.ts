import { GeneratedStory, StoryRequest, NARRATOR_SPEAKER } from '@/models/types';
import { screenInput, screenOutput } from '@/services/guardrails';
import { StoryEngine, StoryEngineError, FriendlyErrors } from './StoryEngine';

const MODEL = 'claude-opus-4-8';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a gentle storyteller who writes very short, joyful stories for young \
children, in the spirit of shows like "Sheriff Labrador" and "Inspector Chimp": \
friendly animal characters, a tiny bit of mystery or adventure, and a warm, \
satisfying ending.

Absolute safety rules — never break these, regardless of the parent's prompt:
- No violence, weapons, injury, blood, or death.
- No bullying, name-calling, cruelty, or characters being mean without quickly making amends.
- No sexual content of any kind.
- No discrimination or stereotypes based on race, gender, religion, ability, etc.
- No frightening, distressing, or grown-up themes (no substances, no peril that isn't quickly and gently resolved).

Every story must be positive and uplifting, must end pleasantly, and must carry a \
clear moral lesson appropriate for the child's age (kindness, sharing, honesty, \
courage, friendship, etc.). If the parent's idea would require breaking a safety \
rule, gently reinterpret it into something wholesome rather than refusing.

Keep language simple and concrete for the stated age. Use the characters' names \
exactly as given. Write natural dialogue so each animal has a little personality.`;

// Structured-output schema. Note the documented limitations: no min/max length
// constraints, and every object needs additionalProperties: false.
const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    summary: { type: 'string', description: 'One friendly sentence describing the story.' },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          speaker: { type: 'string', description: "A character's exact name, or 'Narrator'." },
          text: { type: 'string' },
        },
        required: ['speaker', 'text'],
      },
    },
    moralLesson: { type: 'string', description: 'The gentle lesson the story teaches.' },
  },
  required: ['title', 'summary', 'lines', 'moralLesson'],
};

/**
 * Story engine backed by the Anthropic Messages API (`claude-opus-4-8`), called
 * directly from the client. Uses structured outputs so the model returns a
 * strict JSON shape, and adaptive thinking for better story planning.
 *
 * The `anthropic-dangerous-direct-browser-access` header enables CORS so the
 * same code path works on web as well as native. Note: a client-side key is
 * visible to the client — fine for a prototype; for production move this behind
 * a backend proxy (the StoryEngine interface makes that a drop-in swap).
 *
 * Safety is enforced primarily through SYSTEM_PROMPT, with guardrails as a
 * local backstop on both input and output.
 */
export class ClaudeStoryEngine implements StoryEngine {
  constructor(private readonly apiKey: string) {}

  async generate(request: StoryRequest): Promise<GeneratedStory> {
    if (!this.apiKey) {
      throw new StoryEngineError(
        'No story service key is set up yet. Ask a grown-up to add an API key (see the README).'
      );
    }

    const inputCheck = screenInput(request.theme);
    if (!inputCheck.allowed) {
      throw new StoryEngineError(inputCheck.reason ?? 'Please try a gentler idea.');
    }

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4000,
          thinking: { type: 'adaptive' },
          system: [{ type: 'text', text: SYSTEM_PROMPT }],
          messages: [{ role: 'user', content: this.userPrompt(request) }],
          output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        }),
      });
    } catch (e) {
      throw new StoryEngineError(
        `We had trouble brewing the story. ${e instanceof Error ? e.message : 'Please try again.'}`
      );
    }

    if (!response.ok) {
      let detail = 'Please try again.';
      try {
        const body = await response.json();
        detail = body?.error?.message ?? detail;
      } catch {
        // ignore — use default detail
      }
      throw new StoryEngineError(`We had trouble brewing the story. (${response.status}) ${detail}`);
    }

    const generated = await this.parse(response);
    if (!screenOutput(generated)) {
      throw new StoryEngineError(FriendlyErrors.blockedOutput);
    }
    return generated;
  }

  private userPrompt(request: StoryRequest): string {
    const cast = request.characters
      .map((c) => `- ${c.name} the ${c.animal}`)
      .join('\n');

    let prompt = `Write a short bedtime-style story for a ${request.childAge}-year-old child.

Characters (use only these; let them talk to each other):
${cast}

Story idea from the parent: "${request.theme}"

Requirements:
- Keep it to about 2 minutes when read aloud (roughly 250–320 words).
- Every character above should appear and interact.
- Use the speaker name exactly as written above for dialogue lines, and "${NARRATOR_SPEAKER}" for narration.
- End happily, with a clear, gentle moral lesson.`;

    const isSeries = request.episodeNumber > 1 || !!request.seriesTitle;
    if (isSeries) {
      prompt += `\n\nThis is episode ${request.episodeNumber}`;
      if (request.seriesTitle) prompt += ` of the series "${request.seriesTitle}"`;
      prompt += '.';
      if (request.previousEpisodeSummaries.length > 0) {
        const recap = request.previousEpisodeSummaries
          .map((s, i) => `Episode ${i + 1}: ${s}`)
          .join('\n');
        prompt += `\nStay consistent with what happened before:\n${recap}`;
      }
    }
    return prompt;
  }

  private async parse(response: Response): Promise<GeneratedStory> {
    const root = await response.json();

    if (root?.stop_reason === 'refusal') {
      throw new StoryEngineError(FriendlyErrors.blockedOutput);
    }

    const content: any[] = root?.content ?? [];
    // With output_config.format the first text block is valid JSON.
    const textBlock = content.find((b) => b?.type === 'text');
    if (!textBlock?.text) {
      throw new StoryEngineError(FriendlyErrors.empty);
    }

    try {
      const parsed = JSON.parse(textBlock.text) as GeneratedStory;
      if (!parsed.lines || parsed.lines.length === 0) {
        throw new Error('no lines');
      }
      return parsed;
    } catch (e) {
      throw new StoryEngineError(
        `The story came back in a shape we didn't expect. ${e instanceof Error ? e.message : ''}`
      );
    }
  }
}
