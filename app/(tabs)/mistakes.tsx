import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';

import { NativeAdCard } from '../../components/monetization/NativeAdCard';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/Button';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { PersistenceWarningNotice } from '../../components/storage/PersistenceWarningNotice';
import { questions } from '../../data/questions';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../../types/content';

type MistakesCopy = {
  answerReviewAccessibilityLabel: (
    correctAnswer: string,
    selectedWrongAnswer: string | undefined,
  ) => string;
  badge: string;
  bookmarkedBadge: string;
  bookmarkedMeta: string;
  bookmarkedTitle: string;
  correctAnswerLabel: string;
  emptyPracticeAccessibilityLabel: string;
  emptyPracticeLink: string;
  emptyText: string;
  emptyTitle: string;
  mistakeBadge: string;
  mistakeTitle: string;
  selectedWrongAnswerLabel: string;
  subtitle: string;
  title: string;
  wrongAnswers: (count: number) => string;
};

type MistakesReviewListItem =
  | {
      id: string;
      kind: 'bookmarked' | 'mistake';
      type: 'section';
    }
  | {
      id: string;
      kind: 'bookmarked' | 'mistake';
      question: PracticeQuestion;
      type: 'question';
    };

type AnswerReviewBlockProps = {
  copy: MistakesCopy;
  correctAnswer: string;
  selectedWrongAnswer?: string;
  styles: ReturnType<typeof createStyles>;
};

const mistakesCopy: Record<AppLanguage, MistakesCopy> = {
  sv: {
    answerReviewAccessibilityLabel: (correctAnswer, selectedWrongAnswer) =>
      selectedWrongAnswer
        ? `Fråga att öva igen. Ditt senaste svar: ${selectedWrongAnswer}. Rätt svar: ${correctAnswer}.`
        : `Fråga att öva igen. Rätt svar: ${correctAnswer}.`,
    badge: 'Smart repetition',
    bookmarkedBadge: 'Sparat',
    bookmarkedMeta: 'Sparad till senare övning',
    bookmarkedTitle: 'Bokmärkta frågor',
    correctAnswerLabel: 'Rätt svar',
    emptyPracticeAccessibilityLabel: 'Öva svåra frågor',
    emptyPracticeLink: 'Starta övning',
    emptyText: 'Bokmärk en fråga eller svara fel i övningen, så visas den här.',
    emptyTitle: 'Inga sparade eller missade frågor ännu',
    mistakeBadge: 'Missade frågor',
    mistakeTitle: 'Frågor att öva på',
    selectedWrongAnswerLabel: 'Ditt senaste svar',
    subtitle:
      'Här samlas sparade frågor och sådant du svarat fel på, med förklaring, källhänvisning och ditt senaste svar.',
    title: 'Repetition',
    wrongAnswers: (count) => `Fel svar: ${count}`,
  },
  en: {
    answerReviewAccessibilityLabel: (correctAnswer, selectedWrongAnswer) =>
      selectedWrongAnswer
        ? `Answers to review. Your latest wrong answer: ${selectedWrongAnswer}. Correct answer: ${correctAnswer}.`
        : `Answers to review. Correct answer: ${correctAnswer}.`,
    badge: 'Smart review',
    bookmarkedBadge: 'Saved list',
    bookmarkedMeta: 'Saved for focused review',
    bookmarkedTitle: 'Bookmarked questions',
    correctAnswerLabel: 'Correct answer',
    emptyPracticeAccessibilityLabel: 'Practice weak questions',
    emptyPracticeLink: 'Start practice',
    emptyText:
      'Bookmark a question or answer one incorrectly in practice, and it will appear here.',
    emptyTitle: 'No saved or missed questions yet',
    mistakeBadge: 'Mistake log',
    mistakeTitle: 'Wrong answers to revisit',
    selectedWrongAnswerLabel: 'Your latest wrong answer',
    subtitle:
      'Review saved questions and wrong answers with explanations, source references, and your latest answer in one place.',
    title: 'Review',
    wrongAnswers: (count) => `Wrong answers: ${count}`,
  },
};

function getOptionLabel(question: PracticeQuestion, optionId: string, language: AppLanguage) {
  const option = question.options.find((candidate) => candidate.id === optionId);

  if (!option) return null;

  return language === 'en' ? option.textEn : option.textSv;
}

