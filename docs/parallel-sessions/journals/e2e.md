Lane: E2E
Host/branch: local/main
Task/checklist item: Add one verified end-to-end atom covering the mock exam quiz flow.
Artifacts changed: `tests/e2e/exam-submit-review.spec.ts`.
Verification:
- `npx prettier --check tests/e2e/exam-submit-review.spec.ts` — exit 0.
- `CI=1 timeout 360s npx expo export --platform web --output-dir dist-web --max-workers 2` — exit 0, exported `dist-web` for the current app bundle. Earlier default-worker export attempts hit local resource limits (`timeout 240s npm run build:web:export` exited 124 after printing exported output; `CI=1 timeout 360s npm run build:web:export` exited 7 with `EAGAIN`), so the passing export used explicit worker limiting.
- `env -u LD_LIBRARY_PATH PLAYWRIGHT_BROWSERS_PATH=/projects/hep/fs10/shared/nnbar/billy/csup-runtime/Swedish_Civic_Test/cache/civic-team-build/playwright npm run test:e2e -- exam-submit-review.spec.ts` — first run found a strict locator issue after reaching the result screen; fixed the test to use exact `Exam result`, reran same command, exit 0, 1 passed.
Blocked? no — local default-worker export was resource-limited, but the atom is verified with the max-workers export and focused Playwright pass.
Next suggested validator action: review/accept E2E-MOCK-EXAM-REVIEW-1 as a current E2E atom; consider a stable low-worker export wrapper for shared LUNARC/QA runs.

Lane: E2E
Host/branch: local/main
Task/checklist item: Add one verified end-to-end atom covering the Learn product screen to chapter-detail navigation and source-backed chapter content.
Artifacts changed: `tests/e2e/learn-chapter-navigation.spec.ts`.
Verification:
- `npx prettier --check tests/e2e/learn-chapter-navigation.spec.ts` — exit 0.
- `CI=1 timeout 360s npx expo export --platform web --output-dir dist-web --max-workers 2` — exit 0; exported the current app bundle to `dist-web`.
- `env -u LD_LIBRARY_PATH NODE_OPTIONS='--v8-pool-size=1' PLAYWRIGHT_BROWSERS_PATH=/projects/hep/fs10/shared/nnbar/billy/csup-runtime/Swedish_Civic_Test/cache/civic-team-build/playwright npm run test:e2e -- tests/e2e/learn-chapter-navigation.spec.ts --workers=1` — exit 0, 1 passed. Earlier iterations fixed stale count/strict locator assumptions; one retry hit local Node thread limits before the low-v8-pool rerun.
Blocked? no — final focused E2E pass is green on the freshly exported web bundle.
Next suggested validator action: review/accept E2E-LEARN-CHAPTER-NAV-1 as a current E2E atom covering the Learn screen, chapter details, UHR reference rendering, and return navigation.
