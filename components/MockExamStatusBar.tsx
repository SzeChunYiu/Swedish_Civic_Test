import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import type { MockExamTimerUrgency } from '../lib/quiz/examGenerator';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';
import { Button } from './Button';
import type { PillBadgeVariant } from './PillBadge';
import { PillBadge } from './PillBadge';
import { Text } from './Text';

type MockExamStatusBarCopy = {
  eyebrowLabel: string;
  submitLabel: string;
  timeLabel: string;
  timerUrgency: Record<MockExamTimerUrgency, string>;
};

const mockExamStatusBarCopy: Record<AppLanguage, MockExamStatusBarCopy> = {
  sv: {
    eyebrowLabel: 'Övningsprov',
    submitLabel: 'Lämna in',
    timeLabel: 'Tid kvar',
    timerUrgency: {
      danger: 'Kritiskt lite tid kvar',
      steady: 'Gott om tid',
      warning: 'Tiden börjar ta slut',
    },
  },
  en: {
    eyebrowLabel: 'Mock exam',
    submitLabel: 'Submit',
    timeLabel: 'Time left',
    timerUrgency: {
      danger: 'Critical time remaining',
      steady: 'Time steady',
      warning: 'Time running low',
    },
  },
};

const timerBadgeVariant: Record<MockExamTimerUrgency, PillBadgeVariant> = {
  danger: 'danger',
  steady: 'success',
  warning: 'accent',
};

/**
 * Defaults: localized `eyebrowLabel`, `timeLabel`, `submitLabel`, and timer
 * urgency labels from settings, `timerUrgency="steady"`,
 * `submitDisabled=false`, and `accessibilityRole="summary"`. Pass localized
 * labels from the screen for screen-specific copy.
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
  timerUrgency?: MockExamTimerUrgency;
  timerUrgencyLabel?: string;
  timeValue: string;
}

function getAccessibilityLabel({
  counterLabel,
  eyebrowLabel,
  timeLabel,
  timerUrgencyLabel,
  timeValue,
}: {
  counterLabel: string;
  eyebrowLabel: string;
  timeLabel: string;
  timerUrgencyLabel: string;
  timeValue: string;
}) {
  return `${eyebrowLabel}. ${counterLabel}. ${timeLabel}: ${timeValue}. ${timerUrgencyLabel}.`;
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
  timerUrgency,
  timerUrgencyLabel,
  timeValue,
  ...viewProps
}: MockExamStatusBarProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = mockExamStatusBarCopy[language];
  const resolvedEyebrowLabel = eyebrowLabel ?? copy.eyebrowLabel;
  const resolvedSubmitLabel = submitLabel ?? copy.submitLabel;
  const resolvedTimeLabel = timeLabel ?? copy.timeLabel;
  const resolvedTimerUrgency = timerUrgency ?? (timeLow ? 'warning' : 'steady');
  const resolvedTimerUrgencyLabel = timerUrgencyLabel ?? copy.timerUrgency[resolvedTimerUrgency];

  return (
    <View
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          counterLabel,
          eyebrowLabel: resolvedEyebrowLabel,
          timeLabel: resolvedTimeLabel,
          timerUrgencyLabel: resolvedTimerUrgencyLabel,
          timeValue,
        })
      }
      accessibilityRole={accessibilityRole}
      style={[styles.bar, styles[`${resolvedTimerUrgency}TimeBar`], style]}
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
          accessibilityLabel={`${resolvedTimeLabel}: ${timeValue}. ${resolvedTimerUrgencyLabel}`}
          variant={timerBadgeVariant[resolvedTimerUrgency]}
        >
          {timeValue}
        </PillBadge>
        <Text align="right" style={styles.timerUrgencyLabel} variant="caption">
          {resolvedTimerUrgencyLabel}
        </Text>
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      padding: space[1.5],
    },
    steadyTimeBar: {
      borderColor: themeColors.success,
    },
    warningTimeBar: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    dangerTimeBar: {
      backgroundColor: themeColors.dangerSoft,
      borderColor: themeColors.danger,
    },
    titleGroup: {
      flexGrow: 1,
      flexShrink: 1,
      gap: space[0.5],
      minWidth: space[12],
    },
    counter: {
      color: themeColors.text,
    },
    timerGroup: {
      alignItems: 'flex-end',
      gap: space[0.5],
    },
    timerUrgencyLabel: {
      color: themeColors.textSecondary,
    },
    submit: {
      flexGrow: 0,
    },
  });
}
