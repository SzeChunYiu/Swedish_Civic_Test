import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { questions } from '../../data/questions';
import { useProgressStore } from '../../lib/storage/progressStore';

export default function Screen() {
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const mistakenQuestions = questions.filter(
    (question) => questionProgress[question.id]?.wrongCount > 0,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mistakes</Text>
      <Text style={styles.subtitle}>Review questions you previously answered incorrectly.</Text>
      <QuestionDisclaimer />

      {mistakenQuestions.length > 0 ? (
        <View style={styles.list}>
          {mistakenQuestions.map((question) => (
            <View key={question.id} style={styles.questionBlock}>
              <QuestionCard question={question} />
              <Text style={styles.meta}>
                Wrong answers: {questionProgress[question.id]?.wrongCount ?? 0}
              </Text>
              <UHRReferenceCard reference={question.uhrReference} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No mistakes yet</Text>
          <Text style={styles.emptyText}>
            Answer a practice question incorrectly and it will appear here.
          </Text>
          <Link href="/practice" style={styles.practiceLink}>
            Start practice
          </Link>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  content: {
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
  list: {
    gap: 16,
  },
  questionBlock: {
    gap: 8,
  },
  meta: {
    color: '#dd5b00',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    gap: 8,
    padding: 16,
  },
  emptyTitle: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#615d59',
    fontSize: 15,
    lineHeight: 22,
  },
  practiceLink: {
    alignSelf: 'flex-start',
    backgroundColor: '#0075de',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textDecorationLine: 'none',
  },
});
