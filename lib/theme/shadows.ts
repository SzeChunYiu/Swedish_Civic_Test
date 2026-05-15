import type { ViewStyle } from 'react-native';

/** Subtle multi-layer shadows from DESIGN.md, adapted for React Native. */
export const shadows = {
  card: {
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 1,
  } satisfies ViewStyle,
  deep: {
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 23 },
    shadowOpacity: 1,
    shadowRadius: 52,
    elevation: 3,
  } satisfies ViewStyle,
} as const;
