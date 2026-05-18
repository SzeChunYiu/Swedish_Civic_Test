import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';

type PricingWedgeProps = {
  questionCount: number;
  chapterCount: number;
  language: 'sv' | 'en';
};

const copy = {
  sv: {
    proof: (q: number, c: number) => `${q} övningsfrågor i ${c} kapitel`,
    pitch:
      'Andra appar tar 499 kr i förskott. Vi är gratis med annonser — eller 29 kr för att ta bort dem permanent.',
  },
  en: {
    proof: (q: number, c: number) => `${q} practice questions across ${c} chapters`,
    pitch:
      'Other apps charge 499 kr upfront. We are free with ads — or 29 kr to remove them permanently.',
  },
} as const;

export function PricingWedge({ questionCount, chapterCount, language }: PricingWedgeProps) {
  const t = copy[language];
  return (
    <View accessibilityRole="summary" style={styles.wrapper}>
      <Text style={styles.proof}>{t.proof(questionCount, chapterCount)}</Text>
      <Text style={styles.pitch}>{t.pitch}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.5],
    padding: space[2],
  },
  proof: {
    color: colors.success,
    fontFamily: typography.badge.fontFamily,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  pitch: {
    color: colors.text,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
});
