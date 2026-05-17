type HexColor = `#${string}`;
type RgbaColor = `rgba(${string})`;

export type ColorToken = HexColor | RgbaColor;

// Claude (Anthropic) warm-parchment system — values are authoritative in DESIGN.md §2.
// Token KEYS are stable; the whole app restyles via these values (zero hardcoded colors).
const canvas = '#f5f4ed' satisfies ColorToken;
const surface = '#faf9f5' satisfies ColorToken;
const surfaceWarm = '#e8e6dc' satisfies ColorToken;
const surfaceMuted = 'rgba(20, 20, 19, 0.05)' satisfies ColorToken;
const text = '#141413' satisfies ColorToken;
const textSoft = '#3d3d3a' satisfies ColorToken;
const textSecondary = '#5e5d59' satisfies ColorToken;
const textDisclaimer = '#87867f' satisfies ColorToken;
const textMuted = '#5e5d59' satisfies ColorToken;
const textPlaceholder = '#b0aea5' satisfies ColorToken;
const warmDark = '#30302e' satisfies ColorToken;
const accent = '#c96442' satisfies ColorToken;
const accentActive = '#b5502f' satisfies ColorToken;
const focus = '#3898ec' satisfies ColorToken;
const focusSoft = '#f3e7e1' satisfies ColorToken;
const badgeBlueBg = '#f0eee6' satisfies ColorToken;
const badgeBlueText = '#c96442' satisfies ColorToken;
const border = '#e8e6dc' satisfies ColorToken;
const success = '#4f7a52' satisfies ColorToken;
const successSoft = '#eef2ea' satisfies ColorToken;
const correctBg = successSoft;
const warning = '#c8742f' satisfies ColorToken;
const warningSoft = '#f6ece0' satisfies ColorToken;
const incorrectBg = warningSoft;
const teal = '#4f7a72' satisfies ColorToken;
const navy = '#30302e' satisfies ColorToken;
const purple = '#6b4f63' satisfies ColorToken;
const pink = '#c08293' satisfies ColorToken;
const brown = '#523410' satisfies ColorToken;

export const colors = {
  canvas,
  surface,
  surfaceWarm,
  surfaceMuted,
  text,
  textSoft,
  textSecondary,
  textDisclaimer,
  textMuted,
  textPlaceholder,
  warmDark,
  accent,
  accentActive,
  focus,
  focusSoft,
  badgeBlueBg,
  badgeBlueText,
  border,
  success,
  successSoft,
  correctBg,
  warning,
  warningSoft,
  incorrectBg,
  teal,
  navy,
  purple,
  pink,
  brown,
} as const satisfies Record<string, ColorToken>;
