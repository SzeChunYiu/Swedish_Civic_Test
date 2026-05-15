import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NativeAdCard } from '../../components/monetization/NativeAdCard';
import { Badge } from '../../components/ui/Badge';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { questions } from '../../data/questions';
import { useProgressStore } from '../../lib/storage/progressStore';
import { colors, radius, space, typography } from '../../lib/theme';

export default function Screen() {
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const mistakenQuestions = questions.filter(
    (question) => questionProgress[question.id]?.wrongCount > 0,
  );
  const bookmarkedQuestions = questions.filter(
    (question) => questionProgress[question.id]?.bookmarked,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge tone="orange">Smart review</Badge>
        <Text style={styles.title}>Mistakes</Text>
        <Text style={styles.subtitle}>
          Review wrong answers with the question, source reference, and repetition count in one
          place.
        </Text>
      </View>
      <QuestionDisclaimer />

      <NativeAdCard />

      {bookmarkedQuestions.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.bookmarkMeta}>
            Bookmarked questions: {bookmarkedQuestions.length}
          </Text>
        </View>
      ) : null}

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
          <Link
            accessibilityLabel="Practice weak questions"
            accessibilityRole="link"
            href="/practice"
            style={styles.practiceLink}
          >
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
    paddingBottom: space[10],
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.25],
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
  list: {
    gap: space[2],
  },
  questionBlock: {
    gap: space[1],
  },
  bookmarkMeta: {
    color: colors.badgeBlueText,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  meta: {
    color: colors.warning,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  emptyCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[1],
    padding: space[2],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  practiceLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    marginTop: space[1],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
