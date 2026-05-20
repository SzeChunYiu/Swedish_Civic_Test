import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChapterProgressCard } from '../../components/ChapterProgressCard';
import { AudioButton } from '../../components/learning/AudioButton';
import { FeedbackAudioButton } from '../../components/learning/FeedbackAudioButton';
import { Badge } from '../../components/ui/Badge';
import { PracticeInterstitialAd } from '../../components/monetization/PracticeInterstitialAd';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { CelebrationBurst } from '../../components/quiz/CelebrationBurst';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { buildAnswerFeedbackSpeechText, buildQuestionSpeechText } from '../../lib/audio/speak';
import { filterQuestionsByProvenance } from '../../lib/content/provenance';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import {
  getCompletedQuestionIdsForQuestionBank,
  getMixedPracticeRoundQuestions,
  getPracticeChapterStats,
  getPracticeQuestionForSession,
  getPracticeQuestionsForChapter,
} from '../../lib/quiz/practiceFlow';
import {
  getPracticeInterstitialShowKey,
  usePracticeSessionStore,
} from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';

type PracticeHeaderControl = 'bookmark' | 'supplementary' | 'sources';

type PracticeScope =
  | { type: 'all' }
  | { type: 'chapter'; chapterId: string }
  | { type: 'quick'; questionIds: string[] };

type PracticeCopy = {
  badge: string;
  bookmark: string;
  bookmarked: string;
  bookmarkAccessibilityLabel: (isBookmarked: boolean) => string;
  chapterCardLabel: (chapterNumber: number) => string;
  chapterSectionTitle: string;
  chapterStartAccessibilityLabel: (
    chapterTitle: string,
    answeredCount: number,
    totalCount: number,
  ) => string;
  completedQuestions: (count: number) => string;
  emptyTitle: string;
  hubSubtitle: string;
  hubTitle: string;
  mockExamAccessibilityLabel: string;
  mockExamCta: string;
  practiceAll: string;
  practiceAllAccessibilityLabel: string;
  quickRoundAccessibilityLabel: (count: number) => string;
  quickRoundDescription: (count: number) => string;
  quickRoundStart: string;
  quickRoundTitle: string;
  scopeLabel: (scope: string) => string;
  nextQuestion: string;
  nextQuestionAccessibilityLabel: string;
  questionTitle: (questionNumber: number) => string;
  scoreLabel: string;
  subtitle: string;
  tryAgain: string;
  tryAgainAccessibilityLabel: string;
  supplementaryToggleOn: string;
  supplementaryToggleOff: string;
  provenanceUhrLabel: string;
  provenanceSupplementaryLabel: string;
  provenanceEditorialLabel: string;
  aboutSourcesShow: string;
  aboutSourcesHide: string;
  aboutSourcesUhrTitle: string;
  aboutSourcesUhrBody: string;
  aboutSourcesSupplementaryTitle: string;
  aboutSourcesSupplementaryBody: string;
  aboutSourcesEditorialTitle: string;
  aboutSourcesEditorialBody: string;
};

