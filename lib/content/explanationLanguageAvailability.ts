import {
  QUESTION_LOCALIZATION_REVIEW_STATUS,
  type QuestionLocalizationReviewMetadata,
} from '../../data/questionLocalizations';
import { localeCodes, type LocaleCode } from '../i18n/locales';
import type { PracticeQuestion } from '../../types/content';

export type QuestionExplanationReviewStatus = Partial<
  Record<string, Partial<Record<LocaleCode, QuestionLocalizationReviewMetadata>>>
>;

export const REFERENCE_EXPLANATION_LOCALES = ['sv', 'en'] as const satisfies readonly LocaleCode[];

export const NATIVE_EXPLANATION_LOCALES = localeCodes.filter(
  (locale): locale is Exclude<LocaleCode, (typeof REFERENCE_EXPLANATION_LOCALES)[number]> =>
    locale !== 'sv' && locale !== 'en',
);

function textForLocale(question: PracticeQuestion, locale: LocaleCode): string | undefined {
  if (locale === 'sv') {
    return question.explanationText?.sv ?? question.explanationSv;
  }
  if (locale === 'en') {
    return question.explanationText?.en ?? question.explanationEn;
  }
  return question.explanationText?.[locale];
}

function hasCanonicalFallbackText(question: PracticeQuestion, text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed === question.explanationSv.trim() ||
    trimmed === question.explanationEn.trim() ||
    trimmed === question.explanationText?.sv?.trim() ||
    trimmed === question.explanationText?.en?.trim()
  );
}

function isReviewedNativeExplanationLocale(
  question: PracticeQuestion,
  locale: Exclude<LocaleCode, 'sv' | 'en'>,
  reviewStatus: QuestionExplanationReviewStatus,
): boolean {
  const text = textForLocale(question, locale)?.trim();
  if (!text || hasCanonicalFallbackText(question, text)) return false;

  const metadata = reviewStatus[question.id]?.[locale];
  return metadata?.status === 'native_reviewed' && metadata.nativeReviewStatus === 'reviewed';
}

export function getReviewedNativeExplanationLocales(
  question: PracticeQuestion,
  reviewStatus: QuestionExplanationReviewStatus = QUESTION_LOCALIZATION_REVIEW_STATUS,
): Exclude<LocaleCode, 'sv' | 'en'>[] {
  return NATIVE_EXPLANATION_LOCALES.filter((locale) =>
    isReviewedNativeExplanationLocale(question, locale, reviewStatus),
  );
}

export function getReviewedExplanationLocales(
  question: PracticeQuestion,
  reviewStatus: QuestionExplanationReviewStatus = QUESTION_LOCALIZATION_REVIEW_STATUS,
): LocaleCode[] {
  const referenceLocales = REFERENCE_EXPLANATION_LOCALES.filter((locale) =>
    Boolean(textForLocale(question, locale)?.trim()),
  );
  return [...referenceLocales, ...getReviewedNativeExplanationLocales(question, reviewStatus)];
}
