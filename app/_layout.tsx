import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { AuthProvider } from '../lib/auth/AuthContext';
import { shouldSuppressLaunchPopupAdForPath } from '../lib/monetization/ads';
import { useRemoveAdsEntitlements } from '../lib/monetization/useRemoveAdsEntitlements';
import { colors } from '../lib/theme';

function useSystemCanvasColor() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas);
  }, []);
}

export default function RootLayout() {
  useSystemCanvasColor();
  const pathname = usePathname();
  const suppressLaunchPopupAd = shouldSuppressLaunchPopupAdForPath(pathname);
  const { entitlements: monetizationEntitlements, entitlementsReady } = useRemoveAdsEntitlements();

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account" />
        <Stack.Screen name="search" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {!suppressLaunchPopupAd && entitlementsReady ? (
        <LaunchPopupAd entitlements={monetizationEntitlements} />
      ) : null}
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
