import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '../../components/monetization/AdBanner';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { uxBenchmarks } from '../../data/uxBenchmarks';
import { findWeakChapterIds } from '../../lib/learning/mastery';
import { calculateStreak, countAnswersForLocalDate } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

export default function Screen() {
  const {
    entitlements: monetizationEntitlements,
    purchaseRuntime,
    setEntitlements: setMonetizationEntitlements,
  } = useRemoveAdsEntitlements();
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const completedToday = Math.min(countAnswersForLocalDate(questionProgress), dailyGoalAnswers);
  const progress = dailyGoalAnswers > 0 ? completedToday / dailyGoalAnswers : 0;
  const currentStreak = calculateStreak(answerDates);
  const level = calculateLevel(totalXp);
  const weakChapterCount = findWeakChapterIds(questions, questionProgress, 0.6).length;
  const nextAction =
    weakChapterCount > 0 ? 'Review weak chapters' : 'Start a 5-minute practice set';

  return (
    <ScreenShell
      eyebrow="Study dashboard"
      title="Prepare calmly, one civic concept at a time"
      subtitle="A focused path for Swedish civic knowledge: daily answers, realistic mock exams, mistake review, and source-backed explanations."
      rightSlot={
        <View style={styles.goalCard}>
          <Text accessibilityRole="header" style={styles.goalLabel}>
            Today&apos;s goal
          </Text>
          <Text style={styles.goalMetric}>
            {completedToday}/{dailyGoalAnswers}
          </Text>
          <ProgressBar progress={progress} />
          <Text style={styles.goalHint}>{nextAction}</Text>
        </View>
      }
    >
      <View style={styles.actions}>
        <Link
          accessibilityLabel="Start the recommended practice session"
          accessibilityRole="link"
          href="/practice"
          style={styles.primaryLink}
        >
          Start practice
        </Link>
        <Link
          accessibilityLabel="Browse all civic chapters"
          accessibilityRole="link"
          href="/learn"
          style={styles.secondaryLink}
        >
          Browse chapters
        </Link>
      </View>

      <View style={styles.statsRow}>
        <MetricCard label="level" value={level} tone="blue" helper="XP-based" />
        <MetricCard label="day streak" value={currentStreak} helper="daily habit" />
      </View>
      <View style={styles.statsRow}>
        <MetricCard label="weak chapters" value={weakChapterCount} helper="needs review" />
        <MetricCard
          label="questions"
          value={questions.length}
          helper={`${chapters.length} chapters`}
        />
      </View>

      <Card style={styles.feedbackCard}>
        <Badge tone="blue">10,000-learner feedback pass</Badge>
        <Text accessibilityRole="header" style={styles.feedbackTitle}>
          UX updates from simulated study sessions
        </Text>
        <Text style={styles.feedbackText}>
          10,000 simulated learners asked for clearer progress, saved hard questions, source-backed
          review, and ads that stay out of exams. Those fixes are now built into the study loop.
        </Text>
        <Link
          accessibilityLabel="Review bookmarked or missed questions"
          accessibilityRole="link"
          href="/mistakes"
          style={styles.feedbackLink}
        >
          Review saved questions
        </Link>
      </Card>

      <SectionHeader
        title="Optimized study loop"
        subtitle="Borrowed from successful civic-test and language-learning products: one clear next step, instant feedback, and visible progress."
      />
      <View style={styles.loopGrid}>
        {uxBenchmarks.map((item) => (
          <Card key={item.product} style={styles.loopCard}>
            <Badge tone="warm">{item.product}</Badge>
            <Text style={styles.loopText}>{item.lesson}</Text>
          </Card>
        ))}
      </View>

      <PremiumBanner
        entitlements={monetizationEntitlements}
        onEntitlementsChange={setMonetizationEntitlements}
        runtimeOptions={purchaseRuntime}
      />
      <AdBanner entitlements={monetizationEntitlements} placement="home_banner" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    padding: space[2],
  },
  goalLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  goalMetric: {
    color: colors.text,
    fontSize: typography.subHeadingLarge.fontSize,
    fontWeight: typography.subHeadingLarge.fontWeight,
    lineHeight: typography.subHeadingLarge.lineHeight,
  },
  goalHint: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
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
  statsRow: {
    flexDirection: 'row',
    gap: space[1.5],
  },
  feedbackCard: {
    gap: space[1],
  },
  feedbackTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  feedbackLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    marginTop: space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  loopGrid: {
    gap: space[1.5],
  },
  loopCard: {
    gap: space[1],
  },
  loopText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
