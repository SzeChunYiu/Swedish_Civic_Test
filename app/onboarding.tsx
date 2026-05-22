import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { RouteLink } from '../components/ui/RouteLink';
import {
  supportedDailyGoalAnswerOptions,
  useSettingsStore,
  type AppLanguage,
} from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type DailyGoalPresetValue = Exclude<(typeof supportedDailyGoalAnswerOptions)[number], 5>;

function isOnboardingDailyGoalPresetValue(
  goal: (typeof supportedDailyGoalAnswerOptions)[number],
): goal is DailyGoalPresetValue {
  return goal !== 5;
}

const onboardingDailyGoalPresetValues: readonly DailyGoalPresetValue[] =
  supportedDailyGoalAnswerOptions.filter(isOnboardingDailyGoalPresetValue);

type OnboardingGoalPresetCopy = {
  accessibilityLabel: string;
  helper: string;
  label: string;
  summary: string;
};

type OnboardingCopy = {
  adjustSettings: string;
  adjustSettingsAccessibilityLabel: string;
  dailyGoalPresets: Record<DailyGoalPresetValue, OnboardingGoalPresetCopy>;
  dailyGoalSubtitle: string;
  dailyGoalTitle: string;
  decideLater: string;
  decideLaterAccessibilityLabel: string;
  eyebrow: string;
  startStudying: string;
  startStudyingAccessibilityLabel: string;
  steps: readonly string[];
  subtitle: string;
  title: string;
};

const onboardingCopy: Record<AppLanguage, OnboardingCopy> = {
  sv: {
    adjustSettings: 'Justera inställningar',
    adjustSettingsAccessibilityLabel: 'Öppna inställningar',
    dailyGoalPresets: {
      10: {
        accessibilityLabel: 'Välj lugnt dagligt mål med 10 svar',
        helper: 'En liten vana när du vill komma igång utan stress.',
        label: 'Lugn',
        summary: '10 svar per dag',
      },
      20: {
        accessibilityLabel: 'Välj regelbundet dagligt mål med 20 svar',
        helper: 'För stadiga studiepass de flesta dagar.',
        label: 'Regelbunden',
        summary: '20 svar per dag',
      },
      40: {
        accessibilityLabel: 'Välj seriöst dagligt mål med 40 svar',
        helper: 'När du vill träna mer inför ett närliggande övningsprov.',
        label: 'Seriös',
        summary: '40 svar per dag',
      },
    },
    dailyGoalSubtitle:
      'Börja med en takt som känns lätt att hålla. Du kan ändra den när som helst.',
    dailyGoalTitle: 'Välj ett mjukt dagligt mål',
    decideLater: 'Bestäm senare',
    decideLaterAccessibilityLabel: 'Fortsätt utan att välja dagligt mål',
    eyebrow: 'Välkommen',
    startStudying: 'Börja studera',
    startStudyingAccessibilityLabel: 'Börja studera',
    steps: [
      'Studera svenska samhällsbegrepp med engelskt stöd vid behov.',
      'Öva med UHR-refererade frågor och förklaringar.',
      'Följ framsteg lokalt på din enhet utan konto.',
    ],
    subtitle:
      'En liten, fristående studiekompis för daglig övning, provträning och genomgång av frågor du missat.',
    title: 'Förbered dig lugnt för samhällskunskapsprovet',
  },
  en: {
    adjustSettings: 'Adjust settings',
    adjustSettingsAccessibilityLabel: 'Adjust settings',
    dailyGoalPresets: {
      10: {
        accessibilityLabel: 'Choose casual daily goal with 10 answers',
        helper: 'A small habit when you want to get started without stress.',
        label: 'Casual',
        summary: '10 answers per day',
      },
      20: {
        accessibilityLabel: 'Choose regular daily goal with 20 answers',
        helper: 'For steady study on most days.',
        label: 'Regular',
        summary: '20 answers per day',
      },
      40: {
        accessibilityLabel: 'Choose serious daily goal with 40 answers',
        helper: 'When you want extra practice before an upcoming mock exam.',
        label: 'Serious',
        summary: '40 answers per day',
      },
    },
    dailyGoalSubtitle: 'Start with a pace that feels easy to keep. You can change it anytime.',
    dailyGoalTitle: 'Choose a gentle daily goal',
    decideLater: 'Decide later',
    decideLaterAccessibilityLabel: 'Continue without choosing a daily goal',
    eyebrow: 'Welcome',
    startStudying: 'Start studying',
    startStudyingAccessibilityLabel: 'Start studying',
    steps: [
      'Study Swedish civic concepts with English support when needed.',
      'Practice with UHR-referenced questions and explanations.',
      'Track progress locally on your device without an account.',
    ],
    subtitle:
      'A small, independent study companion for daily practice, mock exams, and mistake review.',
    title: 'Prepare calmly for the civic test',
  },
};

