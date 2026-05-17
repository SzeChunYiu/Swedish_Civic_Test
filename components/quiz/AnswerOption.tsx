import type { QuestionOption } from '../../types/content';
import { Button } from '../ui/Button';

type AnswerTone = 'idle' | 'correct' | 'incorrect';
type AnswerLanguage = 'sv' | 'en';

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
  const label = option ? getOptionLabel(option, language) : 'Answer option';
  const variant = tone === 'correct' ? 'success' : tone === 'incorrect' ? 'danger' : 'option';
  const accessibilityLabel = resultLabel ? `${label}, ${resultLabel}` : `Select answer ${label}`;

  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      variant={variant}
    >
      {resultLabel ? `${label} — ${resultLabel}` : label}
    </Button>
  );
}

function getOptionLabel(option: QuestionOption, language: AnswerLanguage) {
  return language === 'en' ? option.textEn : option.textSv;
}
