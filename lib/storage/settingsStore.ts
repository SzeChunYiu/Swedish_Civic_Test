import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

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
  setLanguage: (language) => {
    settingsStorage?.set(languageKey, language);
    set({ language });
  },
  setAudioEnabled: (audioEnabled) => {
    settingsStorage?.set(audioEnabledKey, audioEnabled);
    set({ audioEnabled });
  },
  setDailyGoalAnswers: (dailyGoalAnswers) => {
    const safeGoal = Math.max(1, Math.min(50, Math.round(dailyGoalAnswers)));
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

export function importSettingsSnapshot(settings: ImportableSettings): void {
  const normalizedSettings = normalizeImportedSettings(settings);
  if (normalizedSettings.language !== undefined) {
    settingsStorage?.set(languageKey, normalizedSettings.language);
  }
  if (normalizedSettings.audioEnabled !== undefined) {
    settingsStorage?.set(audioEnabledKey, normalizedSettings.audioEnabled);
  }
  if (normalizedSettings.dailyGoalAnswers !== undefined) {
    settingsStorage?.set(dailyGoalKey, normalizedSettings.dailyGoalAnswers);
  }
  if (normalizedSettings.includeSupplementaryQuestions !== undefined) {
    settingsStorage?.set(includeSupplementaryKey, normalizedSettings.includeSupplementaryQuestions);
  }
  if (normalizedSettings.hasSeenAboutTheTest !== undefined) {
    settingsStorage?.set(hasSeenAboutTheTestKey, normalizedSettings.hasSeenAboutTheTest);
  }
  useSettingsStore.setState(normalizedSettings);
}
