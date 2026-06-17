import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppProvider';
import { Story } from '@/models/types';
import { ANIMALS } from '@/models/animals';
import { BigButton } from '@/components/BigButton';
import { colors, radius, fonts } from '@/theme/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playlist, audio, audioState } = useApp();

  return (
    <View style={styles.container}>
      {playlist.length > 0 ? (
        <FlatList
          data={playlist}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StoryRow
              story={item}
              playing={audioState.currentStoryId === item.id && audioState.isPlaying}
              onPress={() => router.push(`/player/${item.id}`)}
            />
          )}
        />
      ) : (
        <EmptyState />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <BigButton label="✨ Make a Story" onPress={() => router.push('/create')} />
      </View>
    </View>
  );
}

function StoryRow({
  story,
  playing,
  onPress,
}: {
  story: Story;
  playing: boolean;
  onPress: () => void;
}) {
  const emoji = story.characters[0] ? ANIMALS[story.characters[0].animal].emoji : '📖';
  const subtitle =
    story.seriesTitle && story.episodeNumber > 0
      ? `${story.seriesTitle} • Ep ${story.episodeNumber}`
      : 'Tap to listen';
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={styles.avatar}>
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Text style={{ fontSize: 26 }}>{playing ? '🔊' : '▶️'}</Text>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 64 }}>📚✨</Text>
      <Text style={styles.emptyTitle}>No stories yet!</Text>
      <Text style={styles.emptyBody}>Tap “Make a Story” to brew your first magical tale.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent + '2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 18, fontWeight: fonts.bold, color: colors.textDark },
  rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 26, fontWeight: fonts.bold, color: colors.textDark },
  emptyBody: { fontSize: 17, color: colors.textMuted, textAlign: 'center' },
  footer: { padding: 16, paddingTop: 8 },
});
