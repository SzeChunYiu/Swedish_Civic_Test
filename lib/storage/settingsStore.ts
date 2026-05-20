import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

export type AppLanguage = 'sv' | 'en';

const languageKey = 'language';
const audioEnabledKey = 'audioEnabled';
const dailyGoalKey = 'dailyGoalAnswers';
const includeSupplementaryKey = 'includeSupplementaryQuestions';
const hasSeenAboutTheTestKey = 'hasSeenAboutTheTest';
const defaultDailyGoalAnswers = 10;
const minDailyGoalAnswers = 1;
const maxDailyGoalAnswers = 50;

let settingsStorage: MMKV | null = null;

try {
  settingsStorage = createMMKV({ id: 'settings' });
} catch {
  settingsStorage = null;
}

function readLanguage(): AppLanguage {
  let language: string | undefined;
  try {
    language = settingsStorage?.getString(languageKey);
  } catch {
    return 'sv';
  }

  return language === 'en' ? 'en' : 'sv';
}

function readAudioEnabled(): boolean {
  let storedValue: boolean | undefined;
  try {
    storedValue = settingsStorage?.getBoolean(audioEnabledKey);
  } catch {
    return true;
  }

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
  let storedValue: number | undefined;
  try {
    storedValue = settingsStorage?.getNumber(dailyGoalKey);
  } catch {
    return defaultDailyGoalAnswers;
  }

  return normalizeDailyGoalAnswers(storedValue);
}

function readIncludeSupplementary(): boolean {
  let storedValue: boolean | undefined;
  try {
    storedValue = settingsStorage?.getBoolean(includeSupplementaryKey);
  } catch {
    return false;
  }

  return storedValue ?? false;
}

function readHasSeenAboutTheTest(): boolean {
  let storedValue: boolean | undefined;
  try {
    storedValue = settingsStorage?.getBoolean(hasSeenAboutTheTestKey);
  } catch {
    return false;
  }

  return storedValue ?? false;
}

type SettingsState = {
  language: AppLanguage;
  audioEnabled: boolean;
  dailyGoalAnswers: number;
  includeSupplementaryQuestions: boolean;
  hasSeenAboutTheTest: boolean;
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
  setLanguage: (language) => {
    settingsStorage?.set(languageKey, language);
    set({ language });
  },
  setAudioEnabled: (audioEnabled) => {
    settingsStorage?.set(audioEnabledKey, audioEnabled);
    set({ audioEnabled });
  },
  setDailyGoalAnswers: (dailyGoalAnswers) => {
    const safeGoal = normalizeDailyGoalAnswers(
      Math.max(minDailyGoalAnswers, Math.min(maxDailyGoalAnswers, Math.round(dailyGoalAnswers))),
    );
    settingsStorage?.set(dailyGoalKey, safeGoal);
    set({ dailyGoalAnswers: safeGoal });
  },
  setIncludeSupplementaryQuestions: (include) => {
    settingsStorage?.set(includeSupplementaryKey, include);
    set({ includeSupplementaryQuestions: include });
  },
  markAboutTheTestSeen: () => {
    settingsStorage?.set(hasSeenAboutTheTestKey, true);
    set({ hasSeenAboutTheTest: true });
  },
}));
