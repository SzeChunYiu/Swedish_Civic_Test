import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

type GuidedPracticePathHref = ComponentProps<typeof Link>['href'];

export type GuidedPracticePathCopy = {
  dailyPracticeAccessibilityLabel: string;
  dailyPracticeCta: string;
  dailyPracticeText: string;
  dailyPracticeTitle: string;
  resumeAccessibilityLabel: string;
  resumeCta: string;
};

export type GuidedPracticePathStage = {
  accessibilityLabel: string;
  chapterRange: string;
  description: string;
  href: GuidedPracticePathHref;
  id: string;
  isActive: boolean;
  levelLabel: string;
  progress: number;
  progressLabel: string;
  statusLabel: string;
  title: string;
};

export function GuidedPracticePath({
  copy,
  dailyProgress,
  language,
  resumeHref,
  stages,
}: {
  copy: GuidedPracticePathCopy;
  dailyProgress: number;
  language: AppLanguage;
  resumeHref: GuidedPracticePathHref;
  stages: GuidedPracticePathStage[];
}) {
  return (
    <View style={styles.grid}>
      <Card
        accessible
        accessibilityLabel={copy.dailyPracticeAccessibilityLabel}
        style={styles.dailyCard}
      >
        <Text accessibilityRole="header" style={styles.dailyTitle}>
          {copy.dailyPracticeTitle}
        </Text>
        <Text style={styles.dailyText}>{copy.dailyPracticeText}</Text>
        <ProgressBar language={language} progress={dailyProgress} />
        <Link
          accessibilityLabel={copy.dailyPracticeAccessibilityLabel}
          accessibilityRole="link"
          href="/practice"
          style={styles.primaryLink}
        >
          {copy.dailyPracticeCta}
        </Link>
      </Card>

      <Card accessible accessibilityLabel={copy.resumeAccessibilityLabel} style={styles.pathCard}>
        {stages.map((stage) => (
          <View key={stage.id} style={styles.stageRow}>
            <View style={styles.stageHeading}>
              <Badge tone={stage.isActive ? 'blue' : 'warm'}>{stage.statusLabel}</Badge>
              <Text style={styles.stageLevel}>{stage.levelLabel}</Text>
            </View>
            <Text accessibilityLabel={stage.accessibilityLabel} style={styles.stageTitle}>
              {stage.title}
            </Text>
            <Text style={styles.stageDescription}>{stage.description}</Text>
            <Text style={styles.stageRange}>{stage.chapterRange}</Text>
            <ProgressBar language={language} progress={stage.progress} />
            <Text style={styles.stageProgress}>{stage.progressLabel}</Text>
          </View>
        ))}
        <Link
          accessibilityLabel={copy.resumeAccessibilityLabel}
          accessibilityRole="link"
          href={resumeHref}
          style={styles.secondaryLink}
        >
          {copy.resumeCta}
        </Link>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: space[1.5],
  },
  dailyCard: {
    gap: space[1.25],
  },
  dailyTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  dailyText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  pathCard: {
    gap: space[1.5],
  },
  stageRow: {
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.75],
    padding: space[1.5],
  },
  stageHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  stageLevel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  stageTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  stageDescription: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  stageRange: {
    color: colors.textMuted,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  stageProgress: {
    color: colors.textSecondary,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  primaryLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
