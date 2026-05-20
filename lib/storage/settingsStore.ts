import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { stopSpeech } from '../audio/speak';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { writeRecoverably } from './persistenceWarning';

export type AppLanguage = 'sv' | 'en';

export type StudyReminderPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type StudyReminderPersistedState = {
  studyReminderEnabled: boolean;
  studyReminderHour: number;
  studyReminderMinute: number;
  studyReminderPermissionStatus: StudyReminderPermissionStatus;
  studyReminderNotificationId: string | null;
};

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

function readLanguage(): AppLanguage {
  const language = readStorageString(languageKey);
  return normalizeLanguage(language);
}

function readAudioEnabled(): boolean {
  const storedValue = readStorageBoolean(audioEnabledKey);
  return storedValue ?? true;
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

function normalizeLanguage(language: unknown): AppLanguage {
  return language === 'en' ? 'en' : 'sv';
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeDailyGoalAnswers(answerCount: unknown): number {
  if (
    typeof answerCount !== 'number' ||
    !Number.isFinite(answerCount) ||
    !Number.isInteger(answerCount) ||
    answerCount < minDailyGoalAnswers ||
    answerCount > maxDailyGoalAnswers
  ) {
    return defaultDailyGoalAnswers;
  }

  return answerCount;
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
    language = normalizeLanguage(language);
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      languageKey,
      language,
    );
    set({ language, persistenceWarning });
  },
  setAudioEnabled: (audioEnabled) => {
    if (typeof audioEnabled !== 'boolean') return;
    if (!audioEnabled) {
      stopSpeech();
    }
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
    const normalizedGoal = Number.isFinite(safeGoal) ? safeGoal : defaultDailyGoalAnswers;
    const persistenceWarning = writeRecoverably(
      settingsStorage,
      settingsStorageId,
      dailyGoalKey,
      normalizedGoal,
    );
    set({ dailyGoalAnswers: normalizedGoal, persistenceWarning });
  },
  setIncludeSupplementaryQuestions: (include) => {
    include = normalizeBoolean(include, false);
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
