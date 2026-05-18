import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '../../lib/theme';

const copy = {
  sv: {
    rating: 'Utmärkt',
    body: 'Tusentals studenter förbereder sig redan med appen',
  },
  en: {
    rating: 'Excellent',
    body: 'Thousands of learners are already preparing with the app',
  },
} as const;

export function SocialProofRow({ language }: { language: 'sv' | 'en' }) {
  const t = copy[language];
  return (
    <View accessibilityRole="summary" style={styles.row}>
      <Text style={styles.stars} accessibilityLabel={`${t.rating} rating, 5 of 5 stars`}>
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
