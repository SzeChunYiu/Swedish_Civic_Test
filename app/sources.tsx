import { LegalLinkList, LegalPage, LegalSection } from '../components/compliance/LegalPage';
import {
  UHR_AUTHORITY_BOUNDARY_SOURCE,
  UhrAuthorityBoundaryLink,
  UhrEducationMaterialLink,
} from '../components/compliance/SourceMaterialLinks';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';

const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';

type LegalRouteSectionCopy = {
  body: string;
  sourceLabel?: string;
  title: string;
};

type SourcesRouteCopy = {
  backAccessibilityLabel: string;
  backLabel: string;
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
    backAccessibilityLabel: 'Tillbaka till startsidan',
    backLabel: '← Tillbaka till startsidan',
    openAuthorityBoundarySourceAccessibilityLabel: 'Öppna UHR:s sida Om medborgarskapsprovet',
    openEducationMaterialAccessibilityLabel: 'Öppna UHR:s utbildningsmaterial',
    sections: {
      authorityBoundaries: {
        body: `Utbildningsmaterialet är framtaget av UHR. Övningsprov på internet kan däremot vara gjorda av andra personer eller företag; UHR står inte bakom dessa och kvaliteten är inte kontrollerad av UHR eller någon annan myndighet. Appen håller samma gräns tydlig: det här är oberoende övningsinnehåll. Källa hämtad ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}:`,
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
    backAccessibilityLabel: 'Back to home',
    backLabel: '← Back to home',
    openAuthorityBoundarySourceAccessibilityLabel: 'Open UHR About the citizenship test page',
    openEducationMaterialAccessibilityLabel: 'Open UHR education material',
    sections: {
      authorityBoundaries: {
        body: `The study material is produced by UHR. Internet practice tests may be made by other people or companies; UHR does not stand behind those tests, and their quality is not controlled by UHR or any other authority. This app keeps the same boundary clear: it is independent practice content. Source accessed ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}:`,
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
    <LegalPage
      backAccessibilityLabel={copy.backAccessibilityLabel}
      backHref="/(tabs)/home"
      backLabel={copy.backLabel}
      title={copy.title}
    >
      <LegalSection title={copy.sections.primaryStudyMaterial.title}>
        {copy.sections.primaryStudyMaterial.body}
        <LegalLinkList>
          <UhrEducationMaterialLink href={UHR_EDUCATION_MATERIAL_URL} language={language} />
        </LegalLinkList>
      </LegalSection>
      <LegalSection title={copy.sections.questionReferences.title}>
        {copy.sections.questionReferences.body}
      </LegalSection>
      <LegalSection title={copy.sections.authorityBoundaries.title}>
        {copy.sections.authorityBoundaries.body}
        <LegalLinkList>
          <UhrAuthorityBoundaryLink language={language} />
        </LegalLinkList>
      </LegalSection>
    </LegalPage>
  );
}
