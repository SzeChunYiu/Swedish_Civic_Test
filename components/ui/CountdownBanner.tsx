import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { daysUntil, EXAM_REFORM_DATE, formatExamDate } from '../../lib/learning/examDate';
import { colors, radius, space, typography } from '../../lib/theme';

const copy = {
  sv: {
    label: (d: number) => (d === 1 ? '1 dag kvar' : `${d} dagar kvar`),
    body: (date: string) =>
      `Det nya samhällskunskapstestet träder i kraft ${date}. Förbered dig nu.`,
    untilLabel: 'tills nya provet',
  },
  en: {
    label: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
    body: (date: string) =>
      `The new civic knowledge test takes effect on ${date}. Start preparing now.`,
    untilLabel: 'until new exam',
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
  const [days, setDays] = useState<number>(() => daysUntil(EXAM_REFORM_DATE));

  useEffect(() => {
    const interval = setInterval(() => setDays(daysUntil(EXAM_REFORM_DATE)), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (days <= 0) return null;

  const t = copy[language];
  const dateString = formatExamDate(EXAM_REFORM_DATE, language);
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? `${t.label(days)} ${t.untilLabel}. ${t.body(dateString)}`;

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
      <Text style={styles.body}>{t.body(dateString)}</Text>
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
