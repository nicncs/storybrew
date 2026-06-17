// Central kid-friendly look: soft warm colours, rounded shapes, big type.

export const colors = {
  background: '#FFF7E6',
  card: '#FFFFFF',
  primary: '#F58C4D', // friendly orange
  secondary: '#73BB9E', // calm green
  accent: '#8C80D9', // soft purple
  textDark: '#403832',
  textMuted: '#8A817A',
  like: '#67B873',
  dislike: '#E67373',
  white: '#FFFFFF',
};

export const radius = 24;

export const fonts = {
  // System rounded isn't directly available cross-platform; weight + size carry
  // the playful feel.
  heavy: '800' as const,
  bold: '700' as const,
  semibold: '600' as const,
  regular: '400' as const,
};
