import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findNodeHandle, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MockExamTimeHeatmap } from '../../components/MockExamTimeHeatmap';
import { MockExamStatusBar } from '../../components/MockExamStatusBar';
import { QuestionNavigator } from '../../components/QuestionNavigator';
import { ResultSummary } from '../../components/ResultSummary';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { ProvenanceBadge } from '../../components/quiz/ProvenanceBadge';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionReportLink } from '../../components/quiz/QuestionReportLink';
import { QuestionSourceCitation } from '../../components/quiz/QuestionSourceCitation';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { defaultMockExamConfig } from '../../data/mockExamConfig';
import { questions } from '../../data/questions';
import { buildExamDiagnostic } from '../../lib/learning/examDiagnostic';
import {
  buildExamChapterBreakdownItems,
  buildExamReviewItems,
  buildMockExamQuizSession,
  formatExamTime,
  generateExam,
  getMockExamTimerUrgency,
  scoreExam,
  shouldAutoSubmitExam,
} from '../../lib/quiz/examGenerator';
import { getQuestionDisplayText, getQuestionSourceCitation } from '../../lib/quiz/questionText';
import { useMockExamAccess } from '../../lib/monetization/useMockExamAccess';
import type { MockExamAccessReason } from '../../lib/monetization/rewardedExam';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ExamRouteCopy = {
  accessStatus: Record<MockExamAccessReason, string>;
  accessTitle: string;
  activeHeroSubtitle: (remainingTime: string, questionCount: number) => string;
  activeQuestionRegionLabel: (questionNumber: number) => string;
  answerAccessibilityLabel: (optionText: string, questionNumber: number) => string;
  answerGroupAccessibilityLabel: (questionNumber: number) => string;
  answeredCount: (answeredCount: number, questionCount: number) => string;
  chapterBreakdownTitle: string;
  checkingAccess: string;
  completionStoreFailure: string;
  correctAnswerLabel: string;
  correctBadge: string;
  correctCount: (correctCount: number, totalCount: number) => string;
  examResultTitle: string;
  extraExamUnavailable: string;
  flaggedReviewCount: (count: number) => string;
  flaggedQuestionLabel: string;
  flagQuestionAccessibilityLabel: (questionNumber: number) => string;
  heroSubtitle: (durationMinutes: number, questionCount: number) => string;
  mockExamTitle: string;
  nextExamTitle: string;
  progressTitle: string;
  navigatorStateLabels: { answered: string; current: string; flagged: string; unanswered: string };
  questionNumber: (questionNumber: number) => string;
  questionReviewTitle: string;
  resultBadge: string;
  resultNote: string;
  resultSubtitle: string;
  reviewQuestionRegionLabel: (questionNumber: number) => string;
  reviewFilterAll: string;
  reviewFilterFlagged: (count: number) => string;
  reviewFilterSummary: (visibleCount: number, totalCount: number) => string;
  reviewBadge: string;
  savedBadge: string;
  savingBadge: string;
  savingCompletion: string;
  selectedAnswerLabel: string;
  retryAccess: string;
  startMockExam: string;
  startUnlockedExtraExam: string;
  submitAccessibilityLabel: string;
  submitLabel: string;
  timedSimulationBadge: string;
  timeExpiredBadge: string;
  timeExpiredResultNote: string;
  unflagQuestionAccessibilityLabel: (questionNumber: number) => string;
  unlockFailure: string;
};

type ReviewFilter = 'all' | 'flagged';

