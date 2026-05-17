import { StyleSheet, View } from 'react-native';
import type { ComponentProps, PropsWithChildren } from 'react';
import { colors, radius, shadows, space } from '../../lib/theme';

type CardProps = PropsWithChildren<ComponentProps<typeof View> & { elevated?: boolean }>;

export function Card({
  accessible,
  accessibilityLabel,
  accessibilityRole,
  children,
  style,
  elevated = false,
  ...viewProps
}: CardProps) {
  const groupedForAccessibility = accessible ?? Boolean(accessibilityLabel || accessibilityRole);

  return (
    <View
      accessible={groupedForAccessibility}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.card, elevated ? styles.elevated : null, style]}
      {...viewProps}
    >
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
  elevated: {
    ...shadows.card,
  },
});
