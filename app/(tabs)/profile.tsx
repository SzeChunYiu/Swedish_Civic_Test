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
  audioDisabledBadge: string;
  audioEnabledBadge: string;
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
  settingsShortcutHelper: string;
  studySetupSubtitle: string;
  studySetupTitle: string;
  subtitle: string;
  title: string;
  xpMetric: string;
};

const profileCopy: Record<AppLanguage, ProfileCopy> = {
  sv: {
    answersPerDay: 'svar/dag',
    audioDisabledBadge: 'Ljud av',
    audioEnabledBadge: 'Ljud på',
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
    openSettings: 'Justera studieinställningar',
    openSettingsAccessibilityLabel: 'Öppna inställningar för dagligt mål, språk och ljud',
    questionsHelper: 'frågor',
    settingsShortcutHelper: 'Dagligt mål, språk och ljud',
    studySetupSubtitle: 'Små dagliga mål är lättare att hålla än långa maratonpass.',
    studySetupTitle: 'Studieinställningar',
    subtitle:
      'Dina mål, språkval, sviter och märken sparas bara på den här enheten, så att dina studier förblir privata.',
    title: 'Framsteg utan konto',
    xpMetric: 'XP',
  },
  en: {
    answersPerDay: 'answers/day',
    audioDisabledBadge: 'Audio off',
    audioEnabledBadge: 'Audio on',
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
    openSettings: 'Adjust study settings',
    openSettingsAccessibilityLabel: 'Open settings for daily goal, language, and audio',
    questionsHelper: 'questions',
    settingsShortcutHelper: 'Daily goal, language, and audio',
    studySetupSubtitle: 'Small daily goals are easier to keep than long cram sessions.',
    studySetupTitle: 'Study setup',
    subtitle:
      'Your goals, language mode, streaks, and badges stay on this device for a private study experience.',
    title: 'Progress without an account',
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
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
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
  const badges = deriveBadges(badgeInput);
  const unlockedBadgeIds = new Set(badges.map((badge) => badge.id));

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
            {dailyGoalAnswers} {copy.answersPerDay}
          </Badge>
          <Badge tone="warm">{copy.languageBadge}</Badge>
          <Badge tone={audioEnabled ? 'green' : 'orange'}>
            {audioEnabled ? copy.audioEnabledBadge : copy.audioDisabledBadge}
          </Badge>
        </View>
        <View style={styles.settingsShortcutRow}>
          <Text style={styles.settingsShortcutHelper}>{copy.settingsShortcutHelper}</Text>
          <Link
            accessibilityLabel={copy.openSettingsAccessibilityLabel}
            accessibilityRole="link"
            href="/settings"
            style={styles.settingsLink}
          >
            {copy.openSettings}
          </Link>
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
        <ComplianceActionLink
          accessibilityLabel={copy.dashboardAccessibilityLabel}
          href="/dashboard"
          label={copy.dashboardCta}
        />
      </Card>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.badgesTitle} subtitle={copy.badgesSubtitle} />
        <View style={styles.badgeList}>
          {getAllBadges().map((badge) => {
            const unlocked = unlockedBadgeIds.has(badge.id);
            const title = getBadgeTitle(badge, language);
            const description = unlocked
              ? getBadgeDescription(badge, language)
              : getBadgeLockedHint(badge, language);
            const progressHint = getBadgeProgressHint(badge, badgeInput, language);
            const statusLabel = unlocked ? copy.badgeUnlocked : copy.badgeLocked;

            return (
              <BadgeRow
                key={badge.id}
                title={title}
                description={description}
                progressHint={progressHint}
                statusLabel={statusLabel}
                unlocked={unlocked}
              />
            );
          })}
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
  settingsShortcutHelper: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  settingsShortcutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
  value: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.small,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
    textDecorationLine: 'none',
  },
});
