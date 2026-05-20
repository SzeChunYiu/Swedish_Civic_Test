import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import type { TextStyle } from 'react-native';

import { ComplianceActionLink } from '../components/compliance/ComplianceActionLink';
import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import { PersistenceWarningNotice } from '../components/storage/PersistenceWarningNotice';
import {
  applyLocalStudyDataImport,
  previewLocalStudyDataImport,
  type LocalStudyDataImportErrorCode,
  type LocalStudyDataImportPreview,
  type LocalStudyDataImportSummary,
} from '../lib/storage/localStudyDataImport';
import type { AudioPlaybackRate, FontSizeStep, ThemeMode } from '../lib/storage/accessibilityStore';
import {
  AUDIO_PLAYBACK_RATES,
  fontScaleFor,
  useAccessibilityStore,
} from '../lib/storage/accessibilityStore';
import type { AppLanguage } from '../lib/storage/settingsStore';
import { useSettingsStore } from '../lib/storage/settingsStore';
import {
  colorsForThemeMode,
  fontFamilyForAccessibility,
  motion,
  radius,
  scaleTypographyValue,
  shadows,
  space,
  typography,
} from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

type SettingsCopy = {
  accessibilityTitle: string;
  audioRateLabel: (rate: AudioPlaybackRate) => string;
  audioRateSummary: (label: string) => string;
  audioRateTitle: string;
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
  confirmImport: string;
  confirmImportAccessibilityLabel: string;
  importErrorMessage: (code: LocalStudyDataImportErrorCode) => string;
  importPasteLabel: string;
  importPastePlaceholder: string;
  importPreview: string;
  importPreviewAccessibilityLabel: string;
  importPurchasesNote: string;
  importReset: string;
  importSectionSubtitle: string;
  importSuccess: string;
  importSummaryBookmarks: (count: number) => string;
  importSummaryCompletedQuestions: (count: number) => string;
  importSummaryFsrsDays: (count: number) => string;
  importSummaryFsrsCards: (count: number) => string;
  importSummaryMockExams: (count: number) => string;
  importSummarySettings: (count: number) => string;
  importSummaryStreakFreeze: string;
  importSummaryTitle: string;
  importSummaryWrongAnswers: (count: number) => string;
  importTitle: string;
  languageAccessibilityLabel: (label: string) => string;
  easyReadFontDisabledLabel: string;
  easyReadFontEnabledLabel: string;
  easyReadFontTitle: string;
  studyLanguageTitle: string;
  setAudioRateAccessibilityLabel: (label: string) => string;
  setDailyGoalAccessibilityLabel: (goal: number) => string;
  setEasyReadFontAccessibilityLabel: (enabled: boolean) => string;
  setTextSizeAccessibilityLabel: (label: string) => string;
  setThemeModeAccessibilityLabel: (label: string) => string;
  subtitle: string;
  textSizeLabel: (step: FontSizeStep) => string;
  textSizeSummary: (label: string) => string;
  textSizeTitle: string;
  themeDarkLabel: string;
  themeLightLabel: string;
  themeModeSummary: (label: string) => string;
  themeModeTitle: string;
  themeSystemLabel: string;
  title: string;
};

