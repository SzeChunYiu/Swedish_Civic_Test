import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, motion, radius, space, typography } from '../lib/theme';

/**
 * Defaults: `accessibilityRole="button"`, `disabled=false`,
 * `showChevron=true`, one-line title, two-line secondary text, and a
 * token-sized `hitSlop`. Pass `accessibilityLabel` when the visible chapter
 * copy should be announced differently.
 */
export interface ChapterRowProps extends Omit<PressableProps, 'children' | 'style'> {
  chevronStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  secondaryStyle?: StyleProp<TextStyle>;
  secondaryText: string;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
}

function getAccessibilityLabel(title: string, secondaryText: string) {
  return [title, secondaryText].filter(Boolean).join('. ');
}

export function ChapterRow({
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  chevronStyle,
  disabled = false,
  hitSlop,
  labelStyle,
  secondaryStyle,
  secondaryText,
  showChevron = true,
  style,
  title,
  ...pressableProps
}: ChapterRowProps) {
  const isDisabled = disabled === true;
  const resolvedAccessibilityState = {
    ...accessibilityState,
    disabled: isDisabled || accessibilityState?.disabled,
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? getAccessibilityLabel(title, secondaryText)}
      accessibilityRole={accessibilityRole}
      accessibilityState={resolvedAccessibilityState}
      disabled={isDisabled}
      hitSlop={hitSlop ?? space[1]}
      style={({ pressed }) => [
        styles.base,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      {...pressableProps}
    >
      <View style={styles.copy}>
        <NativeText numberOfLines={1} style={[styles.title, labelStyle]}>
          {title}
        </NativeText>
        <NativeText numberOfLines={2} style={[styles.secondary, secondaryStyle]}>
          {secondaryText}
        </NativeText>
      </View>
      {showChevron ? (
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.chevron, chevronStyle]}
        >
          {'>'}
        </NativeText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[2],
    minHeight: space[8],
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
  },
  pressed: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  disabled: {
    backgroundColor: colors.surfaceWarm,
    opacity: motion.pressedScale,
  },
  copy: {
    flex: 1,
    gap: space[0.5],
  },
  title: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  secondary: {
    ...typography.captionLight,
    color: colors.textSecondary,
  },
  chevron: {
    ...typography.sectionTitle,
    color: colors.textPlaceholder,
  },
});
