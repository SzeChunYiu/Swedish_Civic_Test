// Local type stubs matching expo-notifications response shapes. The real
// module is loaded dynamically so web and missing native modules fail closed.
type NotificationSubscription = {
  remove?: () => void;
};

type NotificationResponse = {
  actionIdentifier?: string;
  notification?: {
    request?: {
      identifier?: string;
      content?: {
        data?: unknown;
      };
    };
  };
};

type ExpoNotificationsRoutingModule = {
  addNotificationResponseReceivedListener?: (
    listener: (response: NotificationResponse) => void,
  ) => NotificationSubscription;
  getLastNotificationResponse?: () => NotificationResponse | null | undefined;
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null | undefined>;
};

export type StudyReminderNotificationRoute = '/practice';

export type StudyReminderNotificationRoutingRuntime = {
  addNotificationResponseReceivedListener?: (
    listener: (response: NotificationResponse) => void,
  ) => NotificationSubscription;
  getLastNotificationResponse?: () => NotificationResponse | null | undefined;
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null | undefined>;
  platformOS?: string;
};

const STUDY_REMINDER_NOTIFICATION_SOURCE = 'local-study-reminder';
const STUDY_REMINDER_ROUTE = '/practice';
const LEGACY_STUDY_REMINDER_ROUTE = '/(tabs)/practice';
const allowedStudyReminderRoutes = new Set([STUDY_REMINDER_ROUTE, LEGACY_STUDY_REMINDER_ROUTE]);

function firstString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function notificationData(response: NotificationResponse): Record<string, unknown> | null {
  const data = response.notification?.request?.content?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

export function normalizeStudyReminderNotificationRoute(
  data: unknown,
): StudyReminderNotificationRoute | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const candidate = data as Record<string, unknown>;
  const source = firstString(candidate.source);
  const route = firstString(candidate.route);

  if (source !== STUDY_REMINDER_NOTIFICATION_SOURCE || !route) return null;
  if (!allowedStudyReminderRoutes.has(route)) return null;

  return STUDY_REMINDER_ROUTE;
}

export function routeFromStudyReminderNotificationResponse(
  response: NotificationResponse,
): StudyReminderNotificationRoute | null {
  const data = notificationData(response);
  return data ? normalizeStudyReminderNotificationRoute(data) : null;
}

function notificationResponseDedupeKey(response: NotificationResponse): string | null {
  const identifier = firstString(response.notification?.request?.identifier);
  if (!identifier) return null;
  const actionIdentifier = firstString(response.actionIdentifier) ?? 'default';
  return `${identifier}:${actionIdentifier}`;
}

function handleLastNotificationResponse(
  runtime: StudyReminderNotificationRoutingRuntime,
  handler: (response: NotificationResponse) => void,
): void {
  try {
    if (runtime.getLastNotificationResponse) {
      const response = runtime.getLastNotificationResponse();
      if (response) handler(response);
      return;
    }
    if (runtime.getLastNotificationResponseAsync) {
      void runtime
        .getLastNotificationResponseAsync()
        .then((response) => {
          if (response) handler(response);
        })
        .catch(() => undefined);
    }
  } catch {
    // Last-response lookup is best-effort; live listener routing still fails closed.
  }
}

export function registerStudyReminderNotificationResponseRouting(
  runtime: StudyReminderNotificationRoutingRuntime | null,
  navigate: (route: StudyReminderNotificationRoute) => void,
): () => void {
  if (
    !runtime?.getLastNotificationResponse &&
    !runtime?.getLastNotificationResponseAsync &&
    !runtime?.addNotificationResponseReceivedListener
  ) {
    return () => undefined;
  }

  let active = true;
  const handledResponses = new WeakSet<object>();
  const handledResponseKeys = new Set<string>();

  const routeResponse = (response: NotificationResponse) => {
    if (!active) return;
    const route = routeFromStudyReminderNotificationResponse(response);
    if (!route) return;

    if (typeof response === 'object' && response) {
      if (handledResponses.has(response)) return;
      handledResponses.add(response);
    }

    const dedupeKey = notificationResponseDedupeKey(response);
    if (dedupeKey) {
      if (handledResponseKeys.has(dedupeKey)) return;
      handledResponseKeys.add(dedupeKey);
    }

    navigate(route);
  };

  handleLastNotificationResponse(runtime, routeResponse);

  const subscription = runtime.addNotificationResponseReceivedListener?.((response) => {
    routeResponse(response);
  });

  return () => {
    active = false;
    subscription?.remove?.();
  };
}

export async function createExpoStudyReminderNotificationRoutingRuntime(): Promise<StudyReminderNotificationRoutingRuntime | null> {
  try {
    const { Platform } = await import('react-native');

    if (String(Platform.OS) === 'web') return null;

    const notifications = (await import('expo-notifications')) as ExpoNotificationsRoutingModule;

    if (
      !notifications.addNotificationResponseReceivedListener &&
      !notifications.getLastNotificationResponse &&
      !notifications.getLastNotificationResponseAsync
    ) {
      return null;
    }

    return {
      addNotificationResponseReceivedListener:
        notifications.addNotificationResponseReceivedListener,
      getLastNotificationResponse: notifications.getLastNotificationResponse,
      getLastNotificationResponseAsync: notifications.getLastNotificationResponseAsync,
      platformOS: Platform.OS,
    };
  } catch {
    return null;
  }
}
