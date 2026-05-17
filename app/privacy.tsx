import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type PrivacyRouteCopy = {
  sections: {
    noAccountRequired: LegalRouteSectionCopy;
    localProgressStorage: LegalRouteSectionCopy;
    adsAndPurchases: LegalRouteSectionCopy;
    adConsent: LegalRouteSectionCopy;
    providerProcessing: LegalRouteSectionCopy;
  };
  title: string;
};

const privacyCopy: Record<AppLanguage, PrivacyRouteCopy> = {
  sv: {
    sections: {
      noAccountRequired: {
        body: 'Appen kräver inget konto, ingen e-postadress, inget telefonnummer och ingen profilregistrering för MVP-studieupplevelsen.',
        title: 'Inget konto krävs',
      },
      localProgressStorage: {
        body: 'Studieframsteg, inställningar, bokmärken, misstag, XP, streaks och ljudinställningar sparas lokalt på enheten så att appen kan komma ihåg din övningsstatus.',
        title: 'Lokal lagring av framsteg',
      },
      adsAndPurchases: {
        body: 'Gratisappen finansieras med annonser på studieskärmar via Google Mobile Ads. Tidsatta provskärmar är annonsfria. Ta bort annonser är ett engångsköp utan förbrukning för 29 SEK som sätter adsDisabled=true på den här enheten och kan återställas via butiken.',
        title: 'Annonser och köp',
      },
      adConsent: {
        body: 'På iOS begärs App Tracking Transparency innan spårningsbaserad annonsering. Där det krävs visas Google UMP consent-formuläret innan riktiga AdMob-annonser visas. Annonser kan blockeras eller begäras som icke-personanpassade annonser när samtyckesbeslutet inte tillåter personanpassad annonsering.',
        title: 'Annonssamtycke',
      },
      providerProcessing: {
        body: 'Google Mobile Ads och appbutikerna kan behandla enhets-, annonserings-, samtyckes- och köpstatusinformation för att visa annonser, tillämpa Ta bort annonser och återställa köp. Appen samlar inte in medborgarskapsstatus, detaljer om migrationsärenden, myndighets-ID eller kontoprofiler.',
        title: 'Leverantörers behandling',
      },
    },
    title: 'Integritetspolicy',
  },
  en: {
    sections: {
      noAccountRequired: {
        body: 'The app does not require an account, email address, phone number, or profile registration for the MVP study experience.',
        title: 'No account required',
      },
      localProgressStorage: {
        body: 'Study progress, settings, bookmarks, mistakes, XP, streaks, and audio preferences are stored locally on the device so the app can remember your practice state.',
        title: 'Local progress storage',
      },
      adsAndPurchases: {
        body: 'The free app is ad-supported on study screens through Google Mobile Ads. Timed mock exam screens stay ad-free. Remove Ads is a one-time non-consumable purchase for 29 SEK that sets adsDisabled=true on this device and can be restored through the store.',
        title: 'Ads and purchases',
      },
      adConsent: {
        body: 'On iOS, App Tracking Transparency is requested before tracking-based advertising. Where required, the Google UMP consent form is shown before real AdMob serving. Ads may be blocked or requested as non-personalized ads when the consent decision does not allow personalized ad serving.',
        title: 'Ad consent',
      },
      providerProcessing: {
        body: 'Google Mobile Ads and the app stores may process device, advertising, consent, and purchase status information to serve ads, apply Remove Ads, and restore purchases. The app does not collect citizenship status, immigration case details, government IDs, or account profiles.',
        title: 'Provider processing',
      },
    },
    title: 'Privacy policy',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const copy = privacyCopy[language];

  return (
    <LegalPage title={copy.title}>
      <LegalSection title={copy.sections.noAccountRequired.title}>
        {copy.sections.noAccountRequired.body}
      </LegalSection>
      <LegalSection title={copy.sections.localProgressStorage.title}>
        {copy.sections.localProgressStorage.body}
      </LegalSection>
      <LegalSection title={copy.sections.adsAndPurchases.title}>
        {copy.sections.adsAndPurchases.body}
      </LegalSection>
      <LegalSection title={copy.sections.adConsent.title}>
        {copy.sections.adConsent.body}
      </LegalSection>
      <LegalSection title={copy.sections.providerProcessing.title}>
        {copy.sections.providerProcessing.body}
      </LegalSection>
    </LegalPage>
  );
}
