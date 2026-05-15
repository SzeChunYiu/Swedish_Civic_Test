import { StyleSheet, View } from 'react-native';
import type { ComponentProps, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<ComponentProps<typeof View>>;

export function Card({ children, style, ...viewProps }: CardProps) {
  return (
    <View style={[styles.card, style]} {...viewProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
});
