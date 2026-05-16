type HexColor = `#${string}`;
type RgbaColor = `rgba(${string})`;

export type ColorToken = HexColor | RgbaColor;

/** DESIGN.md lines 23-25: page canvas uses Pure White. */
const canvas = '#ffffff' satisfies ColorToken;
/** DESIGN.md lines 23-25 and 129-133: card surfaces use Pure White. */
const surface = '#ffffff' satisfies ColorToken;
/** DESIGN.md lines 32-36: Warm White section and card tint. */
const surfaceWarm = '#f6f5f4' satisfies ColorToken;
/** DESIGN.md lines 106-113: translucent warm gray secondary surface. */
const surfaceMuted = 'rgba(0, 0, 0, 0.05)' satisfies ColorToken;
/** DESIGN.md lines 23-26: near-black primary text at 95% opacity. */
const text = 'rgba(0, 0, 0, 0.95)' satisfies ColorToken;
/** DESIGN.md lines 137-144: form text softens near-black to 90% opacity. */
const textSoft = 'rgba(0, 0, 0, 0.9)' satisfies ColorToken;
/** DESIGN.md lines 64-83: secondary body labels sit below primary text. */
const textSecondary = 'rgba(0, 0, 0, 0.8)' satisfies ColorToken;
/** DESIGN.md lines 80-83: captions and microcopy use lower-emphasis text. */
const textDisclaimer = 'rgba(0, 0, 0, 0.65)' satisfies ColorToken;
/** DESIGN.md lines 32-36: Warm Gray 500 for muted labels. */
const textMuted = '#615d59' satisfies ColorToken;
/** DESIGN.md lines 32-36 and 137-144: Warm Gray 300 placeholder text. */
const textPlaceholder = '#a39e98' satisfies ColorToken;
/** DESIGN.md lines 32-36: Warm Dark for dark surfaces. */
const warmDark = '#31302e' satisfies ColorToken;
/** DESIGN.md lines 23-27 and 46-52: Notion Blue interactive accent. */
const accent = '#0075de' satisfies ColorToken;
/** DESIGN.md lines 28-31 and 95-104: active button blue. */
const accentActive = '#005bab' satisfies ColorToken;
/** DESIGN.md lines 46-52 and 208-218: focus ring blue. */
const focus = '#097fe8' satisfies ColorToken;
/** DESIGN.md lines 46-52: soft focus fill derived from badge blue tint. */
const focusSoft = '#d8ecff' satisfies ColorToken;
/** DESIGN.md lines 46-52 and 121-127: pill badge blue background. */
const badgeBlueBg = '#f2f9ff' satisfies ColorToken;
/** DESIGN.md lines 46-52 and 121-127: pill badge blue text. */
const badgeBlueText = '#097fe8' satisfies ColorToken;
/** DESIGN.md lines 53-57 and 129-133: whisper border. */
const border = 'rgba(0, 0, 0, 0.1)' satisfies ColorToken;
/** DESIGN.md lines 38-41: confirmation green. */
const success = '#1aae39' satisfies ColorToken;
/** DESIGN.md lines 38-41: soft completion background derived from confirmation green. */
const successSoft = '#eefaf1' satisfies ColorToken;
/** DESIGN.md lines 38-41: correct-answer background uses soft completion green. */
const correctBg = successSoft;
/** DESIGN.md lines 38-41: warning orange. */
const warning = '#dd5b00' satisfies ColorToken;
/** DESIGN.md lines 38-41: soft warning background derived from warning orange. */
const warningSoft = '#fff3ea' satisfies ColorToken;
/** DESIGN.md lines 38-41: incorrect-answer background uses soft warning orange. */
const incorrectBg = warningSoft;
/** DESIGN.md lines 38-44: teal success-state accent. */
const teal = '#2a9d99' satisfies ColorToken;
/** DESIGN.md lines 28-31: deep navy secondary brand color. */
const navy = '#213183' satisfies ColorToken;
/** DESIGN.md lines 38-44: purple premium-feature accent. */
const purple = '#391c57' satisfies ColorToken;
/** DESIGN.md lines 38-44: pink decorative accent. */
const pink = '#ff64c8' satisfies ColorToken;
/** DESIGN.md lines 38-44: brown earthy warm accent. */
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
