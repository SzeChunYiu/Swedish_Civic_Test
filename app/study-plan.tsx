import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { CountdownBanner } from '../components/ui/CountdownBanner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { RouteLink } from '../components/ui/RouteLink';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { questions } from '../data/questions';
import {
  daysUntil,
  formatExamDate,
  generateStudyPlan,
  generateStudyPlanWeeklyBreakdown,
  type StudyPlanDayBreakdown,
} from '../lib/learning/examDate';
import { getLocalDateKey } from '../lib/learning/streaks';
import { hasProEntitlement } from '../lib/monetization/premium';
import { isProRuntimeScopeEnabled } from '../lib/monetization/releasePolicy';
import { useProLifetimeEntitlements } from '../lib/monetization/useProLifetimeEntitlements';
import {
  useProgressStore,
  type MockExamProgress,
  type QuestionProgress,
} from '../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

type StudyPlanCopy = {
  countdownText: (daysRemaining: number, dateLabel: string) => string;
  dailyTarget: (target: number) => string;
  dailyTargetTitle: string;
  dayAccessibilityLabel: (dayLabel: string, questionLabel: string, mockLabel: string) => string;
  dayStatusComplete: string;
  dayStatusOpen: string;
  eyebrow: string;
  freeBody: string;
  freeCta: string;
  freeTitle: string;
  generatedAt: (dateLabel: string) => string;
  localOnly: string;
  mockLine: (completed: number, target: number) => string;
  noDateBody: string;
  noDateCta: string;
  noDateTitle: string;
  questionLine: (completed: number, target: number) => string;
  rebalanceNote: string;
  subtitle: string;
  todayBadge: string;
  title: string;
  weekSubtitle: string;
  weekTitle: string;
};

const studyPlanCopy: Record<AppLanguage, StudyPlanCopy> = {
  sv: {
    countdownText: (daysRemaining, dateLabel) => `${daysRemaining} dagar till ${dateLabel}`,
    dailyTarget: (target) => `${target} frågor per dag`,
    dailyTargetTitle: 'Dagens plan',
    dayAccessibilityLabel: (dayLabel, questionLabel, mockLabel) =>
      `${dayLabel}. ${questionLabel}. ${mockLabel}.`,
    dayStatusComplete: 'Klar',
    dayStatusOpen: 'Öppet',
    eyebrow: 'Studieplan',
    freeBody:
      'Nedräkningen och källlänkarna är öppna för alla. Pro låser upp veckoplanen med lokala mål och klarmarkeringar.',
    freeCta: 'Visa Pro',
    freeTitle: 'Veckoplanen ingår i Pro',
    generatedAt: (dateLabel) => `Uppdaterad ${dateLabel}`,
    localOnly: 'Provdatum, intensitet och klarmarkeringar stannar på den här enheten.',
    mockLine: (completed, target) =>
      target > 0 ? `${completed}/${target} övningsprov` : `${completed} övningsprov registrerade`,
    noDateBody:
      'Lägg till ditt provdatum för en lokal nedräkning. Pro visar sedan en veckoplan med dagsmål.',
    noDateCta: 'Lägg till provdatum',
    noDateTitle: 'Provdatum saknas',
    questionLine: (completed, target) => `${completed}/${target} frågor`,
    rebalanceNote:
      'Planen räknas om från din lokala progress varje gång du öppnar sidan, så kommande mål hålls aktuella.',
    subtitle:
      'Dagliga frågor, övningsprov och klarmarkeringar beräknas lokalt från ditt provdatum.',
    todayBadge: 'Idag',
    title: 'Din studieplan',
    weekSubtitle: 'Klarmarkeringar bygger bara på svar och övningsprov på den här enheten.',
    weekTitle: 'Den här veckan',
  },
  en: {
    countdownText: (daysRemaining, dateLabel) => `${daysRemaining} days until ${dateLabel}`,
    dailyTarget: (target) => `${target} questions per day`,
    dailyTargetTitle: "Today's plan",
    dayAccessibilityLabel: (dayLabel, questionLabel, mockLabel) =>
      `${dayLabel}. ${questionLabel}. ${mockLabel}.`,
    dayStatusComplete: 'Done',
    dayStatusOpen: 'Open',
    eyebrow: 'Study plan',
    freeBody:
      'The countdown and source links are open to everyone. Pro unlocks the weekly plan with local targets and completion marks.',
    freeCta: 'View Pro',
    freeTitle: 'The weekly plan is included in Pro',
    generatedAt: (dateLabel) => `Updated ${dateLabel}`,
    localOnly: 'Test date, intensity, and completion marks stay on this device.',
    mockLine: (completed, target) =>
      target > 0 ? `${completed}/${target} mock exams` : `${completed} mock exams logged`,
    noDateBody:
      'Add your test date for a local countdown. Pro then shows a weekly plan with daily targets.',
    noDateCta: 'Add test date',
    noDateTitle: 'No test date yet',
    questionLine: (completed, target) => `${completed}/${target} questions`,
    rebalanceNote:
      'The plan recalculates from your local progress every time you open this page, keeping upcoming targets current.',
    subtitle:
      'Daily questions, mock exams, and completion marks are calculated locally from your test date.',
    todayBadge: 'Today',
    title: 'Your study plan',
    weekSubtitle: 'Completion marks use only answers and mock exams on this device.',
    weekTitle: 'This week',
  },
};

