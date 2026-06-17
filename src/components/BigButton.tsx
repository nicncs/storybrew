import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, fonts } from '@/theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  fill?: string;
  textColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

/** A large, tappable, rounded button — the main interaction style for the app. */
export function BigButton({ label, onPress, fill = colors.primary, textColor = colors.white, disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? fill + '66' : fill },
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  label: { fontSize: 21, fontWeight: fonts.bold },
});
