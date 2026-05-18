import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';

type Tone = 'default' | 'accent' | 'success' | 'warning';

type StatCalloutProps = {
  value: string | number;
  label: string;
  tone?: Tone;
};

const toneStyles: Record<
  Tone,
  { background: string; valueColor: string; labelColor: string; borderColor: string }
> = {
  default: {
    background: colors.surface,
    valueColor: colors.text,
    labelColor: colors.textMuted,
    borderColor: colors.border,
  },
  accent: {
    background: colors.badgeBlueBg,
    valueColor: colors.badgeBlueText,
    labelColor: colors.badgeBlueText,
    borderColor: colors.focusSoft,
  },
  success: {
    background: colors.successSoft,
    valueColor: colors.success,
    labelColor: colors.success,
    borderColor: colors.success,
  },
  warning: {
    background: colors.warningSoft,
    valueColor: colors.warning,
    labelColor: colors.warning,
    borderColor: colors.warning,
  },
};

export function StatCallout({ value, label, tone = 'default' }: StatCalloutProps) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.card, { backgroundColor: t.background, borderColor: t.borderColor }]}>
      <Text style={[styles.value, { color: t.valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: t.labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
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
