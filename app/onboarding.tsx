import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';

type OnboardingCopy = {
  adjustSettings: string;
  adjustSettingsAccessibilityLabel: string;
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
    eyebrow: 'Välkommen',
    startStudying: 'Börja studera',
    startStudyingAccessibilityLabel: 'Börja studera',
    steps: [
      'Studera svenska samhällsbegrepp med engelskt stöd vid behov.',
      'Öva med UHR-refererade frågor och förklaringar.',
      'Följ framsteg lokalt på din enhet utan konto.',
    ],
    subtitle:
      'En liten, fristående studiekompis för daglig övning, provträning och repetition av misstag.',
    title: 'Förbered dig lugnt för samhällskunskapsprovet',
  },
  en: {
    adjustSettings: 'Adjust settings',
    adjustSettingsAccessibilityLabel: 'Adjust settings',
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
  const language = useSettingsStore((state) => state.language);
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

      <QuestionDisclaimer />
      <ComplianceLinks />

      <View style={styles.actions}>
        <Link
          accessibilityLabel={copy.startStudyingAccessibilityLabel}
          accessibilityRole="link"
          href="/home"
          style={styles.primaryLink}
        >
          {copy.startStudying}
        </Link>
        <Link
          accessibilityLabel={copy.adjustSettingsAccessibilityLabel}
          accessibilityRole="link"
          href="/settings"
          style={styles.secondaryLink}
        >
          {copy.adjustSettings}
        </Link>
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
    borderWidth: StyleSheet.hairlineWidth,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  primaryLink: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryLink: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
