import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function ExplanationPanel({
  explanationSv = 'Explanation placeholder',
}: {
  explanationSv?: string;
}) {
  return (
    <Card>
      <Text style={styles.title}>Explanation</Text>
      <Text style={styles.body}>{explanationSv}</Text>
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
