import { StyleSheet, Text } from 'react-native';
import type { UHRReference } from '../../types/content';
import { Card } from '../ui/Card';
import { colors, space } from '../../lib/theme';

export function UHRReferenceCard({ reference }: { reference?: UHRReference }) {
  const label = reference
    ? `${reference.chapter} · ${reference.section}`
    : 'UHR reference placeholder';
  const pageLabel = reference?.pageApprox ? `Approx. page ${reference.pageApprox}` : null;

  return (
    <Card>
      <Text style={styles.title}>UHR reference</Text>
      <Text style={styles.body}>{label}</Text>
      {pageLabel ? <Text style={styles.meta}>{pageLabel}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: space[1],
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: space[0.5],
  },
});
