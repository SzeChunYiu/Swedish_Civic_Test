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
const defaultDailyGoalAnswers = 10;
const minDailyGoalAnswers = 1;
const maxDailyGoalAnswers = 50;

let settingsStorage: MMKV | null = null;

try {
  settingsStorage = createMMKV({ id: settingsStorageId });
} catch {
  settingsStorage = null;
}

function readStorageString(key: string): string | undefined {
  try {
    return settingsStorage?.getString(key);
  } catch {
    return undefined;
  }
}

function readStorageBoolean(key: string): boolean | undefined {
  try {
    return settingsStorage?.getBoolean(key);
  } catch {
    return undefined;
  }
}

function readStorageNumber(key: string): number | undefined {
  try {
    return settingsStorage?.getNumber(key);
  } catch {
    return undefined;
  }
}

function readLanguage(): AppLanguage {
  const language = readStorageString(languageKey);
  return language === 'en' ? 'en' : 'sv';
}

function readAudioEnabled(): boolean {
  const storedValue = readStorageBoolean(audioEnabledKey);
  return storedValue ?? true;
}

function normalizeDailyGoalAnswers(answerCount: number | undefined): number {
  if (
    typeof answerCount !== 'number' ||
    !Number.isFinite(answerCount) ||
    !Number.isInteger(answerCount)
  ) {
    return defaultDailyGoalAnswers;
  }

  if (answerCount < minDailyGoalAnswers || answerCount > maxDailyGoalAnswers) {
    return defaultDailyGoalAnswers;
  }

  return answerCount;
}

function readDailyGoalAnswers(): number {
  const storedValue = readStorageNumber(dailyGoalKey);
  return normalizeDailyGoalAnswers(storedValue);
}

function readIncludeSupplementary(): boolean {
  const storedValue = readStorageBoolean(includeSupplementaryKey);
  return storedValue ?? false;
}

function readHasSeenAboutTheTest(): boolean {
  const storedValue = readStorageBoolean(hasSeenAboutTheTestKey);
  return storedValue ?? false;
}

export type ImportableSettings = Partial<{
  language: AppLanguage;
  audioEnabled: boolean;
  dailyGoalAnswers: number;
  includeSupplementaryQuestions: boolean;
  hasSeenAboutTheTest: boolean;
}>;

export function normalizeImportedSettings(value: unknown): ImportableSettings {
  if (!value || typeof value !== 'object') return {};

  const candidate = value as Record<string, unknown>;
  const settings: ImportableSettings = {};
  if (candidate.language === 'sv' || candidate.language === 'en') {
    settings.language = candidate.language;
  }
  if (typeof candidate.audioEnabled === 'boolean') {
    settings.audioEnabled = candidate.audioEnabled;
  }
  if (typeof candidate.dailyGoalAnswers === 'number') {
    const safeGoal = normalizeDailyGoalAnswers(candidate.dailyGoalAnswers);
    if (safeGoal === candidate.dailyGoalAnswers) settings.dailyGoalAnswers = safeGoal;
  }
  if (typeof candidate.includeSupplementaryQuestions === 'boolean') {
    settings.includeSupplementaryQuestions = candidate.includeSupplementaryQuestions;
  }
  if (typeof candidate.hasSeenAboutTheTest === 'boolean') {
    settings.hasSeenAboutTheTest = candidate.hasSeenAboutTheTest;
  }

  return settings;
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
    const safeGoal = normalizeDailyGoalAnswers(
      Math.max(minDailyGoalAnswers, Math.min(maxDailyGoalAnswers, Math.round(dailyGoalAnswers))),
    );
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

export function importSettingsSnapshot(value: unknown): ImportableSettings {
  const importedSettings = normalizeImportedSettings(value);
  if (importedSettings.language !== undefined) {
    settingsStorage?.set(languageKey, importedSettings.language);
  }
  if (importedSettings.audioEnabled !== undefined) {
    settingsStorage?.set(audioEnabledKey, importedSettings.audioEnabled);
  }
  if (importedSettings.dailyGoalAnswers !== undefined) {
    settingsStorage?.set(dailyGoalKey, importedSettings.dailyGoalAnswers);
  }
  if (importedSettings.includeSupplementaryQuestions !== undefined) {
    settingsStorage?.set(includeSupplementaryKey, importedSettings.includeSupplementaryQuestions);
  }
  if (importedSettings.hasSeenAboutTheTest !== undefined) {
    settingsStorage?.set(hasSeenAboutTheTestKey, importedSettings.hasSeenAboutTheTest);
  }

  useSettingsStore.setState(importedSettings);
  return importedSettings;
}
