import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Button } from '../../components/Button';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { getChapterQuizSessionId } from '../../lib/quiz/practiceFlow';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import type { Chapter } from '../../types/content';

type ChapterRouteCopy = {
  backToListAccessibilityLabel: string;
  backToLearn: string;
  chapterDescription: (chapter: Chapter) => string;
  chapterSubtitle: (chapter: Chapter) => string;
  chapterTitle: (chapter: Chapter) => string;
  emptyQuestions: string;
  missingTitle: string;
  practiceQuestionsTitle: (count: number) => string;
  startQuiz: string;
  startQuizAccessibilityLabel: (chapterTitle: string) => string;
};

const chapterRouteCopy: Record<AppLanguage, ChapterRouteCopy> = {
  sv: {
    backToListAccessibilityLabel: 'Tillbaka till kapitellistan',
    backToLearn: 'Tillbaka till studievägen',
    chapterDescription: (chapter) => chapter.descriptionSv,
    chapterSubtitle: (chapter) => chapter.nameEn,
    chapterTitle: (chapter) => chapter.nameSv,
    emptyQuestions: 'Frågor för det här kapitlet har inte lagts till ännu.',
    missingTitle: 'Kapitlet hittades inte',
    practiceQuestionsTitle: (count) => `Övningsfrågor (${count})`,
    startQuiz: 'Starta kapitelövning',
    startQuizAccessibilityLabel: (chapterTitle) => `Starta kapitelövning för ${chapterTitle}`,
  },
  en: {
    backToListAccessibilityLabel: 'Back to chapter list',
    backToLearn: 'Back to Learn',
    chapterDescription: (chapter) => chapter.descriptionEn,
    chapterSubtitle: (chapter) => chapter.nameSv,
    chapterTitle: (chapter) => chapter.nameEn,
    emptyQuestions: 'Questions for this chapter are not added yet.',
    missingTitle: 'Chapter not found',
    practiceQuestionsTitle: (count) => `Practice questions (${count})`,
    startQuiz: 'Start quiz',
    startQuizAccessibilityLabel: (chapterTitle) => `Start quiz for ${chapterTitle}`,
  },
};

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const copy = chapterRouteCopy[language];
  const chapter = chapters.find((item) => item.id === chapterId);
  const chapterQuestions = questions.filter((question) => question.chapterId === chapterId);

  if (!chapter) {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.missingTitle}
        </Text>
        <Link
          accessibilityLabel={copy.backToListAccessibilityLabel}
          accessibilityRole="link"
          href="/learn"
          style={styles.link}
        >
          {copy.backToLearn}
        </Link>
      </View>
    );
  }

  const quizSessionId = getChapterQuizSessionId(questions, chapter.id);
  const chapterTitle = copy.chapterTitle(chapter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel={copy.backToListAccessibilityLabel}
        accessibilityRole="link"
        href="/learn"
        style={styles.link}
      >
        ← {copy.backToLearn}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {chapterTitle}
      </Text>
      <Text style={styles.subtitle}>{copy.chapterSubtitle(chapter)}</Text>
      <Text style={styles.description}>{copy.chapterDescription(chapter)}</Text>
      {quizSessionId ? (
        <Button
          accessibilityLabel={copy.startQuizAccessibilityLabel(chapterTitle)}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/quiz/[sessionId]',
              params: { sessionId: quizSessionId },
            })
          }
          style={styles.startQuizButton}
        >
          {copy.startQuiz}
        </Button>
      ) : null}
      <QuestionDisclaimer />

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {copy.practiceQuestionsTitle(chapterQuestions.length)}
      </Text>
      <View style={styles.list}>
        {chapterQuestions.length > 0 ? (
          chapterQuestions.map((question) => (
            <View key={question.id} style={styles.questionBlock}>
              <QuestionCard question={question} language={language} />
              <UHRReferenceCard language={language} reference={question.uhrReference} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>{copy.emptyQuestions}</Text>
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
  startQuizButton: {
    alignSelf: 'flex-start',
  },
});
