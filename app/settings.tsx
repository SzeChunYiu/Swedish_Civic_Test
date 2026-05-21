import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ComplianceActionLink } from '../components/compliance/ComplianceActionLink';
import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import { CompanionPicker } from '../components/mascot/CompanionPicker';
import { PersistenceWarningNotice } from '../components/storage/PersistenceWarningNotice';
import { useReducedMotion } from '../lib/motion/useReducedMotion';
import {
  LOCAL_STUDY_DATA_IMPORT_MAX_BYTES,
  applyLocalStudyDataImport,
  formatLocalStudyDataImportErrorDetail,
  getLocalStudyDataImportPayloadByteCount,
  previewLocalStudyDataImport,
  type LocalStudyDataImportErrorCode,
  type LocalStudyDataImportPreview,
  type LocalStudyDataImportSummary,
} from '../lib/storage/localStudyDataImport';
import type { ThemeMode } from '../lib/storage/accessibilityStore';
import { useAccessibilityStore } from '../lib/storage/accessibilityStore';
import { useCompanionStore } from '../lib/storage/companionStore';
import type { AppLanguage } from '../lib/storage/settingsStore';
import { supportedDailyGoalAnswerOptions, useSettingsStore } from '../lib/storage/settingsStore';
import { motion, radius, shadows, space, typography } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme/ThemeProvider';

type SettingsCopy = {
  audioDisabledLabel: string;
  audioEnabledLabel: string;
  audioListenFirstDisabledLabel: string;
  audioListenFirstEnabledLabel: string;
  audioListenFirstTitle: string;
  audioTitle: string;
  backToProfile: string;
  backToProfileAccessibilityLabel: string;
  companionSubtitle: string;
  companionTitle: string;
  dailyGoalPresetLabel: (goal: number) => string;
  dailyGoalSummary: (answerCount: number) => string;
  dailyGoalTitle: string;
  disableAudioAccessibilityLabel: string;
  disableListenFirstAudioAccessibilityLabel: string;
  enableAudioAccessibilityLabel: string;
  enableListenFirstAudioAccessibilityLabel: string;
  confirmImport: string;
  confirmImportAccessibilityLabel: string;
  importByteLimitExceeded: (byteCountLabel: string, maxLabel: string) => string;
  importErrorMessage: (code: LocalStudyDataImportErrorCode, detail?: string) => string;
  importPasteLabel: string;
  importPastePlaceholder: string;
  importPreview: string;
  importPreviewAccessibilityLabel: string;
  importPurchasesNote: string;
  importReset: string;
  importSectionSubtitle: string;
  importSuccess: string;
  importSummaryAccessibility: (count: number) => string;
  importSummaryBookmarks: (count: number) => string;
  importSummaryCitizenshipRequirements: (count: number) => string;
  importSummaryCompanion: (count: number) => string;
  importSummaryCompletedQuestions: (count: number) => string;
  importSummaryFsrsDays: (count: number) => string;
  importSummaryFsrsCards: (count: number) => string;
  importSummaryHighlights: (count: number) => string;
  importSummaryMockExams: (count: number) => string;
  importSummarySettings: (count: number) => string;
  importSummaryStreakFreeze: string;
  importSummaryTitle: string;
  importSummaryWrongAnswers: (count: number) => string;
  importTitle: string;
  languageAccessibilityLabel: (label: string) => string;
  studyLanguageTitle: string;
  studyControlsFocusLabel: string;
  studyControlsTitle: string;
  setDailyGoalAccessibilityLabel: (goal: number) => string;
  setThemeModeAccessibilityLabel: (label: string) => string;
  subtitle: string;
  themeDarkLabel: string;
  themeLightLabel: string;
  themeModeSummary: (label: string) => string;
  themeModeTitle: string;
  themeSystemLabel: string;
  title: string;
};

type CountLabels = {
  one: string;
  other: string;
};

function formatCount(count: number, labels: CountLabels): string {
  return `${count} ${count === 1 ? labels.one : labels.other}`;
}

function formatImportByteCount(byteCount: number, language: AppLanguage): string {
  return new Intl.NumberFormat(language === 'sv' ? 'sv-SE' : 'en-US').format(byteCount);
}

