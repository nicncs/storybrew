import { GeneratedStory, StoryRequest } from '@/models/types';

/**
 * A pluggable story generator. The app ships `ClaudeStoryEngine`, but this
 * interface lets you swap in a backend proxy or an offline engine without
 * touching the UI or persistence layers.
 */
export interface StoryEngine {
  generate(request: StoryRequest): Promise<GeneratedStory>;
}

/** User-friendly errors surfaced from any engine. */
export class StoryEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoryEngineError';
  }
}

export const FriendlyErrors = {
  blockedOutput:
    "We couldn't make a story that felt right for little ones. Please try a different idea.",
  empty: 'The storyteller went quiet. Please try again.',
};
