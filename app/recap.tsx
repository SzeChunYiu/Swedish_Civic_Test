import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceActionLink } from '../components/compliance/ComplianceActionLink';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import { generateWeeklyRecap, type WeeklyRecap } from '../lib/learning/weeklyRecap';
import { calculateStreakWithFreeze } from '../lib/learning/streakWithFreeze';
import { topWeakChapters } from '../lib/learning/weakChapters';
import {
  useProgressStore,
  type AnswerHistoryEntry,
  type MockExamProgress,
} from '../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';
import type { QuizSession, UserProgress } from '../types/progress';

type RecapCopy = {
  accuracyHelper: string;
  accuracyLabel: string;
  backToProfile: string;
  backToProfileAccessibilityLabel: string;
  bestMockScore: (scorePercent: number) => string;
  eyebrow: string;
  mistakesResolvedLabel: string;
  mockExamsLabel: string;
  noAccuracy: string;
  practiceWeakChapter: (chapterName: string) => string;
  practiceWeakChapterAccessibilityLabel: (chapterName: string) => string;
  questionsAnsweredLabel: string;
  quietBody: string;
  quietTitle: string;
  subtitle: string;
  title: string;
  weekRange: (start: string, end: string) => string;
  weakChapterBody: (chapterName: string) => string;
  weakChapterTitle: string;
};

const recapCopy: Record<AppLanguage, RecapCopy> = {
  sv: {
    accuracyHelper: 'rätt den här veckan',
    accuracyLabel: 'träffsäkerhet',
    backToProfile: 'Tillbaka till profil',
    backToProfileAccessibilityLabel: 'Gå tillbaka till profilsidan',
    bestMockScore: (scorePercent) => `bästa resultat ${scorePercent}%`,
    eyebrow: 'Veckans översikt',
    mistakesResolvedLabel: 'rättade misstag',
    mockExamsLabel: 'övningsprov',
    noAccuracy: 'Inte än',
    practiceWeakChapter: (chapterName) => `Öva ${chapterName}`,
    practiceWeakChapterAccessibilityLabel: (chapterName) =>
      `Öva kapitlet ${chapterName} från veckans översikt`,
    questionsAnsweredLabel: 'svarade frågor',
    quietBody: 'Inga problem. En lugn vecka räknas också; börja med några frågor när det passar.',
    quietTitle: 'Lugn vecka',
    subtitle: 'En lokal summering av veckans svar, övningsprov och nästa rimliga repetition.',
    title: 'Din vecka i studierna',
    weekRange: (start, end) => `${start} till ${end}`,
    weakChapterBody: (chapterName) =>
      `${chapterName} dök upp i veckans svar och är ett bra nästa steg för repetition.`,
    weakChapterTitle: 'Nästa lugna repetition',
  },
  en: {
    accuracyHelper: 'correct this week',
    accuracyLabel: 'accuracy',
    backToProfile: 'Back to Profile',
    backToProfileAccessibilityLabel: 'Go back to the Profile page',
    bestMockScore: (scorePercent) => `best score ${scorePercent}%`,
    eyebrow: 'Weekly recap',
    mistakesResolvedLabel: 'mistakes resolved',
    mockExamsLabel: 'mock exams',
    noAccuracy: 'Not yet',
    practiceWeakChapter: (chapterName) => `Practise ${chapterName}`,
    practiceWeakChapterAccessibilityLabel: (chapterName) =>
      `Practise the chapter ${chapterName} from this weekly recap`,
    questionsAnsweredLabel: 'questions answered',
    quietBody: 'No problem. A quiet week still counts; start with a few questions when it fits.',
    quietTitle: 'Quiet week',
    subtitle: 'A local summary of this week’s answers, mock exams, and next sensible review.',
    title: 'Your study week',
    weekRange: (start, end) => `${start} to ${end}`,
    weakChapterBody: (chapterName) =>
      `${chapterName} appeared in this week’s answers and is a good next review step.`,
    weakChapterTitle: 'Next calm review',
  },
};

const questionChapterIndex = Object.fromEntries(
  questions.map((question) => [question.id, question.chapterId]),
);
const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

function formatDateKey(dateKey: string, language: AppLanguage): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;

  return new Intl.DateTimeFormat(language === 'sv' ? 'sv-SE' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day));
}

function formatPercent(value: number | null, fallback: string): string {
  return value === null ? fallback : `${Math.round(value * 100)}%`;
}

function buildWeeklyRecapProgress({
  answerHistory,
  currentStreak,
  dailyChallengeCompletions,
  dailyGoalAnswers,
  mockExamSessions,
  questionProgress,
  totalXp,
}: Pick<
  UserProgress,
  | 'currentStreak'
  | 'dailyChallengeCompletions'
  | 'dailyGoalAnswers'
  | 'questionProgress'
  | 'totalXp'
> & {
  answerHistory: AnswerHistoryEntry[];
  mockExamSessions: MockExamProgress[];
}): UserProgress {
  const answerSession: QuizSession = {
    answers: answerHistory.map((answer) => ({
      answeredAt: answer.answeredAt,
      confidenceRating: answer.confidenceRating,
      isCorrect: answer.isCorrect,
      questionId: answer.questionId,
      selectedOptionIds: [],
      timeSpentSeconds: answer.timeSpentSeconds ?? 0,
    })),
    id: 'weekly-answer-history',
    mode: 'study',
    questionIds: answerHistory.map((answer) => answer.questionId),
    startedAt: answerHistory[0]?.answeredAt ?? new Date().toISOString(),
  };
  const mockSessions: QuizSession[] = mockExamSessions.map((session) => ({
    answers: [],
    completedAt: session.completedAt,
    id: session.sessionId,
    mode: 'exam',
    questionIds: session.questionTimings.map((timing) => timing.questionId),
    score: session.score,
    startedAt: session.completedAt,
  }));

  return {
    currentStreak,
    dailyChallengeCompletions,
    dailyGoalAnswers,
    level: 1,
    questionProgress,
    sessions: [answerSession, ...mockSessions],
    totalXp,
  };
}

