import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import { QuestionDisclaimer } from '../components/quiz/QuestionDisclaimer';
import { colors, radius, space, typography } from '../lib/theme';

const steps = [
  'Study Swedish civic concepts with English support when needed.',
  'Practice with UHR-referenced questions and explanations.',
  'Track progress locally on your device without an account.',
];

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Welcome</Text>
      <Text style={styles.title}>Prepare calmly for the civic test</Text>
      <Text style={styles.subtitle}>A small, independent study companion for daily practice.</Text>

      <View style={styles.steps}>
        {steps.map((step, index) => (
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
          accessibilityLabel="Start studying"
          accessibilityRole="link"
          href="/home"
          style={styles.primaryLink}
        >
          Start studying
        </Link>
        <Link
          accessibilityLabel="Adjust settings"
          accessibilityRole="link"
          href="/settings"
          style={styles.secondaryLink}
        >
          Adjust settings
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[2.25],
    justifyContent: 'center',
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
