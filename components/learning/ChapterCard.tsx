import { StyleSheet, Text } from 'react-native';
import type { Chapter } from '../../types/content';
import { Card } from '../ui/Card';
import { colors, space } from '../../lib/theme';

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
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: space.hairline,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: space[1],
  },
  meta: {
    color: colors.badgeBlueText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: space[1.5],
  },
});
