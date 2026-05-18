import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useId, type PropsWithChildren } from 'react';
import { colors, radius, space, typography } from '../../lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'option' | 'success' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Defaults: `variant="primary"`, `size="md"`, and `loading=false`.
 * Plain text children are used as the accessibility label when none is supplied.
 */
export interface ButtonProps extends PropsWithChildren<Omit<PressableProps, 'style' | 'children'>> {
  loading?: boolean;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
}

export function Button({
  accessibilityHint,
  accessibilityLabel,
  children,
  hitSlop,
  loading = false,
  size = 'md',
  style,
  accessibilityRole = 'button',
  accessibilityState,
  disabled,
  variant = 'primary',
  ...pressableProps
}: ButtonProps) {
  const isInteractionDisabled = disabled || loading;
  const mergedAccessibilityState = {
    ...accessibilityState,
    ...(disabled == null ? {} : { disabled }),
    ...(loading ? { busy: true, disabled: true } : {}),
  };
  const buttonAccessibilityLabel =
    accessibilityLabel ??
    (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);
  const hintId = useId();
  const buttonAccessibilityHintId =
    accessibilityHint && Platform.OS === 'web'
      ? `button-hint-${hintId.replace(/:/g, '')}`
      : undefined;

  return (
    <Pressable
      aria-busy={mergedAccessibilityState.busy === true}
      aria-checked={mergedAccessibilityState.checked}
      aria-describedby={buttonAccessibilityHintId}
      aria-disabled={mergedAccessibilityState.disabled === true}
      aria-expanded={mergedAccessibilityState.expanded}
      aria-label={buttonAccessibilityLabel}
      aria-selected={mergedAccessibilityState.selected}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={buttonAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={mergedAccessibilityState}
      disabled={isInteractionDisabled}
      hitSlop={hitSlop ?? space[0.75]}
      style={({ pressed }) => [
        styles.button,
        styles[size],
        styles[variant],
        pressed && !isInteractionDisabled
          ? variant === 'primary'
            ? styles.primaryPressed
            : styles.neutralPressed
          : null,
        isInteractionDisabled ? styles.disabled : null,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.accent}
          size="small"
        />
      ) : null}
      <Text
        style={[
          styles.label,
          size === 'sm' ? styles.smLabel : size === 'lg' ? styles.lgLabel : styles.mdLabel,
          variant === 'primary'
            ? styles.primaryLabel
            : variant === 'ghost'
              ? styles.ghostLabel
              : styles.darkLabel,
        ]}
      >
        {children}
      </Text>
      {buttonAccessibilityHintId ? (
        <Text nativeID={buttonAccessibilityHintId} style={styles.accessibilityHintText}>
          {accessibilityHint}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space[0.75],
    justifyContent: 'center',
    minHeight: space[6],
  },
  sm: {
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  md: {
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
  },
  lg: {
    minHeight: space[7],
    paddingHorizontal: space[3],
    paddingVertical: space[1.5],
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  primaryPressed: {
    backgroundColor: colors.accentActive,
    borderColor: colors.accentActive,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  neutralPressed: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  option: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.small,
    paddingVertical: space[1.5],
  },
  success: {
    alignItems: 'flex-start',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.small,
    paddingVertical: space[1.5],
  },
  danger: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.small,
    paddingVertical: space[1.5],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
  smLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  mdLabel: {
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  lgLabel: {
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
    lineHeight: typography.bodySemibold.lineHeight,
  },
  accessibilityHintText: {
    height: 1,
    left: -10000,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
  primaryLabel: {
    color: colors.surface,
  },
  darkLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.accent,
  },
});
