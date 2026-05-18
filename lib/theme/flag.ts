type HexColor = `#${string}`;

// Fixed Swedish flag colors. These are brand/flag constants, not palette tokens.
export const swedishFlagColors = {
  blue: '#006aa7',
  gold: '#fecc00',
} as const satisfies Record<'blue' | 'gold', HexColor>;
