import { useMemo } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChapterCard } from '../../components/learning/ChapterCard';
import { AdBanner } from '../../components/monetization/AdBanner';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type ChapterLinkCopy = {
  contentQueued: string;
  progressLabel: (completedCount: number, questionCount: number) => string;
  accessibilityLabel: ({
    primaryName,
    secondaryName,
    progressLabel,
  }: {
    primaryName: string;
    secondaryName: string;
    progressLabel: string;
  }) => string;
};

type LearnRouteCopy = {
  eyebrow: string;
  sectionSubtitle: string;
  sectionTitle: string;
  subtitle: string;
  title: string;
};

type ChapterProgressCounts = {
  completedCount: number;
  questionCount: number;
};

const learnRouteCopy: Record<AppLanguage, LearnRouteCopy> = {
  sv: {
    eyebrow: 'Studieväg',
    sectionSubtitle: 'Studera med källnära kapitel och öva sedan på samma material.',
    sectionTitle: '13 samhällsområden',
    subtitle: 'Varje kapitel visar omfång och lokal progression så att du kan fokusera studierna.',
    title: 'Bläddra bland kapitel med tydliga nästa steg',
  },
  en: {
    eyebrow: 'Learning path',
    sectionSubtitle: 'Study in source-aligned chapters, then practice from the same material.',
    sectionTitle: '13 civic areas',
    subtitle:
      'Each chapter shows scope and local completion so you can focus study instead of guessing what to open next.',
    title: 'Browse chapters with a clear next step',
  },
};

const chapterLinkCopy: Record<AppLanguage, ChapterLinkCopy> = {
  sv: {
    contentQueued: 'innehåll planerat',
    progressLabel: (completedCount, questionCount) =>
      `${completedCount} av ${questionCount} frågor besvarade`,
    accessibilityLabel: ({ primaryName, secondaryName, progressLabel }) =>
      `Öppna kapitel ${primaryName}. Engelskt namn: ${secondaryName}. Framsteg: ${progressLabel}.`,
  },
  en: {
    contentQueued: 'content queued',
    progressLabel: (completedCount, questionCount) =>
      `${completedCount} of ${questionCount} questions practiced`,
    accessibilityLabel: ({ primaryName, secondaryName, progressLabel }) =>
      `Open chapter ${primaryName}. Swedish name: ${secondaryName}. Progress: ${progressLabel}.`,
  },
};

function buildChapterProgressById(completedQuestionIds: readonly string[]) {
  const completed = new Set(completedQuestionIds);
  const progressById = Object.fromEntries(
    chapters.map((chapter) => [
      chapter.id,
      {
        completedCount: 0,
        questionCount: 0,
      },
    ]),
  ) as Record<string, ChapterProgressCounts>;

  for (const question of questions) {
    const progress = progressById[question.chapterId];
    if (!progress) continue;

    progress.questionCount += 1;
    if (completed.has(question.id)) {
      progress.completedCount += 1;
    }
  }

  return progressById;
}

function getChapterLinkAccessibilityLabel({
  nameSv,
  nameEn,
  language,
  completedCount,
  questionCount,
  copy,
}: {
  nameSv: string;
  nameEn: string;
  language: AppLanguage;
  completedCount: number;
  questionCount: number;
  copy: ChapterLinkCopy;
}) {
  const progressLabel =
    questionCount > 0 ? copy.progressLabel(completedCount, questionCount) : copy.contentQueued;
  const primaryName = language === 'en' ? nameEn : nameSv;
  const secondaryName = language === 'en' ? nameSv : nameEn;

  return copy.accessibilityLabel({ primaryName, secondaryName, progressLabel });
}

export default function Screen() {
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const language = useSettingsStore((state) => state.language);
  const routeCopy = learnRouteCopy[language];
  const copy = chapterLinkCopy[language];
  const chapterProgressById = useMemo(
    () => buildChapterProgressById(completedQuestionIds),
    [completedQuestionIds],
  );

  return (
    <ScreenShell eyebrow={routeCopy.eyebrow} title={routeCopy.title} subtitle={routeCopy.subtitle}>
      <SectionHeader title={routeCopy.sectionTitle} subtitle={routeCopy.sectionSubtitle} />
      <View style={styles.list}>
        {chapters.map((chapter) => {
          const { completedCount, questionCount } = chapterProgressById[chapter.id] ?? {
            completedCount: 0,
            questionCount: 0,
          };
          return (
            <Link
              key={chapter.id}
              accessibilityLabel={getChapterLinkAccessibilityLabel({
                nameSv: chapter.nameSv,
                nameEn: chapter.nameEn,
                language,
                completedCount,
                questionCount,
                copy,
              })}
              accessibilityRole="link"
              href={`/chapter/${chapter.id}`}
              style={styles.link}
            >
              <ChapterCard
                chapter={chapter}
                completedCount={completedCount}
                language={language}
                questionCount={questionCount}
              />
            </Link>
          );
        })}
      </View>

      <AdBanner placement="chapter_list_banner" />
      <RemoveAdsPlacementCta placement="chapter_list_banner" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space[1.5],
  },
  link: {
    borderRadius: radius.card,
    color: colors.text,
    fontSize: typography.body.fontSize,
    textDecorationLine: 'none',
  },
});
