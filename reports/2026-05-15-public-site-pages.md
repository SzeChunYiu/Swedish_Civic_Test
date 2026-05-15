# Public support/privacy static pages — 2026-05-15

## Purpose

Prepare the public pages that App Store Connect and Google Play require for
support and privacy URLs.

## Artifacts

- `publishing/public-site/support/index.html`
- `publishing/public-site/privacy/index.html`
- `publishing/public-support-and-privacy.md`

## Verification

- `npm run test:publishing` verifies the hostable support and privacy pages
  exist and contain the required independent-app, no-personal-data, no-account,
  local-storage, and no-data-collected language.
- `npm run validate` includes this publishing test.
- Local static-host smoke with `python3 -m http.server 8099 --directory
  publishing/public-site` and `curl` confirmed `/support/` and `/privacy/`
  serve the expected support, privacy, no-personal-data, no-account, and
  no-data-collected text.

## Remaining external gate

The HTML pages are ready to upload, but the release is still blocked until they
are served from public HTTPS URLs and those URLs are entered into App Store
Connect and Google Play Console.
