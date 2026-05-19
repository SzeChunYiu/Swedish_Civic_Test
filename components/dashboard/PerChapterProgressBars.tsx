import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChapterProgressBar } from '../../lib/learning/dashboardStats';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { Chapter } from '../../types/content';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

type ChapterSortMode = 'chapter' | 'weakest';

export type PerChapterProgressBarsCopy = {
  accuracyLabel: string;
  chapterOrder: string;
  coverageLabel: string;
  emptyState: string;
  linkLabel: (chapterName: string) => string;
  sortAccessibilityLabel: (mode: string) => string;
  subtitle: string;
  title: string;
  weakestFirst: string;
};

type PerChapterProgressBarsProps = {
  bars: ChapterProgressBar[];
  chapters: Chapter[];
  copy: PerChapterProgressBarsCopy;
  language: AppLanguage;
};

function ratio(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function percent(value: number | null): number {
  return Math.round(ratio(value) * 100);
}

function chapterWeaknessScore(bar: ChapterProgressBar): number {
  const accuracyGap = bar.accuracy === null ? 1 : 1 - bar.accuracy;
  const coverageGap = 1 - bar.coverage;
  return accuracyGap * 0.7 + coverageGap * 0.3;
}

export function PerChapterProgressBars({
  bars,
  chapters,
  copy,
  language,
}: PerChapterProgressBarsProps) {
  const [sortMode, setSortMode] = useState<ChapterSortMode>('chapter');
  const chapterById = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters],
  );
  const visibleBars = useMemo(() => {
    if (sortMode === 'chapter') return bars;
    return [...bars].sort((a, b) => chapterWeaknessScore(b) - chapterWeaknessScore(a));
  }, [bars, sortMode]);
  const answeredChapters = bars.filter((bar) => bar.answers > 0).length;
  const accessibilityLabel = `${copy.title}: ${answeredChapters} / ${chapters.length}`;

  return (
    <Card accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <View style={styles.sortRow}>
        {(
          [
            ['chapter', copy.chapterOrder],
            ['weakest', copy.weakestFirst],
          ] as const
        ).map(([mode, label]) => {
          const selected = sortMode === mode;
          return (
            <Pressable
              key={mode}
              accessibilityLabel={copy.sortAccessibilityLabel(label)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={space[0.5]}
              onPress={() => setSortMode(mode)}
              style={({ pressed }) => [
                styles.sortButton,
                selected ? styles.sortButtonSelected : null,
                pressed ? styles.sortButtonPressed : null,
              ]}
            >
              <Text
                style={[styles.sortButtonText, selected ? styles.sortButtonTextSelected : null]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {answeredChapters === 0 ? (
        <Text style={styles.emptyState}>{copy.emptyState}</Text>
      ) : (
        <View style={styles.list}>
          {visibleBars.map((bar) => {
            const chapter = chapterById.get(bar.chapterId);
            const chapterName =
              language === 'en'
                ? (chapter?.nameEn ?? bar.chapterId)
                : (chapter?.nameSv ?? bar.chapterId);
            const accuracyPercent = percent(bar.accuracy);
            const coveragePercent = percent(bar.coverage);
            return (
              <Link
                key={bar.chapterId}
                accessibilityLabel={copy.linkLabel(chapterName)}
                accessibilityRole="link"
                href={`/chapter/${bar.chapterId}`}
                style={styles.chapterLink}
              >
                <View style={styles.chapterRow}>
                  <Text style={styles.chapterName}>{chapterName}</Text>
                  <View style={styles.progressPair}>
                    <View style={styles.progressLine}>
                      <Text style={styles.progressLabel}>
                        {copy.accuracyLabel}: {accuracyPercent}%
                      </Text>
                      <ProgressBar language={language} progress={ratio(bar.accuracy)} />
                    </View>
                    <View style={styles.progressLine}>
                      <Text style={styles.progressLabel}>
                        {copy.coverageLabel}: {coveragePercent}%
                      </Text>
                      <ProgressBar language={language} progress={ratio(bar.coverage)} />
                    </View>
                  </View>
                </View>
              </Link>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1.5],
  },
  header: {
    gap: space[0.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  sortButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  sortButtonSelected: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
  },
  sortButtonPressed: {
    backgroundColor: colors.surfaceWarm,
  },
  sortButtonText: {
    color: colors.textSecondary,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  sortButtonTextSelected: {
    color: colors.text,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  list: {
    gap: space[1],
  },
  chapterLink: {
    textDecorationLine: 'none',
  },
  chapterRow: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    minHeight: space[6],
    padding: space[1.5],
  },
  chapterName: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  progressPair: {
    gap: space[1],
  },
  progressLine: {
    gap: space[0.5],
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
});
