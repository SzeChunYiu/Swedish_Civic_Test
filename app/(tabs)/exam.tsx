import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MockExamTimeHeatmap } from '../../components/MockExamTimeHeatmap';
import { OptionCard } from '../../components/OptionCard';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionSourceCitation } from '../../components/quiz/QuestionSourceCitation';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { ResultSummary } from '../../components/ResultSummary';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { defaultMockExamConfig } from '../../data/mockExamConfig';
import { questions } from '../../data/questions';
import {
  showRewardedExtraExamAd,
  type RewardedExtraExamAdStatus,
} from '../../lib/monetization/rewardedAd';
import {
  buildExamChapterBreakdownItems,
  buildExamReviewItems,
  formatExamTime,
  generateExam,
  scoreExam,
  shouldAutoSubmitExam,
} from '../../lib/quiz/examGenerator';
import {
  buildCompletedExamQuizSession,
  buildExamDiagnostic,
} from '../../lib/learning/examDiagnostic';
import { getQuestionDisplayText, getQuestionSourceCitation } from '../../lib/quiz/questionText';
import { useMockExamAccess } from '../../lib/monetization/useMockExamAccess';
import type { MockExamAccessReason } from '../../lib/monetization/rewardedExam';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type ExamRouteCopy = {
  accessStatus: Record<MockExamAccessReason, string>;
  accessTitle: string;
  activeHeroSubtitle: (remainingTime: string, questionCount: number) => string;
  answerAccessibilityLabel: (optionText: string, questionNumber: number) => string;
  answeredCount: (answeredCount: number, questionCount: number) => string;
  chapterBreakdownTitle: string;
  checkingAccess: string;
  completionStoreFailure: string;
  correctAnswerLabel: string;
  correctBadge: string;
  correctCount: (correctCount: number, totalCount: number) => string;
  examResultTitle: string;
  extraExamUnavailable: string;
  heroSubtitle: (durationMinutes: number, questionCount: number) => string;
  mockExamTitle: string;
  nextExamTitle: string;
  progressTitle: string;
  questionNumber: (questionNumber: number) => string;
  questionReviewTitle: string;
  resultBadge: string;
  resultNote: string;
  resultSubtitle: string;
  reviewBadge: string;
  rewardedAdStatus: Record<RewardedExtraExamAdStatus, string>;
  savedBadge: string;
  savingBadge: string;
  savingCompletion: string;
  selectedAnswerLabel: string;
  startExtraExam: string;
  startMockExam: string;
  startUnlockedExtraExam: string;
  submitAccessibilityLabel: string;
  submitLabel: string;
  timedSimulationBadge: string;
  timeExpiredBadge: string;
  timeExpiredResultNote: string;
  unlockFailure: string;
};

