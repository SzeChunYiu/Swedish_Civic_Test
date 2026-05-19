# Public support and privacy page copy

This copy is ready to publish on the final public website before App Store
Connect or Google Play submission. Replace the URL placeholders with the hosted
addresses in both store records and in the release evidence file.

## Intended store fields

| Store field        | Final value                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| Support URL        | `https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/` |
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
preferences are stored locally on the device. The app itself still has no
account database, remote progress sync, analytics SDK, crash reporting SDK, or
support form.

The v1.0 native build includes Google Mobile Ads, App Tracking Transparency,
Google UMP consent, and a one-time Remove Ads non-consumable in-app purchase for
29 SEK. Because those SDK and store paths may collect or share data for
advertising, measurement, fraud prevention, purchase handling, consent, and app
functionality, the public privacy posture matches the ad-supported Apple privacy
labels and Google Play Data safety drafts.

Free study screens may show Google Mobile Ads or AdMob placements when real ads
are enabled. Timed mock exam screens stay ad-free. Remove Ads can be restored
through the app store. When a purchase or restore is validated, the app stores
local purchase status on the device with product ID, transaction ID or purchase
token when supplied by the store, and the receipt-validation timestamp. If
analytics, crash reporting, accounts, remote progress sync, or support
collection are enabled later, this privacy policy, Apple privacy labels, Google
Play Data safety answers, and in-app privacy copy must be reviewed and updated
before submission.

## Hosting checklist

- [x] Upload `publishing/public-site/support/index.html` and
      `publishing/public-site/privacy/index.html` to the chosen public host.
- [x] Publish these pages on a public HTTPS URL.
- [x] Confirm the pages are reachable without login.
- [x] Confirm the hosted text says no account, local progress storage, Google
      Mobile Ads, ATT/UMP consent, and the 29 SEK Remove Ads purchase.
- [ ] Enter the Support URL in App Store Connect and Google Play Console.
- [ ] Enter the Privacy Policy URL in App Store Connect and Google Play Console.
- [x] Record final URLs in `reports/release-evidence-2026-05-15.md`.
