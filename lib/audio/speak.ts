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
  /** Playback rate. Default 1.0. expo-speech clamps engine-supported range. */
  rate?: number;
  onDone?: () => void;
  onError?: (error: Error) => void;
  onStopped?: () => void;
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
      ...(rate !== undefined ? { rate } : {}),
      ...(options.onDone ? { onDone: options.onDone } : {}),
      ...(options.onError ? { onError: options.onError } : {}),
      ...(options.onStopped ? { onStopped: options.onStopped } : {}),
    });
  } catch (error) {
    console.warn('Speech unavailable:', error);
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch (error) {
    console.warn('Speech stop unavailable:', error);
  }
}
