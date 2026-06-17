import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppProvider';
import { NARRATOR_SPEAKER } from '@/models/types';
import { ANIMALS } from '@/models/animals';
import { StoryLineRow } from '@/components/StoryLineRow';
import { BigButton } from '@/components/BigButton';
import { colors, radius, fonts } from '@/theme/theme';

/**
 * Shows the freshly-generated story for the parent to read and vote on.
 * Thumbs up approves it (and makes it playable / adds it to the playlist);
 * thumbs down discards it so they can try again. No audio is produced until a
 * story is approved.
 */
export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, approve, clearDraft } = useApp();

  useEffect(() => {
    if (!draft) router.replace('/');
  }, [draft]);

  if (!draft) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.summary}>{draft.summary}</Text>
        <View style={styles.castRow}>
          {draft.characters.map((c) => (
            <Text key={c.id} style={{ fontSize: 24 }}>
              {ANIMALS[c.animal].emoji}
            </Text>
          ))}
        </View>

        <View style={styles.storyCard}>
          {draft.lines.map((line) => (
            <StoryLineRow
              key={line.id}
              speaker={line.speaker}
              text={line.text}
              isNarration={line.speaker === NARRATOR_SPEAKER}
            />
          ))}
        </View>

        <View style={styles.moralCard}>
          <Text style={{ fontSize: 28 }}>🌟</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.moralLabel}>The lesson</Text>
            <Text style={styles.moralText}>{draft.moralLesson}</Text>
          </View>
        </View>

        <Text style={styles.prompt}>Do you like this story?</Text>
      </ScrollView>

      <View style={[styles.voteBar, { paddingBottom: insets.bottom + 12 }]}>
        <BigButton
          label="👎 Try Again"
          fill={colors.dislike}
          onPress={() => {
            clearDraft();
            router.back();
          }}
          style={{ flex: 1 }}
        />
        <BigButton
          label="👍 I Like It"
          fill={colors.like}
          onPress={() => {
            approve(draft);
            router.replace('/');
          }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: fonts.heavy, color: colors.textDark },
  summary: { fontSize: 16, color: colors.textMuted, marginTop: 6 },
  castRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  storyCard: { backgroundColor: colors.card, borderRadius: radius, padding: 12, marginTop: 14, gap: 4 },
  moralCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.secondary + '24',
    borderRadius: radius,
    padding: 16,
    marginTop: 14,
  },
  moralLabel: { fontSize: 14, fontWeight: fonts.bold, color: colors.secondary },
  moralText: { fontSize: 16, fontWeight: fonts.semibold, color: colors.textDark, marginTop: 2 },
  prompt: { fontSize: 18, fontWeight: fonts.bold, color: colors.textDark, textAlign: 'center', marginTop: 18 },
  voteBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
});
