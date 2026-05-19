import * as Speech from 'expo-speech';
import type { QuestionOption } from '../../types/content';
import { stripSourceAuthorityPhrasing } from '../quiz/questionText';

type SpeakableQuestion = {
  questionSv: string;
  options: QuestionOption[];
};

function optionLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

export function buildQuestionSpeechText(question: SpeakableQuestion): string {
  const promptText = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;
  const optionText = question.options
    .map((option, index) => `Alternativ ${optionLetter(index)}. ${option.textSv}.`)
    .join(' ');
  return `${promptText} ${optionText}`.trim();
}

export interface SpeakSwedishOptions {
  onDone?: Speech.SpeechOptions['onDone'];
  onError?: Speech.SpeechOptions['onError'];
  onStart?: Speech.SpeechOptions['onStart'];
  onStopped?: Speech.SpeechOptions['onStopped'];
  /** Playback rate. Default 1.0. expo-speech clamps engine-supported range. */
  rate?: number;
}

export function speakSwedish(text: string, options: SpeakSwedishOptions = {}): void {
  const speechText = text.trim();
  if (speechText.length === 0) return;
  const rate =
    typeof options.rate === 'number' && options.rate > 0
      ? Math.max(0.1, Math.min(2.0, options.rate))
      : undefined;
  try {
    Speech.speak(speechText, {
      language: 'sv-SE',
      onDone: options.onDone,
      onError: options.onError,
      onStart: options.onStart,
      onStopped: options.onStopped,
      ...(rate !== undefined ? { rate } : {}),
    });
  } catch (error) {
    const speechError = error instanceof Error ? error : new Error(String(error));
    options.onError?.(speechError);
    console.warn('Speech unavailable:', speechError);
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch (error) {
    console.warn('Speech stop unavailable:', error);
  }
}
