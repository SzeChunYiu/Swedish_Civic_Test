import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Children, Fragment, isValidElement } from 'react';
import type { ComponentProps, PropsWithChildren, ReactElement, ReactNode } from 'react';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import { ComplianceActionLink } from './ComplianceActionLink';

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
 * Defaults: renders a warm tokenized legal section with the provided `title`,
 * paragraph body copy, and no trailing action.
 */
export interface LegalSectionProps extends PropsWithChildren {
  body?: string;
  title: string;
}

export interface LegalExternalLinkProps {
  accessibilityLabel: string;
  destination: string;
  href: LegalExternalHref;
  label: string;
}

export type LegalLinkListProps = PropsWithChildren;

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
      <ComplianceActionLink
        accessibilityLabel={resolvedBackAccessibilityLabel}
        href={backHref}
        label={resolvedBackLabel}
      />
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

export function LegalSection({ title, body, children }: LegalSectionProps) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {body ? <Text style={styles.paragraph}>{body}</Text> : null}
      {renderSectionChildren(children)}
    </View>
  );
}

export function LegalExternalLink({
  accessibilityLabel,
  destination,
  href,
  label,
}: LegalExternalLinkProps) {
  return (
    <Link
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      href={href}
      rel="noreferrer"
      style={styles.externalLink}
      target="_blank"
    >
      {label}
      {'\n'}
      {destination}
    </Link>
  );
}

export function LegalLinkList({ children }: LegalLinkListProps) {
  return <View style={styles.linkList}>{children}</View>;
}

function getBackAccessibilityLabel(label: string) {
  return label.replace(/^[←\s]+/, '').trim();
}

function renderSectionChildren(children: ReactNode) {
  const sectionChildren = flattenSectionChildren(children);
  if (sectionChildren.length === 0) return null;

  const renderedChildren: ReactNode[] = [];
  let paragraphChildren: LegalSectionTextChild[] = [];

  sectionChildren.forEach((child, index) => {
    if (isTextChild(child)) {
      paragraphChildren.push(child);
      return;
    }

    flushParagraph(renderedChildren, paragraphChildren, index);
    paragraphChildren = [];
    renderedChildren.push(child);
  });

  flushParagraph(renderedChildren, paragraphChildren, sectionChildren.length);
  return renderedChildren.length === 1 ? renderedChildren[0] : renderedChildren;
}

type LegalSectionRenderableChild = Exclude<ReactNode, boolean | null | undefined>;
type LegalSectionTextChild = string | number;

function flattenSectionChildren(children: ReactNode): LegalSectionRenderableChild[] {
  const flattenedChildren: LegalSectionRenderableChild[] = [];

  Children.forEach(children, (child) => {
    if (child == null || typeof child === 'boolean') return;

    if (isFragmentChild(child)) {
      flattenedChildren.push(...flattenSectionChildren(child.props.children));
      return;
    }

    flattenedChildren.push(child);
  });

  return flattenedChildren;
}

function isFragmentChild(
  child: ReactNode,
): child is ReactElement<PropsWithChildren<Record<string, never>>> {
  return isValidElement<PropsWithChildren<Record<string, never>>>(child) && child.type === Fragment;
}

function isTextChild(child: LegalSectionRenderableChild): child is LegalSectionTextChild {
  return typeof child === 'string' || typeof child === 'number';
}

function flushParagraph(
  renderedChildren: ReactNode[],
  paragraphChildren: LegalSectionTextChild[],
  paragraphIndex: number,
) {
  if (paragraphChildren.length === 0) return;

  renderedChildren.push(
    <Text key={`legal-section-paragraph-${paragraphIndex}`} style={styles.paragraph}>
      {paragraphChildren}
    </Text>,
  );
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.bodyTight.lineHeight,
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.25],
    paddingVertical: space[1],
    textDecorationLine: 'none',
    width: '100%',
  },
  linkList: {
    gap: space[1],
  },
});
