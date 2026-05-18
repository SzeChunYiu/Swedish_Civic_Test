import { Pressable, StyleSheet, View } from 'react-native';
import type { AccessibilityRole, PressableProps, StyleProp, ViewStyle } from 'react-native';

import { colors, motion, radius, shadows, space } from '../lib/theme';
import { PillBadge } from './PillBadge';
import type { PillBadgeVariant } from './PillBadge';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

/**
 * Defaults: `answeredCount=0`, `correctCount=0`, `targetPercent=75`,
 * `accessibilityRole="button"` when `onPress` exists and `"summary"`
 * otherwise, and a token-sized `hitSlop`. Pass localized label props for
 * screen-specific copy.
 */
export interface ChapterProgressCardProps extends Omit<PressableProps, 'children' | 'style'> {
  accuracyLabel?: string;
  answeredCount?: number;
  answeredLabel?: string;
  chapterLabel: string;
  correctCount?: number;
  correctLabel?: string;
  emoji?: string;
  progressAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  targetPercent?: number;
  title: string;
  totalCount: number;
}

function clampCount(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), max));
}

function getPercent(value: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getAccessibilityLabel({
  accuracyText,
  answeredText,
  chapterLabel,
  correctText,
  progressText,
  subtitle,
  title,
}: {
  accuracyText?: string;
  answeredText: string;
  chapterLabel: string;
  correctText: string;
  progressText: string;
  subtitle?: string;
  title: string;
}) {
  return [chapterLabel, title, subtitle, answeredText, correctText, progressText, accuracyText]
    .filter(Boolean)
    .join('. ');
}

function getAccuracyVariant(accuracyPercent: number, targetPercent: number): PillBadgeVariant {
  return accuracyPercent >= targetPercent ? 'success' : 'warning';
}

export function ChapterProgressCard({
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  accuracyLabel = 'accuracy',
  answeredCount = 0,
  answeredLabel = 'answered',
  chapterLabel,
  correctCount = 0,
  correctLabel = 'correct',
  disabled = false,
  emoji,
  hitSlop,
  onPress,
  progressAccessibilityLabel,
  style,
  subtitle,
  targetPercent = 75,
  title,
  totalCount,
  ...pressableProps
}: ChapterProgressCardProps) {
  const safeTotal = Number.isFinite(totalCount) && totalCount > 0 ? Math.round(totalCount) : 0;
  const safeAnswered = clampCount(answeredCount, safeTotal);
  const safeCorrect = clampCount(correctCount, safeAnswered);
  const progress = safeTotal > 0 ? safeAnswered / safeTotal : 0;
  const progressPercent = getPercent(safeAnswered, safeTotal);
  const accuracyPercent = safeAnswered > 0 ? getPercent(safeCorrect, safeAnswered) : null;
  const answeredText = `${safeAnswered}/${safeTotal} ${answeredLabel}`;
  const correctText = `${safeCorrect} ${correctLabel}`;
  const accuracyText =
    accuracyPercent === null ? undefined : `${accuracyPercent}% ${accuracyLabel}`;
  const progressText = progressAccessibilityLabel ?? `${progressPercent} percent complete`;
  const resolvedRole: AccessibilityRole = accessibilityRole ?? (onPress ? 'button' : 'summary');
  const isDisabled = disabled === true;
  const resolvedAccessibilityState = {
    ...accessibilityState,
    disabled: onPress ? isDisabled || accessibilityState?.disabled : accessibilityState?.disabled,
  };

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          accuracyText,
          answeredText,
          chapterLabel,
          correctText,
          progressText,
          subtitle,
          title,
        })
      }
      accessibilityRole={resolvedRole}
      accessibilityState={resolvedAccessibilityState}
      disabled={isDisabled || !onPress}
      hitSlop={hitSlop ?? space[1]}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      {...pressableProps}
    >
      <View pointerEvents="none" style={styles.topRow}>
        <View style={styles.identity}>
          {emoji ? (
            <Text accessibilityRole="text" style={styles.emoji} variant="label">
              {emoji}
            </Text>
          ) : null}
          <PillBadge>{chapterLabel}</PillBadge>
        </View>
        {accuracyPercent !== null ? (
          <PillBadge
            accessibilityLabel={accuracyText}
            variant={getAccuracyVariant(accuracyPercent, targetPercent)}
          >
            {accuracyPercent}%
          </PillBadge>
        ) : null}
      </View>

      <View pointerEvents="none" style={styles.copy}>
        <Text style={styles.title} variant="label">
          {title}
        </Text>
        {subtitle ? (
          <Text tone="secondary" variant="caption">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <ProgressBar
        accessibilityLabel={progressText}
        animated={false}
        progress={progress}
        style={styles.progress}
      />

      <View pointerEvents="none" style={styles.metaRow}>
        <Text tone="secondary" variant="caption">
          {answeredText}
        </Text>
        <Text tone="secondary" variant="caption">
          {correctText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1.5],
    padding: space[2],
    ...shadows.card,
  },
  pressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  disabled: {
    opacity: motion.pressedScale,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[1],
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: space[1],
  },
  emoji: {
    minWidth: space[4],
    textAlign: 'center',
  },
  copy: {
    gap: space[0.5],
  },
  title: {
    color: colors.text,
  },
  progress: {
    height: space[1],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
});
