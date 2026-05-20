import {
  ComplianceActionLink,
  getVisibleLinkDestination,
} from '../components/compliance/ComplianceActionLink';
import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';

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
        sourceLabel: 'UHR:s utbildningsmaterial',
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
        sourceLabel: 'UHR education material',
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
      <LegalSection
        title={copy.sections.primaryStudyMaterial.title}
        action={
          <ComplianceActionLink
            accessibilityLabel={copy.openEducationMaterialAccessibilityLabel}
            detail={getVisibleLinkDestination(UHR_EDUCATION_MATERIAL_URL)}
            href={UHR_EDUCATION_MATERIAL_URL}
            label={copy.sections.primaryStudyMaterial.sourceLabel ?? UHR_EDUCATION_MATERIAL_URL}
          />
        }
      >
        {copy.sections.primaryStudyMaterial.body}
      </LegalSection>
      <LegalSection title={copy.sections.questionReferences.title}>
        {copy.sections.questionReferences.body}
      </LegalSection>
      <LegalSection
        title={copy.sections.authorityBoundaries.title}
        action={
          <ComplianceActionLink
            accessibilityLabel={copy.openAuthorityBoundarySourceAccessibilityLabel}
            detail={getVisibleLinkDestination(UHR_ABOUT_TEST_URL)}
            href={UHR_ABOUT_TEST_URL}
            label={copy.sections.authorityBoundaries.sourceLabel ?? UHR_ABOUT_TEST_URL}
          />
        }
      >
        {copy.sections.authorityBoundaries.body}
      </LegalSection>
    </LegalPage>
  );
}
