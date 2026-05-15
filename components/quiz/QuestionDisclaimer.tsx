import { StyleSheet, Text } from 'react-native';

import { Card } from '../ui/Card';
import { colors } from '../../lib/theme';

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
    color: colors.textDisclaimer,
    fontSize: 12,
    lineHeight: 18,
  },
});
