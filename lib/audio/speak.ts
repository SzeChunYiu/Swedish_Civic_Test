import * as Speech from 'expo-speech';
import type { LocalizedContentText, QuestionOption } from '../../types/content';
import {
  getQuestionExplanationText,
  getQuestionOptionText,
  stripSourceAuthorityPhrasing,
} from '../quiz/questionText';

type SpeakableQuestion = {
  questionSv?: string | null;
  options?: QuestionOption[] | null;
  correctOptionId?: string | null;
  explanationSv?: string | null;
  explanationText?: Partial<LocalizedContentText> | null;
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

function normalizeSpeechText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getQuestionOptions(question: SpeakableQuestion | null | undefined): QuestionOption[] {
  return Array.isArray(question?.options)
    ? question.options.filter(
        (option): option is QuestionOption => typeof option === 'object' && option !== null,
      )
    : [];
}

function getSpeechCallback<T extends keyof Speech.SpeechOptions>(
  callback: unknown,
): Speech.SpeechOptions[T] | undefined {
  return typeof callback === 'function' ? (callback as Speech.SpeechOptions[T]) : undefined;
}

export function buildQuestionSpeechText(question: SpeakableQuestion | null | undefined): string {
  const rawPromptText = normalizeSpeechText(question?.questionSv);
  const promptText = stripSourceAuthorityPhrasing(rawPromptText) || rawPromptText;
  const optionText = getQuestionOptions(question)
    .map((option, index) => {
      const textSv = normalizeSpeechText(option.textSv);
      return textSv ? `Alternativ ${optionLetter(index)}. ${textSv}.` : '';
    })
    .filter(Boolean)
    .join(' ');
  return `${promptText} ${optionText}`.trim();
}

export function buildAnswerFeedbackSpeechText(
  question: SpeakableQuestion | null | undefined,
  selectedOptionId: string | null | undefined,
): string {
  if (!selectedOptionId || !question?.correctOptionId) return '';

  const options = getQuestionOptions(question);
  const correctOption = options.find((option) => option.id === question.correctOptionId);
  const selectedOption = options.find((option) => option.id === selectedOptionId);
  const selectedOptionText = getQuestionOptionText(selectedOption, 'sv', 'det valda svaret');
  const correctOptionText = getQuestionOptionText(
    correctOption,
    'sv',
    'det markerade rätta svaret',
  );
  const selectedIsCorrect = selectedOptionId === question.correctOptionId;
  const resultText = selectedIsCorrect
    ? `Du valde: ${selectedOptionText}. Det stämmer.`
    : `Du valde: ${selectedOptionText}. Det rätta svaret är: ${correctOptionText}.`;
  const explanationSource = {
    explanationSv: normalizeSpeechText(question.explanationSv),
    explanationText:
      question.explanationText &&
      typeof question.explanationText === 'object' &&
      !Array.isArray(question.explanationText)
        ? question.explanationText
        : undefined,
  };
  const explanationText = SOURCE_CITATION_REPLACEMENTS.reduce(
    (current, replacement) => current.replace(replacement, ''),
    stripSourceAuthorityPhrasing(
      getQuestionExplanationText(explanationSource, 'sv', explanationSource.explanationSv),
    ),
  ).trim();

  return `${resultText}${explanationText ? ` Förklaring: ${explanationText}` : ''}`.trim();
}

export interface SpeakSwedishOptions {
  /** Playback rate. Default 1.0. expo-speech clamps engine-supported range. */
  rate?: unknown;
  /** Called by expo-speech when playback finishes naturally. */
  onDone?: unknown;
  /** Called by expo-speech when playback fails. */
  onError?: unknown;
  /** Called by expo-speech when playback is stopped. */
  onStopped?: unknown;
}

export function speakSwedish(text: unknown, options: SpeakSwedishOptions = {}): void {
  const speechText = normalizeSpeechText(text);
  if (speechText.length === 0) return;
  const safeOptions = options && typeof options === 'object' ? options : {};
  const rate =
    typeof safeOptions.rate === 'number' &&
    Number.isFinite(safeOptions.rate) &&
    safeOptions.rate > 0
      ? Math.max(0.1, Math.min(2.0, safeOptions.rate))
      : undefined;
  try {
    Speech.speak(speechText, {
      language: 'sv-SE',
      ...(rate !== undefined ? { rate } : {}),
      onDone: getSpeechCallback<'onDone'>(safeOptions.onDone),
      onError: getSpeechCallback<'onError'>(safeOptions.onError),
      onStopped: getSpeechCallback<'onStopped'>(safeOptions.onStopped),
    });
  } catch (error) {
    console.warn('Speech unavailable:', error);
    const onError = getSpeechCallback<'onError'>(safeOptions.onError);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch (error) {
    console.warn('Speech stop unavailable:', error);
  }
}
