import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItem } from 'react-native';

import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionReportLink } from '../../components/quiz/QuestionReportLink';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Button } from '../../components/Button';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { getChapterQuizRouteParams } from '../../lib/quiz/practiceFlow';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { Chapter, PracticeQuestion } from '../../types/content';

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
    startQuiz: 'Starta frågepass',
    startQuizAccessibilityLabel: (chapterTitle) => `Starta frågepass för ${chapterTitle}`,
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
          replace
          style={styles.link}
        >
          {copy.backToLearn}
        </Link>
      </View>
    );
  }

  const quizRouteParams = getChapterQuizRouteParams(questions, chapter.id);
  const chapterTitle = copy.chapterTitle(chapter);
  const renderQuestionSeparator = () => <View style={styles.questionSeparator} />;
  const renderEmptyQuestions = () => <Text style={styles.empty}>{copy.emptyQuestions}</Text>;
  const renderListHeader = () => (
    <View style={styles.headerContent}>
      <Link
        accessibilityLabel={copy.backToListAccessibilityLabel}
        accessibilityRole="link"
        href="/learn"
        replace
        style={styles.link}
      >
        ← {copy.backToLearn}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {chapterTitle}
      </Text>
      <Text style={styles.subtitle}>{copy.chapterSubtitle(chapter)}</Text>
      <Text style={styles.description}>{copy.chapterDescription(chapter)}</Text>
      {quizRouteParams ? (
        <Button
          accessibilityLabel={copy.startQuizAccessibilityLabel(chapterTitle)}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/quiz/[sessionId]',
              params: quizRouteParams,
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
    </View>
  );
  const renderQuestionItem: ListRenderItem<PracticeQuestion> = ({ item: question }) => (
    <View style={styles.questionBlock}>
      <QuestionCard question={question} language={language} />
      <UHRReferenceCard language={language} reference={question.uhrReference} />
      <QuestionReportLink language={language} question={question} screen="chapter" />
    </View>
  );

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={chapterQuestions}
      initialNumToRender={8}
      ItemSeparatorComponent={renderQuestionSeparator}
      keyExtractor={(question) => question.id}
      ListEmptyComponent={renderEmptyQuestions}
      ListHeaderComponent={renderListHeader}
      maxToRenderPerBatch={8}
      renderItem={renderQuestionItem}
      style={styles.container}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    padding: space[3],
  },
  headerContent: {
    gap: space[1.75],
    marginBottom: space[2],
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
  questionBlock: {
    gap: space[1],
  },
  questionSeparator: {
    height: space[2],
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  link: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    color: colors.accent,
    display: 'flex',
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    justifyContent: 'center',
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
    textDecorationLine: 'none',
  },
  startQuizButton: {
    alignSelf: 'flex-start',
  },
});
