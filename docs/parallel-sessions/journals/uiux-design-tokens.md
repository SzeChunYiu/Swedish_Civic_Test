## Iteration 1 — 2026-05-16
Task: Strict `lib/theme/colors.ts` token atom; typed Notion palette constants with DESIGN.md line citations and required quiz feedback tokens.
Artifacts: `lib/theme/colors.ts`
Verification: `npx tsc --noEmit && echo TS-OK` → TS-OK; `grep -rE "#[0-9a-fA-F]{6}|rgba?\(" components/ app/ 2>/dev/null | grep -v 'theme' | head -5` → no output.
DESIGN.md citations: lines 23-27, 32-41, 46-57, 80-83, 95-113, 121-144, 208-218.
Blocked? no — existing queue still has additional theme atoms for spacing/typography/radius/shadows/motion/index acceptance.
Next: Continue with the next strict theme-token atom in `lib/theme/spacing.ts` without touching app/components.
