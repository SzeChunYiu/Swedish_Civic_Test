// Local type stubs matching expo-notifications shapes — avoids a hard
// dev-dependency on expo-notifications while keeping strict type safety.
// The actual module is imported dynamically at runtime in createExpoStudyReminderRuntime.
type NotificationChannelInput = {
  importance?: number;
  name?: string;
  [key: string]: unknown;
};
type NotificationContentInput = {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};
type NotificationTriggerInput = unknown;
type NotificationRequestInput = {
  content: NotificationContentInput;
  trigger: NotificationTriggerInput;
};

import type {
  AppLanguage,
  StudyReminderPersistedState,
  StudyReminderPermissionStatus,
} from '../storage/settingsStore';

export const STUDY_REMINDER_CHANNEL_ID = 'study-reminders';
export const STUDY_REMINDER_TIME_OPTIONS = [
  { hour: 8, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 30 },
] as const;
export const DEFAULT_STUDY_REMINDER_TIME = STUDY_REMINDER_TIME_OPTIONS[1];

export type StudyReminderRuntime = {
  getPermissionsAsync?: () => Promise<{ status: unknown }>;
  requestPermissionsAsync: () => Promise<{ status: unknown }>;
  scheduleNotificationAsync: (request: NotificationRequestInput) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  setNotificationChannelAsync?: (
    channelId: string,
    channel: NotificationChannelInput,
  ) => Promise<unknown>;
  androidImportanceDefault?: NonNullable<NotificationChannelInput['importance']>;
  dailyTriggerType?: string;
  platformOS?: string;
};

type EnableStudyReminderInput = {
  current: StudyReminderPersistedState;
  hour: number;
  minute: number;
  language: AppLanguage;
  runtime: StudyReminderRuntime;
};

type DisableStudyReminderInput = {
  current: StudyReminderPersistedState;
  runtime: Pick<StudyReminderRuntime, 'cancelScheduledNotificationAsync'>;
};

type StudyReminderTime = {
  hour: number;
  minute: number;
};

function normalizeStudyReminderPermissionStatus(status: unknown): StudyReminderPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

