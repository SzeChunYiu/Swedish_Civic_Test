import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceActionLink } from '../components/compliance/ComplianceActionLink';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import { buildDashboardProgressSnapshot } from '../lib/learning/dashboardProgressSnapshot';
import { perChapterProgress } from '../lib/learning/dashboardStats';
import { generateWeeklyRecap } from '../lib/learning/weeklyRecap';
import { getChapterQuizRouteParams, type ChapterQuizRouteParams } from '../lib/quiz/practiceFlow';
import { useProgressStore } from '../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type RecapCopy = {
  accuracyDelta: (deltaPoints: number) => string;
  accuracyMetric: string;
  bestMockScoreMetric: string;
  chapterListEmpty: string;
  chapterListTitle: string;
  chaptersTouchedMetric: string;
  dateRange: (start: string, end: string) => string;
  defaultPracticeAccessibilityLabel: string;
  defaultPracticeCta: string;
  defaultPracticeSubtitle: string;
  eyebrow: string;
  mistakesResolvedMetric: string;
  mockExamsMetric: string;
  noScoreYet: string;
  profileAccessibilityLabel: string;
  profileCta: string;
  questionsMetric: string;
  quietBody: string;
  quietTitle: string;
  streakDaysMetric: string;
  subtitle: string;
  summary: (
    questionsAnswered: number,
    accuracy: string,
    chaptersTouched: number,
    mistakesResolved: number,
    mockExamsTaken: number,
  ) => string;
  title: string;
  weakChapterAccessibilityLabel: (chapterName: string) => string;
  weakChapterCta: (chapterName: string) => string;
  weakChapterDetail: (accuracy: string) => string;
  weakChapterTitle: string;
};

const recapCopy: Record<AppLanguage, RecapCopy> = {
  sv: {
    accuracyDelta: (deltaPoints) => {
      if (deltaPoints === 0) return 'Oförändrat jämfört med förra veckan';
      return `${Math.abs(deltaPoints)} procentenheter ${
        deltaPoints > 0 ? 'upp' : 'ned'
      } från förra veckan`;
    },
    accuracyMetric: 'rätt',
    bestMockScoreMetric: 'bästa prov',
    chapterListEmpty: 'Inga kapitel provades den här veckan.',
    chapterListTitle: 'Kapitel den här veckan',
    chaptersTouchedMetric: 'kapitel',
    dateRange: (start, end) => `${start} till ${end}`,
    defaultPracticeAccessibilityLabel: 'Starta en kort övning från veckans översikt',
    defaultPracticeCta: 'Starta en kort övning',
    defaultPracticeSubtitle: 'En fråga räcker för att ge nästa vecka mer underlag.',
    eyebrow: 'Lokal repetition',
    mistakesResolvedMetric: 'misstag lösta',
    mockExamsMetric: 'övningsprov',
    noScoreYet: 'Inte ännu',
    profileAccessibilityLabel: 'Gå tillbaka till profilen',
    profileCta: 'Till profilen',
    questionsMetric: 'svar',
    quietBody:
      'En lugn vecka är okej. Börja med en kort övning när det passar, så byggs nästa översikt automatiskt.',
    quietTitle: 'Ingen aktivitet den här veckan',
    streakDaysMetric: 'svitdagar',
    subtitle: 'Summera veckans svar, övningsprov och nästa tydliga steg utan konto.',
    summary: (questionsAnswered, accuracy, chaptersTouched, mistakesResolved, mockExamsTaken) =>
      `Veckans översikt: ${questionsAnswered} svar, ${accuracy} rätt, ${chaptersTouched} kapitel, ${mistakesResolved} misstag lösta och ${mockExamsTaken} övningsprov.`,
    title: 'Veckans översikt',
    weakChapterAccessibilityLabel: (chapterName) => `Öva svagt kapitel: ${chapterName}`,
    weakChapterCta: (chapterName) => `Öva ${chapterName}`,
    weakChapterDetail: (accuracy) =>
      `Svagast av kapitlen du rörde den här veckan: ${accuracy} rätt.`,
    weakChapterTitle: 'Fokusera härnäst',
  },
  en: {
    accuracyDelta: (deltaPoints) => {
      if (deltaPoints === 0) return 'Unchanged from last week';
      return `${Math.abs(deltaPoints)} points ${deltaPoints > 0 ? 'up' : 'down'} from last week`;
    },
    accuracyMetric: 'accuracy',
    bestMockScoreMetric: 'best mock',
    chapterListEmpty: 'No chapters were touched this week.',
    chapterListTitle: 'Chapters this week',
    chaptersTouchedMetric: 'chapters',
    dateRange: (start, end) => `${start} to ${end}`,
    defaultPracticeAccessibilityLabel: 'Start a short practice session from weekly recap',
    defaultPracticeCta: 'Start a short practice',
    defaultPracticeSubtitle: 'One question is enough to give next week more signal.',
    eyebrow: 'Local review',
    mistakesResolvedMetric: 'mistakes fixed',
    mockExamsMetric: 'mock exams',
    noScoreYet: 'Not yet',
    profileAccessibilityLabel: 'Go back to Profile',
    profileCta: 'Back to Profile',
    questionsMetric: 'answers',
    quietBody:
      'A quiet week is fine. Start with a short practice when it fits, and the next recap will build automatically.',
    quietTitle: 'No activity this week',
    streakDaysMetric: 'streak days',
    subtitle:
      'Summarize this week of answers, mock exams, and the next clear step without an account.',
    summary: (questionsAnswered, accuracy, chaptersTouched, mistakesResolved, mockExamsTaken) => {
      const answerNoun = questionsAnswered === 1 ? 'answer' : 'answers';
      const chapterNoun = chaptersTouched === 1 ? 'chapter' : 'chapters';
      const mistakeNoun = mistakesResolved === 1 ? 'mistake' : 'mistakes';
      const mockNoun = mockExamsTaken === 1 ? 'mock exam' : 'mock exams';
      return `Weekly recap: ${questionsAnswered} ${answerNoun}, ${accuracy} accuracy, ${chaptersTouched} ${chapterNoun}, ${mistakesResolved} ${mistakeNoun} fixed, and ${mockExamsTaken} ${mockNoun}.`;
    },
    title: 'Weekly recap',
    weakChapterAccessibilityLabel: (chapterName) => `Practise weak chapter: ${chapterName}`,
    weakChapterCta: (chapterName) => `Practise ${chapterName}`,
    weakChapterDetail: (accuracy) => `Weakest chapter you touched this week: ${accuracy} accuracy.`,
    weakChapterTitle: 'Focus next',
  },
};

