import type { QuestionOption } from '../../types/content';
import { Button } from '../ui/Button';

type AnswerTone = 'idle' | 'correct' | 'incorrect';

export function AnswerOption({
  disabled = false,
  option,
  onPress,
  resultLabel,
  tone = 'idle',
}: {
  disabled?: boolean;
  option?: QuestionOption;
  onPress?: () => void;
  resultLabel?: string;
  tone?: AnswerTone;
}) {
  const label = option?.textSv ?? 'Answer option';
  const variant = tone === 'correct' ? 'success' : tone === 'incorrect' ? 'danger' : 'option';

  return (
    <Button
      accessibilityLabel={`Select answer ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      variant={variant}
    >
      {resultLabel ? `${label} — ${resultLabel}` : label}
    </Button>
  );
}
