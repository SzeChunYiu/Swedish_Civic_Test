import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ComplianceActionLinkHref = ComponentProps<typeof Link>['href'];
type ComplianceActionLinkVariant = 'primary' | 'secondary';

const complianceActionLinkClassName = 'compliance-action-link';
const complianceActionLinkStyleElementId = 'compliance-action-link-style';

/**
 * Defaults: `variant="secondary"`, no detail line, localized visible `label`
 * as link text, and a token-sized 48px link target with pressed feedback.
 */
export interface ComplianceActionLinkProps {
  accessibilityLabel: string;
  detail?: string;
  href: ComplianceActionLinkHref;
  label: string;
  variant?: ComplianceActionLinkVariant;
}

export function getVisibleLinkDestination(url: string) {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname.replace(/\/$/, '');

    return `${parsedUrl.hostname}${pathname}`;
  } catch {
    return url;
  }
}

function useComplianceActionLinkWebStyles(themeColors: ThemeColors) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const existingStyleElement = document.getElementById(complianceActionLinkStyleElementId);
    const styleElement = existingStyleElement ?? document.createElement('style');
    styleElement.id = complianceActionLinkStyleElementId;
    styleElement.textContent = `
.${complianceActionLinkClassName} {
  transition: background-color ${motion.duration.fast}ms ${motion.easing.press}, border-color ${motion.duration.fast}ms ${motion.easing.press}, transform ${motion.duration.fast}ms ${motion.easing.press};
}

.${complianceActionLinkClassName}:hover,
.${complianceActionLinkClassName}:focus-visible {
  transform: scale(${motion.hoverScale});
}

.${complianceActionLinkClassName}--primary:hover,
.${complianceActionLinkClassName}--primary:focus-visible,
.${complianceActionLinkClassName}--primary:active {
  background-color: ${themeColors.accentActive};
  border-color: ${themeColors.accentActive};
}

.${complianceActionLinkClassName}--secondary:hover,
.${complianceActionLinkClassName}--secondary:focus-visible,
.${complianceActionLinkClassName}--secondary:active {
  background-color: ${themeColors.focusSoft};
  border-color: ${themeColors.focus};
}

.${complianceActionLinkClassName}:active {
  transform: scale(${motion.pressedScale});
}

@media (prefers-reduced-motion: reduce) {
  .${complianceActionLinkClassName} {
    transition: background-color ${motion.duration.fast}ms ${motion.easing.press}, border-color ${motion.duration.fast}ms ${motion.easing.press};
  }

  .${complianceActionLinkClassName}:hover,
  .${complianceActionLinkClassName}:focus-visible,
  .${complianceActionLinkClassName}:active {
    transform: none;
  }
}
`;
    if (!existingStyleElement) {
      document.head.appendChild(styleElement);
    }
  }, [themeColors]);
}

export function ComplianceActionLink({
  accessibilityLabel,
  detail,
  href,
  label,
  variant = 'secondary',
}: ComplianceActionLinkProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useComplianceActionLinkWebStyles(themeColors);

  const [isPressed, setIsPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const clearPressedState = () => setIsPressed(false);
  const linkInteractionHandlers = {
    onPressIn: () => setIsPressed(true),
    onPressOut: clearPressedState,
  };
  const webClassName =
    Platform.OS === 'web'
      ? {
          className: `${complianceActionLinkClassName} ${complianceActionLinkClassName}--${variant}`,
        }
      : {};

  return (
    <Link
      {...linkInteractionHandlers}
      {...webClassName}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      href={href}
      style={[
        styles.link,
        styles[variant],
        detail ? styles.linkWithDetail : null,
        isPressed
          ? reduceMotion
            ? styles[`${variant}PressedReducedMotion`]
            : styles[`${variant}Pressed`]
          : null,
      ]}
    >
      <Text
        style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}
      >
        {label}
      </Text>
      {detail ? (
        <Text
          style={[
            styles.detail,
            variant === 'primary' ? styles.primaryDetail : styles.secondaryDetail,
          ]}
        >
          {detail}
        </Text>
      ) : null}
    </Link>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    link: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
    linkWithDetail: {
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      gap: space[0.5],
    },
    primary: {
      backgroundColor: themeColors.accent,
      borderColor: themeColors.accent,
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
    secondary: {
      backgroundColor: themeColors.surfaceMuted,
    },
    secondaryPressed: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
      transform: [{ scale: motion.pressedScale }],
    },
    secondaryPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
    },
    label: {
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
    },
    primaryLabel: {
      color: themeColors.surface,
    },
    secondaryLabel: {
      color: themeColors.text,
    },
    detail: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    primaryDetail: {
      color: themeColors.surface,
    },
    secondaryDetail: {
      color: themeColors.textMuted,
    },
  });
}
