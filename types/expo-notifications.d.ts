// Minimal type stubs for expo-notifications.
// The package is a native-only peer dependency — not installed in node_modules —
// so we declare just enough shape to satisfy tsc without pulling in the full SDK.
// The real module is loaded dynamically at runtime in lib/notifications/studyReminder.ts.
declare module 'expo-notifications' {
  export interface NotificationChannelInput {
    importance?: number;
    name?: string;
    [key: string]: unknown;
  }

  export interface NotificationContentInput {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export type NotificationTriggerInput = unknown;

  export interface NotificationRequestInput {
    content: NotificationContentInput;
    trigger: NotificationTriggerInput;
  }

  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function scheduleNotificationAsync(request: NotificationRequestInput): Promise<string>;
  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function setNotificationChannelAsync(
    channelId: string,
    channel: NotificationChannelInput,
  ): Promise<unknown>;

  export const AndroidImportance: { DEFAULT: number; [key: string]: number };
  export const SchedulableTriggerInputTypes: { DAILY: string; [key: string]: string };
}
