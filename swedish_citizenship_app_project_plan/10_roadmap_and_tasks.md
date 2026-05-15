# 10 — Roadmap and Tasks

## Phase 0 — Setup

Tasks:

- [x] Choose final app name.
- [x] Create Git repository.
- [x] Create Expo project.
- [x] Add TypeScript.
- [x] Add Expo Router.
- [x] Add linting and formatting.
- [x] Set up basic folder structure.
- [x] Add README and project docs.

## Phase 1 — Content schema and sample data

Tasks:

- [x] Define `Chapter` type.
- [x] Define `PracticeQuestion` type.
- [x] Define `UHRReference` type.
- [x] Create 13 chapter records.
- [x] Create 20 sample questions.
- [x] Add Swedish/English fields.
- [x] Add UHR reference fields.
- [x] Add review status.
- [x] Add validation script.

Acceptance criteria:

- App can load sample chapters and questions.
- TypeScript catches missing content fields.

## Phase 2 — Core app screens

Tasks:

- [x] Build onboarding screen.
- [x] Build home dashboard.
- [x] Build chapter list.
- [x] Build chapter detail.
- [x] Build quiz screen.
- [x] Build answer option component.
- [x] Build explanation screen.
- [x] Build UHR reference card.
- [x] Build settings screen.

Acceptance criteria:

- User can complete a practice quiz from one chapter.
- Explanation appears after each answer.

## Phase 3 — Progress and storage

Tasks:

- [x] Add local storage.
- [x] Track seen/correct/wrong counts.
- [x] Track current streak.
- [x] Track daily goal.
- [x] Track chapter mastery.
- [x] Track bookmarked questions.
- [x] Build mistake review screen.

Acceptance criteria:

- Progress remains after app restart.
- Mistakes appear in mistake review.

## Phase 4 — Learning mechanics

Tasks:

- [x] Add XP system.
- [x] Add level calculation.
- [x] Add daily goal.
- [x] Add streak logic.
- [x] Add spaced repetition logic.
- [x] Add weak-topic detection.
- [x] Add badges.

Acceptance criteria:

- User receives XP.
- Daily goal can be completed.
- Weak chapters are shown on home screen.

## Phase 5 — Mock exam

Tasks:

- [x] Create exam generator.
- [x] Select only `uhr_based` questions by default.
- [x] Add timer.
- [x] Add exam result screen.
- [x] Add chapter breakdown.
- [x] Hide explanations until end.
- [x] Disable ads during exam.

Acceptance criteria:

- User can complete a timed mock exam.
- Results show score and weak chapters.

## Phase 6 — Audio

Tasks:

- [x] Add `expo-speech`.
- [x] Build `AudioButton`.
- [x] Speak Swedish question.
- [x] Speak Swedish answer options.
- [x] Add settings for audio.
- [ ] Test on Android.
- [ ] Test on iOS.

Acceptance criteria:

- Speaker button reads Swedish text with `sv-SE`.

## Phase 7 — Content production

Tasks:

- [x] Create content spreadsheet/database.
- [x] Map UHR chapters and sections.
- [x] Produce first 100 questions.
- [x] Review first 100 questions.
- [x] Import first 100 into app.
- [ ] Produce next 400 questions.
- [ ] Review all questions.
- [ ] Mark 500 questions as published.

Acceptance criteria:

- 500 published, reviewed questions.
- Every question has UHR reference metadata.

## Phase 8 — Ads and premium

Tasks:

- [ ] Create AdMob account/app.
- [x] Add test ad units.
- [x] Implement banner/native ad.
- [x] Implement interstitial after quiz completion.
- [x] Ensure no ads during exam.
- [x] Add premium flag.
- [ ] Add RevenueCat later if needed.

Acceptance criteria:

- Ads appear only in safe placements.
- Premium can disable ads.

## Phase 9 — Compliance and publishing

Tasks:

- [x] Add disclaimer page.
- [x] Add privacy policy.
- [x] Add terms of use.
- [x] Add source page with UHR links.
- [x] Prepare App Store listing.
- [x] Prepare Google Play listing.
- [x] Complete privacy labels.
- [x] Complete Data Safety form.
- [ ] TestFlight beta.
- [ ] Google Play internal test.

## Phase 10 — Launch

Tasks:

- [ ] Submit Android app.
- [ ] Submit iOS app.
- [ ] Monitor crash reports.
- [ ] Monitor content reports.
- [ ] Fix first-week issues.
- [ ] Ask satisfied users for reviews.
- [ ] Plan version 1.1.

## Version 1.1 ideas

- Human-recorded glossary audio.
- More mock exams.
- More question types.
- Printable study checklist.
- Better onboarding.
- More languages later.
- Remote content updates.
