import { Link, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CITIZENSHIP_RULES_EFFECTIVE_DATE,
  CITIZENSHIP_TIMELINE_SOURCE_URLS,
  CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE,
  formatExamDate,
  getCitizenshipTimelineCountdown,
  type CitizenshipTimelineCountdownPhase,
} from '../../lib/learning/examDate';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type TimelineSourceLink = {
  accessibilityLabel: string;
  label: string;
  sourceKey: keyof typeof CITIZENSHIP_TIMELINE_SOURCE_URLS;
};

const copy = {
  sv: {
    label: (d: number) => (d === 1 ? '1 dag kvar' : `${d} dagar kvar`),
    body: {
      rules: (rulesDate: string, firstSittingDate: string) =>
        `Nya medborgarskapsregler gäller från ${rulesDate}. UHR har bekräftat att den första provomgången i samhällskunskap är ${firstSittingDate} i Stockholm.`,
      civicKnowledgeTest: (rulesDate: string, firstSittingDate: string) =>
        `De nya medborgarskapsreglerna gäller nu sedan ${rulesDate}. Nästa viktiga fas är samhällskunskapsprovet: UHR har bekräftat första provet ${firstSittingDate} i Stockholm.`,
    } satisfies Record<
      CitizenshipTimelineCountdownPhase,
      (rulesDate: string, firstSittingDate: string) => string
    >,
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
    ] satisfies TimelineSourceLink[],
    untilLabel: {
      rules: 'tills nya reglerna',
      civicKnowledgeTest: 'till första provet',
    } satisfies Record<CitizenshipTimelineCountdownPhase, string>,
  },
  en: {
    label: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
    body: {
      rules: (rulesDate: string, firstSittingDate: string) =>
        `New citizenship rules apply from ${rulesDate}. UHR has confirmed that the first civic-knowledge test sitting is ${firstSittingDate} in Stockholm.`,
      civicKnowledgeTest: (rulesDate: string, firstSittingDate: string) =>
        `The new citizenship rules have applied since ${rulesDate}. The next key phase is the civic-knowledge test: UHR has confirmed the first sitting on ${firstSittingDate} in Stockholm.`,
    } satisfies Record<
      CitizenshipTimelineCountdownPhase,
      (rulesDate: string, firstSittingDate: string) => string
    >,
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
    ] satisfies TimelineSourceLink[],
    untilLabel: {
      rules: 'until new rules',
      civicKnowledgeTest: 'until first test',
    } satisfies Record<CitizenshipTimelineCountdownPhase, string>,
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
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  useEffect(() => {
    const interval = setInterval(
      () => setCountdown(getCitizenshipTimelineCountdown()),
      60 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  if (!countdown) return null;

  const t = copy[language];
  const days = countdown.daysRemaining;
  const rulesDateString = formatExamDate(CITIZENSHIP_RULES_EFFECTIVE_DATE, language);
  const firstSittingDateString = formatExamDate(CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE, language);
  const untilLabel = t.untilLabel[countdown.phase];
  const body = t.body[countdown.phase](rulesDateString, firstSittingDateString);
  const accessibilitySummary = `${t.label(days)} ${untilLabel}. ${body}`;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? accessibilitySummary}
      accessibilityRole="alert"
      style={styles.banner}
    >
      <View style={styles.daysBlock}>
        <Text style={styles.daysNumber}>{days}</Text>
        <Text style={styles.daysLabel}>{untilLabel}</Text>
      </View>
      <View style={styles.contentBlock}>
        <Text style={styles.body}>{body}</Text>
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    banner: {
      alignItems: 'flex-start',
      backgroundColor: themeColors.warningSoft,
      borderColor: themeColors.warning,
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
      color: themeColors.warning,
      fontFamily: typography.displaySecondary.fontFamily,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.displaySecondary.fontWeight,
      letterSpacing: typography.cardTitle.letterSpacing,
      lineHeight: typography.cardTitle.lineHeight,
    },
    daysLabel: {
      color: themeColors.warning,
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
      color: themeColors.text,
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
      color: themeColors.textSecondary,
      fontFamily: typography.micro.fontFamily,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    sourceLink: {
      color: themeColors.accent,
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
}
