# Swedish Citizenship Civic Test Prep App — Project Plan

Prepared: 2026-05-15

This zip contains a Claude Code–friendly project plan for building a bilingual Android + iOS app that helps users prepare for the Swedish citizenship civic knowledge test.

## Product goal

Build a trustworthy, low-cost, non-AI learning app for Swedish citizenship civic test preparation.

The app should feel like:

- a driving-license written-test prep app,
- a Duolingo-style daily practice app,
- a flashcard/mistake-review trainer,
- and a clear bilingual Swedish/English study guide.

## Important positioning

The app must be clearly positioned as an **independent study tool**.

Use this disclaimer throughout the app and store pages:

> This app is an independent study tool for the Swedish citizenship civic test. It is not official and is not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice questions are created for learning purposes and are not real exam questions.

## Source foundation

Primary source:

- UHR, `Sverige i fokus: Utbildningsmaterial till medborgarskapsprov`
- UHR page: https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/
- PDF: https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf

UHR states that the civic test will be based on this material. The app should keep all exam-prep questions traceable to UHR material.

## Files in this package

| File | Purpose |
|---|---|
| `CLAUDE.md` | Claude Code project instructions |
| `01_project_plan.md` | Full project plan |
| `02_product_requirements.md` | Product requirements document |
| `03_technical_architecture.md` | Recommended mobile architecture |
| `04_content_strategy.md` | How to create 500–800 questions safely |
| `05_database_schema.md` | Content and progress data models |
| `06_learning_and_gamification.md` | Game mechanics and learning design |
| `07_audio_plan.md` | Swedish audio without AI costs |
| `08_monetization_ads.md` | AdMob and premium strategy |
| `09_publishing_checklist.md` | Android and iOS launch checklist |
| `10_roadmap_and_tasks.md` | Phased implementation plan |
| `11_sample_question_templates.md` | Reusable question templates |
| `12_reference_sources.md` | Official references and research sources |
| `13_legal_and_compliance.md` | Copyright, affiliation, privacy, and policy risks |
| `14_mvp_scope.md` | What to build first |
| `15_admin_content_workflow.md` | How to manage question creation and review |

## Recommended MVP

- React Native + Expo + TypeScript
- Android + iOS
- Swedish/English content toggle
- 500 UHR-based questions at launch
- Short explanations in Swedish and English
- UHR reference per question
- Mock exams
- Mistake review
- Streaks, XP, levels
- Swedish audio via device TTS first
- Google AdMob
- Optional premium ad-free upgrade
- No AI features inside the app
