import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { ProPaywall } from '../components/monetization/ProPaywall';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { RouteLink } from '../components/ui/RouteLink';
import { ScreenShell, SectionHeader } from '../components/ui/ScreenShell';
import { questions } from '../data/questions';
import { REVIEW_GRADES } from '../lib/learning/spacedRepetition';
import { hasProEntitlement } from '../lib/monetization/premium';
import { isProRuntimeScopeEnabled } from '../lib/monetization/releasePolicy';
import { useProLifetimeEntitlements } from '../lib/monetization/useProLifetimeEntitlements';
import {
  dueCards,
  FREE_DAILY_REVIEW_CAP,
  remainingDailyReviews,
  useReviewStore,
} from '../lib/storage/reviewStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../types/content';

type ReviewCopy = {
  againHelper: string;
  againLabel: string;
  cardPosition: (current: number, total: number) => string;
  ctaPractice: string;
  dueBadge: string;
  easyHelper: string;
  easyLabel: string;
  emptySubtitle: string;
  emptyTitle: string;
  freeCapBody: (cap: number) => string;
  freeCapReachedSubtitle: (cap: number) => string;
  freeCapReachedTitle: string;
  goodHelper: string;
  goodLabel: string;
  gradeAccessibilityLabel: (label: string, helper: string) => string;
  hardHelper: string;
  hardLabel: string;
  lockedBody: (count: number) => string;
  lockedTitle: string;
  paywallTitle: string;
  queueCount: (count: number) => string;
  subtitle: string;
  title: string;
};

const reviewCopy: Record<AppLanguage, ReviewCopy> = {
  sv: {
    againHelper: 'Snart igen',
    againLabel: 'Igen',
    cardPosition: (current, total) => `Kort ${current} av ${total}`,
    ctaPractice: 'Starta övning',
    dueBadge: 'Lokal repetition',
    easyHelper: 'Längre intervall',
    easyLabel: 'Lätt',
    emptySubtitle: 'Nya repetitionskort dyker upp här när du har övat fler frågor.',
    emptyTitle: 'Inga repetitionskort väntar just nu',
    freeCapBody: (cap) =>
      `Gratisläget visar upp till ${cap} repetitionskort per dag. Pro öppnar hela kön när Pro-funktioner är aktiverade.`,
    freeCapReachedSubtitle: (cap) =>
      `Du har gjort dagens ${cap} fria repetition(er). Kom tillbaka i morgon eller fortsätt med Pro.`,
    freeCapReachedTitle: 'Dagens gratisrepetition är klar',
    goodHelper: 'Normal takt',
    goodLabel: 'Bra',
    gradeAccessibilityLabel: (label, helper) => `${label}. ${helper}.`,
    hardHelper: 'Kortare intervall',
    hardLabel: 'Svår',
    lockedBody: (count) =>
      `${count} kort till väntar i kön. Gratisläget låter dig repetera några kort per dag.`,
    lockedTitle: 'Fler kort väntar med Pro',
    paywallTitle: 'Jämför Pro för hela repetitionskön',
    queueCount: (count) => `${count} kort i dagens kö`,
    subtitle:
      'Repetera kort som är förfallna i den lokala FSRS-kön och välj hur väl du mindes svaret.',
    title: 'Dagens repetition',
  },
  en: {
    againHelper: 'Soon again',
    againLabel: 'Again',
    cardPosition: (current, total) => `Card ${current} of ${total}`,
    ctaPractice: 'Start practice',
    dueBadge: 'Local review',
    easyHelper: 'Longer interval',
    easyLabel: 'Easy',
    emptySubtitle: 'New review cards appear here after you practise more questions.',
    emptyTitle: 'No review cards are due right now',
    freeCapBody: (cap) =>
      `Free mode shows up to ${cap} review cards per day. Pro opens the full queue when Pro features are enabled.`,
    freeCapReachedSubtitle: (cap) =>
      `You have completed today's ${cap} free review(s). Come back tomorrow or continue with Pro.`,
    freeCapReachedTitle: "Today's free review is complete",
    goodHelper: 'Normal pace',
    goodLabel: 'Good',
    gradeAccessibilityLabel: (label, helper) => `${label}. ${helper}.`,
    hardHelper: 'Shorter interval',
    hardLabel: 'Hard',
    lockedBody: (count) =>
      `${count} more cards are waiting in the queue. Free mode lets you review a few cards per day.`,
    lockedTitle: 'More cards are waiting with Pro',
    paywallTitle: 'Compare Pro for the full review queue',
    queueCount: (count) => `${count} cards in today's queue`,
    subtitle:
      'Review cards that are due in the local FSRS queue and choose how well you remembered the answer.',
    title: "Today's review",
  },
};

const gradeButtons = [
  {
    grade: REVIEW_GRADES.AGAIN,
    helperKey: 'againHelper',
    labelKey: 'againLabel',
    variant: 'danger',
  },
  {
    grade: REVIEW_GRADES.HARD,
    helperKey: 'hardHelper',
    labelKey: 'hardLabel',
    variant: 'secondary',
  },
  {
    grade: REVIEW_GRADES.GOOD,
    helperKey: 'goodHelper',
    labelKey: 'goodLabel',
    variant: 'primary',
  },
  {
    grade: REVIEW_GRADES.EASY,
    helperKey: 'easyHelper',
    labelKey: 'easyLabel',
    variant: 'success',
  },
] as const;

