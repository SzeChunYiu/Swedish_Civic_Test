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

export function speakSwedish(text: string): void {
  const speechText = text.trim();
  if (speechText.length === 0) return;
  try {
    Speech.speak(speechText, { language: 'sv-SE' });
  } catch (error) {
    console.warn('Speech unavailable:', error);
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch (error) {
    console.warn('Speech stop unavailable:', error);
  }
}
