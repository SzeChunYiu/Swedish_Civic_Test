// Metro resolves expo-notifications to this web-only stub so the static web export
// can bundle settings routes without installing native notification modules.
module.exports = {
  AndroidImportance: { DEFAULT: 'default' },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  async getPermissionsAsync() {
    return { status: 'undetermined' };
  },
  async requestPermissionsAsync() {
    return { status: 'denied' };
  },
  async scheduleNotificationAsync() {
    return null;
  },
  async cancelScheduledNotificationAsync() {},
  async setNotificationChannelAsync() {},
};
