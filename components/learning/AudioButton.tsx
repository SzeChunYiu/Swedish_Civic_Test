import { Button } from '../ui/Button';
import { speakSwedish, stopSpeech } from '../../lib/audio/speak';

export function AudioButton({ text = '', enabled = true }: { text?: string; enabled?: boolean }) {
  const speechText = text.trim();
  const hasSpeechText = speechText.length > 0;
  const canPlayAudio = enabled && hasSpeechText;
  const label = !enabled ? 'Audio disabled' : hasSpeechText ? 'Listen' : 'Audio unavailable';
  const accessibilityLabel = !enabled
    ? 'Audio is disabled'
    : hasSpeechText
      ? 'Listen to the Swedish question and answers'
      : 'Audio is unavailable for this question';

  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !canPlayAudio }}
      disabled={!canPlayAudio}
      onPress={() => {
        if (!canPlayAudio) return;
        stopSpeech();
        speakSwedish(speechText);
      }}
    >
      {label}
    </Button>
  );
}
