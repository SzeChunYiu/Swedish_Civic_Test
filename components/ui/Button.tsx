import { Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';
import { colors, radius, space, typography } from '../../lib/theme';

type ButtonProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }
>;

export function Button({
  children,
  style,
  accessibilityRole = 'button',
  accessibilityState,
  disabled,
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
      style={[styles.button, style]}
      {...pressableProps}
    >
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  label: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
