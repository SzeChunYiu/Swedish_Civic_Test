import type { AppLanguage } from '../storage/settingsStore';
import type { Chapter, PracticeQuestion, QuestionOption } from '../../types/content';

export type QuestionSearchResult = {
  chapter: Chapter;
  matchedText: string;
  question: PracticeQuestion;
  score: number;
};

type SearchQuestionsInput = {
  chapters: Chapter[];
  language: AppLanguage;
  limit?: number;
  query: string;
  questions: PracticeQuestion[];
};

type SearchField = {
  text: string;
  weight: number;
};

const DEFAULT_LIMIT = 12;
const MIN_QUERY_LENGTH = 2;

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getQuestionOptionText(option: QuestionOption, language: AppLanguage) {
  return language === 'en' ? option.textEn : option.textSv;
}

function getQuestionTranslationOptionText(option: QuestionOption, language: AppLanguage) {
  return language === 'en' ? option.textSv : option.textEn;
}

function getQuestionText(question: PracticeQuestion, language: AppLanguage) {
  return language === 'en' ? question.questionEn : question.questionSv;
}

function getQuestionTranslationText(question: PracticeQuestion, language: AppLanguage) {
  return language === 'en' ? question.questionSv : question.questionEn;
}

function getQuestionExplanation(question: PracticeQuestion, language: AppLanguage) {
  return language === 'en' ? question.explanationEn : question.explanationSv;
}

function getQuestionTranslationExplanation(question: PracticeQuestion, language: AppLanguage) {
  return language === 'en' ? question.explanationSv : question.explanationEn;
}

function getChapterName(chapter: Chapter, language: AppLanguage) {
  return language === 'en' ? chapter.nameEn : chapter.nameSv;
}

function getChapterTranslationName(chapter: Chapter, language: AppLanguage) {
  return language === 'en' ? chapter.nameSv : chapter.nameEn;
}

function getQuestionSearchFields({
  chapter,
  language,
  question,
}: {
  chapter: Chapter;
  language: AppLanguage;
  question: PracticeQuestion;
}): SearchField[] {
  return [
    { text: getQuestionText(question, language), weight: 80 },
    { text: getQuestionTranslationText(question, language), weight: 60 },
    ...question.options.map((option) => ({
      text: getQuestionOptionText(option, language),
      weight: 70,
    })),
    ...question.options.map((option) => ({
      text: getQuestionTranslationOptionText(option, language),
      weight: 50,
    })),
    { text: question.tags.join(' '), weight: 65 },
    { text: getChapterName(chapter, language), weight: 48 },
    { text: getChapterTranslationName(chapter, language), weight: 40 },
    { text: getQuestionExplanation(question, language), weight: 35 },
    { text: getQuestionTranslationExplanation(question, language), weight: 28 },
    { text: question.uhrReference.chapter, weight: 32 },
    { text: question.uhrReference.section, weight: 32 },
  ];
}

function scoreField(field: SearchField, normalizedQuery: string, queryTokens: string[]) {
  const normalizedText = normalizeSearchText(field.text);
  if (!normalizedText) return 0;

  let score = 0;
  if (normalizedText === normalizedQuery) score += field.weight * 2;
  if (normalizedText.startsWith(normalizedQuery)) score += field.weight;
  if (normalizedText.includes(normalizedQuery)) score += field.weight;

  for (const token of queryTokens) {
    if (token.length >= MIN_QUERY_LENGTH && normalizedText.includes(token)) {
      score += Math.max(1, Math.floor(field.weight / 4));
    }
  }

  return score;
}

function findMatchedText(fields: SearchField[], normalizedQuery: string, queryTokens: string[]) {
  const matchingField = fields.find((field) => {
    const normalizedText = normalizeSearchText(field.text);
    return (
      normalizedText.includes(normalizedQuery) ||
      queryTokens.some(
        (token) => token.length >= MIN_QUERY_LENGTH && normalizedText.includes(token),
      )
    );
  });

  return matchingField?.text.trim() ?? '';
}

function compareQuestionIds(left: string, right: string) {
  return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' });
}

export function searchQuestions({
  chapters,
  language,
  limit = DEFAULT_LIMIT,
  query,
  questions,
}: SearchQuestionsInput): QuestionSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

  return questions
    .flatMap((question) => {
      const chapter = chapterById.get(question.chapterId);
      if (!chapter) return [];

      const fields = getQuestionSearchFields({ chapter, language, question });
      const fieldScore = fields.reduce(
        (total, field) => total + scoreField(field, normalizedQuery, queryTokens),
        0,
      );
      const sourceQuestionBoost = question.tags.includes('published-variant') ? 0 : 10;
      const score = fieldScore > 0 ? fieldScore + sourceQuestionBoost : 0;
      if (score <= 0) return [];

      return [
        {
          chapter,
          matchedText: findMatchedText(fields, normalizedQuery, queryTokens),
          question,
          score,
        },
      ];
    })
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return compareQuestionIds(left.question.id, right.question.id);
    })
    .slice(0, limit);
}

export function getQuestionSearchResultTitle(result: QuestionSearchResult, language: AppLanguage) {
  return getQuestionText(result.question, language);
}

export function getQuestionSearchResultChapter(
  result: QuestionSearchResult,
  language: AppLanguage,
) {
  return getChapterName(result.chapter, language);
}

export function getQuestionSearchResultSnippet(
  result: QuestionSearchResult,
  language: AppLanguage,
) {
  return result.matchedText || getQuestionExplanation(result.question, language);
}