const settingsCopy: Record<AppLanguage, SettingsCopy> = {
  sv: {
    accessibilityTitle: 'Tillgänglighet',
    audioRateLabel: (rate) => {
      if (rate === 0.5) return 'Långsam';
      if (rate === 0.75) return 'Lugn';
      if (rate === 1.25) return 'Snabb';
      return 'Normal';
    },
    audioRateSummary: (label) => `Svensk uppläsning: ${label}`,
    audioRateTitle: 'Talhastighet',
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
    confirmImport: 'Bekräfta import',
    confirmImportAccessibilityLabel: 'Bekräfta lokal studiedataimport',
    importErrorMessage: (code) => {
      if (code === 'empty_input') return 'Klistra in JSON innan du förhandsgranskar.';
      if (code === 'invalid_json') return 'JSON kunde inte läsas.';
      if (code === 'invalid_schema') return 'Importen har fel format eller okända toppnivåfält.';
      if (code === 'unsupported_version') return 'Importversionen stöds inte.';
      if (code === 'purchase_fields_rejected') {
        return 'Importen innehåller köp-, kvitto- eller IAP-fält. Ta bort dem och återställ köp via appbutiken.';
      }
      return 'Importen innehåller inga stödda studiedata.';
    },
    importPasteLabel: 'Klistra in JSON-export',
    importPastePlaceholder: 'Klistra in exporten här',
    importPreview: 'Förhandsgranska import',
    importPreviewAccessibilityLabel: 'Förhandsgranska lokal studiedataimport',
    importPurchasesNote:
      'Köp, kvitton och IAP-data importeras inte. Använd appbutikens återställning för köp.',
    importReset: 'Återställ importfält',
    importSectionSubtitle:
      'Klistra in en lokal studiedataexport i JSON-format. Du får en sammanfattning innan något skrivs.',
    importSuccess: 'Importen är klar.',
    importSummaryBookmarks: (count) => `${count} bokmärken`,
    importSummaryCompletedQuestions: (count) => `${count} frågor med sparad progression`,
    importSummaryFsrsDays: (count) => `${count} dagar med FSRS-repetition`,
    importSummaryFsrsCards: (count) => `${count} FSRS-repetitionskort`,
    importSummaryMockExams: (count) => `${count} provhistorikposter`,
    importSummarySettings: (count) => `${count} inställningar`,
    importSummaryStreakFreeze: 'Studiesvit och frysstatus ingår',
    importSummaryTitle: 'Sammanfattning före import',
    importSummaryWrongAnswers: (count) => `${count} granskningar av fel svar`,
    importTitle: 'Importera studiedata',
    languageAccessibilityLabel: (label) => `Byt studiespråk till ${label}`,
    easyReadFontDisabledLabel: 'Lättläst teckensnitt avstängt',
    easyReadFontEnabledLabel: 'Lättläst teckensnitt påslaget',
    easyReadFontTitle: 'Lättläst teckensnitt',
    studyLanguageTitle: 'Studiespråk',
    setAudioRateAccessibilityLabel: (label) => `Välj talhastighet: ${label}`,
    setDailyGoalAccessibilityLabel: (goal) => `Ställ in dagligt mål till ${goal} svar`,
    setEasyReadFontAccessibilityLabel: (enabled) =>
      enabled ? 'Stäng av lättläst teckensnitt' : 'Slå på lättläst teckensnitt',
    setTextSizeAccessibilityLabel: (label) => `Välj textstorlek: ${label}`,
    setThemeModeAccessibilityLabel: (label) => `Välj tema: ${label}`,
    subtitle: 'Styr studiespråk, ljud, tema och ditt dagliga mål.',
    textSizeLabel: (step) => {
      if (step === 0) return 'Kompakt';
      if (step === 2) return 'Stor';
      if (step === 3) return 'Extra stor';
      return 'Standard';
    },
    textSizeSummary: (label) => `Textstorlek: ${label}`,
    textSizeTitle: 'Textstorlek',
    themeDarkLabel: 'Mörkt',
    themeLightLabel: 'Ljust',
    themeModeSummary: (label) => `Tema: ${label}`,
    themeModeTitle: 'Tema',
    themeSystemLabel: 'Följ systemet',
    title: 'Inställningar',
  },
  en: {
    accessibilityTitle: 'Accessibility',
    audioRateLabel: (rate) => {
      if (rate === 0.5) return 'Slow';
      if (rate === 0.75) return 'Comfortable';
      if (rate === 1.25) return 'Fast';
      return 'Normal';
    },
    audioRateSummary: (label) => `Swedish speech: ${label}`,
    audioRateTitle: 'Swedish speech speed',
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
    confirmImport: 'Confirm import',
    confirmImportAccessibilityLabel: 'Confirm local study data import',
    importErrorMessage: (code) => {
      if (code === 'empty_input') return 'Paste JSON before previewing.';
      if (code === 'invalid_json') return 'JSON could not be read.';
      if (code === 'invalid_schema')
        return 'The import has the wrong format or unknown top-level fields.';
      if (code === 'unsupported_version') return 'This import version is not supported.';
      if (code === 'purchase_fields_rejected') {
        return 'The import contains purchase, receipt, or IAP fields. Remove them and restore purchases through the app store.';
      }
      return 'The import does not contain supported study data.';
    },
    importPasteLabel: 'Paste JSON export',
    importPastePlaceholder: 'Paste the export here',
    importPreview: 'Preview import',
    importPreviewAccessibilityLabel: 'Preview local study data import',
    importPurchasesNote:
      'Purchases, receipts, and IAP data are not imported. Use the app store restore flow for purchases.',
    importReset: 'Reset import field',
    importSectionSubtitle:
      'Paste a local study data export in JSON format. You will see a summary before anything is written.',
    importSuccess: 'Import complete.',
    importSummaryBookmarks: (count) => `${count} bookmarks`,
    importSummaryCompletedQuestions: (count) => `${count} questions with saved progress`,
    importSummaryFsrsDays: (count) => `${count} FSRS review days`,
    importSummaryFsrsCards: (count) => `${count} FSRS review cards`,
    importSummaryMockExams: (count) => `${count} mock exam history entries`,
    importSummarySettings: (count) => `${count} settings`,
    importSummaryStreakFreeze: 'Study streak and freeze status included',
    importSummaryTitle: 'Summary before import',
    importSummaryWrongAnswers: (count) => `${count} wrong-answer reviews`,
    importTitle: 'Import study data',
    languageAccessibilityLabel: (label) => `Set study language to ${label}`,
    easyReadFontDisabledLabel: 'Easy-read font off',
    easyReadFontEnabledLabel: 'Easy-read font on',
    easyReadFontTitle: 'Easy-read font',
    studyLanguageTitle: 'Study language',
    setAudioRateAccessibilityLabel: (label) => `Choose Swedish speech speed: ${label}`,
    setDailyGoalAccessibilityLabel: (goal) => `Set daily goal to ${goal} answers`,
    setEasyReadFontAccessibilityLabel: (enabled) =>
      enabled ? 'Disable easy-read font' : 'Enable easy-read font',
    setTextSizeAccessibilityLabel: (label) => `Choose text size: ${label}`,
    setThemeModeAccessibilityLabel: (label) => `Choose theme: ${label}`,
    subtitle: 'Control study language, audio, theme, and your daily goal.',
    textSizeLabel: (step) => {
      if (step === 0) return 'Compact';
      if (step === 2) return 'Large';
      if (step === 3) return 'Extra large';
      return 'Standard';
    },
    textSizeSummary: (label) => `Text size: ${label}`,
    textSizeTitle: 'Text size',
    themeDarkLabel: 'Dark',
    themeLightLabel: 'Light',
    themeModeSummary: (label) => `Theme: ${label}`,
    themeModeTitle: 'Theme',
    themeSystemLabel: 'Use system',
    title: 'Settings',
  },
};

