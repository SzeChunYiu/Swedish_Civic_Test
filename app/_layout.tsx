import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';

export default function RootLayout() {
  const pathname = usePathname();
  const isExamRoute = pathname === '/exam' || pathname.startsWith('/exam/');

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {!isExamRoute ? <LaunchPopupAd /> : null}
      <StatusBar style="auto" />
    </>
  );
}
