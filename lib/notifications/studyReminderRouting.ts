// Local type stubs matching expo-notifications response shapes. The real
// module is loaded dynamically so web and missing native modules fail closed.
type NotificationSubscription = {
  remove?: () => void;
};

type NotificationResponse = {
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
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null>;
};

export type StudyReminderNotificationRoute = '/practice';

export type StudyReminderNotificationRoutingRuntime = {
  addNotificationResponseReceivedListener: (
    listener: (response: NotificationResponse) => void,
  ) => NotificationSubscription;
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null>;
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

function notificationRequestIdentifier(response: NotificationResponse): string | null {
  return firstString(response.notification?.request?.identifier);
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

export function registerStudyReminderNotificationResponseRouting(
  runtime: StudyReminderNotificationRoutingRuntime | null,
  navigate: (route: StudyReminderNotificationRoute) => void,
): () => void {
  if (!runtime?.addNotificationResponseReceivedListener) return () => undefined;

  let active = true;
  const routedRequestIds = new Set<string>();
  const routeResponse = (response: NotificationResponse | null | undefined) => {
    if (!active || !response) return;
    const route = routeFromStudyReminderNotificationResponse(response);
    if (!route) return;

    const requestId = notificationRequestIdentifier(response);
    if (requestId) {
      if (routedRequestIds.has(requestId)) return;
      routedRequestIds.add(requestId);
    }

    navigate(route);
  };

  const subscription = runtime.addNotificationResponseReceivedListener(routeResponse);

  if (runtime.getLastNotificationResponseAsync) {
    void runtime.getLastNotificationResponseAsync().then(routeResponse, () => undefined);
  }

  return () => {
    active = false;
    subscription.remove?.();
  };
}

export async function createExpoStudyReminderNotificationRoutingRuntime(): Promise<StudyReminderNotificationRoutingRuntime | null> {
  try {
    const { Platform } = await import('react-native');

    if (String(Platform.OS) === 'web') return null;

    const notifications = (await import('expo-notifications')) as ExpoNotificationsRoutingModule;

    if (!notifications.addNotificationResponseReceivedListener) return null;

    return {
      addNotificationResponseReceivedListener:
        notifications.addNotificationResponseReceivedListener,
      getLastNotificationResponseAsync: notifications.getLastNotificationResponseAsync,
      platformOS: Platform.OS,
    };
  } catch {
    return null;
  }
}
