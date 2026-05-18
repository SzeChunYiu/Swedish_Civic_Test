import type { ComponentProps } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';

export const defaultDisclaimerTitle = 'Independent study tool';
export const defaultDisclaimerMessage =
  'Not official or affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Practice content is created for learning and is not real exam content.';

/**
 * Defaults: `title="Independent study tool"`, a required independent-app
 * disclaimer message, `accessible=true`, and `accessibilityRole="summary"`.
 * Pass `accessibilityLabel` when localized visible copy needs a different
 * spoken label.
 */
export interface DisclaimerBannerProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  message?: string;
  messageStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
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
  message = defaultDisclaimerMessage,
  messageStyle,
  style,
  title = defaultDisclaimerTitle,
  titleStyle,
  ...viewProps
}: DisclaimerBannerProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? getAccessibilityLabel(title, message)}
      accessibilityRole={accessibilityRole}
      accessible={accessible}
      style={[styles.base, style]}
      {...viewProps}
    >
      {title ? <NativeText style={[styles.title, titleStyle]}>{title}</NativeText> : null}
      <NativeText style={[styles.message, messageStyle]}>{message}</NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[0.5],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
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
