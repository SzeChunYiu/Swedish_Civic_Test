import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../../components/compliance/ComplianceLinks';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { deriveBadges } from '../../lib/learning/badges';
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

export default function Screen() {
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const level = calculateLevel(totalXp);
  const currentStreak = calculateStreak(answerDates);
  const wrongAnswerCount = Object.values(questionProgress).reduce(
    (count, progress) => count + progress.wrongCount,
    0,
  );
  const badges = deriveBadges({
    completedQuestionCount: completedQuestionIds.length,
    currentStreak,
    level,
    wrongAnswerCount,
  });

  return (
    <ScreenShell
      eyebrow="Local profile"
      title="Progress without an account"
      subtitle="Your goals, language mode, streaks, and badges stay on this device for a private study experience."
    >
      <View style={styles.statsRow}>
        <MetricCard label="level" value={level} tone="blue" />
        <MetricCard label="XP" value={totalXp} />
      </View>
      <View style={styles.statsRow}>
        <MetricCard label="day streak" value={currentStreak} />
        <MetricCard label="completed" value={completedQuestionIds.length} helper="questions" />
      </View>

      <Card style={styles.cardWide}>
        <SectionHeader
          title="Study setup"
          subtitle="Small daily goals are easier to keep than long cram sessions."
        />
        <View style={styles.pillRow}>
          <Badge tone="blue">{dailyGoalAnswers} answers/day</Badge>
          <Badge tone="warm">{language === 'sv' ? 'Swedish' : 'English support'}</Badge>
        </View>
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader
          title="Badges"
          subtitle="Achievement cues make progress visible without distracting from learning."
        />
        <Text style={styles.value}>
          {badges.length > 0 ? badges.map((badge) => badge.title).join(', ') : 'No badges yet'}
        </Text>
      </Card>

      <PremiumBanner entitlements={FREE_ENTITLEMENTS} />
      <ComplianceLinks />

      <Link
        accessibilityLabel="Open settings"
        accessibilityRole="link"
        href="/settings"
        style={styles.settingsLink}
      >
        Open settings
      </Link>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: space[1.5],
  },
  cardWide: {
    gap: space[1.5],
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  value: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
