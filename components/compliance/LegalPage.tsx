import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps, PropsWithChildren } from 'react';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type LegalBackHref = ComponentProps<typeof Link>['href'];
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
      <Text style={styles.paragraph}>{children}</Text>
    </View>
  );
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
});
