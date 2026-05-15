import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import type { AppLanguage } from '../lib/storage/settingsStore';
import { useSettingsStore } from '../lib/storage/settingsStore';

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);

  const renderLanguageButton = (value: AppLanguage, label: string) => (
    <Pressable
      key={value}
      onPress={() => setLanguage(value)}
      style={[styles.pill, language === value ? styles.pillActive : null]}
    >
      <Text style={[styles.pillText, language === value ? styles.pillTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Link href="/(tabs)/profile" style={styles.backLink}>
        ← Back to Profile
      </Link>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Control study language, audio, and your daily goal.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Question language</Text>
        <View style={styles.row}>
          {[renderLanguageButton('sv', 'Swedish'), renderLanguageButton('en', 'English support')]}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio</Text>
        <Pressable onPress={() => setAudioEnabled(!audioEnabled)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {audioEnabled ? 'Audio enabled' : 'Audio disabled'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily goal</Text>
        <Text style={styles.subtitle}>{dailyGoalAnswers} answers per day</Text>
        <View style={styles.row}>
          {[5, 10, 20].map((goal) => (
            <Pressable
              key={goal}
              onPress={() => setDailyGoalAnswers(goal)}
              style={[styles.pill, dailyGoalAnswers === goal ? styles.pillActive : null]}
            >
              <Text
                style={[styles.pillText, dailyGoalAnswers === goal ? styles.pillTextActive : null]}
              >
                {goal}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ComplianceLinks />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
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
  subtitle: {
    color: '#615d59',
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#f6f5f4',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: '#f2f9ff',
    borderColor: '#097fe8',
  },
  pillText: {
    color: '#615d59',
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#097fe8',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0075de',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
