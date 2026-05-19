import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, motion, radius, space, typography } from '../../lib/theme';

type SocialProofLanguage = 'sv' | 'en';

const copy = {
  sv: {
    label: 'Källor synliga',
    body: 'Varje fråga visar kapitel, avsnitt och sida från studiematerialet',
    summaryAccessibilityLabel:
      'Källor synliga. Varje fråga visar kapitel, avsnitt och sida från studiematerialet',
  },
  en: {
    label: 'Visible sources',
    body: 'Every question shows chapter, section, and page details from the study material',
    summaryAccessibilityLabel:
      'Visible sources. Every question shows chapter, section, and page details from the study material',
  },
} as const;

/**
 * Defaults: localized launch-safe trust copy for the supplied app language,
 * with a summary accessibility label for the full row.
 */
export interface SocialProofRowProps {
  accessibilityLabel?: string;
  language: SocialProofLanguage;
}

export function SocialProofRow({ accessibilityLabel, language }: SocialProofRowProps) {
  const t = copy[language];
  const rowAccessibilityLabel = accessibilityLabel ?? t.summaryAccessibilityLabel;
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: () => setIsFocused(false),
          onFocus: () => setIsFocused(true),
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        }
      : {};

  return (
    <Link
      {...webInteractionHandlers}
      aria-label={rowAccessibilityLabel}
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityRole="link"
      href="/sources"
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.link,
        isFocused || isHovered ? styles.linkFocused : null,
        isPressed ? styles.linkPressed : null,
      ]}
    >
      <Text style={styles.label}>{t.label}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.body}>{t.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  linkFocused: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.hoverScale }],
  },
  linkPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[0.75],
  },
  label: {
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
