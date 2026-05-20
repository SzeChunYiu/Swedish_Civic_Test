# Almost Swedish

Independent study app for the Swedish citizenship civic test — for everyone who's *almost* Swedish and just needs to pass the last hurdle. Built with Expo, React Native, TypeScript, Expo Router, Zustand, MMKV, and `expo-speech`.

## Status

Batch 0 foundation is in place:

- Expo + TypeScript app scaffold
- tab navigation and placeholder MVP screens
- practice screen that loads bundled questions
- required independent-app disclaimer on the question screen
- 13 chapter records
- 20 reviewed sample questions from chapters 1-2
- local content validation script

This app is not official and is not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice questions are created for learning purposes and are not real exam questions.

## Local commands

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run validate:content
npm run validate
npx expo start
```

## Key files

- `docs/architecture.md` — stack and target folder structure
- `docs/content-strategy.md` — UHR-based content rules and quality bar
- `DESIGN.md` — Notion-inspired design system
- `data/chapters.ts` — 13 chapter records
- `data/questions.ts` — sample question bank
- `scripts/validate-content.js` — content/schema/disclaimer checks
