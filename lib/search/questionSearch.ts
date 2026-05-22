import type { AppLanguage } from '../storage/settingsStore';
import type { Chapter, PracticeQuestion } from '../../types/content';
import { normalizeSearchResultLimit, normalizeSearchText } from './textNormalization';

export type QuestionSearchResult = {
  chapter?: Chapter;
  question: PracticeQuestion;
  score: number;
};

export type QuestionSearchResults = {
  results: QuestionSearchResult[];
  totalCount: number;
};

function searchableFields(question: PracticeQuestion, chapter: Chapter | undefined): string[] {
  return [
    question.id,
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    question.uhrReference.chapter,
    question.uhrReference.section,
    chapter?.nameSv ?? '',
    chapter?.nameEn ?? '',
    chapter?.descriptionSv ?? '',
    chapter?.descriptionEn ?? '',
    ...question.tags,
    ...question.options.flatMap((option) => [option.textSv, option.textEn]),
  ];
}

function scoreQuestion(
  question: PracticeQuestion,
  chapter: Chapter | undefined,
  query: string,
): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  let score = 0;
  const weightedFields = [
    { value: question.id, weight: 24 },
    { value: question.questionSv, weight: 18 },
    { value: question.questionEn, weight: 18 },
    { value: chapter?.nameSv ?? '', weight: 12 },
    { value: chapter?.nameEn ?? '', weight: 12 },
    { value: question.uhrReference.section, weight: 10 },
    { value: question.uhrReference.chapter, weight: 8 },
    { value: question.tags.join(' '), weight: 7 },
    {
      value: question.options.map((option) => `${option.textSv} ${option.textEn}`).join(' '),
      weight: 5,
    },
    { value: `${question.explanationSv} ${question.explanationEn}`, weight: 3 },
  ];

  weightedFields.forEach(({ value, weight }) => {
    const normalizedValue = normalizeSearchText(value);
    if (normalizedValue === normalizedQuery) score += weight * 2;
    if (normalizedValue.startsWith(normalizedQuery)) score += weight;
    if (normalizedValue.includes(normalizedQuery)) score += weight;
  });

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const haystack = searchableFields(question, chapter).map(normalizeSearchText).join(' ');
    score += tokens.filter((token) => haystack.includes(token)).length;
  }

  return score;
}

function getQuestionSearchMatches({
  chapters,
  query,
  questions,
}: {
  chapters: Chapter[];
  query: string;
  questions: PracticeQuestion[];
}): QuestionSearchResult[] {
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

  return questions
    .map((question) => {
      const chapter = chapterById.get(question.chapterId);
      return { chapter, question, score: scoreQuestion(question, chapter, query) };
    })
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.question.id.localeCompare(right.question.id),
    );
}

export function searchQuestionsWithTotal({
  chapters,
  limit = 12,
  query,
  questions,
}: {
  chapters: Chapter[];
  limit?: number;
  query: string;
  questions: PracticeQuestion[];
}): QuestionSearchResults {
  const normalizedLimit = normalizeSearchResultLimit(limit, 12);
  const matches = getQuestionSearchMatches({ chapters, query, questions });
  const results = normalizedLimit === undefined ? matches : matches.slice(0, normalizedLimit);

  return {
    results,
    totalCount: matches.length,
  };
}

export function searchQuestions({
  chapters,
  limit = 12,
  query,
  questions,
}: {
  chapters: Chapter[];
  limit?: number;
  query: string;
  questions: PracticeQuestion[];
}): QuestionSearchResult[] {
  return searchQuestionsWithTotal({ chapters, limit, query, questions }).results;
}

export function getQuestionSearchTitle(question: PracticeQuestion, language: AppLanguage): string {
  return language === 'sv' ? question.questionSv : question.questionEn;
}

export function getQuestionSearchExcerpt(
  question: PracticeQuestion,
  language: AppLanguage,
): string {
  return language === 'sv' ? question.explanationSv : question.explanationEn;
}

export function getQuestionSearchChapterName(
  chapter: Chapter | undefined,
  language: AppLanguage,
): string {
  if (!chapter) return '';
  return language === 'sv' ? chapter.nameSv : chapter.nameEn;
}
