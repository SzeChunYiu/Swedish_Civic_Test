import { LegalPage, LegalSection } from '../components/compliance/LegalPage';
import { SourceMaterialLinkList } from '../components/compliance/SourceMaterialLinks';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';

type LegalRouteSectionCopy = {
  body: string;
  title: string;
};

type DisclaimerRouteCopy = {
  sections: {
    independentStudyTool: LegalRouteSectionCopy;
    practiceContent: LegalRouteSectionCopy;
    sourceMaterial: LegalRouteSectionCopy;
  };
  title: string;
};

const disclaimerCopy: Record<AppLanguage, DisclaimerRouteCopy> = {
  sv: {
    sections: {
      independentStudyTool: {
        body: 'Appen är inte officiell och är inte kopplad till UHR, Skolverket, Migrationsverket eller Sveriges regering.',
        title: 'Oberoende studieverktyg',
      },
      practiceContent: {
        body: 'Övningsfrågorna är skapade för lärande. De är inte riktiga provfrågor och ska inte ses som en förutsägelse av vad som kommer på ett prov.',
        title: 'Övningsinnehåll',
      },
      sourceMaterial: {
        body: 'Studera alltid UHR:s utbildningsmaterial direkt. Appen är ett komplement för repetition, förklaringar och framsteg. UHR:s egen sida om provet beskriver också källgränsen mellan UHR:s material och övningsprov från andra aktörer.',
        title: 'Använd med källmaterialet',
      },
    },
    title: 'Ansvarsfriskrivning',
  },
  en: {
    sections: {
      independentStudyTool: {
        body: 'This app is not official and is not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government.',
        title: 'Independent study tool',
      },
      practiceContent: {
        body: 'Practice questions are created for learning. They are not real exam questions and should not be treated as a prediction of what will appear on a test.',
        title: 'Practice content',
      },
      sourceMaterial: {
        body: "Always study the UHR education material directly. This app is a companion for repetition, explanations, and progress tracking. UHR's own page about the test also provides source-boundary guidance for UHR material and practice tests from other actors.",
        title: 'Use with source material',
      },
    },
    title: 'Disclaimer',
  },
};

export default function Screen() {
  const language = useSettingsStore((state) => state.language);
  const copy = disclaimerCopy[language];

  return (
    <LegalPage title={copy.title}>
      <LegalSection title={copy.sections.independentStudyTool.title}>
        {copy.sections.independentStudyTool.body}
      </LegalSection>
      <LegalSection title={copy.sections.practiceContent.title}>
        {copy.sections.practiceContent.body}
      </LegalSection>
      <LegalSection
        title={copy.sections.sourceMaterial.title}
        body={copy.sections.sourceMaterial.body}
      >
        <SourceMaterialLinkList language={language} />
      </LegalSection>
    </LegalPage>
  );
}
