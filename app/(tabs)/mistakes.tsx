import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NativeAdCard } from '../../components/monetization/NativeAdCard';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { questions } from '../../data/questions';
import { useProgressStore } from '../../lib/storage/progressStore';
import { colors, radius, space } from '../../lib/theme';

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

      <NativeAdCard />

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
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2],
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    gap: space[2],
  },
  questionBlock: {
    gap: space[1],
  },
  meta: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[1],
    padding: space[2],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  practiceLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
    marginTop: space[1],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
