import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, motion, radius, shadows, space } from '../lib/theme';
import { Button } from './Button';
import { PillBadge } from './PillBadge';
import { Surface } from './Surface';
import type { SurfaceProps } from './Surface';
import { Text } from './Text';

type ChapterId = string | number;

export interface MockExamChapterOption {
  accessibilityLabel?: string;
  disabled?: boolean;
  emoji?: string;
  id: ChapterId;
  subtitle?: string;
  title: string;
}

/**
 * Defaults: English labels, `minQuestionCount=5`, `questionStep=1`,
 * `minDurationMinutes=2`, `maxDurationMinutes=90`, `durationStep=1`,
 * `passingPercent=75`, `accessibilityRole="summary"`, and token-sized
 * press targets. Pass localized labels and callbacks from the owning screen.
 */
export interface MockExamConfigPanelProps extends Omit<SurfaceProps, 'children'> {
  allChaptersLabel?: string;
  chapters: MockExamChapterOption[];
  chaptersHint?: string;
  chaptersLabel?: string;
  clearChaptersLabel?: string;
  decrementDurationAccessibilityLabel?: string;
  decrementQuestionAccessibilityLabel?: string;
  durationHint?: string;
  durationLabel?: string;
  durationMinutes: number;
  durationStep?: number;
  durationValueLabel?: (minutes: number) => string;
  feedbackLabel?: string;
  incrementDurationAccessibilityLabel?: string;
  incrementQuestionAccessibilityLabel?: string;
  localSaveLabel?: string;
  maxDurationMinutes?: number;
  maxQuestionCount: number;
  minDurationMinutes?: number;
  minQuestionCount?: number;
  onClearChapters?: () => void;
  onDurationMinutesChange?: (minutes: number) => void;
  onPractice?: () => void;
  onQuestionCountChange?: (count: number) => void;
  onReset?: () => void;
  onSelectAllChapters?: () => void;
  onStart?: () => void;
  onToggleChapter?: (chapterId: ChapterId) => void;
  passingLabel?: string;
  passingPercent?: number;
  practiceLabel?: string;
  questionCount: number;
  questionCountHint?: string;
  questionCountLabel?: string;
  questionStep?: number;
  resetLabel?: string;
  selectedChapterIds?: readonly ChapterId[];
  selectedChaptersValueLabel?: (count: number) => string;
  startAccessibilityLabel?: string;
  startDisabled?: boolean;
  startLabel?: string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title: string;
}

interface StepperProps {
  decrementAccessibilityLabel: string;
  disabled?: boolean;
  incrementAccessibilityLabel: string;
  label: string;
  max: number;
  min: number;
  onChange?: (value: number) => void;
  step: number;
  value: number;
  valueLabel: string;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(Math.round(value), max));
}

function getNextValue(value: number, step: number, direction: -1 | 1, min: number, max: number) {
  const safeStep = Number.isFinite(step) && step > 0 ? Math.round(step) : 1;
  return clamp(value + safeStep * direction, min, max);
}

function idsMatch(left: ChapterId, right: ChapterId) {
  return String(left) === String(right);
}

function getSelectedCount(
  chapters: MockExamChapterOption[],
  selectedChapterIds: readonly ChapterId[],
) {
  return chapters.filter((chapter) =>
    selectedChapterIds.some((selectedId) => idsMatch(selectedId, chapter.id)),
  ).length;
}

function getPanelAccessibilityLabel({
  chaptersLabel,
  durationLabel,
  durationValueLabel,
  questionCount,
  questionCountLabel,
  selectedChaptersValueLabel,
  title,
}: {
  chaptersLabel: string;
  durationLabel: string;
  durationValueLabel: string;
  questionCount: number;
  questionCountLabel: string;
  selectedChaptersValueLabel: string;
  title: string;
}) {
  return `${title}. ${questionCountLabel}: ${questionCount}. ${durationLabel}: ${durationValueLabel}. ${chaptersLabel}: ${selectedChaptersValueLabel}.`;
}

