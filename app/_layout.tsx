import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'react-native';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { FirstRunAboutTheTestModal } from '../components/onboarding/FirstRunAboutTheTestModal';
import { LanguagePicker } from '../components/ui/LanguagePicker';
import { shouldSuppressLaunchPopupAdForPath } from '../lib/monetization/ads';
import { useRemoveAdsEntitlements } from '../lib/monetization/useRemoveAdsEntitlements';
import { useAccessibilityStore } from '../lib/storage/accessibilityStore';
import { colorsForThemeMode, resolveThemePreference } from '../lib/theme';

function useSystemCanvasColor(canvasColor: string) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(canvasColor);
  }, [canvasColor]);
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const themeMode = useAccessibilityStore((state) => state.themeMode);
  const themeColors = colorsForThemeMode(themeMode, systemColorScheme);
  const resolvedColorScheme = resolveThemePreference(themeMode, systemColorScheme);

  useSystemCanvasColor(themeColors.canvas);
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
          headerStyle: { backgroundColor: themeColors.canvas },
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
      <StatusBar style={resolvedColorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