const practiceCopy: Record<AppLanguage, PracticeCopy> = {
  sv: {
    badge: '5-minutersövning',
    bookmark: 'Bokmärk',
    bookmarked: 'Bokmärkt',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Ta bort bokmärket från den här frågan' : 'Bokmärk den här frågan',
    chapterCardLabel: (chapterNumber) => `Kapitel ${chapterNumber}`,
    chapterSectionTitle: 'Öva per kapitel',
    chapterStartAccessibilityLabel: (chapterTitle, answeredCount, totalCount) =>
      `Starta frågepass för ${chapterTitle}. ${answeredCount} av ${totalCount} frågor besvarade.`,
    completedQuestions: (count) => `Besvarade frågor: ${count}`,
    emptyTitle: 'Det finns inga övningsfrågor ännu.',
    hubSubtitle:
      'Välj en snabb mix, fortsätt hela banken eller fokusera på ett kapitel innan frågorna börjar.',
    hubTitle: 'Välj hur du vill öva',
    mockExamAccessibilityLabel: 'Gå till övningsprovet',
    mockExamCta: 'Övningsprov',
    practiceAll: 'Hela frågebanken',
    practiceAllAccessibilityLabel: 'Öva med hela frågebanken',
    quickRoundAccessibilityLabel: (count) => `Starta snabbmix med ${count} frågor`,
    quickRoundDescription: (count) => `${count} frågor från dina synliga övningsfrågor.`,
    quickRoundStart: 'Starta snabbmix',
    quickRoundTitle: 'Snabbmix',
    scopeLabel: (scope) => `Aktivt läge: ${scope}`,
    nextQuestion: 'Nästa fråga',
    nextQuestionAccessibilityLabel: 'Gå till nästa övningsfråga',
    questionTitle: (questionNumber) => `Fråga ${questionNumber}`,
    scoreLabel: 'Poäng',
    subtitle: 'Besvara frågan, få direkt återkoppling och granska UHR-källan innan du går vidare.',
    tryAgain: 'Försök igen',
    tryAgainAccessibilityLabel: 'Försök igen med den här övningsfrågan',
    supplementaryToggleOn: 'Inkludera tilläggsfrågor',
    supplementaryToggleOff: 'Bara UHR-frågor',
    provenanceUhrLabel: 'UHR-källa',
    provenanceSupplementaryLabel: 'Tilläggsfråga',
    provenanceEditorialLabel: 'Redaktionell',
    aboutSourcesShow: 'Om källorna',
    aboutSourcesHide: 'Stäng om källorna',
    aboutSourcesUhrTitle: 'UHR-källa',
    aboutSourcesUhrBody:
      'Frågor som kommer direkt från UHR:s utbildningsmaterial Sverige i fokus. Allt innehåll i mock-provet är UHR.',
    aboutSourcesSupplementaryTitle: 'Tilläggsfråga',
    aboutSourcesSupplementaryBody:
      'Variant som genererats utifrån en UHR-fråga för att öva samma kunskap från en annan vinkel. Visas bara om du slår på tilläggsfrågor.',
    aboutSourcesEditorialTitle: 'Redaktionell',
    aboutSourcesEditorialBody:
      'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av mock-provet.',
  },
  en: {
    badge: '5-minute practice',
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Remove this question bookmark' : 'Bookmark this question',
    chapterCardLabel: (chapterNumber) => `Chapter ${chapterNumber}`,
    chapterSectionTitle: 'Practice by chapter',
    chapterStartAccessibilityLabel: (chapterTitle, answeredCount, totalCount) =>
      `Start a practice round for ${chapterTitle}. ${answeredCount} of ${totalCount} questions practiced.`,
    completedQuestions: (count) => `Completed questions: ${count}`,
    emptyTitle: 'No practice questions are available yet.',
    hubSubtitle:
      'Choose a quick mix, continue the full bank, or focus on one chapter before the questions begin.',
    hubTitle: 'Choose how to practise',
    mockExamAccessibilityLabel: 'Go to the mock exam',
    mockExamCta: 'Mock exam',
    practiceAll: 'Full question bank',
    practiceAllAccessibilityLabel: 'Practise with the full question bank',
    quickRoundAccessibilityLabel: (count) => `Start a quick mix with ${count} questions`,
    quickRoundDescription: (count) => `${count} questions from your visible practice bank.`,
    quickRoundStart: 'Start quick mix',
    quickRoundTitle: 'Quick mix',
    scopeLabel: (scope) => `Active mode: ${scope}`,
    nextQuestion: 'Next question',
    nextQuestionAccessibilityLabel: 'Move to the next practice question',
    questionTitle: (questionNumber) => `Question ${questionNumber}`,
    scoreLabel: 'Score',
    subtitle: 'Answer, get instant feedback, then review the UHR source before moving on.',
    tryAgain: 'Try again',
    tryAgainAccessibilityLabel: 'Try this practice question again',
    supplementaryToggleOn: 'Include supplementary questions',
    supplementaryToggleOff: 'UHR questions only',
    provenanceUhrLabel: 'UHR source',
    provenanceSupplementaryLabel: 'Supplementary',
    provenanceEditorialLabel: 'Editorial',
    aboutSourcesShow: 'About the sources',
    aboutSourcesHide: 'Close source details',
    aboutSourcesUhrTitle: 'UHR source',
    aboutSourcesUhrBody:
      "Questions traced directly to UHR's study material Sverige i fokus. The mock exam is always UHR-only.",
    aboutSourcesSupplementaryTitle: 'Supplementary',
    aboutSourcesSupplementaryBody:
      'Variant generated from a UHR question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    aboutSourcesEditorialTitle: 'Editorial',
    aboutSourcesEditorialBody:
      'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
  },
};

