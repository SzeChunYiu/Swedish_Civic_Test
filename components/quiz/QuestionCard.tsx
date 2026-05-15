import { Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';

export function QuestionCard({ question }: { question?: PracticeQuestion }) {
  return (
    <Card>
      <Text>{question?.questionSv ?? 'Question placeholder'}</Text>
    </Card>
  );
}
