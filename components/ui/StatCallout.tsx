import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type Tone = 'default' | 'accent' | 'success' | 'warning';

type StatCalloutProps = {
  value: string | number;
  label: string;
  tone?: Tone;
};

export function StatCallout({ value, label, tone = 'default' }: StatCalloutProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const toneStyles = useMemo(() => createToneStyles(themeColors), [themeColors]);
  const t = toneStyles[tone];
  return (
    <View style={[styles.card, { backgroundColor: t.background, borderColor: t.borderColor }]}>
      <Text style={[styles.value, { color: t.valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: t.labelColor }]}>{label}</Text>
    </View>
  );
}

function createToneStyles(
  themeColors: ThemeColors,
): Record<
  Tone,
  { background: string; valueColor: string; labelColor: string; borderColor: string }
> {
  return {
    default: {
      background: themeColors.surface,
      valueColor: themeColors.text,
      labelColor: themeColors.textMuted,
      borderColor: themeColors.border,
    },
    accent: {
      background: themeColors.badgeBlueBg,
      valueColor: themeColors.badgeBlueText,
      labelColor: themeColors.badgeBlueText,
      borderColor: themeColors.focusSoft,
    },
    success: {
      background: themeColors.successSoft,
      valueColor: themeColors.success,
      labelColor: themeColors.success,
      borderColor: themeColors.success,
    },
    warning: {
      background: themeColors.warningSoft,
      valueColor: themeColors.warning,
      labelColor: themeColors.warning,
      borderColor: themeColors.warning,
    },
  };
}

function createStyles(_themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flex: 1,
      gap: space[0.5],
      padding: space[1.5],
    },
    value: {
      fontFamily: typography.subHeading.fontFamily,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.subHeading.fontWeight,
      letterSpacing: typography.subHeading.letterSpacing,
      lineHeight: typography.subHeading.lineHeight,
    },
    label: {
      fontFamily: typography.badge.fontFamily,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      lineHeight: typography.badge.lineHeight,
      textTransform: 'uppercase',
    },
  });
}
