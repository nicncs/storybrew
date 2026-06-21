import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Story, StoryLine, VoiceProfile, NARRATOR_SPEAKER } from '@/models/types';
import { NARRATOR_VOICE } from '@/models/voices';
import { setNowPlaying, setPlaybackState, clearNowPlaying } from './mediaSession';

export interface AudioState {
  currentStoryId: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentLineIndex: number | null;
}

/**
 * Reads a story aloud using on-device text-to-speech (expo-speech), giving each
 * character a distinct voice via their VoiceProfile (voice + pitch + rate).
 *
 * Plays lines sequentially: each line speaks in its speaker's voice, and the
 * next line starts when the previous one finishes. Pause is implemented by
 * stopping and remembering the position, then re-speaking from there on resume
 * — this behaves identically on iOS, Android and the web (where native
 * pause/resume support varies).
 *
 * Audio is synthesised on demand each play, so there are no files to store.
 */
export class AudioService {
  private state: AudioState = {
    currentStoryId: null,
    isPlaying: false,
    isPaused: false,
    currentLineIndex: null,
  };

  private listeners = new Set<(s: AudioState) => void>();
  private lines: StoryLine[] = [];
  private voiceByProfileId: Record<string, string | undefined> = {};
  private generation = 0;
  private englishVoiceIds: string[] = [];
  private voicesLoaded = false;
  private audioSessionReady = false;

  // ---- Subscription (for React) ----

  subscribe = (listener: (s: AudioState) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): AudioState => this.state;

  private setState(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  // ---- Controls ----

  isCurrent(storyId: string): boolean {
    return this.state.currentStoryId === storyId;
  }

  async play(story: Story): Promise<void> {
    this.stop();
    await this.configureAudioSession();
    await this.ensureVoicesLoaded();

    this.lines = story.lines;
    this.voiceByProfileId = this.resolveVoices(story);
    if (this.lines.length === 0) return;

    this.generation += 1;
    this.setState({
      currentStoryId: story.id,
      isPlaying: true,
      isPaused: false,
      currentLineIndex: 0,
    });
    // Surface the story to OS / car / Bluetooth media controls (web).
    setNowPlaying(
      { title: story.title, artist: story.seriesTitle ?? 'StoryBrew' },
      {
        onPlay: () => this.resume(story),
        onPause: () => this.pause(),
        onStop: () => this.stop(),
      }
    );
    setPlaybackState('playing');
    this.speakFrom(0, story);
  }

  pause(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;
    this.setState({ isPaused: true });
    this.generation += 1; // invalidate the in-flight line's onDone
    Speech.stop();
    setPlaybackState('paused');
  }

  resume(story: Story): void {
    if (!this.state.isPlaying || !this.state.isPaused) return;
    this.setState({ isPaused: false });
    setPlaybackState('playing');
    this.speakFrom(this.state.currentLineIndex ?? 0, story);
  }

  togglePlayPause(story: Story): void {
    if (this.isCurrent(story.id) && this.state.isPlaying) {
      this.state.isPaused ? this.resume(story) : this.pause();
    } else {
      void this.play(story);
    }
  }

  stop(): void {
    this.generation += 1;
    Speech.stop();
    this.lines = [];
    this.setState({
      currentStoryId: null,
      isPlaying: false,
      isPaused: false,
      currentLineIndex: null,
    });
    clearNowPlaying();
  }

  /**
   * Configure the OS audio session for media playback (once). This is what lets
   * the story route to a connected Bluetooth device, car speaker, or CarPlay,
   * play even when the ringer is on silent, and keep playing with the screen
   * locked / app backgrounded (iOS background audio mode is set in app.json).
   * No-op on web, where output routing is handled by the browser/OS.
   */
  private async configureAudioSession(): Promise<void> {
    if (this.audioSessionReady || Platform.OS === 'web') {
      this.audioSessionReady = true;
      return;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    } catch {
      // If the session can't be configured we still attempt playback; it just
      // won't get background/route benefits.
    }
    this.audioSessionReady = true;
  }

  // ---- Internals ----

  private speakFrom(index: number, story: Story): void {
    if (index >= this.lines.length) {
      this.stop();
      return;
    }
    const myGeneration = this.generation;
    const line = this.lines[index];
    const profile = this.profileFor(story, line.speaker);
    this.setState({ currentLineIndex: index });

    Speech.speak(line.text, {
      voice: this.voiceByProfileId[profile.id],
      pitch: profile.pitch,
      rate: profile.rate,
      language: 'en-US',
      onDone: () => {
        // Ignore stale callbacks from a stopped/paused/restarted session.
        if (myGeneration !== this.generation || this.state.isPaused) return;
        this.speakFrom(index + 1, story);
      },
    });
  }

  private profileFor(story: Story, speaker: string): VoiceProfile {
    const match = story.characters.find(
      (c) => c.name.toLowerCase() === speaker.toLowerCase()
    );
    return match ? match.voiceProfile : NARRATOR_VOICE;
  }

  /** Assign a distinct installed voice to each profile used in the story. */
  private resolveVoices(story: Story): Record<string, string | undefined> {
    const profiles: VoiceProfile[] = [
      ...story.characters.map((c) => c.voiceProfile),
      NARRATOR_VOICE,
    ];
    const result: Record<string, string | undefined> = {};
    profiles.forEach((profile, i) => {
      result[profile.id] =
        this.englishVoiceIds.length > 0
          ? this.englishVoiceIds[i % this.englishVoiceIds.length]
          : undefined;
    });
    return result;
  }

  private async ensureVoicesLoaded(): Promise<void> {
    if (this.voicesLoaded) return;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      this.englishVoiceIds = voices
        .filter((v) => v.language?.toLowerCase().startsWith('en'))
        .map((v) => v.identifier);
    } catch {
      this.englishVoiceIds = [];
    }
    this.voicesLoaded = true;
  }
}
