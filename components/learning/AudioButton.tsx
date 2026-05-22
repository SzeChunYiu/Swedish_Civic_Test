import { useEffect, useRef, useState } from 'react';

import { Button } from '../Button';
import { speakSwedish, stopSpeech } from '../../lib/audio/speak';
import type { AppLanguage } from '../../lib/storage/settingsStore';

type AudioButtonCopy = {
  disabledHint: string;
  disabledLabel: string;
  enabledHint: string;
  enabledLabel: string;
  stopHint: string;
  stopLabel: string;
  unavailableHint: string;
  unavailableLabel: string;
};

const audioButtonCopy: Record<AppLanguage, AudioButtonCopy> = {
  sv: {
    disabledHint: 'Aktivera ljud i Inställningar för att höra svensk text.',
    disabledLabel: 'Ljud är avstängt',
    enabledHint: 'Spelar upp den svenska frågan och svarsalternativen.',
    enabledLabel: 'Lyssna på den svenska frågan och svaren',
    stopHint: 'Stoppar uppläsningen av frågan och svarsalternativen.',
    stopLabel: 'Stoppa frågeljud',
    unavailableHint: 'Ljud behöver svensk frågetext före uppspelning.',
    unavailableLabel: 'Ljud saknas för den här frågan',
  },
  en: {
    disabledHint: 'Enable audio in Settings to hear Swedish text.',
    disabledLabel: 'Audio is disabled',
    enabledHint: 'Plays the Swedish question and answer options aloud.',
    enabledLabel: 'Listen to the Swedish question and answers',
    stopHint: 'Stops the question audio playback.',
    stopLabel: 'Stop question audio',
    unavailableHint: 'Audio needs Swedish question text before playback.',
    unavailableLabel: 'Audio is unavailable for this question',
  },
};

export function AudioButton({
  enabled = true,
  language = 'sv',
  rate,
  text = '',
}: {
  enabled?: boolean;
  language?: AppLanguage;
  rate?: number;
  text?: string | null;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechText = typeof text === 'string' ? text.trim() : '';
  const hasSpeechText = speechText.length > 0;
  const canPlayAudio = enabled && hasSpeechText;
  const copy = audioButtonCopy[language];
  const label = !enabled
    ? copy.disabledLabel
    : !hasSpeechText
      ? copy.unavailableLabel
      : isSpeaking
        ? copy.stopLabel
        : copy.enabledLabel;
  const accessibilityLabel = label;
  const accessibilityHint = !enabled
    ? copy.disabledHint
    : !hasSpeechText
      ? copy.unavailableHint
      : isSpeaking
        ? copy.stopHint
        : copy.enabledHint;
  const playbackRunRef = useRef(0);
  const previousSpeechTextRef = useRef<string | null>(null);

  const clearSpeakingForRun = (runId: number) => {
    if (playbackRunRef.current === runId) setIsSpeaking(false);
  };

  useEffect(() => {
    if (previousSpeechTextRef.current === null) {
      previousSpeechTextRef.current = speechText;
      return;
    }

    previousSpeechTextRef.current = speechText;
    playbackRunRef.current += 1;
    stopSpeech();
    setIsSpeaking(false);
  }, [speechText]);

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    if (!canPlayAudio && isSpeaking) {
      playbackRunRef.current += 1;
      stopSpeech();
      setIsSpeaking(false);
    }
  }, [canPlayAudio, isSpeaking]);

  return (
    <Button
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: isSpeaking, disabled: !canPlayAudio }}
      disabled={!canPlayAudio}
      onPress={() => {
        if (!canPlayAudio) return;
        if (isSpeaking) {
          playbackRunRef.current += 1;
          stopSpeech();
          setIsSpeaking(false);
          return;
        }
        const runId = playbackRunRef.current + 1;
        playbackRunRef.current = runId;
        stopSpeech();
        setIsSpeaking(true);
        speakSwedish(speechText, {
          rate,
          onDone: () => clearSpeakingForRun(runId),
          onError: () => clearSpeakingForRun(runId),
          onStopped: () => clearSpeakingForRun(runId),
        });
      }}
    >
      {label}
    </Button>
  );
}
