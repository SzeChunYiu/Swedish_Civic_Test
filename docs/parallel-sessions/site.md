# Lane: SITE — the deployed product (Vercel)

## Why this lane exists (read this)

**Vercel serves ONLY the `site/` directory** (`vercel.json` →
`outputDirectory: "site"`, static, no build). It does **not** serve the
Expo app (`app/`, `data/`, `components/`). For ~90 minutes the factory
produced excellent content into the Expo app and into
`docs/design/drafts/` while the **deployed site stayed nearly empty** —
users saw none of it. That gap is this lane's job to close and keep
closed.

## Mandate

`site/` must be the **full, well-written, deployed product**:
- **Practice page** (`site/practice.js`) — works, reachable from
  `site/index.html` routing, native-quality copy.
- **Mock-exam page** — full timed exam flow + result UX, reachable.
- **Ebook page** (`site/ebook.js`) — well-written chapters; never
  regress the existing richer `site/ebook.js` (it grew in #154).
- **Questions** (`site/questions.js`) — kept in sync with the canonical
  bank in `data/questions.ts` (the content lane's source of truth).
  When `data/` improves, propagate the improvement into
  `site/questions.js`. They must not drift.
- Copy quality matches the CONTENT/LANGUAGE/voice contracts (native,
  the empathetic FACT-BUBBLE humor, fixed Swedish-flag colors).

## Source of the intended design

`docs/design/drafts/practice-mockexam-2026-05-18/` is the user's
refined Practice + Mock-exam design (+ `uploads/*.png` mockups).
Port it into the live `site/` **reconciling, never clobbering** the
factory's newer `site/ebook.js`/`app.js` progress. The four missing
JS files (practice.js, questions.js, ebook-tools.js, i18n-extras.js)
have been added to `site/`; they still need to be **wired into
`site/index.html` routing + styled** to be reachable.

## Writable scope

- `site/**` (the deployed static site)
- `docs/parallel-sessions/journals/site.md`

Never edit `data/` (read it to sync questions; the content lane owns
writes), `app/`, `components/`, other lanes' docs.

## One iteration

1. Sync per `docs/parallel-sessions.md`.
2. Claim ONE atom from `codex-tasks/site.txt` (e.g.
   `wire Practice route in site/index.html`, `mock-exam page + timer`,
   `sync site/questions.js from data/questions.ts q001-q050`).
3. Implement in `site/`, reconciling with current `site/` (do NOT
   regress #154 ebook or concurrent site work — read git first).
4. Verify: open the static site locally / lint JS; check the route
   actually renders; `git diff --check`. Confirm no `data/`/`app/`
   files were touched.
5. Commit → push → PR → squash-merge (`site: <what>`), handoff to
   `journals/site.md`.

## Stop conditions

Rate limited; a change needs `data/`/app logic (wrong lane → queue it
for content/build, don't reach across); ambiguous design → check the
draft mockups, then `codex-tasks/blockers.txt`.
