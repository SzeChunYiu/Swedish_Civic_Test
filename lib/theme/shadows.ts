import type { ViewStyle } from 'react-native';

/** DESIGN.md soft depth: navy whisper shadows, never heavy black elevation. */
const whisperShadowColor = '#0b1f33';

export const shadows = {
  card: {
    boxShadow: '0px 6px 20px rgba(11, 31, 51, 0.06)',
    shadowColor: whisperShadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 1,
  } satisfies ViewStyle,
  deep: {
    boxShadow: '0px 8px 24px rgba(11, 31, 51, 0.08)',
    shadowColor: whisperShadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 2,
  } satisfies ViewStyle,
} as const;
