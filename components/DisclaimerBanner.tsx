import type { ComponentProps } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';

export type DisclaimerBannerLanguage = 'en' | 'sv';

const defaultCopy = {
  en: {
    title: 'Independent app',
    message:
      'This study tool is not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government.',
  },
  sv: {
    title: 'Oberoende app',
    message:
      'Det här studieverktyget är inte officiellt eller kopplat till UHR, Skolverket, Migrationsverket eller svenska staten.',
  },
} as const satisfies Record<DisclaimerBannerLanguage, { message: string; title: string }>;

/**
 * Defaults: `language="en"`, `accessibilityRole="summary"`, and the
 * independent-app disclaimer copy. Pass `title` and `message` to localize or
 * scope the banner while keeping the token-driven visual treatment.
 */
export interface DisclaimerBannerProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  language?: DisclaimerBannerLanguage;
  message?: string;
  messageStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
}

export function DisclaimerBanner({
  accessibilityLabel,
  accessibilityRole = 'summary',
  language = 'en',
  message,
  messageStyle,
  style,
  title,
  titleStyle,
  ...viewProps
}: DisclaimerBannerProps) {
  const copy = defaultCopy[language];
  const resolvedTitle = title ?? copy.title;
  const resolvedMessage = message ?? copy.message;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${resolvedTitle}. ${resolvedMessage}`}
      accessibilityRole={accessibilityRole}
      accessible
      style={[styles.base, style]}
      {...viewProps}
    >
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.accentRail} />
      <View style={styles.copy}>
        <NativeText style={[styles.title, titleStyle]}>{resolvedTitle}</NativeText>
        <NativeText style={[styles.message, messageStyle]}>{resolvedMessage}</NativeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[1.25],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  accentRail: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    width: space[0.5],
  },
  copy: {
    flex: 1,
    gap: space[0.5],
  },
  title: {
    ...typography.badge,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  message: {
    ...typography.disclaimer,
    color: colors.textDisclaimer,
  },
});
