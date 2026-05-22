import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../../types/content';
import { Badge } from '../ui/Badge';

type PostAnswerRewardPanelCopy = {
  accessibilityLabel: (input: {
    answerResult: string;
    factText: string;
    level: number;
    streakDays: number;
    totalXp: number;
    xpAwarded: number;
  }) => string;
  answerCorrect: string;
  answerWrong: string;
  badge: string;
  correctStreakLabel: string;
  factTitle: string;
  factText: (sectionTitle: string) => string;
  levelLabel: string;
  streakLabel: string;
  totalXpLabel: string;
  xpAwardedLabel: string;
};

const postAnswerRewardPanelCopy: Record<AppLanguage, PostAnswerRewardPanelCopy> = {
  sv: {
    accessibilityLabel: ({ answerResult, factText, level, streakDays, totalXp, xpAwarded }) =>
      `${answerResult}. ${factText}. ${xpAwarded} XP tillagt. Totalt ${totalXp} XP. Nivå ${level}. ${streakDays} dagars svit.`,
    answerCorrect: 'Rätt svar',
    answerWrong: 'Bra repetition',
    badge: 'Visste du?',
    correctStreakLabel: 'rätt i rad',
    factTitle: 'Dagens UHR-spår',
    factText: (sectionTitle) =>
      `Den här frågan hör till ${sectionTitle}. Lägg den i minnet som en svensk kölapp: rätt ämne, rätt källa, rätt tur.`,
    levelLabel: 'Nivå',
    streakLabel: 'dagars svit',
    totalXpLabel: 'totalt',
    xpAwardedLabel: 'XP nu',
  },
  en: {
    accessibilityLabel: ({ answerResult, factText, level, streakDays, totalXp, xpAwarded }) =>
      `${answerResult}. ${factText}. ${xpAwarded} XP added. ${totalXp} XP total. Level ${level}. ${streakDays} day streak.`,
    answerCorrect: 'Correct answer',
    answerWrong: 'Good review',
    badge: 'Did you know?',
    correctStreakLabel: 'correct in a row',
    factTitle: "Today's UHR thread",
    factText: (sectionTitle) =>
      `This question belongs to ${sectionTitle}. File it like a Swedish queue ticket: right topic, right source, right turn.`,
    levelLabel: 'Level',
    streakLabel: 'day streak',
    totalXpLabel: 'total',
    xpAwardedLabel: 'XP now',
  },
};

export interface PostAnswerRewardPanelProps {
  answerXp: number;
  correctStreak: number;
  isCorrect: boolean;
  language: AppLanguage;
  level: number;
  question: PracticeQuestion;
  streakDays: number;
  totalXp: number;
}

export function PostAnswerRewardPanel({
  answerXp,
  correctStreak,
  isCorrect,
  language,
  level,
  question,
  streakDays,
  totalXp,
}: PostAnswerRewardPanelProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = postAnswerRewardPanelCopy[language];
  const sectionTitle = question.uhrReference.section;
  const answerResult = isCorrect ? copy.answerCorrect : copy.answerWrong;
  const factText = copy.factText(sectionTitle);
  const panelAccessibilityLabel = copy.accessibilityLabel({
    answerResult,
    factText,
    level,
    streakDays,
    totalXp,
    xpAwarded: answerXp,
  });

  return (
    <View
      aria-label={panelAccessibilityLabel}
      accessible
      accessibilityLabel={panelAccessibilityLabel}
      accessibilityRole="summary"
      style={styles.panel}
    >
      <View style={styles.headerRow}>
        <Badge themeColors={themeColors} tone={isCorrect ? 'green' : 'warm'}>
          {answerResult}
        </Badge>
        <Badge themeColors={themeColors} tone="blue">
          {copy.badge}
        </Badge>
      </View>
      <View style={styles.factBubble}>
        <Text accessibilityRole="header" style={styles.factTitle}>
          {copy.factTitle}
        </Text>
        <Text style={styles.factText}>{factText}</Text>
      </View>
      <View style={styles.metricRow}>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>+{answerXp}</Text>
          <Text style={styles.metricLabel}>{copy.xpAwardedLabel}</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{totalXp}</Text>
          <Text style={styles.metricLabel}>{copy.totalXpLabel}</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{level}</Text>
          <Text style={styles.metricLabel}>{copy.levelLabel}</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{streakDays}</Text>
          <Text style={styles.metricLabel}>{copy.streakLabel}</Text>
        </View>
        {correctStreak > 1 ? (
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{correctStreak}</Text>
            <Text style={styles.metricLabel}>{copy.correctStreakLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    panel: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: space.hairline,
      gap: space[1.25],
      padding: space[2],
    },
    headerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[0.75],
    },
    factBubble: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.badgeBlueBg,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[0.5],
      padding: space[1.5],
    },
    factTitle: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    factText: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    metricRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[0.75],
    },
    metricPill: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.focusSoft,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      minHeight: space[6],
      minWidth: space[7],
      paddingHorizontal: space[1],
      paddingVertical: space[0.75],
    },
    metricValue: {
      color: themeColors.text,
      fontSize: typography.bodyBold.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.bodyBold.lineHeight,
    },
    metricLabel: {
      color: themeColors.badgeBlueText,
      fontSize: typography.micro.fontSize,
      fontWeight: typography.badge.fontWeight,
      lineHeight: typography.micro.lineHeight,
      textTransform: 'uppercase',
    },
  });
}
