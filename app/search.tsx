import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';

export default function SearchScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>
        Question search is coming. For now, browse by chapter — each chapter groups its questions
        with explanations.
      </Text>
      <Link
        accessibilityLabel="Browse chapters"
        accessibilityRole="link"
        href="/learn"
        style={styles.primaryButton}
      >
        Browse chapters
      </Link>
      <Link
        accessibilityLabel="Back to home"
        accessibilityRole="link"
        href="/(tabs)/home"
        style={styles.backLink}
      >
        Back
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[2],
    justifyContent: 'center',
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    maxWidth: 360,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  backLink: {
    color: colors.textMuted,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
});
