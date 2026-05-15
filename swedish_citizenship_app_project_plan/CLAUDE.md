# Claude Code Instructions

You are helping build a React Native / Expo mobile app for Swedish citizenship civic test preparation.

## High-level goal

Create a bilingual Swedish/English learning app for Android and iOS.

The app helps users prepare for the Swedish citizenship civic knowledge test using UHR's public study material as the core reference.

## Non-negotiable constraints

1. Do not implement AI/chatbot/generative features.
2. Keep the app low-cost to operate.
3. App must work on both Android and iOS from one codebase.
4. Content must support Swedish and English.
5. Exam-mode questions should appear in Swedish by default.
6. Every published exam-prep question must have:
   - Swedish question
   - English translation
   - Swedish options
   - English options
   - correct answer
   - Swedish explanation
   - English explanation
   - UHR reference metadata
   - short UHR quote or paraphrase
   - review status
7. Add an independent-app disclaimer.
8. Do not make the app appear official or government-affiliated.
9. Do not copy the full UHR material into the app.
10. Ads must not interrupt question answering or mock exam mode.

## Preferred stack

Use:

- React Native
- Expo
- TypeScript
- Expo Router
- Zustand or Redux Toolkit for state
- SQLite or bundled JSON for local content in MVP
- Supabase later if remote sync/admin is needed
- expo-speech for device text-to-speech
- AdMob SDK via a maintained Expo-compatible package or config plugin
- RevenueCat later for premium purchases

## App modes

### Study Mode

- Swedish + English display
- explanations visible after answering
- source reference visible
- optional speaker button for Swedish text
- hints allowed

### Exam Mode

- Swedish-only by default
- timed
- no hints
- no ads during exam
- results at end
- explanations after completion

## Folder structure suggestion

```txt
app/
  (tabs)/
    index.tsx
    learn.tsx
    practice.tsx
    mock-exam.tsx
    mistakes.tsx
    profile.tsx
  question/[id].tsx
  chapter/[id].tsx
components/
  QuestionCard.tsx
  AnswerOption.tsx
  ExplanationPanel.tsx
  UHRReferenceCard.tsx
  ProgressBar.tsx
  XPBadge.tsx
  AudioButton.tsx
data/
  chapters.ts
  questions.sample.ts
lib/
  scoring.ts
  spacedRepetition.ts
  examGenerator.ts
  localization.ts
  storage.ts
types/
  content.ts
  progress.ts
```

## First implementation milestone

Build a working local prototype with:

1. Home screen
2. Chapter list
3. Practice quiz for one chapter
4. Answer explanation screen
5. UHR reference card
6. Mistake tracking
7. Basic progress
8. Swedish/English toggle
9. Audio button using device TTS
10. Mock exam using sample questions

## Design tone

Trustworthy, calm, modern, and friendly.

Avoid:
- official-looking government branding,
- UHR colors/logos,
- excessive ads,
- exaggerated claims,
- "guaranteed pass" language.

## Content notes

Use sample data first. Do not generate or include hundreds of questions directly in code until the schema is stable.

Every real question should pass content review before being published.
