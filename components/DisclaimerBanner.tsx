import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

type DisclaimerBannerCopy = {
  message: string;
  title: string;
};

const disclaimerBannerCopy: Record<AppLanguage, DisclaimerBannerCopy> = {
  sv: {
    title: 'Fristående studiestöd',
    message:
      'Inte officiell eller kopplad till UHR, Skolverket, Migrationsverket eller svenska staten. Övningsinnehållet är skapat för lärande och är inte riktiga provfrågor.',
  },
  en: {
    title: 'Independent study tool',
    message:
      'Not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice content is created for learning and is not real exam content.',
  },
};

export const defaultDisclaimerTitle = disclaimerBannerCopy.en.title;
export const defaultDisclaimerMessage = disclaimerBannerCopy.en.message;

/**
 * Defaults: localized independent-app disclaimer copy from settings,
 * `accessible=true`, and `accessibilityRole="summary"`. Pass `title`,
 * `message`, or `accessibilityLabel` when a caller needs custom copy.
 */
export interface DisclaimerBannerProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  languageOverride?: AppLanguage;
  message?: string;
  messageStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  themeColors?: ThemeColors;
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
}

function getAccessibilityLabel(title: string | undefined, message: string) {
  return [title, message].filter(Boolean).join('. ');
}

export function DisclaimerBanner({
  accessibilityLabel,
  accessibilityRole = 'summary',
  accessible = true,
  languageOverride,
  message,
  messageStyle,
  style,
  themeColors,
  title,
  titleStyle,
  ...viewProps
}: DisclaimerBannerProps) {
  const styles = useMemo(() => createStyles(themeColors ?? colors), [themeColors]);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = disclaimerBannerCopy[language];
  const resolvedTitle = title ?? copy.title;
  const resolvedMessage = message ?? copy.message;

  return (
    <View
      accessibilityLabel={
        accessibilityLabel ?? getAccessibilityLabel(resolvedTitle, resolvedMessage)
      }
      accessibilityRole={accessibilityRole}
      accessible={accessible}
      style={[styles.base, style]}
      {...viewProps}
    >
      {resolvedTitle ? (
        <NativeText style={[styles.title, titleStyle]}>{resolvedTitle}</NativeText>
      ) : null}
      <NativeText style={[styles.message, messageStyle]}>{resolvedMessage}</NativeText>
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    base: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[0.5],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1.25],
    },
    title: {
      ...typography.badge,
      color: themeColors.textSecondary,
      textTransform: 'uppercase',
    },
    message: {
      ...typography.disclaimer,
      color: themeColors.textDisclaimer,
    },
  });
}