const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = {
  sv: {
    accessStatus: {
      ads_unavailable: 'Extra övningsprov är inte tillgängliga just nu.',
      consent_required: 'Annonsmedgivande krävs innan ett extra prov kan låsas upp.',
      free_exam_available: 'Dagens kostnadsfria övningsprov är tillgängligt.',
      premium_unlimited_mock_exams: 'Obegränsade övningsprov är aktiva.',
      remove_ads_active: 'Dagens kostnadsfria övningsprov är använt. Belöningsannonser är dolda.',
      rewarded_ad_available:
        'Dagens kostnadsfria övningsprov är använt. Extra prov är tillgängligt.',
      rewarded_exam_credit: 'Extra övningsprov är upplåst.',
    },
    accessTitle: 'Provåtkomst',
    activeHeroSubtitle: (remainingTime, questionCount) =>
      `Tid kvar ${remainingTime} · ${questionCount} UHR-baserade frågor · inga annonser under provet`,
    answerAccessibilityLabel: (optionText, questionNumber) =>
      `Välj svaret ${optionText} för fråga ${questionNumber}`,
    answeredCount: (answeredCount, questionCount) => `${answeredCount}/${questionCount} besvarade`,
    chapterBreakdownTitle: 'Kapitelöversikt',
    checkingAccess: 'Kontrollerar provåtkomst.',
    completionStoreFailure: 'Provresultatet kunde inte sparas på den här enheten.',
    correctAnswerLabel: 'Rätt svar',
    correctBadge: 'Rätt',
    correctCount: (correctCount, totalCount) => `${correctCount}/${totalCount} rätt`,
    examResultTitle: 'Provresultat',
    extraExamUnavailable: 'Extra övningsprov är inte tillgängliga just nu.',
    heroSubtitle: (durationMinutes, questionCount) =>
      `Tidsgräns ${durationMinutes} minuter · ${questionCount} UHR-baserade frågor · inga annonser under provet`,
    mockExamTitle: 'Övningsprov',
    nextExamTitle: 'Nästa prov',
    progressTitle: 'Framsteg',
    questionNumber: (questionNumber) => `Fråga ${questionNumber}`,
    questionReviewTitle: 'Frågegenomgång',
    resultBadge: 'Övningsresultat',
    resultNote:
      'Skickade resultat är slutgiltiga. Starta ett nytt övningsprov för ett nytt försök.',
    resultSubtitle: 'Förklaringar och genomgång visas först efter att provet har skickats in.',
    reviewBadge: 'Granska',
    rewardedAdStatus: {
      closed_without_reward: 'Det extra övningsprovet kräver att belöningsannonsen slutförs.',
      earned_reward: 'Extra övningsprov upplåst.',
      failed_to_load: 'Belöningsannonsen kunde inte laddas just nu.',
      show_failed: 'Belöningsannonsen kunde inte visas just nu.',
      timed_out: 'Belöningsannonsen hann löpa ut innan det extra provet låstes upp.',
      unavailable: 'Belöningsannonsen är inte tillgänglig på den här enheten just nu.',
    },
    savedBadge: 'Sparat',
    savingBadge: 'Sparar',
    savingCompletion: 'Sparar dagens övningsprov.',
    selectedAnswerLabel: 'Valt svar',
    startExtraExam: 'Lås upp extra prov',
    startMockExam: 'Starta övningsprov',
    startUnlockedExtraExam: 'Starta upplåst extra prov',
    submitAccessibilityLabel: 'Skicka övningsprov',
    submitLabel: 'Skicka prov',
    timedSimulationBadge: 'Tidsatt simulering',
    timeExpiredBadge: 'Tiden gick ut',
    timeExpiredResultNote: ' Obesvarade frågor räknas som fel och markeras som inte besvarade.',
    unlockFailure: 'Extra övningsprov kunde inte låsas upp just nu.',
  },
  en: {
    accessStatus: {
      ads_unavailable: 'Extra mock exams are unavailable right now.',
      consent_required: 'Ad consent is needed before an extra exam can be unlocked.',
      free_exam_available: 'Daily free mock exam available.',
      premium_unlimited_mock_exams: 'Unlimited mock exams active.',
      remove_ads_active: 'Daily free mock exam used. Rewarded ads are hidden.',
      rewarded_ad_available: 'Daily free mock exam used. Extra exam available.',
      rewarded_exam_credit: 'Extra mock exam unlocked.',
    },
    accessTitle: 'Exam access',
    activeHeroSubtitle: (remainingTime, questionCount) =>
      `Time left ${remainingTime} · ${questionCount} UHR-based questions · no ads during exam`,
    answerAccessibilityLabel: (optionText, questionNumber) =>
      `Select answer ${optionText} for question ${questionNumber}`,
    answeredCount: (answeredCount, questionCount) => `${answeredCount}/${questionCount} answered`,
    chapterBreakdownTitle: 'Chapter breakdown',
    checkingAccess: 'Checking mock exam access.',
    completionStoreFailure: 'Mock exam completion could not be stored on this device.',
    correctAnswerLabel: 'Correct answer',
    correctBadge: 'Correct',
    correctCount: (correctCount, totalCount) => `${correctCount}/${totalCount} correct`,
    examResultTitle: 'Exam result',
    extraExamUnavailable: 'Extra mock exams are unavailable right now.',
    heroSubtitle: (durationMinutes, questionCount) =>
      `Time limit ${durationMinutes} minutes · ${questionCount} UHR-based questions · no ads during exam`,
    mockExamTitle: 'Mock exam',
    nextExamTitle: 'Next exam',
    progressTitle: 'Progress',
    questionNumber: (questionNumber) => `Question ${questionNumber}`,
    questionReviewTitle: 'Question review',
    resultBadge: 'Mock exam result',
    resultNote: 'Submitted results are final. Start another mock exam for a fresh attempt.',
    resultSubtitle: 'Explanations and review are shown only after the exam is submitted.',
    reviewBadge: 'Review',
    rewardedAdStatus: {
      closed_without_reward: 'Extra mock exam unlock needs a completed rewarded ad.',
      earned_reward: 'Extra mock exam unlocked.',
      failed_to_load: 'Rewarded ad could not load right now.',
      show_failed: 'Rewarded ad could not be shown right now.',
      timed_out: 'Rewarded ad timed out before the extra exam unlocked.',
      unavailable: 'Rewarded ad is unavailable on this device right now.',
    },
    savedBadge: 'Saved',
    savingBadge: 'Saving',
    savingCompletion: "Saving today's mock exam completion.",
    selectedAnswerLabel: 'Selected answer',
    startExtraExam: 'Unlock extra exam',
    startMockExam: 'Start mock exam',
    startUnlockedExtraExam: 'Start unlocked extra exam',
    submitAccessibilityLabel: 'Submit mock exam',
    submitLabel: 'Submit exam',
    timedSimulationBadge: 'Timed simulation',
    timeExpiredBadge: 'Time expired',
    timeExpiredResultNote: ' Unanswered questions count as incorrect and are marked Not answered.',
    unlockFailure: 'Extra mock exam could not be unlocked right now.',
  },
};

