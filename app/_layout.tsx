import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { AuthProvider } from '../lib/auth/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <LaunchPopupAd />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
