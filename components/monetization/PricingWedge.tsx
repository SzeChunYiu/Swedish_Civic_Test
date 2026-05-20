import { StyleSheet, Text, View } from 'react-native';

import { REMOVE_ADS_PRICE_LABEL } from '../../lib/monetization/purchases';
import { colors, radius, space, typography } from '../../lib/theme';

/**
 * Defaults: renders a compact Remove Ads value statement with the canonical
 * price label and a localized question/chapter proof point.
 */
export interface PricingWedgeProps {
  questionCount: number;
  chapterCount: number;
  language: 'sv' | 'en';
}

const copy = {
  sv: {
    proof: (q: number, c: number) => `Hela frågebanken: ${q} övningsfrågor i ${c} kapitel`,
    pitch: (price: string) =>
      `Alla frågor är gratis. Ta bort annonser för ${price} en gång - ingen prenumeration, och tidsatta övningsprov är alltid annonsfria.`,
  },
  en: {
    proof: (q: number, c: number) =>
      `Full question bank stays free: ${q} practice questions across ${c} chapters`,
    pitch: (price: string) =>
      `All questions stay free. Remove ads forever for ${price}, one time - no subscription, and exams stay ad-free.`,
  },
} as const;

export function PricingWedge({ questionCount, chapterCount, language }: PricingWedgeProps) {
  const t = copy[language];
  const proof = t.proof(questionCount, chapterCount);
  const pitch = t.pitch(REMOVE_ADS_PRICE_LABEL);

  return (
    <View
      accessibilityLabel={`${proof}. ${pitch}`}
      accessibilityRole="summary"
      style={styles.wrapper}
    >
      <Text style={styles.proof}>{proof}</Text>
      <Text style={styles.pitch}>{pitch}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.card,
    borderWidth: space.hairline,
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
