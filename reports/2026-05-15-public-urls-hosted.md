# Hosted public URLs — 2026-05-15

## Purpose

Resolve the public support/privacy URL release blocker with hostable static pages
that can be entered in App Store Connect and Google Play Console.

## Public site repository

- Repository: https://github.com/Babbloo-studio/Swedish_Civic_Test-public-site
- Visibility: public
- GitHub Pages URL: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/
- Source: copied from `publishing/public-site/`

## Verified URLs

- Support URL: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/
- Privacy Policy URL: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/

Verification command:

```bash
curl -L https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/
curl -L https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/
```

Observed on 2026-05-15: both URLs returned HTTP 200 and contained the expected
page titles (`Sweden Citizenship Test Prep support` and `Sweden Citizenship Test
Prep privacy policy`).

## Scope and limitation

These URLs resolve the public support/privacy hosting gate and `public-urls` is marked READY in `reports/release-gates.json`. They must still be entered into App Store Connect and Google Play Console after those store records exist.
