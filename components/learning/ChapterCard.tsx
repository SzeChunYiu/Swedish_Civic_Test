import { StyleSheet, Text, View } from 'react-native';
import type { Chapter } from '../../types/content';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { colors, space, typography } from '../../lib/theme';

export function ChapterCard({
  chapter,
  questionCount = chapter?.questionCount ?? 0,
  completedCount = 0,
}: {
  chapter?: Chapter;
  questionCount?: number;
  completedCount?: number;
}) {
  const progress = questionCount > 0 ? completedCount / questionCount : 0;
  const status =
    questionCount > 0 ? `${completedCount}/${questionCount} practiced` : 'Content queued';

  return (
    <Card elevated style={styles.card}>
      <View style={styles.headerRow}>
        <Badge tone={questionCount > 0 ? 'blue' : 'warm'}>{status}</Badge>
      </View>
      <Text style={styles.title}>{chapter?.nameSv ?? 'Chapter placeholder'}</Text>
      {chapter?.nameEn ? <Text style={styles.subtitle}>{chapter.nameEn}</Text> : null}
      {chapter?.descriptionSv ? (
        <Text style={styles.description}>{chapter.descriptionSv}</Text>
      ) : null}
      <ProgressBar progress={progress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
