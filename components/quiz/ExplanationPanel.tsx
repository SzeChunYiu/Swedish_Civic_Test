import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';
import { colors, space } from '../../lib/theme';

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
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: space[1],
  },
});
