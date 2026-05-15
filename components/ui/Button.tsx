import { Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }>;

export function Button({ children, style, ...pressableProps }: ButtonProps) {
  return (
    <Pressable style={[styles.button, style]} {...pressableProps}>
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#0075de',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
