import type { PracticeQuestion, QuestionProvenance } from '../../types/content';

/**
 * Derive a question's provenance from its tags — see types/content.ts.
 *
 * Single source of truth. Do NOT store provenance separately on each
 * question record; deriving from tags keeps the data layer simple and
 * means new editorial/derived questions only need a tag.
 */
export function getQuestionProvenance(question: { tags?: readonly string[] }): QuestionProvenance {
  const tags = question.tags ?? [];
  if (tags.includes('editorial')) return 'editorial';
  if (tags.includes('published-variant')) return 'derived';
  return 'uhr';
}

/** True when a question came directly from UHR's *Sverige i fokus*. */
export function isUhrQuestion(question: { tags?: readonly string[] }): boolean {
  return getQuestionProvenance(question) === 'uhr';
}

/** True for derived or editorial — anything supplementary to UHR. */
export function isSupplementaryQuestion(question: { tags?: readonly string[] }): boolean {
  return getQuestionProvenance(question) !== 'uhr';
}

/** Filter a question pool by provenance preference. */
export function filterQuestionsByProvenance<T extends { tags?: readonly string[] }>(
  questions: readonly T[],
  options: { includeSupplementary: boolean },
): T[] {
  if (options.includeSupplementary) return [...questions];
  return questions.filter(isUhrQuestion);
}

/**
 * Provenance copy for badges and tooltips — sv + en.
 * Keep terse; the long-form explanation lives in the About-Sources panel.
 */
export const provenanceCopy: Record<
  QuestionProvenance,
  { labelSv: string; labelEn: string; descriptionSv: string; descriptionEn: string }
> = {
  uhr: {
    labelSv: 'UHR',
    labelEn: 'UHR',
    descriptionSv: 'Direkt från UHR:s utbildningsmaterial Sverige i fokus.',
    descriptionEn: "Directly from UHR's study material Sverige i fokus.",
  },
  derived: {
    labelSv: 'Tillägg',
    labelEn: 'Supplementary',
    descriptionSv:
      'Variant som genererats från en UHR-fråga för att öva samma kunskap från en annan vinkel.',
    descriptionEn:
      'Variant generated from a UHR question to practise the same knowledge from another angle.',
  },
  editorial: {
    labelSv: 'Redaktionell',
    labelEn: 'Editorial',
    descriptionSv: 'Skriven av oss för att ge sammanhang som inte täcks direkt av UHR-materialet.',
    descriptionEn:
      'Hand-written by us to give context that the UHR material does not cover directly.',
  },
};

export type ProvenanceCopyLanguage = 'sv' | 'en';

export function getProvenanceLabel(
  provenance: QuestionProvenance,
  language: ProvenanceCopyLanguage,
): string {
  const entry = provenanceCopy[provenance];
  return language === 'sv' ? entry.labelSv : entry.labelEn;
}

export function getProvenanceDescription(
  provenance: QuestionProvenance,
  language: ProvenanceCopyLanguage,
): string {
  const entry = provenanceCopy[provenance];
  return language === 'sv' ? entry.descriptionSv : entry.descriptionEn;
}

/** Used by PracticeQuestion-typed inputs; thin convenience over the generic helper. */
export function getProvenance(question: PracticeQuestion): QuestionProvenance {
  return getQuestionProvenance(question);
}
