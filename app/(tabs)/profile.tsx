import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceActionLink } from '../../components/compliance/ComplianceActionLink';
import { ComplianceLinks } from '../../components/compliance/ComplianceLinks';
import { BadgeRow } from '../../components/learning/BadgeRow';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { ProPaywall } from '../../components/monetization/ProPaywall';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import {
  deriveBadges,
  getAllBadges,
  getBadgeDescription,
  getBadgeLockedHint,
  getBadgeProgressHint,
  getBadgeTitle,
  type BadgeInput,
} from '../../lib/learning/badges';
import { calculateStreakWithFreeze, freezeBannerCopy } from '../../lib/learning/streakWithFreeze';
import { calculateLevel } from '../../lib/learning/xp';
import { isProRuntimeScopeEnabled } from '../../lib/monetization/releasePolicy';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type ProfileCopy = {
  answersPerDay: string;
  badgeLocked: string;
  badgeUnlocked: string;
  badgesSubtitle: string;
  badgesTitle: string;
  completedMetric: string;
  dashboardAccessibilityLabel: string;
  dashboardCta: string;
  dashboardSubtitle: string;
  dashboardTitle: string;
  weeklyRecapAccessibilityLabel: string;
  weeklyRecapCta: string;
  weeklyRecapSubtitle: string;
  weeklyRecapTitle: string;
  dayStreakFreezeHelper: (count: number) => string;
  dayStreakMetric: string;
  eyebrow: string;
  audioDisabledBadge: string;
  audioEnabledBadge: string;
  audioStatusLabel: string;
  dailyGoalBadgeLabel: string;
  languageBadge: string;
  languageBadgeLabel: string;
  levelMetric: string;
  openSettingsAccessibilityLabel: string;
  noBadges: string;
  questionsHelper: string;
  removeAdsFocusCue: string;
  streakFreezeBadge: string;
  studySetupCta: string;
  studySetupSubtitle: string;
  studySetupTitle: string;
  subtitle: string;
  title: string;
  weeklyRecapAccessibilityLabel: string;
  weeklyRecapCta: string;
  weeklyRecapSubtitle: string;
  weeklyRecapTitle: string;
  xpMetric: string;
};

const profileCopy: Record<AppLanguage, ProfileCopy> = {
  sv: {
    answersPerDay: 'svar/dag',
    badgeLocked: 'Låst',
    badgeUnlocked: 'Upplåst',
    badgesSubtitle: 'Milstolpar gör framsteg synliga utan att störa lärandet.',
    badgesTitle: 'Märken',
    completedMetric: 'klara',
    dashboardAccessibilityLabel: 'Öppna framstegsöversikten',
    dashboardCta: 'Visa översikt',
    dashboardSubtitle: 'Aktivitet, kapitelframsteg och XP visas på en egen sida.',
    dashboardTitle: 'Framstegsöversikt',
    weeklyRecapAccessibilityLabel: 'Öppna veckans studieöversikt',
    weeklyRecapCta: 'Visa veckan',
    weeklyRecapSubtitle: 'Svar, övningsprov och nästa lugna repetition samlas i en lokal veckovy.',
    weeklyRecapTitle: 'Veckans översikt',
    dayStreakFreezeHelper: (count) => `${count} svitskydd redo`,
    dayStreakMetric: 'dagars svit',
    eyebrow: 'Lokal profil',
    audioDisabledBadge: 'Ljud av',
    audioEnabledBadge: 'Ljud på',
    audioStatusLabel: 'Ljud',
    dailyGoalBadgeLabel: 'Dagligt mål',
    languageBadge: 'Svenska',
    languageBadgeLabel: 'Språk',
    levelMetric: 'nivå',
    noBadges: 'Inga märken ännu',
    openSettingsAccessibilityLabel: 'Öppna inställningar för dagligt mål, språk och ljud',
    questionsHelper: 'frågor',
    removeAdsFocusCue: 'Ta bort annonser är markerat. Köp- och återställningsknapparna finns här.',
    streakFreezeBadge: 'Svitskydd',
    studySetupCta: 'Ändra mål, språk och ljud',
    studySetupSubtitle: 'Små dagliga mål är lättare att hålla än långa maratonpass.',
    studySetupTitle: 'Studieinställningar',
    subtitle:
      'Dina mål, språkval, sviter och märken sparas på den här enheten för privat studierutin.',
    title: 'Framsteg utan konto',
    weeklyRecapAccessibilityLabel: 'Öppna veckans översikt',
    weeklyRecapCta: 'Visa veckan',
    weeklyRecapSubtitle: 'Sammanfatta veckans svar och välj nästa steg utan konto.',
    weeklyRecapTitle: 'Veckans översikt',
    xpMetric: 'XP',
  },
  en: {
    answersPerDay: 'answers/day',
    badgeLocked: 'Locked',
    badgeUnlocked: 'Unlocked',
    badgesSubtitle: 'Achievement cues make progress visible without distracting from learning.',
    badgesTitle: 'Badges',
    completedMetric: 'completed',
    dashboardAccessibilityLabel: 'Open progress dashboard',
    dashboardCta: 'View dashboard',
    dashboardSubtitle: 'Activity, chapter progress, and XP live on a dedicated page.',
    dashboardTitle: 'Progress dashboard',
    weeklyRecapAccessibilityLabel: 'Open this week’s study recap',
    weeklyRecapCta: 'View this week',
    weeklyRecapSubtitle:
      'Answers, mock exams, and the next calm review live in a local weekly view.',
    weeklyRecapTitle: 'Weekly recap',
    dayStreakFreezeHelper: (count) => `${count} streak freeze ready`,
    dayStreakMetric: 'day streak',
    eyebrow: 'Local profile',
    audioDisabledBadge: 'Audio off',
    audioEnabledBadge: 'Audio on',
    audioStatusLabel: 'Audio',
    dailyGoalBadgeLabel: 'Daily goal',
    languageBadge: 'English support',
    languageBadgeLabel: 'Language',
    levelMetric: 'level',
    noBadges: 'No badges yet',
    openSettingsAccessibilityLabel: 'Open settings for daily goal, language, and audio',
    questionsHelper: 'questions',
    removeAdsFocusCue: 'Remove Ads is highlighted. Buy and Restore controls are here.',
    streakFreezeBadge: 'Streak freeze',
    studySetupCta: 'Adjust goal, language, and audio',
    studySetupSubtitle: 'Small daily goals are easier to keep than long cram sessions.',
    studySetupTitle: 'Study setup',
    subtitle:
      'Your goals, language mode, streaks, and badges stay on this device for a private study experience.',
    title: 'Progress without an account',
    weeklyRecapAccessibilityLabel: 'Open weekly recap',
    weeklyRecapCta: 'View this week',
    weeklyRecapSubtitle:
      'Summarize this week of answers and choose the next step without an account.',
    weeklyRecapTitle: 'Weekly recap',
    xpMetric: 'XP',
  },
};

