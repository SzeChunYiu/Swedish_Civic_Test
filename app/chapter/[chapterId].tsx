import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const chapter = chapters.find((item) => item.id === chapterId);
  const chapterQuestions = questions.filter((question) => question.chapterId === chapterId);

  if (!chapter) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Chapter not found</Text>
        <Link href="/learn" style={styles.link}>
          Back to Learn
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/learn" style={styles.link}>
        ← Back to Learn
      </Link>
      <Text style={styles.title}>{chapter.nameSv}</Text>
      <Text style={styles.subtitle}>{chapter.nameEn}</Text>
      <Text style={styles.description}>{chapter.descriptionSv}</Text>
      <QuestionDisclaimer />

      <Text style={styles.sectionTitle}>Practice questions ({chapterQuestions.length})</Text>
      <View style={styles.list}>
        {chapterQuestions.length > 0 ? (
          chapterQuestions.map((question) => (
            <View key={question.id} style={styles.questionBlock}>
              <QuestionCard question={question} />
              <UHRReferenceCard reference={question.uhrReference} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Questions for this chapter are not added yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 24,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
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
  description: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  list: {
    gap: 16,
  },
  questionBlock: {
    gap: 8,
  },
  empty: {
    color: '#615d59',
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    color: '#0075de',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'none',
  },
});
