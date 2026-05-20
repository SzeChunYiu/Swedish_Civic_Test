import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '../../lib/theme';

type SocialProofLanguage = 'sv' | 'en';

const copy = {
  sv: {
    body: 'Öva med frågor som visar källor och tydliga gränser för appens roll.',
    linkAccessibilityLabel: 'Öppna källor och transparens',
    linkLabel: 'Källor och transparens',
    summaryAccessibilityLabel:
      'Öva med frågor som visar källor och tydliga gränser för appens roll. Källor och transparens.',
  },
  en: {
    body: 'Practice with questions that show sources and clear limits for the app role.',
    linkAccessibilityLabel: 'Open sources and transparency',
    linkLabel: 'Sources and transparency',
    summaryAccessibilityLabel:
      'Practice with questions that show sources and clear limits for the app role. Sources and transparency.',
  },
} as const;

/**
 * Defaults: localized source-trust body and source-page link for the supplied
 * app language, with an optional row label override for assistive tech.
 */
export interface SocialProofRowProps {
  accessibilityLabel?: string;
  language: SocialProofLanguage;
}

export function SocialProofRow({ accessibilityLabel, language }: SocialProofRowProps) {
  const t = copy[language];
  const rowAccessibilityLabel = accessibilityLabel ?? t.summaryAccessibilityLabel;

  return (
    <View aria-label={rowAccessibilityLabel} style={styles.row}>
      <Text style={styles.body}>{t.body}</Text>
      <Link
        accessibilityLabel={t.linkAccessibilityLabel}
        accessibilityRole="link"
        href="/sources"
        style={styles.link}
      >
        {t.linkLabel}
      </Link>
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
  body: {
    color: colors.textMuted,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
  },
  link: {
    color: colors.accent,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
    minHeight: space[6],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
