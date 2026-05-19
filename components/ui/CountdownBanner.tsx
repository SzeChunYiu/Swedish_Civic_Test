import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CITIZENSHIP_RULES_EFFECTIVE_DATE,
  CITIZENSHIP_TIMELINE_SOURCE_URLS,
  CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE,
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
    body: (rulesDate: string, testDeadline: string) =>
      `Nya medborgarskapsregler gäller från ${rulesDate}. Samhällskunskapsprovet väntas starta i augusti 2026, senast ${testDeadline}. Förbered dig nu.`,
    untilLabel: 'tills nya reglerna',
    sourcesLabel: 'Officiella källor',
    sources: [
      {
        accessibilityLabel: 'Öppna Migrationsverkets tidslinje för nya medborgarskapsregler',
        key: 'rulesEffectiveDate',
        label: 'Migrationsverket',
      },
      {
        accessibilityLabel: 'Öppna UHR:s sida om medborgarskapsprovet',
        key: 'civicKnowledgeTestStart',
        label: 'UHR',
      },
      {
        accessibilityLabel: 'Öppna Regeringens uppdrag om medborgarskapsprovet',
        key: 'civicKnowledgeTestDeadline',
        label: 'Regeringen',
      },
    ],
  },
  en: {
    label: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
    body: (rulesDate: string, testDeadline: string) =>
      `New citizenship rules apply from ${rulesDate}. The civic-knowledge test is expected in August 2026, no later than ${testDeadline}. Start preparing now.`,
    untilLabel: 'until new rules',
    sourcesLabel: 'Official sources',
    sources: [
      {
        accessibilityLabel: 'Open the Migration Agency timeline for new citizenship rules',
        key: 'rulesEffectiveDate',
        label: 'Migrationsverket',
      },
      {
        accessibilityLabel: 'Open the UHR citizenship test page',
        key: 'civicKnowledgeTestStart',
        label: 'UHR',
      },
      {
        accessibilityLabel: 'Open the government assignment for the citizenship test',
        key: 'civicKnowledgeTestDeadline',
        label: 'Regeringen',
      },
    ],
  },
} as const;

type TimelineSourceKey = keyof typeof CITIZENSHIP_TIMELINE_SOURCE_URLS;

function openTimelineSource(sourceKey: TimelineSourceKey) {
  void Linking.openURL(CITIZENSHIP_TIMELINE_SOURCE_URLS[sourceKey]);
}

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
      <View style={styles.content}>
        <Text style={styles.body}>{t.body(rulesDateString, testDeadlineString)}</Text>
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>{t.sourcesLabel}</Text>
          <View style={styles.sourceLinks}>
            {t.sources.map((source) => (
              <Pressable
                accessibilityLabel={source.accessibilityLabel}
                accessibilityRole="link"
                key={source.key}
                onPress={() => openTimelineSource(source.key)}
                style={({ pressed }) => [styles.sourceLink, pressed && styles.sourceLinkPressed]}
              >
                <Text style={styles.sourceLinkText}>{source.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    gap: space[1],
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
    gap: space[0.5],
  },
  sourceLabel: {
    color: colors.textMuted,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    letterSpacing: typography.micro.letterSpacing,
    lineHeight: typography.micro.lineHeight,
    textTransform: 'uppercase',
  },
  sourceLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  sourceLink: {
    alignItems: 'center',
    borderColor: colors.warning,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: space[1.5],
  },
  sourceLinkPressed: {
    backgroundColor: colors.surfaceWarm,
  },
  sourceLinkText: {
    color: colors.warning,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    lineHeight: typography.caption.lineHeight,
  },
});
