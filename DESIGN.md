# Design System: Claude (Anthropic) — civic adaptation

Adopted 2026-05-17 (operator). Replaces the prior Notion system. The app is
token-driven (lib/theme/colors.ts is the ONLY color source; zero hardcoded
colors in app/ or components/ — keep it that way, acceptance step 6).

## 1. Atmosphere
Warm, unhurried, quietly intellectual — a literary salon, not a cold tech UI.
A parchment canvas that feels like premium paper, warm earthy terracotta accent,
exclusively warm-toned neutrals (every gray has a yellow-brown undertone),
serif headlines for gravitas, generous radii and breathing room.

## 2. Color tokens (authoritative — lib/theme/colors.ts values)
| token | value | role |
|-------|-------|------|
| canvas | #f5f4ed | page background (Parchment) |
| surface | #faf9f5 | cards/elevated (Ivory) |
| surfaceWarm | #e8e6dc | prominent interactive surface (Warm Sand) |
| surfaceMuted | rgba(20,20,19,0.05) | warm translucent secondary |
| text | #141413 | primary text (Near Black, warm) |
| textSoft | #3d3d3a | emphasized secondary |
| textSecondary | #5e5d59 | body secondary (Olive Gray) |
| textDisclaimer | #87867f | captions/disclaimer (Stone Gray) |
| textMuted | #5e5d59 | muted labels |
| textPlaceholder | #b0aea5 | placeholder (Warm Silver) |
| warmDark | #30302e | dark surfaces |
| accent | #c96442 | PRIMARY brand/CTA/correct-highlight (Terracotta) |
| accentActive | #b5502f | pressed accent |
| focus | #3898ec | focus ring ONLY (the single intentional cool color) |
| focusSoft | #f3e7e1 | soft focus fill (warm terracotta tint) |
| badgeBlueBg | #f0eee6 | badge background (warm cream) |
| badgeBlueText | #c96442 | badge text (terracotta) |
| border | #e8e6dc | standard warm border |
| success | #4f7a52 | confirmation (muted warm green) |
| successSoft | #eef2ea | correct-answer background |
| correctBg | #eef2ea | correct background |
| warning | #c8742f | time/warning (warm amber) |
| warningSoft | #f6ece0 | incorrect-answer background |
| incorrectBg | #f6ece0 | incorrect background |
| teal | #4f7a72 | muted teal accent |
| navy | #30302e | secondary dark brand |
| purple | #6b4f63 | muted premium accent |
| pink | #c08293 | muted decorative |
| brown | #523410 | earthy warm accent |

Rule: NO cool blue-grays anywhere except `focus`. No saturated colors beyond
terracotta. Pure white is never a page background.

## 3. Typography
- Headings: a serif (RN/Expo: load a serif e.g. Georgia/"Tinos"/"Lora" via
  expo-font; fallback serif). Single weight 500 for all headings — no 700.
- Body / UI: system sans (Inter/system-ui). Code: monospace ONLY for code.
- Relaxed body line-height 1.6 (literary); tight heading line-height 1.1–1.3.
- Scale (pt approx): hero 32–40 / section 26–28 / card title 20–22 /
  body 16 / caption 14 / label 12 (letter-spacing +0.12).

## 4. Shape & depth
- Radius: cards 8–12, primary buttons 12, pills 9999, hero/media 16–24.
- Depth via warm ring shadows `0 0 0 1px` (warm gray) + whisper drop
  `rgba(0,0,0,0.05) 0 4px 24px` for elevated cards. No heavy shadows.
- Borders are cream/warm-sand, whisper weight.

## 5. Components
- Primary CTA: Terracotta (`accent`) bg, Ivory text, radius 12, ring shadow.
- Secondary: Warm Sand (`surfaceWarm`) bg, `textSoft` text, radius 8.
- Cards: `surface` bg, `border` 1px, radius 8–12, whisper shadow when elevated.
- Quiz correct = `accent`/`correctBg`; incorrect = `warning`/`incorrectBg`.
- Disclaimer text uses `textDisclaimer`, always present on question screens.
- Tap targets >= 44px. a11y labels mandatory (regression bar).

## 6. Do / Don't
DO: parchment canvas, terracotta only for primary signal, warm neutrals,
serif headings weight 500, generous radius, ring/whisper shadows, 1.6 body.
DON'T: cool grays (except focus), bold serif, saturated extra colors, sharp
(<6px) corners, heavy drop shadows, pure-white page bg, hardcoded colors.
