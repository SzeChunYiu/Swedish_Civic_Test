import { useMemo } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChapterCard } from '../../components/learning/ChapterCard';
import { Flashcard } from '../../components/learning/Flashcard';
import { StudyArticleCard } from '../../components/learning/StudyArticleCard';
import { AdBanner } from '../../components/monetization/AdBanner';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { EBOOK_ARTICLE_COUNT } from '../../lib/content/ebookContent';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../../types/content';

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
  flashcardSectionSubtitle: string;
  flashcardSectionTitle: string;
  sectionSubtitle: string;
  sectionTitle: string;
  studyArticlesAccessibilityLabel: string;
  studyArticlesCta: string;
  studyArticlesEyebrow: string;
  studyArticlesMeta: (articleCount: number) => string;
  studyArticlesSubtitle: string;
  studyArticlesTitle: string;
  subtitle: string;
  title: string;
};

const learnRouteCopy: Record<AppLanguage, LearnRouteCopy> = {
  sv: {
    eyebrow: 'Studieväg',
    flashcardSectionSubtitle:
      'Tre källstödda kort från frågebanken. Läs frågan, säg svaret högt och jämför direkt.',
    flashcardSectionTitle: 'Snabba flashkort',
    sectionSubtitle: 'Studera med källnära kapitel och öva sedan på samma material.',
    sectionTitle: '13 samhällsområden',
    studyArticlesAccessibilityLabel:
      'Öppna studieartiklar. Korta offlineartiklar med källor och länk till kapitelövning.',
    studyArticlesCta: 'Öppna studieartiklar',
    studyArticlesEyebrow: 'Offlineguide',
    studyArticlesMeta: (articleCount) => `${articleCount} artiklar · svenska och engelska`,
    studyArticlesSubtitle:
      'Läs en kort artikel, kontrollera källtypen och gå direkt till övningen för samma område.',
    studyArticlesTitle: 'Studieartiklar med övningsväg',
    subtitle: 'Varje kapitel visar omfång och lokal progression så att du kan fokusera studierna.',
    title: 'Bläddra bland kapitel med tydliga nästa steg',
  },
  en: {
    eyebrow: 'Learning path',
    flashcardSectionSubtitle:
      'Three source-backed cards from the question bank. Read the prompt, answer aloud, then compare.',
    flashcardSectionTitle: 'Quick flashcards',
    sectionSubtitle: 'Study in source-aligned chapters, then practice from the same material.',
    sectionTitle: '13 civic areas',
    studyArticlesAccessibilityLabel:
      'Open study articles. Short offline articles with sources and a path back to chapter practice.',
    studyArticlesCta: 'Open study articles',
    studyArticlesEyebrow: 'Offline guide',
    studyArticlesMeta: (articleCount) => `${articleCount} articles · Swedish and English`,
    studyArticlesSubtitle:
      'Read a short article, check the provenance, then jump straight into practice for the same area.',
    studyArticlesTitle: 'Study articles with a practice path',
    subtitle:
      'Each chapter shows scope and local completion so you can focus study instead of guessing what to open next.',
    title: 'Browse chapters with a clear next step',
  },
};

const FLASHCARD_PREVIEW_LIMIT = 3;

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

type ChapterProgressCounts = {
  completedCount: number;
  questionCount: number;
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

function getFlashcardPrompt(question: PracticeQuestion, language: AppLanguage) {
  return language === 'en' ? question.questionEn : question.questionSv;
}

function getFlashcardAnswer(question: PracticeQuestion, language: AppLanguage) {
  const answer = question.options.find((option) => option.id === question.correctOptionId);

  if (!answer) {
    return language === 'en' ? question.explanationEn : question.explanationSv;
  }

  return language === 'en' ? answer.textEn : answer.textSv;
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
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const flashcardQuestions = questions.slice(0, FLASHCARD_PREVIEW_LIMIT);
  const chapterProgressById = useMemo(
    () => buildChapterProgressById(completedQuestionIds),
    [completedQuestionIds],
  );

  return (
    <ScreenShell eyebrow={routeCopy.eyebrow} title={routeCopy.title} subtitle={routeCopy.subtitle}>
      <SectionHeader
        title={routeCopy.flashcardSectionTitle}
        subtitle={routeCopy.flashcardSectionSubtitle}
      />
      <View style={styles.flashcardDeck}>
        {flashcardQuestions.map((question) => (
          <Flashcard
            key={question.id}
            front={getFlashcardPrompt(question, language)}
            back={getFlashcardAnswer(question, language)}
            language={language}
          />
        ))}
      </View>

      <Link
        accessibilityLabel={routeCopy.studyArticlesAccessibilityLabel}
        accessibilityRole="link"
        href="/ebook"
        style={styles.link}
      >
        <StudyArticleCard
          accessibilityMode="presentation"
          ctaLabel={routeCopy.studyArticlesCta}
          eyebrow={routeCopy.studyArticlesEyebrow}
          meta={routeCopy.studyArticlesMeta(EBOOK_ARTICLE_COUNT)}
          subtitle={routeCopy.studyArticlesSubtitle}
          title={routeCopy.studyArticlesTitle}
        />
      </Link>

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
                accessibilityMode="presentation"
                chapter={chapter}
                completedCount={completedCount}
                language={language}
                questionCount={questionCount}
              />
            </Link>
          );
        })}
      </View>

      <RemoveAdsPlacementCta placement="chapter_list_banner" />
      <AdBanner placement="chapter_list_banner" />
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    flashcardDeck: {
      gap: space[1.5],
    },
    list: {
      gap: space[1.5],
    },
    link: {
      borderRadius: radius.card,
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      textDecorationLine: 'none',
    },
  });
}
