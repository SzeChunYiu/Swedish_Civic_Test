import { StyleSheet, View } from 'react-native';
import type { ComponentProps, PropsWithChildren } from 'react';
import { colors, radius, space } from '../../lib/theme';

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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[2],
  },
});
