import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { writeRecoverably } from './persistenceWarning';

export type AppLanguage = 'sv' | 'en';

const languageKey = 'language';
const audioEnabledKey = 'audioEnabled';
const dailyGoalKey = 'dailyGoalAnswers';
const includeSupplementaryKey = 'includeSupplementaryQuestions';
const hasSeenAboutTheTestKey = 'hasSeenAboutTheTest';
const settingsStorageId = 'settings';

let settingsStorage: MMKV | null = null;

try {
  settingsStorage = createMMKV({ id: settingsStorageId });
} catch {
  settingsStorage = null;
}

function readLanguage(): AppLanguage {
  const language = settingsStorage?.getString(languageKey);
  return language === 'en' ? 'en' : 'sv';
}

function readAudioEnabled(): boolean {
  const storedValue = settingsStorage?.getBoolean(audioEnabledKey);
  return storedValue ?? true;
}

function readDailyGoalAnswers(): number {
  const storedValue = settingsStorage?.getNumber(dailyGoalKey);
  return storedValue && storedValue > 0 ? storedValue : 10;
}

function readIncludeSupplementary(): boolean {
  const storedValue = settingsStorage?.getBoolean(includeSupplementaryKey);
  return storedValue ?? false;
}

function readHasSeenAboutTheTest(): boolean {
  const storedValue = settingsStorage?.getBoolean(hasSeenAboutTheTestKey);
  return storedValue ?? false;
}

type SettingsState = {
  language: AppLanguage;
  audioEnabled: boolean;
  dailyGoalAnswers: number;
  includeSupplementaryQuestions: boolean;
  hasSeenAboutTheTest: boolean;
  persistenceWarning: RecoverablePersistenceWarning | null;
  setLanguage: (language: AppLanguage) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setDailyGoalAnswers: (answerCount: number) => void;
  setIncludeSupplementaryQuestions: (include: boolean) => void;
  markAboutTheTestSeen: () => void;
  clearPersistenceWarning: () => void;
};

export type ImportableSettings = Partial<
  Pick<
    SettingsState,
    | 'language'
    | 'audioEnabled'
    | 'dailyGoalAnswers'
    | 'includeSupplementaryQuestions'
    | 'hasSeenAboutTheTest'
  >
>;

export function normalizeImportedSettings(value: unknown): ImportableSettings {
  if (!value || typeof value !== 'object') return {};

  const candidate = value as Partial<SettingsState>;
  const settings: ImportableSettings = {};
  if (candidate.language === 'sv' || candidate.language === 'en') {
    settings.language = candidate.language;
  }
  if (typeof candidate.audioEnabled === 'boolean') {
    settings.audioEnabled = candidate.audioEnabled;
  }
  if (
    typeof candidate.dailyGoalAnswers === 'number' &&
    Number.isFinite(candidate.dailyGoalAnswers)
  ) {
    settings.dailyGoalAnswers = Math.max(1, Math.min(50, Math.round(candidate.dailyGoalAnswers)));
  }
  if (typeof candidate.includeSupplementaryQuestions === 'boolean') {
    settings.includeSupplementaryQuestions = candidate.includeSupplementaryQuestions;
  }
  if (typeof candidate.hasSeenAboutTheTest === 'boolean') {
    settings.hasSeenAboutTheTest = candidate.hasSeenAboutTheTest;
  }

  return settings;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: readLanguage(),
  audioEnabled: readAudioEnabled(),
  dailyGoalAnswers: readDailyGoalAnswers(),
  includeSupplementaryQuestions: readIncludeSupplementary(),
  hasSeenAboutTheTest: readHasSeenAboutTheTest(),
  persistenceWarning: null,
  setLanguage: (language) => {
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      languageKey,
      language,
    );
    set({ language, persistenceWarning });
  },
  setAudioEnabled: (audioEnabled) => {
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      audioEnabledKey,
      audioEnabled,
    );
    set({ audioEnabled, persistenceWarning });
  },
  setDailyGoalAnswers: (dailyGoalAnswers) => {
    const safeGoal = Math.max(1, Math.min(50, Math.round(dailyGoalAnswers)));
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      dailyGoalKey,
      safeGoal,
    );
    set({ dailyGoalAnswers: safeGoal, persistenceWarning });
  },
  setIncludeSupplementaryQuestions: (include) => {
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      includeSupplementaryKey,
      include,
    );
    set({ includeSupplementaryQuestions: include, persistenceWarning });
  },
  markAboutTheTestSeen: () => {
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      hasSeenAboutTheTestKey,
      true,
    );
    set({ hasSeenAboutTheTest: true, persistenceWarning });
  },
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

export function importSettingsSnapshot(settings: ImportableSettings): void {
  const normalizedSettings = normalizeImportedSettings(settings);
  let persistenceWarning: RecoverablePersistenceWarning | null = null;
  if (normalizedSettings.language !== undefined) {
    persistenceWarning =
      writeRecoverably(
        settingsStorage,
        settingsStorageId,
        languageKey,
        normalizedSettings.language,
      ) ?? persistenceWarning;
  }
  if (normalizedSettings.audioEnabled !== undefined) {
    persistenceWarning =
      writeRecoverably(
        settingsStorage,
        settingsStorageId,
        audioEnabledKey,
        normalizedSettings.audioEnabled,
      ) ?? persistenceWarning;
  }
  if (normalizedSettings.dailyGoalAnswers !== undefined) {
    persistenceWarning =
      writeRecoverably(
        settingsStorage,
        settingsStorageId,
        dailyGoalKey,
        normalizedSettings.dailyGoalAnswers,
      ) ?? persistenceWarning;
  }
  if (normalizedSettings.includeSupplementaryQuestions !== undefined) {
    persistenceWarning =
      writeRecoverably(
        settingsStorage,
        settingsStorageId,
        includeSupplementaryKey,
        normalizedSettings.includeSupplementaryQuestions,
      ) ?? persistenceWarning;
  }
  if (normalizedSettings.hasSeenAboutTheTest !== undefined) {
    persistenceWarning =
      writeRecoverably(
        settingsStorage,
        settingsStorageId,
        hasSeenAboutTheTestKey,
        normalizedSettings.hasSeenAboutTheTest,
      ) ?? persistenceWarning;
  }
  useSettingsStore.setState({ ...normalizedSettings, persistenceWarning });
}
