import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppProvider';
import { NARRATOR_SPEAKER } from '@/models/types';
import { ANIMALS } from '@/models/animals';
import { StoryLineRow } from '@/components/StoryLineRow';
import { BigButton } from '@/components/BigButton';
import { colors, radius, fonts } from '@/theme/theme';

/**
 * Plays an approved story aloud with per-character voices, highlights the line
 * being read, and offers replay, deletion, and "make the next episode".
 */
export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getStory, audio, audioState, episodesInSeriesOf, remove } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const story = id ? getStory(id) : undefined;

  // Stop playback when leaving this screen.
  useEffect(() => {
    return () => {
      if (story && audio.isCurrent(story.id)) audio.stop();
    };
  }, [story?.id]);

  useEffect(() => {
    if (!story) router.replace('/');
  }, [story]);

  if (!story) return null;

  const episodes = episodesInSeriesOf(story).filter((s) => s.approvalState === 'approved');
  const isCurrent = audioState.currentStoryId === story.id;
  const isThisPlaying = isCurrent && audioState.isPlaying && !audioState.isPaused;
  const playLabel = isThisPlaying
    ? '⏸️ Pause'
    : isCurrent && audioState.isPaused
      ? '▶️ Resume'
      : '▶️ Play Story';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{story.title}</Text>
        {story.seriesTitle && story.episodeNumber > 0 && (
          <Text style={styles.seriesBadge}>
            {story.seriesTitle} • Episode {story.episodeNumber}
          </Text>
        )}

        <View style={styles.castRow}>
          {story.characters.map((c) => (
            <View key={c.id} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26 }}>{ANIMALS[c.animal].emoji}</Text>
              <Text style={styles.castName}>{c.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.storyCard}>
          {story.lines.map((line, index) => (
            <StoryLineRow
              key={line.id}
              speaker={line.speaker}
              text={line.text}
              isNarration={line.speaker === NARRATOR_SPEAKER}
              isActive={isCurrent && audioState.currentLineIndex === index}
            />
          ))}
        </View>

        <View style={styles.moralCard}>
          <Text style={{ fontSize: 26 }}>🌟</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.moralLabel}>The lesson</Text>
            <Text style={styles.moralText}>{story.moralLesson}</Text>
          </View>
        </View>

        {episodes.length > 1 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>More in this series</Text>
            {episodes.map((ep) => (
              <Pressable
                key={ep.id}
                onPress={() => router.push(`/player/${ep.id}`)}
                style={styles.episodeRow}
              >
                <Text style={styles.episodeNum}>Ep {ep.episodeNumber}</Text>
                <Text style={styles.episodeTitle} numberOfLines={1}>
                  {ep.title}
                </Text>
                {ep.id === story.id && <Text>✅</Text>}
              </Pressable>
            ))}
          </View>
        )}

        <BigButton
          label="➕ Make the Next Episode"
          fill={colors.accent}
          onPress={() => router.push(`/create?continueId=${story.id}`)}
          style={{ marginTop: 16 }}
        />

        {confirmDelete ? (
          <View style={styles.confirmRow}>
            <BigButton
              label="Keep"
              fill={colors.secondary}
              onPress={() => setConfirmDelete(false)}
              style={{ flex: 1 }}
            />
            <BigButton
              label="Delete"
              fill={colors.dislike}
              onPress={() => {
                remove(story.id);
                router.back();
              }}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteLink}>
            <Text style={styles.deleteText}>🗑️ Delete this story</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.playBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.controlsRow}>
          <BigButton
            label={playLabel}
            onPress={() => audio.togglePlayPause(story)}
            style={{ flex: 1 }}
          />
          {isCurrent && (
            <BigButton label="⏹️" fill={colors.dislike} onPress={() => audio.stop()} style={{ width: 72 }} />
          )}
        </View>
        <Text style={styles.routeHint}>🔊 Plays on your speaker, Bluetooth, or CarPlay</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: fonts.heavy, color: colors.textDark },
  seriesBadge: { fontSize: 14, fontWeight: fonts.bold, color: colors.accent, marginTop: 4 },
  castRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  castName: { fontSize: 11, fontWeight: fonts.semibold, color: colors.textMuted, marginTop: 2 },
  storyCard: { backgroundColor: colors.card, borderRadius: radius, padding: 12, marginTop: 14, gap: 4 },
  moralCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.secondary + '24',
    borderRadius: radius,
    padding: 16,
    marginTop: 14,
  },
  moralLabel: { fontSize: 13, fontWeight: fonts.bold, color: colors.secondary },
  moralText: { fontSize: 15, fontWeight: fonts.semibold, color: colors.textDark, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: fonts.bold, color: colors.textDark, marginBottom: 8 },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  episodeNum: { fontSize: 14, fontWeight: fonts.bold, color: colors.accent },
  episodeTitle: { flex: 1, fontSize: 15, color: colors.textDark },
  confirmRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  deleteLink: { alignItems: 'center', marginTop: 18, padding: 8 },
  deleteText: { color: colors.dislike, fontSize: 15, fontWeight: fonts.semibold },
  playBar: {
    padding: 16,
    paddingTop: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  controlsRow: { flexDirection: 'row', gap: 12 },
  routeHint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
});
