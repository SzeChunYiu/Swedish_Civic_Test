import { useColorScheme } from 'react-native';

import { useAccessibilityStore } from '../lib/storage/accessibilityStore';
import { colorsForThemeMode, type ThemeColors } from '../lib/theme';

export function useResolvedThemeColors(themeColors?: ThemeColors): ThemeColors {
  const systemColorScheme = useColorScheme();
  const themeMode = useAccessibilityStore((state) => state.themeMode);

  return themeColors ?? colorsForThemeMode(themeMode, systemColorScheme);
}
