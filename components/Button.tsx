import type { PropsWithChildren } from 'react';
import { useId, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text as NativeText,
} from 'react-native';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useReducedMotion } from '../lib/motion/useReducedMotion';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'option' | 'success' | 'danger';
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
  themeColors?: ThemeColors;
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
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  android_ripple,
  children,
  disabled = false,
  hitSlop,
  languageOverride,
  loading = false,
  loadingLabel,
  size = 'md',
  style,
  textStyle,
  themeColors: providedThemeColors,
  variant = 'primary',
  ...pressableProps
}: ButtonProps) {
  const fallbackThemeColors = useThemeColors();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const resolvedLoadingLabel = loadingLabel ?? buttonLoadingCopy[language];
  const isExplicitlyDisabled = disabled === true;
  const isPressDisabled = isExplicitlyDisabled || loading;
  const buttonAccessibilityLabel =
    accessibilityLabel ?? (loading ? resolvedLoadingLabel : getStringLabel(children));
  const mergedAccessibilityState = {
    ...accessibilityState,
    disabled: isPressDisabled || accessibilityState?.disabled,
    busy: loading || accessibilityState?.busy,
  };
  const hintId = useId();
  const buttonAccessibilityHintId =
    accessibilityHint && Platform.OS === 'web'
      ? `button-hint-${hintId.replace(/:/g, '')}`
      : undefined;

  return (
    <Pressable
      aria-busy={mergedAccessibilityState.busy === true}
      aria-checked={mergedAccessibilityState.checked}
      aria-describedby={buttonAccessibilityHintId}
      aria-disabled={mergedAccessibilityState.disabled === true}
      aria-expanded={mergedAccessibilityState.expanded}
      aria-label={buttonAccessibilityLabel}
      aria-selected={mergedAccessibilityState.selected}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={buttonAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={mergedAccessibilityState}
      android_ripple={android_ripple ?? { color: themeColors.focusSoft, borderless: false }}
      disabled={isPressDisabled}
      hitSlop={hitSlop ?? space[0.5]}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !isPressDisabled ? styles.pressed : null,
        pressed && !isPressDisabled && !reduceMotion ? styles.pressedMotion : null,
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
      {buttonAccessibilityHintId ? (
        <NativeText nativeID={buttonAccessibilityHintId} style={styles.accessibilityHintText}>
          {accessibilityHint}
        </NativeText>
      ) : null}
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
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
    },
    ghost: {
      borderColor: themeColors.surfaceMuted,
    },
    option: {
      alignItems: 'flex-start',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.small,
      paddingVertical: space[1.5],
    },
    success: {
      alignItems: 'flex-start',
      backgroundColor: themeColors.successSoft,
      borderColor: themeColors.success,
      borderRadius: radius.small,
      paddingVertical: space[1.5],
    },
    danger: {
      alignItems: 'flex-start',
      backgroundColor: themeColors.warningSoft,
      borderColor: themeColors.warning,
      borderRadius: radius.small,
      paddingVertical: space[1.5],
    },
    pressed: {
      opacity: 0.86,
    },
    pressedMotion: {
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
    optionPressed: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.focus,
    },
    successPressed: {
      backgroundColor: themeColors.successSoft,
      borderColor: themeColors.success,
    },
    dangerPressed: {
      backgroundColor: themeColors.warningSoft,
      borderColor: themeColors.warning,
    },
    disabled: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
    },
    label: {
      ...typography.navButton,
    },
    accessibilityHintText: {
      height: space.divider,
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      width: space.divider,
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
    optionLabel: {
      color: themeColors.text,
    },
    successLabel: {
      color: themeColors.text,
    },
    dangerLabel: {
      color: themeColors.text,
    },
    disabledLabel: {
      color: themeColors.textMuted,
    },
  });
}
