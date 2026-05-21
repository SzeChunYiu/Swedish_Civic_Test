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
        body: 'Studera alltid det primära utbildningsmaterialet direkt. Appen är ett komplement för repetition, förklaringar och framsteg. Använd källorna nedan för att se vilket studiematerial appen utgår från och hur övningsprov från andra aktörer ska skiljas från det.',
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
        body: 'Always study the primary education material directly. This app is a companion for repetition, explanations, and progress tracking. Use the source links below to see which study material the app is based on and how practice tests from other actors should be kept separate from it.',
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
      <LegalSection title={copy.sections.sourceMaterial.title}>
        {copy.sections.sourceMaterial.body}
        <SourceMaterialLinkList language={language} />
      </LegalSection>
    </LegalPage>
  );
}
