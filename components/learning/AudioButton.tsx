import { Button } from '../ui/Button';
import { speakSwedish, stopSpeech } from '../../lib/audio/speak';
import type { AppLanguage } from '../../lib/storage/settingsStore';

type AudioButtonCopy = {
  disabledHint: string;
  disabledLabel: string;
  enabledHint: string;
  enabledLabel: string;
  unavailableHint: string;
  unavailableLabel: string;
};

const audioButtonCopy: Record<AppLanguage, AudioButtonCopy> = {
  sv: {
    disabledHint: 'Aktivera ljud i Inställningar för att höra svensk text.',
    disabledLabel: 'Ljud är avstängt',
    enabledHint: 'Spelar upp den svenska frågan och svarsalternativen.',
    enabledLabel: 'Lyssna på den svenska frågan och svaren',
    unavailableHint: 'Ljud behöver svensk frågetext före uppspelning.',
    unavailableLabel: 'Ljud saknas för den här frågan',
  },
  en: {
    disabledHint: 'Enable audio in Settings to hear Swedish text.',
    disabledLabel: 'Audio is disabled',
    enabledHint: 'Plays the Swedish question and answer options aloud.',
    enabledLabel: 'Listen to the Swedish question and answers',
    unavailableHint: 'Audio needs Swedish question text before playback.',
    unavailableLabel: 'Audio is unavailable for this question',
  },
};

export function AudioButton({
  enabled = true,
  language = 'sv',
  text = '',
}: {
  enabled?: boolean;
  language?: AppLanguage;
  text?: string;
}) {
  const speechText = text.trim();
  const hasSpeechText = speechText.length > 0;
  const canPlayAudio = enabled && hasSpeechText;
  const copy = audioButtonCopy[language];
  const label = !enabled
    ? copy.disabledLabel
    : hasSpeechText
      ? copy.enabledLabel
      : copy.unavailableLabel;
  const accessibilityLabel = label;
  const accessibilityHint = !enabled
    ? copy.disabledHint
    : hasSpeechText
      ? copy.enabledHint
      : copy.unavailableHint;

  return (
    <Button
      accessibilityHint={accessibilityHint}
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
