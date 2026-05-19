import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { PostAnswerRewardPanel } from '../../components/quiz/PostAnswerRewardPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { questions } from '../../data/questions';
import { buildQuestionSpeechText } from '../../lib/audio/speak';
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateAnswerXp, calculateLevel } from '../../lib/learning/xp';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type QuizSessionCopy = {
  backToPractice: string;
  backToPracticeAccessibilityLabel: string;
  badge: string;
  emptyTitle: string;
  scoreLabel: string;
  sessionSubtitle: string;
  sessionTitle: (sessionId: string) => string;
  tryAgain: string;
  tryAgainAccessibilityLabel: string;
};

const quizSessionCopy: Record<AppLanguage, QuizSessionCopy> = {
  sv: {
    backToPractice: 'Tillbaka till övning',
    backToPracticeAccessibilityLabel: 'Tillbaka till övning',
    badge: 'Quizpass',
    emptyTitle: 'Det finns inga quizfrågor ännu.',
    scoreLabel: 'Poäng',
    sessionSubtitle: 'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.',
    sessionTitle: (currentSessionId) => `Quizpass ${currentSessionId}`,
    tryAgain: 'Försök igen',
    tryAgainAccessibilityLabel: 'Försök igen med den här quizfrågan',
  },
  en: {
    backToPractice: 'Back to Practice',
    backToPracticeAccessibilityLabel: 'Back to practice',
    badge: 'Quiz session',
    emptyTitle: 'No quiz questions are available yet.',
    scoreLabel: 'Score',
    sessionSubtitle: 'Answer the routed question, then review the source-backed feedback.',
    sessionTitle: (currentSessionId) => `Session ${currentSessionId}`,
    tryAgain: 'Try again',
    tryAgainAccessibilityLabel: 'Try this quiz question again',
  },
};

function normalizeSessionId(sessionId: string | string[] | undefined): string {
  if (Array.isArray(sessionId)) return sessionId[0] ?? 'practice';
  return sessionId || 'practice';
}

function pickSessionQuestion(sessionId: string) {
  const exactMatch = questions.find((question) => question.id === sessionId);
  if (exactMatch || questions.length === 0) return exactMatch;

  const stableIndex =
    [...sessionId].reduce((total, character) => total + character.charCodeAt(0), 0) %
    questions.length;

  return questions[stableIndex];
}

export default function QuizSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const normalizedSessionId = normalizeSessionId(sessionId);
  const pickedQuestion = useMemo(
    () => pickSessionQuestion(normalizedSessionId),
    [normalizedSessionId],
  );
  const question = useMemo(
    () =>
      pickedQuestion
        ? shuffleQuestionOptionsForSession(pickedQuestion, normalizedSessionId)
        : undefined,
    [normalizedSessionId, pickedQuestion],
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const copy = quizSessionCopy[language];

  useEffect(() => {
    setSelectedOptionId(null);
  }, [normalizedSessionId, question?.id]);

  if (!question) {
    return (
      <View style={styles.emptyContainer}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.emptyTitle}
        </Text>
        <Link
          accessibilityLabel={copy.backToPracticeAccessibilityLabel}
          accessibilityRole="link"
          href="/practice"
          style={styles.link}
        >
          {copy.backToPractice}
        </Link>
      </View>
    );
  }

  const hasSelectedAnswer = Boolean(selectedOptionId);
  const selectedIsCorrect = selectedOptionId ? isCorrectAnswer(question, selectedOptionId) : false;
  const score = hasSelectedAnswer ? scoreAnswers([selectedIsCorrect]) : null;
  const answerXp = hasSelectedAnswer
    ? calculateAnswerXp({ isCorrect: selectedIsCorrect, explanationRead: true })
    : 0;
  const streakDays = calculateStreak(answerDates);
  const level = calculateLevel(totalXp);
  const correctStreak = questionProgress[question.id]?.correctStreak ?? 0;

  const handleSelectOption = (optionId: string) => {
    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);

    setSelectedOptionId(optionId);
    recordAnswer(question.id, optionIsCorrect);

    if (!optionIsCorrect && selectedOption) {
      recordWrongAnswerReview({
        questionId: question.id,
        selectedOptionTextEn: selectedOption.textEn,
        selectedOptionTextSv: selectedOption.textSv,
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge>{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.sessionTitle(normalizedSessionId)}
        </Text>
        <Text style={styles.subtitle}>{copy.sessionSubtitle}</Text>
        <ProgressBar language={language} progress={hasSelectedAnswer ? 1 : 0} />
      </View>

      <QuestionDisclaimer language={language} />
      <QuestionCard question={question} language={language} />
      <AudioButton
        enabled={audioEnabled}
        language={language}
        text={buildQuestionSpeechText(question)}
      />

      <View style={styles.options}>
        {question.options.map((option) => {
          const feedback = getAnswerOptionFeedback(
            question,
            option.id,
            hasSelectedAnswer ? selectedOptionId : null,
            language,
          );

          return (
            <AnswerOption
              key={option.id}
              disabled={hasSelectedAnswer}
              language={language}
              option={option}
              onPress={() => handleSelectOption(option.id)}
              resultLabel={feedback.resultLabel}
              selected={selectedOptionId === option.id}
              tone={feedback.tone}
            />
          );
        })}
      </View>

      {hasSelectedAnswer ? (
        <View style={styles.feedback}>
          <PostAnswerRewardPanel
            answerXp={answerXp}
            correctStreak={correctStreak}
            isCorrect={selectedIsCorrect}
            language={language}
            level={level}
            question={question}
            streakDays={streakDays}
            totalXp={totalXp}
          />
          {score ? (
            <Text style={styles.score}>
              {copy.scoreLabel}: {score.correct}/{score.total}
            </Text>
          ) : null}
          <ExplanationPanel
            explanationEn={question.explanationEn}
            explanationSv={question.explanationSv}
            language={language}
          />
          <UHRReferenceCard language={language} reference={question.uhrReference} />
          <View style={styles.actions}>
            <Button
              accessibilityLabel={copy.tryAgainAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: false }}
              onPress={() => setSelectedOptionId(null)}
              style={styles.actionButton}
              variant="secondary"
            >
              {copy.tryAgain}
            </Button>
            <Link
              accessibilityLabel={copy.backToPracticeAccessibilityLabel}
              accessibilityRole="link"
              href="/practice"
              style={styles.linkButton}
            >
              {copy.backToPractice}
            </Link>
          </View>
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
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[1.5],
    justifyContent: 'center',
    padding: space[3],
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
  options: {
    gap: space[1],
  },
  feedback: {
    gap: space[1.5],
  },
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  actionButton: {
    minHeight: space[5] + space[0.5],
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.card,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[5] + space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
    textDecorationLine: 'none',
  },
  link: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
});
