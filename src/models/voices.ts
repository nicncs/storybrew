import { VoiceProfile } from './types';

/**
 * A palette of six clearly distinguishable voices. Characters are assigned from
 * this palette in order so every character in a story sounds different. Values
 * are tuned to read well across expo-speech on iOS, Android and the browser.
 */
export const VOICE_PALETTE: VoiceProfile[] = [
  { id: 'bright', displayName: 'Bright', genderLean: 'feminine', pitch: 1.35, rate: 0.98 },
  { id: 'warm', displayName: 'Warm', genderLean: 'masculine', pitch: 0.85, rate: 0.95 },
  { id: 'bubbly', displayName: 'Bubbly', genderLean: 'feminine', pitch: 1.55, rate: 1.0 },
  { id: 'gentle', displayName: 'Gentle', genderLean: 'neutral', pitch: 1.05, rate: 0.95 },
  { id: 'booming', displayName: 'Booming', genderLean: 'masculine', pitch: 0.7, rate: 0.92 },
  { id: 'chirpy', displayName: 'Chirpy', genderLean: 'feminine', pitch: 1.7, rate: 1.0 },
];

/** The calm voice used for narration / the storyteller. */
export const NARRATOR_VOICE: VoiceProfile = {
  id: 'narrator',
  displayName: 'Storyteller',
  genderLean: 'neutral',
  pitch: 1.0,
  rate: 0.95,
};

export function voiceForIndex(index: number): VoiceProfile {
  return VOICE_PALETTE[index % VOICE_PALETTE.length];
}
