import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '../../lib/theme';

type SocialProofLanguage = 'sv' | 'en';

const copy = {
  sv: {
    rating: 'Utmärkt',
    ratingAccessibilityLabel: 'Utmärkt betyg, 5 av 5 stjärnor',
    body: 'Tusentals studenter förbereder sig redan med appen',
    summaryAccessibilityLabel:
      'Utmärkt betyg, 5 av 5 stjärnor. Tusentals studenter förbereder sig redan med appen',
  },
  en: {
    rating: 'Excellent',
    ratingAccessibilityLabel: 'Excellent rating, 5 of 5 stars',
    body: 'Thousands of learners are already preparing with the app',
    summaryAccessibilityLabel:
      'Excellent rating, 5 of 5 stars. Thousands of learners are already preparing with the app',
  },
} as const;

/**
 * Defaults: localized social-proof body and rating speech for the supplied app
 * language, with a summary accessibility label for the full row.
 */
export interface SocialProofRowProps {
  accessibilityLabel?: string;
  language: SocialProofLanguage;
}

export function SocialProofRow({ accessibilityLabel, language }: SocialProofRowProps) {
  const t = copy[language];
  const rowAccessibilityLabel = accessibilityLabel ?? t.summaryAccessibilityLabel;

  return (
    <View
      aria-label={rowAccessibilityLabel}
      accessible
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityRole="summary"
      style={styles.row}
    >
      <Text style={styles.stars} accessibilityLabel={t.ratingAccessibilityLabel}>
        ★★★★★
      </Text>
      <Text style={styles.rating}>{t.rating}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.body}>{t.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[0.75],
  },
  stars: {
    color: colors.warning,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
  },
  rating: {
    color: colors.text,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  dot: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
  },
});
