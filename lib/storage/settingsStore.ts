import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { createStoragePersistenceWarning, type StoragePersistenceWarning } from './persistence';

export type AppLanguage = 'sv' | 'en';

const languageKey = 'language';
const audioEnabledKey = 'audioEnabled';
const dailyGoalKey = 'dailyGoalAnswers';
const includeSupplementaryKey = 'includeSupplementaryQuestions';
const hasSeenAboutTheTestKey = 'hasSeenAboutTheTest';

let settingsStorage: MMKV | null = null;

try {
  settingsStorage = createMMKV({ id: 'settings' });
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

function writeSetting(
  key: string,
  value: string | number | boolean,
): StoragePersistenceWarning | null {
  try {
    settingsStorage?.set(key, value);
    return null;
  } catch (error) {
    return createStoragePersistenceWarning('settings', key, error);
  }
}

type SettingsState = {
  language: AppLanguage;
  audioEnabled: boolean;
  dailyGoalAnswers: number;
  includeSupplementaryQuestions: boolean;
  hasSeenAboutTheTest: boolean;
  persistenceWarning: StoragePersistenceWarning | null;
  clearPersistenceWarning: () => void;
  setLanguage: (language: AppLanguage) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setDailyGoalAnswers: (answerCount: number) => void;
  setIncludeSupplementaryQuestions: (include: boolean) => void;
  markAboutTheTestSeen: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: readLanguage(),
  audioEnabled: readAudioEnabled(),
  dailyGoalAnswers: readDailyGoalAnswers(),
  includeSupplementaryQuestions: readIncludeSupplementary(),
  hasSeenAboutTheTest: readHasSeenAboutTheTest(),
  persistenceWarning: null,
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
  setLanguage: (language) => {
    const persistenceWarning = writeSetting(languageKey, language);
    set({ language, persistenceWarning });
  },
  setAudioEnabled: (audioEnabled) => {
    const persistenceWarning = writeSetting(audioEnabledKey, audioEnabled);
    set({ audioEnabled, persistenceWarning });
  },
  setDailyGoalAnswers: (dailyGoalAnswers) => {
    const safeGoal = Math.max(1, Math.min(50, Math.round(dailyGoalAnswers)));
    const persistenceWarning = writeSetting(dailyGoalKey, safeGoal);
    set({ dailyGoalAnswers: safeGoal, persistenceWarning });
  },
  setIncludeSupplementaryQuestions: (include) => {
    const persistenceWarning = writeSetting(includeSupplementaryKey, include);
    set({ includeSupplementaryQuestions: include, persistenceWarning });
  },
  markAboutTheTestSeen: () => {
    const persistenceWarning = writeSetting(hasSeenAboutTheTestKey, true);
    set({ hasSeenAboutTheTest: true, persistenceWarning });
  },
}));
