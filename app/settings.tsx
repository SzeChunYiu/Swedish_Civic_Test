import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ComplianceActionLink } from '../components/compliance/ComplianceActionLink';
import { ComplianceLinks } from '../components/compliance/ComplianceLinks';
import {
  applyLocalStudyDataImport,
  previewLocalStudyDataImport,
  type LocalStudyDataImportErrorCode,
  type LocalStudyDataImportPreview,
  type LocalStudyDataImportSummary,
} from '../lib/storage/localStudyDataImport';
import type { AppLanguage } from '../lib/storage/settingsStore';
import { useSettingsStore } from '../lib/storage/settingsStore';
import { colors, motion, radius, shadows, space, typography } from '../lib/theme';

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
    languageAccessibilityLabel: (label) => `Set question language to ${label}`,
    questionLanguageTitle: 'Question language',
    setDailyGoalAccessibilityLabel: (goal) => `Set daily goal to ${goal} answers`,
    subtitle: 'Control study language, audio, and your daily goal.',
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
  const language = useSettingsStore((state) => state.language);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);
  const copy = settingsCopy[language];
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<LocalStudyDataImportPreview | null>(null);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);

  const handleImportTextChange = (value: string) => {
    setImportText(value);
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

  const handleConfirmImport = () => {
    const result = previewLocalStudyDataImport(importText);
    if (!result.ok) {
      setImportPreview(null);
      setImportFeedback({ tone: 'error', text: copy.importErrorMessage(result.code) });
      return;
    }

    applyLocalStudyDataImport(result.preview);
    setImportPreview(result.preview);
    setImportFeedback({ tone: 'success', text: copy.importSuccess });
  };

  const handleResetImport = () => {
    setImportText('');
    setImportPreview(null);
    setImportFeedback(null);
  };

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

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {copy.questionLanguageTitle}
        </Text>
        <View
          aria-label={copy.questionLanguageTitle}
          accessibilityLabel={copy.questionLanguageTitle}
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
          placeholderTextColor={colors.textPlaceholder}
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
  controlPressed: {
    transform: [{ scale: motion.pressedScale }],
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
  secondaryButtonPressed: {
    backgroundColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
  secondaryButtonText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  outlineButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: space[5] + space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
  },
  outlineButtonPressed: {
    backgroundColor: colors.badgeBlueBg,
    transform: [{ scale: motion.pressedScale }],
  },
  outlineButtonText: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  importActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  importInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    minHeight: space[15],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  disclaimerText: {
    color: colors.textDisclaimer,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  importSummary: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.75],
    padding: space[1.5],
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyBold.lineHeight,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  feedbackText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  feedbackError: {
    color: colors.warning,
  },
  feedbackSuccess: {
    color: colors.success,
  },
});
