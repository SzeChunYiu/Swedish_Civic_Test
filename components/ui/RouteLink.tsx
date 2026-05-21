import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

export type RouteLinkVariant = 'primary' | 'secondary' | 'text' | 'card';

type ExpoLinkProps = ComponentProps<typeof Link>;
type RouteLinkHandledProps =
  | 'accessibilityLabel'
  | 'children'
  | 'href'
  | 'onBlur'
  | 'onFocus'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onMouseDown'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseUp'
  | 'onTouchCancel'
  | 'onTouchEnd'
  | 'onTouchStart'
  | 'style';
type RouteLinkKeyboardEvent = {
  currentTarget?: { click?: () => void };
  key?: string;
  preventDefault?: () => void;
};
type RouteLinkKeyboardEventHandler = (event: RouteLinkKeyboardEvent) => void;
type RouteLinkWebEventHandler = (event: unknown) => void;

const keyboardActivationKeys = new Set(['Enter', ' ', 'Space', 'Spacebar']);

function isKeyboardActivationKey(key: string | undefined) {
  return key ? keyboardActivationKeys.has(key) : false;
}

/**
 * Defaults: `variant="text"`, `accessibilityRole="link"`, no underline,
 * 48px token-sized target, and token hover/focus/pressed feedback on web.
 * Pass an explicit `accessibilityLabel` that describes the destination.
 */
export interface RouteLinkProps extends Omit<ExpoLinkProps, RouteLinkHandledProps> {
  accessibilityLabel: string;
  children: ReactNode;
  href: Href;
  onBlur?: RouteLinkWebEventHandler;
  onFocus?: RouteLinkWebEventHandler;
  onKeyDown?: RouteLinkKeyboardEventHandler;
  onKeyUp?: RouteLinkKeyboardEventHandler;
  onMouseDown?: RouteLinkWebEventHandler;
  onMouseEnter?: RouteLinkWebEventHandler;
  onMouseLeave?: RouteLinkWebEventHandler;
  onMouseUp?: RouteLinkWebEventHandler;
  onTouchCancel?: RouteLinkWebEventHandler;
  onTouchEnd?: RouteLinkWebEventHandler;
  onTouchStart?: RouteLinkWebEventHandler;
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
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  onPressIn,
  onPressOut,
  onTouchCancel,
  onTouchEnd,
  onTouchStart,
  style,
  variant = 'text',
  ...linkProps
}: RouteLinkProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: (event: Parameters<NonNullable<typeof onBlur>>[0]) => {
            setIsFocused(false);
            setIsPressed(false);
            onBlur?.(event);
          },
          onFocus: (event: Parameters<NonNullable<typeof onFocus>>[0]) => {
            setIsFocused(true);
            onFocus?.(event);
          },
          onKeyDown: (event: Parameters<NonNullable<typeof onKeyDown>>[0]) => {
            if (isKeyboardActivationKey(event.key)) {
              setIsPressed(true);
              event.preventDefault?.();
            }
            onKeyDown?.(event);
          },
          onKeyUp: (event: Parameters<NonNullable<typeof onKeyUp>>[0]) => {
            if (isKeyboardActivationKey(event.key)) {
              setIsPressed(false);
              event.preventDefault?.();
              event.currentTarget?.click?.();
            }
            onKeyUp?.(event);
          },
          onMouseDown: (event: Parameters<NonNullable<typeof onMouseDown>>[0]) => {
            setIsPressed(true);
            onMouseDown?.(event);
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
          onMouseUp: (event: Parameters<NonNullable<typeof onMouseUp>>[0]) => {
            setIsPressed(false);
            onMouseUp?.(event);
          },
          onTouchCancel: (event: Parameters<NonNullable<typeof onTouchCancel>>[0]) => {
            setIsPressed(false);
            onTouchCancel?.(event);
          },
          onTouchEnd: (event: Parameters<NonNullable<typeof onTouchEnd>>[0]) => {
            setIsPressed(false);
            onTouchEnd?.(event);
          },
          onTouchStart: (event: Parameters<NonNullable<typeof onTouchStart>>[0]) => {
            setIsPressed(true);
            onTouchStart?.(event);
          },
        }
      : {};

  return (
    <Link
      {...linkProps}
      {...webInteractionHandlers}
      aria-label={accessibilityLabel}
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
            ? reduceMotion
              ? styles.primaryInteractiveReducedMotion
              : styles.primaryInteractive
            : reduceMotion
              ? styles.interactiveReducedMotion
              : styles.interactive
          : null,
        isPressed
          ? variant === 'primary'
            ? reduceMotion
              ? styles.primaryPressedReducedMotion
              : styles.primaryPressed
            : reduceMotion
              ? styles.pressedReducedMotion
              : styles.pressed
          : null,
        style,
      ]}
    >
      {children}
    </Link>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: themeColors.accent,
      borderColor: themeColors.accent,
      borderWidth: space.hairline,
      color: themeColors.surface,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
    },
    secondary: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderWidth: space.hairline,
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
    },
    text: {
      alignSelf: 'flex-start',
      borderRadius: radius.small,
      color: themeColors.accent,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
      paddingHorizontal: space[1],
    },
    card: {
      alignItems: 'stretch',
      borderRadius: radius.card,
      color: themeColors.text,
      paddingHorizontal: space[0],
      paddingVertical: space[0],
    },
    interactive: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.hoverScale }],
    },
    interactiveReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    primaryInteractive: {
      backgroundColor: themeColors.accentActive,
      borderColor: themeColors.accentActive,
      transform: [{ scale: motion.hoverScale }],
    },
    primaryInteractiveReducedMotion: {
      backgroundColor: themeColors.accentActive,
      borderColor: themeColors.accentActive,
    },
    pressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    pressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    primaryPressed: {
      backgroundColor: themeColors.accentActive,
      borderColor: themeColors.accentActive,
      transform: [{ scale: motion.pressedScale }],
    },
    primaryPressedReducedMotion: {
      backgroundColor: themeColors.accentActive,
      borderColor: themeColors.accentActive,
    },
  });
}