export default function Screen() {
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);
  const copy = onboardingCopy[language];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>

      <View style={styles.steps}>
        {copy.steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.goalSection}>
        <Text accessibilityRole="header" style={styles.goalTitle}>
          {copy.dailyGoalTitle}
        </Text>
        <Text style={styles.goalSubtitle}>{copy.dailyGoalSubtitle}</Text>
        <View
          aria-label={copy.dailyGoalTitle}
          accessibilityLabel={copy.dailyGoalTitle}
          accessibilityRole="radiogroup"
          style={styles.goalPresetGrid}
        >
          {onboardingDailyGoalPresetValues.map((goal) => {
            const preset = copy.dailyGoalPresets[goal];
            const selected = dailyGoalAnswers === goal;

            return (
              <Pressable
                key={goal}
                aria-checked={selected}
                accessibilityLabel={preset.accessibilityLabel}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                hitSlop={space[1]}
                onPress={() => setDailyGoalAnswers(goal)}
                style={({ pressed }) => [
                  styles.goalPreset,
                  selected ? styles.goalPresetActive : null,
                  pressed ? styles.goalPresetPressed : null,
                ]}
              >
                <Text
                  style={[styles.goalPresetLabel, selected ? styles.goalPresetTextActive : null]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[styles.goalPresetSummary, selected ? styles.goalPresetTextActive : null]}
                >
                  {preset.summary}
                </Text>
                <Text
                  style={[styles.goalPresetHelper, selected ? styles.goalPresetTextActive : null]}
                >
                  {preset.helper}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <RouteLink
          accessibilityLabel={copy.decideLaterAccessibilityLabel}
          href="/home"
          style={styles.decideLaterLink}
          variant="text"
        >
          {copy.decideLater}
        </RouteLink>
      </View>

      <QuestionDisclaimer />
      <ComplianceLinks />

      <View style={styles.actions}>
        <RouteLink
          accessibilityLabel={copy.startStudyingAccessibilityLabel}
          href="/home"
          style={styles.primaryLink}
          variant="primary"
        >
          {copy.startStudying}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.adjustSettingsAccessibilityLabel}
          href="/settings"
          style={styles.secondaryLink}
          variant="secondary"
        >
          {copy.adjustSettings}
        </RouteLink>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: space[2.25],
    justifyContent: 'center',
    padding: space[3],
    paddingBottom: space[10],
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: space.hairline,
    gap: space[1.25],
    padding: space[3],
  },
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.heroMobile.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    lineHeight: typography.heroMobile.lineHeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  steps: {
    gap: space[1.5],
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
  },
  stepNumber: {
    backgroundColor: colors.badgeBlueBg,
    borderRadius: radius.pill,
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.75],
  },
  stepText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  goalSection: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1.5],
    padding: space[2],
  },
  goalTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  goalSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  goalPresetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  goalPreset: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexBasis: space[15],
    flexGrow: 1,
    gap: space[0.5],
    minHeight: space[10],
    padding: space[1.5],
  },
  goalPresetActive: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  goalPresetPressed: {
    borderColor: colors.focus,
  },
  goalPresetLabel: {
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  goalPresetSummary: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  goalPresetHelper: {
    color: colors.textMuted,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  goalPresetTextActive: {
    color: colors.badgeBlueText,
  },
  decideLaterLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    color: colors.textSecondary,
    display: 'flex',
    justifyContent: 'center',
    minHeight: space[6],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  primaryLink: {
    alignItems: 'center',
    borderRadius: radius.micro,
    display: 'flex',
    justifyContent: 'center',
    minHeight: space[6],
  },
  secondaryLink: {
    alignItems: 'center',
    borderRadius: radius.micro,
    display: 'flex',
    justifyContent: 'center',
    minHeight: space[6],
  },
});
