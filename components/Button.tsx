import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text as NativeText } from 'react-native';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const buttonLoadingCopy: Record<AppLanguage, string> = {
  sv: 'Laddar',
  en: 'Loading',
};

/**
 * Defaults: `variant="primary"`, `size="md"`, `loading=false`,
 * localized loading label from settings, `accessibilityRole="button"`, and a
 * token-sized `hitSlop`. Pass `accessibilityLabel` when the visible children
 * are not a concise spoken label.
 */
export interface ButtonProps extends PropsWithChildren<Omit<PressableProps, 'children' | 'style'>> {
  languageOverride?: AppLanguage;
  loading?: boolean;
  loadingLabel?: string;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
}

function getStringLabel(children: ButtonProps['children']) {
  return typeof children === 'string' || typeof children === 'number'
    ? String(children)
    : undefined;
}

function getSpinnerColor(themeColors: ThemeColors, variant: ButtonVariant, disabled: boolean) {
  if (disabled) {
    return themeColors.textMuted;
  }

  return variant === 'primary' ? themeColors.surface : themeColors.accent;
}

export function Button({
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  children,
  disabled = false,
  hitSlop,
  languageOverride,
  loading = false,
  loadingLabel,
  size = 'md',
  style,
  textStyle,
  variant = 'primary',
  ...pressableProps
}: ButtonProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const resolvedLoadingLabel = loadingLabel ?? buttonLoadingCopy[language];
  const isExplicitlyDisabled = disabled === true;
  const isPressDisabled = isExplicitlyDisabled || loading;
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? (loading ? resolvedLoadingLabel : getStringLabel(children));
  const resolvedAccessibilityState = {
    ...accessibilityState,
    disabled: isPressDisabled || accessibilityState?.disabled,
    busy: loading || accessibilityState?.busy,
  };

  return (
    <Pressable
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={resolvedAccessibilityState}
      disabled={isPressDisabled}
      hitSlop={hitSlop ?? space[1]}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !isPressDisabled ? styles.pressed : null,
        pressed && !isPressDisabled ? styles[`${variant}Pressed`] : null,
        isExplicitlyDisabled ? styles.disabled : null,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityElementsHidden
          color={getSpinnerColor(themeColors, variant, isExplicitlyDisabled)}
          importantForAccessibility="no"
          size={space[2]}
        />
      ) : null}
      <NativeText
        style={[
          styles.label,
          styles[`${variant}Label`],
          isExplicitlyDisabled ? styles.disabledLabel : null,
          textStyle,
        ]}
      >
        {children}
      </NativeText>
    </Pressable>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      borderRadius: radius.button,
      borderWidth: space.hairline,
      flexDirection: 'row',
      gap: space[1],
      justifyContent: 'center',
    },
    sm: {
      minHeight: space[6],
      paddingHorizontal: space[1.5],
      paddingVertical: space[0.75],
    },
    md: {
      minHeight: space[7],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
    },
    lg: {
      minHeight: space[8],
      paddingHorizontal: space[3],
      paddingVertical: space[1.5],
    },
    primary: {
      backgroundColor: themeColors.accent,
      borderColor: themeColors.accent,
    },
    secondary: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    ghost: {
      borderColor: themeColors.surfaceMuted,
    },
    pressed: {
      transform: [{ scale: motion.pressedScale }],
    },
    primaryPressed: {
      backgroundColor: themeColors.accentActive,
      borderColor: themeColors.accentActive,
    },
    secondaryPressed: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.focus,
    },
    ghostPressed: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
    },
    disabled: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
    },
    label: {
      ...typography.navButton,
    },
    primaryLabel: {
      color: themeColors.surface,
    },
    secondaryLabel: {
      color: themeColors.text,
    },
    ghostLabel: {
      color: themeColors.accent,
    },
    disabledLabel: {
      color: themeColors.textMuted,
    },
  });
}
