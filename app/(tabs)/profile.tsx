import { Link } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../../components/compliance/ComplianceLinks';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { ProPaywall } from '../../components/monetization/ProPaywall';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { deriveBadges, getBadgeTitle } from '../../lib/learning/badges';
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type ProfileCopy = {
  answersPerDay: string;
  badgesSubtitle: string;
  badgesTitle: string;
  completedMetric: string;
  dashboardAccessibilityLabel: string;
  dashboardCta: string;
  dashboardSubtitle: string;
  dashboardTitle: string;
  dayStreakFreezeHelper: (count: number) => string;
  dayStreakMetric: string;
  eyebrow: string;
  languageBadge: string;
  levelMetric: string;
  noBadges: string;
  openSettings: string;
  openSettingsAccessibilityLabel: string;
  questionsHelper: string;
  streakFreezeBadge: string;
  studySetupSubtitle: string;
  studySetupTitle: string;
  subtitle: string;
  title: string;
  xpMetric: string;
};

const profileCopy: Record<AppLanguage, ProfileCopy> = {
  sv: {
    answersPerDay: 'svar/dag',
    badgesSubtitle: 'Milstolpar gör framsteg synliga utan att störa lärandet.',
    badgesTitle: 'Märken',
    completedMetric: 'klara',
    dashboardAccessibilityLabel: 'Öppna framstegsöversikten',
    dashboardCta: 'Visa översikt',
    dashboardSubtitle: 'Aktivitet, kapitelframsteg och XP visas på en egen sida.',
    dashboardTitle: 'Framstegsöversikt',
    dayStreakFreezeHelper: (count) => `${count} svitskydd redo`,
    dayStreakMetric: 'dagars svit',
    eyebrow: 'Lokal profil',
    languageBadge: 'Svenska',
    levelMetric: 'nivå',
    noBadges: 'Inga märken ännu',
    openSettings: 'Ändra mål, språk och ljud',
    openSettingsAccessibilityLabel: 'Ändra mål, språk och ljud',
    questionsHelper: 'frågor',
    streakFreezeBadge: 'Svitskydd',
    studySetupSubtitle: 'Små dagliga mål är lättare att hålla än långa maratonpass.',
    studySetupTitle: 'Studieinställningar',
    subtitle:
      'Dina mål, språkval, sviter och märken sparas på den här enheten för privat studierutin.',
    title: 'Framsteg utan konto',
    xpMetric: 'XP',
  },
  en: {
    answersPerDay: 'answers/day',
    badgesSubtitle: 'Achievement cues make progress visible without distracting from learning.',
    badgesTitle: 'Badges',
    completedMetric: 'completed',
    dashboardAccessibilityLabel: 'Open progress dashboard',
    dashboardCta: 'View dashboard',
    dashboardSubtitle: 'Activity, chapter progress, and XP live on a dedicated page.',
    dashboardTitle: 'Progress dashboard',
    dayStreakFreezeHelper: (count) => `${count} streak freeze ready`,
    dayStreakMetric: 'day streak',
    eyebrow: 'Local profile',
    languageBadge: 'English support',
    levelMetric: 'level',
    noBadges: 'No badges yet',
    openSettings: 'Edit goal, language, and audio',
    openSettingsAccessibilityLabel: 'Edit goal, language, and audio',
    questionsHelper: 'questions',
    streakFreezeBadge: 'Streak freeze',
    studySetupSubtitle: 'Small daily goals are easier to keep than long cram sessions.',
    studySetupTitle: 'Study setup',
    subtitle:
      'Your goals, language mode, streaks, and badges stay on this device for a private study experience.',
    title: 'Progress without an account',
    xpMetric: 'XP',
  },
};

function formatBadges(
  badges: ReturnType<typeof deriveBadges>,
  language: AppLanguage,
  emptyLabel: string,
): string {
  if (badges.length === 0) return emptyLabel;

  return badges.map((badge) => getBadgeTitle(badge, language)).join(', ');
}

