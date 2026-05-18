# 15 — Ebook Highlights + Margin Notes

Status: BLUEPRINT
**Blocked by content prerequisite**: `content/` does NOT yet contain long-form chapter ebook bodies — only chapter metadata + practice questions. Highlights need *something to highlight*. The content team must ship ebook chapter bodies (paraphrased from UHR's *Sverige i fokus*, Sv + En) before highlight UI ships.
Depends on: 13_pro_tier.md (multi-color gate), new ebook content
Owners: `MANAGER-content` (ebook bodies — blocking), `MANAGER-build` (selection + store), `MANAGER-uiux` (highlight UI), `MANAGER-i18n` (sv/en parity)
Reviewer personas: highlight-heavy student, dyslexic user, returning user expecting their notes intact.

## What ships

### 15a — Content prerequisite (blocking, content team owns)

Extend `types/content.ts`:

```ts
interface Chapter {
  // ...existing fields...
  bodySv: ChapterBlock[];
  bodyEn: ChapterBlock[];
}

type ChapterBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'callout'; text: string; kind: 'definition' | 'date' | 'tip' }
  | { type: 'list'; items: string[]; ordered: boolean };
```

Block-based, not raw markdown — so selection ranges are stable when content is edited (block id + character offset, not line numbers).

Initial scope: bodies for 5 chapters (covers ~30% of the question set). Remaining chapters land progressively.

### 15b — Highlight + notes (build team)

`lib/storage/highlightsStore.ts` (AsyncStorage, key `ebook.highlights.v1`):

```ts
interface Highlight {
  id: string;
  chapterId: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  note?: string;          // optional margin note
  createdAt: string;
}
```

Free tier: yellow only, no notes. Pro: all 4 colors, notes, PDF/Markdown export.

UI: long-press selection on `<Text>` blocks → popover with 4 color chips (3 locked for Free) + "add note" → save. Tap an existing highlight → edit/remove/note.

Cross-platform note: React Native's selection-on-Text is iOS/Android native but limited on web. Web fallback: range API via `window.getSelection()`; we own this gnarly path because Expo Web is a deploy target.

### 15c — Notes export (Pro)

`scripts/export-highlights.ts` or in-app share sheet:
- PDF: chapter title → highlighted excerpts grouped by color → user notes inline → footer "exported from [App Name]".
- Markdown: same structure as `.md` for users who note-take elsewhere (Obsidian, Notion).

## Acceptance test (executable)

```bash
# 15a — content prerequisite
grep -q "bodySv" types/content.ts
test "$(node -e "console.log(require('./data/chapters').chapters.filter(c => c.bodySv?.length).length)")" -ge 5

# 15b — store + UI
test -f lib/storage/highlightsStore.ts
grep -q "ebook.highlights.v1" lib/storage/highlightsStore.ts
grep -qE "yellow|green|blue|pink" lib/storage/highlightsStore.ts

# Highlight UI wired in chapter screen
grep -qE "highlight|onSelectText" app/chapter/\\[chapterId\\].tsx

# Free-vs-Pro gate on colors
grep -qE "multiColorHighlights|hasProEntitlement" components/ -r

# 15c — export (Pro feature)
test -f scripts/export-highlights.ts || grep -rq "exportHighlights" lib/

# tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`types/content.ts`, `data/chapters.ts`, `lib/storage/`, `components/`, `app/chapter/`, `scripts/`, `tests/storage/`.

## Reviewer hooks

- `--kind functional` — highlight a phrase, kill the app, reopen → highlight persists at exact offsets.
- `--kind functional` — content team edits a chapter body block; existing highlights inside that block survive or are gracefully orphaned (logged, not silently dropped).
- `--kind user-sim` — dyslexic-user persona: contrast of highlight colors on warm-white background passes WCAG AA.
- `--kind language` — Sv + En bodies match in semantic meaning; UHR reference per block stays accurate.
- `--kind data` — every published block has a stable blockId; offset ranges never reference deleted blocks.

## Why this is its own blueprint (not lumped into 13)

Highlights are a **Free-tier feature** — your original ask. The Pro upgrade is the *multi-color* + *notes* + *export*. Putting it in 13 buries the basics behind the paywall, which kills the "feels like a real study tool" pitch the user explicitly wanted.
