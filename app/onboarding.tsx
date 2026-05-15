import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';

const steps = [
  'Study Swedish civic concepts with English support when needed.',
  'Practice with UHR-referenced questions and explanations.',
  'Track progress locally on your device without an account.',
];

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Welcome</Text>
      <Text style={styles.title}>Prepare calmly for the civic test</Text>
      <Text style={styles.subtitle}>A small, independent study companion for daily practice.</Text>

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <QuestionDisclaimer />

      <View style={styles.actions}>
        <Link href="/home" style={styles.primaryLink}>
          Start studying
        </Link>
        <Link href="/settings" style={styles.secondaryLink}>
          Adjust settings
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
    justifyContent: 'center',
    padding: 24,
  },
  eyebrow: {
    color: '#097fe8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.125,
    textTransform: 'uppercase',
  },
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.625,
    lineHeight: 38,
  },
  subtitle: {
    color: '#615d59',
    fontSize: 16,
    lineHeight: 24,
  },
  steps: {
    gap: 12,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    backgroundColor: '#f2f9ff',
    borderRadius: 9999,
    color: '#097fe8',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepText: {
    color: 'rgba(0, 0, 0, 0.8)',
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
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
