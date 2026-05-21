type SpacePx =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 10
  | 11
  | 12
  | 14
  | 16
  | 18
  | 24
  | 32
  | 40
  | 48
  | 56
  | 64
  | 72
  | 80
  | 96
  | 120;

type SpaceScale = Record<string, SpacePx>;

/** DESIGN.md lines 182-185: 8px base spacing with organic micro-adjustment steps. */
export const space = {
  /** DESIGN.md lines 184-185: semantic 1px border hairline. */
  hairline: 1,
  /** DESIGN.md lines 184-185: extra-fine divider/layout spacing. */
  divider: 2,
  /** DESIGN.md lines 184-185: organic micro-adjustment spacing. */
  micro: 3,
  0: 0,
  0.5: 4,
  0.625: 5,
  0.75: 6,
  0.875: 7,
  1: 8,
  1.25: 10,
  1.375: 11,
  1.5: 12,
  1.75: 14,
  2: 16,
  2.25: 18,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  9: 72,
  10: 80,
  12: 96,
  15: 120,
} as const satisfies SpaceScale;

export type SpaceToken = keyof typeof space;
export type SpaceValue = (typeof space)[SpaceToken];
