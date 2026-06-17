import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/models/types';

/**
 * On-device persistence + pure helpers for the story collection.
 *
 * AsyncStorage works across iOS, Android and web (web uses localStorage), so
 * everything stays on-device with no accounts or cloud sync.
 */

const STORAGE_KEY = 'storybrew.stories.v1';

export async function loadStories(): Promise<Story[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Story[]) : [];
  } catch {
    return [];
  }
}

export async function saveStories(stories: Story[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch {
    // Best-effort; ignore write failures.
  }
}

// ---- Pure selectors (no side effects) ----

/** The playlist: approved stories, newest first. */
export function selectPlaylist(stories: Story[]): Story[] {
  return stories
    .filter((s) => s.approvalState === 'approved')
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Approved + pending episodes that belong to the same series, in order. */
export function selectEpisodesInSeriesOf(stories: Story[], story: Story): Story[] {
  if (!story.seriesId) return [story];
  return stories
    .filter((s) => s.seriesId === story.seriesId)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

/** Summaries of approved earlier episodes, to keep a new episode consistent. */
export function selectPreviousSummaries(stories: Story[], seriesId: string): string[] {
  return stories
    .filter((s) => s.seriesId === seriesId && s.approvalState === 'approved')
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
    .map((s) => s.summary);
}

export function nextEpisodeNumber(stories: Story[], seriesId: string): number {
  const highest = stories
    .filter((s) => s.seriesId === seriesId)
    .reduce((max, s) => Math.max(max, s.episodeNumber), 0);
  return highest + 1;
}
