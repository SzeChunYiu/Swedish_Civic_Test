import { LegalPage, LegalSection } from '../components/compliance/LegalPage';

export default function Screen() {
  return (
    <LegalPage title="Support and feedback">
      <LegalSection title="What to report">
        Send a support note if you find a content issue, confusing Swedish wording, a broken source
        reference, an audio problem, or a bug in the study flow.
      </LegalSection>
      <LegalSection title="No personal data">
        Please include no personal data, government identifiers, immigration case details, or
        sensitive account information in support messages.
      </LegalSection>
      <LegalSection title="Independent study tool">
        Support can help with app functionality and content corrections, but it cannot provide
        official exam answers, migration advice, or government decisions.
      </LegalSection>
      <LegalSection title="Before public launch">
        The public support URL and contact mailbox are release checklist items. They must be
        verified in the store records before production submission.
      </LegalSection>
    </LegalPage>
  );
}
