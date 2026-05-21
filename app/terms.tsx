import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { SourceMaterialLinkList } from '../components/compliance/SourceMaterialLinks';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type TermsRouteCopy = {
  sections: {
    studyPurpose: LegalRouteSectionCopy;
    noGuarantee: LegalRouteSectionCopy;
    sourceMaterial: LegalRouteSectionCopy;
  };
  title: string;
};

const termsCopy: Record<AppLanguage, TermsRouteCopy> = {
  sv: {
    sections: {
      studyPurpose: {
        body: 'Appen tillhandahålls som ett studiehjälpmedel för att lära sig svensk samhällskunskap. Den är inte en juridisk tjänst, migrationstjänst eller myndighetstjänst.',
        title: 'Studieändamål',
      },
      noGuarantee: {
        body: 'Det finns ingen garanti för att användning av appen leder till godkänt prov eller uppfyllda medborgarskapskrav. Du ansvarar själv för att kontrollera aktuella krav hos berörda myndigheter.',
        title: 'Ingen garanti',
      },
      sourceMaterial: {
        body: 'Frågor och förklaringar är skrivna för att stödja lärande från refererade avsnitt. Använd dem tillsammans med det primära utbildningsmaterialet och aktuell myndighetsinformation. Se källänkarna nedan när du vill kontrollera studiematerialet och gränsen mot fristående övningsprov.',
        title: 'Respektera källmaterialet',
      },
    },
    title: 'Användarvillkor',
  },
  en: {
    sections: {
      studyPurpose: {
        body: 'This app is provided as a study aid for learning Swedish civic knowledge. It is not a legal, immigration, or government service.',
        title: 'Study purpose',
      },
      noGuarantee: {
        body: 'There is no guarantee that using this app will result in passing any exam or meeting any citizenship requirement. You are responsible for checking current requirements with the relevant authorities.',
        title: 'No guarantee',
      },
      sourceMaterial: {
        body: 'Questions and explanations are written to support learning from referenced sections. Use them together with the primary education material and current authority information. Use the source links below to check the study material and the boundary with independent practice tests.',
        title: 'Respect source material',
      },
    },
    title: 'Terms of use',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const copy = termsCopy[language];

  return (
    <LegalPage title={copy.title}>
      <LegalSection title={copy.sections.studyPurpose.title}>
        {copy.sections.studyPurpose.body}
      </LegalSection>
      <LegalSection title={copy.sections.noGuarantee.title}>
        {copy.sections.noGuarantee.body}
      </LegalSection>
      <LegalSection title={copy.sections.sourceMaterial.title}>
        {copy.sections.sourceMaterial.body}
        <SourceMaterialLinkList language={language} />
      </LegalSection>
    </LegalPage>
  );
}
