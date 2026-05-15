import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChapterCard } from '../../components/learning/ChapterCard';
import { AdBanner } from '../../components/monetization/AdBanner';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';

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
    backgroundColor: '#ffffff',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 24,
  },
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  subtitle: {
    color: '#615d59',
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    gap: 12,
  },
  link: {
    textDecorationLine: 'none',
  },
});
