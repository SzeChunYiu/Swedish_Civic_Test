import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space } from '../lib/theme';
import { Button } from './Button';
import { PillBadge } from './PillBadge';
import { Text } from './Text';

type MockExamStatusBarCopy = {
  eyebrowLabel: string;
  submitLabel: string;
  timeLabel: string;
};

const mockExamStatusBarCopy: Record<AppLanguage, MockExamStatusBarCopy> = {
  sv: {
    eyebrowLabel: 'Skarp tentamen',
    submitLabel: 'Lämna in',
    timeLabel: 'Tid kvar',
  },
  en: {
    eyebrowLabel: 'Mock exam',
    submitLabel: 'Submit',
    timeLabel: 'Time left',
  },
};

/**
 * Defaults: localized `eyebrowLabel`, `timeLabel`, and `submitLabel` from
 * settings, `timeLow=false`, `submitDisabled=false`, and
 * `accessibilityRole="summary"`. Pass localized labels from the screen for
 * screen-specific copy.
 */
export interface MockExamStatusBarProps extends Omit<ComponentProps<typeof View>, 'style'> {
  counterLabel: string;
  eyebrowLabel?: string;
  languageOverride?: AppLanguage;
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
  eyebrowLabel,
  languageOverride,
  onSubmit,
  style,
  submitAccessibilityLabel,
  submitDisabled = false,
  submitLabel,
  timeLabel,
  timeLow = false,
  timeValue,
  ...viewProps
}: MockExamStatusBarProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = mockExamStatusBarCopy[language];
  const resolvedEyebrowLabel = eyebrowLabel ?? copy.eyebrowLabel;
  const resolvedSubmitLabel = submitLabel ?? copy.submitLabel;
  const resolvedTimeLabel = timeLabel ?? copy.timeLabel;

  return (
    <View
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          counterLabel,
          eyebrowLabel: resolvedEyebrowLabel,
          timeLabel: resolvedTimeLabel,
          timeValue,
        })
      }
      accessibilityRole={accessibilityRole}
      style={[styles.bar, timeLow ? styles.lowTimeBar : null, style]}
      {...viewProps}
    >
      <View style={styles.titleGroup}>
        <Text tone="secondary" variant="caption">
          {resolvedEyebrowLabel}
        </Text>
        <Text style={styles.counter} variant="label">
          {counterLabel}
        </Text>
      </View>

      <View style={styles.timerGroup}>
        <Text align="right" tone="secondary" variant="caption">
          {resolvedTimeLabel}
        </Text>
        <PillBadge
          accessibilityLabel={`${resolvedTimeLabel}: ${timeValue}`}
          variant={timeLow ? 'warning' : 'neutral'}
        >
          {timeValue}
        </PillBadge>
      </View>

      <Button
        accessibilityLabel={submitAccessibilityLabel ?? resolvedSubmitLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: submitDisabled || !onSubmit }}
        disabled={submitDisabled || !onSubmit}
        languageOverride={language}
        onPress={onSubmit}
        size="sm"
        style={styles.submit}
        variant="secondary"
      >
        {resolvedSubmitLabel}
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
