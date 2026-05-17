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
        The free app is ad-supported on study screens through Google Mobile Ads. Timed mock exam
        screens stay ad-free. Remove Ads is a one-time non-consumable purchase for 29 SEK that sets
        adsDisabled=true on this device and can be restored through the store.
      </LegalSection>
      <LegalSection title="Ad consent">
        On iOS, App Tracking Transparency is requested before tracking-based advertising. Where
        required, the Google UMP consent form is shown before real AdMob serving. Ads may be blocked
        or requested as non-personalized ads when the consent decision does not allow personalized
        ad serving.
      </LegalSection>
      <LegalSection title="Provider processing">
        Google Mobile Ads and the app stores may process device, advertising, consent, and purchase
        status information to serve ads, apply Remove Ads, and restore purchases. The app does not
        collect citizenship status, immigration case details, government IDs, or account profiles.
      </LegalSection>
    </LegalPage>
  );
}
