import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme/theme';

interface Props {
  speaker: string;
  text: string;
  isNarration: boolean;
  isActive?: boolean;
}

/** One line of story text, styled differently for narration vs. dialogue. */
export function StoryLineRow({ speaker, text, isNarration, isActive = false }: Props) {
  return (
    <View style={[styles.row, isActive && styles.active]}>
      {!isNarration && <Text style={styles.speaker}>{speaker.toUpperCase()}</Text>}
      <Text
        style={[
          styles.text,
          isNarration ? styles.narration : styles.dialogue,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 10, borderRadius: 12 },
  active: { backgroundColor: colors.primary + '2E' },
  speaker: { fontSize: 12, fontWeight: fonts.bold, color: colors.accent, marginBottom: 2 },
  text: { color: colors.textDark },
  narration: { fontSize: 16, fontStyle: 'italic', fontWeight: fonts.regular },
  dialogue: { fontSize: 17, fontWeight: fonts.semibold },
});
