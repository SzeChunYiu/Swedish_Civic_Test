import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChapterCard } from '../../components/learning/ChapterCard';
import { AdBanner } from '../../components/monetization/AdBanner';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { colors, space } from '../../lib/theme';

function questionCountForChapter(chapterId: string) {
  return questions.filter((question) => question.chapterId === chapterId).length;
}

export default function Screen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learn</Text>
      <Text style={styles.subtitle}>Choose a chapter and study with Swedish/English support.</Text>

      <View style={styles.list}>
        {chapters.map((chapter) => (
          <Link key={chapter.id} href={`/chapter/${chapter.id}`} style={styles.link}>
            <ChapterCard chapter={chapter} questionCount={questionCountForChapter(chapter.id)} />
          </Link>
        ))}
      </View>

      <AdBanner placement="chapter_list_banner" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2],
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    gap: space[1.5],
  },
  link: {
    textDecorationLine: 'none',
  },
});
