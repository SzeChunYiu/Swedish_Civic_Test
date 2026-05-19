import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
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

type MockExamConfigPanelCopy = {
  allChaptersLabel: string;
  chaptersLabel: string;
  clearChaptersLabel: string;
  decrementDurationAccessibilityLabel: string;
  decrementQuestionAccessibilityLabel: string;
  durationLabel: string;
  durationValueLabel: (minutes: number) => string;
  feedbackLabel: string;
  incrementDurationAccessibilityLabel: string;
  incrementQuestionAccessibilityLabel: string;
  localSaveLabel: string;
  practiceLabel: string;
  questionCountLabel: string;
  resetLabel: string;
  scoreModeLabel: string;
  selectedChaptersValueLabel: (count: number) => string;
  sourceScopeLabel: string;
  startLabel: string;
};

const mockExamConfigPanelCopy: Record<AppLanguage, MockExamConfigPanelCopy> = {
  sv: {
    allChaptersLabel: 'Alla',
    chaptersLabel: 'Kapitel',
    clearChaptersLabel: 'Inga',
    decrementDurationAccessibilityLabel: 'Minska provtid',
    decrementQuestionAccessibilityLabel: 'Minska antal frågor',
    durationLabel: 'Tid',
    durationValueLabel: (minutes) => `${minutes} min`,
    feedbackLabel: 'Ingen återkoppling före inlämning',
    incrementDurationAccessibilityLabel: 'Öka provtid',
    incrementQuestionAccessibilityLabel: 'Öka antal frågor',
    localSaveLabel: 'Sparas lokalt',
    practiceLabel: 'Öva först',
    questionCountLabel: 'Frågor',
    resetLabel: 'Återställ',
    scoreModeLabel: 'Resultat är övning',
    selectedChaptersValueLabel: (count) => (count === 1 ? '1 valt' : `${count} valda`),
    sourceScopeLabel: 'UHR-baserade frågor',
    startLabel: 'Starta provet',
  },
  en: {
    allChaptersLabel: 'All',
    chaptersLabel: 'Chapters',
    clearChaptersLabel: 'None',
    decrementDurationAccessibilityLabel: 'Decrease exam duration',
    decrementQuestionAccessibilityLabel: 'Decrease question count',
    durationLabel: 'Time',
    durationValueLabel: (minutes) => `${minutes} min`,
    feedbackLabel: 'No feedback until submit',
    incrementDurationAccessibilityLabel: 'Increase exam duration',
    incrementQuestionAccessibilityLabel: 'Increase question count',
    localSaveLabel: 'Saved locally',
    practiceLabel: 'Practice first',
    questionCountLabel: 'Questions',
    resetLabel: 'Reset',
    scoreModeLabel: 'Practice result',
    selectedChaptersValueLabel: (count) => `${count} selected`,
    sourceScopeLabel: 'UHR-based questions',
    startLabel: 'Start exam',
  },
};

