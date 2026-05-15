import { Button } from '../ui/Button';
import { speakSwedish, stopSpeech } from '../../lib/audio/speak';

export function AudioButton({ text = '', enabled = true }: { text?: string; enabled?: boolean }) {
  const label = enabled ? 'Listen' : 'Audio disabled';

  return (
    <Button
      accessibilityLabel={
        enabled ? 'Listen to the Swedish question and answers' : 'Audio is disabled'
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => {
        if (!enabled) return;
        stopSpeech();
        speakSwedish(text);
      }}
      style={!enabled ? { opacity: 0.45 } : undefined}
    >
      {label}
    </Button>
  );
}
