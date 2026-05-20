import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

export type AppLanguage = 'sv' | 'en';
export type StudyReminderPermissionStatus = 'undetermined' | 'granted' | 'denied';

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
const studyReminderEnabledKey = 'studyReminderEnabled';
const studyReminderHourKey = 'studyReminderHour';
const studyReminderMinuteKey = 'studyReminderMinute';
const studyReminderPermissionStatusKey = 'studyReminderPermissionStatus';
const studyReminderNotificationIdKey = 'studyReminderNotificationId';

const defaultStudyReminderHour = 18;
const defaultStudyReminderMinute = 0;

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

function readStudyReminderHour(): number {
  const storedValue = settingsStorage?.getNumber(studyReminderHourKey);
  if (typeof storedValue !== 'number' || !Number.isFinite(storedValue)) {
    return defaultStudyReminderHour;
  }
  return Math.max(0, Math.min(23, Math.round(storedValue)));
}

function readStudyReminderMinute(): number {
  const storedValue = settingsStorage?.getNumber(studyReminderMinuteKey);
  if (typeof storedValue !== 'number' || !Number.isFinite(storedValue)) {
    return defaultStudyReminderMinute;
  }
  return Math.max(0, Math.min(59, Math.round(storedValue)));
}

function readStudyReminderPermissionStatus(): StudyReminderPermissionStatus {
  const storedValue = settingsStorage?.getString(studyReminderPermissionStatusKey);
  if (storedValue === 'granted' || storedValue === 'denied') return storedValue;
  return 'undetermined';
}

function readStudyReminderNotificationId(): string | null {
  const storedValue = settingsStorage?.getString(studyReminderNotificationIdKey);
  return storedValue ? storedValue : null;
}

function persistStudyReminderState(reminderState: StudyReminderPersistedState): void {
  const safeHour = Math.max(0, Math.min(23, Math.round(reminderState.studyReminderHour)));
  const safeMinute = Math.max(0, Math.min(59, Math.round(reminderState.studyReminderMinute)));
  settingsStorage?.set(studyReminderEnabledKey, reminderState.studyReminderEnabled);
  settingsStorage?.set(studyReminderHourKey, safeHour);
  settingsStorage?.set(studyReminderMinuteKey, safeMinute);
  settingsStorage?.set(
    studyReminderPermissionStatusKey,
    reminderState.studyReminderPermissionStatus,
  );
  settingsStorage?.set(
    studyReminderNotificationIdKey,
    reminderState.studyReminderNotificationId ?? '',
  );
}

type SettingsState = {
  language: AppLanguage;
  audioEnabled: boolean;
  dailyGoalAnswers: number;
  includeSupplementaryQuestions: boolean;
  hasSeenAboutTheTest: boolean;
  studyReminderEnabled: boolean;
  studyReminderHour: number;
  studyReminderMinute: number;
  studyReminderPermissionStatus: StudyReminderPermissionStatus;
  studyReminderNotificationId: string | null;
  setLanguage: (language: AppLanguage) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setDailyGoalAnswers: (answerCount: number) => void;
  setIncludeSupplementaryQuestions: (include: boolean) => void;
  markAboutTheTestSeen: () => void;
  setStudyReminderState: (reminderState: StudyReminderPersistedState) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: readLanguage(),
  audioEnabled: readAudioEnabled(),
  dailyGoalAnswers: readDailyGoalAnswers(),
  includeSupplementaryQuestions: readIncludeSupplementary(),
  hasSeenAboutTheTest: readHasSeenAboutTheTest(),
  studyReminderEnabled: settingsStorage?.getBoolean(studyReminderEnabledKey) ?? false,
  studyReminderHour: readStudyReminderHour(),
  studyReminderMinute: readStudyReminderMinute(),
  studyReminderPermissionStatus: readStudyReminderPermissionStatus(),
  studyReminderNotificationId: readStudyReminderNotificationId(),
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
  setStudyReminderState: (reminderState) => {
    const safeHour = Math.max(0, Math.min(23, Math.round(reminderState.studyReminderHour)));
    const safeMinute = Math.max(0, Math.min(59, Math.round(reminderState.studyReminderMinute)));
    const safeState = {
      ...reminderState,
      studyReminderHour: safeHour,
      studyReminderMinute: safeMinute,
    };
    persistStudyReminderState(safeState);
    set(safeState);
  },
}));
