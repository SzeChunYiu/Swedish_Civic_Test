import { StyleSheet, Text } from 'react-native';

import { Card } from '../ui/Card';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';

type QuestionDisclaimerCopy = {
  text: string;
  accessibilityLabelPrefix: string;
  accessibilityHint: string;
};

const disclaimerCopy: Record<AppLanguage, QuestionDisclaimerCopy> = {
  sv: {
    text: 'Oberoende studieverktyg. Inte officiellt eller kopplat till UHR, Skolverket, Migrationsverket eller svenska staten. Övningsfrågorna är skapade för lärande och är inte riktiga provfrågor.',
    accessibilityLabelPrefix: 'Studieinformation',
    accessibilityHint:
      'Använd den här informationen för att skilja övningsinnehåll från officiellt material till medborgarskapsprovet.',
  },
  en: {
    text: 'Independent study tool. Not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice questions are created for learning and are not real exam questions.',
    accessibilityLabelPrefix: 'Study disclaimer',
    accessibilityHint:
      'Use this warning to distinguish practice content from official civic test material.',
  },
};

export function QuestionDisclaimer({ language }: { language?: AppLanguage } = {}) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = disclaimerCopy[language ?? settingsLanguage];
  const disclaimerAccessibilityLabel = `${copy.accessibilityLabelPrefix}: ${copy.text}`;

  return (
    <Card
      accessibilityHint={copy.accessibilityHint}
      accessibilityLabel={disclaimerAccessibilityLabel}
      style={styles.card}
    >
      <Text style={styles.text}>{copy.text}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWarm,
    padding: space[1.5],
  },
  text: {
    color: colors.textDisclaimer,
    fontSize: typography.badge.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
  },
});
