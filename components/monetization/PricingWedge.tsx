import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { REMOVE_ADS_PRICE_LABEL } from '../../lib/monetization/purchases';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

/**
 * Defaults: renders a compact Remove Ads value statement with the canonical
 * price label and a localized question/chapter proof point.
 */
export interface PricingWedgeProps {
  questionCount: number;
  chapterCount: number;
  language: 'sv' | 'en';
  priceLabel?: string;
}

const copy = {
  sv: {
    proof: (q: number, c: number) => `${q} övningsfrågor i ${c} kapitel`,
    pitch: (price: string) =>
      `Ta bort annonser för ${price} en gång. Ingen prenumeration, och tidsatta övningsprov är alltid annonsfria.`,
  },
  en: {
    proof: (q: number, c: number) => `${q} practice questions across ${c} chapters`,
    pitch: (price: string) =>
      `Remove ads forever for ${price}, one time. No subscription, and exams stay ad-free.`,
  },
} as const;

export function PricingWedge({
  questionCount,
  chapterCount,
  language,
  priceLabel = REMOVE_ADS_PRICE_LABEL,
}: PricingWedgeProps) {
  const t = copy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const proof = t.proof(questionCount, chapterCount);
  const pitch = t.pitch(priceLabel);

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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: themeColors.successSoft,
      borderColor: themeColors.success,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[0.5],
      padding: space[2],
    },
    proof: {
      color: themeColors.success,
      fontFamily: typography.badge.fontFamily,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      textTransform: 'uppercase',
    },
    pitch: {
      color: themeColors.text,
      fontFamily: typography.bodyTight.fontFamily,
      fontSize: typography.bodyTight.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
  });
}
