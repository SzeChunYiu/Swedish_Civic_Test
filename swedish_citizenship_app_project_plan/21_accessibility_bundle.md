# 21 — Accessibility Bundle

Status: BLUEPRINT
**Free for everyone — accessibility is never paywalled.** This is the
single load-bearing principle of this blueprint; any reviewer that finds a
Pro gate on any feature here MUST file a `--severity blocker` finding.
Depends on: existing `lib/theme/` tokens, `lib/audio/speak.ts`, `lib/storage/settingsStore.ts`
Owners: `MANAGER-uiux` (font + text size + theme), `MANAGER-build` (TTS rate), `MANAGER-content` (settings copy)
Reviewer personas: dyslexic L2-learner, presbyopic 60+ user, hard-of-hearing Swedish-listener, screen-reader user.

## What ships — three accessibility features in one batch

### 21a — Dyslexia-friendly font toggle

Settings toggle: "Easy-read font". Switches the body font family to
**Atkinson Hyperlegible** (open-licensed, designed by the Braille Institute
specifically for low-vision + dyslexic readers — better evidence base than
OpenDyslexic). Falls back to the system font on platforms where loading
fails.

Implementation:
- Add Atkinson Hyperlegible via `expo-font` (already a dep — verify).
- Extend `lib/theme/typography.ts` with a `useEasyReadFont` resolver that
  swaps the family at the root.
- Persist toggle in `lib/storage/settingsStore.ts` (`easyReadFont: boolean`).
- Apply at app shell so every Text inherits (don't ask every component to
  opt in).

### 21b — Adjustable text size (4 steps)

Settings stepper: **Compact / Standard / Large / Extra-large**.
Maps to a font-scale multiplier {0.9, 1.0, 1.15, 1.35}.

- Applied via React Native's `allowFontScaling` + an app-level
  `accessibilityFontScale` token (NOT iOS Dynamic Type alone — we want
  consistent control across platforms and we want the user's choice to
  override system-tiny if they explicitly chose Extra-large).
- Inputs + form fields tested at all 4 sizes; the largest size must not
  overflow primary CTAs (use `flex-wrap` not truncation on buttons).
- Persist as `fontSizeStep: 0 | 1 | 2 | 3`.

### 21c — Slow-down audio playback rate (Swedish TTS)

L2 Swedish learners need slower speech to parse civic terminology.
Settings: **0.5× / 0.75× / 1.0× / 1.25×** (defaults to 1.0×).

- `lib/audio/speak.ts` already exists; extend `speakSwedish` to pass a
  `rate` parameter from a new setting `audioPlaybackRate`.
- Surface a quick toggle inside the audio button popover (long-press the
  speaker icon) so users can dial it down per-question without diving into
  settings.
- Test that 0.5× rate is supported by both expo-speech backends (iOS
  AVSpeechSynthesizer + Android TTS engine — both support rate, though
  Android's range is engine-dependent; clamp to engine-reported range).

## Acceptance test (executable)

```bash
# 21a — easy-read font wired
grep -qE "Atkinson|easyReadFont" lib/theme/typography.ts
grep -qE "easyReadFont" lib/storage/settingsStore.ts
grep -qE "easyReadFont|Easy.read font|Lättläst" app/settings.tsx

# 21b — font size stepper
grep -qE "fontSizeStep|accessibilityFontScale" lib/storage/settingsStore.ts
grep -qE "fontSizeStep|Text size|Textstorlek" app/settings.tsx

# 21c — audio rate
grep -qE "audioPlaybackRate|rate:" lib/audio/speak.ts
grep -qE "audioPlaybackRate|Audio speed|Uppläsningshastighet" app/settings.tsx

# 21d — NO Pro gate on ANY of these (the load-bearing invariant)
! grep -qE "hasProEntitlement.*easyReadFont|easyReadFont.*hasProEntitlement" components/ -r
! grep -qE "hasProEntitlement.*fontSizeStep|fontSizeStep.*hasProEntitlement" components/ -r
! grep -qE "hasProEntitlement.*audioPlaybackRate|audioPlaybackRate.*hasProEntitlement" components/ -r

# 21e — text-size + easy-read are reflected in the design-token system
grep -qE "fontFamily.*easyRead|easyReadFontFamily" lib/theme/

# tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/theme/`, `lib/audio/`, `lib/storage/settingsStore.ts`,
`app/settings.tsx`, `app/_layout.tsx` (shell-level font apply),
`components/` (Text + Button verifying largest size doesn't overflow),
`tests/a11y/`.

## Reviewer hooks

- `--kind a11y` — dyslexic-L2 persona: read a full chapter at Easy-read +
  Large, no reflow bugs, contrast WCAG AA.
- `--kind a11y` — presbyopic persona: at Extra-large, every CTA still
  tappable, no clipped labels.
- `--kind a11y` — screen reader (TalkBack + VoiceOver) announces correct
  font/size when user changes settings ("Easy-read font on").
- `--kind functional` — 0.5× Swedish TTS is intelligible (not mangled by
  rate). Record a sample for QA evidence.
- `--kind functional` — settings persist across relaunch.

## Out of scope

- Full theming engine (more themes beyond light/dark/sepia) — sepia mode
  is already a P-level item in delight; out of scope here.
- OS-level accessibility integration (VoiceOver rotor customization, etc.)
  beyond standard `accessibilityRole`/`accessibilityLabel`/`accessibilityHint`.
- OpenDyslexic font specifically — we picked Atkinson Hyperlegible because
  the research is stronger; if a reviewer disagrees, file `--kind functional`
  with cited evidence.
