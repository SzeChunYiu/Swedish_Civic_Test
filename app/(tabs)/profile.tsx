import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';

export default function Screen() {
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your local study preferences and progress.</Text>

      <View style={styles.card}>
        <Text style={styles.metric}>{completedQuestionIds.length}</Text>
        <Text style={styles.label}>completed questions</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Daily goal</Text>
        <Text style={styles.value}>{dailyGoalAnswers} answers</Text>
        <Text style={styles.label}>
          Language: {language === 'sv' ? 'Swedish' : 'English support'}
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
  card: {
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
