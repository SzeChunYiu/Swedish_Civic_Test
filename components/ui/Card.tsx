import type { PropsWithChildren } from 'react';
import { useId } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadows, space } from '../../lib/theme';

/**
 * Defaults: `elevated=false`; cards group for accessibility only when callers
 * pass `accessible`, `accessibilityLabel`, or `accessibilityRole`.
 */
export interface CardProps extends PropsWithChildren<Omit<ViewProps, 'style'>> {
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  accessible,
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  children,
  style,
  elevated = false,
  ...viewProps
}: CardProps) {
  const groupedForAccessibility = accessible ?? Boolean(accessibilityLabel || accessibilityRole);
  const resolvedAccessibilityRole =
    accessibilityRole ?? (groupedForAccessibility ? 'summary' : undefined);
  const hintId = useId();
  const cardAccessibilityHintId =
    accessibilityHint && Platform.OS === 'web'
      ? `card-hint-${hintId.replace(/:/g, '')}`
      : undefined;

  return (
    <View
      aria-describedby={cardAccessibilityHintId}
      aria-label={accessibilityLabel}
      accessible={groupedForAccessibility}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={resolvedAccessibilityRole}
      style={[styles.card, elevated ? styles.elevated : null, style]}
      {...viewProps}
    >
      {children}
      {cardAccessibilityHintId ? (
        <Text nativeID={cardAccessibilityHintId} style={styles.accessibilityHintText}>
          {accessibilityHint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    padding: space[2],
  },
  elevated: {
    ...shadows.card,
  },
  accessibilityHintText: {
    height: 1,
    left: -10000,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
});
