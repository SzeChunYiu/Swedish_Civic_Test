import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';

/**
 * Defaults: renders a non-pressable badge milestone row with a grouped
 * accessibility summary derived from the localized title and description.
 */
export interface BadgeRowProps {
  accessibilityLabel?: string;
  description: string;
  style?: StyleProp<ViewStyle>;
  title: string;
}

export function BadgeRow({ accessibilityLabel, description, style, title }: BadgeRowProps) {
  const badgeAccessibilityLabel = accessibilityLabel ?? `${title}. ${description}`;

  return (
    <View
      accessible
      accessibilityLabel={badgeAccessibilityLabel}
      accessibilityRole="summary"
      style={[styles.row, style]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    gap: space[0.5],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  title: {
    color: colors.text,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
    lineHeight: typography.bodySemibold.lineHeight,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.captionLight.fontFamily,
    fontSize: typography.captionLight.fontSize,
    fontWeight: typography.captionLight.fontWeight,
    lineHeight: typography.captionLight.lineHeight,
  },
});
