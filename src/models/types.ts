// Core domain types shared across the app (one codebase: iOS, Android, web).

export type AnimalType =
  | 'lion'
  | 'rabbit'
  | 'bear'
  | 'owl'
  | 'fox'
  | 'elephant'
  | 'mouse'
  | 'puppy'
  | 'kitten'
  | 'frog'
  | 'penguin'
  | 'turtle';

/**
 * A distinct, reproducible voice character for the text-to-speech engine.
 * We don't hard-code platform voice identifiers (they differ across iOS,
 * Android and the browser); a profile describes *how* a voice should sound
 * (gender lean + pitch + rate) and the AudioService resolves it to a concrete
 * installed voice at playback time.
 */
export interface VoiceProfile {
  id: string;
  displayName: string;
  genderLean: 'feminine' | 'masculine' | 'neutral';
  /** 0.5 (deep) ... 2.0 (high). 1.0 is natural. */
  pitch: number;
  /** Speaking rate; ~1.0 is normal for expo-speech. */
  rate: number;
}

export interface Character {
  id: string;
  name: string;
  animal: AnimalType;
  voiceProfile: VoiceProfile;
}

export interface StoryLine {
  id: string;
  /** A character's name, or `NARRATOR_SPEAKER` for narration. */
  speaker: string;
  text: string;
}

export type ApprovalState = 'pending' | 'approved' | 'rejected';

export interface Story {
  id: string;
  title: string;
  summary: string;
  lines: StoryLine[];
  moralLesson: string;

  // Inputs that produced the story (kept for "next episode" continuity).
  childAge: number;
  theme: string;
  characters: Character[];

  // Series support.
  seriesId?: string;
  seriesTitle?: string;
  episodeNumber: number;

  // Review + playback state.
  approvalState: ApprovalState;
  /** True once approved and eligible for playback / the playlist. */
  audioReady: boolean;
  createdAt: number; // epoch ms
}

/** Everything an engine needs to write one episode. */
export interface StoryRequest {
  childAge: number;
  characters: Character[];
  theme: string;
  seriesTitle?: string;
  episodeNumber: number;
  previousEpisodeSummaries: string[];
}

/** Raw content an engine returns, before it becomes a persisted Story. */
export interface GeneratedStory {
  title: string;
  summary: string;
  lines: { speaker: string; text: string }[];
  moralLesson: string;
}

export const NARRATOR_SPEAKER = 'Narrator';
