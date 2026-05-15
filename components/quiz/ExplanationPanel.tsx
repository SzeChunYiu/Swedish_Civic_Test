import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';

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
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
});
