import { LegalPage, LegalSection } from '../components/compliance/LegalPage';

export default function Screen() {
  return (
    <LegalPage title="Terms of use">
      <LegalSection title="Study purpose">
        This app is provided as a study aid for learning Swedish civic knowledge. It is not a legal,
        immigration, or government service.
      </LegalSection>
      <LegalSection title="No guarantee">
        There is no guarantee that using this app will result in passing any exam or meeting any
        citizenship requirement. You are responsible for checking current requirements with the
        relevant authorities.
      </LegalSection>
      <LegalSection title="Respect source material">
        Questions and explanations are written to support learning from UHR-referenced sections. Use
        them together with the original education material and current authority information.
      </LegalSection>
    </LegalPage>
  );
}