/**
 * Defaults: localized labels from settings, `minQuestionCount=5`,
 * `questionStep=1`, `minDurationMinutes=2`, `maxDurationMinutes=90`,
 * `durationStep=1`, `accessibilityRole="summary"`, and token-sized press
 * targets. Pass localized labels and callbacks from
 * the owning screen for screen-specific copy.
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
  languageOverride?: AppLanguage;
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
  practiceLabel?: string;
  questionCount: number;
  questionCountHint?: string;
  questionCountLabel?: string;
  questionStep?: number;
  resetLabel?: string;
  scoreModeLabel?: string;
  selectedChapterIds?: readonly ChapterId[];
  selectedChaptersValueLabel?: (count: number) => string;
  sourceScopeLabel?: string;
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
  allChaptersLabel,
  chapters,
  chaptersHint,
  chaptersLabel,
  clearChaptersLabel,
  decrementDurationAccessibilityLabel,
  decrementQuestionAccessibilityLabel,
  durationHint,
  durationLabel,
  durationMinutes,
  durationStep = 1,
  durationValueLabel,
  elevation = 'card',
  feedbackLabel,
  incrementDurationAccessibilityLabel,
  incrementQuestionAccessibilityLabel,
  languageOverride,
  localSaveLabel,
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
  practiceLabel,
  questionCount,
  questionCountHint,
  questionCountLabel,
  questionStep = 1,
  resetLabel,
  scoreModeLabel,
  selectedChapterIds = chapters.map((chapter) => chapter.id),
  selectedChaptersValueLabel,
  sourceScopeLabel,
  startAccessibilityLabel,
  startDisabled = false,
  startLabel,
  style,
  subtitle,
  title,
  tone = 'surface',
  ...surfaceProps
}: MockExamConfigPanelProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = mockExamConfigPanelCopy[language];
  const resolvedAllChaptersLabel = allChaptersLabel ?? copy.allChaptersLabel;
  const resolvedChaptersLabel = chaptersLabel ?? copy.chaptersLabel;
  const resolvedClearChaptersLabel = clearChaptersLabel ?? copy.clearChaptersLabel;
  const resolvedDecrementDurationAccessibilityLabel =
    decrementDurationAccessibilityLabel ?? copy.decrementDurationAccessibilityLabel;
  const resolvedDecrementQuestionAccessibilityLabel =
    decrementQuestionAccessibilityLabel ?? copy.decrementQuestionAccessibilityLabel;
  const resolvedDurationLabel = durationLabel ?? copy.durationLabel;
  const resolvedDurationValueLabelGetter = durationValueLabel ?? copy.durationValueLabel;
  const resolvedFeedbackLabel = feedbackLabel ?? copy.feedbackLabel;
  const resolvedIncrementDurationAccessibilityLabel =
    incrementDurationAccessibilityLabel ?? copy.incrementDurationAccessibilityLabel;
  const resolvedIncrementQuestionAccessibilityLabel =
    incrementQuestionAccessibilityLabel ?? copy.incrementQuestionAccessibilityLabel;
  const resolvedLocalSaveLabel = localSaveLabel ?? copy.localSaveLabel;
  const resolvedPracticeLabel = practiceLabel ?? copy.practiceLabel;
  const resolvedQuestionCountLabel = questionCountLabel ?? copy.questionCountLabel;
  const resolvedResetLabel = resetLabel ?? copy.resetLabel;
  const resolvedScoreModeLabel = scoreModeLabel ?? copy.scoreModeLabel;
  const resolvedSelectedChaptersValueLabelGetter =
    selectedChaptersValueLabel ?? copy.selectedChaptersValueLabel;
  const resolvedSourceScopeLabel = sourceScopeLabel ?? copy.sourceScopeLabel;
  const resolvedStartLabel = startLabel ?? copy.startLabel;
  const safeMinQuestionCount = Math.max(0, Math.round(minQuestionCount));
  const safeMaxQuestionCount = Math.max(safeMinQuestionCount, Math.round(maxQuestionCount));
  const safeQuestionCount = clamp(questionCount, safeMinQuestionCount, safeMaxQuestionCount);
  const safeMinDuration = Math.max(0, Math.round(minDurationMinutes));
  const safeMaxDuration = Math.max(safeMinDuration, Math.round(maxDurationMinutes));
  const safeDuration = clamp(durationMinutes, safeMinDuration, safeMaxDuration);
  const selectedChapterCount = getSelectedCount(chapters, selectedChapterIds);
  const hasSelectableChapters = chapters.some((chapter) => !chapter.disabled);
  const startIsDisabled = startDisabled || !onStart || selectedChapterCount === 0;
  const resolvedDurationValueLabel = resolvedDurationValueLabelGetter(safeDuration);
  const resolvedSelectedChaptersValueLabel =
    resolvedSelectedChaptersValueLabelGetter(selectedChapterCount);

  return (
    <Surface
      accessibilityLabel={
        accessibilityLabel ??
        getPanelAccessibilityLabel({
          chaptersLabel: resolvedChaptersLabel,
          durationLabel: resolvedDurationLabel,
          durationValueLabel: resolvedDurationValueLabel,
          questionCount: safeQuestionCount,
          questionCountLabel: resolvedQuestionCountLabel,
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
        <PillBadge variant="accent">{resolvedSourceScopeLabel}</PillBadge>
      </View>

      <View style={styles.controlsGrid}>
        <View style={styles.controlCard}>
          <Stepper
            decrementAccessibilityLabel={resolvedDecrementQuestionAccessibilityLabel}
            incrementAccessibilityLabel={resolvedIncrementQuestionAccessibilityLabel}
            label={resolvedQuestionCountLabel}
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
            decrementAccessibilityLabel={resolvedDecrementDurationAccessibilityLabel}
            incrementAccessibilityLabel={resolvedIncrementDurationAccessibilityLabel}
            label={resolvedDurationLabel}
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
            <Text variant="label">{resolvedChaptersLabel}</Text>
            {chaptersHint ? (
              <Text tone="secondary" variant="caption">
                {chaptersHint}
              </Text>
            ) : null}
          </View>
          <View style={styles.selectActions}>
            <Button
              accessibilityLabel={resolvedAllChaptersLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: !onSelectAllChapters || !hasSelectableChapters }}
              disabled={!onSelectAllChapters || !hasSelectableChapters}
              languageOverride={language}
              onPress={onSelectAllChapters}
              size="sm"
              variant="ghost"
            >
              {resolvedAllChaptersLabel}
            </Button>
            <Button
              accessibilityLabel={resolvedClearChaptersLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: !onClearChapters || !hasSelectableChapters }}
              disabled={!onClearChapters || !hasSelectableChapters}
              languageOverride={language}
              onPress={onClearChapters}
              size="sm"
              variant="ghost"
            >
              {resolvedClearChaptersLabel}
            </Button>
          </View>
        </View>

        <View
          accessibilityLabel={resolvedChaptersLabel}
          accessibilityRole="summary"
          style={styles.chips}
        >
          {chapters.map((chapter) => {
            const selected = selectedChapterIds.some((selectedId) =>
              idsMatch(selectedId, chapter.id),
            );
            const disabled = chapter.disabled || !onToggleChapter;

            return (
              <Pressable
                aria-checked={selected}
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
        <PillBadge>{resolvedScoreModeLabel}</PillBadge>
        <PillBadge>{resolvedFeedbackLabel}</PillBadge>
        <PillBadge>{resolvedLocalSaveLabel}</PillBadge>
      </View>

      <View style={styles.actions}>
        <Button
          accessibilityLabel={startAccessibilityLabel ?? resolvedStartLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: startIsDisabled }}
          disabled={startIsDisabled}
          languageOverride={language}
          onPress={onStart}
          style={styles.primaryAction}
          variant="primary"
        >
          {resolvedStartLabel}
        </Button>
        <Button
          accessibilityLabel={resolvedPracticeLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !onPractice }}
          disabled={!onPractice}
          languageOverride={language}
          onPress={onPractice}
          style={styles.secondaryAction}
          variant="secondary"
        >
          {resolvedPracticeLabel}
        </Button>
        {onReset ? (
          <Button
            accessibilityLabel={resolvedResetLabel}
            accessibilityRole="button"
            languageOverride={language}
            onPress={onReset}
            size="sm"
            variant="ghost"
          >
            {resolvedResetLabel}
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
