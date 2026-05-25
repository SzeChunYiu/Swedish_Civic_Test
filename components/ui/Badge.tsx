import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { radius, space, typography } from '../../lib/theme';
import type { ThemeColors } from '../../lib/theme';
import { useResolvedThemeColors } from '../useResolvedThemeColors';

type BadgeTone = 'blue' | 'green' | 'orange' | 'warm';
export interface BadgeProps extends PropsWithChildren {
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
  themeColors?: ThemeColors;
  tone?: BadgeTone;
}

export function Badge({
  accessibilityLabel,
  children,
  style,
  themeColors,
  tone = 'blue',
}: BadgeProps) {
  const resolvedThemeColors = useResolvedThemeColors(themeColors);
  const styles = useMemo(() => createStyles(resolvedThemeColors), [resolvedThemeColors]);
  const badgeAccessibilityLabel =
    accessibilityLabel ?? getPrimitiveChildrenAccessibilityLabel(children);

  return (
    <Text
      aria-label={badgeAccessibilityLabel}
      accessibilityLabel={badgeAccessibilityLabel}
      style={[styles.badge, styles[tone], style]}
    >
      {children}
    </Text>
  );
}

function getPrimitiveChildrenAccessibilityLabel(children: ReactNode): string | undefined {
  const labelParts: string[] = [];

  function collectLabelPart(child: ReactNode): void {
    if (typeof child === 'string' || typeof child === 'number') {
      labelParts.push(String(child));
      return;
    }

    if (Array.isArray(child)) {
      child.forEach(collectLabelPart);
    }
  }

  collectLabelPart(children);

  const label = labelParts.join('').replace(/\s+/g, ' ').trim();
  return label.length > 0 ? label : undefined;
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      lineHeight: typography.badge.lineHeight,
      overflow: 'hidden',
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.5],
      textTransform: 'uppercase',
    },
    blue: {
      backgroundColor: themeColors.badgeBlueBg,
      color: themeColors.badgeBlueText,
    },
    green: {
      backgroundColor: themeColors.successSoft,
      color: themeColors.success,
    },
    orange: {
      backgroundColor: themeColors.warningSoft,
      color: themeColors.warning,
    },
    warm: {
      backgroundColor: themeColors.surfaceWarm,
      color: themeColors.textMuted,
    },
  });
}
