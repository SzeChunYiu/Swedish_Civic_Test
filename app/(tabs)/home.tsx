import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '../../components/monetization/AdBanner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { findWeakChapterIds } from '../../lib/learning/mastery';
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

export default function Screen() {
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const completedToday = Math.min(completedQuestionIds.length, dailyGoalAnswers);
  const progress = dailyGoalAnswers > 0 ? completedToday / dailyGoalAnswers : 0;
  const currentStreak = calculateStreak(answerDates);
  const level = calculateLevel(totalXp);
  const weakChapterCount = findWeakChapterIds(questions, questionProgress, 0.6).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Study UHR-based civic questions in small daily sessions.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today&apos;s goal</Text>
        <Text style={styles.metric}>
          {completedToday}/{dailyGoalAnswers} answers
        </Text>
        <ProgressBar progress={progress} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{level}</Text>
          <Text style={styles.statLabel}>level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{totalXp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{currentStreak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{weakChapterCount}</Text>
          <Text style={styles.statLabel}>weak chapters</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{chapters.length}</Text>
          <Text style={styles.statLabel}>chapters</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{questions.length}</Text>
          <Text style={styles.statLabel}>questions</Text>
        </View>
      </View>

      <AdBanner placement="home_banner" />

      <View style={styles.actions}>
        <Link
          accessibilityLabel="Start practice"
          accessibilityRole="link"
          href="/practice"
          style={styles.primaryLink}
        >
          Start practice
        </Link>
        <Link
          accessibilityLabel="Browse chapters"
          accessibilityRole="link"
          href="/learn"
          style={styles.secondaryLink}
        >
          Browse chapters
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[2.25],
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.25],
    padding: space[2],
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  metric: {
    color: colors.text,
    fontSize: typography.metric.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: space[1.5],
  },
  statCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    flex: 1,
    padding: space[2],
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    marginTop: space[0.5],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  primaryLink: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryLink: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
