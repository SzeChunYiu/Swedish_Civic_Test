import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, space, typography } from '../lib/theme';

export default function NotFoundScreen() {
  return (
    <ScrollView
      accessibilityLabel="Page not found recovery screen"
      contentContainerStyle={styles.content}
      style={styles.container}
    >
      <Card elevated style={styles.hero}>
        <Badge tone="orange">Route fallback</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          Page not found
        </Text>
        <Text style={styles.body}>
          This study page is not available. Use a known route to keep practicing with source-backed
          questions.
        </Text>
      </Card>

      <Card accessibilityLabel="Safe route recovery actions" style={styles.card}>
        <Text style={styles.sectionTitle}>Choose a safe study route</Text>
        <Text style={styles.body}>
          The fallback keeps broken links inside the app shell, then offers quick paths back to the
          dashboard or a practice session.
        </Text>
        <View style={styles.actions}>
          <Button
            accessibilityLabel="Return to study home"
            accessibilityRole="button"
            onPress={() => router.replace('/home')}
            variant="primary"
          >
            Go to home
          </Button>
          <Button
            accessibilityLabel="Start practice from the route fallback"
            accessibilityRole="button"
            onPress={() => router.replace('/practice')}
            variant="secondary"
          >
            Start practice
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: space[2],
    justifyContent: 'center',
    padding: space[3],
  },
  hero: {
    gap: space[1.5],
  },
  card: {
    gap: space[1.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.heroMobile.fontSize,
    fontWeight: typography.heroMobile.fontWeight,
    lineHeight: typography.heroMobile.lineHeight,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
});
