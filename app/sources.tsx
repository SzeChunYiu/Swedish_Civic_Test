import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, typography } from '../lib/theme';

const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const UHR_ABOUT_TEST_URL = 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/';

type LegalRouteSectionCopy = {
  body: string;
  sourceLabel?: string;
  title: string;
};

type SourcesRouteCopy = {
  openAuthorityBoundarySourceAccessibilityLabel: string;
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
    openAuthorityBoundarySourceAccessibilityLabel: 'Öppna UHR:s sida Om medborgarskapsprovet',
    openEducationMaterialAccessibilityLabel: 'Öppna UHR:s utbildningsmaterial',
    sections: {
      authorityBoundaries: {
        body: 'UHR:s sida Om medborgarskapsprovet säger att UHR har tagit fram utbildningsmaterialet. Den säger också att övningsprov på internet kan vara gjorda av andra personer eller företag; UHR står inte bakom dem och kvaliteten är inte kontrollerad av UHR eller någon annan myndighet. Appen håller samma gräns tydlig: det här är oberoende övningsinnehåll. Källa hämtad 2026-05-19:',
        sourceLabel: 'UHR, Om medborgarskapsprovet',
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
    openAuthorityBoundarySourceAccessibilityLabel: 'Open UHR About the citizenship test page',
    openEducationMaterialAccessibilityLabel: 'Open UHR education material',
    sections: {
      authorityBoundaries: {
        body: "UHR's About the citizenship test page says that UHR has produced the study material. It also says internet practice tests may be made by other people or companies; UHR does not stand behind them and their quality is not checked by UHR or any other authority. This app keeps the same boundary clear: it is independent practice content. Source accessed 2026-05-19:",
        sourceLabel: 'UHR, About the citizenship test',
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
        {copy.sections.authorityBoundaries.body}{' '}
        <Link
          accessibilityLabel={copy.openAuthorityBoundarySourceAccessibilityLabel}
          accessibilityRole="link"
          href={UHR_ABOUT_TEST_URL}
          style={styles.externalLink}
        >
          {copy.sections.authorityBoundaries.sourceLabel}
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