type MistakesListHeaderProps = {
  clearMistakeReviewPersistenceWarning: () => void;
  clearProgressPersistenceWarning: () => void;
  copy: MistakesCopy;
  language: AppLanguage;
  mistakeReviewPersistenceWarning: ReturnType<
    typeof useMistakeReviewStore.getState
  >['persistenceWarning'];
  progressPersistenceWarning: ReturnType<typeof useProgressStore.getState>['persistenceWarning'];
  styles: ReturnType<typeof createStyles>;
};

function AnswerReviewBlock({
  copy,
  correctAnswer,
  selectedWrongAnswer,
  styles,
}: AnswerReviewBlockProps) {
  return (
    <View
      accessible
      accessibilityLabel={copy.answerReviewAccessibilityLabel(correctAnswer, selectedWrongAnswer)}
      style={styles.answerReview}
    >
      {selectedWrongAnswer ? (
        <View style={styles.answerReviewRow}>
          <Text style={styles.answerReviewLabel}>{copy.selectedWrongAnswerLabel}</Text>
          <Text style={styles.answerReviewValue}>{selectedWrongAnswer}</Text>
        </View>
      ) : null}
      <View style={styles.answerReviewRow}>
        <Text style={styles.answerReviewLabel}>{copy.correctAnswerLabel}</Text>
        <Text style={styles.correctAnswerValue}>{correctAnswer}</Text>
      </View>
    </View>
  );
}

