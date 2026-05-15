# 2026-05-15 — Batch 8 audio controls

## Added

- TDD coverage for building Swedish speech text from a question and its answer options.
- Audio helper now reads the Swedish question plus Swedish answer options with `sv-SE` speech.
- Audio button stops any current speech before starting a new readout.
- Practice screen uses the saved audio setting to enable or disable the speaker button.
- Roadmap Phase 6 marks implemented audio tasks while leaving device testing open.

## Verification

- RED: `node --test scripts/audio.test.js` failed before `buildQuestionSpeechText` existed.
- GREEN: `npm run validate` passes, including learning, exam, audio, lint, format, typecheck, and content validation.
- Expo web + Playwright: `/practice` showed `Listen`; clicking it produced no browser errors. `/settings` toggled audio to disabled, and `/practice` then showed `Audio disabled`.
- Not yet verified on Android or iOS devices.
