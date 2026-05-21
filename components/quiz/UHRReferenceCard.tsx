import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { UHRReference } from '../../types/content';
import { Card } from '../ui/Card';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { SourceCitation } from './SourceCitation';

type UHRReferenceCardCopy = {
  accessibilityLabelPrefix: string;
  approximatePage: string;
  title: string;
  unavailable: string;
};

const uhrReferenceCardCopy: Record<AppLanguage, UHRReferenceCardCopy> = {
  sv: {
    accessibilityLabelPrefix: 'UHR-källa',
    approximatePage: 'Ungefär sida',
    title: 'UHR-källa',
    unavailable: 'Källreferens saknas',
  },
  en: {
    accessibilityLabelPrefix: 'UHR reference',
    approximatePage: 'Approx. page',
    title: 'UHR reference',
    unavailable: 'Source reference unavailable',
  },
};

export function UHRReferenceCard({
  language = 'sv',
  reference,
}: {
  language?: AppLanguage;
  reference?: UHRReference;
}) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = uhrReferenceCardCopy[language];
  const label = reference ? `${reference.chapter} · ${reference.section}` : copy.unavailable;
  const pageLabel = reference?.pageApprox
    ? `${copy.approximatePage} ${reference.pageApprox}`
    : null;
  const referenceAccessibilityLabel = pageLabel
    ? `${copy.accessibilityLabelPrefix}: ${label}. ${pageLabel}`
    : `${copy.accessibilityLabelPrefix}: ${label}`;

  return (
    <Card accessibilityLabel={referenceAccessibilityLabel}>
      <SourceCitation
        accessibilityRole="none"
        label={copy.title}
        language={language}
        reference={reference}
        showLabel={false}
      >
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.body}>{label}</Text>
        {pageLabel ? <Text style={styles.meta}>{pageLabel}</Text> : null}
      </SourceCitation>
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    title: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    body: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      marginTop: space[1],
    },
    meta: {
      color: themeColors.textMuted,
      fontSize: typography.badge.fontSize,
      marginTop: space[0.5],
    },
  });
}
