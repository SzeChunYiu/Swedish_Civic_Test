import { Link, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CITIZENSHIP_RULES_EFFECTIVE_DATE,
  CITIZENSHIP_TIMELINE_SOURCE_URLS,
  CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE,
  CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE,
  formatExamDate,
  getCitizenshipTimelineCountdown,
} from '../../lib/learning/examDate';
import { colors, radius, space, typography } from '../../lib/theme';

type TimelineSourceLink = {
  accessibilityLabel: string;
  label: string;
  sourceKey: keyof typeof CITIZENSHIP_TIMELINE_SOURCE_URLS;
};

const copy = {
  sv: {
    label: (d: number) => (d === 1 ? '1 dag kvar' : `${d} dagar kvar`),
    phases: {
      rules: {
        body: (rulesDate: string, firstSittingDate: string, deadlineDate: string) =>
          `Nya medborgarskapsregler gäller från ${rulesDate}. Samhällskunskapsprovet väntas starta i augusti 2026; första provomgången är ${firstSittingDate} i Stockholm. Regeringens tidsgräns för första steget är ${deadlineDate}.`,
        untilLabel: 'tills nya reglerna',
      },
      civicKnowledgeTest: {
        body: (rulesDate: string, firstSittingDate: string, deadlineDate: string) =>
          `De nya medborgarskapsreglerna gäller nu sedan ${rulesDate}. Nästa viktiga fas är samhällskunskapsprovet: första provomgången är ${firstSittingDate} i Stockholm och regeringens tidsgräns för första steget är ${deadlineDate}.`,
        untilLabel: 'till första provet',
      },
    },
    sourceLabel: 'Officiella datumkällor:',
    sources: [
      {
        accessibilityLabel: 'Öppna Migrationsverkets källa om nya medborgarskapsregler',
        label: 'Migrationsverket',
        sourceKey: 'rulesEffectiveDate',
      },
      {
        accessibilityLabel: 'Öppna UHR:s källa om första samhällskunskapsprovet',
        label: 'UHR',
        sourceKey: 'civicKnowledgeTestFirstSitting',
      },
      {
        accessibilityLabel: 'Öppna regeringens källa om uppdraget för medborgarskapsprovet',
        label: 'Regeringen',
        sourceKey: 'civicKnowledgeTestDeadline',
      },
    ] satisfies TimelineSourceLink[],
  },
  en: {
    label: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
    phases: {
      rules: {
        body: (rulesDate: string, firstSittingDate: string, deadlineDate: string) =>
          `New citizenship rules apply from ${rulesDate}. The civic-knowledge test is expected in August 2026; the first sitting is ${firstSittingDate} in Stockholm. The government deadline for the first step is ${deadlineDate}.`,
        untilLabel: 'until new rules',
      },
      civicKnowledgeTest: {
        body: (rulesDate: string, firstSittingDate: string, deadlineDate: string) =>
          `The new citizenship rules now apply from ${rulesDate}. The next important phase is the civic-knowledge test: the first sitting is ${firstSittingDate} in Stockholm, and the government deadline for the first step is ${deadlineDate}.`,
        untilLabel: 'until first test',
      },
    },
    sourceLabel: 'Official date sources:',
    sources: [
      {
        accessibilityLabel: 'Open the Swedish Migration Agency source about new citizenship rules',
        label: 'Migrationsverket',
        sourceKey: 'rulesEffectiveDate',
      },
      {
        accessibilityLabel: 'Open the UHR source about the first civic-knowledge test',
        label: 'UHR',
        sourceKey: 'civicKnowledgeTestFirstSitting',
      },
      {
        accessibilityLabel: 'Open the government source about the citizenship-test assignment',
        label: 'Regeringen',
        sourceKey: 'civicKnowledgeTestDeadline',
      },
    ] satisfies TimelineSourceLink[],
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
  const [countdown, setCountdown] = useState(() => getCitizenshipTimelineCountdown());

  useEffect(() => {
    const interval = setInterval(
      () => setCountdown(getCitizenshipTimelineCountdown()),
      60 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  if (!countdown) return null;

  const t = copy[language];
  const phaseCopy = t.phases[countdown.phase];
  const rulesDateString = formatExamDate(CITIZENSHIP_RULES_EFFECTIVE_DATE, language);
  const firstSittingDateString = formatExamDate(CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE, language);
  const deadlineDateString = formatExamDate(CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE, language);
  const accessibilitySummary = `${t.label(countdown.daysRemaining)} ${phaseCopy.untilLabel}. ${phaseCopy.body(
    rulesDateString,
    firstSittingDateString,
    deadlineDateString,
  )}`;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? accessibilitySummary}
      accessibilityRole="alert"
      style={styles.banner}
    >
      <View style={styles.daysBlock}>
        <Text style={styles.daysNumber}>{countdown.daysRemaining}</Text>
        <Text style={styles.daysLabel}>{phaseCopy.untilLabel}</Text>
      </View>
      <View style={styles.contentBlock}>
        <Text style={styles.body}>
          {phaseCopy.body(rulesDateString, firstSittingDateString, deadlineDateString)}
        </Text>
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>{t.sourceLabel}</Text>
          {t.sources.map((source) => (
            <Link
              accessibilityLabel={source.accessibilityLabel}
              accessibilityRole="link"
              href={CITIZENSHIP_TIMELINE_SOURCE_URLS[source.sourceKey] as Href}
              key={source.sourceKey}
              style={styles.sourceLink}
              target="_blank"
            >
              {source.label}
            </Link>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'flex-start',
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
    flex: 1,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  sourceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  sourceLabel: {
    color: colors.textSecondary,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  sourceLink: {
    color: colors.accent,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1],
    paddingVertical: space[0.5],
    textDecorationLine: 'underline',
  },
});
