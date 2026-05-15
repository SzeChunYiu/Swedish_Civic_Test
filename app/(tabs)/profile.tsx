import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../../components/compliance/ComplianceLinks';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
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
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your local study preferences and progress.</Text>

      <View style={styles.statsRow}>
        <View style={styles.card}>
          <Text style={styles.metric}>{level}</Text>
          <Text style={styles.label}>level</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metric}>{totalXp}</Text>
          <Text style={styles.label}>XP</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.card}>
          <Text style={styles.metric}>{currentStreak}</Text>
          <Text style={styles.label}>day streak</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metric}>{completedQuestionIds.length}</Text>
          <Text style={styles.label}>completed questions</Text>
        </View>
      </View>

      <View style={styles.cardWide}>
        <Text style={styles.label}>Daily goal</Text>
        <Text style={styles.value}>{dailyGoalAnswers} answers</Text>
        <Text style={styles.label}>
          Language: {language === 'sv' ? 'Swedish' : 'English support'}
        </Text>
      </View>

      <View style={styles.cardWide}>
        <Text style={styles.label}>Badges</Text>
        <Text style={styles.value}>
          {badges.length > 0 ? badges.map((badge) => badge.title).join(', ') : 'No badges yet'}
        </Text>
      </View>

      <PremiumBanner entitlements={FREE_ENTITLEMENTS} />
      <ComplianceLinks />

      <Link accessibilityLabel="Open settings" href="/settings" style={styles.settingsLink}>
        Open settings
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[2],
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
  statsRow: {
    flexDirection: 'row',
    gap: space[1.5],
  },
  card: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    flex: 1,
    gap: space[0.5],
    padding: space[2],
  },
  cardWide: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[0.5],
    padding: space[2],
  },
  metric: {
    color: colors.text,
    fontSize: typography.heroMobile.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  value: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
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
