import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import type { AppLanguage } from '../lib/storage/settingsStore';
import { useSettingsStore } from '../lib/storage/settingsStore';
import { colors, radius, space } from '../lib/theme';

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
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[2.25],
    padding: space[3],
  },
  backLink: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'none',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  pill: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  pillActive: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.badgeBlueText,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  secondaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
});
