import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  AnimalType,
  Character,
  Story,
  StoryRequest,
} from '@/models/types';
import { voiceForIndex } from '@/models/voices';
import {
  loadStories,
  saveStories,
  selectPlaylist,
  selectEpisodesInSeriesOf,
  selectPreviousSummaries,
  nextEpisodeNumber,
} from '@/services/storyStore';
import { AppConfig } from '@/services/appConfig';
import { AudioService, AudioState } from '@/services/audioService';
import { uid } from '@/services/id';

export interface NextEpisodeSeed {
  seriesId: string;
  seriesTitle: string;
  episodeNumber: number;
  previousSummaries: string[];
  childAge: number;
  theme: string;
  characters: { name: string; animal: AnimalType }[];
}

interface AppContextValue {
  stories: Story[];
  playlist: Story[];
  hasStoryEngineKey: boolean;

  draft: Story | null;
  generating: boolean;
  generationError: string | null;

  audio: AudioService;
  audioState: AudioState;

  getStory: (id: string) => Story | undefined;
  episodesInSeriesOf: (story: Story) => Story[];

  generate: (request: StoryRequest, seriesId?: string) => Promise<Story | null>;
  clearDraft: () => void;
  approve: (story: Story) => void;
  remove: (id: string) => void;

  /** Promote a standalone story to episode 1 if needed and return the seed. */
  beginNextEpisode: (story: Story) => NextEpisodeSeed;

  /** Build characters (with distinct voices) from picker drafts. */
  buildCharacters: (drafts: { name: string; animal: AnimalType }[]) => Character[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Story | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const engineRef = useRef(AppConfig.makeStoryEngine());
  const audioRef = useRef<AudioService>(new AudioService());
  const audio = audioRef.current;

  const audioState = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);

  // Load persisted stories once.
  useEffect(() => {
    loadStories().then((s) => {
      setStories(s);
      setLoaded(true);
    });
  }, []);

  // Persist on change (after initial load).
  useEffect(() => {
    if (loaded) void saveStories(stories);
  }, [stories, loaded]);

  const getStory = useCallback(
    (id: string) => stories.find((s) => s.id === id),
    [stories]
  );

  const buildCharacters = useCallback(
    (drafts: { name: string; animal: AnimalType }[]): Character[] =>
      drafts.map((d, index) => ({
        id: uid(),
        name: d.name.trim(),
        animal: d.animal,
        voiceProfile: voiceForIndex(index),
      })),
    []
  );

  const generate = useCallback(
    async (request: StoryRequest, seriesId?: string): Promise<Story | null> => {
      setGenerating(true);
      setGenerationError(null);
      try {
        const g = await engineRef.current.generate(request);
        const story: Story = {
          id: uid(),
          title: g.title,
          summary: g.summary,
          lines: g.lines.map((l) => ({ id: uid(), speaker: l.speaker, text: l.text })),
          moralLesson: g.moralLesson,
          childAge: request.childAge,
          theme: request.theme,
          characters: request.characters,
          seriesId,
          seriesTitle: request.seriesTitle,
          episodeNumber: request.episodeNumber,
          approvalState: 'pending',
          audioReady: false,
          createdAt: Date.now(),
        };
        setDraft(story);
        return story;
      } catch (e) {
        setGenerationError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        return null;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const clearDraft = useCallback(() => {
    setDraft(null);
    setGenerationError(null);
  }, []);

  const approve = useCallback((story: Story) => {
    const approved: Story = { ...story, approvalState: 'approved', audioReady: true };
    setStories((prev) => {
      const exists = prev.some((s) => s.id === approved.id);
      return exists ? prev.map((s) => (s.id === approved.id ? approved : s)) : [...prev, approved];
    });
    setDraft(null);
  }, []);

  const remove = useCallback(
    (id: string) => {
      if (audio.isCurrent(id)) audio.stop();
      setStories((prev) => prev.filter((s) => s.id !== id));
    },
    [audio]
  );

  const beginNextEpisode = useCallback(
    (story: Story): NextEpisodeSeed => {
      const seriesId = story.seriesId ?? story.id;
      const seriesTitle = story.seriesTitle ?? story.title;

      // Promote a standalone story to episode 1 of a new series so the
      // original and the new episode group together.
      if (!story.seriesId) {
        setStories((prev) =>
          prev.map((s) =>
            s.id === story.id ? { ...s, seriesId, seriesTitle, episodeNumber: 1 } : s
          )
        );
      }

      // Compute against current stories (the promotion above is async via state,
      // so include the promoted original explicitly for an accurate count).
      const promoted = stories.map((s) =>
        s.id === story.id && !s.seriesId ? { ...s, seriesId, seriesTitle, episodeNumber: 1 } : s
      );

      return {
        seriesId,
        seriesTitle,
        episodeNumber: nextEpisodeNumber(promoted, seriesId),
        previousSummaries: selectPreviousSummaries(promoted, seriesId),
        childAge: story.childAge,
        theme: story.theme,
        characters: story.characters.map((c) => ({ name: c.name, animal: c.animal })),
      };
    },
    [stories]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      stories,
      playlist: selectPlaylist(stories),
      hasStoryEngineKey: AppConfig.hasStoryEngineKey,
      draft,
      generating,
      generationError,
      audio,
      audioState,
      getStory,
      episodesInSeriesOf: (story: Story) => selectEpisodesInSeriesOf(stories, story),
      generate,
      clearDraft,
      approve,
      remove,
      beginNextEpisode,
      buildCharacters,
    }),
    [
      stories,
      draft,
      generating,
      generationError,
      audio,
      audioState,
      getStory,
      generate,
      clearDraft,
      approve,
      remove,
      beginNextEpisode,
      buildCharacters,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