function Stepper({
  decrementAccessibilityLabel,
  disabled = false,
  incrementAccessibilityLabel,
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: StepperProps) {
  const canDecrement = value > min && !disabled && Boolean(onChange);
  const canIncrement = value < max && !disabled && Boolean(onChange);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      accessibilityValue={{ max, min, now: value, text: valueLabel }}
      style={styles.stepper}
    >
      <View style={styles.stepperCopy}>
        <Text tone="secondary" variant="caption">
          {label}
        </Text>
        <Text style={styles.stepperValue} variant="label">
          {valueLabel}
        </Text>
      </View>
      <View style={styles.stepperControls}>
        <Pressable
          accessibilityLabel={decrementAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrement }}
          disabled={!canDecrement}
          hitSlop={space[1]}
          onPress={() => onChange?.(getNextValue(value, step, -1, min, max))}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && canDecrement ? styles.pressed : null,
            !canDecrement ? styles.disabledControl : null,
          ]}
        >
          <Text align="center" style={styles.stepperSymbol} variant="label">
            -
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={incrementAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrement }}
          disabled={!canIncrement}
          hitSlop={space[1]}
          onPress={() => onChange?.(getNextValue(value, step, 1, min, max))}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && canIncrement ? styles.pressed : null,
            !canIncrement ? styles.disabledControl : null,
          ]}
        >
          <Text align="center" style={styles.stepperSymbol} variant="label">
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MockExamConfigPanel({
  accessibilityLabel,
  accessibilityRole = 'summary',
  allChaptersLabel = 'All',
  chapters,
  chaptersHint,
  chaptersLabel = 'Chapters',
  clearChaptersLabel = 'None',
  decrementDurationAccessibilityLabel = 'Decrease exam duration',
  decrementQuestionAccessibilityLabel = 'Decrease question count',
  durationHint,
  durationLabel = 'Time',
  durationMinutes,
  durationStep = 1,
  durationValueLabel = (minutes) => `${minutes} min`,
  elevation = 'card',
  feedbackLabel = 'No feedback until submit',
  incrementDurationAccessibilityLabel = 'Increase exam duration',
  incrementQuestionAccessibilityLabel = 'Increase question count',
  localSaveLabel = 'Saved locally',
  maxDurationMinutes = 90,
  maxQuestionCount,
  minDurationMinutes = 2,
  minQuestionCount = 5,
  onClearChapters,
  onDurationMinutesChange,
  onPractice,
  onQuestionCountChange,
  onReset,
  onSelectAllChapters,
  onStart,
  onToggleChapter,
  passingLabel = 'Pass',
  passingPercent = 75,
  practiceLabel = 'Practice first',
  questionCount,
  questionCountHint,
  questionCountLabel = 'Questions',
  questionStep = 1,
  resetLabel = 'Reset',
  selectedChapterIds = chapters.map((chapter) => chapter.id),
  selectedChaptersValueLabel = (count) => `${count} selected`,
  startAccessibilityLabel,
  startDisabled = false,
  startLabel = 'Start exam',
  style,
  subtitle,
  title,
  tone = 'surface',
  ...surfaceProps
}: MockExamConfigPanelProps) {
  const safeMinQuestionCount = Math.max(0, Math.round(minQuestionCount));
  const safeMaxQuestionCount = Math.max(safeMinQuestionCount, Math.round(maxQuestionCount));
  const safeQuestionCount = clamp(questionCount, safeMinQuestionCount, safeMaxQuestionCount);
  const safeMinDuration = Math.max(0, Math.round(minDurationMinutes));
  const safeMaxDuration = Math.max(safeMinDuration, Math.round(maxDurationMinutes));
  const safeDuration = clamp(durationMinutes, safeMinDuration, safeMaxDuration);
  const selectedChapterCount = getSelectedCount(chapters, selectedChapterIds);
  const hasSelectableChapters = chapters.some((chapter) => !chapter.disabled);
  const startIsDisabled = startDisabled || !onStart || selectedChapterCount === 0;
  const resolvedDurationValueLabel = durationValueLabel(safeDuration);
  const resolvedSelectedChaptersValueLabel = selectedChaptersValueLabel(selectedChapterCount);

  return (
    <Surface
      accessibilityLabel={
        accessibilityLabel ??
        getPanelAccessibilityLabel({
          chaptersLabel,
          durationLabel,
          durationValueLabel: resolvedDurationValueLabel,
          questionCount: safeQuestionCount,
          questionCountLabel,
          selectedChaptersValueLabel: resolvedSelectedChaptersValueLabel,
          title,
        })
      }
      accessibilityRole={accessibilityRole}
      elevation={elevation}
      style={[styles.panel, style]}
      tone={tone}
      {...surfaceProps}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="h2">{title}</Text>
          {subtitle ? (
            <Text tone="secondary" variant="body">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <PillBadge
          accessibilityLabel={`${passingLabel} ${passingPercent} percent`}
          variant="accent"
        >
          {passingPercent}%
        </PillBadge>
      </View>

      <View style={styles.controlsGrid}>
        <View style={styles.controlCard}>
          <Stepper
            decrementAccessibilityLabel={decrementQuestionAccessibilityLabel}
            incrementAccessibilityLabel={incrementQuestionAccessibilityLabel}
            label={questionCountLabel}
            max={safeMaxQuestionCount}
            min={safeMinQuestionCount}
            onChange={onQuestionCountChange}
            step={questionStep}
            value={safeQuestionCount}
            valueLabel={String(safeQuestionCount)}
          />
          {questionCountHint ? (
            <Text tone="disclaimer" variant="caption">
              {questionCountHint}
            </Text>
          ) : null}
        </View>

        <View style={styles.controlCard}>
          <Stepper
            decrementAccessibilityLabel={decrementDurationAccessibilityLabel}
            incrementAccessibilityLabel={incrementDurationAccessibilityLabel}
            label={durationLabel}
            max={safeMaxDuration}
            min={safeMinDuration}
            onChange={onDurationMinutesChange}
            step={durationStep}
            value={safeDuration}
            valueLabel={resolvedDurationValueLabel}
          />
          {durationHint ? (
            <Text tone="disclaimer" variant="caption">
              {durationHint}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.chapterSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerCopy}>
            <Text variant="label">{chaptersLabel}</Text>
            {chaptersHint ? (
              <Text tone="secondary" variant="caption">
                {chaptersHint}
              </Text>
            ) : null}
          </View>
          <View style={styles.selectActions}>
            <Button
              accessibilityLabel={allChaptersLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: !onSelectAllChapters || !hasSelectableChapters }}
              disabled={!onSelectAllChapters || !hasSelectableChapters}
              onPress={onSelectAllChapters}
              size="sm"
              variant="ghost"
            >
              {allChaptersLabel}
            </Button>
            <Button
              accessibilityLabel={clearChaptersLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: !onClearChapters || !hasSelectableChapters }}
              disabled={!onClearChapters || !hasSelectableChapters}
              onPress={onClearChapters}
              size="sm"
              variant="ghost"
            >
              {clearChaptersLabel}
            </Button>
          </View>
        </View>

        <View accessibilityLabel={chaptersLabel} accessibilityRole="summary" style={styles.chips}>
          {chapters.map((chapter) => {
            const selected = selectedChapterIds.some((selectedId) =>
              idsMatch(selectedId, chapter.id),
            );
            const disabled = chapter.disabled || !onToggleChapter;

            return (
              <Pressable
                accessibilityLabel={chapter.accessibilityLabel ?? chapter.title}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                hitSlop={space[1]}
                key={String(chapter.id)}
                onPress={() => onToggleChapter?.(chapter.id)}
                style={({ pressed }) => [
                  styles.chapterChip,
                  selected ? styles.chapterChipSelected : null,
                  pressed && !disabled ? styles.pressed : null,
                  disabled ? styles.disabledControl : null,
                ]}
              >
                <View pointerEvents="none" style={styles.chapterChipCopy}>
                  {chapter.emoji ? (
                    <Text style={styles.chapterEmoji} variant="label">
                      {chapter.emoji}
                    </Text>
                  ) : null}
                  <View style={styles.chapterText}>
                    <Text style={selected ? styles.chapterTitleSelected : null} variant="label">
                      {chapter.title}
                    </Text>
                    {chapter.subtitle ? (
                      <Text tone="secondary" variant="caption">
                        {chapter.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.metaRow}>
        <PillBadge>{`${passingPercent}% ${passingLabel}`}</PillBadge>
        <PillBadge>{feedbackLabel}</PillBadge>
        <PillBadge>{localSaveLabel}</PillBadge>
      </View>

      <View style={styles.actions}>
        <Button
          accessibilityLabel={startAccessibilityLabel ?? startLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: startIsDisabled }}
          disabled={startIsDisabled}
          onPress={onStart}
          style={styles.primaryAction}
          variant="primary"
        >
          {startLabel}
        </Button>
        <Button
          accessibilityLabel={practiceLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !onPractice }}
          disabled={!onPractice}
          onPress={onPractice}
          style={styles.secondaryAction}
          variant="secondary"
        >
          {practiceLabel}
        </Button>
        {onReset ? (
          <Button
            accessibilityLabel={resetLabel}
            accessibilityRole="button"
            onPress={onReset}
            size="sm"
            variant="ghost"
          >
            {resetLabel}
          </Button>
        ) : null}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space[2],
    padding: space[2.25],
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: space[1.5],
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: space[0.75],
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  controlCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexBasis: space[15],
    flexGrow: 1,
    gap: space[1],
    padding: space[1.5],
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
    justifyContent: 'space-between',
  },
  stepperCopy: {
    flex: 1,
    gap: space[0.5],
  },
  stepperValue: {
    color: colors.text,
  },
  stepperControls: {
    flexDirection: 'row',
    gap: space[0.75],
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    height: space[6],
    justifyContent: 'center',
    width: space[6],
  },
  stepperSymbol: {
    color: colors.accent,
  },
  pressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  disabledControl: {
    opacity: motion.pressedScale,
  },
  chapterSection: {
    gap: space[1.25],
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
  selectActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[0.75],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  chapterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexBasis: space[12],
    flexGrow: 1,
    padding: space[1.25],
    ...shadows.card,
  },
  chapterChipSelected: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.accent,
  },
  chapterChipCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1],
  },
  chapterEmoji: {
    minWidth: space[3],
    textAlign: 'center',
  },
  chapterText: {
    flex: 1,
    gap: space[0.5],
  },
  chapterTitleSelected: {
    color: colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[0.75],
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  primaryAction: {
    flexGrow: 1,
  },
  secondaryAction: {
    flexGrow: 1,
  },
});
