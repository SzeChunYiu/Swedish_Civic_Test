import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { FirstRunAboutTheTestModal } from '../components/onboarding/FirstRunAboutTheTestModal';
import { LanguagePicker } from '../components/ui/LanguagePicker';
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
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: '',
          headerBackVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.canvas },
          headerRight: () => <LanguagePicker />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="search" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="citizenship-requirements" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {!suppressLaunchPopupAd && entitlementsReady ? (
        <LaunchPopupAd entitlements={monetizationEntitlements} />
      ) : null}
      <FirstRunAboutTheTestModal />
      <StatusBar style="auto" />
    </>
  );
}
