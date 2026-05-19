import type { TextStyle } from 'react-native';

const fontFamily = 'NotionInter, Inter, -apple-system, system-ui, Segoe UI, Helvetica, Arial';

// Values authoritative in DESIGN.md §3 (restrained Claude scale):
// hero 30-38 / section 24-26 / card 19-21 / body 16 / caption 13-14,
// body line-height ~1.55. Stable KEYS (22 tokens) — same schema, the
// whole app re-scales here. Previous values were ~2x oversized vs spec.
export const typography = {
  fontFamily,
  displayHero: {
    fontFamily,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.8,
  } satisfies TextStyle,
  displaySecondary: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.6,
  } satisfies TextStyle,
  sectionHeading: {
    fontFamily,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  subHeadingLarge: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  } satisfies TextStyle,
  subHeading: {
    fontFamily,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  cardTitle: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 27,
    letterSpacing: -0.125,
  } satisfies TextStyle,

  heroMobile: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  metric: { fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 } satisfies TextStyle,
  sectionTitle: { fontFamily, fontSize: 18, fontWeight: '700', lineHeight: 25 } satisfies TextStyle,
  bodyTight: { fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 23 } satisfies TextStyle,
  finePrint: { fontFamily, fontSize: 13, fontWeight: '400', lineHeight: 20 } satisfies TextStyle,
  disclaimer: { fontFamily, fontSize: 12, fontWeight: '400', lineHeight: 18 } satisfies TextStyle,
  body: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 25 } satisfies TextStyle,
  bodyMedium: { fontFamily, fontSize: 16, fontWeight: '500', lineHeight: 25 } satisfies TextStyle,
  bodySemibold: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 25 } satisfies TextStyle,
  bodyBold: { fontFamily, fontSize: 16, fontWeight: '700', lineHeight: 25 } satisfies TextStyle,
  navButton: { fontFamily, fontSize: 15, fontWeight: '600', lineHeight: 20 } satisfies TextStyle,
  caption: { fontFamily, fontSize: 14, fontWeight: '500', lineHeight: 20 } satisfies TextStyle,
  captionLight: { fontFamily, fontSize: 14, fontWeight: '400', lineHeight: 20 } satisfies TextStyle,
  badge: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.125,
  } satisfies TextStyle,
  micro: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.125,
  } satisfies TextStyle,
} as const;
