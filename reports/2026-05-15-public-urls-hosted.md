# Hosted public URLs — 2026-05-15

## Purpose

Resolve the public support/privacy URL release blocker and the AdMob
`app-ads.txt` hosting blocker with a single public GitHub Pages bundle.

## Public site repository

- Repository: https://github.com/SzeChunYiu/Swedish_Civic_Test-public-site
- Visibility: public
- GitHub Pages URL: https://szechunyiu.github.io/Swedish_Civic_Test-public-site/
- Source: copied from `publishing/public-site/`
- Latest public-site app-ads commit: `d68694f95618abe3097ae4c6e4c14bee6115a24a`

## Verified URLs

- Support URL: https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/
- Privacy Policy URL: https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/
- AdMob app-ads.txt URL: https://szechunyiu.github.io/Swedish_Civic_Test-public-site/app-ads.txt

Verification command:

```bash
curl -L https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/
curl -L https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/
node scripts/check-public-urls.js \
  https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/ \
  https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/ \
  --expect-app-ads-file \
  https://szechunyiu.github.io/Swedish_Civic_Test-public-site/app-ads.txt \
  publishing/public-site/app-ads.txt
```

Observed on 2026-05-16: both SzeChunYiu URLs returned HTTP 200 and contained the expected
page titles (`Sweden Citizenship Test Prep support` and `Sweden Citizenship Test
Prep privacy policy`).

Observed on 2026-05-19: the root `app-ads.txt` URL returned HTTP 200 from
SzeChunYiu GitHub Pages and matched exactly
`google.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0`.

## Scope and limitation

These URLs resolve the public support/privacy/app-ads hosting gate and
`public-urls` is marked READY in `reports/release-gates.json`. The support and
privacy URLs must still be entered into App Store Connect and Google Play
Console after those store records exist.
