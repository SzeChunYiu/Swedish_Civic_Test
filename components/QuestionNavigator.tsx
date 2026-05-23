import { useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import type { AccessibilityRole, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useReducedMotion } from '../lib/motion/useReducedMotion';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

export type QuestionNavigatorItemState = 'current' | 'answered' | 'flagged' | 'unanswered';

type QuestionNavigatorCopy = {
  navigationLabel: string;
  questionLabel: string;
  statusLabel: string;
  stateLabels: Record<QuestionNavigatorItemState, string>;
};

const questionNavigatorCopy: Record<AppLanguage, QuestionNavigatorCopy> = {
  sv: {
    navigationLabel: 'Frågenavigering',
    questionLabel: 'Fråga',
    statusLabel: 'Frågestatus',
    stateLabels: {
      current: 'Aktuell fråga',
      answered: 'Besvarad',
      flagged: 'Flaggad',
      unanswered: 'Obesvarad',
    },
  },
  en: {
    navigationLabel: 'Question navigation',
    questionLabel: 'Question',
    statusLabel: 'Question status',
    stateLabels: {
      current: 'Current question',
      answered: 'Answered',
      flagged: 'Flagged',
      unanswered: 'Unanswered',
    },
  },
};

/**
 * Defaults: `currentIndex=0`, `answeredIndexes=[]`, `disabled=false`,
 * localized spoken labels from settings, and token-sized press targets.
 * Interactive navigators use tab semantics; status-only navigators use a
 * non-interactive list.
 */
export interface QuestionNavigatorProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  answeredIndexes?: readonly number[];
  currentIndex?: number | null;
  disabled?: boolean;
  flaggedIndexes?: readonly number[];
  itemAccessibilityLabel?: (questionNumber: number, state: QuestionNavigatorItemState) => string;
  itemStyle?: StyleProp<ViewStyle>;
  itemTextStyle?: StyleProp<TextStyle>;
  languageOverride?: AppLanguage;
  onSelect?: (index: number) => void;
  stateLabels?: Partial<Record<QuestionNavigatorItemState, string>>;
  style?: StyleProp<ViewStyle>;
  totalCount: number;
}

function getSafeTotalCount(totalCount: number) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) return 0;
  return Math.round(totalCount);
}

function getSafeIndex(index: number, totalCount: number) {
  if (!Number.isFinite(index) || totalCount <= 0) return 0;
  return Math.max(0, Math.min(Math.round(index), totalCount - 1));
}

function getItemState({
  answeredSet,
  currentIndex,
  flaggedSet,
  index,
}: {
  answeredSet: ReadonlySet<number>;
  currentIndex: number | null;
  flaggedSet: ReadonlySet<number>;
  index: number;
}): QuestionNavigatorItemState {
  if (currentIndex != null && index === currentIndex) return 'current';
  if (flaggedSet.has(index)) return 'flagged';
  return answeredSet.has(index) ? 'answered' : 'unanswered';
}

function getDefaultItemAccessibilityLabel({
  questionLabel,
  questionNumber,
  state,
  stateLabels,
}: {
  questionLabel: string;
  questionNumber: number;
  state: QuestionNavigatorItemState;
  stateLabels: Record<QuestionNavigatorItemState, string>;
}) {
  return `${questionLabel} ${questionNumber}. ${stateLabels[state]}.`;
}

export function QuestionNavigator({
  accessibilityLabel,
  accessibilityRole = 'tablist',
  answeredIndexes = [],
  currentIndex = 0,
  disabled = false,
  flaggedIndexes = [],
  itemAccessibilityLabel,
  itemStyle,
  itemTextStyle,
  languageOverride,
  onSelect,
  stateLabels,
  style,
  totalCount,
  ...viewProps
}: QuestionNavigatorProps) {
  const reduceMotion = useReducedMotion();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = questionNavigatorCopy[language];
  const safeTotalCount = getSafeTotalCount(totalCount);
  const safeCurrentIndex = currentIndex == null ? null : getSafeIndex(currentIndex, safeTotalCount);
  const answeredSet = new Set(
    answeredIndexes
      .filter((index) => Number.isFinite(index))
      .map((index) => Math.max(0, Math.min(Math.round(index), safeTotalCount - 1))),
  );
  const flaggedSet = new Set(
    flaggedIndexes
      .filter((index) => Number.isFinite(index))
      .map((index) => Math.max(0, Math.min(Math.round(index), safeTotalCount - 1))),
  );
  const resolvedStateLabels = { ...copy.stateLabels, ...stateLabels };
  const isInteractive = disabled !== true && typeof onSelect === 'function';
  const requestedAccessibilityRole = accessibilityRole as AccessibilityRole | undefined;
  const resolvedAccessibilityRole = isInteractive
    ? (requestedAccessibilityRole ?? 'tablist')
    : requestedAccessibilityRole === 'tablist'
      ? 'list'
      : (requestedAccessibilityRole ?? 'list');
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? (isInteractive ? copy.navigationLabel : copy.statusLabel);

  return (
    <View
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole={resolvedAccessibilityRole}
      style={[styles.grid, style]}
      {...viewProps}
    >
      {Array.from({ length: safeTotalCount }, (_, index) => {
        const questionNumber = index + 1;
        const state = getItemState({
          answeredSet,
          currentIndex: safeCurrentIndex,
          flaggedSet,
          index,
        });
        const selected = state === 'current';
        const itemLabel =
          itemAccessibilityLabel?.(questionNumber, state) ??
          getDefaultItemAccessibilityLabel({
            questionLabel: copy.questionLabel,
            questionNumber,
            state,
            stateLabels: resolvedStateLabels,
          });
        const itemContent = (
          <NativeText style={[styles.itemText, styles[`${state}Text`], itemTextStyle]}>
            {questionNumber}
          </NativeText>
        );

        if (!isInteractive) {
          return (
            <View
              accessible
              accessibilityLabel={itemLabel}
              accessibilityRole="text"
              key={questionNumber}
              style={[styles.item, styles[state], disabled ? styles.disabled : null, itemStyle]}
            >
              {itemContent}
            </View>
          );
        }

        return (
          <Pressable
            accessibilityLabel={itemLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={space[1]}
            key={questionNumber}
            onPress={() => onSelect?.(index)}
            style={({ pressed }) => [
              styles.item,
              styles[state],
              pressed && !reduceMotion ? styles.pressed : null,
              itemStyle,
            ]}
          >
            {itemContent}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[0.75],
    },
    item: {
      alignItems: 'center',
      borderRadius: radius.small,
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: space[6],
      minWidth: space[6],
      paddingHorizontal: space[0.5],
    },
    unanswered: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
    },
    answered: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.accent,
    },
    flagged: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    current: {
      backgroundColor: themeColors.text,
      borderColor: themeColors.text,
    },
    pressed: {
      transform: [{ scale: motion.pressedScale }],
    },
    disabled: {
      opacity: motion.pressedScale,
    },
    itemText: {
      ...typography.badge,
    },
    unansweredText: {
      color: themeColors.textSecondary,
    },
    answeredText: {
      color: themeColors.accent,
    },
    flaggedText: {
      color: themeColors.badgeBlueText,
    },
    currentText: {
      color: themeColors.surface,
    },
  });
}
