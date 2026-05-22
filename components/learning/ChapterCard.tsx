import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Chapter } from '../../types/content';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ChapterCardCopy = {
  accessibilityLabel: {
    chapter: (title: string) => string;
    description: (description: string) => string;
    secondaryName: (name: string) => string;
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
      secondaryName: (name) => `Engelskt namn: ${name}`,
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
      secondaryName: (name) => `Swedish name: ${name}`,
      status: (status) => `Status: ${status}`,
    },
    chapterUnavailable: 'Chapter unavailable',
    contentQueued: 'Content queued',
    practicedStatus: (completedCount, questionCount) =>
      `${completedCount}/${questionCount} practiced`,
  },
};

export function ChapterCard({
  accessibilityMode = 'summary',
  chapter,
  questionCount = chapter?.questionCount ?? 0,
  completedCount = 0,
  language = 'sv',
}: {
  accessibilityMode?: 'summary' | 'presentation';
  chapter?: Chapter;
  questionCount?: number;
  completedCount?: number;
  language?: AppLanguage;
}) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = chapterCardCopy[language];
  const progress = questionCount > 0 ? completedCount / questionCount : 0;
  const status =
    questionCount > 0 ? copy.practicedStatus(completedCount, questionCount) : copy.contentQueued;
  const title = chapter
    ? language === 'en'
      ? chapter.nameEn
      : chapter.nameSv
    : copy.chapterUnavailable;
  const secondaryName = chapter ? (language === 'en' ? chapter.nameSv : chapter.nameEn) : null;
  const description = chapter
    ? language === 'en'
      ? chapter.descriptionEn
      : chapter.descriptionSv
    : null;
  const chapterAccessibilityLabel = [
    copy.accessibilityLabel.chapter(title),
    secondaryName ? copy.accessibilityLabel.secondaryName(secondaryName) : null,
    copy.accessibilityLabel.status(status),
    description ? copy.accessibilityLabel.description(description) : null,
  ]
    .filter(Boolean)
    .join('. ');
  const shouldGroupForAccessibility = accessibilityMode === 'summary';
  const shouldHideNestedAccessibility = accessibilityMode === 'presentation';

  return (
    <Card
      accessibilityElementsHidden={shouldHideNestedAccessibility}
      accessibilityLabel={shouldGroupForAccessibility ? chapterAccessibilityLabel : undefined}
      elevated
      importantForAccessibility={shouldHideNestedAccessibility ? 'no-hide-descendants' : undefined}
      style={styles.card}
      themeColors={themeColors}
    >
      <View style={styles.headerRow}>
        <Badge themeColors={themeColors} tone={questionCount > 0 ? 'blue' : 'warm'}>
          {status}
        </Badge>
      </View>
      <Text style={styles.title}>{title}</Text>
      {secondaryName ? <Text style={styles.subtitle}>{secondaryName}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <ProgressBar language={language} progress={progress} />
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: space[1],
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.sectionTitle.fontWeight,
      lineHeight: typography.sectionTitle.lineHeight,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    description: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
  });
}
