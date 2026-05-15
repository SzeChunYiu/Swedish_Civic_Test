# 02 — Product Requirements Document

## Product summary

A bilingual Swedish/English mobile app for preparing for the Swedish citizenship civic knowledge test.

## User stories

### As a learner, I want to study by chapter

So that I can focus on one topic at a time.

Acceptance criteria:

- User can see all chapters.
- Each chapter shows completion progress.
- Each chapter has practice questions.
- Each chapter can have flashcards.

### As a learner, I want Swedish and English

So that I understand the concept while practising Swedish wording.

Acceptance criteria:

- User can switch language support.
- Study Mode can show Swedish and English.
- Exam Mode defaults to Swedish.
- English can be hidden in Exam Mode.

### As a learner, I want explanations after each answer

So that I can learn from mistakes.

Acceptance criteria:

- After answering, the app shows correct/incorrect status.
- Explanation appears in Swedish and/or English.
- UHR reference is shown.
- Wrong answers can show "why wrong" explanations.

### As a learner, I want mock exams

So that I can test readiness.

Acceptance criteria:

- User can start a mock exam.
- Mock exam is timed.
- Mock exam chooses questions across chapters.
- Ads do not appear during mock exam.
- Results screen shows score by chapter.
- Explanations are shown after completion.

### As a learner, I want to review mistakes

So that weak knowledge becomes stronger.

Acceptance criteria:

- Wrongly answered questions are saved.
- Mistake review screen lists weak questions.
- Questions reappear based on spaced repetition.
- User can clear a mistake after repeated correct answers.

### As a learner, I want Swedish audio

So that I can hear civic words and questions.

Acceptance criteria:

- Speaker button reads Swedish text.
- Works offline using device TTS where possible.
- User can enable/disable audio.
- Audio is not required to answer questions.

### As a learner, I want daily goals

So that I stay motivated.

Acceptance criteria:

- User can set daily goal: 5, 10, 20, or 30 questions.
- Streak increases when daily goal is completed.
- Missed day resets streak or uses optional streak freeze later.

## Functional requirements

### FR1 — Onboarding

Show:

1. App purpose.
2. Independent-app disclaimer.
3. Swedish/English support explanation.
4. Study mode vs exam mode.
5. Optional daily goal setup.

### FR2 — Home dashboard

Show:

- daily goal progress,
- continue practice button,
- exam readiness percentage,
- weak chapters,
- current streak,
- XP/level.

### FR3 — Chapter list

Show:

- chapter title in Swedish and English,
- number of questions,
- mastery percentage,
- last practised date.

### FR4 — Quiz engine

Support question types:

- single choice,
- true/false,
- multiple choice later,
- match terms later,
- fill blank later.

MVP can start with single choice and true/false.

### FR5 — Explanation screen

Show:

- result,
- correct answer,
- explanation,
- "why wrong" notes,
- UHR reference,
- save/bookmark button,
- next question button.

### FR6 — UHR reference card

Every published question should include:

- document title,
- publisher,
- chapter,
- section,
- page if known,
- short quote or paraphrase,
- source URL.

### FR7 — Mock exam

MVP mock exam:

- 30–50 questions,
- Swedish-only by default,
- timed,
- no hints,
- no ads,
- results at end.

### FR8 — Mistake review

Track:

- wrong answer count,
- last answered,
- correct streak,
- next review date,
- confidence level optional.

### FR9 — Audio

Use device text-to-speech first.

Potential library:

- `expo-speech`

Swedish locale:

- `sv-SE`

### FR10 — Ads

Use AdMob only in safe locations:

- home,
- results screen,
- between completed quiz sessions,
- optional rewarded unlocks.

Never show ads:

- over answer buttons,
- during a mock exam,
- during answer explanation reading,
- in ways that cause accidental clicks.

### FR11 — Premium

Premium can unlock:

- no ads,
- unlimited mock exams,
- advanced statistics,
- extra challenge modes,
- offline content packs if needed.

## Non-functional requirements

| Requirement | Target |
|---|---|
| Offline access | Practice works offline after install |
| App size | Keep small by using TTS instead of bundled audio |
| Startup | <2 seconds on modern devices |
| Accessibility | Support readable fonts and screen readers |
| Privacy | Collect minimal personal data |
| Reliability | No backend dependency for basic practice |
| Cost | Keep server costs near zero in MVP |

## App screens

1. Onboarding
2. Home
3. Chapter list
4. Chapter detail
5. Practice quiz
6. Explanation
7. Mock exam setup
8. Mock exam question
9. Mock exam result
10. Mistakes
11. Flashcards
12. Profile/progress
13. Settings
14. Premium
15. About/disclaimer
16. Sources
