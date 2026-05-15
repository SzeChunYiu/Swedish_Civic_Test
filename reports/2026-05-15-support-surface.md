# Support surface — 2026-05-15

## Purpose

Prepare the in-app support/feedback surface required before the public store
support URL can be finalized.

## Implemented app surface

- Route: `app/support.tsx`
- Profile legal link: `components/compliance/ComplianceLinks.tsx`
- Test: `scripts/compliance-pages.test.js`

## Support guidance included in app

- Users can report a content issue, confusing Swedish wording, broken source
  reference, audio problem, or study-flow bug.
- Users are told to include no personal data, government identifiers,
  immigration case details, or sensitive account information.
- The page restates that the app is an independent study tool and cannot provide
  official exam answers, migration advice, or government decisions.
- The page explicitly records that the public support URL and contact mailbox
  remain release checklist items before production submission.

## Verification

- `npm run validate` passed with `scripts/compliance-pages.test.js` covering the
  support route and profile legal link.
- Expo web smoke on `http://127.0.0.1:19006/support` rendered the support page,
  content-issue guidance, no-personal-data guidance, and profile back link.
- Browser console had 0 errors and 1 known React Native web `pointerEvents`
  deprecation warning.

## Remaining external gate

The in-app support surface is code-complete, but the store support URL is not
complete until a public page/mailbox exists and the same URL is entered in App
Store Connect and Google Play Console.