function appendImportErrorDetail(
  message: string,
  detail: string | undefined,
  fieldLabel: string,
): string {
  const formattedDetail = formatLocalStudyDataImportErrorDetail(detail);
  return formattedDetail ? `${message}\n${fieldLabel}: ${formattedDetail}` : message;
}

const localStudyDataImportMaxLabel = `${LOCAL_STUDY_DATA_IMPORT_MAX_BYTES / (1024 * 1024)} MB`;

function addPositiveImportSummaryLine(
  lines: string[],
  count: number,
  formatLine: (count: number) => string,
) {
  if (count > 0) lines.push(formatLine(count));
}

const settingsCopy: Record<AppLanguage, SettingsCopy> = {
  sv: {
    audioDisabledLabel: 'Ljud avstängt',
    audioEnabledLabel: 'Ljud på',
    audioListenFirstDisabledLabel: 'Lyssna först av',
    audioListenFirstEnabledLabel: 'Lyssna först på',
    audioListenFirstTitle: 'Lyssna först',
    audioTitle: 'Ljud',
    backToProfile: '← Tillbaka till profil',
    backToProfileAccessibilityLabel: 'Tillbaka till profil',
    companionSubtitle:
      'Välj en studiekompis för övningen. Valet är gratis och sparas bara på enheten.',
    companionTitle: 'Studiekompis',
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
    disableListenFirstAudioAccessibilityLabel: 'Stäng av automatisk uppläsning av nya frågor',
    enableAudioAccessibilityLabel: 'Slå på ljud',
    enableListenFirstAudioAccessibilityLabel: 'Slå på automatisk uppläsning av nya frågor',
    confirmImport: 'Bekräfta import',
    confirmImportAccessibilityLabel: 'Bekräfta lokal studiedataimport',
    importByteLimitExceeded: (byteCountLabel, maxLabel) =>
      `Importen är ${byteCountLabel} byte. Gränsen är ${maxLabel}; klistra in en mindre export innan du förhandsgranskar.`,
    importErrorMessage: (code, detail) => {
      if (code === 'empty_input') return 'Klistra in JSON innan du förhandsgranskar.';
      if (code === 'input_too_large') {
        return `JSON-exporten är större än ${localStudyDataImportMaxLabel}. Klistra in en export på högst ${localStudyDataImportMaxLabel}.`;
      }
      if (code === 'invalid_json') return 'JSON kunde inte läsas.';
      if (code === 'invalid_schema') return 'Importen har fel format eller okända toppnivåfält.';
      if (code === 'unsupported_version') return 'Importversionen stöds inte.';
      if (code === 'purchase_fields_rejected') {
        return appendImportErrorDetail(
          'Importen innehåller fält för köp i appen eller kvitton. Ta bort dem och återställ köp via appbutiken.',
          detail,
          'Fält',
        );
      }
      return 'Importen innehåller inga stödda studiedata.';
    },
    importPasteLabel: 'Klistra in JSON-export',
    importPastePlaceholder: 'Klistra in exporten här',
    importPreview: 'Förhandsgranska import',
    importPreviewAccessibilityLabel: 'Förhandsgranska lokal studiedataimport',
    importPurchasesNote:
      'Köp, kvitton och data om köp i appen importeras inte. Använd appbutikens återställning för köp.',
    importReset: 'Återställ importfält',
    importSectionSubtitle: `Klistra in en lokal studiedataexport i JSON-format på högst ${localStudyDataImportMaxLabel}. Du får en sammanfattning innan något skrivs.`,
    importSuccess: 'Importen är klar.',
    importSummaryAccessibility: (count) =>
      formatCount(count, { one: 'tillgänglighetsval', other: 'tillgänglighetsval' }),
    importSummaryBookmarks: (count) => formatCount(count, { one: 'bokmärke', other: 'bokmärken' }),
    importSummaryCitizenshipRequirements: (count) =>
      formatCount(count, { one: 'markerat kravområde', other: 'markerade kravområden' }),
    importSummaryCompanion: (count) =>
      formatCount(count, { one: 'vald studiekompis', other: 'valda studiekompisar' }),
    importSummaryCompletedQuestions: (count) =>
      formatCount(count, {
        one: 'fråga med sparad progression',
        other: 'frågor med sparad progression',
      }),
    importSummaryFsrsDays: (count) =>
      formatCount(count, { one: 'repetitionsdag', other: 'repetitionsdagar' }),
    importSummaryFsrsCards: (count) =>
      formatCount(count, { one: 'repetitionskort', other: 'repetitionskort' }),
    importSummaryHighlights: (count) =>
      formatCount(count, { one: 'markering i e-boken', other: 'markeringar i e-boken' }),
    importSummaryMockExams: (count) =>
      formatCount(count, { one: 'genomfört övningsprov', other: 'genomförda övningsprov' }),
    importSummarySettings: (count) =>
      formatCount(count, { one: 'sparad inställning', other: 'sparade inställningar' }),
    importSummaryStreakFreeze: 'Studiesvit och svitskydd ingår',
    importSummaryTitle: 'Sammanfattning före import',
    importSummaryWrongAnswers: (count) =>
      formatCount(count, { one: 'granskning av fel svar', other: 'granskningar av fel svar' }),
    importTitle: 'Importera studiedata',
    languageAccessibilityLabel: (label) => `Byt studiespråk till ${label}`,
    studyLanguageTitle: 'Studiespråk',
    studyControlsFocusLabel: 'Studieinställningarna från profilen är markerade här.',
    studyControlsTitle: 'Dagligt mål, språk och ljud',
    setDailyGoalAccessibilityLabel: (goal) => `Ställ in dagligt mål till ${goal} svar`,
    setThemeModeAccessibilityLabel: (label) => `Välj tema: ${label}`,
    subtitle: 'Styr studiespråk, ljud, tema, studiekompis och ditt dagliga mål.',
    themeDarkLabel: 'Mörkt',
    themeLightLabel: 'Ljust',
    themeModeSummary: (label) => `Tema: ${label}`,
    themeModeTitle: 'Tema',
    themeSystemLabel: 'Följ systemet',
    title: 'Inställningar',
  },
  en: {
    audioDisabledLabel: 'Audio disabled',
    audioEnabledLabel: 'Audio enabled',
    audioListenFirstDisabledLabel: 'Listen first disabled',
    audioListenFirstEnabledLabel: 'Listen first enabled',
    audioListenFirstTitle: 'Listen first',
    audioTitle: 'Audio',
    backToProfile: '← Back to Profile',
    backToProfileAccessibilityLabel: 'Back to profile',
    companionSubtitle:
      'Choose a study companion for practice. It is free and saved only on this device.',
    companionTitle: 'Study companion',
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
    disableListenFirstAudioAccessibilityLabel: 'Disable automatic playback for new questions',
    enableAudioAccessibilityLabel: 'Enable audio',
    enableListenFirstAudioAccessibilityLabel: 'Enable automatic playback for new questions',
    confirmImport: 'Confirm import',
    confirmImportAccessibilityLabel: 'Confirm local study data import',
    importByteLimitExceeded: (byteCountLabel, maxLabel) =>
      `The import is ${byteCountLabel} bytes. The limit is ${maxLabel}; paste a smaller export before previewing.`,
    importErrorMessage: (code, detail) => {
      if (code === 'empty_input') return 'Paste JSON before previewing.';
      if (code === 'input_too_large') {
        return `The JSON export is larger than ${localStudyDataImportMaxLabel}. Paste an export under ${localStudyDataImportMaxLabel}.`;
      }
      if (code === 'invalid_json') return 'JSON could not be read.';
      if (code === 'invalid_schema')
        return 'The import has the wrong format or unknown top-level fields.';
      if (code === 'unsupported_version') return 'This import version is not supported.';
      if (code === 'purchase_fields_rejected') {
        return appendImportErrorDetail(
          'The import contains purchase, receipt, or IAP fields. Remove them and restore purchases through the app store.',
          detail,
          'Field',
        );
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
    importSectionSubtitle: `Paste a local study data export in JSON format under ${localStudyDataImportMaxLabel}. You will see a summary before anything is written.`,
    importSuccess: 'Import complete.',
    importSummaryAccessibility: (count) =>
      formatCount(count, { one: 'accessibility preference', other: 'accessibility preferences' }),
    importSummaryBookmarks: (count) => formatCount(count, { one: 'bookmark', other: 'bookmarks' }),
    importSummaryCitizenshipRequirements: (count) =>
      formatCount(count, { one: 'marked requirement', other: 'marked requirements' }),
    importSummaryCompanion: (count) =>
      formatCount(count, { one: 'selected study companion', other: 'selected study companions' }),
    importSummaryCompletedQuestions: (count) =>
      formatCount(count, {
        one: 'question with saved progress',
        other: 'questions with saved progress',
      }),
    importSummaryFsrsDays: (count) =>
      formatCount(count, { one: 'FSRS review day', other: 'FSRS review days' }),
    importSummaryFsrsCards: (count) =>
      formatCount(count, { one: 'FSRS review card', other: 'FSRS review cards' }),
    importSummaryHighlights: (count) =>
      formatCount(count, { one: 'ebook highlight', other: 'ebook highlights' }),
    importSummaryMockExams: (count) =>
      formatCount(count, {
        one: 'completed mock exam',
        other: 'completed mock exams',
      }),
    importSummarySettings: (count) =>
      formatCount(count, { one: 'saved setting', other: 'saved settings' }),
    importSummaryStreakFreeze: 'Study streak and freeze status included',
    importSummaryTitle: 'Summary before import',
    importSummaryWrongAnswers: (count) =>
      formatCount(count, { one: 'wrong-answer review', other: 'wrong-answer reviews' }),
    importTitle: 'Import study data',
    languageAccessibilityLabel: (label) => `Set study language to ${label}`,
    studyLanguageTitle: 'Study language',
    studyControlsFocusLabel: 'The study setup controls from Profile are highlighted here.',
    studyControlsTitle: 'Daily goal, language, and audio',
    setDailyGoalAccessibilityLabel: (goal) => `Set daily goal to ${goal} answers`,
    setThemeModeAccessibilityLabel: (label) => `Choose theme: ${label}`,
    subtitle: 'Control study language, audio, theme, study companion, and your daily goal.',
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

type FocusableElement = { focus?: () => void };
type KeyboardEventLike = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};
type RadioOptionValue = number | string;
type RadioOptionRefMap = { current: Record<string, FocusableElement | null> };
type WebRadioKeyboardProps = {
  onKeyDown?: (event: KeyboardEventLike) => void;
  tabIndex?: 0 | -1;
};

function getRadioArrowDirection(event: KeyboardEventLike): -1 | 1 | null {
  const key = event.nativeEvent?.key ?? event.key;
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return null;
}

function buildImportSummaryLines(
  copy: SettingsCopy,
  summary: LocalStudyDataImportSummary,
): string[] {
  const lines: string[] = [];

  addPositiveImportSummaryLine(
    lines,
    summary.completedQuestionCount,
    copy.importSummaryCompletedQuestions,
  );
  addPositiveImportSummaryLine(lines, summary.bookmarkedQuestionCount, copy.importSummaryBookmarks);
  addPositiveImportSummaryLine(
    lines,
    summary.wrongAnswerReviewCount,
    copy.importSummaryWrongAnswers,
  );
  addPositiveImportSummaryLine(lines, summary.mockExamSessionCount, copy.importSummaryMockExams);
  addPositiveImportSummaryLine(lines, summary.fsrsReviewCardCount, copy.importSummaryFsrsCards);
  addPositiveImportSummaryLine(lines, summary.gradedReviewDayCount, copy.importSummaryFsrsDays);
  addPositiveImportSummaryLine(lines, summary.highlightCount, copy.importSummaryHighlights);
  addPositiveImportSummaryLine(lines, summary.settingCount, copy.importSummarySettings);
  addPositiveImportSummaryLine(
    lines,
    summary.accessibilityPreferenceCount,
    copy.importSummaryAccessibility,
  );
  addPositiveImportSummaryLine(
    lines,
    summary.companionPreferenceCount,
    copy.importSummaryCompanion,
  );
  addPositiveImportSummaryLine(
    lines,
    summary.citizenshipRequirementChecklistCount,
    copy.importSummaryCitizenshipRequirements,
  );
  if (summary.streakFreezeStateIncluded) lines.push(copy.importSummaryStreakFreeze);
  return lines;
}

export default function Screen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const persistenceWarning = useSettingsStore((state) => state.persistenceWarning);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);
  const clearPersistenceWarning = useSettingsStore((state) => state.clearPersistenceWarning);
  const themeMode = useAccessibilityStore((state) => state.themeMode);
  const setThemeMode = useAccessibilityStore((state) => state.setThemeMode);
  const listenFirstAudioEnabled = useAccessibilityStore((state) => state.listenFirstAudioEnabled);
  const setListenFirstAudioEnabled = useAccessibilityStore(
    (state) => state.setListenFirstAudioEnabled,
  );
  const accessibilityPersistenceWarning = useAccessibilityStore(
    (state) => state.persistenceWarning,
  );
  const clearAccessibilityPersistenceWarning = useAccessibilityStore(
    (state) => state.clearPersistenceWarning,
  );
  const selectedCompanionId = useCompanionStore((state) => state.selectedId);
  const setSelectedCompanion = useCompanionStore((state) => state.setSelected);
  const companionPersistenceWarning = useCompanionStore((state) => state.persistenceWarning);
  const clearCompanionPersistenceWarning = useCompanionStore(
    (state) => state.clearPersistenceWarning,
  );
  const copy = settingsCopy[language];
  const reduceMotion = useReducedMotion();
  const { colors: themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const studyFocusActive = focus === 'study';
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<LocalStudyDataImportPreview | null>(null);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);
  const [focusedControl, setFocusedControl] = useState<string | null>(null);
  const dailyGoalOptionRefs = useRef<Record<string, FocusableElement | null>>({});
  const languageOptionRefs = useRef<Record<string, FocusableElement | null>>({});
  const themeOptionRefs = useRef<Record<string, FocusableElement | null>>({});
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: copy.themeSystemLabel },
    { value: 'light', label: copy.themeLightLabel },
    { value: 'dark', label: copy.themeDarkLabel },
  ];
  const activeThemeLabel =
    themeOptions.find((option) => option.value === themeMode)?.label ?? copy.themeSystemLabel;
  const importPayloadByteCount = useMemo(
    () => getLocalStudyDataImportPayloadByteCount(importText),
    [importText],
  );
  const importPayloadOverByteLimit = importPayloadByteCount > LOCAL_STUDY_DATA_IMPORT_MAX_BYTES;
  const importByteLimitFeedback = importPayloadOverByteLimit
    ? copy.importByteLimitExceeded(
        formatImportByteCount(importPayloadByteCount, language),
        localStudyDataImportMaxLabel,
      )
    : null;

  const handleRadioGroupKeyDown = <T extends RadioOptionValue>(
    event: KeyboardEventLike,
    options: readonly T[],
    selectedValue: T,
    selectValue: (value: T) => void,
    optionRefs: RadioOptionRefMap,
  ) => {
    const direction = getRadioArrowDirection(event);
    if (!direction || options.length === 0) return;

    event.preventDefault?.();
    const currentIndex = options.findIndex((option) => option === selectedValue);
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + direction + options.length) % options.length
        : direction > 0
          ? 0
          : options.length - 1;
    const nextValue = options[nextIndex];

    selectValue(nextValue);
    optionRefs.current[String(nextValue)]?.focus?.();
  };

  const getWebRadioKeyboardProps = <T extends RadioOptionValue>(
    options: readonly T[],
    selectedValue: T,
    optionValue: T,
    selectValue: (value: T) => void,
    optionRefs: RadioOptionRefMap,
  ): WebRadioKeyboardProps =>
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: KeyboardEventLike) =>
            handleRadioGroupKeyDown(event, options, selectedValue, selectValue, optionRefs),
          tabIndex: selectedValue === optionValue ? 0 : -1,
        }
      : {};

  const renderLanguageButton = (value: AppLanguage, labelEn: string, labelSv: string) => {
    const label = language === 'sv' ? labelSv : labelEn;
    const focusKey = `language-${value}`;

    return (
      <Pressable
        key={value}
        aria-checked={language === value}
        accessibilityLabel={copy.languageAccessibilityLabel(label)}
        accessibilityRole="radio"
        accessibilityState={{ checked: language === value }}
        hitSlop={space[1]}
        onBlur={() => setFocusedControl(null)}
        onFocus={() => setFocusedControl(focusKey)}
        onPress={() => setLanguage(value)}
        ref={(node) => {
          languageOptionRefs.current[value] = node as FocusableElement | null;
        }}
        style={({ pressed }) => [
          styles.pill,
          language === value ? styles.pillActive : null,
          focusedControl === focusKey ? styles.controlFocused : null,
          pressed
            ? reduceMotion
              ? styles.controlPressedReducedMotion
              : styles.controlPressed
            : null,
        ]}
        {...getWebRadioKeyboardProps(
          ['sv', 'en'],
          language,
          value,
          setLanguage,
          languageOptionRefs,
        )}
      >
        <Text style={[styles.pillText, language === value ? styles.pillTextActive : null]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderThemeButton = (value: ThemeMode, label: string) => {
    const selected = themeMode === value;
    const focusKey = `theme-${value}`;

    return (
      <Pressable
        key={value}
        aria-checked={selected}
        accessibilityLabel={copy.setThemeModeAccessibilityLabel(label)}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        hitSlop={space[1]}
        onBlur={() => setFocusedControl(null)}
        onFocus={() => setFocusedControl(focusKey)}
        onPress={() => setThemeMode(value)}
        ref={(node) => {
          themeOptionRefs.current[value] = node as FocusableElement | null;
        }}
        style={({ pressed }) => [
          styles.pill,
          selected ? styles.pillActive : null,
          focusedControl === focusKey ? styles.controlFocused : null,
          pressed
            ? reduceMotion
              ? styles.controlPressedReducedMotion
              : styles.controlPressed
            : null,
        ]}
        {...getWebRadioKeyboardProps(
          themeOptions.map((option) => option.value),
          themeMode,
          value,
          setThemeMode,
          themeOptionRefs,
        )}
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
    if (importPayloadOverByteLimit) {
      setImportPreview(null);
      setImportFeedback({ tone: 'error', text: copy.importErrorMessage('input_too_large') });
      return;
    }

    const result = previewLocalStudyDataImport(importText);
    if (!result.ok) {
      setImportPreview(null);
      setImportFeedback({
        tone: 'error',
        text: copy.importErrorMessage(result.code, result.detail),
      });
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
      <PersistenceWarningNotice
        language={language}
        onDismiss={clearAccessibilityPersistenceWarning}
        warning={accessibilityPersistenceWarning}
        warningScope="accessibilityPreferences"
      />

      <View
        accessibilityLabel={copy.studyControlsTitle}
        nativeID="study-settings-controls"
        style={[
          styles.studyControlsGroup,
          studyFocusActive ? styles.studyControlsGroupFocused : null,
        ]}
        testID="study-settings-controls"
      >
        {studyFocusActive ? (
          <Text style={styles.studyFocusText}>{copy.studyControlsFocusLabel}</Text>
        ) : null}

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
            {supportedDailyGoalAnswerOptions.map((goal) => {
              const selected = dailyGoalAnswers === goal;
              const focusKey = `daily-goal-${goal}`;

              return (
                <Pressable
                  key={goal}
                  aria-checked={dailyGoalAnswers === goal}
                  accessibilityLabel={copy.setDailyGoalAccessibilityLabel(goal)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: dailyGoalAnswers === goal }}
                  hitSlop={space[1]}
                  onBlur={() => setFocusedControl(null)}
                  onFocus={() => setFocusedControl(focusKey)}
                  onPress={() => setDailyGoalAnswers(goal)}
                  ref={(node) => {
                    dailyGoalOptionRefs.current[String(goal)] = node as FocusableElement | null;
                  }}
                  style={({ pressed }) => [
                    styles.pill,
                    styles.goalPill,
                    selected ? styles.pillActive : null,
                    focusedControl === focusKey ? styles.controlFocused : null,
                    pressed
                      ? reduceMotion
                        ? styles.controlPressedReducedMotion
                        : styles.controlPressed
                      : null,
                  ]}
                  {...getWebRadioKeyboardProps(
                    supportedDailyGoalAnswerOptions,
                    dailyGoalAnswers,
                    goal,
                    setDailyGoalAnswers,
                    dailyGoalOptionRefs,
                  )}
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
              audioEnabled
                ? copy.disableAudioAccessibilityLabel
                : copy.enableAudioAccessibilityLabel
            }
            accessibilityRole="switch"
            accessibilityState={{ checked: audioEnabled }}
            hitSlop={space[1]}
            onBlur={() => setFocusedControl(null)}
            onFocus={() => setFocusedControl('audio')}
            onPress={() => setAudioEnabled(!audioEnabled)}
            style={({ pressed }) => [
              styles.secondaryButton,
              focusedControl === 'audio' ? styles.secondaryButtonFocused : null,
              pressed
                ? reduceMotion
                  ? styles.secondaryButtonPressedReducedMotion
                  : styles.secondaryButtonPressed
                : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {audioEnabled ? copy.audioEnabledLabel : copy.audioDisabledLabel}
            </Text>
          </Pressable>
          <Text style={styles.subtitle}>{copy.audioListenFirstTitle}</Text>
          <Pressable
            aria-checked={listenFirstAudioEnabled}
            accessibilityLabel={
              listenFirstAudioEnabled
                ? copy.disableListenFirstAudioAccessibilityLabel
                : copy.enableListenFirstAudioAccessibilityLabel
            }
            accessibilityRole="switch"
            accessibilityState={{ checked: listenFirstAudioEnabled }}
            hitSlop={space[1]}
            onBlur={() => setFocusedControl(null)}
            onFocus={() => setFocusedControl('listen-first-audio')}
            onPress={() => setListenFirstAudioEnabled(!listenFirstAudioEnabled)}
            style={({ pressed }) => [
              styles.secondaryButton,
              focusedControl === 'listen-first-audio' ? styles.secondaryButtonFocused : null,
              pressed
                ? reduceMotion
                  ? styles.secondaryButtonPressedReducedMotion
                  : styles.secondaryButtonPressed
                : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {listenFirstAudioEnabled
                ? copy.audioListenFirstEnabledLabel
                : copy.audioListenFirstDisabledLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.themeModeTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.themeModeSummary(activeThemeLabel)}</Text>
        <PersistenceWarningNotice
          language={language}
          onDismiss={clearAccessibilityPersistenceWarning}
          warning={accessibilityPersistenceWarning}
          warningScope="accessibilityPreferences"
        />
        <View
          aria-label={copy.themeModeTitle}
          accessibilityLabel={copy.themeModeTitle}
          accessibilityRole="radiogroup"
          style={styles.row}
        >
          {themeOptions.map((option) => renderThemeButton(option.value, option.label))}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.companionTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.companionSubtitle}</Text>
        <PersistenceWarningNotice
          language={language}
          onDismiss={clearCompanionPersistenceWarning}
          warning={companionPersistenceWarning}
        />
        <CompanionPicker
          language={language}
          onSelect={setSelectedCompanion}
          selectedId={selectedCompanionId}
        />
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.importTitle}
        </Text>
        <Text style={styles.subtitle}>{copy.importSectionSubtitle}</Text>
        <Text style={styles.disclaimerText}>{copy.importPurchasesNote}</Text>
        <TextInput
          accessibilityLabel={copy.importPasteLabel}
          maxLength={LOCAL_STUDY_DATA_IMPORT_MAX_BYTES}
          multiline
          onChangeText={handleImportTextChange}
          placeholder={copy.importPastePlaceholder}
          placeholderTextColor={themeColors.textPlaceholder}
          style={styles.importInput}
          textAlignVertical="top"
          value={importText}
        />
        {importByteLimitFeedback ? (
          <Text
            accessibilityLiveRegion="polite"
            aria-live="polite"
            style={[styles.feedbackText, styles.feedbackError]}
          >
            {importByteLimitFeedback}
          </Text>
        ) : null}
        <View style={styles.importActions}>
          <Pressable
            aria-disabled={importPayloadOverByteLimit}
            accessibilityLabel={copy.importPreviewAccessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: importPayloadOverByteLimit }}
            disabled={importPayloadOverByteLimit}
            hitSlop={space[1]}
            onPress={handlePreviewImport}
            style={({ pressed }) => [
              styles.secondaryButton,
              importPayloadOverByteLimit ? styles.secondaryButtonDisabled : null,
              pressed && !importPayloadOverByteLimit
                ? reduceMotion
                  ? styles.secondaryButtonPressedReducedMotion
                  : styles.secondaryButtonPressed
                : null,
            ]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                importPayloadOverByteLimit ? styles.secondaryButtonTextDisabled : null,
              ]}
            >
              {copy.importPreview}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={copy.importReset}
            accessibilityRole="button"
            hitSlop={space[1]}
            onPress={handleResetImport}
            style={({ pressed }) => [
              styles.outlineButton,
              pressed
                ? reduceMotion
                  ? styles.outlineButtonPressedReducedMotion
                  : styles.outlineButtonPressed
                : null,
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
                pressed
                  ? reduceMotion
                    ? styles.secondaryButtonPressedReducedMotion
                    : styles.secondaryButtonPressed
                  : null,
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

function createStyles(themeColors: ThemeColors) {
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
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      letterSpacing: typography.subHeading.letterSpacing,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    studyControlsGroup: {
      borderColor: themeColors.canvas,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      marginHorizontal: -space[0.5],
      padding: space[0.5],
    },
    studyControlsGroupFocused: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
    },
    studyFocusText: {
      color: themeColors.focus,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    section: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
      ...shadows.card,
    },
    sectionTitle: {
      color: themeColors.text,
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
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
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
      fontSize: typography.caption.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    pillTextActive: {
      color: themeColors.badgeBlueText,
    },
    controlFocused: {
      borderColor: themeColors.focus,
    },
    controlPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    controlPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    goalPill: {
      alignItems: 'flex-start',
      gap: space.divider,
      minWidth: space[12],
    },
    goalNumberText: {
      color: themeColors.text,
      fontSize: typography.bodyBold.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.bodyBold.lineHeight,
    },
    goalPresetText: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    secondaryButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.accent,
      borderColor: themeColors.accent,
      borderWidth: space.hairline,
      borderRadius: radius.button,
      justifyContent: 'center',
      minHeight: space[5] + space[0.5],
      paddingHorizontal: space[2],
      paddingVertical: space[1.25],
    },
    secondaryButtonFocused: {
      borderColor: themeColors.focus,
    },
    secondaryButtonDisabled: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
    },
    secondaryButtonPressed: {
      backgroundColor: themeColors.accentActive,
      transform: [{ scale: motion.pressedScale }],
    },
    secondaryButtonPressedReducedMotion: {
      backgroundColor: themeColors.accentActive,
    },
    secondaryButtonText: {
      color: themeColors.surface,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    secondaryButtonTextDisabled: {
      color: themeColors.textMuted,
    },
    disclaimerText: {
      color: themeColors.textDisclaimer,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    importInput: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.input,
      borderWidth: space.hairline,
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
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
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: space[5] + space[0.5],
      paddingHorizontal: space[2],
      paddingVertical: space[1.25],
    },
    outlineButtonPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    outlineButtonPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    outlineButtonText: {
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    importSummary: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[0.75],
      padding: space[1.5],
    },
    summaryTitle: {
      color: themeColors.text,
      fontSize: typography.bodyBold.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.bodyBold.lineHeight,
    },
    summaryText: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    feedbackText: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    feedbackError: {
      color: themeColors.warning,
    },
    feedbackSuccess: {
      color: themeColors.success,
    },
  });
}