export default function Screen() {
  const {
    entitlements: monetizationEntitlements,
    entitlementsReady,
    purchaseRuntime,
    setEntitlements: setMonetizationEntitlements,
  } = useRemoveAdsEntitlements();
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const streakFreezeState = useProgressStore((state) => state.streakFreezeState);
  const setStreakFreezeState = useProgressStore((state) => state.setStreakFreezeState);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const copy = profileCopy[language];
  const level = calculateLevel(totalXp);
  const streakWithFreeze = useMemo(
    () =>
      calculateStreakWithFreeze({
        activeDayKeys: answerDates,
        freezeState: streakFreezeState,
      }),
    [answerDates, streakFreezeState],
  );
  const currentStreak = streakWithFreeze.streakDays;
  const streakRescueMessage = freezeBannerCopy(streakWithFreeze, language);
  const dayStreakHelper =
    currentStreak > 0 && streakWithFreeze.freezeState.available > 0
      ? copy.dayStreakFreezeHelper(streakWithFreeze.freezeState.available)
      : undefined;
  const wrongAnswerCount = Object.values(questionProgress).reduce(
    (count, progress) => count + progress.wrongCount,
    0,
  );
  const badges = deriveBadges({
    completedQuestionCount: completedQuestionIds.length,
    currentStreak,
    level,
    wrongAnswerCount,
  });

  useEffect(() => {
    setStreakFreezeState(streakWithFreeze.freezeState);
  }, [setStreakFreezeState, streakWithFreeze.freezeState]);

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <View style={styles.statsRow}>
        <MetricCard label={copy.levelMetric} value={level} tone="blue" />
        <MetricCard label={copy.xpMetric} value={totalXp} />
      </View>
      <View style={styles.statsRow}>
        <MetricCard label={copy.dayStreakMetric} value={currentStreak} helper={dayStreakHelper} />
        <MetricCard
          label={copy.completedMetric}
          value={completedQuestionIds.length}
          helper={copy.questionsHelper}
        />
      </View>
      {streakRescueMessage ? (
        <Card accessible accessibilityLabel={streakRescueMessage} style={styles.streakFreezeCard}>
          <Badge tone="warm">{copy.streakFreezeBadge}</Badge>
          <Text style={styles.streakFreezeText}>{streakRescueMessage}</Text>
        </Card>
      ) : null}

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.studySetupTitle} subtitle={copy.studySetupSubtitle} />
        <View style={styles.pillRow}>
          <Badge tone="blue">
            {dailyGoalAnswers} {copy.answersPerDay}
          </Badge>
          <Badge tone="warm">{copy.languageBadge}</Badge>
        </View>
        <Link
          accessibilityLabel={copy.openSettingsAccessibilityLabel}
          accessibilityRole="link"
          asChild
          href="/settings"
        >
          <Button
            accessibilityLabel={copy.openSettingsAccessibilityLabel}
            accessibilityRole="link"
            style={styles.settingsLink}
          >
            {copy.openSettings}
          </Button>
        </Link>
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.dashboardTitle} subtitle={copy.dashboardSubtitle} />
        <Link
          accessibilityLabel={copy.dashboardAccessibilityLabel}
          accessibilityRole="link"
          href="/dashboard"
          style={styles.dashboardLink}
        >
          {copy.dashboardCta}
        </Link>
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.badgesTitle} subtitle={copy.badgesSubtitle} />
        <Text style={styles.value}>{formatBadges(badges, language, copy.noBadges)}</Text>
      </Card>

      {entitlementsReady ? (
        <PremiumBanner
          entitlements={monetizationEntitlements}
          language={language}
          onEntitlementsChange={setMonetizationEntitlements}
          runtimeOptions={purchaseRuntime}
        />
      ) : null}
      {entitlementsReady ? (
        <ProPaywall
          alreadyAdFree={monetizationEntitlements.adsDisabled}
          language={language}
          onEntitlementsChange={(nextEntitlements) => setMonetizationEntitlements(nextEntitlements)}
        />
      ) : null}
      <ComplianceLinks />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: space[1.5],
  },
  cardWide: {
    gap: space[1.5],
  },
  streakFreezeCard: {
    gap: space[1],
  },
  streakFreezeText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  value: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  dashboardLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  settingsLink: {
    alignSelf: 'flex-start',
    minHeight: space[6],
  },
});
