import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { RouteLink } from './RouteLink';

type SocialProofLanguage = 'sv' | 'en';

const copy = {
  sv: {
    accessibilityLabel: 'Öppna källor och transparens',
    body: 'Se UHR-källor och oberoende appstatus',
    label: 'Källor och transparens',
  },
  en: {
    accessibilityLabel: 'Open sources and transparency',
    body: 'Review UHR sources and independent-app status',
    label: 'Sources and transparency',
  },
} as const;

/**
 * Defaults: localized source-transparency link for the supplied app language,
 * with a 48px token target and pressed/focus feedback.
 */
export interface SocialProofRowProps {
  accessibilityLabel?: string;
  language: SocialProofLanguage;
}

export function SocialProofRow({ accessibilityLabel, language }: SocialProofRowProps) {
  const t = copy[language];
  const rowAccessibilityLabel = accessibilityLabel ?? t.accessibilityLabel;
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <RouteLink accessibilityLabel={rowAccessibilityLabel} href="/sources" style={styles.row}>
      <Text style={styles.label}>{t.label}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.body}>{t.body}</Text>
    </RouteLink>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    row: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[0.75],
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.75],
    },
    label: {
      color: themeColors.text,
      fontFamily: typography.bodySemibold.fontFamily,
      fontSize: typography.bodySemibold.fontSize,
      fontWeight: typography.bodySemibold.fontWeight,
    },
    dot: {
      color: themeColors.textMuted,
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
    },
    body: {
      color: themeColors.textMuted,
      fontFamily: typography.bodyTight.fontFamily,
      fontSize: typography.bodyTight.fontSize,
    },
  });
}
