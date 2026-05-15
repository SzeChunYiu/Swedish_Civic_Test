# 05 — Database Schema

## TypeScript content types

```ts
export type LanguageCode = "sv" | "en";

export type QuestionType =
  | "single_choice"
  | "true_false"
  | "multiple_choice"
  | "match"
  | "fill_blank";

export type Difficulty = "easy" | "medium" | "hard";

export type ExamScope =
  | "uhr_based"
  | "official_context"
  | "vocabulary_support"
  | "background_learning";

export type ReviewStatus =
  | "draft"
  | "needs_source"
  | "needs_translation"
  | "needs_review"
  | "approved"
  | "published"
  | "archived";

export interface Chapter {
  id: string;
  order: number;
  titleSv: string;
  titleEn: string;
  descriptionSv: string;
  descriptionEn: string;
  sourcePageStart?: number;
  sourcePageEnd?: number;
}

export interface UHRReference {
  publisher: "Universitets- och högskolerådet";
  documentTitle: "Sverige i fokus";
  edition: string;
  chapterSv: string;
  chapterEn: string;
  sectionSv: string;
  sectionEn: string;
  page?: number;
  quoteSv?: string;
  quoteEn?: string;
  paraphraseSv?: string;
  paraphraseEn?: string;
  sourceUrl: string;
  accessedAt?: string;
}

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  examScope: ExamScope;
  chapterId: string;
  sectionId?: string;
  difficulty: Difficulty;

  questionSv: string;
  questionEn: string;

  optionsSv: string[];
  optionsEn: string[];

  correctOptionIndexes: number[];

  explanationSv: string;
  explanationEn: string;

  whyWrongSv?: string[];
  whyWrongEn?: string[];

  uhrReference: UHRReference;

  tags: string[];
  estimatedTimeSeconds?: number;

  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

## Progress types

```ts
export interface UserQuestionProgress {
  questionId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: string;
  nextReviewAt?: string;
  confidence?: "low" | "medium" | "high";
  bookmarked?: boolean;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIndexes: number[];
  isCorrect: boolean;
  answeredAt: string;
  timeSpentSeconds: number;
}

export interface QuizSession {
  id: string;
  mode: "study" | "exam" | "mistakes" | "challenge";
  questionIds: string[];
  answers: QuizAnswer[];
  startedAt: string;
  completedAt?: string;
  score?: number;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastDailyGoalCompletedAt?: string;
  dailyGoalQuestions: number;
  questionProgress: Record<string, UserQuestionProgress>;
}
```

## Settings types

```ts
export interface AppSettings {
  supportLanguage: "en" | "none";
  showEnglishInStudyMode: boolean;
  showEnglishInExamMode: boolean;
  audioEnabled: boolean;
  speechRate: number;
  dailyGoalQuestions: 5 | 10 | 20 | 30;
  adsPersonalizationConsent?: boolean;
}
```

## Sample chapter data

```ts
export const chapters: Chapter[] = [
  {
    id: "landet_sverige",
    order: 1,
    titleSv: "Landet Sverige",
    titleEn: "The country of Sweden",
    descriptionSv: "Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.",
    descriptionEn: "Geography, climate, nature, population, natural resources, and climate change.",
    sourcePageStart: 5,
    sourcePageEnd: 9
  },
  {
    id: "demokratiska_system",
    order: 2,
    titleSv: "Sveriges demokratiska system",
    titleEn: "Sweden's democratic system",
    descriptionSv: "Demokrati, påverkan och hot mot demokratin.",
    descriptionEn: "Democracy, participation, and threats to democracy.",
    sourcePageStart: 10,
    sourcePageEnd: 11
  }
];
```

## Sample question data

```ts
export const sampleQuestion: PracticeQuestion = {
  id: "landet_sverige_001",
  type: "single_choice",
  examScope: "uhr_based",
  chapterId: "landet_sverige",
  difficulty: "easy",

  questionSv: "Var ligger Sverige?",
  questionEn: "Where is Sweden located?",

  optionsSv: [
    "I Norden i norra Europa",
    "I södra Europa",
    "I västra Asien",
    "I Nordamerika"
  ],
  optionsEn: [
    "In the Nordic region in northern Europe",
    "In southern Europe",
    "In western Asia",
    "In North America"
  ],

  correctOptionIndexes: [0],

  explanationSv: "Sverige ligger i Norden, som är en del av norra Europa.",
  explanationEn: "Sweden is located in the Nordic region, which is part of northern Europe.",

  whyWrongSv: [
    "Södra Europa är fel eftersom UHR beskriver Sverige som ett land i norra Europa.",
    "Västra Asien är fel eftersom Sverige ligger i Europa.",
    "Nordamerika är fel eftersom Sverige inte ligger på den kontinenten."
  ],
  whyWrongEn: [
    "Southern Europe is incorrect because UHR describes Sweden as being in northern Europe.",
    "Western Asia is incorrect because Sweden is in Europe.",
    "North America is incorrect because Sweden is not on that continent."
  ],

  uhrReference: {
    publisher: "Universitets- och högskolerådet",
    documentTitle: "Sverige i fokus",
    edition: "1:a upplagan, 2026",
    chapterSv: "Landet Sverige",
    chapterEn: "The country of Sweden",
    sectionSv: "Geografi, klimat och natur",
    sectionEn: "Geography, climate and nature",
    page: 5,
    quoteSv: "Sverige ligger i Norden i norra Europa.",
    quoteEn: "Sweden is located in the Nordic region in northern Europe.",
    sourceUrl: "https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf"
  },

  tags: ["geography", "norden", "basic_fact"],
  estimatedTimeSeconds: 20,
  reviewStatus: "published",
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
  publishedAt: "2026-05-15T00:00:00.000Z"
};
```

## Future SQL tables

If moving to Supabase/Postgres:

```sql
create table chapters (
  id text primary key,
  order_index int not null,
  title_sv text not null,
  title_en text not null,
  description_sv text,
  description_en text,
  source_page_start int,
  source_page_end int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table questions (
  id text primary key,
  type text not null,
  exam_scope text not null,
  chapter_id text references chapters(id),
  section_id text,
  difficulty text not null,
  question_sv text not null,
  question_en text not null,
  options_sv jsonb not null,
  options_en jsonb not null,
  correct_option_indexes int[] not null,
  explanation_sv text not null,
  explanation_en text not null,
  why_wrong_sv jsonb,
  why_wrong_en jsonb,
  uhr_reference jsonb not null,
  tags text[] default '{}',
  estimated_time_seconds int,
  review_status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

create table user_question_progress (
  user_id uuid not null,
  question_id text references questions(id),
  seen_count int default 0,
  correct_count int default 0,
  wrong_count int default 0,
  correct_streak int default 0,
  last_answered_at timestamptz,
  next_review_at timestamptz,
  confidence text,
  bookmarked boolean default false,
  primary key (user_id, question_id)
);
```
