import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { useRemoveAdsEntitlements } from '../lib/monetization/useRemoveAdsEntitlements';

export default function RootLayout() {
  const pathname = usePathname();
  const isExamRoute = pathname === '/exam' || pathname.startsWith('/exam/');
  const { entitlements: monetizationEntitlements, entitlementsReady } = useRemoveAdsEntitlements();

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {!isExamRoute && entitlementsReady ? (
        <LaunchPopupAd entitlements={monetizationEntitlements} />
      ) : null}
      <StatusBar style="auto" />
    </>
  );
}
