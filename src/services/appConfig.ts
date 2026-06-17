import { StoryEngine } from './engines/StoryEngine';
import { ClaudeStoryEngine } from './engines/ClaudeStoryEngine';
import { TemplateStoryEngine } from './engines/TemplateStoryEngine';

/**
 * Runtime configuration. The Anthropic key is read from an Expo public env var
 * (`EXPO_PUBLIC_ANTHROPIC_API_KEY`), which Expo inlines into the client bundle
 * on all platforms. The key is never hard-coded in source.
 *
 * Note: a client-side key is visible to the client. That's acceptable for a
 * prototype; for production, point `ClaudeStoryEngine` at your own backend
 * proxy instead (a drop-in swap behind the StoryEngine interface).
 */
export const AppConfig = {
  get anthropicApiKey(): string {
    return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  },

  get hasStoryEngineKey(): boolean {
    return this.anthropicApiKey.length > 0;
  },

  /**
   * The engine the app uses. Falls back to the offline template engine when no
   * key is configured so the app stays usable for demos.
   */
  makeStoryEngine(): StoryEngine {
    return this.hasStoryEngineKey
      ? new ClaudeStoryEngine(this.anthropicApiKey)
      : new TemplateStoryEngine();
  },
};
