import { Text } from 'react-native';
import { Card } from '../ui/Card';

export function Flashcard({ front = 'Front', back = 'Back' }: { front?: string; back?: string }) {
  return <Card><Text>{front}</Text><Text>{back}</Text></Card>;
}