export default function Screen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
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
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const copy = profileCopy[language];
  const removeAdsFocused = focus === 'remove-ads';
  const proRuntimeScopeEnabled = isProRuntimeScopeEnabled();
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
  const badgeInput: BadgeInput = {
    completedQuestionCount: completedQuestionIds.length,
    currentStreak,
    level,
    wrongAnswerCount,
  };
  const allBadges = getAllBadges();
  const unlockedBadgeIds = new Set(deriveBadges(badgeInput).map((badge) => badge.id));

  useEffect(() => {
    setStreakFreezeState(streakWithFreeze.freezeState);
  }, [setStreakFreezeState, streakWithFreeze.freezeState]);

  const removeAdsPaywall = entitlementsReady ? (
    <View
      nativeID="remove-ads-paywall"
      testID="remove-ads-paywall"
      style={[styles.removeAdsPaywall, removeAdsFocused ? styles.removeAdsPaywallFocused : null]}
    >
      {removeAdsFocused ? (
        <Text style={styles.removeAdsFocusCue}>{copy.removeAdsFocusCue}</Text>
      ) : null}
      <PremiumBanner
        entitlements={monetizationEntitlements}
        language={language}
        onEntitlementsChange={setMonetizationEntitlements}
        runtimeOptions={purchaseRuntime}
      />
    </View>
  ) : null;

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
      {removeAdsFocused ? removeAdsPaywall : null}

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.studySetupTitle} subtitle={copy.studySetupSubtitle} />
        <View style={styles.pillRow}>
          <Badge tone="blue">
            {copy.dailyGoalBadgeLabel}: {dailyGoalAnswers} {copy.answersPerDay}
          </Badge>
          <Badge tone="warm">
            {copy.languageBadgeLabel}: {copy.languageBadge}
          </Badge>
          <Badge tone={audioEnabled ? 'green' : 'warm'}>
            {copy.audioStatusLabel}:{' '}
            {audioEnabled ? copy.audioEnabledBadge : copy.audioDisabledBadge}
          </Badge>
        </View>
        <Link
          accessibilityLabel={copy.openSettingsAccessibilityLabel}
          accessibilityRole="link"
          asChild
          href={{
            pathname: '/settings',
            params: { focus: 'study' },
          }}
        >
          <Button
            accessibilityLabel={copy.openSettingsAccessibilityLabel}
            accessibilityRole="link"
            style={styles.settingsLink}
          >
            {copy.studySetupCta}
          </Button>
        </Link>
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.dashboardTitle} subtitle={copy.dashboardSubtitle} />
        <ComplianceActionLink
          accessibilityLabel={copy.dashboardAccessibilityLabel}
          href="/dashboard"
          label={copy.dashboardCta}
        />
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.weeklyRecapTitle} subtitle={copy.weeklyRecapSubtitle} />
        <ComplianceActionLink
          accessibilityLabel={copy.weeklyRecapAccessibilityLabel}
          href="/recap"
          label={copy.weeklyRecapCta}
        />
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.badgesTitle} subtitle={copy.badgesSubtitle} />
        <View style={styles.badgeList}>
          {allBadges.length > 0 ? (
            allBadges.map((badge) => {
              const unlocked = unlockedBadgeIds.has(badge.id);
              const statusLabel = unlocked ? copy.badgeUnlocked : copy.badgeLocked;
              const description = unlocked
                ? getBadgeDescription(badge, language)
                : getBadgeLockedHint(badge, language);

              return (
                <BadgeRow
                  description={description}
                  key={badge.id}
                  progressHint={getBadgeProgressHint(badge, badgeInput, language)}
                  statusLabel={statusLabel}
                  title={getBadgeTitle(badge, language)}
                  unlocked={unlocked}
                />
              );
            })
          ) : (
            <Text style={styles.noBadgesText}>{copy.noBadges}</Text>
          )}
        </View>
      </Card>

      {!removeAdsFocused ? removeAdsPaywall : null}
      {entitlementsReady && proRuntimeScopeEnabled ? (
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
  badgeList: {
    gap: space[1],
  },
  noBadgesText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    minHeight: space[6],
  },
  removeAdsPaywall: {
    gap: space[1],
  },
  removeAdsPaywallFocused: {
    borderColor: colors.accent,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    padding: space[1],
  },
  removeAdsFocusCue: {
    color: colors.accent,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
    textAlign: 'center',
  },
});
