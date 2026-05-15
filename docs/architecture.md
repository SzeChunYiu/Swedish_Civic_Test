# Architecture — Sweden Citizenship Test Prep

Source: `swedish_citizenship_app_project_plan/03_technical_architecture.md`

## Stack decision

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo | Single codebase, Android + iOS |
| Language | TypeScript | Type-safe content schema |
| Navigation | Expo Router | File-based, matches project structure |
| State | Zustand | Lightweight, no boilerplate |
| Local data (MVP) | Bundled TS/JSON | Offline-first, no backend needed |
| Progress storage | MMKV (simple) → SQLite (complex) | Fast local KV, upgrade path |
| Audio | expo-speech | Free, sv-SE TTS, no recording needed |
| Ads | Google AdMob (react-native-google-mobile-ads) | Standard |
| Purchases | RevenueCat (post-MVP) | Premium tier |
| Analytics | PostHog or Firebase Analytics | Privacy-friendly option first |
| Crash | Sentry | Good Expo support |

## MVP data flow

```
Bundled TS content files
    ↓
Quiz engine (lib/quiz/)
    ↓
Local progress (MMKV / SQLite)
    ↓
UI screens (app/)
    ↓
Ads + optional premium
```

## Folder structure (target)

```
app/
  _layout.tsx
  index.tsx
  onboarding.tsx
  (tabs)/home.tsx, learn.tsx, practice.tsx, exam.tsx, mistakes.tsx, profile.tsx
  chapter/[chapterId].tsx
  quiz/[sessionId].tsx
  settings.tsx

components/
  ui/          Button, Card, ProgressBar
  quiz/        QuestionCard, AnswerOption, ExplanationPanel, UHRReferenceCard
  learning/    ChapterCard, Flashcard, AudioButton
  monetization/ AdBanner, PremiumBanner

data/
  chapters.ts  questions.ts  glossary.ts  mockExamConfig.ts

lib/
  quiz/         examGenerator.ts  scoring.ts  answerValidation.ts
  learning/     spacedRepetition.ts  mastery.ts  streaks.ts
  storage/      progressStore.ts  settingsStore.ts
  audio/        speak.ts
  monetization/ ads.ts  premium.ts
  localization/ strings.ts  language.ts

types/
  content.ts   progress.ts   monetization.ts
```

## Backend (post-MVP only)

Add Supabase only when needed for:
- remote content updates without app release
- admin review workflow
- user account sync

Do NOT add a backend for MVP.

## Privacy

- No user accounts in MVP
- All data local only
- Analytics: screen views + quiz completions + crashes (no PII)
- Do NOT collect: citizenship status, immigration details, government ID
