import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AUDIO_PLAYBACK_RATES,
  type AudioPlaybackRate,
  useAccessibilityStore,
} from '../../lib/storage/accessibilityStore';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { Button } from '../Button';

type AudioRateMenuCopy = {
  groupLabel: string;
  optionAccessibilityLabel: (rateLabel: string) => string;
  optionHint: string;
  selectedOptionHint: string;
  triggerAccessibilityLabel: (rateLabel: string) => string;
  triggerHintCollapsed: string;
  triggerHintExpanded: string;
  triggerLabel: (rateLabel: string) => string;
};

const audioRateMenuCopy: Record<AppLanguage, AudioRateMenuCopy> = {
  sv: {
    groupLabel: 'Välj ljudhastighet',
    optionAccessibilityLabel: (rateLabel) => `Välj ljudhastighet ${rateLabel}`,
    optionHint: 'Sparar hastigheten för nästa uppläsning.',
    selectedOptionHint: 'Nuvarande ljudhastighet.',
    triggerAccessibilityLabel: (rateLabel) => `Ljudhastighet ${rateLabel}`,
    triggerHintCollapsed: 'Öppnar val för ljudhastighet.',
    triggerHintExpanded: 'Döljer val för ljudhastighet.',
    triggerLabel: (rateLabel) => `Hastighet ${rateLabel}`,
  },
  en: {
    groupLabel: 'Choose audio speed',
    optionAccessibilityLabel: (rateLabel) => `Choose audio speed ${rateLabel}`,
    optionHint: 'Saves the speed for the next playback.',
    selectedOptionHint: 'Current audio speed.',
    triggerAccessibilityLabel: (rateLabel) => `Audio speed ${rateLabel}`,
    triggerHintCollapsed: 'Opens audio speed choices.',
    triggerHintExpanded: 'Hides audio speed choices.',
    triggerLabel: (rateLabel) => `Speed ${rateLabel}`,
  },
};

function getRateLabel(rate: AudioPlaybackRate, language: AppLanguage) {
  if (language === 'sv') {
    if (rate === 0.5) return '0,5x';
    if (rate === 0.75) return '0,75x';
    if (rate === 1.25) return '1,25x';
    return '1,0x';
  }

  if (rate === 0.5) return '0.5x';
  if (rate === 0.75) return '0.75x';
  if (rate === 1.25) return '1.25x';
  return '1.0x';
}

/**
 * Defaults: localized trigger and radio choices, persisted accessibility-store
 * speed, and token-only spacing/shape. The parent owns expanded state so the
 * same menu can sit beside question and feedback audio controls.
 */
export interface AudioRateMenuProps {
  expanded: boolean;
  language?: AppLanguage;
  onExpandedChange: (expanded: boolean) => void;
  selectedRate: AudioPlaybackRate;
}

export function AudioRateMenu({
  expanded,
  language = 'sv',
  onExpandedChange,
  selectedRate,
}: AudioRateMenuProps) {
  const setAudioPlaybackRate = useAccessibilityStore((state) => state.setAudioPlaybackRate);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = audioRateMenuCopy[language];
  const selectedRateLabel = getRateLabel(selectedRate, language);

  return (
    <View style={styles.container}>
      <Button
        accessibilityHint={expanded ? copy.triggerHintExpanded : copy.triggerHintCollapsed}
        accessibilityLabel={copy.triggerAccessibilityLabel(selectedRateLabel)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => onExpandedChange(!expanded)}
        size="sm"
        style={styles.trigger}
        variant="ghost"
      >
        {copy.triggerLabel(selectedRateLabel)}
      </Button>
      {expanded ? (
        <View
          aria-label={copy.groupLabel}
          accessibilityLabel={copy.groupLabel}
          accessibilityRole="radiogroup"
          style={styles.menu}
        >
          {AUDIO_PLAYBACK_RATES.map((rateOption) => {
            const selected = selectedRate === rateOption;
            const rateLabel = getRateLabel(rateOption, language);

            return (
              <Button
                key={rateOption}
                accessibilityHint={selected ? copy.selectedOptionHint : copy.optionHint}
                accessibilityLabel={copy.optionAccessibilityLabel(rateLabel)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setAudioPlaybackRate(rateOption);
                  onExpandedChange(false);
                }}
                size="sm"
                style={styles.option}
                textStyle={selected ? styles.selectedOptionText : styles.optionText}
                variant={selected ? 'primary' : 'secondary'}
              >
                {rateLabel}
              </Button>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'flex-start',
      gap: space[0.75],
    },
    menu: {
      alignItems: 'center',
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[0.75],
      padding: space[1],
    },
    option: {
      minWidth: space[7],
    },
    optionText: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    selectedOptionText: {
      color: themeColors.surface,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    trigger: {
      alignSelf: 'flex-start',
    },
  });
}
