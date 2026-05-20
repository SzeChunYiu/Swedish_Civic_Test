import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, motion, radius, space, typography } from '../../lib/theme';

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
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const interactionHandlers = {
    onBlur: () => {
      setIsFocused(false);
      setIsPressed(false);
    },
    onFocus: () => setIsFocused(true),
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
  };

  return (
    <Link
      {...interactionHandlers}
      aria-label={rowAccessibilityLabel}
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityRole="link"
      href="/sources"
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.row,
        isFocused || isHovered ? styles.rowInteractive : null,
        isPressed ? styles.rowPressed : null,
      ]}
    >
      <Text style={styles.label}>{t.label}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.body}>{t.body}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[0.75],
    minHeight: space[6],
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.75],
    textDecorationLine: 'none',
  },
  rowInteractive: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.hoverScale }],
  },
  rowPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
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
