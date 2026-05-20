import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';

/**
 * Defaults: renders one badge milestone as a grouped accessible row with
 * localized title, status, description, and progress hint. Locked rows are
 * muted but remain visible so first-time learners can see the next target.
 */
export interface BadgeRowProps {
  description: string;
  progressHint: string;
  statusLabel: string;
  style?: StyleProp<ViewStyle>;
  title: string;
  unlocked: boolean;
}

export function BadgeRow({
  description,
  progressHint,
  statusLabel,
  style,
  title,
  unlocked,
}: BadgeRowProps) {
  const accessibilityLabel = `${title}. ${statusLabel}. ${description}. ${progressHint}.`;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
      style={[styles.row, unlocked ? styles.unlocked : styles.locked, style]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, unlocked ? null : styles.lockedText]}>{title}</Text>
        <Text style={[styles.description, unlocked ? null : styles.lockedText]}>{description}</Text>
        <Text style={styles.progress}>{progressHint}</Text>
      </View>
      <Badge
        accessibilityLabel={statusLabel}
        style={styles.statusBadge}
        tone={unlocked ? 'green' : 'warm'}
      >
        {statusLabel}
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[1.25],
    justifyContent: 'space-between',
    minHeight: space[7],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  unlocked: {
    backgroundColor: colors.surface,
  },
  locked: {
    backgroundColor: colors.surfaceWarm,
  },
  copy: {
    flex: 1,
    gap: space[0.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyBold.lineHeight,
  },
  lockedText: {
    color: colors.textSecondary,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  progress: {
    color: colors.textMuted,
    fontSize: typography.disclaimer.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
  },
  statusBadge: {
    flexShrink: 0,
  },
});
