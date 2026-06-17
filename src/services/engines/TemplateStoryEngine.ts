import { GeneratedStory, StoryRequest, NARRATOR_SPEAKER } from '@/models/types';
import { screenInput } from '@/services/guardrails';
import { StoryEngine, StoryEngineError } from './StoryEngine';

/**
 * A tiny offline engine used as a graceful fallback when no API key is
 * configured (and handy for demos/tests). It stitches a safe, generic little
 * story from the chosen characters so the app stays usable without a network
 * call. Quality is intentionally basic.
 */
export class TemplateStoryEngine implements StoryEngine {
  async generate(request: StoryRequest): Promise<GeneratedStory> {
    const check = screenInput(request.theme);
    if (!check.allowed) {
      throw new StoryEngineError(check.reason ?? 'Please try a gentler idea.');
    }

    const names = request.characters.map((c) => c.name);
    const hero = names[0] ?? 'Ollie';
    const friend = names[1] ?? hero;

    const lines = [
      {
        speaker: NARRATOR_SPEAKER,
        text: `One sunny morning in the Whispering Woods, the friends set off on a little adventure about ${request.theme}.`,
      },
      { speaker: hero, text: 'What a lovely day! Shall we explore together?' },
    ];
    if (friend !== hero) {
      lines.push({ speaker: friend, text: 'Yes please! Two friends are better than one.' });
    }
    lines.push({
      speaker: NARRATOR_SPEAKER,
      text: 'Along the way they shared, they helped one another, and they remembered to say thank you.',
    });
    lines.push({ speaker: hero, text: 'Working together made everything more fun.' });
    lines.push({
      speaker: NARRATOR_SPEAKER,
      text: 'And so, with happy hearts, they headed home as the stars came out. The end.',
    });

    const capitalisedTheme =
      request.theme.charAt(0).toUpperCase() + request.theme.slice(1);

    return {
      title: `${hero} and the ${capitalisedTheme} Adventure`,
      summary: `A gentle tale where ${names.join(', ')} learn the joy of kindness.`,
      lines,
      moralLesson: 'Being kind and helping our friends makes everyone happy.',
    };
  }
}