function getPracticeCelebrationStreak(
  selectedIsCorrect: boolean,
  question: { id: string },
  questionProgress: Record<string, { correctStreak?: number } | undefined>,
) {
  const celebrationStreak = selectedIsCorrect
    ? (questionProgress[question.id]?.correctStreak ?? 1)
    : 0;

  return celebrationStreak;
}

export default function Screen() {
  const activeQuestionId = usePracticeSessionStore((state) => state.activeQuestionId);
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const advanceQuestion = usePracticeSessionStore((state) => state.advanceQuestion);
  const shuffleSessionId = usePracticeSessionStore((state) => state.shuffleSessionId);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const toggleBookmark = useProgressStore((state) => state.toggleBookmark);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const includeSupplementary = useSettingsStore((state) => state.includeSupplementaryQuestions);
  const setIncludeSupplementary = useSettingsStore(
    (state) => state.setIncludeSupplementaryQuestions,
  );
  const [aboutSourcesOpen, setAboutSourcesOpen] = useState(false);
  const [practiceScope, setPracticeScope] = useState<PracticeScope>({ type: 'all' });
  const [focusedHeaderControl, setFocusedHeaderControl] = useState<PracticeHeaderControl | null>(
    null,
  );
  const copy = practiceCopy[language];
  const filteredQuestions = useMemo(
    () => filterQuestionsByProvenance(questions, { includeSupplementary }),
    [includeSupplementary],
  );
  const quickRoundQuestions = useMemo(
    () => getMixedPracticeRoundQuestions(filteredQuestions, completedQuestionIds, 10),
    [completedQuestionIds, filteredQuestions],
  );
  const scopedQuestions = useMemo(() => {
    if (practiceScope.type === 'chapter') {
      return getPracticeQuestionsForChapter(filteredQuestions, practiceScope.chapterId);
    }

    if (practiceScope.type === 'quick') {
      const quickQuestionIds = new Set(practiceScope.questionIds);
      return filteredQuestions.filter((candidate) => quickQuestionIds.has(candidate.id));
    }

    return filteredQuestions;
  }, [filteredQuestions, practiceScope]);
  const visibleCompletedQuestionIds = useMemo(
    () => getCompletedQuestionIdsForQuestionBank(scopedQuestions, completedQuestionIds),
    [completedQuestionIds, scopedQuestions],
  );
  const rawQuestion = getPracticeQuestionForSession(
    scopedQuestions,
    visibleCompletedQuestionIds,
    activeQuestionId,
  );
  const question = useMemo(
    () =>
      rawQuestion ? shuffleQuestionOptionsForSession(rawQuestion, shuffleSessionId) : undefined,
    [rawQuestion, shuffleSessionId],
  );
  const chapterHubRows = useMemo(
    () =>
      chapters.map((chapter, index) => ({
        chapter,
        index,
        stats: getPracticeChapterStats(filteredQuestions, chapter.id, questionProgress),
      })),
    [filteredQuestions, questionProgress],
  );
  const currentScopeTitle = useMemo(() => {
    if (practiceScope.type === 'quick') return copy.quickRoundTitle;
    if (practiceScope.type === 'chapter') {
      const selectedChapter = chapters.find((chapter) => chapter.id === practiceScope.chapterId);
      if (selectedChapter) {
        return language === 'en' ? selectedChapter.nameEn : selectedChapter.nameSv;
      }
    }

    return copy.practiceAll;
  }, [copy, language, practiceScope]);
  const handleStartAllQuestions = () => {
    setPracticeScope({ type: 'all' });
    advanceQuestion();
  };
  const handleStartQuickRound = () => {
    setPracticeScope({
      type: 'quick',
      questionIds: quickRoundQuestions.map((candidate) => candidate.id),
    });
    advanceQuestion();
  };
  const handleStartChapter = (chapterId: string) => {
    setPracticeScope({ type: 'chapter', chapterId });
    advanceQuestion();
  };

  const hasSelectedAnswer = Boolean(
    question && selectedOptionId && activeQuestionId === question.id,
  );
  const selectedIsCorrect =
    question && hasSelectedAnswer && selectedOptionId
      ? isCorrectAnswer(question, selectedOptionId)
      : false;
  const isBookmarked = Boolean(question ? questionProgress[question.id]?.bookmarked : false);
  const currentScore = hasSelectedAnswer ? scoreAnswers([selectedIsCorrect]) : null;
  const practiceInterstitialShowKey = question
    ? getPracticeInterstitialShowKey(question.id, shuffleSessionId)
    : '';
  const celebrationStreak = question
    ? getPracticeCelebrationStreak(selectedIsCorrect, question, questionProgress)
    : 0;
  const questionIndex = question
    ? scopedQuestions.findIndex((candidate) => candidate.id === question.id)
    : -1;
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress = scopedQuestions.length > 0 ? questionNumber / scopedQuestions.length : 0;
  const handleSelectOption = (optionId: string) => {
    if (!question) return;

    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);

    selectOption(question.id, optionId);
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
      <View style={styles.hub}>
        <Badge>{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.hubTitle}>
          {copy.hubTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.hubSubtitle}</Text>
        <View style={styles.hubActions}>
          <Button
            accessibilityLabel={copy.quickRoundAccessibilityLabel(quickRoundQuestions.length)}
            accessibilityRole="button"
            disabled={quickRoundQuestions.length === 0}
            onPress={handleStartQuickRound}
            style={styles.hubAction}
          >
            {copy.quickRoundStart}
          </Button>
          <Button
            accessibilityLabel={copy.practiceAllAccessibilityLabel}
            accessibilityRole="button"
            onPress={handleStartAllQuestions}
            style={styles.hubAction}
            variant="secondary"
          >
            {copy.practiceAll}
          </Button>
          <Link
            accessibilityLabel={copy.mockExamAccessibilityLabel}
            accessibilityRole="link"
            asChild
            href="/exam"
          >
            <Button
              accessibilityLabel={copy.mockExamAccessibilityLabel}
              accessibilityRole="link"
              style={styles.hubAction}
              variant="secondary"
            >
              {copy.mockExamCta}
            </Button>
          </Link>
        </View>
        <View style={styles.quickRoundCard}>
          <Text style={styles.quickRoundTitle}>{copy.quickRoundTitle}</Text>
          <Text style={styles.quickRoundDescription}>
            {copy.quickRoundDescription(quickRoundQuestions.length)}
          </Text>
          <Text accessibilityLiveRegion="polite" aria-live="polite" style={styles.meta}>
            {copy.scopeLabel(currentScopeTitle)}
          </Text>
        </View>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.chapterSectionTitle}
        </Text>
        <View style={styles.chapterGrid}>
          {chapterHubRows.map(({ chapter, index, stats }) => {
            const chapterTitle = language === 'en' ? chapter.nameEn : chapter.nameSv;
            const chapterSubtitle =
              language === 'en' ? chapter.descriptionEn : chapter.descriptionSv;

            return (
              <ChapterProgressCard
                key={chapter.id}
                accessibilityLabel={copy.chapterStartAccessibilityLabel(
                  chapterTitle,
                  stats.answeredCount,
                  stats.totalCount,
                )}
                answeredCount={stats.answeredCount}
                chapterLabel={copy.chapterCardLabel(index + 1)}
                correctCount={stats.correctCount}
                disabled={stats.totalCount === 0}
                languageOverride={language}
                onPress={() => handleStartChapter(chapter.id)}
                subtitle={chapterSubtitle}
                title={chapterTitle}
                totalCount={stats.totalCount}
              />
            );
          })}
        </View>
      </View>
      {question ? (
        <>
          <View style={styles.hero}>
            <Badge>{currentScopeTitle}</Badge>
            <Text accessibilityRole="header" style={styles.title}>
              {copy.questionTitle(questionNumber)}
            </Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            <ProgressBar language={language} progress={bankProgress} />
            <Text style={styles.meta}>
              {copy.completedQuestions(visibleCompletedQuestionIds.length)}
            </Text>
            <View style={styles.headerControls}>
              <Pressable
                android_ripple={{ color: colors.focusSoft }}
                aria-selected={isBookmarked}
                accessibilityLabel={copy.bookmarkAccessibilityLabel(isBookmarked)}
                accessibilityRole="button"
                accessibilityState={{ selected: isBookmarked }}
                hitSlop={space[1]}
                onBlur={() => setFocusedHeaderControl(null)}
                onFocus={() => setFocusedHeaderControl('bookmark')}
                onPress={() => toggleBookmark(question.id)}
                style={({ pressed }) => [
                  styles.bookmarkButton,
                  isBookmarked ? styles.bookmarkButtonActive : null,
                  focusedHeaderControl === 'bookmark' ? styles.headerControlFocused : null,
                  pressed ? styles.headerControlPressed : null,
                ]}
              >
                <Text
                  style={[styles.bookmarkText, isBookmarked ? styles.bookmarkTextActive : null]}
                >
                  {isBookmarked ? copy.bookmarked : copy.bookmark}
                </Text>
              </Pressable>
              <Pressable
                android_ripple={{ color: colors.focusSoft }}
                aria-checked={includeSupplementary}
                accessibilityRole="switch"
                accessibilityState={{ checked: includeSupplementary }}
                accessibilityLabel={
                  includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff
                }
                hitSlop={space[1]}
                onBlur={() => setFocusedHeaderControl(null)}
                onFocus={() => setFocusedHeaderControl('supplementary')}
                onPress={() => setIncludeSupplementary(!includeSupplementary)}
                style={({ pressed }) => [
                  styles.bookmarkButton,
                  includeSupplementary ? styles.bookmarkButtonActive : null,
                  focusedHeaderControl === 'supplementary' ? styles.headerControlFocused : null,
                  pressed ? styles.headerControlPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.bookmarkText,
                    includeSupplementary ? styles.bookmarkTextActive : null,
                  ]}
                >
                  {includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff}
                </Text>
              </Pressable>
              <Pressable
                android_ripple={{ color: colors.focusSoft }}
                aria-expanded={aboutSourcesOpen}
                accessibilityRole="button"
                accessibilityState={{ expanded: aboutSourcesOpen }}
                accessibilityLabel={
                  aboutSourcesOpen ? copy.aboutSourcesHide : copy.aboutSourcesShow
                }
                hitSlop={space[1]}
                onBlur={() => setFocusedHeaderControl(null)}
                onFocus={() => setFocusedHeaderControl('sources')}
                onPress={() => setAboutSourcesOpen((value) => !value)}
                style={({ pressed }) => [
                  styles.aboutSourcesTrigger,
                  focusedHeaderControl === 'sources' ? styles.headerControlFocused : null,
                  pressed ? styles.headerControlPressed : null,
                ]}
              >
                <Text style={styles.aboutSourcesTriggerText}>
                  {aboutSourcesOpen ? copy.aboutSourcesHide : copy.aboutSourcesShow}
                </Text>
              </Pressable>
            </View>
            {aboutSourcesOpen ? (
              <View accessibilityRole="text" style={styles.aboutSourcesPanel}>
                <Text style={styles.aboutSourcesItemTitle}>{copy.aboutSourcesUhrTitle}</Text>
                <Text style={styles.aboutSourcesItemBody}>{copy.aboutSourcesUhrBody}</Text>
                <Text style={styles.aboutSourcesItemTitle}>
                  {copy.aboutSourcesSupplementaryTitle}
                </Text>
                <Text style={styles.aboutSourcesItemBody}>
                  {copy.aboutSourcesSupplementaryBody}
                </Text>
                <Text style={styles.aboutSourcesItemTitle}>{copy.aboutSourcesEditorialTitle}</Text>
                <Text style={styles.aboutSourcesItemBody}>{copy.aboutSourcesEditorialBody}</Text>
              </View>
            ) : null}
          </View>
          <QuestionDisclaimer />
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
                  selected={hasSelectedAnswer && selectedOptionId === option.id}
                  tone={feedback.tone}
                />
              );
            })}
          </View>

          {hasSelectedAnswer ? (
            <View style={styles.feedback}>
              <CelebrationBurst
                active={selectedIsCorrect}
                languageOverride={language}
                streak={celebrationStreak}
              />
              {currentScore ? (
                <Text style={styles.score}>
                  {copy.scoreLabel}: {currentScore.correct}/{currentScore.total}
                </Text>
              ) : null}
              <ExplanationPanel
                explanationEn={question.explanationEn}
                explanationSv={question.explanationSv}
                language={language}
              />
              <FeedbackAudioButton
                enabled={audioEnabled}
                language={language}
                text={buildAnswerFeedbackSpeechText(question, selectedOptionId)}
              />
              <UHRReferenceCard language={language} reference={question.uhrReference} />
              <PracticeInterstitialAd showKey={practiceInterstitialShowKey} />
              <RemoveAdsPlacementCta placement="quiz_completed_interstitial" />
              <View style={styles.feedbackActions}>
                <Button
                  accessibilityLabel={copy.nextQuestionAccessibilityLabel}
                  accessibilityRole="button"
                  onPress={advanceQuestion}
                  style={styles.feedbackButton}
                >
                  {copy.nextQuestion}
                </Button>
                <Button
                  accessibilityLabel={copy.tryAgainAccessibilityLabel}
                  accessibilityRole="button"
                  onPress={resetSelection}
                  style={styles.feedbackButton}
                  variant="secondary"
                >
                  {copy.tryAgain}
                </Button>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text>{copy.emptyTitle}</Text>
        </View>
      )}
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
    flex: 1,
    padding: space[3],
  },
  hub: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[3],
  },
  hubTitle: {
    color: colors.text,
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    lineHeight: typography.sectionHeading.lineHeight,
  },
  hubActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  hubAction: {
    flexGrow: 1,
    minWidth: space[15],
  },
  quickRoundCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.5],
    padding: space[2],
  },
  quickRoundTitle: {
    color: colors.text,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyBold.lineHeight,
  },
  quickRoundDescription: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  chapterGrid: {
    gap: space[1.25],
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
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  provenanceBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    overflow: 'hidden',
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
    textTransform: 'uppercase',
  },
  provenanceUhr: {
    backgroundColor: colors.badgeBlueBg,
    color: colors.badgeBlueText,
  },
  provenanceSupplementary: {
    backgroundColor: colors.surfaceWarm,
    color: colors.text,
  },
  provenanceEditorial: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  aboutSourcesTrigger: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  aboutSourcesTriggerText: {
    color: colors.accent,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  aboutSourcesPanel: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.5],
    padding: space[1.5],
  },
  aboutSourcesItemTitle: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  aboutSourcesItemBody: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginBottom: space[0.5],
  },
  headerControls: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  headerControlFocused: {
    borderColor: colors.focus,
  },
  headerControlPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  bookmarkButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  bookmarkButtonActive: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
  },
  bookmarkText: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bookmarkTextActive: {
    color: colors.badgeBlueText,
  },
  options: {
    gap: space[1],
  },
  feedback: {
    gap: space[1.5],
  },
  feedbackActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  feedbackButton: {
    minHeight: space[5] + space[0.5],
  },
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
});
