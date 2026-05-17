import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChapterCard } from '../../components/learning/ChapterCard';
import { AdBanner } from '../../components/monetization/AdBanner';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { useProgressStore } from '../../lib/storage/progressStore';
import { colors, radius, space, typography } from '../../lib/theme';

function questionCountForChapter(chapterId: string) {
  return questions.filter((question) => question.chapterId === chapterId).length;
}

function completedCountForChapter(chapterId: string, completedQuestionIds: string[]) {
  const completed = new Set(completedQuestionIds);
  return questions.filter(
    (question) => question.chapterId === chapterId && completed.has(question.id),
  ).length;
}

function getChapterLinkAccessibilityLabel({
  nameSv,
  nameEn,
  completedCount,
  questionCount,
}: {
  nameSv: string;
  nameEn: string;
  completedCount: number;
  questionCount: number;
}) {
  const progressLabel =
    questionCount > 0
      ? `${completedCount} of ${questionCount} questions practiced`
      : 'content queued';

  return `Open chapter ${nameSv}. English name: ${nameEn}. Progress: ${progressLabel}.`;
}

export default function Screen() {
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);

  return (
    <ScreenShell
      eyebrow="Learning path"
      title="Browse chapters with a clear next step"
      subtitle="Each chapter shows scope and local completion so you can focus study instead of guessing what to open next."
    >
      <SectionHeader
        title="13 civic areas"
        subtitle="Study in source-aligned chapters, then practice from the same material."
      />
      <View style={styles.list}>
        {chapters.map((chapter) => {
          const questionCount = questionCountForChapter(chapter.id);
          const completedCount = completedCountForChapter(chapter.id, completedQuestionIds);
          return (
            <Link
              key={chapter.id}
              accessibilityLabel={getChapterLinkAccessibilityLabel({
                nameSv: chapter.nameSv,
                nameEn: chapter.nameEn,
                completedCount,
                questionCount,
              })}
              accessibilityRole="link"
              href={`/chapter/${chapter.id}`}
              style={styles.link}
            >
              <ChapterCard
                chapter={chapter}
                completedCount={completedCount}
                questionCount={questionCount}
              />
            </Link>
          );
        })}
      </View>

      <AdBanner placement="chapter_list_banner" />
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
