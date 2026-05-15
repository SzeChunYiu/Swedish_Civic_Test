import { LegalPage, LegalSection } from '../components/compliance/LegalPage';

export default function Screen() {
  return (
    <LegalPage title="Disclaimer">
      <LegalSection title="Independent study tool">
        This app is not official and is not affiliated with UHR, Skolverket, Migrationsverket, or
        the Swedish government.
      </LegalSection>
      <LegalSection title="Practice content">
        Practice questions are created for learning. They are not real exam questions and should not
        be treated as a prediction of what will appear on a test.
      </LegalSection>
      <LegalSection title="Use with source material">
        Always study the UHR education material directly. This app is a companion for repetition,
        explanations, and progress tracking.
      </LegalSection>
    </LegalPage>
  );
}
