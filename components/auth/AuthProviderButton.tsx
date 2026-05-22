import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type AuthProviderButtonProps = {
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  testID?: string;
};

export function AuthProviderButton({
  disabled = false,
  icon,
  label,
  onPress,
  testID,
}: AuthProviderButtonProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={space[1]}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.button,
      borderWidth: space.hairline,
      flexDirection: 'row',
      gap: space[1],
      justifyContent: 'center',
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1.25],
    },
    disabled: {
      opacity: 0.55,
    },
    icon: {
      alignItems: 'center',
      height: space[3],
      justifyContent: 'center',
      width: space[3],
    },
    pressed: {
      borderColor: themeColors.focus,
    },
    text: {
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
      textAlign: 'center',
    },
  });
}
