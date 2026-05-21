import { chapters } from '../../data/chapters';
import { glossaryTerms } from '../../data/glossary';
import type { GlossaryTerm } from '../../types/content';
import type { AppLanguage } from '../storage/settingsStore';

export type GlossarySearchResult = GlossaryTerm & {
  chapterNameEn?: string;
  chapterNameSv?: string;
};

const chaptersById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

export function normalizeSearchResultLimit(
  limit: unknown,
  defaultLimit: number,
): number | undefined {
  const safeDefault = Number.isInteger(defaultLimit) && defaultLimit >= 0 ? defaultLimit : 0;
  if (limit === Number.POSITIVE_INFINITY) return undefined;
  if (typeof limit === 'number' && Number.isInteger(limit) && limit >= 0) return limit;
  return safeDefault;
}

export function normalizeGlossarySearchText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTermForLanguage(term: GlossaryTerm, language: AppLanguage) {
  return language === 'en' ? term.termEn : term.termSv;
}

function getSearchRank(term: GlossaryTerm, normalizedQuery: string) {
  const normalizedTermSv = normalizeGlossarySearchText(term.termSv);
  const normalizedTermEn = normalizeGlossarySearchText(term.termEn);
  const normalizedExplanationSv = normalizeGlossarySearchText(term.explanationSv);
  const normalizedExplanationEn = normalizeGlossarySearchText(term.explanationEn);
  const chapter = term.chapterId ? chaptersById.get(term.chapterId) : undefined;
  const normalizedChapterSv = chapter ? normalizeGlossarySearchText(chapter.nameSv) : '';
  const normalizedChapterEn = chapter ? normalizeGlossarySearchText(chapter.nameEn) : '';

  if (normalizedTermSv === normalizedQuery || normalizedTermEn === normalizedQuery) return 0;
  if (
    normalizedTermSv.startsWith(normalizedQuery) ||
    normalizedTermEn.startsWith(normalizedQuery)
  ) {
    return 1;
  }
  if (normalizedTermSv.includes(normalizedQuery) || normalizedTermEn.includes(normalizedQuery)) {
    return 2;
  }
  if (
    normalizedExplanationSv.includes(normalizedQuery) ||
    normalizedExplanationEn.includes(normalizedQuery)
  ) {
    return 3;
  }
  if (
    normalizedChapterSv.includes(normalizedQuery) ||
    normalizedChapterEn.includes(normalizedQuery)
  ) {
    return 4;
  }

  return Number.POSITIVE_INFINITY;
}

export function getGlossaryChapterLabel(term: GlossaryTerm, language: AppLanguage) {
  if (!term.chapterId) return undefined;
  const chapter = chaptersById.get(term.chapterId);
  if (!chapter) return undefined;

  return language === 'en' ? chapter.nameEn : chapter.nameSv;
}

export function searchGlossary(
  query: string,
  language: AppLanguage,
  limit = 10,
): GlossarySearchResult[] {
  const normalizedLimit = normalizeSearchResultLimit(limit, 10);
  const normalizedQuery = normalizeGlossarySearchText(query);
  const sortedTerms = [...glossaryTerms].sort((left, right) =>
    getTermForLanguage(left, language).localeCompare(getTermForLanguage(right, language), language),
  );

  const terms = normalizedQuery
    ? sortedTerms
        .map((term) => ({ rank: getSearchRank(term, normalizedQuery), term }))
        .filter((entry) => Number.isFinite(entry.rank))
        .sort((left, right) => {
          if (left.rank !== right.rank) return left.rank - right.rank;
          return getTermForLanguage(left.term, language).localeCompare(
            getTermForLanguage(right.term, language),
            language,
          );
        })
        .map((entry) => entry.term)
    : sortedTerms;

  const limitedTerms = normalizedLimit === undefined ? terms : terms.slice(0, normalizedLimit);

  return limitedTerms.map((term) => {
    const chapter = term.chapterId ? chaptersById.get(term.chapterId) : undefined;
    return {
      ...term,
      chapterNameEn: chapter?.nameEn,
      chapterNameSv: chapter?.nameSv,
    };
  });
}
