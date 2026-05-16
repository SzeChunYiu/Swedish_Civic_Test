export type ReviewStatus = 'draft' | 'reviewed' | 'published';

export type QuestionType = 'single_choice' | 'true_false' | 'flashcard';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ExamScope =
  | 'uhr_based'
  | 'official_context'
  | 'vocabulary_support'
  | 'background_learning';

export interface UHRReference {
  chapter: string;
  section: string;
  pageApprox: number;
  documentTitle: string;
  sourceEdition: string;
  sourceUrl: string;
}

export type DraftUHRReference = Pick<UHRReference, 'chapter' | 'section' | 'pageApprox'> &
  Partial<Pick<UHRReference, 'documentTitle' | 'sourceEdition' | 'sourceUrl'>>;

export interface QuestionOption {
  id: string;
  textSv: string;
  textEn: string;
}

export interface PracticeQuestion {
  id: string;
  chapterId: string;
  type: QuestionType;
  examScope: ExamScope;
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

export type DraftPracticeQuestion = Omit<PracticeQuestion, 'examScope' | 'uhrReference'> & {
  examScope?: ExamScope;
  uhrReference: DraftUHRReference;
};

export interface Chapter {
  id: string;
  nameSv: string;
  nameEn: string;
  descriptionSv: string;
  descriptionEn: string;
  questionCount: number;
}
