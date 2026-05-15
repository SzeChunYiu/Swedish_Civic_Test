# 09 — Android and iOS Publishing Checklist

## Developer accounts

### Android

- Create Google Play Developer account.
- Create app in Google Play Console.
- Set package name.
- Prepare Data Safety form.
- Prepare content rating.
- Prepare app access instructions if needed.
- Prepare privacy policy URL.

### iOS

- Join Apple Developer Program.
- Create app in App Store Connect.
- Set bundle ID.
- Configure app privacy labels.
- Configure in-app purchases if premium is used.
- Prepare TestFlight.

## Required assets

| Asset | Android | iOS |
|---|---:|---:|
| App icon | Yes | Yes |
| Feature graphic | Yes | No |
| Screenshots | Yes | Yes |
| App preview video | Optional | Optional |
| Privacy policy | Yes | Yes |
| Terms of use | Recommended | Recommended |
| Support URL | Recommended | Recommended |
| Marketing URL | Optional | Optional |

## App Store text

### Short description

> Practice for the Swedish citizenship civic test with Swedish questions, English explanations, mock exams, audio, and source references.

### Long description draft

> Sweden Citizenship Test Prep is an independent study app that helps learners prepare for the Swedish citizenship civic knowledge test. Practise chapter by chapter, review mistakes, take mock exams, listen to Swedish question audio, and read clear explanations in Swedish and English.
>
> The app is an independent learning tool and is not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government.

## Screenshots to prepare

1. Home dashboard
2. Chapter list
3. Practice question
4. Answer explanation with UHR reference
5. Mock exam mode
6. Mistake review
7. Progress and streaks
8. Swedish/English toggle

## Privacy policy must cover

- local progress storage,
- ads,
- analytics,
- crash reporting,
- purchases,
- contact/support emails,
- no collection of citizenship application information,
- no government-service processing.

## App review risks

### Risk: Appears official

Mitigation:

- add disclaimer,
- avoid government logos,
- avoid UHR branding,
- avoid official-looking design,
- avoid words like "official" in app name.

### Risk: Misleading exam claims

Mitigation:

- say practice questions,
- not real exam questions,
- no guaranteed pass.

### Risk: Copyright issues

Mitigation:

- do not copy full UHR text,
- use short quotes and references,
- write original explanations,
- link to official UHR material.

### Risk: Ad placement

Mitigation:

- no ads during exams,
- no ads near answer buttons,
- use test ads before launch.

## Android release process

1. Build internal test release.
2. Upload to Google Play internal testing.
3. Test on at least 5 devices.
4. Complete Data Safety form.
5. Complete content rating.
6. Add privacy policy.
7. Add screenshots.
8. Submit closed test if required.
9. Submit production release.

## iOS release process

1. Build iOS app through EAS Build.
2. Upload to App Store Connect.
3. Configure TestFlight.
4. Invite testers.
5. Fix crashes and content issues.
6. Complete privacy labels.
7. Add screenshots.
8. Submit for review.

## Pre-launch testing checklist

- Fresh install works.
- Offline practice works.
- Language toggle works.
- TTS reads Swedish.
- Wrong answers are saved.
- Mock exam completes.
- Ads use production IDs only after approval.
- Test ads removed.
- Premium purchase sandbox tested.
- Privacy policy link works.
- Disclaimer visible.
- App does not crash without internet.
