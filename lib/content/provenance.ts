import type { PracticeQuestion, QuestionProvenance } from '../../types/content';

const DEFAULT_PROVENANCE: QuestionProvenance = 'uhr';
const SUPPORTED_PROVENANCE = new Set<QuestionProvenance>(['uhr', 'derived', 'editorial']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReadonlyStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((tag) => typeof tag === 'string');
}

function questionTags(question: unknown): readonly string[] {
  if (!isRecord(question)) return [];
  const tags = question.tags;
  return isReadonlyStringArray(tags) ? tags : [];
}

function normalizeProvenance(provenance: unknown): QuestionProvenance {
  return typeof provenance === 'string' &&
    SUPPORTED_PROVENANCE.has(provenance as QuestionProvenance)
    ? (provenance as QuestionProvenance)
    : DEFAULT_PROVENANCE;
}

function normalizeProvenanceCopyLanguage(language: unknown): ProvenanceCopyLanguage {
  return language === 'en' ? 'en' : 'sv';
}

/**
 * Derive a question's provenance from its tags — see types/content.ts.
 *
 * Single source of truth. Do NOT store provenance separately on each
 * question record; deriving from tags keeps the data layer simple and
 * means new editorial/derived questions only need a tag.
 */
export function getQuestionProvenance(question: unknown): QuestionProvenance {
  const tags = questionTags(question);
  if (tags.includes('editorial')) return 'editorial';
  if (tags.includes('published-variant')) return 'derived';
  return DEFAULT_PROVENANCE;
}

/** True when a question is based on UHR's *Sverige i fokus*. */
export function isUhrQuestion(question: unknown): boolean {
  return getQuestionProvenance(question) === DEFAULT_PROVENANCE;
}

/** True for derived or editorial — anything supplementary to UHR. */
export function isSupplementaryQuestion(question: unknown): boolean {
  return getQuestionProvenance(question) !== DEFAULT_PROVENANCE;
}

/** Filter a question pool by provenance preference. */
export function filterQuestionsByProvenance<T extends { tags?: readonly string[] }>(
  questions: readonly T[] | null | undefined,
  options?: { includeSupplementary?: boolean } | null,
): T[] {
  if (!Array.isArray(questions)) return [];
  if (options?.includeSupplementary === true) return [...questions];
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
    descriptionSv: 'Baserad på UHR:s studiematerial Sverige i fokus.',
    descriptionEn: "Based on UHR's study material Sverige i fokus.",
  },
  derived: {
    labelSv: 'Tillägg',
    labelEn: 'Supplementary',
    descriptionSv: 'Variant av en appskriven, UHR-hänvisad övningsfråga.',
    descriptionEn: 'Variant of an app-authored, UHR-referenced practice question.',
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

export function getProvenanceLabel(provenance: unknown, language: unknown): string {
  const entry = provenanceCopy[normalizeProvenance(provenance)];
  return normalizeProvenanceCopyLanguage(language) === 'sv' ? entry.labelSv : entry.labelEn;
}

export function getProvenanceDescription(provenance: unknown, language: unknown): string {
  const entry = provenanceCopy[normalizeProvenance(provenance)];
  return normalizeProvenanceCopyLanguage(language) === 'sv'
    ? entry.descriptionSv
    : entry.descriptionEn;
}

/** Used by PracticeQuestion-typed inputs; thin convenience over the generic helper. */
export function getProvenance(question: PracticeQuestion): QuestionProvenance {
  return getQuestionProvenance(question);
}
