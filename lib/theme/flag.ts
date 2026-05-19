import type { ColorToken } from './colors';

// Fixed Swedish flag colors are intentionally separate from the mutable app palette.
export const SWEDISH_FLAG_BLUE = '#006aa7' satisfies ColorToken;
export const SWEDISH_FLAG_GOLD = '#fecc00' satisfies ColorToken;

export const flagColors = {
  blue: SWEDISH_FLAG_BLUE,
  gold: SWEDISH_FLAG_GOLD,
} as const satisfies Record<'blue' | 'gold', ColorToken>;
