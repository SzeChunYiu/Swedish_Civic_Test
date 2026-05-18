export type ReviewStatus = 'draft' | 'reviewed' | 'published';

export type QuestionType = 'single_choice' | 'true_false' | 'flashcard';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionProvenance = 'uhr' | 'external';

export interface UHRReference {
  chapter: string;
  section: string;
  pageApprox: number;
}

export interface ExternalReference {
  publisher: string;
  title: string;
  locator: string;
  url: string;
  accessedAt: string;
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
  provenance: QuestionProvenance;
  externalReference?: ExternalReference;
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
