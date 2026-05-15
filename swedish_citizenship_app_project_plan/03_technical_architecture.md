# 03 — Technical Architecture

## Recommended stack

Use one codebase for Android and iOS.

| Layer | Recommendation |
|---|---|
| Framework | React Native |
| Tooling | Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| Local data | Bundled TypeScript/JSON first |
| Persistent storage | SQLite or MMKV |
| State | Zustand |
| Audio | expo-speech |
| Ads | Google AdMob |
| Purchases | RevenueCat later |
| Analytics | Firebase Analytics or PostHog |
| Crash reporting | Sentry or Firebase Crashlytics |
| Backend | Avoid in MVP unless needed |
| Admin CMS | Later: Supabase + simple admin UI |

## MVP architecture

Prefer an offline-first MVP:

```txt
Bundled content files
        ↓
Quiz engine
        ↓
Local progress storage
        ↓
UI screens
        ↓
Optional: ads/premium/analytics
```

Benefits:

- lower cost,
- faster app,
- works offline,
- fewer privacy issues,
- simpler App Store review.

## When to add backend

Add backend only when needed for:

- content updates without app release,
- account sync,
- remote progress backup,
- admin review workflow,
- A/B testing,
- push notification scheduling.

Recommended backend when needed:

- Supabase PostgreSQL for content and admin
- Supabase Auth if user accounts are added
- Supabase Storage for human audio files
- Edge Functions only if needed

## Suggested project structure

```txt
app/
  _layout.tsx
  index.tsx
  onboarding.tsx
  (tabs)/
    home.tsx
    learn.tsx
    practice.tsx
    exam.tsx
    mistakes.tsx
    profile.tsx
  chapter/
    [chapterId].tsx
  quiz/
    [sessionId].tsx
  question/
    [questionId].tsx
  settings.tsx

components/
  ui/
    Button.tsx
    Card.tsx
    ProgressBar.tsx
  quiz/
    QuestionCard.tsx
    AnswerOption.tsx
    ExplanationPanel.tsx
    UHRReferenceCard.tsx
    QuizProgressHeader.tsx
  learning/
    ChapterCard.tsx
    Flashcard.tsx
    AudioButton.tsx
  monetization/
    AdBanner.tsx
    PremiumBanner.tsx

data/
  chapters.ts
  questions.ts
  glossary.ts
  mockExamConfig.ts

lib/
  quiz/
    examGenerator.ts
    scoring.ts
    answerValidation.ts
  learning/
    spacedRepetition.ts
    mastery.ts
    streaks.ts
  storage/
    progressStore.ts
    settingsStore.ts
  audio/
    speak.ts
  monetization/
    ads.ts
    premium.ts
  localization/
    strings.ts
    language.ts

types/
  content.ts
  progress.ts
  monetization.ts
```

## Content loading

MVP can import questions from static files:

```ts
import { questions } from "@/data/questions";
import { chapters } from "@/data/chapters";
```

Later migration path:

1. Keep static content for offline.
2. Add remote content version check.
3. Download updated content packs.
4. Validate schema.
5. Cache locally.

## State management

Use Zustand stores:

- `useSettingsStore`
- `useProgressStore`
- `useQuizSessionStore`
- `usePurchaseStore`

## Local storage

Use SQLite if question-level progress becomes complex.

Simple MVP can use:

- MMKV for settings and small progress
- SQLite for large question progress

Recommended tables:

- `user_question_progress`
- `quiz_sessions`
- `exam_attempts`
- `settings`

## Audio implementation

Use `expo-speech`:

```ts
import * as Speech from "expo-speech";

export function speakSwedish(text: string) {
  Speech.stop();
  Speech.speak(text, {
    language: "sv-SE",
    rate: 0.9,
    pitch: 1.0
  });
}
```

## Quiz session logic

A quiz session should contain:

- session id,
- mode: study/exam/mistakes/challenge,
- question ids,
- current index,
- answers,
- started at,
- completed at.

## Scoring

For practice mode:

- correct: +10 XP
- wrong: +2 XP for effort
- streak bonus: +5 XP every 5 correct answers
- chapter mastery updated after session

For exam mode:

- score percentage,
- pass/fail style status without claiming official pass,
- chapter breakdown.

## Spaced repetition

Rule-based, no AI needed.

```ts
export function getNextReviewDays(wrongCount: number, correctStreak: number) {
  if (wrongCount >= 3) return 1;
  if (wrongCount === 2) return 2;
  if (wrongCount === 1) return 3;
  if (correctStreak >= 5) return 14;
  if (correctStreak >= 3) return 7;
  return 1;
}
```

## Privacy architecture

Avoid accounts in MVP.

Store locally:

- settings,
- progress,
- mistakes,
- streaks.

Collect analytics only if needed and disclosed:

- screen views,
- quiz completions,
- feature usage,
- crash reports.

Do not collect:

- citizenship status,
- immigration case details,
- government ID,
- sensitive personal data.