const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = {
  sv: {
    accessStatus: {
      ads_unavailable: 'Extra övningsprov är inte tillgängliga just nu.',
      access_read_failed:
        'Det gick inte att läsa sparad övningsprovsstatus. Försök igen innan du startar.',
      consent_required:
        'Dagens kostnadsfria övningsprov är använt. Extra prov låses inte upp på provskärmen.',
      free_exam_available: 'Dagens kostnadsfria övningsprov är tillgängligt.',
      premium_unlimited_mock_exams: 'Obegränsade övningsprov är aktiva.',
      remove_ads_active:
        'Dagens kostnadsfria övningsprov är använt. Provskärmen visar inga annonsupplåsningar.',
      rewarded_ad_available:
        'Dagens kostnadsfria övningsprov är använt. Extra prov låses inte upp på provskärmen.',
      rewarded_exam_credit: 'Extra övningsprov är upplåst.',
    },
    accessTitle: 'Provåtkomst',
    activeHeroSubtitle: (_remainingTime, questionCount) =>
      `${questionCount} UHR-baserade frågor · inga annonser under provet`,
    activeQuestionRegionLabel: (questionNumber) => `Fråga ${questionNumber} i övningsprovet`,
    answerAccessibilityLabel: (optionText, questionNumber) =>
      `Välj svaret ${optionText} för fråga ${questionNumber}`,
    answerGroupAccessibilityLabel: (questionNumber) =>
      `Svarsalternativ för fråga ${questionNumber}`,
    answeredCount: (answeredCount, questionCount) => `${answeredCount}/${questionCount} besvarade`,
    chapterBreakdownTitle: 'Kapitelöversikt',
    checkingAccess: 'Kontrollerar provåtkomst.',
    completionStoreFailure: 'Provresultatet kunde inte sparas på den här enheten.',
    correctAnswerLabel: 'Rätt svar',
    correctBadge: 'Rätt',
    correctCount: (correctCount, totalCount) => `${correctCount}/${totalCount} rätt`,
    examResultTitle: 'Provresultat',
    extraExamUnavailable: 'Extra övningsprov är inte tillgängliga just nu.',
    flaggedReviewCount: (count) => `Flaggade frågor: ${count}`,
    flaggedQuestionLabel: 'Flaggad',
    flagQuestionAccessibilityLabel: (questionNumber) =>
      `Flagga fråga ${questionNumber} för granskning`,
    heroSubtitle: (durationMinutes, questionCount) =>
      `Tidsgräns ${durationMinutes} minuter · ${questionCount} UHR-baserade frågor · inga annonser under provet`,
    mockExamTitle: 'Övningsprov',
    nextExamTitle: 'Nästa prov',
    progressTitle: 'Framsteg',
    navigatorStateLabels: {
      answered: 'Besvarad',
      current: 'Aktuell fråga',
      flagged: 'Flaggad',
      unanswered: 'Obesvarad',
    },
    questionNumber: (questionNumber) => `Fråga ${questionNumber}`,
    questionReviewTitle: 'Frågegenomgång',
    resultBadge: 'Övningsresultat',
    resultNote:
      'Skickade resultat är slutgiltiga. Starta ett nytt övningsprov för ett nytt försök.',
    resultSubtitle: 'Förklaringar och genomgång visas först efter att provet har skickats in.',
    reviewQuestionRegionLabel: (questionNumber) => `Genomgång för fråga ${questionNumber}`,
    reviewFilterAll: 'Visa alla frågor',
    reviewFilterFlagged: (count) => `Visa flaggade frågor (${count})`,
    reviewFilterSummary: (visibleCount, totalCount) =>
      `Visar ${visibleCount} av ${totalCount} frågor`,
    reviewBadge: 'Granska',
    savedBadge: 'Sparat',
    savingBadge: 'Sparar',
    savingCompletion: 'Sparar dagens övningsprov.',
    selectedAnswerLabel: 'Valt svar',
    retryAccess: 'Försök läsa övningsprovsstatus igen',
    startMockExam: 'Starta övningsprov',
    startUnlockedExtraExam: 'Starta upplåst övningsprov',
    submitAccessibilityLabel: 'Skicka övningsprov',
    submitLabel: 'Skicka prov',
    timedSimulationBadge: 'Tidsatt simulering',
    timeExpiredBadge: 'Tiden gick ut',
    timeExpiredResultNote: ' Obesvarade frågor räknas som fel och markeras som inte besvarade.',
    unflagQuestionAccessibilityLabel: (questionNumber) =>
      `Ta bort flagga från fråga ${questionNumber}`,
    unlockFailure: 'Extra övningsprov kunde inte låsas upp just nu.',
  },
  en: {
    accessStatus: {
      ads_unavailable: 'Extra mock exams are unavailable right now.',
      access_read_failed: 'Stored mock exam access could not be read. Retry before starting.',
      consent_required:
        'Daily free mock exam used. Extra exams are not unlocked on the exam screen.',
      free_exam_available: 'Daily free mock exam available.',
      premium_unlimited_mock_exams: 'Unlimited mock exams active.',
      remove_ads_active: 'Daily free mock exam used. The exam screen does not show ad unlocks.',
      rewarded_ad_available:
        'Daily free mock exam used. Extra exams are not unlocked on the exam screen.',
      rewarded_exam_credit: 'Extra mock exam unlocked.',
    },
    accessTitle: 'Exam access',
    activeHeroSubtitle: (_remainingTime, questionCount) =>
      `${questionCount} UHR-based questions · no ads during exam`,
    activeQuestionRegionLabel: (questionNumber) => `Question ${questionNumber} in mock exam`,
    answerAccessibilityLabel: (optionText, questionNumber) =>
      `Select answer ${optionText} for question ${questionNumber}`,
    answerGroupAccessibilityLabel: (questionNumber) =>
      `Answer options for question ${questionNumber}`,
    answeredCount: (answeredCount, questionCount) => `${answeredCount}/${questionCount} answered`,
    chapterBreakdownTitle: 'Chapter breakdown',
    checkingAccess: 'Checking mock exam access.',
    completionStoreFailure: 'Mock exam completion could not be stored on this device.',
    correctAnswerLabel: 'Correct answer',
    correctBadge: 'Correct',
    correctCount: (correctCount, totalCount) => `${correctCount}/${totalCount} correct`,
    examResultTitle: 'Exam result',
    extraExamUnavailable: 'Extra mock exams are unavailable right now.',
    flaggedReviewCount: (count) => `Flagged questions: ${count}`,
    flaggedQuestionLabel: 'Flagged',
    flagQuestionAccessibilityLabel: (questionNumber) =>
      `Flag question ${questionNumber} for review`,
    heroSubtitle: (durationMinutes, questionCount) =>
      `Time limit ${durationMinutes} minutes · ${questionCount} UHR-based questions · no ads during exam`,
    mockExamTitle: 'Mock exam',
    nextExamTitle: 'Next exam',
    progressTitle: 'Progress',
    navigatorStateLabels: {
      answered: 'Answered',
      current: 'Current question',
      flagged: 'Flagged',
      unanswered: 'Unanswered',
    },
    questionNumber: (questionNumber) => `Question ${questionNumber}`,
    questionReviewTitle: 'Question review',
    resultBadge: 'Mock exam result',
    resultNote: 'Submitted results are final. Start another mock exam for a fresh attempt.',
    resultSubtitle: 'Explanations and review are shown only after the exam is submitted.',
    reviewQuestionRegionLabel: (questionNumber) => `Review for question ${questionNumber}`,
    reviewFilterAll: 'Show all questions',
    reviewFilterFlagged: (count) => `Show flagged questions (${count})`,
    reviewFilterSummary: (visibleCount, totalCount) =>
      `Showing ${visibleCount} of ${totalCount} questions`,
    reviewBadge: 'Review',
    savedBadge: 'Saved',
    savingBadge: 'Saving',
    savingCompletion: "Saving today's mock exam completion.",
    selectedAnswerLabel: 'Selected answer',
    retryAccess: 'Retry mock exam access check',
    startMockExam: 'Start mock exam',
    startUnlockedExtraExam: 'Start unlocked mock exam',
    submitAccessibilityLabel: 'Submit mock exam',
    submitLabel: 'Submit exam',
    timedSimulationBadge: 'Timed simulation',
    timeExpiredBadge: 'Time expired',
    timeExpiredResultNote: ' Unanswered questions count as incorrect and are marked Not answered.',
    unflagQuestionAccessibilityLabel: (questionNumber) =>
      `Remove flag from question ${questionNumber}`,
    unlockFailure: 'Extra mock exam could not be unlocked right now.',
  },
};

