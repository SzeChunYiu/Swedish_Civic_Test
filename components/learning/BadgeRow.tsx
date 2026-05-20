import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';

/**
 * Defaults: locked rows use the warm muted style, unlocked rows use the success
 * status badge, and the whole row exposes a single summary label for screen
 * readers. Pass localized strings for every visible field.
 */
export interface BadgeRowProps {
  title: string;
  description: string;
  progressHint: string;
  statusLabel: string;
  unlocked?: boolean;
  accessibilityLabel?: string;
}

export function BadgeRow({
  title,
  description,
  progressHint,
  statusLabel,
  unlocked = false,
  accessibilityLabel,
}: BadgeRowProps) {
  const rowAccessibilityLabel =
    accessibilityLabel ?? `${title}. ${statusLabel}. ${description}. ${progressHint}`;

  return (
    <View
      accessible
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityRole="summary"
      style={[styles.row, unlocked ? styles.unlockedRow : styles.lockedRow]}
    >
      <View style={styles.textStack}>
        <Text style={[styles.title, unlocked ? null : styles.lockedText]}>{title}</Text>
        <Text style={[styles.description, unlocked ? null : styles.lockedText]}>{description}</Text>
        <Text style={styles.progress}>{progressHint}</Text>
      </View>
      <Badge tone={unlocked ? 'green' : 'warm'} accessibilityLabel={statusLabel}>
        {statusLabel}
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[1.5],
    justifyContent: 'space-between',
    minHeight: space[8],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  unlockedRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  lockedRow: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  textStack: {
    flex: 1,
    gap: space[0.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
    lineHeight: typography.bodySemibold.lineHeight,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.captionLight.fontSize,
    fontWeight: typography.captionLight.fontWeight,
    lineHeight: typography.captionLight.lineHeight,
  },
  progress: {
    color: colors.textMuted,
    fontSize: typography.micro.fontSize,
    fontWeight: typography.micro.fontWeight,
    lineHeight: typography.micro.lineHeight,
  },
  lockedText: {
    color: colors.textMuted,
  },
});
