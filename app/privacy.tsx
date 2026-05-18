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
    optionalSignIn: LegalRouteSectionCopy;
    signedInStorage: LegalRouteSectionCopy;
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
        body: 'Appen kräver inget konto, ingen e-postadress, inget telefonnummer och ingen profilregistrering. Du kan använda hela studieupplevelsen anonymt.',
        title: 'Inget konto krävs',
      },
      localProgressStorage: {
        body: 'Studieframsteg, inställningar, bokmärken, misstag, XP, streaks och ljudinställningar sparas lokalt på enheten så att appen kan komma ihåg din övningsstatus.',
        title: 'Lokal lagring av framsteg',
      },
      optionalSignIn: {
        body: 'Du kan välja att logga in med Google, Facebook eller Apple för att synkronisera framsteg mellan enheter och knyta köpet Ta bort annonser till ditt konto. Från din valda leverantör tar vi emot: e-postadress, en stabil användaridentifierare och (om du tillåter) ditt visningsnamn. Vi tar inte emot eller lagrar ditt lösenord.',
        title: 'Valfri inloggning',
      },
      signedInStorage: {
        body: 'När du är inloggad lagras din profil, ditt studieframsteg och din rättighetsstatus i Supabase (PostgreSQL) i EU (eu-central-1, Frankfurt). Row-Level Security säkerställer att varje användare endast kan läsa och skriva sina egna rader.',
        title: 'Var inloggade data lagras',
      },
      gdprRights: {
        body: 'Du kan begära export eller radering av dina kontodata när som helst via Support-skärmen. Radering tar bort din profil, ditt framsteg och dina rättighetsrader från vår databas. Lokalt lagrade framsteg kan rensas genom att avinstallera appen.',
        title: 'Dina rättigheter enligt GDPR',
      },
      adsAndPurchases: {
        body: 'Gratisappen finansieras med annonser på studieskärmar via Google Mobile Ads. Tidsatta provskärmar är annonsfria. Ta bort annonser är ett engångsköp utan förbrukning för 29 SEK som sätter adsDisabled=true på den här enheten och kan återställas via butiken eller, om du är inloggad, knytas till ditt konto.',
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
        body: 'No account is required. The app works without sign-in, email address, phone number, or profile registration. You can use the full study experience anonymously.',
        title: 'No account required',
      },
      localProgressStorage: {
        body: 'Study progress, settings, bookmarks, mistakes, XP, streaks, and audio preferences are stored locally on the device so the app can remember your practice state.',
        title: 'Local progress storage',
      },
      optionalSignIn: {
        body: 'You may optionally sign in with Google, Facebook, or Apple to sync progress across devices and to tie your Remove-Ads purchase to your account. From your chosen provider we receive: email address, a stable user identifier, and (if you permit) your display name. We never receive or store your password.',
        title: 'Optional sign-in',
      },
      signedInStorage: {
        body: 'When you are signed in, your profile, study progress, and entitlement state are stored in Supabase (PostgreSQL) hosted in the EU (eu-central-1, Frankfurt). Row-Level Security policies ensure each user can only read and write their own rows.',
        title: 'Where signed-in data is stored',
      },
      gdprRights: {
        body: 'You may request export or deletion of your account data at any time via the Support screen. Deletion removes your profile, progress, and entitlement rows from our database. Locally stored progress can be cleared by uninstalling the app.',
        title: 'Your rights under GDPR',
      },
      adsAndPurchases: {
        body: 'The free app is ad-supported on study screens through Google Mobile Ads. Timed mock exam screens stay ad-free. Remove Ads is a one-time non-consumable purchase for 29 SEK that sets adsDisabled=true on this device and can be restored through the store or, when you are signed in, tied to your account.',
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
      <LegalSection title={copy.sections.optionalSignIn.title}>
        {copy.sections.optionalSignIn.body}
      </LegalSection>
      <LegalSection title={copy.sections.signedInStorage.title}>
        {copy.sections.signedInStorage.body}
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
