import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, typography } from '../lib/theme';

const PUBLIC_SUPPORT_URL = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type SupportRouteCopy = {
  openSupportPageAccessibilityLabel: string;
  sections: {
    whatToReport: LegalRouteSectionCopy;
    noPersonalData: LegalRouteSectionCopy;
    independentStudyTool: LegalRouteSectionCopy;
    publicSupportPage: LegalRouteSectionCopy;
  };
  title: string;
};

const supportCopy: Record<AppLanguage, SupportRouteCopy> = {
  sv: {
    openSupportPageAccessibilityLabel: 'Öppna den offentliga supportsidan',
    sections: {
      whatToReport: {
        body: 'Skicka ett supportmeddelande om du hittar ett innehållsfel, oklar svensk formulering, trasig källreferens, ett ljudproblem eller ett fel i studieflödet.',
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
      publicSupportPage: {
        body: 'Skicka återkoppling via den offentliga supportsidan:',
        title: 'Offentlig supportsida',
      },
    },
    title: 'Support och återkoppling',
  },
  en: {
    openSupportPageAccessibilityLabel: 'Open public support page',
    sections: {
      whatToReport: {
        body: 'Send a support note if you find a content issue, confusing Swedish wording, a broken source reference, an audio problem, or a bug in the study flow.',
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
