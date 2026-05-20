/** DESIGN.md lines 41-44: compact input/control corners. */
const input = 4;

/** DESIGN.md lines 41-44: subtle small control corners, never sharper than needed. */
const micro = 4;

/** DESIGN.md lines 41-44: compact support surface radius. */
const subtle = 5;

/** DESIGN.md lines 41-44 and 52-56: minimum card/control radius is 8px. */
const small = 8;

/** DESIGN.md lines 41-44: buttons use 10-12px corners. */
const button = 12;

/** DESIGN.md lines 41-44: cards use 12-16px corners. */
const card = 12;

/** DESIGN.md lines 41-44: large cards and panels use the upper card radius. */
const large = 16;

/** DESIGN.md lines 41-44: pills use fully rounded corners. */
const pill = 9999;

export const radius = {
  input,
  micro,
  subtle,
  small,
  button,
  card,
  large,
  pill,
  circle: pill,
} as const;
