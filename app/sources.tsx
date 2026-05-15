import { LegalPage, LegalSection } from '../components/compliance/LegalPage';

export default function Screen() {
  return (
    <LegalPage title="Sources">
      <LegalSection title="Primary study material">
        Sverige i fokus. Utbildningsmaterial till medborgarskapsprov. Grundläggande kunskaper om det
        svenska samhället. 1:a upplagan. UHR education material:
        https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/
      </LegalSection>
      <LegalSection title="Question references">
        Each practice question stores UHR chapter, section, and approximate page metadata. The
        section map is tracked in content/uhr-section-map.json and the spreadsheet-friendly content
        database is exported to content/question-bank.csv.
      </LegalSection>
      <LegalSection title="Authority boundaries">
        UHR warns that exercises created by others are not quality-controlled by UHR or another
        authority. This app keeps the same boundary clear: it is independent practice content.
      </LegalSection>
    </LegalPage>
  );
}
