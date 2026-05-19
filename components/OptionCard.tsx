import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../lib/theme';

export type OptionCardState = 'idle' | 'selected' | 'correct' | 'incorrect';

const defaultStateLabels: Record<AppLanguage, Record<OptionCardState, string | undefined>> = {
  sv: {
    idle: undefined,
    selected: 'Valt',
    correct: 'Rätt svar',
    incorrect: 'Fel svar',
  },
  en: {
    idle: undefined,
    selected: 'Selected',
    correct: 'Correct answer',
    incorrect: 'Incorrect answer',
  },
};

/**
 * Defaults: `state="idle"`, `disabled=false`, `accessibilityRole="radio"`,
 * `accessibilityState.checked=true` only for selected state or an explicit
 * checked override, localized state fallback labels from settings, and a
 * token-sized `hitSlop`. Pass
 * `accessibilityLabel`, `stateLabel`, or `languageOverride` when the spoken
 * copy needs screen-specific localization.
 */
export interface OptionCardProps extends Omit<PressableProps, 'children' | 'style'> {
  description?: string;
  descriptionStyle?: StyleProp<TextStyle>;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  languageOverride?: AppLanguage;
  resultLabel?: string;
  state?: OptionCardState;
  stateLabel?: string;
  style?: StyleProp<ViewStyle>;
}

function getAccessibilityLabel({
  description,
  label,
  resultLabel,
  stateLabel,
}: {
  description?: string;
  label: string;
  resultLabel?: string;
  stateLabel?: string;
}) {
  return [label, description, resultLabel ?? stateLabel].filter(Boolean).join('. ');
}

export function OptionCard({
  accessibilityLabel,
  accessibilityRole = 'radio',
  accessibilityState,
  description,
  descriptionStyle,
  disabled = false,
  hitSlop,
  label,
  labelStyle,
  languageOverride,
  resultLabel,
  state = 'idle',
  stateLabel,
  style,
  ...pressableProps
}: OptionCardProps) {
  const settingsLanguage = useSettingsStore((settings) => settings.language);
  const language = languageOverride ?? settingsLanguage;
  const resolvedStateLabel = stateLabel ?? defaultStateLabels[language][state];
  const isDisabled = disabled === true;
  const defaultChecked = state === 'selected';
  const isChecked = accessibilityState?.checked ?? defaultChecked;
  const defaultSelected = isChecked === true;
  const isSelected = accessibilityState?.selected ?? defaultSelected;
  const resolvedAccessibilityState = {
    ...accessibilityState,
    checked: isChecked,
    selected: isSelected,
    disabled: isDisabled || accessibilityState?.disabled,
  };

  return (
    <Pressable
      aria-checked={resolvedAccessibilityState.checked}
      aria-selected={resolvedAccessibilityState.selected}
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          description,
          label,
          resultLabel,
          stateLabel: resolvedStateLabel,
        })
      }
      accessibilityRole={accessibilityRole}
      accessibilityState={resolvedAccessibilityState}
      disabled={isDisabled}
      hitSlop={hitSlop ?? space[1]}
      style={({ pressed }) => [
        styles.base,
        getCardStateStyle(state),
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      {...pressableProps}
    >
      <View pointerEvents="none" style={[styles.marker, getMarkerStateStyle(state)]}>
        {isChecked ? <View style={[styles.markerDot, getMarkerDotStyle(state)]} /> : null}
      </View>
      <View style={styles.copy}>
        <NativeText style={[styles.label, getLabelStateStyle(state), labelStyle]}>
          {label}
        </NativeText>
        {description ? (
          <NativeText style={[styles.description, descriptionStyle]}>{description}</NativeText>
        ) : null}
      </View>
      {resultLabel ? (
        <NativeText style={[styles.resultLabel, getResultLabelStateStyle(state)]}>
          {resultLabel}
        </NativeText>
      ) : null}
    </Pressable>
  );
}

function getCardStateStyle(state: OptionCardState) {
  switch (state) {
    case 'selected':
      return styles.selected;
    case 'correct':
      return styles.correct;
    case 'incorrect':
      return styles.incorrect;
    case 'idle':
    default:
      return styles.idle;
  }
}

function getMarkerStateStyle(state: OptionCardState) {
  switch (state) {
    case 'selected':
      return styles.selectedMarker;
    case 'correct':
      return styles.correctMarker;
    case 'incorrect':
      return styles.incorrectMarker;
    case 'idle':
    default:
      return styles.idleMarker;
  }
}

function getMarkerDotStyle(state: OptionCardState) {
  switch (state) {
    case 'correct':
      return styles.correctDot;
    case 'incorrect':
      return styles.incorrectDot;
    case 'selected':
    case 'idle':
    default:
      return styles.selectedDot;
  }
}

function getLabelStateStyle(state: OptionCardState) {
  return state === 'incorrect' ? styles.warningLabel : styles.standardLabel;
}

function getResultLabelStateStyle(state: OptionCardState) {
  switch (state) {
    case 'correct':
      return styles.correctResultLabel;
    case 'incorrect':
      return styles.incorrectResultLabel;
    case 'selected':
    case 'idle':
    default:
      return styles.selectedResultLabel;
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[1.5],
    minHeight: space[8],
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  correct: {
    backgroundColor: colors.correctBg,
    borderColor: colors.success,
  },
  incorrect: {
    backgroundColor: colors.incorrectBg,
    borderColor: colors.warning,
  },
  pressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  disabled: {
    opacity: motion.pressedScale,
  },
  marker: {
    alignItems: 'center',
    borderRadius: radius.circle,
    borderWidth: space.hairline,
    height: space[3],
    justifyContent: 'center',
    width: space[3],
  },
  idleMarker: {
    borderColor: colors.border,
  },
  selectedMarker: {
    borderColor: colors.badgeBlueText,
  },
  correctMarker: {
    borderColor: colors.success,
  },
  incorrectMarker: {
    borderColor: colors.warning,
  },
  markerDot: {
    borderRadius: radius.circle,
    height: space[1],
    width: space[1],
  },
  selectedDot: {
    backgroundColor: colors.badgeBlueText,
  },
  correctDot: {
    backgroundColor: colors.success,
  },
  incorrectDot: {
    backgroundColor: colors.warning,
  },
  copy: {
    flex: 1,
    gap: space[0.5],
  },
  label: {
    ...typography.bodySemibold,
  },
  standardLabel: {
    color: colors.text,
  },
  warningLabel: {
    color: colors.warmDark,
  },
  description: {
    ...typography.captionLight,
    color: colors.textSecondary,
  },
  resultLabel: {
    ...typography.badge,
    textTransform: 'uppercase',
  },
  selectedResultLabel: {
    color: colors.badgeBlueText,
  },
  correctResultLabel: {
    color: colors.success,
  },
  incorrectResultLabel: {
    color: colors.warning,
  },
});
