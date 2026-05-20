import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import { ComplianceActionLink } from './ComplianceActionLink';

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

export function ComplianceLinks({ language }: { language?: AppLanguage } = {}) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = complianceLinksCopy[language ?? settingsLanguage];

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
          <ComplianceActionLink
            key={String(link.href)}
            accessibilityLabel={copy.openLabel(link.label)}
            href={link.href}
            label={link.label}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
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
});
