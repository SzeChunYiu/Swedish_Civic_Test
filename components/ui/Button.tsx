import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useId, type PropsWithChildren } from 'react';
import { colors, radius, space, typography } from '../../lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'option' | 'success' | 'danger';
type ButtonProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; variant?: ButtonVariant }
>;

export function Button({
  accessibilityHint,
  accessibilityLabel,
  android_ripple,
  children,
  hitSlop,
  style,
  accessibilityRole = 'button',
  accessibilityState,
  disabled,
  variant = 'primary',
  ...pressableProps
}: ButtonProps) {
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
      android_ripple={android_ripple ?? { color: colors.focusSoft, borderless: false }}
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
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.darkLabel]}>
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

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  primaryPressed: {
    backgroundColor: colors.accentActive,
    borderColor: colors.accentActive,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  option: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.small,
    paddingVertical: space[1.5],
  },
  success: {
    alignItems: 'flex-start',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.small,
    paddingVertical: space[1.5],
  },
  danger: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.small,
    paddingVertical: space[1.5],
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.86,
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
    color: colors.surface,
  },
  darkLabel: {
    color: colors.text,
  },
});
