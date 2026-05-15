import { StyleSheet, Text } from 'react-native';
import type { UHRReference } from '../../types/content';
import { Card } from '../ui/Card';

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
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  meta: {
    color: '#615d59',
    fontSize: 12,
    marginTop: 4,
  },
});
