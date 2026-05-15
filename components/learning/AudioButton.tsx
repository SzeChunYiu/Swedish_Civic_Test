import { Button } from '../ui/Button';
import { speakSwedish } from '../../lib/audio/speak';

export function AudioButton({ text = '' }: { text?: string }) {
  return <Button onPress={() => speakSwedish(text)}>Listen</Button>;
}
