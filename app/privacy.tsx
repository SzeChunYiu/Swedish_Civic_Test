import { LegalPage, LegalSection } from '../components/compliance/LegalPage';

export default function Screen() {
  return (
    <LegalPage title="Privacy policy">
      <LegalSection title="Anonymous use by default">
        No account is required. The app works without sign-in. Study progress, settings, bookmarks,
        mistakes, XP, streaks, and audio preferences are stored locally on your device.
      </LegalSection>
      <LegalSection title="Optional sign-in">
        You may optionally sign in with Google, Facebook, or Apple to sync your progress across
        devices and to tie your Remove-Ads purchase to your account. When you sign in we receive
        from your chosen provider: your email address, a stable user identifier, and (if you
        permit) your display name. We do not receive your password.
      </LegalSection>
      <LegalSection title="Where signed-in data is stored">
        When you are signed in, your profile, study progress, and entitlement state are stored in
        Supabase (PostgreSQL) hosted in the EU (eu-central-1, Frankfurt). Row-Level Security
        policies ensure each user can read and write only their own rows. We never receive or store
        your sign-in provider password.
      </LegalSection>
      <LegalSection title="Your rights under GDPR">
        You may request export or deletion of your account data at any time by contacting us via
        the Support screen. Deleting your account removes your profile, progress, and entitlement
        rows from our database. Locally stored progress on your device can be cleared by
        uninstalling the app or using the in-app reset option (when available).
      </LegalSection>
      <LegalSection title="Ads">
        On mobile, the app uses Google Mobile Ads (AdMob). On the web build, the app may use Google
        AdSense. Ads may use a device-level advertising identifier subject to your platform
        consent. Purchasing Remove-Ads disables ad rendering app-wide. If you are signed in, the
        Remove-Ads entitlement is tied to your account and restored on other devices.
      </LegalSection>
      <LegalSection title="No official affiliation">
        This app is an independent study tool. It is not affiliated with, endorsed by, or operated
        by UHR, Skolverket, or Migrationsverket. Questions are study material inspired by the
        publicly available *Sverige i fokus* reference, and are not real exam questions.
      </LegalSection>
    </LegalPage>
  );
}