const questionChapterIndex: Record<string, string> = Object.fromEntries(
  questions.map((question) => [question.id, question.chapterId]),
);
const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const weakAccuracyThreshold = 0.8;

type WeakChapterCta = {
  accuracy: number;
  name: string;
  routeParams: ChapterQuizRouteParams;
};

function getLocalizedChapterName(chapterId: string, language: AppLanguage): string {
  const chapter = chapterById.get(chapterId);
  if (!chapter) return chapterId;
  return chapter.nameText?.[language] ?? (language === 'sv' ? chapter.nameSv : chapter.nameEn);
}

function formatPercent(value: number | null, fallback: string): string {
  if (value === null) return fallback;
  return `${Math.round(value * 100)}%`;
}

export default function WeeklyRecapScreen() {
  const answerDates = useProgressStore((state) => state.answerDates);
  const answerHistory = useProgressStore((state) => state.answerHistory);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const copy = recapCopy[language];
  const progress = useMemo(
    () =>
      buildDashboardProgressSnapshot({
        answerDates,
        answerHistory,
        dailyGoalAnswers,
        mockExamSessions,
        questionProgress,
        totalXp,
      }),
    [answerDates, answerHistory, dailyGoalAnswers, mockExamSessions, questionProgress, totalXp],
  );
  const recap = useMemo(() => generateWeeklyRecap({ progress, questionChapterIndex }), [progress]);
  const chapterBars = useMemo(
    () => perChapterProgress(progress, chapters, questionChapterIndex),
    [progress],
  );
  const weakChapter = useMemo<WeakChapterCta | null>(() => {
    const touchedChapterIds = new Set(recap.chaptersTouched);
    const candidates = chapterBars
      .filter(
        (bar) =>
          touchedChapterIds.has(bar.chapterId) &&
          bar.answers > 0 &&
          bar.accuracy !== null &&
          bar.accuracy < weakAccuracyThreshold,
      )
      .sort((a, b) => {
        const accuracyDelta = (a.accuracy ?? 1) - (b.accuracy ?? 1);
        if (accuracyDelta !== 0) return accuracyDelta;
        return b.answers - a.answers || a.chapterId.localeCompare(b.chapterId);
      });
    const candidate = candidates[0];
    const routeParams = candidate
      ? getChapterQuizRouteParams(questions, candidate.chapterId)
      : null;
    if (!candidate || !routeParams || candidate.accuracy === null) return null;
    return {
      accuracy: candidate.accuracy,
      name: getLocalizedChapterName(candidate.chapterId, language),
      routeParams,
    };
  }, [chapterBars, language, recap.chaptersTouched]);
  const touchedChapterNames = recap.chaptersTouched.map((chapterId) =>
    getLocalizedChapterName(chapterId, language),
  );
  const accuracyValue = formatPercent(recap.accuracy, copy.noScoreYet);
  const bestMockScoreValue = formatPercent(recap.bestMockScore, copy.noScoreYet);
  const summary = copy.summary(
    recap.questionsAnswered,
    accuracyValue,
    recap.chaptersTouched.length,
    recap.mistakesResolved,
    recap.mockExamsTaken,
  );
  const isQuietWeek = recap.questionsAnswered === 0 && recap.mockExamsTaken === 0;

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <Text accessibilityRole="summary" style={styles.hiddenSummary}>
        {summary}
      </Text>
      <Card style={styles.summaryCard}>
        <Badge tone="blue">{copy.dateRange(recap.weekStart, recap.weekEnd)}</Badge>
        <Text style={styles.summaryText}>{summary}</Text>
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard
          accessibilityLabel={`${copy.questionsMetric}: ${recap.questionsAnswered}`}
          label={copy.questionsMetric}
          style={styles.metricCard}
          value={recap.questionsAnswered}
        />
        <MetricCard
          accessibilityLabel={`${copy.accuracyMetric}: ${accuracyValue}${
            recap.accuracyDeltaPoints === null
              ? ''
              : `. ${copy.accuracyDelta(recap.accuracyDeltaPoints)}`
          }`}
          helper={
            recap.accuracyDeltaPoints === null
              ? undefined
              : copy.accuracyDelta(recap.accuracyDeltaPoints)
          }
          label={copy.accuracyMetric}
          style={styles.metricCard}
          tone="blue"
          value={accuracyValue}
        />
        <MetricCard
          accessibilityLabel={`${copy.chaptersTouchedMetric}: ${recap.chaptersTouched.length}`}
          label={copy.chaptersTouchedMetric}
          style={styles.metricCard}
          value={recap.chaptersTouched.length}
        />
        <MetricCard
          accessibilityLabel={`${copy.mistakesResolvedMetric}: ${recap.mistakesResolved}`}
          label={copy.mistakesResolvedMetric}
          style={styles.metricCard}
          value={recap.mistakesResolved}
        />
        <MetricCard
          accessibilityLabel={`${copy.mockExamsMetric}: ${recap.mockExamsTaken}`}
          label={copy.mockExamsMetric}
          style={styles.metricCard}
          value={recap.mockExamsTaken}
        />
        <MetricCard
          accessibilityLabel={`${copy.bestMockScoreMetric}: ${bestMockScoreValue}`}
          label={copy.bestMockScoreMetric}
          style={styles.metricCard}
          tone="blue"
          value={bestMockScoreValue}
        />
        <MetricCard
          accessibilityLabel={`${copy.streakDaysMetric}: ${recap.streakDays}`}
          label={copy.streakDaysMetric}
          style={styles.metricCard}
          value={recap.streakDays}
        />
      </View>

      {isQuietWeek ? (
        <Card style={styles.card}>
          <SectionHeader title={copy.quietTitle} subtitle={copy.quietBody} />
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SectionHeader title={copy.chapterListTitle} />
        <Text style={styles.chapterListText}>
          {touchedChapterNames.length > 0 ? touchedChapterNames.join(', ') : copy.chapterListEmpty}
        </Text>
      </Card>

      <Card style={styles.card}>
        <SectionHeader
          title={weakChapter ? copy.weakChapterTitle : copy.defaultPracticeCta}
          subtitle={
            weakChapter
              ? copy.weakChapterDetail(formatPercent(weakChapter.accuracy, copy.noScoreYet))
              : copy.defaultPracticeSubtitle
          }
        />
        {weakChapter ? (
          <ComplianceActionLink
            accessibilityLabel={copy.weakChapterAccessibilityLabel(weakChapter.name)}
            href={{
              pathname: '/quiz/[sessionId]',
              params: weakChapter.routeParams,
            }}
            label={copy.weakChapterCta(weakChapter.name)}
            variant="primary"
          />
        ) : (
          <ComplianceActionLink
            accessibilityLabel={copy.defaultPracticeAccessibilityLabel}
            href="/practice"
            label={copy.defaultPracticeCta}
            variant="primary"
          />
        )}
      </Card>

      <ComplianceActionLink
        accessibilityLabel={copy.profileAccessibilityLabel}
        href="/profile"
        label={copy.profileCta}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hiddenSummary: {
    height: 1,
    left: -10000,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
  summaryCard: {
    gap: space[1],
  },
  summaryText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.25],
  },
  metricCard: {
    flexBasis: 150,
    flexGrow: 1,
    minWidth: 140,
  },
  card: {
    borderRadius: radius.card,
    gap: space[1.25],
  },
  chapterListText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
