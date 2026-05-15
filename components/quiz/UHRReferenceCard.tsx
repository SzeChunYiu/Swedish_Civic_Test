import { Text } from 'react-native';
import type { UHRReference } from '../../types/content';
import { Card } from '../ui/Card';

export function UHRReferenceCard({ reference }: { reference?: UHRReference }) {
  const label = reference
    ? `${reference.chapter} · ${reference.section}`
    : 'UHR reference placeholder';
  return (
    <Card>
      <Text>{label}</Text>
    </Card>
  );
}