type ImportFeedback = {
  tone: 'error' | 'success';
  text: string;
};

function buildImportSummaryLines(
  copy: SettingsCopy,
  summary: LocalStudyDataImportSummary,
): string[] {
  const lines = [
    copy.importSummaryCompletedQuestions(summary.completedQuestionCount),
    copy.importSummaryBookmarks(summary.bookmarkedQuestionCount),
    copy.importSummaryWrongAnswers(summary.wrongAnswerReviewCount),
    copy.importSummaryMockExams(summary.mockExamSessionCount),
    copy.importSummaryFsrsCards(summary.fsrsReviewCardCount),
    copy.importSummaryFsrsDays(summary.gradedReviewDayCount),
    copy.importSummarySettings(summary.settingCount),
  ];
  if (summary.streakFreezeStateIncluded) lines.push(copy.importSummaryStreakFreeze);
  return lines;
}

export default function Screen() {
  const systemColorScheme = useColorScheme();
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const persistenceWarning = useSettingsStore((state) => state.persistenceWarning);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);
  const clearPersistenceWarning = useSettingsStore((state) => state.clearPersistenceWarning);
  const easyReadFont = useAccessibilityStore((state) => state.easyReadFont);
  const fontSizeStep = useAccessibilityStore((state) => state.fontSizeStep);
  const audioPlaybackRate = useAccessibilityStore((state) => state.audioPlaybackRate);
  const themeMode = useAccessibilityStore((state) => state.themeMode);
  const setEasyReadFont = useAccessibilityStore((state) => state.setEasyReadFont);
  const setFontSizeStep = useAccessibilityStore((state) => state.setFontSizeStep);
  const setAudioPlaybackRate = useAccessibilityStore((state) => state.setAudioPlaybackRate);
  const setThemeMode = useAccessibilityStore((state) => state.setThemeMode);
  const copy = settingsCopy[language];
  const themeColors = colorsForThemeMode(themeMode, systemColorScheme);
  const fontScale = fontScaleFor(fontSizeStep);
  const fontFamily = fontFamilyForAccessibility(easyReadFont);
  const styles = useMemo(
    () => createStyles(themeColors, fontScale, fontFamily),
    [fontFamily, fontScale, themeColors],
  );
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<LocalStudyDataImportPreview | null>(null);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);
  const textSizeOptions: FontSizeStep[] = [0, 1, 2, 3];
  const activeTextSizeLabel = copy.textSizeLabel(fontSizeStep);
  const activeAudioRateLabel = copy.audioRateLabel(audioPlaybackRate);
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: copy.themeSystemLabel },
    { value: 'light', label: copy.themeLightLabel },
    { value: 'dark', label: copy.themeDarkLabel },
  ];
  const activeThemeLabel =
    themeOptions.find((option) => option.value === themeMode)?.label ?? copy.themeSystemLabel;

  const renderLanguageButton = (value: AppLanguage, labelEn: string, labelSv: string) => {
    const label = language === 'sv' ? labelSv : labelEn;

    return (
      <Pressable
        key={value}
        aria-checked={language === value}
        accessibilityLabel={copy.languageAccessibilityLabel(label)}
        accessibilityRole="radio"
        accessibilityState={{ checked: language === value }}
        hitSlop={space[1]}
        onPress={() => setLanguage(value)}
        style={({ pressed }) => [
          styles.pill,
          language === value ? styles.pillActive : null,
          pressed ? styles.controlPressed : null,
        ]}
      >
        <Text style={[styles.pillText, language === value ? styles.pillTextActive : null]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderThemeButton = (value: ThemeMode, label: string) => {
    const selected = themeMode === value;

    return (
      <Pressable
        key={value}
        aria-selected={selected}
        accessibilityLabel={copy.setThemeModeAccessibilityLabel(label)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        hitSlop={space[1]}
        onPress={() => setThemeMode(value)}
        style={({ pressed }) => [
          styles.pill,
          selected ? styles.pillActive : null,
          pressed ? styles.controlPressed : null,
        ]}
      >
        <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{label}</Text>
      </Pressable>
    );
  };

  const renderTextSizeButton = (value: FontSizeStep) => {
    const selected = fontSizeStep === value;
    const label = copy.textSizeLabel(value);

    return (
      <Pressable
        key={value}
        aria-checked={selected}
        accessibilityLabel={copy.setTextSizeAccessibilityLabel(label)}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        hitSlop={space[1]}
        onPress={() => setFontSizeStep(value)}
        style={({ pressed }) => [
          styles.pill,
          selected ? styles.pillActive : null,
          pressed ? styles.controlPressed : null,
        ]}
      >
        <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{label}</Text>
      </Pressable>
    );
  };

  const renderAudioRateButton = (value: AudioPlaybackRate) => {
    const selected = audioPlaybackRate === value;
    const label = copy.audioRateLabel(value);

    return (
      <Pressable
        key={value}
        aria-checked={selected}
        accessibilityLabel={copy.setAudioRateAccessibilityLabel(label)}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        hitSlop={space[1]}
        onPress={() => setAudioPlaybackRate(value)}
        style={({ pressed }) => [
          styles.pill,
          selected ? styles.pillActive : null,
          pressed ? styles.controlPressed : null,
        ]}
      >
        <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{label}</Text>
      </Pressable>
    );
  };

  const handleImportTextChange = (text: string) => {
    setImportText(text);
    setImportPreview(null);
    setImportFeedback(null);
  };

  const handlePreviewImport = () => {
    const result = previewLocalStudyDataImport(importText);
    if (!result.ok) {
      setImportPreview(null);
      setImportFeedback({ tone: 'error', text: copy.importErrorMessage(result.code) });
      return;
    }

    setImportPreview(result.preview);
    setImportFeedback(null);
  };

  const handleResetImport = () => {
    setImportText('');
    setImportPreview(null);
    setImportFeedback(null);
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    applyLocalStudyDataImport(importPreview);
    setImportText('');
    setImportPreview(null);
    setImportFeedback({ tone: 'success', text: copy.importSuccess });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ComplianceActionLink
        accessibilityLabel={copy.backToProfileAccessibilityLabel}
        href="/(tabs)/profile"
        label={copy.backToProfile}
      />
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
      <PersistenceWarningNotice
        language={language}
        onDismiss={clearPersistenceWarning}
        warning={persistenceWarning}
      />

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.studyLanguageTitle}
        </Text>
        <View
          aria-label={copy.studyLanguageTitle}
          accessibilityLabel={copy.studyLanguageTitle}
          accessibilityRole="radiogroup"
          style={styles.row}
        >
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
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed ? styles.secondaryButtonPressed : null,
          ]}
        >
          <Text style={styles.secondaryButtonText}>
            {audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.accessibilityTitle}
        </Text>
        <View style={styles.controlBlock}>
          <Text style={styles.controlLabel}>{copy.easyReadFontTitle}</Text>
          <Pressable
            aria-checked={easyReadFont}
            accessibilityLabel={copy.setEasyReadFontAccessibilityLabel(easyReadFont)}
            accessibilityRole="switch"
            accessibilityState={{ checked: easyReadFont }}
            hitSlop={space[1]}
            onPress={() => setEasyReadFont(!easyReadFont)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.secondaryButtonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {easyReadFont ? copy.easyReadFontEnabledLabel : copy.easyReadFontDisabledLabel}
            </Text>
          </Pressable>
        </View>
        <View style={styles.controlBlock}>
          <Text style={styles.controlLabel}>{copy.textSizeTitle}</Text>
          <Text style={styles.subtitle}>{copy.textSizeSummary(activeTextSizeLabel)}</Text>
          <View
            aria-label={copy.textSizeTitle}
            accessibilityLabel={copy.textSizeTitle}
            accessibilityRole="radiogroup"
            style={styles.row}
          >
            {textSizeOptions.map((option) => renderTextSizeButton(option))}
          </View>
        </View>
        <View style={styles.controlBlock}>
          <Text style={styles.controlLabel}>{copy.audioRateTitle}</Text>
          <Text style={styles.subtitle}>{copy.audioRateSummary(activeAudioRateLabel)}</Text>
          <View
            aria-label={copy.audioRateTitle}
            accessibilityLabel={copy.audioRateTitle}
            accessibilityRole="radiogroup"
            style={styles.row}
          >
            {AUDIO_PLAYBACK_RATES.map((option) => renderAudioRateButton(option))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.themeModeTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.themeModeSummary(activeThemeLabel)}</Text>
        <View style={styles.row}>
          {themeOptions.map((option) => renderThemeButton(option.value, option.label))}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.dailyGoalTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.dailyGoalSummary(dailyGoalAnswers)}</Text>
        <View
          aria-label={copy.dailyGoalTitle}
          accessibilityLabel={copy.dailyGoalTitle}
          accessibilityRole="radiogroup"
          style={styles.row}
        >
          {[5, 10, 20, 40].map((goal) => {
            const selected = dailyGoalAnswers === goal;

            return (
              <Pressable
                key={goal}
                aria-checked={dailyGoalAnswers === goal}
                accessibilityLabel={copy.setDailyGoalAccessibilityLabel(goal)}
                accessibilityRole="radio"
                accessibilityState={{ checked: dailyGoalAnswers === goal }}
                hitSlop={space[1]}
                onPress={() => setDailyGoalAnswers(goal)}
                style={({ pressed }) => [
                  styles.pill,
                  styles.goalPill,
                  selected ? styles.pillActive : null,
                  pressed ? styles.controlPressed : null,
                ]}
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

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.importTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.importSectionSubtitle}</Text>
        <Text style={styles.disclaimerText}>{copy.importPurchasesNote}</Text>
        <TextInput
          accessibilityLabel={copy.importPasteLabel}
          multiline
          onChangeText={handleImportTextChange}
          placeholder={copy.importPastePlaceholder}
          placeholderTextColor={themeColors.textPlaceholder}
          style={styles.importInput}
          textAlignVertical="top"
          value={importText}
        />
        <View style={styles.importActions}>
          <Pressable
            accessibilityLabel={copy.importPreviewAccessibilityLabel}
            accessibilityRole="button"
            hitSlop={space[1]}
            onPress={handlePreviewImport}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.secondaryButtonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{copy.importPreview}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={copy.importReset}
            accessibilityRole="button"
            hitSlop={space[1]}
            onPress={handleResetImport}
            style={({ pressed }) => [
              styles.outlineButton,
              pressed ? styles.outlineButtonPressed : null,
            ]}
          >
            <Text style={styles.outlineButtonText}>{copy.importReset}</Text>
          </Pressable>
        </View>
        {importPreview ? (
          <View style={styles.importSummary}>
            <Text accessibilityRole="header" style={styles.summaryTitle}>
              {copy.importSummaryTitle}
            </Text>
            {buildImportSummaryLines(copy, importPreview.summary).map((line) => (
              <Text key={line} style={styles.summaryText}>
                {line}
              </Text>
            ))}
            <Pressable
              accessibilityLabel={copy.confirmImportAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={space[1]}
              onPress={handleConfirmImport}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.secondaryButtonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>{copy.confirmImport}</Text>
            </Pressable>
          </View>
        ) : null}
        {importFeedback ? (
          <Text
            accessibilityRole={importFeedback.tone === 'error' ? 'alert' : 'text'}
            style={[
              styles.feedbackText,
              importFeedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess,
            ]}
          >
            {importFeedback.text}
          </Text>
        ) : null}
      </View>

      <ComplianceLinks />
    </ScrollView>
  );
}

function createStyles(themeColors: ThemeColors, fontScale: number, fontFamily: string) {
  const textStyle = (source: TextStyle): TextStyle => ({
    fontFamily,
    fontSize: scaleTypographyValue(source.fontSize, fontScale),
    fontWeight: source.fontWeight,
    lineHeight: scaleTypographyValue(source.lineHeight, fontScale),
    ...(typeof source.letterSpacing === 'number' ? { letterSpacing: source.letterSpacing } : {}),
  });

  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.canvas,
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: space[2.25],
      padding: space[3],
      paddingBottom: space[10],
    },
    backLink: {
      color: themeColors.accent,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      textDecorationLine: 'none',
    },
    title: {
      color: themeColors.text,
      ...textStyle(typography.subHeading),
    },
    subtitle: {
      color: themeColors.textMuted,
      ...textStyle(typography.body),
    },
    section: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      gap: space[1.5],
      padding: space[2],
      ...shadows.card,
    },
    sectionTitle: {
      color: themeColors.text,
      ...textStyle(typography.sectionTitle),
    },
    controlBlock: {
      gap: space[1],
    },
    controlLabel: {
      color: themeColors.text,
      ...textStyle(typography.bodySemibold),
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    pill: {
      alignItems: 'center',
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: space[5] + space[0.5],
      paddingHorizontal: space[1.5],
      paddingVertical: space[0.75],
    },
    pillActive: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    pillText: {
      color: themeColors.textMuted,
      ...textStyle(typography.caption),
    },
    pillTextActive: {
      color: themeColors.badgeBlueText,
    },
    controlPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    goalPill: {
      alignItems: 'flex-start',
      gap: space.hairline,
      minWidth: space[12],
    },
    goalNumberText: {
      color: themeColors.text,
      ...textStyle(typography.bodyBold),
    },
    goalPresetText: {
      color: themeColors.textMuted,
      ...textStyle(typography.caption),
    },
    secondaryButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.accent,
      borderRadius: radius.button,
      justifyContent: 'center',
      minHeight: space[5] + space[0.5],
      paddingHorizontal: space[2],
      paddingVertical: space[1.25],
    },
    secondaryButtonPressed: {
      backgroundColor: themeColors.accentActive,
      transform: [{ scale: motion.pressedScale }],
    },
    secondaryButtonText: {
      color: themeColors.surface,
      ...textStyle(typography.navButton),
    },
    disclaimerText: {
      color: themeColors.textDisclaimer,
      ...textStyle(typography.caption),
    },
    importInput: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.input,
      borderWidth: StyleSheet.hairlineWidth,
      color: themeColors.text,
      ...textStyle(typography.body),
      minHeight: space[15],
      padding: space[1.5],
    },
    importActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    outlineButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.button,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: space[5] + space[0.5],
      paddingHorizontal: space[2],
      paddingVertical: space[1.25],
    },
    outlineButtonPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    outlineButtonText: {
      color: themeColors.text,
      ...textStyle(typography.navButton),
    },
    importSummary: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      gap: space[0.75],
      padding: space[1.5],
    },
    summaryTitle: {
      color: themeColors.text,
      ...textStyle(typography.bodyBold),
    },
    summaryText: {
      color: themeColors.textMuted,
      ...textStyle(typography.caption),
    },
    feedbackText: {
      ...textStyle(typography.caption),
      fontWeight: typography.bodyBold.fontWeight,
    },
    feedbackError: {
      color: themeColors.warning,
    },
    feedbackSuccess: {
      color: themeColors.success,
    },
  });
}
