import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, motion, radius, space, typography } from '../../lib/theme';

export type RouteLinkVariant = 'primary' | 'secondary' | 'text' | 'card';

type ExpoLinkProps = ComponentProps<typeof Link>;
type RouteLinkKeyboardEvent = {
  currentTarget?: { click?: () => void };
  defaultPrevented?: boolean;
  key?: string;
  preventDefault?: () => void;
  repeat?: boolean;
};
type RouteLinkWebEventHandler = (event: unknown) => void;
type RouteLinkKeyboardEventHandler = (event: RouteLinkKeyboardEvent) => void;

const keyboardActivationKeys = new Set(['Enter', ' ', 'Spacebar']);

function isKeyboardActivationKey(key: string | undefined) {
  return key ? keyboardActivationKeys.has(key) : false;
}

/**
 * Defaults: `variant="text"`, `accessibilityRole="link"`, no underline,
 * 48px token-sized target, and token hover/focus/pressed feedback on web.
 * Pass an explicit `accessibilityLabel` that describes the destination.
 */
export interface RouteLinkProps extends Omit<
  ExpoLinkProps,
  'accessibilityLabel' | 'children' | 'href' | 'style'
> {
  accessibilityLabel: string;
  children: ReactNode;
  href: Href;
  onBlur?: RouteLinkWebEventHandler;
  onFocus?: RouteLinkWebEventHandler;
  onKeyDown?: RouteLinkKeyboardEventHandler;
  onKeyUp?: RouteLinkKeyboardEventHandler;
  onMouseEnter?: RouteLinkWebEventHandler;
  onMouseLeave?: RouteLinkWebEventHandler;
  style?: StyleProp<TextStyle | ViewStyle>;
  variant?: RouteLinkVariant;
}

export function RouteLink({
  accessibilityLabel,
  children,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp,
  onMouseEnter,
  onMouseLeave,
  onPressIn,
  onPressOut,
  style,
  variant = 'text',
  ...linkProps
}: RouteLinkProps) {
  const keyboardPressStarted = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: (event: Parameters<NonNullable<typeof onBlur>>[0]) => {
            setIsFocused(false);
            setIsPressed(false);
            keyboardPressStarted.current = false;
            onBlur?.(event);
          },
          onFocus: (event: Parameters<NonNullable<typeof onFocus>>[0]) => {
            setIsFocused(true);
            onFocus?.(event);
          },
          onKeyDown: (event: RouteLinkKeyboardEvent) => {
            onKeyDown?.(event);
            if (isKeyboardActivationKey(event.key) && !event.repeat && !event.defaultPrevented) {
              keyboardPressStarted.current = true;
              setIsPressed(true);
              event.preventDefault?.();
            }
          },
          onKeyUp: (event: RouteLinkKeyboardEvent) => {
            const shouldActivate =
              keyboardPressStarted.current && isKeyboardActivationKey(event.key);
            if (isKeyboardActivationKey(event.key)) {
              keyboardPressStarted.current = false;
              setIsPressed(false);
            }
            onKeyUp?.(event);
            if (shouldActivate && !event.defaultPrevented) {
              event.preventDefault?.();
              event.currentTarget?.click?.();
            }
          },
          onMouseEnter: (event: Parameters<NonNullable<typeof onMouseEnter>>[0]) => {
            setIsHovered(true);
            onMouseEnter?.(event);
          },
          onMouseLeave: (event: Parameters<NonNullable<typeof onMouseLeave>>[0]) => {
            setIsHovered(false);
            setIsPressed(false);
            onMouseLeave?.(event);
          },
        }
      : {};

  return (
    <Link
      {...linkProps}
      {...webInteractionHandlers}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      onPressIn={(event) => {
        setIsPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setIsPressed(false);
        onPressOut?.(event);
      }}
      style={[
        styles.base,
        styles[variant],
        isFocused || isHovered
          ? variant === 'primary'
            ? styles.primaryInteractive
            : styles.interactive
          : null,
        isPressed ? (variant === 'primary' ? styles.primaryPressed : styles.pressed) : null,
        style,
      ]}
    >
      {children}
    </Link>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.card,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderWidth: space.hairline,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: space.hairline,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  text: {
    alignSelf: 'flex-start',
    borderRadius: radius.small,
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    paddingHorizontal: space[1],
  },
  card: {
    alignItems: 'stretch',
    borderRadius: radius.card,
    color: colors.text,
    paddingHorizontal: space[0],
    paddingVertical: space[0],
  },
  interactive: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.hoverScale }],
  },
  primaryInteractive: {
    backgroundColor: colors.accentActive,
    borderColor: colors.accentActive,
    transform: [{ scale: motion.hoverScale }],
  },
  pressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  primaryPressed: {
    backgroundColor: colors.accentActive,
    borderColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
});
