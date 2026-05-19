import type { QuestionOption } from '../../types/content';
import { OptionCard } from '../OptionCard';
import type { OptionCardState } from '../OptionCard';

type AnswerTone = 'idle' | 'correct' | 'incorrect';
type AnswerLanguage = 'sv' | 'en';
type AnswerOptionCopy = {
  fallbackLabel: string;
  selectAccessibilityLabel: (label: string) => string;
  stateLabels: Record<Exclude<OptionCardState, 'idle'>, string>;
};

const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy> = {
  sv: {
    fallbackLabel: 'Svarsalternativ',
    selectAccessibilityLabel: (label) => `Välj svaret ${label}`,
    stateLabels: {
      selected: 'Valt',
      correct: 'Rätt svar',
      incorrect: 'Fel svar',
    },
  },
  en: {
    fallbackLabel: 'Answer option',
    selectAccessibilityLabel: (label) => `Select answer ${label}`,
    stateLabels: {
      selected: 'Selected',
      correct: 'Correct answer',
      incorrect: 'Wrong answer',
    },
  },
};

export function AnswerOption({
  disabled = false,
  language = 'sv',
  option,
  onPress,
  resultLabel,
  selected = false,
  tone = 'idle',
}: {
  disabled?: boolean;
  language?: AnswerLanguage;
  option?: QuestionOption;
  onPress?: () => void;
  resultLabel?: string;
  selected?: boolean;
  tone?: AnswerTone;
}) {
  const copy = answerOptionCopy[language];
  const label = option ? getOptionLabel(option, language) : copy.fallbackLabel;
  const state = getOptionCardState(tone, selected);
  const accessibilityLabel = resultLabel
    ? `${label}, ${resultLabel}`
    : copy.selectAccessibilityLabel(label);
  const stateLabel = state === 'idle' ? undefined : copy.stateLabels[state];

  return (
    <OptionCard
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      label={label}
      onPress={onPress}
      resultLabel={resultLabel}
      state={state}
      stateLabel={stateLabel}
    />
  );
}

function getOptionLabel(option: QuestionOption, language: AnswerLanguage) {
  return language === 'en' ? option.textEn : option.textSv;
}

function getOptionCardState(tone: AnswerTone, selected: boolean): OptionCardState {
  if (tone !== 'idle') return tone;
  return selected ? 'selected' : 'idle';
}
