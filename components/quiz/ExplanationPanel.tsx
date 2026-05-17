import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function ExplanationPanel({
  explanationEn,
  explanationSv = 'Explanation unavailable for this question.',
  language = 'sv',
}: {
  explanationEn?: string;
  explanationSv?: string;
  language?: 'sv' | 'en';
}) {
  const explanation = language === 'en' && explanationEn ? explanationEn : explanationSv;
  const panelAccessibilityLabel = `Explanation: ${explanation}`;

  return (
    <Card accessibilityLabel={panelAccessibilityLabel}>
      <Text style={styles.title}>Explanation</Text>
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
