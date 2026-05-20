import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NativeAdCard } from '../../components/monetization/NativeAdCard';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/Button';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { questions } from '../../data/questions';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
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

const mistakesCopy: Record<AppLanguage, MistakesCopy> = {
  sv: {
    answerReviewAccessibilityLabel: (correctAnswer, selectedWrongAnswer) =>
      selectedWrongAnswer
        ? `Fråga att öva igen. Ditt senaste svar: ${selectedWrongAnswer}. Rätt svar: ${correctAnswer}.`
        : `Fråga att öva igen. Rätt svar: ${correctAnswer}.`,
    badge: 'Smart repetition',
    bookmarkedBadge: 'Sparat',
    bookmarkedMeta: 'Sparad för att öva igen',
    bookmarkedTitle: 'Bokmärkta frågor',
    correctAnswerLabel: 'Rätt svar',
    emptyPracticeAccessibilityLabel: 'Öva svåra frågor',
    emptyPracticeLink: 'Starta övning',
    emptyText: 'När du missar en övningsfråga visas den här.',
    emptyTitle: 'Inga missade frågor ännu',
    mistakeBadge: 'Öva igen',
    mistakeTitle: 'Frågor att öva igen',
    selectedWrongAnswerLabel: 'Ditt senaste svar',
    subtitle: 'Här finns frågor du har missat, med förklaring, källhänvisning och antal missar.',
    title: 'Missade frågor',
    wrongAnswers: (count) => `Antal missar: ${count}`,
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
    emptyText: 'Answer a practice question incorrectly and it will appear here.',
    emptyTitle: 'No mistakes yet',
    mistakeBadge: 'Mistake log',
    mistakeTitle: 'Wrong answers to revisit',
    selectedWrongAnswerLabel: 'Your latest wrong answer',
    subtitle:
      'Review wrong answers with the question, explanation, source reference, and repetition count in one place.',
    title: 'Mistakes',
    wrongAnswers: (count) => `Wrong answers: ${count}`,
  },
};

function getOptionLabel(question: PracticeQuestion, optionId: string, language: AppLanguage) {
  const option = question.options.find((candidate) => candidate.id === optionId);

  if (!option) return null;

  return language === 'en' ? option.textEn : option.textSv;
}

type AnswerReviewBlockProps = {
  copy: MistakesCopy;
  correctAnswer: string;
  selectedWrongAnswer?: string;
};

function AnswerReviewBlock({ copy, correctAnswer, selectedWrongAnswer }: AnswerReviewBlockProps) {
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

export default function Screen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const copy = mistakesCopy[language];
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const wrongAnswerReviews = useMistakeReviewStore((state) => state.wrongAnswerReviews);
  const mistakenQuestions = questions.filter(
    (question) => questionProgress[question.id]?.wrongCount > 0,
  );
  const bookmarkedReviewQuestions = questions.filter(
    (question) =>
      questionProgress[question.id]?.bookmarked &&
      (questionProgress[question.id]?.wrongCount ?? 0) === 0,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge tone="orange">{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <QuestionDisclaimer />

      <NativeAdCard />
      <RemoveAdsPlacementCta placement="results_native" />

      {bookmarkedReviewQuestions.length > 0 ? (
        <View style={styles.list}>
          <View style={styles.sectionHeading}>
            <Badge tone="blue">{copy.bookmarkedBadge}</Badge>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {copy.bookmarkedTitle}
            </Text>
          </View>
          {bookmarkedReviewQuestions.map((question) => {
            const correctAnswer = getOptionLabel(question, question.correctOptionId, language);

            return (
              <View key={question.id} style={styles.questionBlock}>
                <QuestionCard question={question} language={language} />
                <Text style={styles.bookmarkMeta}>{copy.bookmarkedMeta}</Text>
                {correctAnswer ? (
                  <AnswerReviewBlock copy={copy} correctAnswer={correctAnswer} />
                ) : null}
                <ExplanationPanel
                  explanationEn={question.explanationEn}
                  explanationSv={question.explanationSv}
                  language={language}
                />
                <UHRReferenceCard language={language} reference={question.uhrReference} />
              </View>
            );
          })}
        </View>
      ) : null}

      {mistakenQuestions.length > 0 ? (
        <View style={styles.list}>
          <View style={styles.sectionHeading}>
            <Badge tone="orange">{copy.mistakeBadge}</Badge>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {copy.mistakeTitle}
            </Text>
          </View>
          {mistakenQuestions.map((question) => {
            const wrongAnswerReview = wrongAnswerReviews[question.id];
            const selectedWrongAnswer = wrongAnswerReview
              ? language === 'en'
                ? wrongAnswerReview.selectedOptionTextEn
                : wrongAnswerReview.selectedOptionTextSv
              : undefined;
            const correctAnswer = getOptionLabel(question, question.correctOptionId, language);

            return (
              <View key={question.id} style={styles.questionBlock}>
                <QuestionCard question={question} language={language} />
                <Text style={styles.meta}>
                  {copy.wrongAnswers(questionProgress[question.id]?.wrongCount ?? 0)}
                </Text>
                {correctAnswer ? (
                  <AnswerReviewBlock
                    copy={copy}
                    correctAnswer={correctAnswer}
                    selectedWrongAnswer={selectedWrongAnswer}
                  />
                ) : null}
                <ExplanationPanel
                  explanationEn={question.explanationEn}
                  explanationSv={question.explanationSv}
                  language={language}
                />
                <UHRReferenceCard language={language} reference={question.uhrReference} />
              </View>
            );
          })}
        </View>
      ) : bookmarkedReviewQuestions.length === 0 ? (
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
      ) : null}
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
  sectionHeading: {
    gap: space[0.75],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
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
  answerReview: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    padding: space[1.5],
  },
  answerReviewRow: {
    gap: space[0.5],
  },
  answerReviewLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  answerReviewValue: {
    color: colors.warning,
    fontSize: typography.body.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  correctAnswerValue: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
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
  practiceButton: {
    alignSelf: 'flex-start',
    marginTop: space[1],
  },
});
