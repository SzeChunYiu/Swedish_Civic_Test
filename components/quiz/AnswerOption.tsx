import type { QuestionOption } from '../../types/content';
import { Button } from '../ui/Button';

type AnswerTone = 'idle' | 'correct' | 'incorrect';

export function AnswerOption({
  option,
  onPress,
  resultLabel,
  tone = 'idle',
}: {
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
      onPress={onPress}
      variant={variant}
    >
      {resultLabel ? `${label} — ${resultLabel}` : label}
    </Button>
  );
}
