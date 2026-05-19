import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, typography } from '../lib/theme';

const PUBLIC_SUPPORT_URL = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';
const SUPPORT_INTAKE_URL =
  'https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/new?' +
  'title=Almost%20Swedish%20support%20request&' +
  'body=Please%20do%20not%20include%20personal%20data.%0A%0A' +
  'Issue%20type%3A%20content%20issue%20%2F%20Swedish%20wording%20%2F%20source%20reference%20%2F%20audio%20problem%20%2F%20study-flow%20bug%20%2F%20store-build%20issue.%0A%0A' +
  'Describe%20what%20you%20saw%20without%20IDs%20or%20case%20details%3A%0A';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type SupportRouteCopy = {
  openSupportIntakeAccessibilityLabel: string;
  openSupportPageAccessibilityLabel: string;
  supportIntakeLinkLabel: string;
  sections: {
    whatToReport: LegalRouteSectionCopy;
    noPersonalData: LegalRouteSectionCopy;
    independentStudyTool: LegalRouteSectionCopy;
    supportIntake: LegalRouteSectionCopy;
    publicSupportPage: LegalRouteSectionCopy;
  };
  title: string;
};

const supportCopy: Record<AppLanguage, SupportRouteCopy> = {
  sv: {
    openSupportIntakeAccessibilityLabel: 'Öppna supportintaget',
    openSupportPageAccessibilityLabel: 'Öppna den offentliga supportsidan',
    supportIntakeLinkLabel: 'Öppna supportintag',
    sections: {
      whatToReport: {
        body: 'Supportintaget är till för innehållsfel, oklar svensk formulering, trasig källreferens, ljudproblem, fel i studieflödet eller butik/buildproblem.',
        title: 'Vad du kan rapportera',
      },
      noPersonalData: {
        body: 'Ta inte med personuppgifter, myndighets-ID, detaljer om migrationsärenden eller känslig privat information i supportmeddelanden.',
        title: 'Inga personuppgifter',
      },
      independentStudyTool: {
        body: 'Supporten kan hjälpa till med appfunktioner och innehållsrättelser, men kan inte ge officiella provsvar, migrationsråd eller myndighetsbeslut.',
        title: 'Oberoende studieverktyg',
      },
      supportIntake: {
        body: 'Öppna supportintaget och ta bort allt personligt från den förifyllda texten innan du skickar.',
        title: 'Supportintag',
      },
      publicSupportPage: {
        body: 'Skicka återkoppling via den offentliga supportsidan:',
        title: 'Offentlig supportsida',
      },
    },
    title: 'Support och återkoppling',
  },
  en: {
    openSupportIntakeAccessibilityLabel: 'Open support intake',
    openSupportPageAccessibilityLabel: 'Open public support page',
    supportIntakeLinkLabel: 'Open support intake',
    sections: {
      whatToReport: {
        body: 'The support intake is for content issues, confusing Swedish wording, broken source references, audio problems, study-flow bugs, or store/build issues.',
        title: 'What to report',
      },
      noPersonalData: {
        body: 'Please include no personal data, government identifiers, immigration case details, or sensitive private information in support messages.',
        title: 'No personal data',
      },
      independentStudyTool: {
        body: 'Support can help with app functionality and content corrections, but it cannot provide official exam answers, migration advice, or government decisions.',
        title: 'Independent study tool',
      },
      supportIntake: {
        body: 'Open the support intake and remove anything personal from the prefilled message before sending.',
        title: 'Support intake',
      },
      publicSupportPage: {
        body: 'Send feedback through the public support page:',
        title: 'Public support page',
      },
    },
    title: 'Support and feedback',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const copy = supportCopy[language];

  return (
    <LegalPage title={copy.title}>
      <LegalSection title={copy.sections.whatToReport.title}>
        {copy.sections.whatToReport.body}
      </LegalSection>
      <LegalSection title={copy.sections.noPersonalData.title}>
        {copy.sections.noPersonalData.body}
      </LegalSection>
      <LegalSection title={copy.sections.independentStudyTool.title}>
        {copy.sections.independentStudyTool.body}
      </LegalSection>
      <LegalSection title={copy.sections.supportIntake.title}>
        {copy.sections.supportIntake.body}{' '}
        <Link
          accessibilityLabel={copy.openSupportIntakeAccessibilityLabel}
          accessibilityRole="link"
          href={SUPPORT_INTAKE_URL}
          style={styles.externalLink}
        >
          {copy.supportIntakeLinkLabel}
        </Link>
      </LegalSection>
      <LegalSection title={copy.sections.publicSupportPage.title}>
        {copy.sections.publicSupportPage.body}{' '}
        <Link
          accessibilityLabel={copy.openSupportPageAccessibilityLabel}
          accessibilityRole="link"
          href={PUBLIC_SUPPORT_URL}
          style={styles.externalLink}
        >
          {PUBLIC_SUPPORT_URL}
        </Link>
      </LegalSection>
    </LegalPage>
  );
}

const styles = StyleSheet.create({
  externalLink: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'underline',
  },
});
