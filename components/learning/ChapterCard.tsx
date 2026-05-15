import { StyleSheet, Text } from 'react-native';
import type { Chapter } from '../../types/content';
import { Card } from '../ui/Card';

export function ChapterCard({
  chapter,
  questionCount = chapter?.questionCount ?? 0,
}: {
  chapter?: Chapter;
  questionCount?: number;
}) {
  return (
    <Card>
      <Text style={styles.title}>{chapter?.nameSv ?? 'Chapter placeholder'}</Text>
      {chapter?.nameEn ? <Text style={styles.subtitle}>{chapter.nameEn}</Text> : null}
      {chapter?.descriptionSv ? (
        <Text style={styles.description}>{chapter.descriptionSv}</Text>
      ) : null}
      <Text style={styles.meta}>{questionCount} practice questions</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#615d59',
    fontSize: 14,
    marginTop: 2,
  },
  description: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  meta: {
    color: '#097fe8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
});
