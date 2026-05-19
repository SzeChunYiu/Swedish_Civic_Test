import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, motion, radius, space, typography } from '../../lib/theme';

export type RouteLinkVariant = 'primary' | 'secondary' | 'text' | 'card';

type ExpoLinkProps = ComponentProps<typeof Link>;
type RouteLinkWebEventHandler = (event: unknown) => void;

/**
 * Defaults: `variant="text"`, `accessibilityRole="link"`, no underline,
 * 48px token-sized target, and token hover/focus/pressed feedback on web.
 * Pass an explicit `accessibilityLabel` that describes the destination.
 */
export interface RouteLinkProps extends Omit<ExpoLinkProps, 'children' | 'href' | 'style'> {
  children: ReactNode;
  href: Href;
  onBlur?: RouteLinkWebEventHandler;
  onFocus?: RouteLinkWebEventHandler;
  onMouseEnter?: RouteLinkWebEventHandler;
  onMouseLeave?: RouteLinkWebEventHandler;
  style?: StyleProp<TextStyle | ViewStyle>;
  variant?: RouteLinkVariant;
}

export function RouteLink({
  accessibilityRole = 'link',
  children,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  onPressIn,
  onPressOut,
  style,
  variant = 'text',
  ...linkProps
}: RouteLinkProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: (event: Parameters<NonNullable<typeof onBlur>>[0]) => {
            setIsFocused(false);
            onBlur?.(event);
          },
          onFocus: (event: Parameters<NonNullable<typeof onFocus>>[0]) => {
            setIsFocused(true);
            onFocus?.(event);
          },
          onMouseEnter: (event: Parameters<NonNullable<typeof onMouseEnter>>[0]) => {
            setIsHovered(true);
            onMouseEnter?.(event);
          },
          onMouseLeave: (event: Parameters<NonNullable<typeof onMouseLeave>>[0]) => {
            setIsHovered(false);
            onMouseLeave?.(event);
          },
        }
      : {};

  return (
    <Link
      {...linkProps}
      {...webInteractionHandlers}
      accessibilityRole={accessibilityRole}
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
  },
});
