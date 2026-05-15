import { Text } from 'react-native';
import type { Chapter } from '../../types/content';
import { Card } from '../ui/Card';

export function ChapterCard({ chapter }: { chapter?: Chapter }) {
  return (
    <Card>
      <Text>{chapter?.nameSv ?? 'Chapter placeholder'}</Text>
    </Card>
  );
}
