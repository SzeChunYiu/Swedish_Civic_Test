import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import type { AppLanguage } from '../lib/storage/settingsStore';
import { useSettingsStore } from '../lib/storage/settingsStore';
import { colors, radius, shadows, space, typography } from '../lib/theme';

type SettingsCopy = {
  audioDisabledLabel: string;
  audioEnabledLabel: string;
  audioTitle: string;
  backToProfile: string;
  backToProfileAccessibilityLabel: string;
  dailyGoalPresetLabel: (goal: number) => string;
  dailyGoalSummary: (answerCount: number) => string;
  dailyGoalTitle: string;
  disableAudioAccessibilityLabel: string;
  enableAudioAccessibilityLabel: string;
  languageAccessibilityLabel: (label: string) => string;
  questionLanguageTitle: string;
  setDailyGoalAccessibilityLabel: (goal: number) => string;
  subtitle: string;
  title: string;
};

const settingsCopy: Record<AppLanguage, SettingsCopy> = {
  sv: {
    audioDisabledLabel: 'Ljud avstängt',
    audioEnabledLabel: 'Ljud på',
    audioTitle: 'Ljud',
    backToProfile: '← Tillbaka till profil',
    backToProfileAccessibilityLabel: 'Tillbaka till profil',
    dailyGoalPresetLabel: (goal) => {
      if (goal === 5) return 'Snabb';
      if (goal === 10) return 'Lagom';
      if (goal === 20) return 'Fokuserad';
      if (goal === 40) return 'Intensiv';
      return `${goal}`;
    },
    dailyGoalSummary: (answerCount) => `${answerCount} svar per dag`,
    dailyGoalTitle: 'Dagligt mål',
    disableAudioAccessibilityLabel: 'Stäng av ljud',
    enableAudioAccessibilityLabel: 'Slå på ljud',
    languageAccessibilityLabel: (label) => `Byt frågespråk till ${label}`,
    questionLanguageTitle: 'Frågespråk',
    setDailyGoalAccessibilityLabel: (goal) => `Ställ in dagligt mål till ${goal} svar`,
    subtitle: 'Styr studiespråk, ljud och ditt dagliga mål.',
    title: 'Inställningar',
  },
  en: {
    audioDisabledLabel: 'Audio disabled',
    audioEnabledLabel: 'Audio enabled',
    audioTitle: 'Audio',
    backToProfile: '← Back to Profile',
    backToProfileAccessibilityLabel: 'Back to profile',
    dailyGoalPresetLabel: (goal) => {
      if (goal === 5) return 'Quick';
      if (goal === 10) return 'Steady';
      if (goal === 20) return 'Focused';
      if (goal === 40) return 'Serious';
      return `${goal}`;
    },
    dailyGoalSummary: (answerCount) => `${answerCount} answers per day`,
    dailyGoalTitle: 'Daily goal',
    disableAudioAccessibilityLabel: 'Disable audio',
    enableAudioAccessibilityLabel: 'Enable audio',
    languageAccessibilityLabel: (label) => `Set question language to ${label}`,
    questionLanguageTitle: 'Question language',
    setDailyGoalAccessibilityLabel: (goal) => `Set daily goal to ${goal} answers`,
    subtitle: 'Control study language, audio, and your daily goal.',
    title: 'Settings',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);
  const copy = settingsCopy[language];

  const renderLanguageButton = (value: AppLanguage, labelEn: string, labelSv: string) => {
    const label = language === 'sv' ? labelSv : labelEn;

    return (
      <Pressable
        key={value}
        aria-selected={language === value}
        accessibilityLabel={copy.languageAccessibilityLabel(label)}
        accessibilityRole="button"
        accessibilityState={{ selected: language === value }}
        hitSlop={space[1]}
        onPress={() => setLanguage(value)}
        style={[styles.pill, language === value ? styles.pillActive : null]}
      >
        <Text style={[styles.pillText, language === value ? styles.pillTextActive : null]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel={copy.backToProfileAccessibilityLabel}
        accessibilityRole="link"
        href="/(tabs)/profile"
        style={styles.backLink}
      >
        {copy.backToProfile}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.questionLanguageTitle}
        </Text>
        <View style={styles.row}>
          {[
            renderLanguageButton('sv', 'Swedish', 'Svenska'),
            renderLanguageButton('en', 'English support', 'Engelskt stöd'),
          ]}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.audioTitle}
        </Text>
        <Pressable
          aria-checked={audioEnabled}
          accessibilityLabel={
            audioEnabled ? copy.disableAudioAccessibilityLabel : copy.enableAudioAccessibilityLabel
          }
          accessibilityRole="switch"
          accessibilityState={{ checked: audioEnabled }}
          hitSlop={space[1]}
          onPress={() => setAudioEnabled(!audioEnabled)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            {audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.dailyGoalTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.dailyGoalSummary(dailyGoalAnswers)}</Text>
        <View style={styles.row}>
          {[5, 10, 20, 40].map((goal) => {
            const selected = dailyGoalAnswers === goal;

            return (
              <Pressable
                key={goal}
                aria-selected={dailyGoalAnswers === goal}
                accessibilityLabel={copy.setDailyGoalAccessibilityLabel(goal)}
                accessibilityRole="button"
                accessibilityState={{ selected: dailyGoalAnswers === goal }}
                hitSlop={space[1]}
                onPress={() => setDailyGoalAnswers(goal)}
                style={[styles.pill, styles.goalPill, selected ? styles.pillActive : null]}
              >
                <Text style={[styles.goalNumberText, selected ? styles.pillTextActive : null]}>
                  {goal}
                </Text>
                <Text style={[styles.goalPresetText, selected ? styles.pillTextActive : null]}>
                  {copy.dailyGoalPresetLabel(goal)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ComplianceLinks />
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
    gap: space[2.25],
    padding: space[3],
    paddingBottom: space[10],
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
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
    ...shadows.card,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: space[5] + space[0.5],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  pillActive: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  pillTextActive: {
    color: colors.badgeBlueText,
  },
  goalPill: {
    alignItems: 'flex-start',
    gap: space.hairline,
    minWidth: space[12],
  },
  goalNumberText: {
    color: colors.text,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyBold.lineHeight,
  },
  goalPresetText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.card,
    justifyContent: 'center',
    minHeight: space[5] + space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
  },
  secondaryButtonText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
