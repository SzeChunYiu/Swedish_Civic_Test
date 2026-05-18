export type ReviewStatus = 'draft' | 'reviewed' | 'published';

export type QuestionType = 'single_choice' | 'true_false' | 'flashcard';

export type Difficulty = 'easy' | 'medium' | 'hard';

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

export interface QuestionOption {
  id: string;
  textSv: string;
  textEn: string;
}

export interface PracticeQuestion {
  id: string;
  chapterId: string;
  type: QuestionType;
  questionSv: string;
  questionEn: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanationSv: string;
  explanationEn: string;
  uhrReference: UHRReference;
  difficulty: Difficulty;
  reviewStatus: ReviewStatus;
  tags: string[];
}

export interface Chapter {
  id: string;
  nameSv: string;
  nameEn: string;
  descriptionSv: string;
  descriptionEn: string;
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