function getTouchedWeakChapter(recap: WeeklyRecap, progress: UserProgress) {
  const touchedChapters = new Set(recap.chaptersTouched);
  if (touchedChapters.size === 0) return null;

  return (
    topWeakChapters(
      {
        chapters,
        progress,
        questionChapterIndex,
      },
      chapters.length,
    ).find((chapter) => touchedChapters.has(chapter.chapterId)) ?? null
  );
}

function chapterName(chapterId: string, language: AppLanguage): string {
  const chapter = chapterById.get(chapterId);
  if (!chapter) return chapterId;
  return language === 'sv' ? chapter.nameSv : chapter.nameEn;
}

export default function Screen() {
  const answerHistory = useProgressStore((state) => state.answerHistory);
  const dailyChallengeCompletions = useProgressStore((state) => state.dailyChallengeCompletions);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const streakFreezeState = useProgressStore((state) => state.streakFreezeState);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = recapCopy[language];
  const streakWithFreeze = useMemo(
    () =>
      calculateStreakWithFreeze({
        activeDayKeys: answerDates,
        freezeState: streakFreezeState,
      }),
    [answerDates, streakFreezeState],
  );
  const currentStreak = streakWithFreeze.streakDays;
  const progress = useMemo(
    () =>
      buildWeeklyRecapProgress({
        answerHistory,
        currentStreak,
        dailyChallengeCompletions,
        dailyGoalAnswers,
        mockExamSessions,
        questionProgress,
        totalXp,
      }),
    [
      answerHistory,
      currentStreak,
      dailyChallengeCompletions,
      dailyGoalAnswers,
      mockExamSessions,
      questionProgress,
      totalXp,
    ],
  );
  const recap = useMemo(() => generateWeeklyRecap({ progress, questionChapterIndex }), [progress]);
  const touchedWeakChapter = useMemo(
    () => getTouchedWeakChapter(recap, progress),
    [progress, recap],
  );
  const touchedWeakChapterName = touchedWeakChapter
    ? chapterName(touchedWeakChapter.chapterId, language)
    : null;
  const accuracyValue = formatPercent(recap.accuracy, copy.noAccuracy);
  const bestMockScore =
    recap.bestMockScore === null
      ? undefined
      : copy.bestMockScore(Math.round(recap.bestMockScore * 100));
  const weekStart = formatDateKey(recap.weekStart, language);
  const weekEnd = formatDateKey(recap.weekEnd, language);
  const quietWeek = recap.questionsAnswered === 0 && recap.mockExamsTaken === 0;

  return (
    <ScreenShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={`${copy.subtitle} ${copy.weekRange(weekStart, weekEnd)}.`}
      themeColors={themeColors}
    >
      <View style={styles.statsRow}>
        <MetricCard
          label={copy.questionsAnsweredLabel}
          value={recap.questionsAnswered}
          tone="blue"
        />
        <MetricCard
          helper={recap.accuracy === null ? undefined : copy.accuracyHelper}
          label={copy.accuracyLabel}
          value={accuracyValue}
        />
      </View>
      <View style={styles.statsRow}>
        <MetricCard
          helper={bestMockScore}
          label={copy.mockExamsLabel}
          value={recap.mockExamsTaken}
        />
        <MetricCard label={copy.mistakesResolvedLabel} value={recap.mistakesResolved} />
      </View>

      {quietWeek ? (
        <Card
          accessible
          accessibilityLabel={`${copy.quietTitle}. ${copy.quietBody}`}
          style={styles.card}
          themeColors={themeColors}
        >
          <Text accessibilityRole="header" style={styles.cardTitle}>
            {copy.quietTitle}
          </Text>
          <Text style={styles.cardBody}>{copy.quietBody}</Text>
        </Card>
      ) : null}

      {touchedWeakChapter && touchedWeakChapterName ? (
        <Card
          accessible
          accessibilityLabel={`${copy.weakChapterTitle}. ${copy.weakChapterBody(
            touchedWeakChapterName,
          )}`}
          style={styles.card}
          themeColors={themeColors}
        >
          <SectionHeader
            title={copy.weakChapterTitle}
            subtitle={copy.weakChapterBody(touchedWeakChapterName)}
            themeColors={themeColors}
          />
          <ComplianceActionLink
            accessibilityLabel={copy.practiceWeakChapterAccessibilityLabel(touchedWeakChapterName)}
            href={`/practice?chapterId=${touchedWeakChapter.chapterId}`}
            label={copy.practiceWeakChapter(touchedWeakChapterName)}
            variant="primary"
          />
        </Card>
      ) : null}

      <ComplianceActionLink
        accessibilityLabel={copy.backToProfileAccessibilityLabel}
        href="/profile"
        label={copy.backToProfile}
      />
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    statsRow: {
      flexDirection: 'row',
      gap: space[1.5],
    },
    card: {
      gap: space[1.5],
    },
    cardTitle: {
      color: themeColors.text,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.subHeading.fontWeight,
      lineHeight: typography.subHeading.lineHeight,
    },
    cardBody: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
  });
}
