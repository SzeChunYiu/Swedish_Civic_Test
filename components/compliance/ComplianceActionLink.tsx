import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { colors, motion, radius, space, typography } from '../../lib/theme';

type ComplianceActionLinkHref = ComponentProps<typeof Link>['href'];
type ComplianceActionLinkRel = ComponentProps<typeof Link>['rel'];
type ComplianceActionLinkTarget = ComponentProps<typeof Link>['target'];
type ComplianceActionLinkVariant = 'primary' | 'secondary';

const complianceActionLinkClassName = 'compliance-action-link';
const complianceActionLinkStyleElementId = 'compliance-action-link-style';

/**
 * Defaults: `variant="secondary"`, no detail line, localized visible `label`
 * as link text, and a token-sized 48px link target with pressed feedback.
 */
export interface ComplianceActionLinkProps {
  accessibilityHint?: string;
  accessibilityLabel: string;
  detail?: string;
  href: ComplianceActionLinkHref;
  label: string;
  rel?: ComplianceActionLinkRel;
  target?: ComplianceActionLinkTarget;
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

function useComplianceActionLinkWebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById(complianceActionLinkStyleElementId)) return;

    const styleElement = document.createElement('style');
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
  background-color: ${colors.accentActive};
  border-color: ${colors.accentActive};
}

.${complianceActionLinkClassName}--secondary:hover,
.${complianceActionLinkClassName}--secondary:focus-visible,
.${complianceActionLinkClassName}--secondary:active {
  background-color: ${colors.focusSoft};
  border-color: ${colors.focus};
}

.${complianceActionLinkClassName}:active {
  transform: scale(${motion.pressedScale});
}
`;
    document.head.appendChild(styleElement);
  }, []);
}

export function ComplianceActionLink({
  accessibilityHint,
  accessibilityLabel,
  detail,
  href,
  label,
  rel,
  target,
  variant = 'secondary',
}: ComplianceActionLinkProps) {
  useComplianceActionLinkWebStyles();

  const [isPressed, setIsPressed] = useState(false);
  const clearPressedState = () => setIsPressed(false);
  const isExternalWebLink =
    Platform.OS === 'web' && typeof href === 'string' && /^https?:\/\//.test(href);
  const resolvedRel = rel ?? (isExternalWebLink ? 'noreferrer' : undefined);
  const resolvedTarget = target ?? (isExternalWebLink ? '_blank' : undefined);
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
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      href={href}
      rel={resolvedRel}
      style={[
        styles.link,
        styles[variant],
        detail ? styles.linkWithDetail : null,
        isPressed ? styles[`${variant}Pressed`] : null,
      ]}
      target={resolvedTarget}
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

const styles = StyleSheet.create({
  link: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
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
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  primaryPressed: {
    backgroundColor: colors.accentActive,
    borderColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  secondaryPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  label: {
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.text,
  },
  detail: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  primaryDetail: {
    color: colors.surface,
  },
  secondaryDetail: {
    color: colors.textMuted,
  },
});
