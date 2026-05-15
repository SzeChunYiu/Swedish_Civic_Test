import { Text } from 'react-native';
import { Card } from '../ui/Card';

export function ExplanationPanel({
  explanationSv = 'Explanation placeholder',
}: {
  explanationSv?: string;
}) {
  return (
    <Card>
      <Text>{explanationSv}</Text>
    </Card>
  );
}
