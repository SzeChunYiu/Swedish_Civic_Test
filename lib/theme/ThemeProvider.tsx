import { createContext, createElement, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useAccessibilityStore } from '../storage/accessibilityStore';
import {
  colors,
  colorsForThemeMode,
  resolveThemePreference,
  type ResolvedColorScheme,
  type ThemeColors,
  type ThemePreference,
} from './colors';

type ThemeContextValue = {
  colors: ThemeColors;
  preference: ThemePreference;
  resolvedColorScheme: ResolvedColorScheme;
};

const defaultThemeContext: ThemeContextValue = {
  colors,
  preference: 'system',
  resolvedColorScheme: 'light',
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const preference = useAccessibilityStore((state) => state.themeMode);
  const value = useMemo(
    () => ({
      colors: colorsForThemeMode(preference, systemColorScheme),
      preference,
      resolvedColorScheme: resolveThemePreference(preference, systemColorScheme),
    }),
    [preference, systemColorScheme],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useTheme().colors;
}