const questionById = new Map<string, PracticeQuestion>(
  questions.map((question) => [question.id, question]),
);
const questionIdAllowlist = new Set(questionById.keys());

export default function ReviewScreen() {
  const language = useSettingsStore((state) => state.language);
  const reviewCardsById = useReviewStore((state) => state.byId);
  const reviewGradedPerDay = useReviewStore((state) => state.gradedPerDay);
  const gradeReviewCard = useReviewStore((state) => state.grade);
  const { entitlements, entitlementsReady } = useProLifetimeEntitlements();
  const proRuntimeScopeEnabled = isProRuntimeScopeEnabled();
  const proReviewUnlocked =
    proRuntimeScopeEnabled && entitlementsReady && hasProEntitlement(entitlements);
  const copy = reviewCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const allDueReviewCards = useMemo(
    () =>
      dueCards(
        { byId: reviewCardsById },
        {
          questionIdAllowlist,
        },
      ),
    [reviewCardsById],
  );
  const remainingFreeReviews = remainingDailyReviews(
    { gradedPerDay: reviewGradedPerDay },
    { isPro: proReviewUnlocked },
  );
  const visibleDueCards = useMemo(() => {
    if (proReviewUnlocked) return allDueReviewCards;
    return allDueReviewCards.slice(0, remainingFreeReviews);
  }, [allDueReviewCards, proReviewUnlocked, remainingFreeReviews]);
  const activeReviewCard = visibleDueCards[0] ?? null;
  const activeQuestion = activeReviewCard ? questionById.get(activeReviewCard.questionId) : null;
  const hiddenDueCount = Math.max(0, allDueReviewCards.length - visibleDueCards.length);
  const capReached =
    !proReviewUnlocked && allDueReviewCards.length > 0 && remainingFreeReviews === 0;

  return (
    <ScreenShell eyebrow={copy.dueBadge} title={copy.title} subtitle={copy.subtitle}>
      <QuestionDisclaimer language={language} />
      <Card style={styles.queueCard}>
        <SectionHeader title={copy.queueCount(allDueReviewCards.length)} />
        <Text style={styles.queueText}>{copy.freeCapBody(FREE_DAILY_REVIEW_CAP)}</Text>
      </Card>

      {activeReviewCard && activeQuestion ? (
        <View style={styles.reviewStack}>
          <Badge tone="blue">{copy.cardPosition(1, visibleDueCards.length)}</Badge>
          <QuestionCard question={activeQuestion} language={language} />
          <View style={styles.gradeGrid}>
            {gradeButtons.map(({ grade, helperKey, labelKey, variant }) => {
              const label = copy[labelKey];
              const helper = copy[helperKey];
              return (
                <Button
                  accessibilityLabel={copy.gradeAccessibilityLabel(label, helper)}
                  key={grade}
                  onPress={() => gradeReviewCard(activeReviewCard.questionId, grade)}
                  style={styles.gradeButton}
                  textStyle={styles.gradeButtonText}
                  variant={variant}
                >
                  {label}
                </Button>
              );
            })}
          </View>
          <View style={styles.gradeHintRow}>
            <Text style={styles.gradeHint}>{copy.againHelper}</Text>
            <Text style={styles.gradeHint}>{copy.hardHelper}</Text>
            <Text style={styles.gradeHint}>{copy.goodHelper}</Text>
            <Text style={styles.gradeHint}>{copy.easyHelper}</Text>
          </View>
        </View>
      ) : capReached ? (
        <Card style={styles.emptyCard}>
          <SectionHeader
            title={copy.freeCapReachedTitle}
            subtitle={copy.freeCapReachedSubtitle(FREE_DAILY_REVIEW_CAP)}
          />
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <SectionHeader title={copy.emptyTitle} subtitle={copy.emptySubtitle} />
          <RouteLink
            accessibilityLabel={copy.ctaPractice}
            href="/practice"
            style={styles.practiceLink}
            variant="secondary"
          >
            {copy.ctaPractice}
          </RouteLink>
        </Card>
      )}

      {hiddenDueCount > 0 ? (
        <Card style={styles.lockedCard}>
          <SectionHeader title={copy.lockedTitle} subtitle={copy.lockedBody(hiddenDueCount)} />
          {proRuntimeScopeEnabled && entitlementsReady ? (
            <View style={styles.paywallBlock}>
              <Text accessibilityRole="header" style={styles.paywallTitle}>
                {copy.paywallTitle}
              </Text>
              <ProPaywall alreadyAdFree={entitlements.adsDisabled === true} language={language} />
            </View>
          ) : null}
        </Card>
      ) : null}
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    queueCard: {
      gap: space[1],
    },
    queueText: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    reviewStack: {
      gap: space[1.5],
    },
    gradeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    gradeButton: {
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: space[7],
    },
    gradeButtonText: {
      textAlign: 'center',
    },
    gradeHintRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    gradeHint: {
      color: themeColors.textMuted,
      flexBasis: '47%',
      flexGrow: 1,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
      textAlign: 'center',
    },
    emptyCard: {
      gap: space[1.5],
    },
    practiceLink: {
      alignSelf: 'flex-start',
    },
    lockedCard: {
      gap: space[1.5],
    },
    paywallBlock: {
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1],
      padding: space[1],
    },
    paywallTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
  });
}
