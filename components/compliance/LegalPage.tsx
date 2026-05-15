import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';

export function LegalPage({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/(tabs)/profile" style={styles.backLink}>
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
    backgroundColor: '#ffffff',
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 24,
  },
  backLink: {
    color: '#0075de',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'none',
  },
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  body: {
    gap: 14,
  },
  section: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    gap: 8,
    padding: 16,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  paragraph: {
    color: '#615d59',
    fontSize: 15,
    lineHeight: 22,
  },
});
