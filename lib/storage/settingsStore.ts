import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { stopSpeech } from '../audio/speak';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { readRecoverably, writeRecoverably } from './persistenceWarning';

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
export const supportedDailyGoalAnswerOptions = [5, 10, 20, 40] as const;

const dailyGoalAnswerOptions = new Set<number>(supportedDailyGoalAnswerOptions);

let settingsStorage: MMKV | null = null;
let initialPersistenceWarning: RecoverablePersistenceWarning | null = null;

try {
  settingsStorage = createMMKV({ id: 'settings' });
} catch {
  settingsStorage = null;
}

function readLanguage(): AppLanguage {
  const language = readStorageString(languageKey);
  return language === 'en' ? 'en' : 'sv';
}

function readStorageString(key: string): string | undefined {
  const result = readRecoverably(settingsStorage, settingsStorageId, key, () =>
    settingsStorage?.getString(key),
  );
  rememberInitialReadWarning(result.warning);
  return result.value;
}

function readStorageBoolean(key: string): boolean | undefined {
  const result = readRecoverably(settingsStorage, settingsStorageId, key, () =>
    settingsStorage?.getBoolean(key),
  );
  rememberInitialReadWarning(result.warning);
  return result.value;
}

function readStorageNumber(key: string): number | undefined {
  const result = readRecoverably(settingsStorage, settingsStorageId, key, () =>
    settingsStorage?.getNumber(key),
  );
  rememberInitialReadWarning(result.warning);
  return result.value;
}

function rememberInitialReadWarning(warning: RecoverablePersistenceWarning | null): void {
  if (!initialPersistenceWarning && warning) {
    initialPersistenceWarning = warning;
  }
}

function readAudioEnabled(): boolean {
  const storedValue = readStorageBoolean(audioEnabledKey);
  return storedValue ?? true;
}

function normalizeDailyGoalAnswers(answerCount: unknown): number {
  if (!isDailyGoalAnswerOption(answerCount)) {
    return defaultDailyGoalAnswers;
  }

  return answerCount;
}

function normalizeImportedDailyGoalAnswers(answerCount: unknown): number | undefined {
  return isDailyGoalAnswerOption(answerCount) ? answerCount : undefined;
}

function isDailyGoalAnswerOption(answerCount: unknown): answerCount is number {
  return (
    typeof answerCount === 'number' &&
    Number.isFinite(answerCount) &&
    Number.isInteger(answerCount) &&
    dailyGoalAnswerOptions.has(answerCount)
  );
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
  if (Object.prototype.hasOwnProperty.call(candidate, 'dailyGoalAnswers')) {
    const dailyGoalAnswers = normalizeImportedDailyGoalAnswers(candidate.dailyGoalAnswers);
    if (dailyGoalAnswers !== undefined) settings.dailyGoalAnswers = dailyGoalAnswers;
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
  persistenceWarning: initialPersistenceWarning,
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
    const safeGoal = normalizeDailyGoalAnswers(dailyGoalAnswers);
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

export function importSettingsSnapshot(
  settings: ImportableSettings,
): RecoverablePersistenceWarning | null {
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
    if (normalizedSettings.audioEnabled === false) {
      stopSpeech();
    }
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
  return persistenceWarning;
}
