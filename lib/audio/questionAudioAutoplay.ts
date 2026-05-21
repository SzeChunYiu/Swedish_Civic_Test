import { useEffect, useRef } from 'react';

import { speakSwedish, stopSpeech } from './speak';

type QuestionAudioAutoplayGate = {
  audioEnabled: boolean;
  listenFirstAudioEnabled: boolean;
  questionKey: string | null | undefined;
  speechText: unknown;
  stopSignal?: boolean;
  suppressAutoplay?: boolean;
};

export type QuestionAudioAutoplayOptions = QuestionAudioAutoplayGate & {
  rate?: number;
};

function normalizeAutoplaySpeechText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function shouldAutoplayQuestionAudio({
  audioEnabled,
  listenFirstAudioEnabled,
  questionKey,
  speechText,
  stopSignal = false,
  suppressAutoplay = false,
}: QuestionAudioAutoplayGate): boolean {
  return Boolean(
    audioEnabled &&
    listenFirstAudioEnabled &&
    !stopSignal &&
    !suppressAutoplay &&
    questionKey &&
    normalizeAutoplaySpeechText(speechText).length > 0,
  );
}

export function useQuestionAudioAutoplay({
  audioEnabled,
  listenFirstAudioEnabled,
  questionKey,
  rate,
  speechText,
  stopSignal = false,
  suppressAutoplay = false,
}: QuestionAudioAutoplayOptions): void {
  const lastPlayedQuestionKeyRef = useRef<string | null>(null);
  const normalizedSpeechText = normalizeAutoplaySpeechText(speechText);
  const canAutoplay = shouldAutoplayQuestionAudio({
    audioEnabled,
    listenFirstAudioEnabled,
    questionKey,
    speechText: normalizedSpeechText,
    stopSignal,
    suppressAutoplay,
  });

  useEffect(() => {
    if (stopSignal || !audioEnabled || !listenFirstAudioEnabled || suppressAutoplay) {
      stopSpeech();
    }
  }, [audioEnabled, listenFirstAudioEnabled, stopSignal, suppressAutoplay]);

  useEffect(() => {
    if (!canAutoplay || !questionKey) return undefined;
    if (lastPlayedQuestionKeyRef.current === questionKey) return undefined;

    lastPlayedQuestionKeyRef.current = questionKey;
    stopSpeech();
    speakSwedish(normalizedSpeechText, { rate });

    return () => {
      stopSpeech();
    };
  }, [canAutoplay, normalizedSpeechText, questionKey, rate]);
}
