# Public support and privacy page copy

This copy is ready to publish on the final public website before App Store
Connect or Google Play submission. Replace the URL placeholders with the hosted
addresses in both store records and in the release evidence file.

## Intended store fields

| Store field | Final value |
|---|---|
| Support URL | `https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/` |
| Privacy Policy URL | `https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/` |

## Support URL page copy

# Sweden Citizenship Test Prep support

Sweden Citizenship Test Prep is an independent study app for Swedish civic
knowledge practice. It is not official and is not affiliated with UHR,
Skolverket, Migrationsverket, or the Swedish government.

Contact support if you find:

- a content issue,
- confusing Swedish wording,
- a broken source reference,
- an audio problem,
- a study-flow bug, or
- a store/build issue.

Please include no personal data, government identifiers, immigration case
details, or sensitive account information in support messages.

Support can help with app functionality and content corrections, but cannot
provide official exam answers, migration advice, or government decisions.

## Privacy Policy URL page copy

# Sweden Citizenship Test Prep privacy policy

The MVP app requires no account, email address, phone number, or profile
registration.

Study progress, settings, mistakes, XP, streaks, badges, bookmarks, and audio
preferences are stored locally on the device. The current MVP privacy posture is
that no user data is collected by the app and no user data is shared by the app.

The native build includes Google Mobile Ads test configuration, but real ad
rendering is disabled for the v1.0 release candidate. If real ad requests,
purchase, analytics, crash-reporting, or support SDKs are enabled later, this
privacy policy, Apple privacy labels, Google Play Data safety answers, and
in-app privacy copy must be reviewed and updated before submission.

## Hosting checklist

- [x] Upload `publishing/public-site/support/index.html` and
      `publishing/public-site/privacy/index.html` to the chosen public host.
- [x] Publish these pages on a public HTTPS URL.
- [x] Confirm the pages are reachable without login.
- [x] Confirm the hosted text still says no account and no personal data.
- [ ] Enter the Support URL in App Store Connect and Google Play Console.
- [ ] Enter the Privacy Policy URL in App Store Connect and Google Play Console.
- [x] Record final URLs in `reports/release-evidence-2026-05-15.md`.
