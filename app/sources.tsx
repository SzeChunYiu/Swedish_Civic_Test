import {
  LegalExternalLink,
  LegalPage,
  LegalSection,
  LegalSectionParagraph,
} from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, typography } from '../lib/theme';

const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const UHR_EDUCATION_MATERIAL_DISPLAY_URL = 'uhr.se/medborgarskapsprovet/utbildningsmaterial';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type SourcesRouteCopy = {
  openEducationMaterialAccessibilityLabel: string;
  openEducationMaterialHint: string;
  openEducationMaterialLabel: string;
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
    openEducationMaterialHint: 'Öppnas som extern webbsida',
    openEducationMaterialLabel: 'Öppna utbildningsmaterialet',
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
        body: 'Varje övningsfråga sparar UHR-kapitel, avsnitt och ungefärlig sidmetadata. Avsnittskartan finns i content/uhr-section-map.json och den kalkylbladsvänliga innehållsdatabasen exporteras till content/question-bank.csv.',
        title: 'Frågereferenser',
      },
    },
    title: 'Källor',
  },
  en: {
    openEducationMaterialAccessibilityLabel: 'Open UHR education material',
    openEducationMaterialHint: 'Opens as an external web page',
    openEducationMaterialLabel: 'Open education material',
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
        body: 'Each practice question stores UHR chapter, section, and approximate page metadata. The section map is tracked in content/uhr-section-map.json and the spreadsheet-friendly content database is exported to content/question-bank.csv.',
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
        <LegalSectionParagraph>{copy.sections.primaryStudyMaterial.body}</LegalSectionParagraph>
        <LegalExternalLink
          accessibilityLabel={copy.openEducationMaterialAccessibilityLabel}
          accessibilityHint={copy.openEducationMaterialHint}
          displayUrl={UHR_EDUCATION_MATERIAL_DISPLAY_URL}
          href={UHR_EDUCATION_MATERIAL_URL}
          label={copy.openEducationMaterialLabel}
        />
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
