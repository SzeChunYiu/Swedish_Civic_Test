import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Badge } from '../../components/ui/Badge';
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
import { getQuestionDisplayText } from '../../lib/quiz/questionText';
import { useMockExamAccess } from '../../lib/monetization/useMockExamAccess';
import type { MockExamAccessReason } from '../../lib/monetization/rewardedExam';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

function getAccessStatusText(reason: MockExamAccessReason): string {
  switch (reason) {
    case 'free_exam_available':
      return 'Daily free mock exam available.';
    case 'premium_unlimited_mock_exams':
      return 'Unlimited mock exams active.';
    case 'rewarded_exam_credit':
      return 'Extra mock exam unlocked.';
    case 'rewarded_ad_available':
      return 'Daily free mock exam used. Extra exam available.';
    case 'remove_ads_active':
      return 'Daily free mock exam used. Rewarded ads are hidden.';
    case 'consent_required':
      return 'Ad consent is needed before an extra exam can be unlocked.';
    case 'ads_unavailable':
      return 'Extra mock exams are unavailable right now.';
  }
}

function getRewardedAdStatusText(status: RewardedExtraExamAdStatus): string {
  switch (status) {
    case 'closed_without_reward':
      return 'Extra mock exam unlock needs a completed rewarded ad.';
    case 'earned_reward':
      return 'Extra mock exam unlocked.';
    case 'failed_to_load':
      return 'Rewarded ad could not load right now.';
    case 'show_failed':
      return 'Rewarded ad could not be shown right now.';
    case 'timed_out':
      return 'Rewarded ad timed out before the extra exam unlocked.';
    case 'unavailable':
      return 'Rewarded ad is unavailable on this device right now.';
  }
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
  const [submitted, setSubmitted] = useState(false);
  const [examUnlocked, setExamUnlocked] = useState(false);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [accessStatusMessage, setAccessStatusMessage] = useState<string | null>(null);
  const [startingAccessibleExam, setStartingAccessibleExam] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    defaultMockExamConfig.durationMinutes * 60,
  );
  const language = useSettingsStore((state) => state.language);
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
    if (submitted || remainingSeconds <= 0) return undefined;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, submitted]);

  useEffect(() => {
    if (
      shouldAutoSubmitExam({
        remainingSeconds,
        submitted,
        questionCount: examQuestions.length,
      })
    ) {
      setSubmitted(true);
    }
  }, [examQuestions.length, remainingSeconds, submitted]);

  useEffect(() => {
    if (examUnlocked || submitted || accessLoading) return;
    if (accessDecision.canStartExam && accessDecision.reason !== 'rewarded_exam_credit') {
      setExamUnlocked(true);
    }
  }, [accessDecision.canStartExam, accessDecision.reason, accessLoading, examUnlocked, submitted]);

  const result = submitted ? scoreExam(examQuestions, answers) : null;
  const chapterBreakdown = result
    ? buildExamChapterBreakdownItems(result.chapterBreakdown, chapters)
    : [];
  const reviewItems = result ? buildExamReviewItems(examQuestions, answers) : [];
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === examQuestions.length && examQuestions.length > 0;
  const endedByTime = Boolean(result && remainingSeconds <= 0);
  const shouldAttemptRewardedAd =
    accessDecision.canOfferRewardedAd || accessDecision.reason === 'consent_required';
  const startAccessibleExamLabel = shouldAttemptRewardedAd
    ? 'Unlock extra exam'
    : accessDecision.reason === 'rewarded_exam_credit'
      ? 'Start unlocked extra exam'
      : 'Start mock exam';
  const canStartAccessibleExam =
    !accessLoading &&
    (accessDecision.canStartExam ||
      shouldAttemptRewardedAd ||
      accessDecision.reason === 'rewarded_exam_credit');
  const accessStatusText = accessLoading
    ? 'Checking mock exam access.'
    : getAccessStatusText(accessDecision.reason);

  const resetExamAttempt = useCallback(() => {
    setExamAttemptIndex((current) => current + 1);
    setAnswers({});
    setSubmitted(false);
    setCompletionRecorded(false);
    setRemainingSeconds(defaultMockExamConfig.durationMinutes * 60);
    setExamUnlocked(true);
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
          setAccessStatusMessage(getRewardedAdStatusText(rewardedAdResult.status));
          return;
        }

        await grantRewardedExamCredit();
        await consumeRewardedExamCredit();
      } else if (!accessDecision.canStartExam) {
        setAccessStatusMessage('Extra mock exams are unavailable right now.');
        return;
      }

      resetExamAttempt();
    } catch {
      setAccessStatusMessage('Extra mock exam could not be unlocked right now.');
    } finally {
      setStartingAccessibleExam(false);
    }
  }, [
    accessDecision.canStartExam,
    accessDecision.reason,
    canStartAccessibleExam,
    consumeRewardedExamCredit,
    entitlements,
    grantRewardedExamCredit,
    resetExamAttempt,
    shouldAttemptRewardedAd,
    startingAccessibleExam,
  ]);

  useEffect(() => {
    if (!submitted || completionRecorded) return undefined;

    let isMounted = true;
    void recordExamCompletion()
      .then(() => {
        if (isMounted) setCompletionRecorded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setCompletionRecorded(true);
        setAccessStatusMessage('Mock exam completion could not be stored on this device.');
      });

    return () => {
      isMounted = false;
    };
  }, [completionRecorded, recordExamCompletion, submitted]);

  if (!result && !examUnlocked) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Badge tone="orange">Timed simulation</Badge>
          <Text accessibilityRole="header" style={styles.title}>
            Mock exam
          </Text>
          <Text style={styles.subtitle}>
            Time limit {defaultMockExamConfig.durationMinutes} minutes · {examQuestions.length}{' '}
            UHR-based questions · no ads during exam
          </Text>
        </View>
        <QuestionDisclaimer />
        <View style={styles.accessCard}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Exam access
          </Text>
          <Text style={styles.subtitle}>{accessStatusText}</Text>
          {accessStatusMessage ? (
            <Text style={styles.statusText}>{accessStatusMessage}</Text>
          ) : null}
          <Pressable
            aria-disabled={!canStartAccessibleExam || startingAccessibleExam}
            accessibilityLabel={startAccessibleExamLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canStartAccessibleExam || startingAccessibleExam }}
            disabled={!canStartAccessibleExam || startingAccessibleExam}
            onPress={handleStartAccessibleExam}
            style={[
              styles.primaryButton,
              !canStartAccessibleExam || startingAccessibleExam
                ? styles.primaryButtonDisabled
                : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>{startAccessibleExamLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Badge tone={result.percent >= 75 && !endedByTime ? 'green' : 'orange'}>
            {endedByTime ? 'Time expired' : 'Mock exam result'}
          </Badge>
          <Text accessibilityRole="header" style={styles.title}>
            Exam result
          </Text>
          <Text style={styles.subtitle}>
            Explanations and review are shown only after the exam is submitted.
            {endedByTime
              ? ' Unanswered questions count as incorrect and are marked Not answered.'
              : ''}
          </Text>
        </View>
        <QuestionDisclaimer />
        <View style={styles.resultCard}>
          <Text style={styles.metric}>{result.percent}%</Text>
          <Text style={styles.subtitle}>
            {result.correctCount}/{result.totalCount} correct
          </Text>
          <Text style={styles.resultNote}>
            Submitted results are final. Start another mock exam for a fresh attempt.
          </Text>
        </View>
        <View style={styles.accessCard}>
          <View style={styles.reviewHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Next exam
            </Text>
            <Badge tone={accessDecision.canStartExam ? 'green' : 'warm'}>
              {completionRecorded ? 'Saved' : 'Saving'}
            </Badge>
          </View>
          <Text style={styles.subtitle}>
            {completionRecorded ? accessStatusText : "Saving today's mock exam completion."}
          </Text>
          {accessStatusMessage ? (
            <Text style={styles.statusText}>{accessStatusMessage}</Text>
          ) : null}
          <Pressable
            aria-disabled={!completionRecorded || !canStartAccessibleExam || startingAccessibleExam}
            accessibilityLabel={startAccessibleExamLabel}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !completionRecorded || !canStartAccessibleExam || startingAccessibleExam,
            }}
            disabled={!completionRecorded || !canStartAccessibleExam || startingAccessibleExam}
            onPress={handleStartAccessibleExam}
            style={[
              styles.secondaryButton,
              !completionRecorded || !canStartAccessibleExam || startingAccessibleExam
                ? styles.primaryButtonDisabled
                : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{startAccessibleExamLabel}</Text>
          </Pressable>
        </View>

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Chapter breakdown
        </Text>
        {chapterBreakdown.map((chapter) => (
          <View key={chapter.chapterId} style={styles.breakdownRow}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownChapter}>{chapter.chapterNameSv}</Text>
              <Text style={styles.breakdownId}>{chapter.chapterId}</Text>
            </View>
            <Text style={styles.breakdownScore}>
              {chapter.correctCount}/{chapter.totalCount}
            </Text>
          </View>
        ))}

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Question review
        </Text>
        {reviewItems.map((item, index) => (
          <View key={item.questionId} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.questionMeta}>Question {index + 1}</Text>
              <Badge tone={item.isCorrect ? 'green' : 'orange'}>
                {item.isCorrect ? 'Correct' : 'Review'}
              </Badge>
            </View>
            <Text style={styles.questionText}>{getQuestionDisplayText(item, language)}</Text>
            <View style={styles.answerGrid}>
              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>Selected answer</Text>
                <Text style={styles.answerText}>
                  {language === 'en' ? item.selectedOptionTextEn : item.selectedOptionTextSv}
                </Text>
              </View>
              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>Correct answer</Text>
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
        <Badge tone="orange">Timed simulation</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          Mock exam
        </Text>
        <Text style={styles.subtitle}>
          Time left {formatExamTime(remainingSeconds)} · {examQuestions.length} UHR-based questions
          · no ads during exam
        </Text>
        <ProgressBar
          progress={examQuestions.length > 0 ? answeredCount / examQuestions.length : 0}
        />
      </View>
      <QuestionDisclaimer />

      <View style={styles.progressCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Progress
        </Text>
        <Text style={styles.subtitle}>
          {answeredCount}/{examQuestions.length} answered
        </Text>
      </View>

      {examQuestions.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionMeta}>Question {index + 1}</Text>
          <Text style={styles.questionText}>{getQuestionDisplayText(question, language)}</Text>
          <View style={styles.options}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id;
              const optionText = language === 'en' ? option.textEn : option.textSv;
              return (
                <Pressable
                  key={option.id}
                  aria-selected={isSelected}
                  accessibilityLabel={`Select answer ${optionText} for question ${index + 1}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() =>
                    setAnswers((current) => ({ ...current, [question.id]: option.id }))
                  }
                  style={[styles.option, isSelected ? styles.optionSelected : null]}
                >
                  <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                    {optionText}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        aria-disabled={!canSubmit}
        accessibilityLabel="Submit mock exam"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={() => setSubmitted(true)}
        style={[styles.primaryButton, !canSubmit ? styles.primaryButtonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>Submit exam</Text>
      </Pressable>
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
  options: {
    gap: space[1],
  },
  option: {
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[1.5],
  },
  optionSelected: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  optionText: {
    color: colors.textSoft,
    fontSize: typography.navButton.fontSize,
  },
  optionTextSelected: {
    color: colors.badgeBlueText,
    fontWeight: typography.bodyBold.fontWeight,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  resultCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    padding: space[2],
  },
  metric: {
    color: colors.text,
    fontSize: typography.subHeadingLarge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  resultNote: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[1],
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
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
