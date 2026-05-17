import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { getChapterQuizSessionId } from '../../lib/quiz/practiceFlow';
import { colors, radius, space, typography } from '../../lib/theme';

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const chapter = chapters.find((item) => item.id === chapterId);
  const chapterQuestions = questions.filter((question) => question.chapterId === chapterId);

  if (!chapter) {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="header" style={styles.title}>
          Chapter not found
        </Text>
        <Link
          accessibilityLabel="Back to chapter list"
          accessibilityRole="link"
          href="/learn"
          style={styles.link}
        >
          Back to Learn
        </Link>
      </View>
    );
  }

  const quizSessionId = getChapterQuizSessionId(questions, chapter.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel="Back to chapter list"
        accessibilityRole="link"
        href="/learn"
        style={styles.link}
      >
        ← Back to Learn
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {chapter.nameSv}
      </Text>
      <Text style={styles.subtitle}>{chapter.nameEn}</Text>
      <Text style={styles.description}>{chapter.descriptionSv}</Text>
      {quizSessionId ? (
        <Link
          accessibilityLabel={`Start quiz for ${chapter.nameSv}`}
          accessibilityRole="link"
          href={`/quiz/${quizSessionId}`}
          style={styles.startQuizLink}
        >
          Start quiz
        </Link>
      ) : null}
      <QuestionDisclaimer />

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Practice questions ({chapterQuestions.length})
      </Text>
      <View style={styles.list}>
        {chapterQuestions.length > 0 ? (
          chapterQuestions.map((question) => (
            <View key={question.id} style={styles.questionBlock}>
              <QuestionCard question={question} />
              <UHRReferenceCard reference={question.uhrReference} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Questions for this chapter are not added yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[1.75],
    padding: space[3],
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[1.5],
    justifyContent: 'center',
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
  description: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginTop: space[1],
  },
  list: {
    gap: space[2],
  },
  questionBlock: {
    gap: space[1],
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  link: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  startQuizLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
});
