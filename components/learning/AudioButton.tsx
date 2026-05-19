import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { speakSwedish, stopSpeech } from '../../lib/audio/speak';
import type { AppLanguage } from '../../lib/storage/settingsStore';

type AudioButtonCopy = {
  disabledHint: string;
  disabledLabel: string;
  enabledHint: string;
  enabledLabel: string;
  playingHint: string;
  playingLabel: string;
  unavailableHint: string;
  unavailableLabel: string;
};

const audioButtonCopy: Record<AppLanguage, AudioButtonCopy> = {
  sv: {
    disabledHint: 'Aktivera ljud i Inställningar för att höra svensk text.',
    disabledLabel: 'Ljud är avstängt',
    enabledHint: 'Spelar upp den svenska frågan och svarsalternativen.',
    enabledLabel: 'Lyssna på den svenska frågan och svaren',
    playingHint: 'Stoppar uppspelningen av den svenska frågan och svaren.',
    playingLabel: 'Stoppa ljudet',
    unavailableHint: 'Ljud behöver svensk frågetext före uppspelning.',
    unavailableLabel: 'Ljud saknas för den här frågan',
  },
  en: {
    disabledHint: 'Enable audio in Settings to hear Swedish text.',
    disabledLabel: 'Audio is disabled',
    enabledHint: 'Plays the Swedish question and answer options aloud.',
    enabledLabel: 'Listen to the Swedish question and answers',
    playingHint: 'Stops playback of the Swedish question and answers.',
    playingLabel: 'Stop audio',
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
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);
  const activeSpeechRunIdRef = useRef(0);
  const isSpeaking = canPlayAudio && activeSpeechText === speechText;
  const label = !enabled
    ? copy.disabledLabel
    : hasSpeechText
      ? isSpeaking
        ? copy.playingLabel
        : copy.enabledLabel
      : copy.unavailableLabel;
  const accessibilityLabel = label;
  const accessibilityHint = !enabled
    ? copy.disabledHint
    : hasSpeechText
      ? isSpeaking
        ? copy.playingHint
        : copy.enabledHint
      : copy.unavailableHint;
  const resetSpeakingState = useCallback((speechRunId: number) => {
    if (activeSpeechRunIdRef.current !== speechRunId) return;
    setActiveSpeechText(null);
  }, []);

  useEffect(() => {
    if (canPlayAudio && (activeSpeechText === null || activeSpeechText === speechText)) return;
    activeSpeechRunIdRef.current += 1;
    setActiveSpeechText(null);
  }, [activeSpeechText, canPlayAudio, speechText]);

  const handlePress = useCallback(() => {
    if (!canPlayAudio) return;
    if (isSpeaking) {
      activeSpeechRunIdRef.current += 1;
      setActiveSpeechText(null);
      stopSpeech();
      return;
    }

    const speechRunId = activeSpeechRunIdRef.current + 1;
    activeSpeechRunIdRef.current = speechRunId;
    setActiveSpeechText(speechText);
    stopSpeech();
    speakSwedish(speechText, {
      onDone: () => resetSpeakingState(speechRunId),
      onError: () => resetSpeakingState(speechRunId),
      onStopped: () => resetSpeakingState(speechRunId),
    });
  }, [canPlayAudio, isSpeaking, resetSpeakingState, speechText]);

  return (
    <Button
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !canPlayAudio, busy: isSpeaking, selected: isSpeaking }}
      disabled={!canPlayAudio}
      onPress={handlePress}
    >
      {label}
    </Button>
  );
}
