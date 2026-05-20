import { Link } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { NativeAdCard } from '../../components/monetization/NativeAdCard';
import { Badge } from '../../components/ui/Badge';
import type { BadgeTone } from '../../components/ui/Badge';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { questions } from '../../data/questions';
import type { MistakeAnswerReview } from '../../lib/storage/mistakeReviewStore';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import type { QuestionProgress } from '../../lib/storage/progressStore';
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
        ? `Svar att repetera. Ditt senaste felaktiga svar: ${selectedWrongAnswer}. Rätt svar: ${correctAnswer}.`
        : `Svar att repetera. Rätt svar: ${correctAnswer}.`,
    badge: 'Smart repetition',
    bookmarkedBadge: 'Sparat',
    bookmarkedMeta: 'Sparad för fokuserad repetition',
    bookmarkedTitle: 'Bokmärkta frågor',
    correctAnswerLabel: 'Rätt svar',
    emptyPracticeAccessibilityLabel: 'Öva svåra frågor',
    emptyPracticeLink: 'Starta övning',
    emptyText: 'Svara fel på en övningsfråga så visas den här.',
    emptyTitle: 'Inga misstag ännu',
    mistakeBadge: 'Fellogg',
    mistakeTitle: 'Fel svar att repetera',
    selectedWrongAnswerLabel: 'Ditt senaste felaktiga svar',
    subtitle:
      'Gå igenom fel svar med fråga, förklaring, källreferens och repetitionsantal på samma plats.',
    title: 'Misstag',
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

type ReviewItemKind = 'bookmarked' | 'mistake';

type ReviewItem = {
  kind: ReviewItemKind;
  question: PracticeQuestion;
};

type ReviewSection = {
  badge: string;
  data: ReviewItem[];
  key: ReviewItemKind;
  title: string;
  tone: BadgeTone;
};

function buildReviewItems(sourceQuestions: PracticeQuestion[], kind: ReviewItemKind): ReviewItem[] {
  return sourceQuestions.map((question) => ({ kind, question }));
}

function buildReviewSections({
  bookmarkedQuestions,
  copy,
  mistakenQuestions,
}: {
  bookmarkedQuestions: PracticeQuestion[];
  copy: MistakesCopy;
  mistakenQuestions: PracticeQuestion[];
}): ReviewSection[] {
  const sections: ReviewSection[] = [];

  if (bookmarkedQuestions.length > 0) {
    sections.push({
      badge: copy.bookmarkedBadge,
      data: buildReviewItems(bookmarkedQuestions, 'bookmarked'),
      key: 'bookmarked',
      title: copy.bookmarkedTitle,
      tone: 'blue',
    });
  }

  if (mistakenQuestions.length > 0) {
    sections.push({
      badge: copy.mistakeBadge,
      data: buildReviewItems(mistakenQuestions, 'mistake'),
      key: 'mistake',
      title: copy.mistakeTitle,
      tone: 'orange',
    });
  }

  return sections;
}

function MistakesListHeader({ copy }: { copy: MistakesCopy }) {
  return (
    <View style={styles.listHeader}>
      <View style={styles.hero}>
        <Badge tone="orange">{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <QuestionDisclaimer />

      <NativeAdCard />
    </View>
  );
}

function MistakesEmptyState({ copy }: { copy: MistakesCopy }) {
  return (
    <View style={styles.emptyCard}>
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {copy.emptyTitle}
      </Text>
      <Text style={styles.emptyText}>{copy.emptyText}</Text>
      <Link
        accessibilityLabel={copy.emptyPracticeAccessibilityLabel}
        accessibilityRole="link"
        href="/practice"
        style={styles.practiceLink}
      >
        {copy.emptyPracticeLink}
      </Link>
    </View>
  );
}

function ReviewSectionHeading({ section }: { section: ReviewSection }) {
  return (
    <View style={styles.sectionHeading}>
      <Badge tone={section.tone}>{section.badge}</Badge>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {section.title}
      </Text>
    </View>
  );
}

function BookmarkedReviewCard({
  copy,
  language,
  question,
}: {
  copy: MistakesCopy;
  language: AppLanguage;
  question: PracticeQuestion;
}) {
  return (
    <View style={styles.questionBlock}>
      <QuestionCard question={question} language={language} />
      <Text style={styles.bookmarkMeta}>{copy.bookmarkedMeta}</Text>
      <ExplanationPanel
        explanationEn={question.explanationEn}
        explanationSv={question.explanationSv}
        language={language}
      />
      <UHRReferenceCard language={language} reference={question.uhrReference} />
    </View>
  );
}

function MistakeReviewCard({
  copy,
  language,
  question,
  questionProgress,
  wrongAnswerReview,
}: {
  copy: MistakesCopy;
  language: AppLanguage;
  question: PracticeQuestion;
  questionProgress: Record<string, QuestionProgress>;
  wrongAnswerReview: MistakeAnswerReview | undefined;
}) {
  const selectedWrongAnswer = wrongAnswerReview
    ? language === 'en'
      ? wrongAnswerReview.selectedOptionTextEn
      : wrongAnswerReview.selectedOptionTextSv
    : undefined;
  const correctAnswer = getOptionLabel(question, question.correctOptionId, language);

  return (
    <View style={styles.questionBlock}>
      <QuestionCard question={question} language={language} />
      <Text style={styles.meta}>
        {copy.wrongAnswers(questionProgress[question.id]?.wrongCount ?? 0)}
      </Text>
      {correctAnswer ? (
        <View
          accessible
          accessibilityLabel={copy.answerReviewAccessibilityLabel(
            correctAnswer,
            selectedWrongAnswer,
          )}
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
      ) : null}
      <ExplanationPanel
        explanationEn={question.explanationEn}
        explanationSv={question.explanationSv}
        language={language}
      />
      <UHRReferenceCard language={language} reference={question.uhrReference} />
    </View>
  );
}

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const copy = mistakesCopy[language];
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const wrongAnswerReviews = useMistakeReviewStore((state) => state.wrongAnswerReviews);
  const mistakenQuestions = questions.filter(
    (question) => questionProgress[question.id]?.wrongCount > 0,
  );
  const bookmarkedQuestions = questions.filter(
    (question) => questionProgress[question.id]?.bookmarked,
  );
  const reviewSections = buildReviewSections({ bookmarkedQuestions, copy, mistakenQuestions });

  return (
    <SectionList
      contentContainerStyle={styles.content}
      initialNumToRender={4}
      ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      keyExtractor={(item) => `${item.kind}-${item.question.id}`}
      ListEmptyComponent={<MistakesEmptyState copy={copy} />}
      ListHeaderComponent={<MistakesListHeader copy={copy} />}
      maxToRenderPerBatch={6}
      renderItem={({ item }) =>
        item.kind === 'bookmarked' ? (
          <BookmarkedReviewCard copy={copy} language={language} question={item.question} />
        ) : (
          <MistakeReviewCard
            copy={copy}
            language={language}
            question={item.question}
            questionProgress={questionProgress}
            wrongAnswerReview={wrongAnswerReviews[item.question.id]}
          />
        )
      }
      renderSectionHeader={({ section }) => <ReviewSectionHeading section={section} />}
      SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      sections={reviewSections}
      stickySectionHeadersEnabled={false}
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
    paddingBottom: space[10],
  },
  listHeader: {
    gap: space[2],
    marginBottom: space[2],
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
  itemSeparator: {
    height: space[2],
  },
  sectionSeparator: {
    height: space[3],
  },
  sectionHeading: {
    gap: space[0.75],
    marginBottom: space[1],
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
