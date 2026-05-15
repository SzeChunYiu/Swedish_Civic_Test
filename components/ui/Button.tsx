import { Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';
import { colors, radius, space, typography } from '../../lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'option' | 'success' | 'danger';
type ButtonProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; variant?: ButtonVariant }
>;

export function Button({
  children,
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

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={mergedAccessibilityState}
      disabled={disabled}
      style={[styles.button, styles[variant], disabled ? styles.disabled : null, style]}
      {...pressableProps}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.darkLabel]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
  label: {
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  primaryLabel: {
    color: colors.surface,
  },
  darkLabel: {
    color: colors.text,
  },
});
