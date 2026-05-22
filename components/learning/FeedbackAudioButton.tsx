import { useEffect, useRef, useState } from 'react';

import { speakSwedish, stopSpeech } from '../../lib/audio/speak';
import {
  AUDIO_PLAYBACK_RATES,
  type AudioPlaybackRate,
  useAccessibilityStore,
} from '../../lib/storage/accessibilityStore';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { Button } from '../Button';
import { AudioRateMenu } from './AudioRateMenu';

type FeedbackAudioCopy = {
  disabledHint: string;
  disabledLabel: string;
  playHint: string;
  playLabel: string;
  stopHint: string;
  stopLabel: string;
  unavailableHint: string;
  unavailableLabel: string;
};

const feedbackAudioCopy: Record<AppLanguage, FeedbackAudioCopy> = {
  sv: {
    disabledHint: 'Aktivera ljud i Inställningar för att höra återkopplingen.',
    disabledLabel: 'Ljud är avstängt',
    playHint: 'Spelar upp ditt svar, rätt svar vid behov och den svenska förklaringen.',
    playLabel: 'Lyssna på återkopplingen',
    stopHint: 'Stoppar uppläsningen av återkopplingen.',
    stopLabel: 'Stoppa återkoppling',
    unavailableHint: 'Återkopplingsljud visas först när du har svarat.',
    unavailableLabel: 'Återkopplingsljud saknas',
  },
  en: {
    disabledHint: 'Enable audio in Settings to hear answer feedback.',
    disabledLabel: 'Audio is disabled',
    playHint: 'Plays your answer, the correct answer when needed, and the Swedish explanation.',
    playLabel: 'Listen to feedback',
    stopHint: 'Stops the feedback playback.',
    stopLabel: 'Stop feedback',
    unavailableHint: 'Feedback audio appears after you answer.',
    unavailableLabel: 'Feedback audio is unavailable',
  },
};

export function FeedbackAudioButton({
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
  const [rateMenuOpen, setRateMenuOpen] = useState(false);
  const storedAudioPlaybackRate = useAccessibilityStore((state) => state.audioPlaybackRate);
  const resolvedRate = AUDIO_PLAYBACK_RATES.includes(rate as AudioPlaybackRate)
    ? (rate as AudioPlaybackRate)
    : storedAudioPlaybackRate;
  const speechText = typeof text === 'string' ? text.trim() : '';
  const hasSpeechText = speechText.length > 0;
  const canPlayAudio = enabled && hasSpeechText;
  const copy = feedbackAudioCopy[language];
  const label = !enabled
    ? copy.disabledLabel
    : !hasSpeechText
      ? copy.unavailableLabel
      : isSpeaking
        ? copy.stopLabel
        : copy.playLabel;
  const accessibilityHint = !enabled
    ? copy.disabledHint
    : !hasSpeechText
      ? copy.unavailableHint
      : isSpeaking
        ? copy.stopHint
        : copy.playHint;
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
    if (!canPlayAudio && isSpeaking) {
      playbackRunRef.current += 1;
      stopSpeech();
      setIsSpeaking(false);
    }
  }, [canPlayAudio, isSpeaking]);

  useEffect(() => {
    return () => {
      playbackRunRef.current += 1;
      stopSpeech();
    };
  }, []);

  return (
    <>
      <Button
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ busy: isSpeaking, disabled: !canPlayAudio }}
        disabled={!canPlayAudio}
        onLongPress={() => setRateMenuOpen(true)}
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
            rate: resolvedRate,
            onDone: () => clearSpeakingForRun(runId),
            onError: () => clearSpeakingForRun(runId),
            onStopped: () => clearSpeakingForRun(runId),
          });
        }}
        variant="secondary"
      >
        {label}
      </Button>
      <AudioRateMenu
        expanded={rateMenuOpen}
        language={language}
        onExpandedChange={setRateMenuOpen}
        selectedRate={resolvedRate}
      />
    </>
  );
}
