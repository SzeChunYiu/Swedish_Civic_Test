import type { TextStyle } from 'react-native';

const fontFamily = 'NotionInter, Inter, -apple-system, system-ui, Segoe UI, Helvetica, Arial';

export const typography = {
  fontFamily,
  displayHero: {
    fontFamily,
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 64,
    letterSpacing: -2.125,
  } satisfies TextStyle,
  displaySecondary: {
    fontFamily,
    fontSize: 54,
    fontWeight: '700',
    lineHeight: 56,
    letterSpacing: -1.875,
  } satisfies TextStyle,
  sectionHeading: {
    fontFamily,
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 48,
    letterSpacing: -1.5,
  } satisfies TextStyle,
  subHeadingLarge: {
    fontFamily,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 60,
  } satisfies TextStyle,
  subHeading: {
    fontFamily,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.625,
  } satisfies TextStyle,
  cardTitle: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.25,
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.125,
  } satisfies TextStyle,

  heroMobile: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.625,
  } satisfies TextStyle,
  metric: { fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 32 } satisfies TextStyle,
  sectionTitle: { fontFamily, fontSize: 18, fontWeight: '700', lineHeight: 24 } satisfies TextStyle,
  bodyTight: { fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 22 } satisfies TextStyle,
  finePrint: { fontFamily, fontSize: 13, fontWeight: '400', lineHeight: 20 } satisfies TextStyle,
  disclaimer: { fontFamily, fontSize: 12, fontWeight: '400', lineHeight: 18 } satisfies TextStyle,
  body: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 24 } satisfies TextStyle,
  bodyMedium: { fontFamily, fontSize: 16, fontWeight: '500', lineHeight: 24 } satisfies TextStyle,
  bodySemibold: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 24 } satisfies TextStyle,
  bodyBold: { fontFamily, fontSize: 16, fontWeight: '700', lineHeight: 24 } satisfies TextStyle,
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
