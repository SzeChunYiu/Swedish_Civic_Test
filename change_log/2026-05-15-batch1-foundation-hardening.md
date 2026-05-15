# 2026-05-15 — Batch 1 foundation hardening

## Added

- `scripts/validate-content.js` and npm scripts `validate:content` / `validate`.
- Missing architecture placeholders:
  - `data/glossary.ts`
  - `data/mockExamConfig.ts`
  - `types/progress.ts`
  - `types/monetization.ts`
- Root `README.md` with setup, status, commands, and disclaimer.

## Verification

Run before accepting this batch:

```bash
npm ci
npm run validate
```

Optional UI smoke:

```bash
npx expo start --web --port 19006
```
