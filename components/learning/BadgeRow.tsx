import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
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
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
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
        themeColors={themeColors}
        tone={unlocked ? 'green' : 'warm'}
      >
        {statusLabel}
      </Badge>
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    row: {
      alignItems: 'flex-start',
      borderColor: themeColors.border,
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
      backgroundColor: themeColors.surface,
    },
    locked: {
      backgroundColor: themeColors.surfaceWarm,
    },
    copy: {
      flex: 1,
      gap: space[0.5],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.bodyBold.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.bodyBold.lineHeight,
    },
    lockedText: {
      color: themeColors.textSecondary,
    },
    description: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    progress: {
      color: themeColors.textMuted,
      fontSize: typography.disclaimer.fontSize,
      lineHeight: typography.disclaimer.lineHeight,
    },
    statusBadge: {
      flexShrink: 0,
    },
  });
}
