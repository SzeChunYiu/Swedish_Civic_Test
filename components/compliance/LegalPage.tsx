import { Link } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps, PropsWithChildren } from 'react';
import { useState } from 'react';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';

type LegalBackHref = ComponentProps<typeof Link>['href'];
type LegalExternalHref = ComponentProps<typeof Link>['href'];
type LegalPageCopy = {
  defaultBackAccessibilityLabel: string;
  defaultBackLabel: string;
};

const legalPageCopy: Record<AppLanguage, LegalPageCopy> = {
  sv: {
    defaultBackAccessibilityLabel: 'Tillbaka till profil',
    defaultBackLabel: '← Tillbaka till profil',
  },
  en: {
    defaultBackAccessibilityLabel: 'Back to profile',
    defaultBackLabel: '← Back to Profile',
  },
};

/**
 * Defaults: links back to Profile with a language-aware label, derives custom
 * back link spoken labels from `backLabel`, and preserves the tokenized legal
 * page layout. Pass `backAccessibilityLabel` only when the visible label needs
 * a more specific spoken destination.
 */
export interface LegalPageProps extends PropsWithChildren {
  backAccessibilityLabel?: string;
  backHref?: LegalBackHref;
  backLabel?: string;
  language?: AppLanguage;
  title: string;
}

/**
 * Defaults: renders a warm tokenized legal section with the provided `title`
 * and body copy.
 */
export interface LegalSectionProps extends PropsWithChildren {
  title: string;
}

/**
 * Defaults: renders body copy with the shared legal paragraph style.
 */
export interface LegalSectionParagraphProps {
  children: PropsWithChildren['children'];
}

/**
 * Defaults: renders an external legal/source destination as a 48px token-sized
 * link row with visible destination context and tokenized focus/press feedback.
 */
export interface LegalExternalLinkProps {
  accessibilityHint: string;
  accessibilityLabel: string;
  displayUrl: string;
  href: LegalExternalHref;
  label: string;
}

export function LegalPage({
  backAccessibilityLabel,
  backHref = '/(tabs)/profile',
  backLabel,
  children,
  language,
  title,
}: LegalPageProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = legalPageCopy[language ?? settingsLanguage];
  const resolvedBackLabel = backLabel ?? copy.defaultBackLabel;
  const resolvedBackAccessibilityLabel =
    backAccessibilityLabel ??
    (backLabel == null ? copy.defaultBackAccessibilityLabel : getBackAccessibilityLabel(backLabel));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel={resolvedBackAccessibilityLabel}
        accessibilityRole="link"
        href={backHref}
        style={styles.backLink}
      >
        {resolvedBackLabel}
      </Link>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {isPlainText(children) ? <Text style={styles.paragraph}>{children}</Text> : children}
    </View>
  );
}

export function LegalSectionParagraph({ children }: LegalSectionParagraphProps) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function LegalExternalLink({
  accessibilityHint,
  accessibilityLabel,
  displayUrl,
  href,
  label,
}: LegalExternalLinkProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: () => setIsFocused(false),
          onFocus: () => setIsFocused(true),
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        }
      : {};

  return (
    <Link
      {...webInteractionHandlers}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      href={href}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.externalLink,
        isFocused || isHovered ? styles.externalLinkFocused : null,
        isPressed ? styles.externalLinkPressed : null,
      ]}
    >
      <Text style={styles.externalLinkLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.externalLinkUrl}>
        {displayUrl}
      </Text>
    </Link>
  );
}

function isPlainText(children: LegalSectionProps['children']) {
  return typeof children === 'string' || typeof children === 'number';
}

function getBackAccessibilityLabel(label: string) {
  return label.replace(/^[←\s]+/, '').trim();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2.25],
    padding: space[3],
  },
  backLink: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  title: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
  },
  body: {
    gap: space[1.75],
  },
  section: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    gap: space[1],
    padding: space[2],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  externalLink: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[0.5],
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  externalLinkFocused: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
  },
  externalLinkPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  externalLinkLabel: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  externalLinkUrl: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