function getAccessStatusText(reason: MockExamAccessReason, language: AppLanguage): string {
  return examRouteCopy[language].accessStatus[reason];
}

function createMockExamAttemptId(now = Date.now(), random = Math.random()): string {
  const randomPart = Math.floor(random * Number.MAX_SAFE_INTEGER).toString(36) || '0';
  return `mock-exam-${now.toString(36)}-${randomPart}`;
}

export default function Screen() {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const reviewCardRefs = useRef<Record<string, View | null>>({});
  const examStartedAtIsoRef = useRef(new Date().toISOString());
  const timingCheckpointMsRef = useRef(Date.now());
  const [examAttemptId, setExamAttemptId] = useState(createMockExamAttemptId);
  const [examShuffleSeedIndex, setExamShuffleSeedIndex] = useState(0);
  const examShuffleSeed = `mock-exam-shuffle-${examShuffleSeedIndex}`;
  const examQuestions = useMemo(
    () =>
      generateExam(questions, {
        questionCount: defaultMockExamConfig.questionCount,
        sessionId: examShuffleSeed,
      }),
    [examShuffleSeed],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<Record<string, true>>({});
  const [answerTimings, setAnswerTimings] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [examUnlocked, setExamUnlocked] = useState(false);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [accessStatusMessage, setAccessStatusMessage] = useState<string | null>(null);
  const [focusedReviewQuestionId, setFocusedReviewQuestionId] = useState<string | null>(null);
  const [startingAccessibleExam, setStartingAccessibleExam] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    defaultMockExamConfig.durationMinutes * 60,
  );
  const recordMockExamSession = useProgressStore((state) => state.recordMockExamSession);
  const language = useSettingsStore((state) => state.language);
  const copy = examRouteCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const {
    accessDecision,
    accessReady,
    consumeRewardedExamCredit,
    entitlementsReady,
    recordExamCompletion,
    refreshAccess,
  } = useMockExamAccess();
  const accessLoading = !accessReady || !entitlementsReady;

  useEffect(() => {
    if (!examUnlocked || submitted || !Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((current) => (Number.isFinite(current) ? Math.max(0, current - 1) : 0));
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

  useEffect(() => {
    if (examUnlocked || submitted || accessLoading) return;
    if (accessDecision.canStartExam && accessDecision.reason !== 'rewarded_exam_credit') {
      const now = Date.now();
      examStartedAtIsoRef.current = new Date(now).toISOString();
      timingCheckpointMsRef.current = now;
      setExamUnlocked(true);
    }
  }, [accessDecision.canStartExam, accessDecision.reason, accessLoading, examUnlocked, submitted]);

  const result = submitted ? scoreExam(examQuestions, answers) : null;
  const resultCorrectCount = result?.correctCount ?? 0;
  const resultTotalCount = result?.totalCount ?? 0;
  const chapterBreakdown = result
    ? buildExamChapterBreakdownItems(result.chapterBreakdown, chapters)
    : [];
  const reviewItems = result ? buildExamReviewItems(examQuestions, answers) : [];
  const flaggedReviewCount = reviewItems.filter(
    (item) => flaggedQuestionIds[item.questionId],
  ).length;
  const filteredReviewItems =
    reviewFilter === 'flagged'
      ? reviewItems.filter((item) => flaggedQuestionIds[item.questionId])
      : reviewItems;
  const answeredCount = Object.keys(answers).length;
  const answeredIndexes = useMemo(
    () => examQuestions.flatMap((question, index) => (answers[question.id] ? [index] : [])),
    [answers, examQuestions],
  );
  const flaggedIndexes = useMemo(
    () =>
      examQuestions.flatMap((question, index) => (flaggedQuestionIds[question.id] ? [index] : [])),
    [examQuestions, flaggedQuestionIds],
  );
  const canSubmit = answeredCount === examQuestions.length && examQuestions.length > 0;
  const totalExamSeconds = defaultMockExamConfig.durationMinutes * 60;
  const timerUrgency = getMockExamTimerUrgency({
    remainingSeconds,
    totalSeconds: totalExamSeconds,
  });
  const endedByTime = Boolean(result && remainingSeconds <= 0);
  const submittedExamSession = useMemo(
    () =>
      submitted && submittedAt
        ? buildMockExamQuizSession({
            answers,
            completedAt: submittedAt,
            questionTimings: answerTimings,
            questions: examQuestions,
            sessionId: examAttemptId,
            startedAt: examStartedAtIsoRef.current,
          })
        : null,
    [answerTimings, answers, examAttemptId, examQuestions, submitted, submittedAt],
  );
  const questionChapterIndex = useMemo(
    () =>
      Object.fromEntries(
        examQuestions.map((question) => [question.id, question.chapterId] as const),
      ),
    [examQuestions],
  );
  const examQuestionById = useMemo(
    () => new Map(examQuestions.map((question) => [question.id, question] as const)),
    [examQuestions],
  );
  const examQuestionNumberById = useMemo(
    () => new Map(examQuestions.map((question, index) => [question.id, index + 1] as const)),
    [examQuestions],
  );
  const examDiagnostic = useMemo(
    () =>
      submittedExamSession
        ? buildExamDiagnostic({
            questionChapterIndex,
            session: submittedExamSession,
          })
        : null,
    [questionChapterIndex, submittedExamSession],
  );
  const shouldRetryAccessRead = accessDecision.reason === 'access_read_failed';
  const startAccessibleExamLabel = shouldRetryAccessRead
    ? copy.retryAccess
    : accessDecision.reason === 'rewarded_exam_credit'
      ? copy.startUnlockedExtraExam
      : copy.startMockExam;
  const canStartAccessibleExam =
    !accessLoading &&
    (shouldRetryAccessRead ||
      accessDecision.canStartExam ||
      accessDecision.reason === 'rewarded_exam_credit');
  const accessStatusText = accessLoading
    ? copy.checkingAccess
    : getAccessStatusText(accessDecision.reason, language);

  const resetExamAttempt = useCallback(() => {
    const now = Date.now();
    examStartedAtIsoRef.current = new Date(now).toISOString();
    timingCheckpointMsRef.current = now;
    setExamAttemptId(createMockExamAttemptId());
    setExamShuffleSeedIndex((current) => current + 1);
    setAnswers({});
    setFlaggedQuestionIds({});
    setAnswerTimings({});
    setSubmitted(false);
    setSubmittedAt(null);
    setReviewFilter('all');
    setCompletionRecorded(false);
    setFocusedReviewQuestionId(null);
    setRemainingSeconds(defaultMockExamConfig.durationMinutes * 60);
    setExamUnlocked(true);
  }, []);

  const toggleFlaggedQuestion = useCallback((questionId: string) => {
    setFlaggedQuestionIds((current) => {
      if (current[questionId]) {
        const { [questionId]: _removed, ...rest } = current;
        return rest;
      }

      return { ...current, [questionId]: true };
    });
  }, []);

  const submitExam = useCallback(() => {
    setSubmittedAt((current) => current ?? new Date().toISOString());
    setReviewFilter('all');
    setSubmitted(true);
  }, []);

  const recordQuestionAnswer = useCallback((questionId: string, optionId: string) => {
    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.round((now - timingCheckpointMsRef.current) / 1000));
    timingCheckpointMsRef.current = now;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setAnswerTimings((current) => ({
      ...current,
      [questionId]: Math.min(
        defaultMockExamConfig.durationMinutes * 60,
        (current[questionId] ?? 0) + elapsedSeconds,
      ),
    }));
  }, []);

  const jumpToReviewQuestion = useCallback((questionId: string) => {
    setFocusedReviewQuestionId(questionId);

    const scrollView = scrollViewRef.current;
    const reviewCard = reviewCardRefs.current[questionId];
    const scrollHandle = scrollView ? findNodeHandle(scrollView) : null;
    if (!scrollView || !reviewCard || !scrollHandle) return;

    reviewCard.measureLayout(
      scrollHandle,
      (_x, y) => scrollView.scrollTo({ animated: true, y: Math.max(0, y - space[2]) }),
      () => {},
    );
  }, []);

  const handleStartAccessibleExam = useCallback(async () => {
    if (!canStartAccessibleExam || startingAccessibleExam) return;

    setAccessStatusMessage(null);
    setStartingAccessibleExam(true);

    try {
      if (shouldRetryAccessRead) {
        await refreshAccess();
        return;
      }

      if (accessDecision.reason === 'rewarded_exam_credit') {
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
    refreshAccess,
    resetExamAttempt,
    shouldRetryAccessRead,
    startingAccessibleExam,
  ]);

  useEffect(() => {
    if (!submitted || completionRecorded) return undefined;

    let isMounted = true;
    recordMockExamSession({
      sessionId: examAttemptId,
      score: resultTotalCount > 0 ? resultCorrectCount / resultTotalCount : 0,
      completedAt: submittedExamSession?.completedAt ?? new Date().toISOString(),
      correctCount: resultCorrectCount,
      questionTimings:
        submittedExamSession?.answers
          .filter((answer) => answer.timeSpentSeconds > 0)
          .map((answer) => ({
            questionId: answer.questionId,
            timeSpentSeconds: answer.timeSpentSeconds,
          })) ?? [],
      totalCount: resultTotalCount,
    });

    void recordExamCompletion(examAttemptId)
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
    copy.completionStoreFailure,
    examAttemptId,
    recordExamCompletion,
    recordMockExamSession,
    resultCorrectCount,
    resultTotalCount,
    submitted,
    submittedExamSession,
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
          subtitle={copy.resultNote}
          totalCount={result.totalCount}
        />
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
        <View style={styles.reviewFilterPanel}>
          <View style={styles.reviewFilterHeader}>
            <Text style={styles.reviewFilterSummary}>
              {copy.reviewFilterSummary(filteredReviewItems.length, reviewItems.length)}
            </Text>
            <Badge tone={flaggedReviewCount > 0 ? 'warm' : 'blue'}>
              {copy.flaggedReviewCount(flaggedReviewCount)}
            </Badge>
          </View>
          {flaggedReviewCount > 0 ? (
            <View style={styles.reviewFilterActions}>
              <Pressable
                accessibilityLabel={copy.reviewFilterFlagged(flaggedReviewCount)}
                accessibilityRole="button"
                accessibilityState={{ selected: reviewFilter === 'flagged' }}
                aria-selected={reviewFilter === 'flagged'}
                onPress={() => setReviewFilter('flagged')}
                style={[
                  styles.reviewFilterButton,
                  reviewFilter === 'flagged' ? styles.reviewFilterButtonSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.reviewFilterButtonText,
                    reviewFilter === 'flagged' ? styles.reviewFilterButtonTextSelected : null,
                  ]}
                >
                  {copy.reviewFilterFlagged(flaggedReviewCount)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={copy.reviewFilterAll}
                accessibilityRole="button"
                accessibilityState={{ selected: reviewFilter === 'all' }}
                aria-selected={reviewFilter === 'all'}
                onPress={() => setReviewFilter('all')}
                style={[
                  styles.reviewFilterButton,
                  reviewFilter === 'all' ? styles.reviewFilterButtonSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.reviewFilterButtonText,
                    reviewFilter === 'all' ? styles.reviewFilterButtonTextSelected : null,
                  ]}
                >
                  {copy.reviewFilterAll}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        {submittedExamSession && examDiagnostic ? (
          <MockExamTimeHeatmap
            answers={submittedExamSession.answers}
            language={language}
            medianMs={examDiagnostic.medianMs}
            onSelectQuestion={jumpToReviewQuestion}
          />
        ) : null}
        {filteredReviewItems.map((item) => {
          const reviewQuestion = examQuestionById.get(item.questionId);
          const questionNumber =
            examQuestionNumberById.get(item.questionId) ??
            reviewItems.findIndex((reviewItem) => reviewItem.questionId === item.questionId) + 1;
          const reviewQuestionRegionLabel = copy.reviewQuestionRegionLabel(questionNumber);

          return (
            <View
              accessibilityLabel={reviewQuestionRegionLabel}
              accessibilityRole="summary"
              accessibilityState={{ selected: focusedReviewQuestionId === item.questionId }}
              aria-label={reviewQuestionRegionLabel}
              key={item.questionId}
              ref={(node) => {
                reviewCardRefs.current[item.questionId] = node;
              }}
              style={[
                styles.reviewCard,
                focusedReviewQuestionId === item.questionId ? styles.reviewCardFocused : null,
              ]}
            >
              <View style={styles.reviewHeader}>
                <Text style={styles.questionMeta}>{copy.questionNumber(questionNumber)}</Text>
                <Badge tone={item.isCorrect ? 'green' : 'orange'}>
                  {item.isCorrect ? copy.correctBadge : copy.reviewBadge}
                </Badge>
                {flaggedQuestionIds[item.questionId] ? (
                  <Badge tone="warm">{copy.flaggedQuestionLabel}</Badge>
                ) : null}
              </View>
              <ProvenanceBadge language={language} question={reviewQuestion} />
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
              {reviewQuestion ? (
                <QuestionReportLink
                  language={language}
                  question={reviewQuestion}
                  screen="exam"
                  selectedOptionId={answers[item.questionId]}
                />
              ) : null}
            </View>
          );
        })}
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

      <QuestionNavigator
        answeredIndexes={answeredIndexes}
        currentIndex={null}
        flaggedIndexes={flaggedIndexes}
        languageOverride={language}
        stateLabels={copy.navigatorStateLabels}
        totalCount={examQuestions.length}
      />

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {copy.progressTitle}
      </Text>
      <MockExamStatusBar
        counterLabel={copy.answeredCount(answeredCount, examQuestions.length)}
        eyebrowLabel={copy.mockExamTitle}
        languageOverride={language}
        onSubmit={submitExam}
        submitDisabled={!canSubmit}
        timerUrgency={timerUrgency}
        timeValue={formatExamTime(remainingSeconds)}
      />

      {examQuestions.map((question, index) => {
        const isFlagged = Boolean(flaggedQuestionIds[question.id]);
        const questionNumber = index + 1;
        const activeQuestionRegionLabel = copy.activeQuestionRegionLabel(questionNumber);

        return (
          <View
            accessibilityLabel={activeQuestionRegionLabel}
            accessibilityRole="summary"
            aria-label={activeQuestionRegionLabel}
            key={question.id}
            style={styles.questionCard}
          >
            <View style={styles.questionHeader}>
              <Text style={styles.questionMeta}>{copy.questionNumber(questionNumber)}</Text>
              <Pressable
                aria-pressed={isFlagged}
                accessibilityLabel={
                  isFlagged
                    ? copy.unflagQuestionAccessibilityLabel(questionNumber)
                    : copy.flagQuestionAccessibilityLabel(questionNumber)
                }
                accessibilityRole="button"
                accessibilityState={{ checked: isFlagged }}
                onPress={() => toggleFlaggedQuestion(question.id)}
                style={[styles.flagButton, isFlagged ? styles.flagButtonActive : null]}
              >
                <Text
                  style={[styles.flagButtonText, isFlagged ? styles.flagButtonTextActive : null]}
                >
                  {isFlagged ? copy.flaggedQuestionLabel : copy.reviewBadge}
                </Text>
              </Pressable>
            </View>
            <ProvenanceBadge language={language} question={question} />
            <Text style={styles.questionText}>{getQuestionDisplayText(question, language)}</Text>
            <QuestionSourceCitation
              bodyStyle={styles.questionSourceCitation}
              citationText={getQuestionSourceCitation(question, language)}
              language={language}
              question={question}
            />
            <QuestionReportLink language={language} question={question} screen="exam" />
            <View
              aria-label={copy.answerGroupAccessibilityLabel(index + 1)}
              accessibilityLabel={copy.answerGroupAccessibilityLabel(index + 1)}
              accessibilityRole="radiogroup"
              style={styles.options}
            >
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                const optionText = language === 'en' ? option.textEn : option.textSv;
                return (
                  <Pressable
                    key={option.id}
                    aria-checked={isSelected}
                    accessibilityLabel={copy.answerAccessibilityLabel(optionText, index + 1)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => recordQuestionAnswer(question.id, option.id)}
                    style={[styles.option, isSelected ? styles.optionSelected : null]}
                  >
                    <Text
                      style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}
                    >
                      {optionText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Button
        aria-disabled={!canSubmit}
        accessibilityLabel={copy.submitAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={submitExam}
        style={styles.actionButton}
      >
        {copy.submitLabel}
      </Button>
    </ScrollView>
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
    sectionTitle: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    progressCard: {
      backgroundColor: themeColors.surfaceWarm,
      borderRadius: radius.card,
      gap: space[0.5],
      padding: space[2],
    },
    accessCard: {
      backgroundColor: themeColors.surfaceWarm,
      borderRadius: radius.card,
      gap: space[1.25],
      padding: space[2],
    },
    statusText: {
      color: themeColors.warning,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    questionCard: {
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
    },
    questionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: space[1],
    },
    questionMeta: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      textTransform: 'uppercase',
    },
    flagButton: {
      alignItems: 'center',
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: space[6],
      paddingHorizontal: space[1.5],
      paddingVertical: space[0.75],
    },
    flagButtonActive: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    flagButtonText: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    flagButtonTextActive: {
      color: themeColors.badgeBlueText,
    },
    questionText: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    questionSourceCitation: {
      color: themeColors.textDisclaimer,
      fontSize: typography.disclaimer.fontSize,
      lineHeight: typography.disclaimer.lineHeight,
    },
    options: {
      gap: space[1],
    },
    option: {
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: space[6],
      padding: space[1.5],
    },
    optionSelected: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    optionText: {
      color: themeColors.textSoft,
      fontSize: typography.navButton.fontSize,
    },
    optionTextSelected: {
      color: themeColors.badgeBlueText,
      fontWeight: typography.bodyBold.fontWeight,
    },
    actionButton: {
      minHeight: space[5] + space[0.5],
    },
    breakdownRow: {
      alignItems: 'center',
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: space[1.5],
    },
    breakdownLabel: {
      flex: 1,
      gap: space[0.5],
    },
    breakdownChapter: {
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    breakdownId: {
      color: themeColors.textMuted,
      fontSize: typography.badge.fontSize,
      textTransform: 'uppercase',
    },
    breakdownScore: {
      color: themeColors.textMuted,
      fontSize: typography.navButton.fontSize,
    },
    reviewCard: {
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
    },
    reviewCardFocused: {
      borderColor: themeColors.focus,
      borderWidth: space.hairline,
    },
    reviewHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      justifyContent: 'space-between',
    },
    reviewFilterPanel: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1],
      padding: space[1.5],
    },
    reviewFilterHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      justifyContent: 'space-between',
    },
    reviewFilterSummary: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    reviewFilterActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    reviewFilterButton: {
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
      minHeight: space[6],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
      justifyContent: 'center',
    },
    reviewFilterButtonSelected: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    reviewFilterButtonText: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    reviewFilterButtonTextSelected: {
      color: themeColors.badgeBlueText,
    },
    answerGrid: {
      gap: space[1],
    },
    answerCard: {
      backgroundColor: themeColors.surfaceWarm,
      borderRadius: radius.small,
      gap: space[0.5],
      padding: space[1.5],
    },
    answerLabel: {
      color: themeColors.textMuted,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      textTransform: 'uppercase',
    },
    answerText: {
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
  });
}
