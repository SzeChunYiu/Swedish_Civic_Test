import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, space, typography } from '../../lib/theme';

export function MetricCard({
  accessibilityLabel,
  label,
  value,
  helper,
  tone = 'warm',
}: {
  accessibilityLabel?: string;
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'warm' | 'blue';
}) {
  const metricAccessibilityLabel =
    accessibilityLabel ?? `${label}: ${value}${helper ? `. ${helper}` : ''}`;

  return (
    <View
      aria-label={metricAccessibilityLabel}
      accessible
      accessibilityLabel={metricAccessibilityLabel}
      style={[styles.card, tone === 'blue' ? styles.blueCard : null]}
    >
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: space[0.5],
    padding: space[2],
  },
  blueCard: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
    ...shadows.card,
  },
  value: {
    color: colors.text,
    fontSize: typography.heroMobile.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    lineHeight: typography.heroMobile.lineHeight,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  helper: {
    color: colors.textDisclaimer,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
});
