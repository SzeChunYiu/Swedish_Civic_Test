import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import type { AccessibilityRole, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, motion, radius, space, typography } from '../lib/theme';

export type QuestionNavigatorItemState = 'current' | 'answered' | 'unanswered';

/**
 * Defaults: `currentIndex=0`, `answeredIndexes=[]`, `disabled=false`,
 * `accessibilityRole="tablist"`, English spoken state labels, and token-sized
 * press targets. Pass localized label props from the screen.
 */
export interface QuestionNavigatorProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  answeredIndexes?: readonly number[];
  currentIndex?: number;
  disabled?: boolean;
  itemAccessibilityLabel?: (questionNumber: number, state: QuestionNavigatorItemState) => string;
  itemStyle?: StyleProp<ViewStyle>;
  itemTextStyle?: StyleProp<TextStyle>;
  onSelect?: (index: number) => void;
  stateLabels?: Partial<Record<QuestionNavigatorItemState, string>>;
  style?: StyleProp<ViewStyle>;
  totalCount: number;
}

const defaultStateLabels = {
  current: 'Current question',
  answered: 'Answered',
  unanswered: 'Unanswered',
} as const satisfies Record<QuestionNavigatorItemState, string>;

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
  index,
}: {
  answeredSet: ReadonlySet<number>;
  currentIndex: number;
  index: number;
}): QuestionNavigatorItemState {
  if (index === currentIndex) return 'current';
  return answeredSet.has(index) ? 'answered' : 'unanswered';
}

function getDefaultItemAccessibilityLabel({
  questionNumber,
  state,
  stateLabels,
}: {
  questionNumber: number;
  state: QuestionNavigatorItemState;
  stateLabels: Record<QuestionNavigatorItemState, string>;
}) {
  return `Question ${questionNumber}. ${stateLabels[state]}.`;
}

export function QuestionNavigator({
  accessibilityLabel = 'Question navigation',
  accessibilityRole = 'tablist',
  answeredIndexes = [],
  currentIndex = 0,
  disabled = false,
  itemAccessibilityLabel,
  itemStyle,
  itemTextStyle,
  onSelect,
  stateLabels,
  style,
  totalCount,
  ...viewProps
}: QuestionNavigatorProps) {
  const safeTotalCount = getSafeTotalCount(totalCount);
  const safeCurrentIndex = getSafeIndex(currentIndex, safeTotalCount);
  const answeredSet = new Set(
    answeredIndexes
      .filter((index) => Number.isFinite(index))
      .map((index) => Math.max(0, Math.min(Math.round(index), safeTotalCount - 1))),
  );
  const resolvedStateLabels = { ...defaultStateLabels, ...stateLabels };
  const isDisabled = disabled === true || !onSelect;
  const resolvedAccessibilityRole = accessibilityRole as AccessibilityRole;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={resolvedAccessibilityRole}
      style={[styles.grid, style]}
      {...viewProps}
    >
      {Array.from({ length: safeTotalCount }, (_, index) => {
        const questionNumber = index + 1;
        const state = getItemState({ answeredSet, currentIndex: safeCurrentIndex, index });
        const selected = state === 'current';

        return (
          <Pressable
            accessibilityLabel={
              itemAccessibilityLabel?.(questionNumber, state) ??
              getDefaultItemAccessibilityLabel({
                questionNumber,
                state,
                stateLabels: resolvedStateLabels,
              })
            }
            accessibilityRole="tab"
            accessibilityState={{ disabled: isDisabled, selected }}
            disabled={isDisabled}
            hitSlop={space[1]}
            key={questionNumber}
            onPress={() => onSelect?.(index)}
            style={({ pressed }) => [
              styles.item,
              styles[state],
              pressed && !isDisabled ? styles.pressed : null,
              isDisabled ? styles.disabled : null,
              itemStyle,
            ]}
          >
            <NativeText style={[styles.itemText, styles[`${state}Text`], itemTextStyle]}>
              {questionNumber}
            </NativeText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
    minHeight: space[4],
    minWidth: space[4],
    paddingHorizontal: space[0.5],
  },
  unanswered: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  answered: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.accent,
  },
  current: {
    backgroundColor: colors.text,
    borderColor: colors.text,
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
    color: colors.textSecondary,
  },
  answeredText: {
    color: colors.accent,
  },
  currentText: {
    color: colors.surface,
  },
});
