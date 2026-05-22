import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { forwardRef, useMemo } from 'react';
import type { ElementRef } from 'react';

import { useReducedMotion } from '../lib/motion/useReducedMotion';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

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
 * `accessibilityState.checked=true` for non-idle states, localized state
 * fallback labels from settings, and a token-sized `hitSlop`. Pass
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
  struck?: boolean;
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

export const OptionCard = forwardRef<ElementRef<typeof Pressable>, OptionCardProps>(
  function OptionCard(
    {
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
      struck = false,
      ...pressableProps
    },
    ref,
  ) {
    const themeColors = useThemeColors();
    const reduceMotion = useReducedMotion();
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);
    const settingsLanguage = useSettingsStore((settings) => settings.language);
    const language = languageOverride ?? settingsLanguage;
    const resolvedStateLabel = stateLabel ?? defaultStateLabels[language][state];
    const isDisabled = disabled === true;
    const isChecked = state !== 'idle';
    const resolvedAccessibilityState = {
      ...accessibilityState,
      checked: accessibilityState?.checked ?? isChecked,
      disabled: isDisabled || accessibilityState?.disabled,
    };

    return (
      <Pressable
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
        ref={ref}
        style={({ pressed }) => [
          styles.base,
          getCardStateStyle(styles, state),
          struck ? styles.struck : null,
          pressed && !isDisabled && !reduceMotion ? styles.pressed : null,
          isDisabled ? styles.disabled : null,
          style,
        ]}
        {...pressableProps}
      >
        <View
          pointerEvents="none"
          style={[
            styles.marker,
            getMarkerStateStyle(styles, state),
            struck ? styles.struckMarker : null,
          ]}
        >
          {isChecked ? <View style={[styles.markerDot, getMarkerDotStyle(styles, state)]} /> : null}
        </View>
        <View style={styles.copy}>
          <NativeText
            style={[
              styles.label,
              getLabelStateStyle(styles, state),
              struck ? styles.struckLabel : null,
              labelStyle,
            ]}
          >
            {label}
          </NativeText>
          {description ? (
            <NativeText
              style={[
                styles.description,
                struck ? styles.struckDescription : null,
                descriptionStyle,
              ]}
            >
              {description}
            </NativeText>
          ) : null}
        </View>
        {resultLabel ? (
          <NativeText style={[styles.resultLabel, getResultLabelStateStyle(styles, state)]}>
            {resultLabel}
          </NativeText>
        ) : null}
      </Pressable>
    );
  },
);

function getCardStateStyle(styles: ReturnType<typeof createStyles>, state: OptionCardState) {
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

function getMarkerStateStyle(styles: ReturnType<typeof createStyles>, state: OptionCardState) {
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

function getMarkerDotStyle(styles: ReturnType<typeof createStyles>, state: OptionCardState) {
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

function getLabelStateStyle(styles: ReturnType<typeof createStyles>, state: OptionCardState) {
  return state === 'incorrect' ? styles.warningLabel : styles.standardLabel;
}

function getResultLabelStateStyle(styles: ReturnType<typeof createStyles>, state: OptionCardState) {
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    selected: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    correct: {
      backgroundColor: themeColors.correctBg,
      borderColor: themeColors.success,
    },
    incorrect: {
      backgroundColor: themeColors.incorrectBg,
      borderColor: themeColors.warning,
    },
    struck: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
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
      borderColor: themeColors.border,
    },
    selectedMarker: {
      borderColor: themeColors.badgeBlueText,
    },
    correctMarker: {
      borderColor: themeColors.success,
    },
    incorrectMarker: {
      borderColor: themeColors.warning,
    },
    struckMarker: {
      borderColor: themeColors.textMuted,
    },
    markerDot: {
      borderRadius: radius.circle,
      height: space[1],
      width: space[1],
    },
    selectedDot: {
      backgroundColor: themeColors.badgeBlueText,
    },
    correctDot: {
      backgroundColor: themeColors.success,
    },
    incorrectDot: {
      backgroundColor: themeColors.warning,
    },
    copy: {
      flex: 1,
      gap: space[0.5],
    },
    label: {
      ...typography.bodySemibold,
    },
    standardLabel: {
      color: themeColors.text,
    },
    warningLabel: {
      color: themeColors.warmDark,
    },
    struckLabel: {
      color: themeColors.textMuted,
      textDecorationLine: 'line-through',
    },
    description: {
      ...typography.captionLight,
      color: themeColors.textSecondary,
    },
    struckDescription: {
      color: themeColors.textMuted,
    },
    resultLabel: {
      ...typography.badge,
      textTransform: 'uppercase',
    },
    selectedResultLabel: {
      color: themeColors.badgeBlueText,
    },
    correctResultLabel: {
      color: themeColors.success,
    },
    incorrectResultLabel: {
      color: themeColors.warning,
    },
  });
}
