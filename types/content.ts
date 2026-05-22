import type { LocaleCode } from '../lib/i18n/locales';

export type ReviewStatus = 'draft' | 'reviewed' | 'published';

export type QuestionType = 'single_choice' | 'true_false' | 'flashcard';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type LocalizedContentText = Record<'sv' | 'en', string> &
  Partial<Record<LocaleCode, string>>;

export type LocalizedContentTextOverrides = Partial<Record<LocaleCode, string>>;

/**
 * Provenance of a question or content unit.
 * - 'uhr': directly traceable to UHR's *Sverige i fokus* PDF
 * - 'derived': algorithmically generated variant of a UHR question
 * - 'editorial': hand-authored supplementary content
 *
 * Derived at runtime from question tags via lib/content/provenance.ts —
 * questions with the `published-variant` tag are 'derived',
 * questions with the `editorial` tag are 'editorial',
 * everything else is 'uhr'.
 */
export type QuestionProvenance = 'uhr' | 'derived' | 'editorial';

export interface UHRReference {
  chapter: string;
  section: string;
  pageApprox: number;
}

export interface OfficialSourceReference {
  title: string;
  publisher: string;
  url: string;
  publishedDate?: string;
  retrievedDate: string;
}

export interface QuestionOption {
  id: string;
  textSv: string;
  textEn: string;
  text?: LocalizedContentText;
}

export interface PracticeQuestion {
  id: string;
  chapterId: string;
  type: QuestionType;
  questionSv: string;
  questionEn: string;
  questionText?: LocalizedContentText;
  options: QuestionOption[];
  correctOptionId: string;
  explanationSv: string;
  explanationEn: string;
  explanationText?: LocalizedContentText;
  uhrReference: UHRReference;
  supplementalSources?: OfficialSourceReference[];
  difficulty: Difficulty;
  reviewStatus: ReviewStatus;
  tags: string[];
}

export interface Chapter {
  id: string;
  nameSv: string;
  nameEn: string;
  nameText?: LocalizedContentTextOverrides;
  descriptionSv: string;
  descriptionEn: string;
  descriptionText?: LocalizedContentTextOverrides;
  questionCount: number;
}

export interface GlossaryTerm {
  id: string;
  termSv: string;
  termEn: string;
  explanationSv: string;
  explanationEn: string;
  chapterId?: string;
}
