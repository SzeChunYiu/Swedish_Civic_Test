import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useId, useMemo, type PropsWithChildren } from 'react';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'option' | 'success' | 'danger';
export interface ButtonProps extends PropsWithChildren<Omit<PressableProps, 'style'>> {
  style?: StyleProp<ViewStyle>;
  themeColors?: ThemeColors;
  variant?: ButtonVariant;
}

/**
 * Defaults: `variant="primary"`, `accessibilityRole="button"`, and
 * `hitSlop=space[0.5]` for a token-sized touch target.
 */
export function Button({
  accessibilityHint,
  accessibilityLabel,
  android_ripple,
  children,
  hitSlop,
  style,
  themeColors: providedThemeColors,
  accessibilityRole = 'button',
  accessibilityState,
  disabled,
  variant = 'primary',
  ...pressableProps
}: ButtonProps) {
  const fallbackThemeColors = useThemeColors();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const mergedAccessibilityState = {
    ...accessibilityState,
    ...(disabled == null ? {} : { disabled }),
  };
  const buttonAccessibilityLabel =
    accessibilityLabel ??
    (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);
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
      disabled={disabled}
      hitSlop={hitSlop ?? space[0.5]}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        pressed && !disabled && variant === 'primary' ? styles.primaryPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      {...pressableProps}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' ? styles.primaryLabel : styles.darkLabel,
          disabled ? styles.disabledLabel : null,
        ]}
      >
        {children}
      </Text>
      {buttonAccessibilityHintId ? (
        <Text nativeID={buttonAccessibilityHintId} style={styles.accessibilityHintText}>
          {accessibilityHint}
        </Text>
      ) : null}
    </Pressable>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      borderColor: themeColors.border,
      borderRadius: radius.button,
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1.25],
    },
    primary: {
      backgroundColor: themeColors.accent,
      borderColor: themeColors.accent,
    },
    primaryPressed: {
      backgroundColor: themeColors.accentActive,
      borderColor: themeColors.accentActive,
    },
    secondary: {
      backgroundColor: themeColors.surfaceMuted,
    },
    option: {
      alignItems: 'flex-start',
      backgroundColor: themeColors.surface,
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
    disabled: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: motion.pressedScale }],
    },
    label: {
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
    },
    accessibilityHintText: {
      height: 1,
      left: -10000,
      overflow: 'hidden',
      position: 'absolute',
      width: 1,
    },
    primaryLabel: {
      color: themeColors.surface,
    },
    darkLabel: {
      color: themeColors.text,
    },
    disabledLabel: {
      color: themeColors.textMuted,
    },
  });
}
