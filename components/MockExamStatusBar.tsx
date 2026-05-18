import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, space } from '../lib/theme';
import { Button } from './Button';
import { PillBadge } from './PillBadge';
import { Text } from './Text';

/**
 * Defaults: `eyebrowLabel="Mock exam"`, `timeLabel="Time left"`,
 * `timeLow=false`, `submitLabel="Submit"`, `submitDisabled=false`, and
 * `accessibilityRole="summary"`. Pass localized labels from the screen.
 */
export interface MockExamStatusBarProps extends Omit<ComponentProps<typeof View>, 'style'> {
  counterLabel: string;
  eyebrowLabel?: string;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
  submitAccessibilityLabel?: string;
  submitDisabled?: boolean;
  submitLabel?: string;
  timeLabel?: string;
  timeLow?: boolean;
  timeValue: string;
}

function getAccessibilityLabel({
  counterLabel,
  eyebrowLabel,
  timeLabel,
  timeValue,
}: {
  counterLabel: string;
  eyebrowLabel: string;
  timeLabel: string;
  timeValue: string;
}) {
  return `${eyebrowLabel}. ${counterLabel}. ${timeLabel}: ${timeValue}.`;
}

export function MockExamStatusBar({
  accessibilityLabel,
  accessibilityRole = 'summary',
  counterLabel,
  eyebrowLabel = 'Mock exam',
  onSubmit,
  style,
  submitAccessibilityLabel,
  submitDisabled = false,
  submitLabel = 'Submit',
  timeLabel = 'Time left',
  timeLow = false,
  timeValue,
  ...viewProps
}: MockExamStatusBarProps) {
  return (
    <View
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          counterLabel,
          eyebrowLabel,
          timeLabel,
          timeValue,
        })
      }
      accessibilityRole={accessibilityRole}
      style={[styles.bar, timeLow ? styles.lowTimeBar : null, style]}
      {...viewProps}
    >
      <View style={styles.titleGroup}>
        <Text tone="secondary" variant="caption">
          {eyebrowLabel}
        </Text>
        <Text style={styles.counter} variant="label">
          {counterLabel}
        </Text>
      </View>

      <View style={styles.timerGroup}>
        <Text align="right" tone="secondary" variant="caption">
          {timeLabel}
        </Text>
        <PillBadge
          accessibilityLabel={`${timeLabel}: ${timeValue}`}
          variant={timeLow ? 'warning' : 'neutral'}
        >
          {timeValue}
        </PillBadge>
      </View>

      <Button
        accessibilityLabel={submitAccessibilityLabel ?? submitLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: submitDisabled || !onSubmit }}
        disabled={submitDisabled || !onSubmit}
        onPress={onSubmit}
        size="sm"
        style={styles.submit}
        variant="secondary"
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    padding: space[1.5],
  },
  lowTimeBar: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  titleGroup: {
    flexGrow: 1,
    flexShrink: 1,
    gap: space[0.5],
    minWidth: space[12],
  },
  counter: {
    color: colors.text,
  },
  timerGroup: {
    alignItems: 'flex-end',
    gap: space[0.5],
  },
  submit: {
    flexGrow: 0,
  },
});
