import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, typography } from '../lib/theme';

const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type SourcesRouteCopy = {
  openEducationMaterialAccessibilityLabel: string;
  sections: {
    authorityBoundaries: LegalRouteSectionCopy;
    primaryStudyMaterial: LegalRouteSectionCopy;
    questionReferences: LegalRouteSectionCopy;
  };
  title: string;
};

const sourcesCopy: Record<AppLanguage, SourcesRouteCopy> = {
  sv: {
    openEducationMaterialAccessibilityLabel: 'Öppna UHR:s utbildningsmaterial',
    sections: {
      authorityBoundaries: {
        body: 'UHR varnar för att övningar som andra skapar inte är kvalitetsgranskade av UHR eller någon annan myndighet. Appen håller samma gräns tydlig: det är oberoende övningsinnehåll.',
        title: 'Myndighetsgräns',
      },
      primaryStudyMaterial: {
        body: 'Sverige i fokus. Utbildningsmaterial till medborgarskapsprov. Grundläggande kunskaper om det svenska samhället. 1:a upplagan. UHR:s utbildningsmaterial:',
        title: 'Primärt studiematerial',
      },
      questionReferences: {
        body: 'Varje övningsfråga visar en källrad med UHR:s kapitel, avsnitt och ungefärliga sida. Källraden ligger under frågan och är skild från själva frågetexten, så du kan kontrollera uppgiften mot studiematerialet.',
        title: 'Frågereferenser',
      },
    },
    title: 'Källor',
  },
  en: {
    openEducationMaterialAccessibilityLabel: 'Open UHR education material',
    sections: {
      authorityBoundaries: {
        body: 'UHR warns that exercises created by others are not quality-controlled by UHR or another authority. This app keeps the same boundary clear: it is independent practice content.',
        title: 'Authority boundaries',
      },
      primaryStudyMaterial: {
        body: 'Sverige i fokus. Utbildningsmaterial till medborgarskapsprov. Grundläggande kunskaper om det svenska samhället. 1:a upplagan. UHR education material:',
        title: 'Primary study material',
      },
      questionReferences: {
        body: 'Every practice question shows a source line with the UHR chapter, section, and approximate page. The source line appears below the question and stays separate from the question text, so you can check the fact against the study material.',
        title: 'Question references',
      },
    },
    title: 'Sources',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const copy = sourcesCopy[language];

  return (
    <LegalPage title={copy.title}>
      <LegalSection title={copy.sections.primaryStudyMaterial.title}>
        {copy.sections.primaryStudyMaterial.body}{' '}
        <Link
          accessibilityLabel={copy.openEducationMaterialAccessibilityLabel}
          accessibilityRole="link"
          href={UHR_EDUCATION_MATERIAL_URL}
          style={styles.externalLink}
        >
          {UHR_EDUCATION_MATERIAL_URL}
        </Link>
      </LegalSection>
      <LegalSection title={copy.sections.questionReferences.title}>
        {copy.sections.questionReferences.body}
      </LegalSection>
      <LegalSection title={copy.sections.authorityBoundaries.title}>
        {copy.sections.authorityBoundaries.body}
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
