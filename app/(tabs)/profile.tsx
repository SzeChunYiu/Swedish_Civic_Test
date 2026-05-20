import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../../components/compliance/ComplianceLinks';
import { BadgeRow } from '../../components/learning/BadgeRow';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { Badge } from '../../components/ui/Badge';
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
  dayStreakMetric: string;
  eyebrow: string;
  languageBadge: string;
  levelMetric: string;
  noBadges: string;
  openSettings: string;
  openSettingsAccessibilityLabel: string;
  questionsHelper: string;
  studySetupSubtitle: string;
  studySetupTitle: string;
  subtitle: string;
  title: string;
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
    dayStreakMetric: 'dagars svit',
    eyebrow: 'Lokal profil',
    languageBadge: 'Svenska',
    levelMetric: 'nivå',
    noBadges: 'Inga märken ännu',
    openSettings: 'Öppna inställningar',
    openSettingsAccessibilityLabel: 'Öppna inställningar',
    questionsHelper: 'frågor',
    studySetupSubtitle: 'Små dagliga mål är lättare att hålla än långa maratonpass.',
    studySetupTitle: 'Studieinställningar',
    subtitle:
      'Dina mål, språkval, sviter och märken sparas på den här enheten för privat studierutin.',
    title: 'Framsteg utan konto',
    xpMetric: 'XP',
  },
  en: {
    answersPerDay: 'answers/day',
    badgeLocked: 'Locked',
    badgeUnlocked: 'Unlocked',
    badgesSubtitle: 'Achievement cues make progress visible without distracting from learning.',
    badgesTitle: 'Badges',
    completedMetric: 'completed',
    dayStreakMetric: 'day streak',
    eyebrow: 'Local profile',
    languageBadge: 'English support',
    levelMetric: 'level',
    noBadges: 'No badges yet',
    openSettings: 'Open settings',
    openSettingsAccessibilityLabel: 'Open settings',
    questionsHelper: 'questions',
    studySetupSubtitle: 'Small daily goals are easier to keep than long cram sessions.',
    studySetupTitle: 'Study setup',
    subtitle:
      'Your goals, language mode, streaks, and badges stay on this device for a private study experience.',
    title: 'Progress without an account',
    xpMetric: 'XP',
  },
};

export default function Screen() {
  const {
    entitlements: monetizationEntitlements,
    purchaseRuntime,
    setEntitlements: setMonetizationEntitlements,
  } = useRemoveAdsEntitlements();
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const copy = profileCopy[language];
  const level = calculateLevel(totalXp);
  const currentStreak = calculateStreak(answerDates);
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

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <View style={styles.statsRow}>
        <MetricCard label={copy.levelMetric} value={level} tone="blue" />
        <MetricCard label={copy.xpMetric} value={totalXp} />
      </View>
      <View style={styles.statsRow}>
        <MetricCard label={copy.dayStreakMetric} value={currentStreak} />
        <MetricCard
          label={copy.completedMetric}
          value={completedQuestionIds.length}
          helper={copy.questionsHelper}
        />
      </View>

      <Card style={styles.cardWide}>
        <SectionHeader title={copy.studySetupTitle} subtitle={copy.studySetupSubtitle} />
        <View style={styles.pillRow}>
          <Badge tone="blue">
            {dailyGoalAnswers} {copy.answersPerDay}
          </Badge>
          <Badge tone="warm">{copy.languageBadge}</Badge>
        </View>
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

      <PremiumBanner
        entitlements={monetizationEntitlements}
        language={language}
        onEntitlementsChange={setMonetizationEntitlements}
        runtimeOptions={purchaseRuntime}
      />
      <ComplianceLinks />

      <Link
        accessibilityLabel={copy.openSettingsAccessibilityLabel}
        accessibilityRole="link"
        href="/settings"
        style={styles.settingsLink}
      >
        {copy.openSettings}
      </Link>
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  badgeList: {
    gap: space[1],
  },
  emptyBadgeText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
