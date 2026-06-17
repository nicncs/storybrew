import { GeneratedStory } from '@/models/types';

/**
 * Defence-in-depth content safety for a children's story app.
 *
 * The primary guardrail is the engine's own system prompt (see
 * ClaudeStoryEngine), which instructs the model to write only positive,
 * age-appropriate stories. This module is a lightweight local backstop that
 * (a) rejects clearly unsafe input themes before we call an engine and
 * (b) sanity-checks generated output for disallowed content.
 *
 * It is intentionally conservative and simple — not a substitute for the
 * model's safety behaviour, just a second line of defence.
 */

const BLOCKED_FRAGMENTS: string[] = [
  // Extreme violence / weapons / gore
  'kill', 'murder', 'blood', 'gun', 'knife', 'stab', 'shoot', 'weapon',
  'dead', 'death', 'corpse', 'torture', 'war ', 'bomb', 'gore',
  // Bullying / cruelty
  'bully', 'stupid', 'idiot', 'loser', 'ugly', 'hate you', 'shut up',
  'worthless', 'nobody likes',
  // Sexual content
  'sex', 'naked', 'nude', 'porn',
  // Discrimination / slurs (category markers)
  'racist', 'racism', 'sexist',
  // Substances / self-harm
  'drug', 'alcohol', 'beer', 'cigarette', 'suicide', 'self-harm',
];

export interface GuardrailCheck {
  allowed: boolean;
  reason?: string;
}

export function screenInput(theme: string): GuardrailCheck {
  const normalised = theme.toLowerCase();
  if (!theme.trim()) {
    return { allowed: false, reason: 'Please tell us what the story should be about.' };
  }
  if (BLOCKED_FRAGMENTS.some((f) => normalised.includes(f))) {
    return {
      allowed: false,
      reason:
        "Let's keep the story gentle and happy. Please rephrase the idea without scary, mean, or grown-up themes.",
    };
  }
  return { allowed: true };
}

export function screenOutput(story: GeneratedStory): boolean {
  const haystack = [
    story.title,
    story.summary,
    story.moralLesson,
    ...story.lines.map((l) => l.text),
  ]
    .join(' ')
    .toLowerCase();
  return !BLOCKED_FRAGMENTS.some((f) => haystack.includes(f));
}
