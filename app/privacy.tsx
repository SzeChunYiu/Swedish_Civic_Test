import { LegalPage, LegalSection } from '../components/compliance/LegalPage';

export default function Screen() {
  return (
    <LegalPage title="Privacy policy">
      <LegalSection title="No account required">
        The app does not require an account, email address, phone number, or profile registration
        for the MVP study experience.
      </LegalSection>
      <LegalSection title="Local progress storage">
        Study progress, settings, bookmarks, mistakes, XP, streaks, and audio preferences are stored
        locally on the device so the app can remember your practice state.
      </LegalSection>
      <LegalSection title="Ads and purchases">
        The current implementation uses placeholders for ads and premium flags. If live ad or
        purchase SDKs are enabled later, this page and store privacy labels must be updated before
        release.
      </LegalSection>
    </LegalPage>
  );
}
