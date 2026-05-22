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
const danger = '#b42318' satisfies ColorToken;
const dangerSoft = '#fde8e5' satisfies ColorToken;
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
  danger,
  dangerSoft,
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

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';
export type ThemeColorName = keyof typeof colors;
export type ThemeColors = Record<ThemeColorName, ColorToken>;

export const lightColors = colors;

export const darkColors = {
  canvas: '#08111f',
  surface: '#101b2b',
  surfaceWarm: '#17263a',
  surfaceMuted: 'rgba(245, 247, 250, 0.1)',
  text: '#f5f7fa',
  textSoft: '#e4ebf5',
  textSecondary: '#c6d3e1',
  textDisclaimer: '#b4c2d1',
  textMuted: '#b4c2d1',
  textPlaceholder: '#b4c2d1',
  warmDark: '#f5f7fa',
  accent: '#73c7ff',
  accentActive: '#9ad7ff',
  focus: '#93c5fd',
  focusSoft: '#1b3558',
  badgeBlueBg: '#3d3210',
  badgeBlueText: '#ffdf7e',
  border: '#31455d',
  success: '#72d998',
  successSoft: '#0f3320',
  correctBg: '#0f3320',
  warning: '#ffd083',
  warningSoft: '#3b2a10',
  incorrectBg: '#3b2a10',
  danger: '#ffb4ab',
  dangerSoft: '#4a1512',
  teal: '#77d6e2',
  navy: '#80c7f2',
  purple: '#b9a8ff',
  pink: '#f2a6c3',
  brown: '#d4a76a',
  brandGoogleBlue: '#8ec5ff',
  brandGoogleGreen: '#88d996',
  brandGoogleRed: '#ff9c87',
  brandGoogleYellow: '#ffdc69',
  brandFacebook: '#8ab9ff',
  brandWhite: '#ffffff',
  swedishBlue: '#73c7ff',
  swedishGold: '#ffdf7e',
} as const satisfies Record<ThemeColorName, ColorToken>;

export function resolveThemePreference(
  preference: ThemePreference,
  systemColorScheme: ResolvedColorScheme | null | undefined,
): ResolvedColorScheme {
  if (preference === 'dark' || preference === 'light') return preference;
  return systemColorScheme === 'dark' ? 'dark' : 'light';
}

export function colorsForThemeMode(
  preference: ThemePreference,
  systemColorScheme: ResolvedColorScheme | null | undefined,
): ThemeColors {
  return resolveThemePreference(preference, systemColorScheme) === 'dark' ? darkColors : colors;
}
