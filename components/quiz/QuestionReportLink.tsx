import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { PracticeQuestion } from '../../types/content';
import { getQuestionSourceCitation } from '../../lib/quiz/questionText';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { space } from '../../lib/theme';
import { Button } from '../Button';

type QuestionReportScreen = 'chapter' | 'exam' | 'practice' | 'quiz';

type QuestionReportLinkCopy = {
  accessibilityLabel: (questionId: string) => string;
  label: string;
};

const questionReportLinkCopy: Record<AppLanguage, QuestionReportLinkCopy> = {
  sv: {
    accessibilityLabel: (questionId) => `Rapportera frågan ${questionId}`,
    label: 'Rapportera den här frågan',
  },
  en: {
    accessibilityLabel: (questionId) => `Report question ${questionId}`,
    label: 'Report this question',
  },
};

/**
 * Defaults: localized 48px link target to the Support route, with question id,
 * source citation, screen, active app language, and selected answer when the
 * caller has a completed answer state.
 */
export interface QuestionReportLinkProps {
  language?: AppLanguage;
  question: PracticeQuestion;
  screen: QuestionReportScreen;
  selectedOptionId?: string | null;
}

export function QuestionReportLink({
  language = 'sv',
  question,
  screen,
  selectedOptionId,
}: QuestionReportLinkProps) {
  const copy = questionReportLinkCopy[language];
  const supportHref = buildQuestionReportSupportHref({
    language,
    question,
    screen,
    selectedOptionId,
  });

  return (
    <View style={styles.container}>
      <Link
        accessibilityLabel={copy.accessibilityLabel(question.id)}
        accessibilityRole="link"
        asChild
        href={supportHref}
      >
        <Button
          accessibilityLabel={copy.accessibilityLabel(question.id)}
          accessibilityRole="link"
          size="sm"
          style={styles.linkButton}
          variant="ghost"
        >
          {copy.label}
        </Button>
      </Link>
    </View>
  );
}

export function buildQuestionReportSupportHref({
  language,
  question,
  screen,
  selectedOptionId,
}: Required<Pick<QuestionReportLinkProps, 'language' | 'question' | 'screen'>> &
  Pick<QuestionReportLinkProps, 'selectedOptionId'>) {
  const selectedAnswer = getSelectedAnswerText(question, selectedOptionId, language);
  const params = [
    ['questionId', question.id],
    ['source', getQuestionSourceCitation(question, language)],
    ['language', language],
    ['reportScreen', screen],
    ['screen', screen],
    selectedAnswer ? ['selectedAnswer', selectedAnswer] : null,
  ].filter((entry): entry is [string, string] => Array.isArray(entry));

  const query = params
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `/support?${query}`;
}

function getSelectedAnswerText(
  question: PracticeQuestion,
  selectedOptionId: string | null | undefined,
  language: AppLanguage,
) {
  if (!selectedOptionId) return undefined;

  const selectedOption = question.options.find((option) => option.id === selectedOptionId);
  if (!selectedOption) return undefined;

  return language === 'en' ? selectedOption.textEn : selectedOption.textSv;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  linkButton: {
    alignSelf: 'flex-start',
    minHeight: space[6],
  },
});
