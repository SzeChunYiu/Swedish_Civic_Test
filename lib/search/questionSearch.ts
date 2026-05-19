import type { PracticeQuestion, QuestionOption } from '../../types/content';
import {
  getQuestionDisplayText,
  getQuestionSourceCitation,
  getQuestionTranslationText,
} from '../quiz/questionText';
import type { AppLanguage } from '../storage/settingsStore';

export type QuestionSearchField =
  | 'question'
  | 'answer'
  | 'explanation'
  | 'source'
  | 'tag'
  | 'translation';

export interface HighlightPart {
  matched: boolean;
  text: string;
}

export interface QuestionSearchResult {
  field: QuestionSearchField;
  highlightParts: HighlightPart[];
  matchedText: string;
  question: PracticeQuestion;
  questionText: string;
  score: number;
  sourceText: string;
  translationText?: string;
}

interface SearchFieldCandidate {
  field: QuestionSearchField;
  text: string;
}

export interface QuestionSearchOptions {
  limit?: number;
}

const DEFAULT_SEARCH_LIMIT = 12;

const FIELD_SCORES: Record<QuestionSearchField, number> = {
  question: 60,
  answer: 50,
  explanation: 35,
  source: 25,
  tag: 20,
  translation: 15,
};

export function normalizeSearchText(value: string): string {
  return normalizeSearchCharacters(value).replace(/\s+/g, ' ').trim();
}

export function getHighlightParts(text: string, query: string): HighlightPart[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = getQueryTokens(query);
  const range =
    findNormalizedRange(text, normalizedQuery) ??
    tokens.map((token) => findNormalizedRange(text, token)).find(Boolean);

  if (!range) {
    return [{ matched: false, text }];
  }

  const [start, end] = range;

  return [
    start > 0 ? { matched: false, text: text.slice(0, start) } : null,
    { matched: true, text: text.slice(start, end) },
    end < text.length ? { matched: false, text: text.slice(end) } : null,
  ].filter((part): part is HighlightPart => Boolean(part?.text));
}

export function searchQuestions(
  questions: PracticeQuestion[],
  query: string,
  language: AppLanguage,
  { limit = DEFAULT_SEARCH_LIMIT }: QuestionSearchOptions = {},
): QuestionSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = getQueryTokens(query);

  if (!normalizedQuery || tokens.length === 0) {
    return [];
  }

  return questions
    .map((question) => getQuestionSearchResult(question, language, normalizedQuery, tokens))
    .filter((result): result is QuestionSearchResult => Boolean(result))
    .sort(
      (left, right) =>
        right.score - left.score || left.question.id.localeCompare(right.question.id),
    )
    .slice(0, limit);
}

function getQuestionSearchResult(
  question: PracticeQuestion,
  language: AppLanguage,
  normalizedQuery: string,
  tokens: string[],
): QuestionSearchResult | undefined {
  const fields = getSearchFields(question, language);
  const match = fields.find((candidate) =>
    fieldMatches(normalizeSearchText(candidate.text), normalizedQuery, tokens),
  );

  if (!match) return undefined;

  const questionText = getQuestionDisplayText(question, language);
  const sourceText = getQuestionSourceCitation(question, language);
  const translationText = getQuestionTranslationText(question, language);
  const normalizedText = normalizeSearchText(match.text);
  const startsWithQuery = normalizedText.startsWith(normalizedQuery);
  const score = FIELD_SCORES[match.field] + (startsWithQuery ? 10 : 0);

  return {
    field: match.field,
    highlightParts: getHighlightParts(match.text, normalizedQuery),
    matchedText: match.text,
    question,
    questionText,
    score,
    sourceText,
    translationText,
  };
}

function getSearchFields(
  question: PracticeQuestion,
  language: AppLanguage,
): SearchFieldCandidate[] {
  const optionText = question.options.map((option) => getOptionText(option, language)).join(' ');
  const explanationText = language === 'en' ? question.explanationEn : question.explanationSv;
  const translationText = getQuestionTranslationText(question, language);

  return [
    { field: 'question', text: getQuestionDisplayText(question, language) },
    { field: 'answer', text: optionText },
    { field: 'explanation', text: explanationText },
    { field: 'source', text: getQuestionSourceCitation(question, language) },
    { field: 'tag', text: question.tags.join(' ') },
    translationText ? { field: 'translation', text: translationText } : null,
  ].filter((candidate): candidate is SearchFieldCandidate => Boolean(candidate?.text));
}

function getOptionText(option: QuestionOption, language: AppLanguage): string {
  return language === 'en' ? option.textEn : option.textSv;
}

function getQueryTokens(query: string): string[] {
  return normalizeSearchText(query).split(' ').filter(Boolean);
}

function fieldMatches(normalizedText: string, normalizedQuery: string, tokens: string[]): boolean {
  return (
    normalizedText.includes(normalizedQuery) ||
    tokens.every((token) => normalizedText.includes(token))
  );
}

function findNormalizedRange(text: string, normalizedQuery: string): [number, number] | undefined {
  if (!normalizedQuery) return undefined;

  const { normalized, sourceIndexes } = normalizeWithSourceIndexes(text);
  const normalizedStart = normalized.indexOf(normalizedQuery);

  if (normalizedStart < 0) return undefined;

  const normalizedEnd = normalizedStart + normalizedQuery.length - 1;
  const start = sourceIndexes[normalizedStart];
  const end = sourceIndexes[normalizedEnd] + 1;

  return [start, end];
}

function normalizeWithSourceIndexes(text: string) {
  let normalized = '';
  const sourceIndexes: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedCharacter = normalizeSearchCharacters(text[index]);

    for (const character of normalizedCharacter) {
      normalized += character;
      sourceIndexes.push(index);
    }
  }

  return { normalized, sourceIndexes };
}

function normalizeSearchCharacters(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE');
}
