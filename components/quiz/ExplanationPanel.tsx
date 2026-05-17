import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';

type ExplanationPanelCopy = {
  accessibilityLabelPrefix: string;
  fallback: string;
  title: string;
};

const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy> = {
  sv: {
    accessibilityLabelPrefix: 'Förklaring',
    fallback: 'Förklaring saknas för den här frågan.',
    title: 'Förklaring',
  },
  en: {
    accessibilityLabelPrefix: 'Explanation',
    fallback: 'Explanation unavailable for this question.',
    title: 'Explanation',
  },
};

export function ExplanationPanel({
  explanationEn,
  explanationSv,
  language = 'sv',
}: {
  explanationEn?: string;
  explanationSv?: string;
  language?: AppLanguage;
}) {
  const copy = explanationPanelCopy[language];
  const explanation =
    language === 'en' && explanationEn ? explanationEn : (explanationSv ?? copy.fallback);
  const panelAccessibilityLabel = `${copy.accessibilityLabelPrefix}: ${explanation}`;

  return (
    <Card accessibilityLabel={panelAccessibilityLabel}>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.body}>{explanation}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
    marginTop: space[1],
  },
});
