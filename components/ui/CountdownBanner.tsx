import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CITIZENSHIP_RULES_EFFECTIVE_DATE,
  CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE,
  daysUntil,
  formatExamDate,
} from '../../lib/learning/examDate';
import { colors, radius, space, typography } from '../../lib/theme';

type TimelineSourceKey = keyof typeof CITIZENSHIP_TIMELINE_SOURCE_URLS;

type TimelineSourceLink = {
  accessibilityLabel: string;
  label: string;
  sourceKey: TimelineSourceKey;
};

const copy = {
  sv: {
    label: (d: number) => (d === 1 ? '1 dag kvar' : `${d} dagar kvar`),
    body: (rulesDate: string, firstSittingDate: string) =>
      `Nya medborgarskapsregler gäller från ${rulesDate}. Första samhällskunskapsprovet genomförs den ${firstSittingDate} i Stockholm. Förbered dig nu.`,
    untilLabel: 'tills nya reglerna',
  },
  en: {
    label: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
    body: (rulesDate: string, firstSittingDate: string) =>
      `New citizenship rules apply from ${rulesDate}. The first civic-knowledge test will be held on ${firstSittingDate} in Stockholm. Start preparing now.`,
    untilLabel: 'until new rules',
  },
} as const;

/**
 * Defaults: localized countdown body, tokenized warning surface, and
 * `accessibilityRole="alert"`. Pass `accessibilityLabel` only when the route
 * needs a more specific spoken summary.
 */
export interface CountdownBannerProps {
  accessibilityLabel?: string;
  language: 'sv' | 'en';
}

export function CountdownBanner({ accessibilityLabel, language }: CountdownBannerProps) {
  const [days, setDays] = useState<number>(() => daysUntil(CITIZENSHIP_RULES_EFFECTIVE_DATE));

  useEffect(() => {
    const interval = setInterval(
      () => setDays(daysUntil(CITIZENSHIP_RULES_EFFECTIVE_DATE)),
      60 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  if (days <= 0) return null;

  const t = copy[language];
  const rulesDateString = formatExamDate(CITIZENSHIP_RULES_EFFECTIVE_DATE, language);
  const firstSittingDateString = formatExamDate(CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE, language);
  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    `${t.label(days)} ${t.untilLabel}. ${t.body(rulesDateString, firstSittingDateString)}`;

  return (
    <View style={styles.banner}>
      <Text
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityRole="alert"
        style={styles.accessibilitySummary}
      >
        {resolvedAccessibilityLabel}
      </Text>
      <View style={styles.daysBlock}>
        <Text style={styles.daysNumber}>{days}</Text>
        <Text style={styles.daysLabel}>{t.untilLabel}</Text>
      </View>
      <Text style={styles.body}>{t.body(rulesDateString, firstSittingDateString)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  accessibilitySummary: {
    height: 1,
    left: -10000,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[2],
    padding: space[2],
  },
  daysBlock: {
    alignItems: 'center',
    gap: space[0.5],
  },
  daysNumber: {
    color: colors.warning,
    fontFamily: typography.displaySecondary.fontFamily,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.displaySecondary.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  daysLabel: {
    color: colors.warning,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    letterSpacing: typography.micro.letterSpacing,
    lineHeight: typography.micro.lineHeight,
    textTransform: 'uppercase',
  },
  contentBlock: {
    flex: 1,
    gap: space[1],
  },
  body: {
    color: colors.text,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  sourceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[0.75],
  },
  sourceLabel: {
    color: colors.textSecondary,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  sourceLink: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    color: colors.accent,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.micro.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.micro.lineHeight,
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.25],
    paddingVertical: space[1],
    textAlign: 'center',
    textDecorationLine: 'none',
  },
});
