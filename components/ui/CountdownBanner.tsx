import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CITIZENSHIP_RULES_EFFECTIVE_DATE,
  CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE,
  daysUntil,
  formatExamDate,
} from '../../lib/learning/examDate';
import { colors, radius, space, typography } from '../../lib/theme';

const copy = {
  sv: {
    label: (d: number) => (d === 1 ? '1 dag kvar' : `${d} dagar kvar`),
    body: (rulesDate: string, testDeadline: string) =>
      `Nya medborgarskapsregler gäller från ${rulesDate}. Samhällskunskapsprovet väntas starta i augusti 2026, senast ${testDeadline}. Förbered dig nu.`,
    untilLabel: 'tills nya reglerna',
  },
  en: {
    label: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
    body: (rulesDate: string, testDeadline: string) =>
      `New citizenship rules apply from ${rulesDate}. The civic-knowledge test is expected in August 2026, no later than ${testDeadline}. Start preparing now.`,
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
  const testDeadlineString = formatExamDate(CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE, language);
  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    `${t.label(days)} ${t.untilLabel}. ${t.body(rulesDateString, testDeadlineString)}`;

  return (
    <View
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole="alert"
      style={styles.banner}
    >
      <View style={styles.daysBlock}>
        <Text style={styles.daysNumber}>{days}</Text>
        <Text style={styles.daysLabel}>{t.untilLabel}</Text>
      </View>
      <Text style={styles.body}>{t.body(rulesDateString, testDeadlineString)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  body: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
});