function safeDateFromIso(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function countMasteredQuestions(questionProgress: Record<string, QuestionProgress>): number {
  return Object.values(questionProgress).filter(
    (progress) => progress.correctCount >= 2 && progress.correctStreak >= 2,
  ).length;
}

function buildQuestionCountsByLocalDate(
  answerHistory: { answeredAt?: string }[],
): Record<string, number> {
  return answerHistory.reduce<Record<string, number>>((counts, answer) => {
    const answeredAt = safeDateFromIso(answer.answeredAt);
    if (!answeredAt) return counts;

    const dateKey = getLocalDateKey(answeredAt);
    counts[dateKey] = (counts[dateKey] ?? 0) + 1;
    return counts;
  }, {});
}

function buildMockCountsByLocalDate(mockExamSessions: MockExamProgress[]): Record<string, number> {
  return mockExamSessions.reduce<Record<string, number>>((counts, session) => {
    const completedAt = safeDateFromIso(session.completedAt);
    if (!completedAt) return counts;

    const dateKey = getLocalDateKey(completedAt);
    counts[dateKey] = (counts[dateKey] ?? 0) + 1;
    return counts;
  }, {});
}

function formatPlanDate(dateIso: string, language: AppLanguage): string {
  return new Date(dateIso).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

function formatGeneratedAt(dateIso: string, language: AppLanguage): string {
  return new Date(dateIso).toLocaleString(language === 'sv' ? 'sv-SE' : 'en-GB', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function DayBreakdownRow({
  copy,
  day,
  language,
  styles,
}: {
  copy: StudyPlanCopy;
  day: StudyPlanDayBreakdown;
  language: AppLanguage;
  styles: ReturnType<typeof createStyles>;
}) {
  const dayLabel = formatPlanDate(day.dateIso, language);
  const questionLabel = copy.questionLine(day.questionsCompleted, day.questionTarget);
  const mockLabel = copy.mockLine(day.mocksCompleted, day.mockTarget);
  const hasMockTarget = day.mockTarget > 0;

  return (
    <Card
      accessible
      accessibilityLabel={copy.dayAccessibilityLabel(dayLabel, questionLabel, mockLabel)}
      style={styles.dayCard}
    >
      <View style={styles.dayHeader}>
        <View style={styles.dayTitleBlock}>
          <Text accessibilityRole="header" style={styles.dayTitle}>
            {dayLabel}
          </Text>
          {day.isToday ? <Badge tone="warm">{copy.todayBadge}</Badge> : null}
        </View>
        <Text style={styles.dayKey}>{day.localDateKey}</Text>
      </View>

      <View style={styles.targetRow}>
        <View style={styles.targetTextBlock}>
          <Text style={styles.targetLabel}>{questionLabel}</Text>
          <ProgressBar
            language={language}
            progress={day.questionTarget > 0 ? day.questionsCompleted / day.questionTarget : 0}
          />
        </View>
        <Text style={[styles.statusPill, day.questionTargetMet ? styles.statusDone : null]}>
          {day.questionTargetMet ? `✓ ${copy.dayStatusComplete}` : copy.dayStatusOpen}
        </Text>
      </View>

      <View style={styles.targetRow}>
        <View style={styles.targetTextBlock}>
          <Text style={styles.targetLabel}>{mockLabel}</Text>
          <ProgressBar
            language={language}
            progress={hasMockTarget ? day.mocksCompleted / day.mockTarget : 0}
          />
        </View>
        {hasMockTarget ? (
          <Text style={[styles.statusPill, day.mockTargetMet ? styles.statusDone : null]}>
            {day.mockTargetMet ? `✓ ${copy.dayStatusComplete}` : copy.dayStatusOpen}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export default function StudyPlanScreen() {
  const answerHistory = useProgressStore((state) => state.answerHistory);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const language = useSettingsStore((state) => state.language);
  const studyPlanIntensity = useSettingsStore((state) => state.studyPlanIntensity);
  const studyPlanTestDateIso = useSettingsStore((state) => state.studyPlanTestDateIso);
  const { entitlements, entitlementsReady } = useProLifetimeEntitlements();
  const copy = studyPlanCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const now = useMemo(() => new Date(), []);
  const testDate = useMemo(
    () => safeDateFromIso(studyPlanTestDateIso ?? undefined),
    [studyPlanTestDateIso],
  );
  const proPlanUnlocked =
    isProRuntimeScopeEnabled() &&
    entitlementsReady &&
    hasProEntitlement(entitlements) &&
    entitlements.customStudyPlan === true;

  const plan = useMemo(() => {
    if (!testDate) return null;

    return generateStudyPlan({
      intensity: studyPlanIntensity,
      masteredQuestions: countMasteredQuestions(questionProgress),
      mocksTaken: mockExamSessions.length,
      now,
      testDate,
      totalQuestions: questions.length,
    });
  }, [mockExamSessions.length, now, questionProgress, studyPlanIntensity, testDate]);

  const weeklyBreakdown = useMemo(() => {
    if (!plan) return [];

    return generateStudyPlanWeeklyBreakdown({
      mockCountsByLocalDate: buildMockCountsByLocalDate(mockExamSessions),
      now,
      plan,
      questionCountsByLocalDate: buildQuestionCountsByLocalDate(answerHistory),
    });
  }, [answerHistory, mockExamSessions, now, plan]);

  if (!testDate || !plan) {
    return (
      <ScreenShell eyebrow={copy.eyebrow} title={copy.noDateTitle} subtitle={copy.noDateBody}>
        <CountdownBanner language={language} />
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeText}>{copy.localOnly}</Text>
          <RouteLink
            accessibilityLabel={copy.noDateCta}
            href={{ pathname: '/settings', params: { focus: 'study' } }}
            style={styles.noticeLink}
            variant="primary"
          >
            {copy.noDateCta}
          </RouteLink>
        </Card>
      </ScreenShell>
    );
  }

  if (!proPlanUnlocked) {
    return (
      <ScreenShell eyebrow={copy.eyebrow} title={copy.freeTitle} subtitle={copy.freeBody}>
        <CountdownBanner language={language} />
        <Card style={styles.noticeCard}>
          <Badge tone="blue">{formatExamDate(testDate, language)}</Badge>
          <Text style={styles.noticeText}>
            {copy.countdownText(daysUntil(testDate, now), formatExamDate(testDate, language))}
          </Text>
          <Text style={styles.localOnlyText}>{copy.localOnly}</Text>
          <RouteLink
            accessibilityLabel={copy.freeCta}
            href="/profile"
            style={styles.noticeLink}
            variant="primary"
          >
            {copy.freeCta}
          </RouteLink>
        </Card>
      </ScreenShell>
    );
  }

  const todayBreakdown = weeklyBreakdown[0];
  const todayQuestionProgress = todayBreakdown
    ? todayBreakdown.questionsCompleted / Math.max(1, todayBreakdown.questionTarget)
    : 0;

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <CountdownBanner language={language} />
      <Card style={styles.planCard}>
        <Badge tone={plan.isCrunch ? 'orange' : 'blue'}>
          {copy.countdownText(plan.daysRemaining, formatExamDate(testDate, language))}
        </Badge>
        <Text accessibilityRole="header" style={styles.planTitle}>
          {copy.dailyTargetTitle}
        </Text>
        <Text style={styles.planMetric}>{copy.dailyTarget(plan.dailyQuestionTarget)}</Text>
        <ProgressBar language={language} progress={todayQuestionProgress} />
        <Text style={styles.planMeta}>
          {copy.generatedAt(formatGeneratedAt(plan.generatedAt, language))}
        </Text>
        <Text style={styles.localOnlyText}>{copy.localOnly}</Text>
      </Card>

      <SectionHeader title={copy.weekTitle} subtitle={copy.weekSubtitle} />
      <View style={styles.weekList}>
        {weeklyBreakdown.map((day) => (
          <DayBreakdownRow
            key={day.localDateKey}
            copy={copy}
            day={day}
            language={language}
            styles={styles}
          />
        ))}
      </View>
      <Text style={styles.rebalanceNote}>{copy.rebalanceNote}</Text>
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    noticeCard: {
      gap: space[1.5],
    },
    noticeText: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    noticeLink: {
      alignSelf: 'flex-start',
    },
    localOnlyText: {
      color: themeColors.textDisclaimer,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    planCard: {
      gap: space[1.5],
    },
    planTitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    planMetric: {
      color: themeColors.text,
      fontSize: typography.subHeadingLarge.fontSize,
      fontWeight: typography.subHeadingLarge.fontWeight,
      lineHeight: typography.subHeadingLarge.lineHeight,
    },
    planMeta: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    weekList: {
      gap: space[1.5],
    },
    dayCard: {
      gap: space[1.5],
    },
    dayHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: space[1],
      justifyContent: 'space-between',
    },
    dayTitleBlock: {
      flex: 1,
      gap: space[0.75],
    },
    dayTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    dayKey: {
      color: themeColors.textDisclaimer,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    targetRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: space[1.5],
      justifyContent: 'space-between',
    },
    targetTextBlock: {
      flex: 1,
      gap: space[0.75],
    },
    targetLabel: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    statusPill: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
      color: themeColors.textSecondary,
      fontSize: typography.micro.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.micro.lineHeight,
      minWidth: space[8],
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.75],
      textAlign: 'center',
    },
    statusDone: {
      backgroundColor: themeColors.successSoft,
      borderColor: themeColors.success,
      color: themeColors.success,
    },
    rebalanceNote: {
      color: themeColors.textDisclaimer,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
  });
}
