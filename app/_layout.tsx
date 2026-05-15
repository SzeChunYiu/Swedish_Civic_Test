import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <LaunchPopupAd />
      <StatusBar style="auto" />
    </>
  );
}
