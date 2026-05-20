import { useEffect, useMemo } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'react-native';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { FirstRunAboutTheTestModal } from '../components/onboarding/FirstRunAboutTheTestModal';
import { LanguagePicker } from '../components/ui/LanguagePicker';
import { shouldSuppressLaunchPopupAdForPath } from '../lib/monetization/ads';
import { useRemoveAdsEntitlements } from '../lib/monetization/useRemoveAdsEntitlements';
import { fontScaleFor, useAccessibilityStore } from '../lib/storage/accessibilityStore';
import {
  colorsForThemeMode,
  fontFamilyForAccessibility,
  resolveThemePreference,
  scaleTypographyValue,
  typography,
} from '../lib/theme';

function useSystemCanvasColor(canvasColor: string) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(canvasColor);
  }, [canvasColor]);
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const themeMode = useAccessibilityStore((state) => state.themeMode);
  const easyReadFont = useAccessibilityStore((state) => state.easyReadFont);
  const fontSizeStep = useAccessibilityStore((state) => state.fontSizeStep);
  const themeColors = colorsForThemeMode(themeMode, systemColorScheme);
  const resolvedColorScheme = resolveThemePreference(themeMode, systemColorScheme);
  const fontScale = fontScaleFor(fontSizeStep);
  const headerTitleStyle = useMemo(
    () => ({
      color: themeColors.text,
      fontFamily: fontFamilyForAccessibility(easyReadFont),
      fontSize: scaleTypographyValue(typography.navButton.fontSize, fontScale),
      lineHeight: scaleTypographyValue(typography.navButton.lineHeight, fontScale),
    }),
    [easyReadFont, fontScale, themeColors.text],
  );

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
          headerTitleStyle,
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
