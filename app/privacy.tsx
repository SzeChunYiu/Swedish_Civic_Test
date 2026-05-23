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
    gdprRights: LegalRouteSectionCopy;
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
        body: 'Den grundläggande studieupplevelsen fungerar utan inloggning. Valfria kontofunktioner i v1.1 kan använda Supabase och Google-inloggning för kontoanknutna funktioner, men lokala studieframsteg sparas fortfarande på enheten som standard.',
        title: 'Konto är valfritt',
      },
      localProgressStorage: {
        body: 'Appen kan spara lokal studiedata på enheten: besvarade och bokmärkta frågor, granskningar av fel svar, övningsprovhistorik, XP, svarshistorik, dagliga utmaningar, studiesviter och svitskydd, repetitionskort och repetitionsdagar, inställningar, tillgänglighetsval, vald studiekompis, checklista för medborgarskapskrav samt e-boksmarkeringar och frivilliga e-boksanteckningar. Lokal studiedataexport och import tar inte med köp-, kvitto- eller annonsrättighetsfält.',
        title: 'Lokal lagring av framsteg',
      },
      gdprRights: {
        body: 'Du kan begära export eller radering av supportmeddelanden du har skickat via Support-skärmen. Lokal studiedata kan exporteras och importeras i Inställningar. Lokalt lagrade framsteg, inställningar, e-boksanteckningar, kravchecklistor och köpstatus kan rensas genom att avinstallera appen eller rensa appdata på enheten.',
        title: 'Dina rättigheter enligt GDPR',
      },
      adsAndPurchases: {
        body: 'Gratisappen finansieras med annonser på studieskärmar via Google Mobile Ads. Tidsatta provskärmar är annonsfria. Ta bort annonser är ett engångsköp för 29 SEK som inte förbrukas; köpet gör att annonser inte visas på den här enheten och kan återställas via appbutiken. För att återställa eller kontrollera köpet sparar appen en lokal köpstatuspost som kan innehålla appbutikens produkt-id, köptoken eller transaktions-id och tidpunkten när kvittot kontrollerades.',
        title: 'Annonser och köp',
      },
      adConsent: {
        body: 'På iOS begärs App Tracking Transparency innan spårningsbaserad annonsering. Där det krävs visas Google UMP-samtyckesformuläret innan riktiga AdMob-annonser visas. Annonser kan blockeras eller begäras som icke-personanpassade annonser när samtyckesbeslutet inte tillåter personanpassad annonsering.',
        title: 'Annonssamtycke',
      },
      providerProcessing: {
        body: 'Google Mobile Ads och appbutikerna kan behandla enhets-, annonserings-, samtyckes- och köpstatusinformation för att visa annonser, tillämpa Ta bort annonser och återställa köp. Om du väljer kontoanknutna v1.1-funktioner kan Supabase och Google-inloggning behandla den kontoidentitet som krävs för funktionen. Appen samlar inte in medborgarskapsstatus, detaljer om migrationsärenden eller myndighets-ID.',
        title: 'Leverantörers behandling',
      },
    },
    title: 'Integritetspolicy',
  },
  en: {
    sections: {
      noAccountRequired: {
        body: 'The core study experience works without sign-in. Optional v1.1 account features may use Supabase and Google sign-in for account-backed functionality, while local study progress stays on the device by default.',
        title: 'Account optional',
      },
      localProgressStorage: {
        body: 'The app can store local study data on the device: answered and bookmarked questions, wrong-answer reviews, mock exam history, XP, answer history, daily challenges, streaks and streak freezes, FSRS review cards and graded review days, settings, accessibility preferences, selected study companion, citizenship requirements checklist state, and ebook highlights with optional notes. Local study data export and import do not include purchase, receipt, or ad-entitlement fields.',
        title: 'Local progress storage',
      },
      gdprRights: {
        body: 'You may request export or deletion of support messages you have sent via the Support screen. Local study data can be exported and imported in Settings. Locally stored progress, settings, ebook notes, requirements checklists, and purchase status can be cleared by uninstalling the app or clearing app data on the device.',
        title: 'Your rights under GDPR',
      },
      adsAndPurchases: {
        body: 'The free app is ad-supported on study screens through Google Mobile Ads. Timed mock exam screens stay ad-free. Remove Ads is a one-time, non-consumable purchase for 29 SEK that turns off ads on this device and can be restored through the app store. To restore or revalidate the purchase, the app stores a local purchase-status record that can include the store product ID, purchase token or transaction ID, and receipt-validation timestamp.',
        title: 'Ads and purchases',
      },
      adConsent: {
        body: 'On iOS, App Tracking Transparency is requested before tracking-based advertising. Where required, the Google UMP consent form is shown before real AdMob serving. Ads may be blocked or requested as non-personalized ads when the consent decision does not allow personalized ad serving.',
        title: 'Ad consent',
      },
      providerProcessing: {
        body: 'Google Mobile Ads and the app stores may process device, advertising, consent, and purchase status information to serve ads, apply Remove Ads, and restore purchases. If you choose account-backed v1.1 features, Supabase and Google sign-in may process the account identity required for that feature. The app does not collect citizenship status, immigration case details, or government IDs.',
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
      <LegalSection title={copy.sections.gdprRights.title}>
        {copy.sections.gdprRights.body}
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
