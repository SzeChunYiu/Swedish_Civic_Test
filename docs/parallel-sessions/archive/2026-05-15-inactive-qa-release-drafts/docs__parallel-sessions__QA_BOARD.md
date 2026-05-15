> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# QA Board — Sweden Civic Test

Owned by MANAGER-qa. Workers read-only.

## Batch outcome (QA-Batch-1)
- `npm test` passes with >=15 unit specs covering validators, components, hooks.
- `npm run test:e2e` passes 5 golden-path Playwright specs against `npx expo export --platform web` build.
- CI workflow `.github/workflows/test.yml` runs typecheck + lint + unit + e2e on every PR.
- Token-discipline test fails the build if any hardcoded color/spacing is found outside `lib/theme/`.

## Lane lease (disjoint scopes)
| Lane | Writable scope | Owner |
|---|---|---|
| MANAGER-qa | this board + qa-*.txt queues | pane 0 |
| E2E | `tests/e2e/`, first-iter `playwright.config.ts` | pane 1 |
| UNIT | `tests/unit/`, first-iter `jest.config.js` | pane 2 |

## Acceptance checklist
| ID | Requirement | DRI | Status |
|---|---|---|---|
| Q1 | `jest.config.js` + `npm test` works | UNIT | pending |
| Q2 | `playwright.config.ts` + `npm run test:e2e` works | E2E | pending |
| Q3 | Token-discipline test added | UNIT | pending |
| Q4 | 5 golden-path E2E specs (app boot, chapter pick, answer, finish, language) | E2E | pending |
| Q5 | Validator unit tests >=80% coverage | UNIT | pending |
| Q6 | Component tests (Button, OptionCard, PillBadge) | UNIT | pending |
| Q7 | Hook tests (useReducedMotion, useFadeIn, useSpringPress) | UNIT | pending |
| Q8 | CI workflow `.github/workflows/test.yml` | MANAGER-qa (or escalate) | pending |
