import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { LaunchPopupAd } from '../components/monetization/LaunchPopupAd';
import { colors } from '../lib/theme';

function useSystemCanvasColor() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas);
  }, []);
}

export default function RootLayout() {
  useSystemCanvasColor();

  return (
    <>
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Page not found' }} />
      </Stack>
      <LaunchPopupAd />
      <StatusBar backgroundColor={colors.canvas} style="dark" />
    </>
  );
}
