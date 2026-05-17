import { StyleSheet, Text } from 'react-native';
import type { UHRReference } from '../../types/content';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function UHRReferenceCard({ reference }: { reference?: UHRReference }) {
  const label = reference
    ? `${reference.chapter} · ${reference.section}`
    : 'Source reference unavailable';
  const pageLabel = reference?.pageApprox ? `Approx. page ${reference.pageApprox}` : null;
  const referenceAccessibilityLabel = pageLabel
    ? `UHR reference: ${label}. ${pageLabel}`
    : `UHR reference: ${label}`;

  return (
    <Card accessibilityLabel={referenceAccessibilityLabel}>
      <Text accessibilityRole="header" style={styles.title}>
        UHR reference
      </Text>
      <Text style={styles.body}>{label}</Text>
      {pageLabel ? <Text style={styles.meta}>{pageLabel}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[1],
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.badge.fontSize,
    marginTop: space[0.5],
  },
});