function isValidStudyReminderTimePart(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function isValidStudyReminderTime(value: unknown): value is StudyReminderTime {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StudyReminderTime>;
  return (
    isValidStudyReminderTimePart(candidate.hour, 0, 23) &&
    isValidStudyReminderTimePart(candidate.minute, 0, 59)
  );
}

function safeFallbackStudyReminderTime(fallback?: Partial<StudyReminderTime>): StudyReminderTime {
  if (isValidStudyReminderTime(fallback)) return fallback;
  return DEFAULT_STUDY_REMINDER_TIME;
}

export function sanitizeStudyReminderTime(
  hour: unknown,
  minute: unknown,
  fallback?: Partial<StudyReminderTime>,
): StudyReminderTime {
  if (isValidStudyReminderTimePart(hour, 0, 23) && isValidStudyReminderTimePart(minute, 0, 59)) {
    return { hour, minute };
  }

  return safeFallbackStudyReminderTime(fallback);
}

export function formatStudyReminderTime(hour: unknown, minute: unknown): string {
  const safeTime = sanitizeStudyReminderTime(hour, minute);
  return `${String(safeTime.hour).padStart(2, '0')}:${String(safeTime.minute).padStart(2, '0')}`;
}

export function buildStudyReminderNotificationContent(
  language: AppLanguage,
): NotificationRequestInput['content'] {
  if (language === 'sv') {
    return {
      title: 'Dagens lilla pass väntar',
      body: 'Några frågor nu gör provdagen lugnare.',
      data: { route: '/(tabs)/practice', source: 'local-study-reminder' },
    };
  }

  return {
    title: 'Your study check-in is ready',
    body: 'A few questions today keeps test day calmer.',
    data: { route: '/(tabs)/practice', source: 'local-study-reminder' },
  };
}

async function resolveStudyReminderPermission(
  runtime: StudyReminderRuntime,
  currentStatus: StudyReminderPermissionStatus,
): Promise<StudyReminderPermissionStatus> {
  const existingStatus = runtime.getPermissionsAsync
    ? normalizeStudyReminderPermissionStatus((await runtime.getPermissionsAsync()).status)
    : currentStatus;

  if (existingStatus === 'granted') return 'granted';
  if (existingStatus === 'denied') return 'denied';

  return normalizeStudyReminderPermissionStatus((await runtime.requestPermissionsAsync()).status);
}

async function cancelExistingStudyReminder(
  runtime: Pick<StudyReminderRuntime, 'cancelScheduledNotificationAsync'>,
  notificationId: string | null,
): Promise<void> {
  if (notificationId) await runtime.cancelScheduledNotificationAsync(notificationId);
}

async function ensureStudyReminderChannel(
  runtime: StudyReminderRuntime,
  language: AppLanguage,
): Promise<void> {
  if (
    runtime.platformOS !== 'android' ||
    !runtime.setNotificationChannelAsync ||
    runtime.androidImportanceDefault === undefined
  ) {
    return;
  }

  await runtime.setNotificationChannelAsync(STUDY_REMINDER_CHANNEL_ID, {
    importance: runtime.androidImportanceDefault,
    name: language === 'sv' ? 'Studiepåminnelser' : 'Study reminders',
  });
}

export async function enableStudyReminder({
  current,
  hour,
  minute,
  language,
  runtime,
}: EnableStudyReminderInput): Promise<StudyReminderPersistedState> {
  const safeTime = sanitizeStudyReminderTime(hour, minute, {
    hour: current.studyReminderHour,
    minute: current.studyReminderMinute,
  });
  const permissionStatus = await resolveStudyReminderPermission(
    runtime,
    current.studyReminderPermissionStatus,
  );

  if (permissionStatus !== 'granted') {
    await cancelExistingStudyReminder(runtime, current.studyReminderNotificationId);
    return {
      ...current,
      studyReminderEnabled: false,
      studyReminderHour: safeTime.hour,
      studyReminderMinute: safeTime.minute,
      studyReminderPermissionStatus: permissionStatus,
      studyReminderNotificationId: null,
    };
  }

  await ensureStudyReminderChannel(runtime, language);
  await cancelExistingStudyReminder(runtime, current.studyReminderNotificationId);

  const notificationId = await runtime.scheduleNotificationAsync({
    content: buildStudyReminderNotificationContent(language),
    trigger: {
      type: runtime.dailyTriggerType ?? 'daily',
      hour: safeTime.hour,
      minute: safeTime.minute,
      channelId: STUDY_REMINDER_CHANNEL_ID,
    } as NotificationRequestInput['trigger'],
  });

  return {
    ...current,
    studyReminderEnabled: true,
    studyReminderHour: safeTime.hour,
    studyReminderMinute: safeTime.minute,
    studyReminderPermissionStatus: 'granted',
    studyReminderNotificationId: notificationId,
  };
}

export async function disableStudyReminder({
  current,
  runtime,
}: DisableStudyReminderInput): Promise<StudyReminderPersistedState> {
  await cancelExistingStudyReminder(runtime, current.studyReminderNotificationId);
  return {
    ...current,
    studyReminderEnabled: false,
    studyReminderNotificationId: null,
  };
}

export async function createExpoStudyReminderRuntime(): Promise<StudyReminderRuntime | null> {
  const [{ Platform }, Notifications] = await Promise.all([
    import('react-native'),
    import('expo-notifications'),
  ]);

  if (String(Platform.OS) === 'web') return null;

  return {
    getPermissionsAsync: Notifications.getPermissionsAsync,
    requestPermissionsAsync: Notifications.requestPermissionsAsync,
    scheduleNotificationAsync: Notifications.scheduleNotificationAsync,
    cancelScheduledNotificationAsync: Notifications.cancelScheduledNotificationAsync,
    setNotificationChannelAsync: Notifications.setNotificationChannelAsync,
    androidImportanceDefault: Notifications.AndroidImportance.DEFAULT,
    dailyTriggerType: Notifications.SchedulableTriggerInputTypes.DAILY,
    platformOS: Platform.OS,
  };
}
