import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { deriveBadges } from '../../lib/learning/badges';
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';

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

      <Link href="/settings" style={styles.settingsLink}>
        Open settings
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
    gap: 16,
    padding: 24,
  },
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  subtitle: {
    color: '#615d59',
    fontSize: 16,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  cardWide: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    gap: 4,
    padding: 16,
  },
  metric: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 32,
    fontWeight: '700',
  },
  value: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: '#615d59',
    fontSize: 14,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    backgroundColor: '#0075de',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textDecorationLine: 'none',
  },
});
