import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/state/AppProvider';
import { AnimalType, StoryRequest } from '@/models/types';
import { ANIMALS } from '@/models/animals';
import { AnimalPicker } from '@/components/AnimalPicker';
import { BigButton } from '@/components/BigButton';
import { uid } from '@/services/id';
import { colors, radius, fonts } from '@/theme/theme';

const MIN_AGE = 1;
const MAX_AGE = 10;
const MAX_CHARACTERS = 5;

interface Draft {
  id: string;
  name: string;
  animal: AnimalType;
}

export default function CreateScreen() {
  const router = useRouter();
  const { continueId } = useLocalSearchParams<{ continueId?: string }>();
  const { generate, generating, generationError, getStory, beginNextEpisode, buildCharacters } =
    useApp();

  const [childAge, setChildAge] = useState(4);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [theme, setTheme] = useState('');
  const [seriesId, setSeriesId] = useState<string | undefined>(undefined);
  const [seriesTitle, setSeriesTitle] = useState<string | undefined>(undefined);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [previousSummaries, setPreviousSummaries] = useState<string[]>([]);

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !continueId) return;
    const source = getStory(continueId);
    if (!source) return;
    seeded.current = true;
    const seed = beginNextEpisode(source);
    setChildAge(seed.childAge);
    setTheme(seed.theme);
    setDrafts(seed.characters.map((c) => ({ id: uid(), name: c.name, animal: c.animal })));
    setSeriesId(seed.seriesId);
    setSeriesTitle(seed.seriesTitle);
    setEpisodeNumber(seed.episodeNumber);
    setPreviousSummaries(seed.previousSummaries);
  }, [continueId, getStory, beginNextEpisode]);

  const isContinuing = !!seriesId;
  const canAdd = drafts.length < MAX_CHARACTERS;
  const canGenerate =
    drafts.length > 0 &&
    drafts.every((d) => d.name.trim().length > 0) &&
    theme.trim().length > 0 &&
    !generating;

  function addAnimal(animal: AnimalType) {
    if (!canAdd) return;
    setDrafts((prev) => [...prev, { id: uid(), name: ANIMALS[animal].suggestedName, animal }]);
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  function renameDraft(id: string, name: string) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  async function brew() {
    const characters = buildCharacters(drafts.map((d) => ({ name: d.name, animal: d.animal })));
    const request: StoryRequest = {
      childAge,
      characters,
      theme: theme.trim(),
      seriesTitle,
      episodeNumber,
      previousEpisodeSummaries: previousSummaries,
    };
    const story = await generate(request, seriesId);
    if (story) router.push('/review');
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        {isContinuing && (
          <Text style={styles.seriesBadge}>
            {seriesTitle} • Episode {episodeNumber}
          </Text>
        )}

        <Section title="How old is your child?">
          <View style={styles.stepper}>
            <StepButton label="–" onPress={() => setChildAge((a) => Math.max(MIN_AGE, a - 1))} />
            <Text style={styles.ageText}>
              {childAge} year{childAge === 1 ? '' : 's'} old
            </Text>
            <StepButton label="+" onPress={() => setChildAge((a) => Math.min(MAX_AGE, a + 1))} />
          </View>
        </Section>

        <Section title="Who is in the story?">
          <Text style={styles.help}>Pick up to {MAX_CHARACTERS} animal friends. Tap a name to rename.</Text>
          {drafts.map((d) => (
            <View key={d.id} style={styles.draftRow}>
              <Text style={{ fontSize: 28 }}>{ANIMALS[d.animal].emoji}</Text>
              <TextInput
                value={d.name}
                onChangeText={(t) => renameDraft(d.id, t)}
                placeholder="Name"
                style={styles.nameInput}
              />
              <Pressable onPress={() => removeDraft(d.id)} accessibilityLabel="Remove">
                <Text style={{ fontSize: 22 }}>🗑️</Text>
              </Pressable>
            </View>
          ))}
          {canAdd ? (
            <View style={styles.pickerCard}>
              <AnimalPicker enabled={canAdd} onPick={addAnimal} />
            </View>
          ) : (
            <Text style={styles.full}>That&apos;s a full cast! 🎉</Text>
          )}
        </Section>

        <Section title="What should it be about?">
          <TextInput
            value={theme}
            onChangeText={setTheme}
            placeholder="e.g. solving the mystery of the missing cookies"
            multiline
            style={styles.themeInput}
          />
        </Section>

        {generationError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{generationError}</Text>
          </View>
        )}

        <BigButton
          label={isContinuing ? '🪄 Brew Next Episode' : '🪄 Brew the Story'}
          onPress={brew}
          disabled={!canGenerate}
          style={{ marginTop: 8 }}
        />
      </ScrollView>

      {generating && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.overlayText}>Brewing your story… ✨</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stepBtn} accessibilityRole="button">
      <Text style={styles.stepBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  seriesBadge: { fontSize: 14, fontWeight: fonts.bold, color: colors.accent, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: fonts.bold, color: colors.textDark, marginBottom: 10 },
  help: { fontSize: 14, color: colors.textMuted, marginBottom: 10 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
  },
  ageText: { fontSize: 20, fontWeight: fonts.bold, color: colors.textDark },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 26, fontWeight: fonts.bold, color: colors.white },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 12,
    marginBottom: 10,
  },
  nameInput: { flex: 1, fontSize: 18, fontWeight: fonts.semibold, color: colors.textDark },
  pickerCard: { backgroundColor: colors.card, borderRadius: radius, padding: 12 },
  full: { fontSize: 15, fontWeight: fonts.semibold, color: colors.secondary },
  themeInput: {
    minHeight: 70,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    fontSize: 17,
    color: colors.textDark,
    textAlignVertical: 'top',
  },
  errorBanner: { backgroundColor: colors.dislike + '22', borderRadius: 16, padding: 12, marginBottom: 12 },
  errorText: { color: colors.dislike, fontSize: 15, fontWeight: fonts.semibold },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: { backgroundColor: colors.accent, borderRadius: radius, padding: 30, alignItems: 'center', gap: 14 },
  overlayText: { color: colors.white, fontSize: 18, fontWeight: fonts.bold },
});
