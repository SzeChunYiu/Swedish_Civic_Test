import type { ComponentProps } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';

export type DisclaimerBannerLanguage = 'sv' | 'en';

const disclaimerCopy = {
  sv: 'Oberoende studieverktyg. Inte officiellt eller kopplat till UHR, Skolverket, Migrationsverket eller svenska staten.',
  en: 'Independent study tool. Not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government.',
} as const satisfies Record<DisclaimerBannerLanguage, string>;

/**
 * Defaults: `language="sv"`, `accessible=true`,
 * `accessibilityRole="summary"`, a warm subtle surface, and compact
 * disclaimer typography. Pass `text` and
 * `accessibilityLabel` when a screen needs more specific authority wording.
 */
export interface DisclaimerBannerProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  language?: DisclaimerBannerLanguage;
  style?: StyleProp<ViewStyle>;
  text?: string;
  textStyle?: StyleProp<TextStyle>;
}

export function DisclaimerBanner({
  accessible = true,
  accessibilityLabel,
  accessibilityRole = 'summary',
  language = 'sv',
  style,
  text,
  textStyle,
  ...viewProps
}: DisclaimerBannerProps) {
  const copy = text ?? disclaimerCopy[language];

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel ?? copy}
      accessibilityRole={accessibilityRole}
      style={[styles.base, style]}
      {...viewProps}
    >
      <NativeText style={[styles.text, textStyle]}>{copy}</NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
  },
  text: {
    ...typography.disclaimer,
    color: colors.textDisclaimer,
  },
});
