import * as Speech from 'expo-speech';
import type { LocalizedContentText, QuestionOption } from '../../types/content';
import {
  getQuestionExplanationText,
  getQuestionOptionText,
  stripSourceAuthorityPhrasing,
} from '../quiz/questionText';

type SpeakableQuestion = {
  questionSv: string;
  options: QuestionOption[];
  correctOptionId?: string;
  explanationSv?: string;
  explanationText?: Partial<LocalizedContentText>;
};

const SOURCE_CITATION_REPLACEMENTS = [
  /^\s*Enligt UHR-materialet\s+/gi,
  /^\s*According to the UHR material\s+/gi,
  /\s*\bKälla\s*:\s*Sverige i fokus\b[\s\S]*$/gi,
  /\s*\bSource\s*:\s*Sverige i fokus\b[\s\S]*$/gi,
  /\s*\bUHR-källa\s*:\s*[\s\S]*$/gi,
  /\s*\bUHR reference\s*:\s*[\s\S]*$/gi,
];

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

export function buildAnswerFeedbackSpeechText(
  question: SpeakableQuestion,
  selectedOptionId: string | null | undefined,
): string {
  if (!selectedOptionId) return '';

  const selectedOption = question.options.find((option) => option.id === selectedOptionId);
  if (!selectedOption) return '';

  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  const selectedText = spokenSentenceText(getQuestionOptionText(selectedOption, 'sv'));
  const correctText = correctOption
    ? spokenSentenceText(getQuestionOptionText(correctOption, 'sv'))
    : '';
  const explanationText = spokenSentenceText(
    getQuestionExplanationText(question, 'sv', question.explanationSv ?? ''),
  );
  const selectedIsCorrect = selectedOption.id === question.correctOptionId;
  const answerFeedback = selectedIsCorrect
    ? 'Det stämmer.'
    : correctText
      ? `Det rätta svaret är: ${correctText}`
      : 'Det svaret är inte markerat som rätt.';

  return [
    `Du valde: ${selectedText}`,
    answerFeedback,
    explanationText ? `Förklaring: ${explanationText}` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function spokenSentenceText(text: string): string {
  const sourceTrimmedText = SOURCE_CITATION_REPLACEMENTS.reduce(
    (current, replacement) => current.replace(replacement, ''),
    text,
  );
  const cleaned = stripSourceAuthorityPhrasing(sourceTrimmedText)
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned) return '';
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

export interface SpeakSwedishOptions {
  /** Playback rate. Default 1.0. expo-speech clamps engine-supported range. */
  rate?: number;
  /** Called by expo-speech when playback finishes naturally. */
  onDone?: Speech.SpeechOptions['onDone'];
  /** Called by expo-speech when playback fails. */
  onError?: Speech.SpeechOptions['onError'];
  /** Called by expo-speech when playback is stopped. */
  onStopped?: Speech.SpeechOptions['onStopped'];
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
      onDone: options.onDone,
      onError: options.onError,
      onStopped: options.onStopped,
    });
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
