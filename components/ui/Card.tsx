import type { ComponentProps, PropsWithChildren } from 'react';
import { useId, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { radius, shadows, space, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

export interface CardProps extends PropsWithChildren<ComponentProps<typeof View>> {
  elevated?: boolean;
  themeColors?: ThemeColors;
}

export function Card({
  accessible,
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  children,
  style,
  elevated = false,
  themeColors: providedThemeColors,
  ...viewProps
}: CardProps) {
  const fallbackThemeColors = useThemeColors();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
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
}
