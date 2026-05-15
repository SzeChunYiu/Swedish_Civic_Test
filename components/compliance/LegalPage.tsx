import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { colors, radius, space, typography } from '../../lib/theme';

export function LegalPage({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel="Back to profile"
        accessibilityRole="link"
        href="/(tabs)/profile"
        style={styles.backLink}
      >
        ← Back to Profile
      </Link>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

export function LegalSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.paragraph}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2.25],
    padding: space[3],
  },
  backLink: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  title: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
  },
  body: {
    gap: space[1.75],
  },
  section: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[1],
    padding: space[2],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
});
