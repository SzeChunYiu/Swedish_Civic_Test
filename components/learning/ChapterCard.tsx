import { StyleSheet, Text, View } from 'react-native';
import type { Chapter } from '../../types/content';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { colors, space, typography } from '../../lib/theme';

type ChapterCardCopy = {
  accessibilityLabel: {
    chapter: (title: string) => string;
    description: (description: string) => string;
    englishName: (name: string) => string;
    status: (status: string) => string;
  };
  chapterUnavailable: string;
  contentQueued: string;
  practicedStatus: (completedCount: number, questionCount: number) => string;
};

const chapterCardCopy: Record<AppLanguage, ChapterCardCopy> = {
  sv: {
    accessibilityLabel: {
      chapter: (title) => `Kapitel: ${title}`,
      description: (description) => `Beskrivning: ${description}`,
      englishName: (name) => `Engelskt namn: ${name}`,
      status: (status) => `Status: ${status}`,
    },
    chapterUnavailable: 'Kapitel saknas',
    contentQueued: 'innehåll planerat',
    practicedStatus: (completedCount, questionCount) =>
      `${completedCount}/${questionCount} besvarade`,
  },
  en: {
    accessibilityLabel: {
      chapter: (title) => `Chapter: ${title}`,
      description: (description) => `Description: ${description}`,
      englishName: (name) => `English name: ${name}`,
      status: (status) => `Status: ${status}`,
    },
    chapterUnavailable: 'Chapter unavailable',
    contentQueued: 'Content queued',
    practicedStatus: (completedCount, questionCount) =>
      `${completedCount}/${questionCount} practiced`,
  },
};

export function ChapterCard({
  chapter,
  questionCount = chapter?.questionCount ?? 0,
  completedCount = 0,
  language = 'sv',
}: {
  chapter?: Chapter;
  questionCount?: number;
  completedCount?: number;
  language?: AppLanguage;
}) {
  const copy = chapterCardCopy[language];
  const progress = questionCount > 0 ? completedCount / questionCount : 0;
  const status =
    questionCount > 0 ? copy.practicedStatus(completedCount, questionCount) : copy.contentQueued;
  const title = chapter?.nameSv ?? copy.chapterUnavailable;
  const chapterAccessibilityLabel = [
    copy.accessibilityLabel.chapter(title),
    chapter?.nameEn ? copy.accessibilityLabel.englishName(chapter.nameEn) : null,
    copy.accessibilityLabel.status(status),
    chapter?.descriptionSv ? copy.accessibilityLabel.description(chapter.descriptionSv) : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Card accessibilityLabel={chapterAccessibilityLabel} elevated style={styles.card}>
      <View style={styles.headerRow}>
        <Badge tone={questionCount > 0 ? 'blue' : 'warm'}>{status}</Badge>
      </View>
      <Text style={styles.title}>{title}</Text>
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
