# Site audit — 2026-05-18

**Target:** https://dist-web-billy10384-5430s-projects.vercel.app
**Method:** HTTP probe of every route Expo Router exposes; HTML inspection of the deployed `site/index.html`; grep of deployed JS bundles for feature markers.

## P0 finding — the deployed site is NOT the Expo app

The Vercel deployment serves the **hand-written hash-routed SPA** in `site/index.html` (47 KB), not the Expo React Native web export under `dist-web/`. `vercel.json` has `outputDirectory: "site"` so the entire Expo `app/` tree never reaches users on the web.

**Impact:**
Every PROV / ONBOARD / I18N atom shipped over PRs #370, #484, #510, #537, #543, #778 modifies the Expo app (`app/`, `components/`, `lib/`). **None of them are live on the deployed site.** Users see only what `site/*.js` renders.

This means the following user-asked features land on **mobile only** (when the Expo app is built and shipped to stores) and are invisible on the public web URL:

- ✗ Language picker on every route (PR #370) — deployed site has none
- ✗ Provenance badge on every question card (PR #543) — deployed site has no badge
- ✗ "Include supplementary questions" toggle (PR #484) — deployed site has no toggle
- ✗ Mock-exam UHR-only gate (PR #484) — deployed `practice.js`/`mock` JS has no `provenance` filter
- ✗ About-sources expandable panel (PR #510) — deployed site has no panel
- ✗ `/about-the-test` screen (PR #510) — deployed site has no such section
- ✗ ComplianceLinks "About the test" link (PR #537) — deployed site has its own footer
- ✗ First-run modal (PR #778) — deployed site has no modal
- ✗ Wording rules — deployed site doesn't strip "True or false:" prefix at render

**Recommended path forward** (in order of risk):

1. **Audit the static `site/*.js` set** and decide: ship parity manually (port every PROV/ONBOARD/I18N feature into `site/practice.js`, `site/app.js`, etc.) OR retire the static site and switch deployment to `dist-web/` (the Expo web export). Either is substantial work — but the current state is the **worst of both**: features shipped, but never reach the user.
2. **Switch `vercel.json` to deploy `dist-web/`** instead of `site/` — once-off cutover. Run `npm run build:web:export` to produce `dist-web/` first; verify all routes work; flip the config.
3. **Keep both** but make the routes mirror: every Expo screen also exists as a `data-page="/foo"` block in the static site, kept in sync by tests. The factory already has a `tests/content-static-site-question-bank-parity.test.js` enforcing question-bank parity, so the pattern is established.

## HTTP route audit

The Vercel static deployment treats every URL outside `/` as a 404 — there is no SPA fallback rewrite at the rewrite layer that maps unknown paths to `/index.html`. `vercel.json` declares `rewrites: [{source:"/(.*)", destination:"/index.html"}]` so this should work in theory; in practice every Expo path 404s, suggesting either the rewrite isn't applied or static deploys precede the rewrite check.

| Probe | Status | Note |
|---|---|---|
| `/` | 200 | Static landing page |
| `/home` | 404 | Expected: tab Home; not in static site |
| `/learn` | 404 | Expected: tab Learn; not in static site |
| `/practice` | 404 | Static site uses `#/practice` (hash route) |
| `/exam` | 404 | Static site uses `#/mock` |
| `/mistakes` | 404 | Not in static site |
| `/profile` | 404 | Not in static site |
| `/sources` | 404 | Static site uses `#/sources` |
| `/settings` | 404 | Not in static site (gear icon in topbar opens a modal in `app.js`) |
| `/disclaimer` | 404 | Not in static site |
| `/terms` | 404 | Static site uses `#/terms` |
| `/privacy` | 404 | Static site uses `#/privacy` |
| `/support` | 404 | Static site uses `#/support` |
| `/onboarding` | 404 | Not in static site |
| `/about-the-test` | 404 | Shipped today; not in static site |
| `/search` | 404 | Not in static site |
| `/account` | 404 | Not in static site |

## Deployed static site inventory

The deployed `index.html` includes 8 hash-routable sections:

- `#/` (Home)
- `#/practice`
- `#/mock`
- `#/ebook`
- `#/support`
- `#/sources`
- `#/privacy`
- `#/terms`

Loaded JS bundles (all 200):
- `app.js` (~60 KB)
- `practice.js` (~31 KB)
- `settings.js` (~8 KB)
- `ebook.js` (~35 KB)
- `extras.js` (~14 KB)
- `buddies.js` (~31 KB)
- `fx.js` (~6 KB)
- `site.js` (~5 KB)
- `signin.js` — **broken**: 404 on the deployed bundle despite `<script>` reference in `index.html` (or the bundle is referenced in source but not in the deployed manifest)

## Feature-parity grep against deployed `practice.js`

| Marker | Count |
|---|---|
| `provenance` | 0 |
| `supplementary` | 0 |
| `tilläggsfråga` | 0 |
| `uhr-källa` | 0 |
| `about-the-test` | 0 |

Confirms zero PROV/ONBOARD work has been ported to the deployed site.

## Header / footer audit (deployed `index.html`)

- ✓ Brand link present
- ✓ Top nav: Home / Practice / Mock exam / Ebook / Support
- ✓ Settings gear icon (opens modal — implementation in `app.js`)
- ✗ Language picker — missing from topbar (despite PR #370 + #543)
- ✗ "About the test" link — missing from nav or footer
- ✗ Provenance badge — would appear on questions, missing

## Discrepancies in deployed JS

`signin.js` 404 indicates a script tag referencing a bundle that doesn't exist. Should be removed from `site/index.html` or the bundle should be deployed.

## Recommendations

1. **Decision needed**: ship the Expo web export instead of the static landing site, or port features into static JS. Operator owns this.
2. **Quick fix regardless**: remove or fix the broken `signin.js` reference in `site/index.html`.
3. **Quick fix**: add a "Language picker" element to the static topbar (the language toggle CTA matters even on the landing page — users may want EN/SV/zh from the start).
4. **Quick fix**: add an "About the test" entry to the static nav or footer.
5. **If staying with static site**: enforce parity via a test that asserts every PROV/ONBOARD feature has a matching `data-page` block or DOM marker in the deployed HTML.
6. **If switching to Expo web export**: verify `vercel.json` rewrites are actually applied (the current 404s suggest they're not, even with the rewrites declared) and that the rewrites map all Expo routes correctly.

## Findings filing

Per the SITE-AUDIT-1 atom, every finding above should be routed via `.shared/review-to-queue.sh`. This report is the consolidated artifact; downstream queue entries are still owed.

---

Generated by Claude operator session 2026-05-18.
