type HexColor = `#${string}`;
type RgbaColor = `rgba(${string})`;

export type ColorToken = HexColor | RgbaColor;

// Swedish system — clean Scandinavian: flag blue primary, gold accent.
// Values authoritative in DESIGN.md §2. Stable KEYS; whole app restyles here.
const canvas = '#f5f7fa' satisfies ColorToken;
const surface = '#ffffff' satisfies ColorToken;
const surfaceWarm = '#eaf0f7' satisfies ColorToken;
const surfaceMuted = 'rgba(11, 31, 51, 0.05)' satisfies ColorToken;
const text = '#0b1f33' satisfies ColorToken;
const textSoft = '#22384c' satisfies ColorToken;
const textSecondary = '#44586b' satisfies ColorToken;
const textDisclaimer = '#5a6b7a' satisfies ColorToken;
const textMuted = '#5a6b7a' satisfies ColorToken;
const textPlaceholder = '#5a6b7a' satisfies ColorToken;
const warmDark = '#0b1f33' satisfies ColorToken;
const accent = '#006aa7' satisfies ColorToken;
const accentActive = '#00537f' satisfies ColorToken;
const focus = '#2f80ed' satisfies ColorToken;
const focusSoft = '#dbeafe' satisfies ColorToken;
const badgeBlueBg = '#fff3cf' satisfies ColorToken;
const badgeBlueText = '#8a6a00' satisfies ColorToken;
const border = '#dbe3ec' satisfies ColorToken;
const success = '#18703f' satisfies ColorToken;
const successSoft = '#e6f4ec' satisfies ColorToken;
const correctBg = successSoft;
const warning = '#9a5c00' satisfies ColorToken;
const warningSoft = '#fdf0dd' satisfies ColorToken;
const incorrectBg = warningSoft;
const teal = '#0e7c8a' satisfies ColorToken;
const navy = '#003a5c' satisfies ColorToken;
const purple = '#4b3f7a' satisfies ColorToken;
const pink = '#b5527a' satisfies ColorToken;
const brown = '#6b4a1f' satisfies ColorToken;
const brandGoogleBlue = '#1976d2' satisfies ColorToken;
const brandGoogleGreen = '#4caf50' satisfies ColorToken;
const brandGoogleRed = '#ff3d00' satisfies ColorToken;
const brandGoogleYellow = '#ffc107' satisfies ColorToken;
const brandFacebook = '#1877f2' satisfies ColorToken;
const brandWhite = '#ffffff' satisfies ColorToken;
const swedishBlue = '#006aa7' satisfies ColorToken;
const swedishGold = '#fecc00' satisfies ColorToken;

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
  brandGoogleBlue,
  brandGoogleGreen,
  brandGoogleRed,
  brandGoogleYellow,
  brandFacebook,
  brandWhite,
  swedishBlue,
  swedishGold,
} as const satisfies Record<string, ColorToken>;
