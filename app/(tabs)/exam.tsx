import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { defaultMockExamConfig } from '../../data/mockExamConfig';
import { questions } from '../../data/questions';
import { formatExamTime, generateExam, scoreExam } from '../../lib/quiz/examGenerator';

export default function Screen() {
  const examQuestions = useMemo(
    () => generateExam(questions, { questionCount: defaultMockExamConfig.questionCount }),
    [],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    defaultMockExamConfig.durationMinutes * 60,
  );

  useEffect(() => {
    if (submitted || remainingSeconds <= 0) return undefined;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, submitted]);

  const result = submitted ? scoreExam(examQuestions, answers) : null;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === examQuestions.length && examQuestions.length > 0;

  if (result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Exam result</Text>
        <Text style={styles.subtitle}>
          Explanations and review are shown only after the exam is submitted.
        </Text>
        <QuestionDisclaimer />
        <View style={styles.resultCard}>
          <Text style={styles.metric}>{result.percent}%</Text>
          <Text style={styles.subtitle}>
            {result.correctCount}/{result.totalCount} correct
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Chapter breakdown</Text>
        {result.chapterBreakdown.map((chapter) => (
          <View key={chapter.chapterId} style={styles.breakdownRow}>
            <Text style={styles.breakdownChapter}>{chapter.chapterId}</Text>
            <Text style={styles.breakdownScore}>
              {chapter.correctCount}/{chapter.totalCount}
            </Text>
          </View>
        ))}

        <Pressable onPress={() => setSubmitted(false)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to answers</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mock exam</Text>
      <Text style={styles.subtitle}>
        Time left {formatExamTime(remainingSeconds)} · {examQuestions.length} UHR-based questions ·
        no ads during exam
      </Text>
      <QuestionDisclaimer />

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <Text style={styles.subtitle}>
          {answeredCount}/{examQuestions.length} answered
        </Text>
      </View>

      {examQuestions.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionMeta}>Question {index + 1}</Text>
          <Text style={styles.questionText}>{question.questionSv}</Text>
          <View style={styles.options}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() =>
                    setAnswers((current) => ({ ...current, [question.id]: option.id }))
                  }
                  style={[styles.option, isSelected ? styles.optionSelected : null]}
                >
                  <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                    {option.textSv}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        disabled={!canSubmit}
        onPress={() => setSubmitted(true)}
        style={[styles.primaryButton, !canSubmit ? styles.primaryButtonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>Submit exam</Text>
      </Pressable>
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
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    gap: 4,
    padding: 16,
  },
  questionCard: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 16,
  },
  questionMeta: {
    color: '#097fe8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  questionText: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  options: {
    gap: 8,
  },
  option: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  optionSelected: {
    backgroundColor: '#f2f9ff',
    borderColor: '#097fe8',
  },
  optionText: {
    color: 'rgba(0, 0, 0, 0.9)',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#097fe8',
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0075de',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#f6f5f4',
    borderRadius: 12,
    padding: 16,
  },
  metric: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 40,
    fontWeight: '700',
  },
  breakdownRow: {
    alignItems: 'center',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  breakdownChapter: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 15,
    fontWeight: '700',
  },
  breakdownScore: {
    color: '#615d59',
    fontSize: 15,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 15,
    fontWeight: '600',
  },
});
