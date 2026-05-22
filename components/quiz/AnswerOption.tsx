import type { QuestionOption } from '../../types/content';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getQuestionOptionText } from '../../lib/quiz/questionText';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import { OptionCard } from '../OptionCard';
import type { OptionCardState } from '../OptionCard';

type AnswerTone = 'idle' | 'correct' | 'incorrect';
type AnswerLanguage = 'sv' | 'en';
type AnswerOptionCopy = {
  fallbackLabel: string;
  restoreStrikeout: string;
  restoreStrikeoutAccessibilityLabel: (label: string) => string;
  selectAccessibilityLabel: (label: string) => string;
  strikeout: string;
  strikeoutAccessibilityLabel: (label: string) => string;
  struckStateLabel: string;
  stateLabels: Record<Exclude<OptionCardState, 'idle'>, string>;
};

const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy> = {
  sv: {
    fallbackLabel: 'Svarsalternativ',
    restoreStrikeout: 'Återställ',
    restoreStrikeoutAccessibilityLabel: (label) => `Återställ svaret ${label}`,
    selectAccessibilityLabel: (label) => `Välj svaret ${label}`,
    strikeout: 'Eliminera',
    strikeoutAccessibilityLabel: (label) => `Eliminera svaret ${label}`,
    struckStateLabel: 'Eliminerat',
    stateLabels: {
      selected: 'Valt',
      correct: 'Rätt svar',
      incorrect: 'Fel svar',
    },
  },
  en: {
    fallbackLabel: 'Answer option',
    restoreStrikeout: 'Restore',
    restoreStrikeoutAccessibilityLabel: (label) => `Restore answer ${label}`,
    selectAccessibilityLabel: (label) => `Select answer ${label}`,
    strikeout: 'Eliminate',
    strikeoutAccessibilityLabel: (label) => `Eliminate answer ${label}`,
    struckStateLabel: 'Eliminated',
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
  onToggleStrikeout,
  resultLabel,
  selected = false,
  showStrikeoutControl = false,
  struck = false,
  tone = 'idle',
}: {
  disabled?: boolean;
  language?: AnswerLanguage;
  option?: QuestionOption;
  onPress?: () => void;
  onToggleStrikeout?: () => void;
  resultLabel?: string;
  selected?: boolean;
  showStrikeoutControl?: boolean;
  struck?: boolean;
  tone?: AnswerTone;
}) {
  const copy = answerOptionCopy[language];
  const reduceMotion = useReducedMotion();
  const [strikeoutFocused, setStrikeoutFocused] = useState(false);
  const label = option ? getOptionLabel(option, language) : copy.fallbackLabel;
  const state = getOptionCardState(tone, selected);
  const accessibilityLabel = resultLabel
    ? `${label}, ${resultLabel}`
    : struck
      ? `${label}, ${copy.struckStateLabel}`
      : copy.selectAccessibilityLabel(label);
  const stateLabel = state === 'idle' ? undefined : copy.stateLabels[state];
  const strikeoutAccessibilityLabel = struck
    ? copy.restoreStrikeoutAccessibilityLabel(label)
    : copy.strikeoutAccessibilityLabel(label);
  const strikeoutLabel = struck ? copy.restoreStrikeout : copy.strikeout;
  const optionDisabled = disabled || struck;

  return (
    <View style={styles.container}>
      <OptionCard
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: optionDisabled, selected }}
        disabled={optionDisabled}
        label={label}
        onPress={optionDisabled ? undefined : onPress}
        resultLabel={resultLabel}
        state={state}
        stateLabel={stateLabel}
        struck={struck}
      />
      {showStrikeoutControl && onToggleStrikeout ? (
        <Pressable
          accessibilityLabel={strikeoutAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ selected: struck }}
          aria-pressed={struck}
          hitSlop={space[1]}
          onBlur={() => setStrikeoutFocused(false)}
          onFocus={() => setStrikeoutFocused(true)}
          onPress={onToggleStrikeout}
          style={({ pressed }) => [
            styles.strikeoutButton,
            struck ? styles.strikeoutButtonActive : null,
            strikeoutFocused ? styles.strikeoutButtonFocused : null,
            pressed
              ? reduceMotion
                ? styles.strikeoutButtonPressedReducedMotion
                : styles.strikeoutButtonPressed
              : null,
          ]}
        >
          <Text style={[styles.strikeoutText, struck ? styles.strikeoutTextActive : null]}>
            {strikeoutLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getOptionLabel(option: QuestionOption, language: AnswerLanguage) {
  return getQuestionOptionText(option, language);
}

function getOptionCardState(tone: AnswerTone, selected: boolean): OptionCardState {
  if (tone !== 'idle') return tone;
  return selected ? 'selected' : 'idle';
}

const styles = StyleSheet.create({
  container: {
    gap: space[0.75],
  },
  strikeoutButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  strikeoutButtonActive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.textMuted,
  },
  strikeoutButtonFocused: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
  },
  strikeoutButtonPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  strikeoutButtonPressedReducedMotion: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focusSoft,
  },
  strikeoutText: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  strikeoutTextActive: {
    color: colors.text,
  },
});
