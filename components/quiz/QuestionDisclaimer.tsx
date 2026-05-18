import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { DisclaimerBanner } from '../DisclaimerBanner';

type QuestionDisclaimerCopy = {
  accessibilityLabelPrefix: string;
  accessibilityHint: string;
  text: string;
  title: string;
};

const disclaimerCopy: Record<AppLanguage, QuestionDisclaimerCopy> = {
  sv: {
    accessibilityLabelPrefix: 'Studieinformation',
    accessibilityHint:
      'Använd den här informationen för att skilja övningsinnehåll från officiellt material till medborgarskapsprovet.',
    text: 'Oberoende studieverktyg. Inte officiellt eller kopplat till UHR, Skolverket, Migrationsverket eller svenska staten. Övningsfrågorna är skapade för lärande och är inte riktiga provfrågor.',
    title: 'Studieinformation',
  },
  en: {
    accessibilityLabelPrefix: 'Study disclaimer',
    accessibilityHint:
      'Use this warning to distinguish practice content from official civic test material.',
    text: 'Independent study tool. Not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice questions are created for learning and are not real exam questions.',
    title: 'Study disclaimer',
  },
};

export function QuestionDisclaimer({ language }: { language?: AppLanguage } = {}) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = disclaimerCopy[language ?? settingsLanguage];
  const disclaimerAccessibilityLabel = `${copy.accessibilityLabelPrefix}: ${copy.text}`;

  return (
    <DisclaimerBanner
      accessibilityHint={copy.accessibilityHint}
      accessibilityLabel={disclaimerAccessibilityLabel}
      message={copy.text}
      title={copy.title}
    />
  );
}
