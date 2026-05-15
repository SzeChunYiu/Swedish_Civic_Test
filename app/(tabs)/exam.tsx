import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { defaultMockExamConfig } from '../../data/mockExamConfig';
import { questions } from '../../data/questions';
import { formatExamTime, generateExam, scoreExam } from '../../lib/quiz/examGenerator';
import { colors, radius, space } from '../../lib/theme';

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

        <Pressable
          accessibilityLabel="Back to exam answers"
          onPress={() => setSubmitted(false)}
          style={styles.secondaryButton}
        >
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
                  accessibilityLabel={`Select answer ${option.textSv} for question ${index + 1}`}
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
        accessibilityLabel="Submit mock exam"
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
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[0.5],
    padding: space[2],
  },
  questionCard: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  questionMeta: {
    color: colors.badgeBlueText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  questionText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  options: {
    gap: space[1],
  },
  option: {
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[1.5],
  },
  optionSelected: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  optionText: {
    color: colors.textSoft,
    fontSize: 15,
  },
  optionTextSelected: {
    color: colors.badgeBlueText,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    padding: space[2],
  },
  metric: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
  },
  breakdownRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space[1.5],
  },
  breakdownChapter: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  breakdownScore: {
    color: colors.textMuted,
    fontSize: 15,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
