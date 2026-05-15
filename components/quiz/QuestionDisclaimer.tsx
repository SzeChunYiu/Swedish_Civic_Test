import { StyleSheet, Text } from 'react-native';

import { Card } from '../ui/Card';

const disclaimerText =
  'Independent study tool. Not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice questions are created for learning and are not real exam questions.';

export function QuestionDisclaimer() {
  return (
    <Card>
      <Text style={styles.text}>{disclaimerText}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  text: {
    color: 'rgba(0,0,0,0.65)',
    fontSize: 12,
    lineHeight: 18,
  },
});
