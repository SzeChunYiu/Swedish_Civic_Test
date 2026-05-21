import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type ComplianceLinkKey =
  | 'disclaimer'
  | 'privacy'
  | 'terms'
  | 'sources'
  | 'support'
  | 'aboutTheTest';
type ComplianceHref = ComponentProps<typeof Link>['href'];
type ComplianceLinksCopy = {
  title: string;
  openLabel: (label: string) => string;
  links: Record<ComplianceLinkKey, string>;
};

const linkKeys = ['aboutTheTest', 'disclaimer', 'privacy', 'terms', 'sources', 'support'] as const;
const complianceLinksClassName = 'compliance-footer-link';
const complianceLinksStyleElementId = 'compliance-footer-link-style';

const linkHrefs: Record<ComplianceLinkKey, ComplianceHref> = {
  disclaimer: '/disclaimer',
  privacy: '/privacy',
  terms: '/terms',
  sources: '/sources',
  support: '/support',
  aboutTheTest: '/about-the-test',
};

const complianceLinksCopy: Record<AppLanguage, ComplianceLinksCopy> = {
  sv: {
    title: 'Juridik och källor',
    openLabel: (label) => `Öppna ${label}`,
    links: {
      aboutTheTest: 'Om provet',
      disclaimer: 'Information',
      privacy: 'Integritet',
      terms: 'Villkor',
      sources: 'Källor',
      support: 'Support',
    },
  },
  en: {
    title: 'Legal and sources',
    openLabel: (label) => `Open ${label}`,
    links: {
      aboutTheTest: 'About the test',
      disclaimer: 'Disclaimer',
      privacy: 'Privacy',
      terms: 'Terms',
      sources: 'Sources',
      support: 'Support',
    },
  },
};

function useComplianceLinksWebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById(complianceLinksStyleElementId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = complianceLinksStyleElementId;
    styleElement.textContent = `
.${complianceLinksClassName} {
  align-items: center;
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  min-height: ${space[6]}px;
  min-width: ${space[6]}px;
  padding: ${space[1]}px ${space[1.5]}px;
}

.${complianceLinksClassName}:hover,
.${complianceLinksClassName}:focus-visible {
  background-color: ${colors.focusSoft};
}
`;
    document.head.appendChild(styleElement);
  }, []);
}

export function ComplianceLinks({ language }: { language?: AppLanguage } = {}) {
  useComplianceLinksWebStyles();

  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = complianceLinksCopy[language ?? settingsLanguage];
  const webClassName =
    Platform.OS === 'web'
      ? {
          className: complianceLinksClassName,
        }
      : {};

  const links = linkKeys.map((key) => ({
    href: linkHrefs[key],
    label: copy.links[key],
  }));

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <View style={styles.links}>
        {links.map((link) => (
          <Link
            {...webClassName}
            key={String(link.href)}
            accessibilityLabel={copy.openLabel(link.label)}
            accessibilityRole="link"
            href={link.href}
            style={styles.link}
          >
            {link.label}
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1.25],
    padding: space[2],
  },
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.25],
  },
  link: {
    alignItems: 'center',
    borderRadius: radius.button,
    color: colors.accent,
    display: 'flex',
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
    justifyContent: 'center',
    lineHeight: typography.caption.lineHeight,
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.5],
    textAlign: 'center',
    textDecorationLine: 'none',
  },
});
