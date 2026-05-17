# Design System: Swedish (clean Scandinavian)

Adopted 2026-05-17 (operator). Flag-inspired but premium & accessible — NOT
garish primary flag colours. Token-driven (lib/theme/colors.ts is the only
color source; zero hardcoded colors in app/ or components/).

## 1. Atmosphere
Calm, trustworthy, Scandinavian. Cool light canvas, confident Swedish blue as
the single primary, warm gold reserved for reward/highlight moments (XP,
streaks, badges, selected). Crisp type hierarchy, generous whitespace, subtle
depth — feels like a well-made Nordic civic product, not a flag.

## 2. Color tokens (authoritative — lib/theme/colors.ts)
| token | value | role |
|-------|-------|------|
| canvas | #f5f7fa | page background (cool light) |
| surface | #ffffff | cards |
| surfaceWarm | #eaf0f7 | panels / secondary surface |
| text | #0b1f33 | primary text (deep navy near-black) |
| textSecondary | #44586b | secondary text |
| textDisclaimer | #6b7c8c | disclaimer/caption |
| textPlaceholder | #9aa9b6 | placeholder |
| accent | #006aa7 | PRIMARY (Swedish blue) — CTAs, correct, progress, links |
| accentActive | #00537f | pressed primary |
| focus | #2f80ed | focus ring |
| badgeBlueBg / badgeBlueText | #fff3cf / #8a6a00 | GOLD accent — XP/streak/badges |
| border | #dbe3ec | standard border |
| success/correctBg | #1e874b / #e6f4ec | correct answer |
| warning/incorrectBg | #c77700 / #fdf0dd | incorrect (amber, distinct from gold) |
| navy | #003a5c | deep blue, secondary brand / headers |

Rules: blue is the ONLY primary; gold ONLY for reward/highlight (never body
text — fails contrast); all text >= WCAG AA on its background; never pure-black
text; no hardcoded colors anywhere.

## 3. Typography
Clean sans (Inter/system-ui) for everything; strong size/weight hierarchy
(hero 30-38 / section 24-26 / card 19-21 / body 16 / caption 13-14). Optional
serif allowed for large display headings only. Body line-height ~1.55.

## 4. Shape & depth
Radius: cards 12-16, buttons 10-12, pills 9999. Soft elevation: 1px border
(#dbe3ec) + whisper shadow rgba(11,31,51,0.06) 0 6px 20px for raised cards.
No heavy/dark shadows. Tap targets >= 44px.

## 5. Per-screen information
Each screen shows ONE primary thing + minimal supporting context. Remove
clutter, redundant labels, decorative-but-empty panels. Strong visual
hierarchy: title > primary action > supporting. Disclaimer compact but present
on question screens. (See PANEL-OPT priority in codex-tasks.)

## 6. Do / Don't
DO: blue primary, gold sparingly for reward, AA contrast, generous spacing,
soft depth, tokenized colors, motion per motion priority (a11y-safe).
DON'T: large flat #FECC02/#006AA7 flag blocks, gold text, pure-black text,
hardcoded colors, clutter, heavy shadows, sharp (<8px) corners.
