import { Redirect } from 'expo-router';

import { useSettingsStore } from '../lib/storage/settingsStore';

export default function IndexScreen() {
  const hasCompletedOnboarding = useSettingsStore((state) => state.hasCompletedOnboarding);

  return <Redirect href={hasCompletedOnboarding ? '/home' : '/onboarding'} />;
}
