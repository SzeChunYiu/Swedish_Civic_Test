import { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { FirstRunAboutTheTestModal } from '../components/onboarding/FirstRunAboutTheTestModal';
import { LanguagePicker } from '../components/ui/LanguagePicker';
import { AuthProvider } from '../lib/auth/AuthContext';
import { shouldSuppressLaunchPopupAdForPath } from '../lib/monetization/ads';
import { useRemoveAdsEntitlements } from '../lib/monetization/useRemoveAdsEntitlements';
import {
  createExpoStudyReminderNotificationRoutingRuntime,
  registerStudyReminderNotificationResponseRouting,
} from '../lib/notifications/studyReminderRouting';
import { ThemeProvider, useTheme } from '../lib/theme/ThemeProvider';

function useSystemCanvasColor(canvasColor: string) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(canvasColor);
  }, [canvasColor]);
}

function useStudyReminderNotificationRouting() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    void createExpoStudyReminderNotificationRoutingRuntime().then((runtime) => {
      if (cancelled || !runtime) return;
      cleanup = registerStudyReminderNotificationResponseRouting(runtime, (route) => {
        router.push(route);
      });
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [router]);
}

function RootLayoutContent() {
  const { colors: themeColors, resolvedColorScheme } = useTheme();
  useSystemCanvasColor(themeColors.canvas);
  useStudyReminderNotificationRouting();
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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="account" />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="r/[code]" options={{ headerShown: false }} />
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

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
