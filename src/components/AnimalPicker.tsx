import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AnimalType } from '@/models/types';
import { ALL_ANIMALS, ANIMALS } from '@/models/animals';
import { colors, fonts } from '@/theme/theme';

interface Props {
  enabled: boolean;
  onPick: (animal: AnimalType) => void;
}

/** Grid of big emoji animal buttons. Tapping one adds it as a character. */
export function AnimalPicker({ enabled, onPick }: Props) {
  return (
    <View style={styles.grid}>
      {ALL_ANIMALS.map((animal) => (
        <Pressable
          key={animal}
          onPress={() => onPick(animal)}
          disabled={!enabled}
          style={[styles.cell, !enabled && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${ANIMALS[animal].displayName}`}
        >
          <Text style={styles.emoji}>{ANIMALS[animal].emoji}</Text>
          <Text style={styles.name}>{ANIMALS[animal].displayName}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  cell: {
    width: 78,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  disabled: { opacity: 0.4 },
  emoji: { fontSize: 34 },
  name: { fontSize: 12, fontWeight: fonts.semibold, color: colors.textDark, marginTop: 2 },
});
