import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';

export default function Screen() {
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const completedToday = Math.min(completedQuestionIds.length, dailyGoalAnswers);
  const progress = dailyGoalAnswers > 0 ? completedToday / dailyGoalAnswers : 0;

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
          <Text style={styles.metric}>{chapters.length}</Text>
          <Text style={styles.statLabel}>chapters</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.metric}>{questions.length}</Text>
          <Text style={styles.statLabel}>questions</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Link href="/practice" style={styles.primaryLink}>
          Start practice
        </Link>
        <Link href="/learn" style={styles.secondaryLink}>
          Browse chapters
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
    gap: 18,
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
  card: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    padding: 16,
  },
  cardTitle: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  metric: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 24,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    flex: 1,
    padding: 16,
  },
  statLabel: {
    color: '#615d59',
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryLink: {
    backgroundColor: '#0075de',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textDecorationLine: 'none',
  },
  secondaryLink: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textDecorationLine: 'none',
  },
});
