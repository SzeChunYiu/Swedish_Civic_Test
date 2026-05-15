import type { QuestionOption } from '../../types/content';
import { Button } from '../ui/Button';

export function AnswerOption({
  option,
  onPress,
  resultLabel,
}: {
  option?: QuestionOption;
  onPress?: () => void;
  resultLabel?: string;
}) {
  const label = option?.textSv ?? 'Answer option';

  return (
    <Button accessibilityLabel={`Select answer ${label}`} onPress={onPress}>
      {resultLabel ? `${label} — ${resultLabel}` : label}
    </Button>
  );
}