function renderListHeader({
  clearMistakeReviewPersistenceWarning,
  clearProgressPersistenceWarning,
  copy,
  language,
  mistakeReviewPersistenceWarning,
  progressPersistenceWarning,
  styles,
}: MistakesListHeaderProps) {
  return (
    <View style={styles.headerStack}>
      <View style={styles.hero}>
        <Badge tone="orange">{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <QuestionDisclaimer />
      <PersistenceWarningNotice
        language={language}
        onDismiss={clearProgressPersistenceWarning}
        warning={progressPersistenceWarning}
      />
      <PersistenceWarningNotice
        language={language}
        onDismiss={clearMistakeReviewPersistenceWarning}
        warning={mistakeReviewPersistenceWarning}
      />

      <NativeAdCard />
      <RemoveAdsPlacementCta placement="results_native" />
    </View>
  );
}

export default function Screen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const copy = mistakesCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const progressPersistenceWarning = useProgressStore((state) => state.persistenceWarning);
  const clearProgressPersistenceWarning = useProgressStore(
    (state) => state.clearPersistenceWarning,
  );
  const wrongAnswerReviews = useMistakeReviewStore((state) => state.wrongAnswerReviews);
  const mistakeReviewPersistenceWarning = useMistakeReviewStore(
    (state) => state.persistenceWarning,
  );
  const clearMistakeReviewPersistenceWarning = useMistakeReviewStore(
    (state) => state.clearPersistenceWarning,
  );
  const reviewItems = useMemo<MistakesReviewListItem[]>(() => {
    const mistakenQuestions = questions.filter(
      (question) => questionProgress[question.id]?.wrongCount > 0,
    );
    const bookmarkedReviewQuestions = questions.filter(
      (question) =>
        questionProgress[question.id]?.bookmarked &&
        (questionProgress[question.id]?.wrongCount ?? 0) === 0,
    );
    const items: MistakesReviewListItem[] = [];

    if (bookmarkedReviewQuestions.length > 0) {
      items.push({
        id: 'section-bookmarked',
        kind: 'bookmarked',
        type: 'section',
      });
      bookmarkedReviewQuestions.forEach((question) => {
        items.push({
          id: `bookmarked-${question.id}`,
          kind: 'bookmarked',
          question,
          type: 'question',
        });
      });
    }

    if (mistakenQuestions.length > 0) {
      items.push({
        id: 'section-mistakes',
        kind: 'mistake',
        type: 'section',
      });
      mistakenQuestions.forEach((question) => {
        items.push({
          id: `mistake-${question.id}`,
          kind: 'mistake',
          question,
          type: 'question',
        });
      });
    }

    return items;
  }, [questionProgress]);

  const renderReviewItem = ({ item }: ListRenderItemInfo<MistakesReviewListItem>) => {
    if (item.type === 'section') {
      return item.kind === 'bookmarked' ? (
        <View style={styles.sectionHeading}>
          <Badge tone="blue">{copy.bookmarkedBadge}</Badge>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {copy.bookmarkedTitle}
          </Text>
        </View>
      ) : (
        <View style={styles.sectionHeading}>
          <Badge tone="orange">{copy.mistakeBadge}</Badge>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {copy.mistakeTitle}
          </Text>
        </View>
      );
    }

    const question = item.question;
    const wrongAnswerReview = item.kind === 'mistake' ? wrongAnswerReviews[question.id] : undefined;
    const selectedWrongAnswer = wrongAnswerReview
      ? language === 'en'
        ? wrongAnswerReview.selectedOptionTextEn
        : wrongAnswerReview.selectedOptionTextSv
      : undefined;
    const correctAnswer = getOptionLabel(question, question.correctOptionId, language);

    return (
      <View
        nativeID={`mistakes-review-card-${question.id}`}
        testID="mistakes-review-card"
        style={styles.questionBlock}
      >
        <QuestionCard question={question} language={language} />
        {item.kind === 'bookmarked' ? (
          <Text style={styles.bookmarkMeta}>{copy.bookmarkedMeta}</Text>
        ) : (
          <Text style={styles.meta}>
            {copy.wrongAnswers(questionProgress[question.id]?.wrongCount ?? 0)}
          </Text>
        )}
        {correctAnswer ? (
          item.kind === 'bookmarked' ? (
            <AnswerReviewBlock copy={copy} correctAnswer={correctAnswer} styles={styles} />
          ) : (
            <AnswerReviewBlock
              copy={copy}
              correctAnswer={correctAnswer}
              selectedWrongAnswer={selectedWrongAnswer}
              styles={styles}
            />
          )
        ) : null}
        <ExplanationPanel
          explanationEn={question.explanationEn}
          explanationSv={question.explanationSv}
          language={language}
        />
        <UHRReferenceCard language={language} reference={question.uhrReference} />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {copy.emptyTitle}
      </Text>
      <Text style={styles.emptyText}>{copy.emptyText}</Text>
      <Button
        accessibilityLabel={copy.emptyPracticeAccessibilityLabel}
        accessibilityRole="button"
        onPress={() => router.push('/practice')}
        style={styles.practiceButton}
      >
        {copy.emptyPracticeLink}
      </Button>
    </View>
  );

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={reviewItems}
      initialNumToRender={10}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyState}
      ListHeaderComponent={renderListHeader({
        clearMistakeReviewPersistenceWarning,
        clearProgressPersistenceWarning,
        copy,
        language,
        mistakeReviewPersistenceWarning,
        progressPersistenceWarning,
        styles,
      })}
      maxToRenderPerBatch={8}
      renderItem={renderReviewItem}
      removeClippedSubviews
      style={styles.container}
      testID="mistakes-review-list"
      windowSize={5}
    />
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      flex: 1,
    },
    content: {
      gap: space[2],
      padding: space[3],
      paddingBottom: space[10],
    },
    headerStack: {
      gap: space[2],
    },
    hero: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: space.hairline,
      gap: space[1.25],
      padding: space[3],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      letterSpacing: typography.subHeading.letterSpacing,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    sectionHeading: {
      gap: space[0.75],
    },
    sectionTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      letterSpacing: typography.cardTitle.letterSpacing,
      lineHeight: typography.cardTitle.lineHeight,
    },
    questionBlock: {
      gap: space[1],
    },
    bookmarkMeta: {
      color: themeColors.badgeBlueText,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    meta: {
      color: themeColors.warning,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    answerReview: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1],
      padding: space[1.5],
    },
    answerReviewRow: {
      gap: space[0.5],
    },
    answerReviewLabel: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    answerReviewValue: {
      color: themeColors.warning,
      fontSize: typography.body.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
    correctAnswerValue: {
      color: themeColors.success,
      fontSize: typography.body.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
    emptyCard: {
      backgroundColor: themeColors.surfaceWarm,
      borderRadius: radius.card,
      gap: space[1],
      padding: space[2],
    },
    emptyTitle: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    emptyText: {
      color: themeColors.textMuted,
      fontSize: typography.navButton.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
    practiceButton: {
      alignSelf: 'flex-start',
      marginTop: space[1],
    },
  });
}