function getAccessStatusText(reason: MockExamAccessReason, language: AppLanguage): string {
  return examRouteCopy[language].accessStatus[reason];
}

function getRewardedAdStatusText(status: RewardedExtraExamAdStatus, language: AppLanguage): string {
  return examRouteCopy[language].rewardedAdStatus[status];
}

export default function Screen() {
  const [examAttemptIndex, setExamAttemptIndex] = useState(0);
  const examSessionId = `mock-exam-${examAttemptIndex}`;
  const examQuestions = useMemo(
    () =>
      generateExam(questions, {
        questionCount: defaultMockExamConfig.questionCount,
        sessionId: examSessionId,
      }),
    [examSessionId],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerTimingsSeconds, setAnswerTimingsSeconds] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [examUnlocked, setExamUnlocked] = useState(false);
  const [examStartedAt, setExamStartedAt] = useState<string | null>(null);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [accessStatusMessage, setAccessStatusMessage] = useState<string | null>(null);
  const [startingAccessibleExam, setStartingAccessibleExam] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    defaultMockExamConfig.durationMinutes * 60,
  );
  const examStartedAtMsRef = useRef<number | null>(null);
  const lastQuestionAnsweredAtMsRef = useRef<number | null>(null);
  const reviewCardRefs = useRef<Record<string, { focus?: () => void } | null>>({});
  const reviewCardYByQuestionIdRef = useRef<Record<string, number>>({});
  const scrollViewRef = useRef<ScrollView | null>(null);
  const recordMockExamSession = useProgressStore((state) => state.recordMockExamSession);
  const language = useSettingsStore((state) => state.language);
  const copy = examRouteCopy[language];
  const {
    accessDecision,
    accessReady,
    consumeRewardedExamCredit,
    entitlements,
    entitlementsReady,
    grantRewardedExamCredit,
    recordExamCompletion,
  } = useMockExamAccess();
  const accessLoading = !accessReady || !entitlementsReady;

  useEffect(() => {
    if (!examUnlocked || submitted || remainingSeconds <= 0) return undefined;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [examUnlocked, remainingSeconds, submitted]);

  useEffect(() => {
    if (
      shouldAutoSubmitExam({
        examActive: examUnlocked,
        remainingSeconds,
        submitted,
        questionCount: examQuestions.length,
      })
    ) {
      setSubmittedAt((current) => current ?? new Date().toISOString());
      setSubmitted(true);
    }
  }, [examQuestions.length, examUnlocked, remainingSeconds, submitted]);

  const result = submitted ? scoreExam(examQuestions, answers) : null;
  const resultCorrectCount = result?.correctCount ?? 0;
  const resultTotalCount = result?.totalCount ?? 0;
  const chapterBreakdown = result
    ? buildExamChapterBreakdownItems(result.chapterBreakdown, chapters)
    : [];
  const reviewItems = result ? buildExamReviewItems(examQuestions, answers) : [];
  const completedExamSession = useMemo(() => {
    if (!submitted || !submittedAt) return null;

    return buildCompletedExamQuizSession({
      answerTimingsSeconds,
      answers,
      completedAt: submittedAt,
      questions: examQuestions,
      score: resultTotalCount > 0 ? resultCorrectCount / resultTotalCount : 0,
      sessionId: examSessionId,
      startedAt: examStartedAt ?? submittedAt,
    });
  }, [
    answerTimingsSeconds,
    answers,
    examQuestions,
    examSessionId,
    examStartedAt,
    resultCorrectCount,
    resultTotalCount,
    submitted,
    submittedAt,
  ]);
  const completedExamDiagnostic = useMemo(() => {
    if (!completedExamSession) return null;

    const questionChapterIndex = Object.fromEntries(
      examQuestions.map((question) => [question.id, question.chapterId]),
    );

    return buildExamDiagnostic({
      questionChapterIndex,
      session: completedExamSession,
    });
  }, [completedExamSession, examQuestions]);
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === examQuestions.length && examQuestions.length > 0;
  const endedByTime = Boolean(result && remainingSeconds <= 0);
  const shouldAttemptRewardedAd =
    accessDecision.canOfferRewardedAd || accessDecision.reason === 'consent_required';
  const startAccessibleExamLabel = shouldAttemptRewardedAd
    ? copy.startExtraExam
    : accessDecision.reason === 'rewarded_exam_credit'
      ? copy.startUnlockedExtraExam
      : copy.startMockExam;
  const canStartAccessibleExam =
    !accessLoading &&
    (accessDecision.canStartExam ||
      shouldAttemptRewardedAd ||
      accessDecision.reason === 'rewarded_exam_credit');
  const accessStatusText = accessLoading
    ? copy.checkingAccess
    : getAccessStatusText(accessDecision.reason, language);

  const resetExamAttempt = useCallback(() => {
    const startedAt = new Date();
    examStartedAtMsRef.current = startedAt.getTime();
    lastQuestionAnsweredAtMsRef.current = startedAt.getTime();
    setExamAttemptIndex((current) => current + 1);
    setAnswers({});
    setAnswerTimingsSeconds({});
    setSubmitted(false);
    setSubmittedAt(null);
    setExamStartedAt(startedAt.toISOString());
    setCompletionRecorded(false);
    setRemainingSeconds(defaultMockExamConfig.durationMinutes * 60);
    setExamUnlocked(true);
  }, []);

  const handleSelectAnswer = useCallback(
    (questionId: string, optionId: string) => {
      const answeredAtMs = Date.now();
      const startedAtMs = examStartedAtMsRef.current ?? answeredAtMs;
      const previousAnswerAtMs = lastQuestionAnsweredAtMsRef.current ?? startedAtMs;

      examStartedAtMsRef.current = startedAtMs;

      if (!answerTimingsSeconds[questionId]) {
        const elapsedSeconds = Math.max(
          1,
          Math.min(
            defaultMockExamConfig.durationMinutes * 60,
            Math.ceil((answeredAtMs - previousAnswerAtMs) / 1000),
          ),
        );

        lastQuestionAnsweredAtMsRef.current = answeredAtMs;
        setAnswerTimingsSeconds((current) => ({ ...current, [questionId]: elapsedSeconds }));
      }

      setAnswers((current) => ({ ...current, [questionId]: optionId }));
    },
    [answerTimingsSeconds],
  );

  const handleSubmitExam = useCallback(() => {
    setSubmittedAt((current) => current ?? new Date().toISOString());
    setSubmitted(true);
  }, []);

  const handleSelectHeatmapQuestion = useCallback((questionId: string) => {
    const reviewY = reviewCardYByQuestionIdRef.current[questionId];
    if (typeof reviewY === 'number') {
      scrollViewRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, reviewY - space[2]),
      });
    }

    const reviewCard = reviewCardRefs.current[questionId];
    if (reviewCard && typeof reviewCard.focus === 'function') {
      setTimeout(() => reviewCard.focus?.(), 250);
    }
  }, []);

  const handleStartAccessibleExam = useCallback(async () => {
    if (!canStartAccessibleExam || startingAccessibleExam) return;

    setAccessStatusMessage(null);
    setStartingAccessibleExam(true);

    try {
      if (accessDecision.reason === 'rewarded_exam_credit') {
        await consumeRewardedExamCredit();
      } else if (shouldAttemptRewardedAd) {
        const rewardedAdResult = await showRewardedExtraExamAd({ entitlements });

        if (rewardedAdResult.status !== 'earned_reward') {
          setAccessStatusMessage(getRewardedAdStatusText(rewardedAdResult.status, language));
          return;
        }

        await grantRewardedExamCredit();
        await consumeRewardedExamCredit();
      } else if (!accessDecision.canStartExam) {
        setAccessStatusMessage(copy.extraExamUnavailable);
        return;
      }

      resetExamAttempt();
    } catch {
      setAccessStatusMessage(copy.unlockFailure);
    } finally {
      setStartingAccessibleExam(false);
    }
  }, [
    accessDecision.canStartExam,
    accessDecision.reason,
    canStartAccessibleExam,
    consumeRewardedExamCredit,
    copy.extraExamUnavailable,
    copy.unlockFailure,
    entitlements,
    grantRewardedExamCredit,
    language,
    resetExamAttempt,
    shouldAttemptRewardedAd,
    startingAccessibleExam,
  ]);

  useEffect(() => {
    if (!submitted || completionRecorded || !completedExamSession) return undefined;

    let isMounted = true;
    recordMockExamSession({
      answers: completedExamSession.answers.map((answer) => ({
        questionId: answer.questionId,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds,
      })),
      sessionId: examSessionId,
      score: resultTotalCount > 0 ? resultCorrectCount / resultTotalCount : 0,
      completedAt: completedExamSession.completedAt,
      correctCount: resultCorrectCount,
      totalCount: resultTotalCount,
    });

    void recordExamCompletion(examSessionId)
      .then(() => {
        if (isMounted) setCompletionRecorded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setCompletionRecorded(true);
        setAccessStatusMessage(copy.completionStoreFailure);
      });

    return () => {
      isMounted = false;
    };
  }, [
    completionRecorded,
    completedExamSession,
    copy.completionStoreFailure,
    examSessionId,
    recordExamCompletion,
    recordMockExamSession,
    resultCorrectCount,
    resultTotalCount,
    submitted,
  ]);

  if (!result && !examUnlocked) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Badge tone="orange">{copy.timedSimulationBadge}</Badge>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.mockExamTitle}
          </Text>
          <Text style={styles.subtitle}>
            {copy.heroSubtitle(defaultMockExamConfig.durationMinutes, examQuestions.length)}
          </Text>
        </View>
        <QuestionDisclaimer />
        <View style={styles.accessCard}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {copy.accessTitle}
          </Text>
          <Text style={styles.subtitle}>{accessStatusText}</Text>
          {accessStatusMessage ? (
            <Text style={styles.statusText}>{accessStatusMessage}</Text>
          ) : null}
          <Button
            aria-disabled={!canStartAccessibleExam || startingAccessibleExam}
            accessibilityLabel={startAccessibleExamLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canStartAccessibleExam || startingAccessibleExam }}
            disabled={!canStartAccessibleExam || startingAccessibleExam}
            onPress={handleStartAccessibleExam}
            style={styles.actionButton}
          >
            {startAccessibleExamLabel}
          </Button>
        </View>
      </ScrollView>
    );
  }

  if (result) {
    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Badge tone={endedByTime ? 'orange' : 'blue'}>
            {endedByTime ? copy.timeExpiredBadge : copy.resultBadge}
          </Badge>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.examResultTitle}
          </Text>
          <Text style={styles.subtitle}>
            {copy.resultSubtitle}
            {endedByTime ? copy.timeExpiredResultNote : ''}
          </Text>
        </View>
        <QuestionDisclaimer />
        <ResultSummary
          correctCount={result.correctCount}
          languageOverride={language}
          metricLabel={copy.correctCount(result.correctCount, result.totalCount)}
          status={endedByTime ? 'review' : undefined}
          subtitle={copy.resultNote}
          totalCount={result.totalCount}
        />
        {completedExamSession && completedExamDiagnostic ? (
          <MockExamTimeHeatmap
            answers={completedExamSession.answers}
            language={language}
            medianMs={completedExamDiagnostic.medianMs}
            onSelectQuestion={handleSelectHeatmapQuestion}
          />
        ) : null}
        <View style={styles.accessCard}>
          <View style={styles.reviewHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {copy.nextExamTitle}
            </Text>
            <Badge tone={accessDecision.canStartExam ? 'green' : 'warm'}>
              {completionRecorded ? copy.savedBadge : copy.savingBadge}
            </Badge>
          </View>
          <Text style={styles.subtitle}>
            {completionRecorded ? accessStatusText : copy.savingCompletion}
          </Text>
          {accessStatusMessage ? (
            <Text style={styles.statusText}>{accessStatusMessage}</Text>
          ) : null}
          <Button
            aria-disabled={!completionRecorded || !canStartAccessibleExam || startingAccessibleExam}
            accessibilityLabel={startAccessibleExamLabel}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !completionRecorded || !canStartAccessibleExam || startingAccessibleExam,
            }}
            disabled={!completionRecorded || !canStartAccessibleExam || startingAccessibleExam}
            onPress={handleStartAccessibleExam}
            style={styles.actionButton}
            variant="secondary"
          >
            {startAccessibleExamLabel}
          </Button>
        </View>

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.chapterBreakdownTitle}
        </Text>
        {chapterBreakdown.map((chapter) => (
          <View key={chapter.chapterId} style={styles.breakdownRow}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownChapter}>
                {language === 'en' ? chapter.chapterNameEn : chapter.chapterNameSv}
              </Text>
              <Text style={styles.breakdownId}>{chapter.chapterId}</Text>
            </View>
            <Text style={styles.breakdownScore}>
              {chapter.correctCount}/{chapter.totalCount}
            </Text>
          </View>
        ))}

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.questionReviewTitle}
        </Text>
        {reviewItems.map((item, index) => (
          <View
            key={item.questionId}
            onLayout={(event) => {
              reviewCardYByQuestionIdRef.current[item.questionId] = event.nativeEvent.layout.y;
            }}
            ref={(node) => {
              reviewCardRefs.current[item.questionId] = node as unknown as {
                focus?: () => void;
              } | null;
            }}
            style={styles.reviewCard}
          >
            <View style={styles.reviewHeader}>
              <Text style={styles.questionMeta}>{copy.questionNumber(index + 1)}</Text>
              <Badge tone={item.isCorrect ? 'green' : 'orange'}>
                {item.isCorrect ? copy.correctBadge : copy.reviewBadge}
              </Badge>
            </View>
            <Text style={styles.questionText}>{getQuestionDisplayText(item, language)}</Text>
            <QuestionSourceCitation
              bodyStyle={styles.questionSourceCitation}
              citationText={getQuestionSourceCitation(item, language)}
              language={language}
              question={item}
            />
            <View style={styles.answerGrid}>
              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>{copy.selectedAnswerLabel}</Text>
                <Text style={styles.answerText}>
                  {language === 'en' ? item.selectedOptionTextEn : item.selectedOptionTextSv}
                </Text>
              </View>
              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>{copy.correctAnswerLabel}</Text>
                <Text style={styles.answerText}>
                  {language === 'en' ? item.correctOptionTextEn : item.correctOptionTextSv}
                </Text>
              </View>
            </View>
            <ExplanationPanel
              explanationEn={item.explanationEn}
              explanationSv={item.explanationSv}
              language={language}
            />
            <UHRReferenceCard language={language} reference={item.uhrReference} />
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge tone="orange">{copy.timedSimulationBadge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.mockExamTitle}
        </Text>
        <Text style={styles.subtitle}>
          {copy.activeHeroSubtitle(formatExamTime(remainingSeconds), examQuestions.length)}
        </Text>
        <ProgressBar
          language={language}
          progress={examQuestions.length > 0 ? answeredCount / examQuestions.length : 0}
        />
      </View>
      <QuestionDisclaimer />

      <View style={styles.progressCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.progressTitle}
        </Text>
        <Text style={styles.subtitle}>
          {copy.answeredCount(answeredCount, examQuestions.length)}
        </Text>
      </View>

      {examQuestions.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionMeta}>{copy.questionNumber(index + 1)}</Text>
          <Text style={styles.questionText}>{getQuestionDisplayText(question, language)}</Text>
          <QuestionSourceCitation
            bodyStyle={styles.questionSourceCitation}
            citationText={getQuestionSourceCitation(question, language)}
            language={language}
            question={question}
          />
          <View style={styles.options}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id;
              const optionText = language === 'en' ? option.textEn : option.textSv;
              return (
                <OptionCard
                  key={option.id}
                  aria-checked={isSelected}
                  aria-selected={isSelected}
                  accessibilityLabel={copy.answerAccessibilityLabel(optionText, index + 1)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, selected: isSelected }}
                  label={optionText}
                  languageOverride={language}
                  onPress={() => handleSelectAnswer(question.id, option.id)}
                  state={isSelected ? 'selected' : 'idle'}
                />
              );
            })}
          </View>
        </View>
      ))}

      <Button
        aria-disabled={!canSubmit}
        accessibilityLabel={copy.submitAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={handleSubmitExam}
        style={styles.actionButton}
      >
        {copy.submitLabel}
      </Button>
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
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  progressCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[0.5],
    padding: space[2],
  },
  accessCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[1.25],
    padding: space[2],
  },
  statusText: {
    color: colors.warning,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  questionCard: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  questionMeta: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    textTransform: 'uppercase',
  },
  questionText: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  questionSourceCitation: {
    color: colors.textDisclaimer,
    fontSize: typography.disclaimer.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
  },
  options: {
    gap: space[1],
  },
  actionButton: {
    minHeight: space[5] + space[0.5],
  },
  breakdownRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space[1.5],
  },
  breakdownLabel: {
    flex: 1,
    gap: space[0.5],
  },
  breakdownChapter: {
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  breakdownId: {
    color: colors.textMuted,
    fontSize: typography.badge.fontSize,
    textTransform: 'uppercase',
  },
  breakdownScore: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
  },
  reviewCard: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  answerGrid: {
    gap: space[1],
  },
  answerCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.small,
    gap: space[0.5],
    padding: space[1.5],
  },
  answerLabel: {
    color: colors.textMuted,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    textTransform: 'uppercase',
  },
  answerText: {
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
});
