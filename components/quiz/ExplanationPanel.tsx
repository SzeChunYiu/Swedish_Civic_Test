import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import type { LocalizedContentText } from '../../types/content';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ExplanationPanelCopy = {
  accessibilityLabelPrefix: string;
  fallback: string;
  title: string;
};

const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy> = {
  sv: {
    accessibilityLabelPrefix: 'Förklaring',
    fallback: 'Förklaring saknas för den här frågan.',
    title: 'Förklaring',
  },
  en: {
    accessibilityLabelPrefix: 'Explanation',
    fallback: 'Explanation unavailable for this question.',
    title: 'Explanation',
  },
};

export function ExplanationPanel({
  explanationEn,
  explanationSv,
  explanationText,
  language = 'sv',
}: {
  explanationEn?: string;
  explanationSv?: string;
  explanationText?: Partial<LocalizedContentText>;
  language?: AppLanguage;
}) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = explanationPanelCopy[language];
  const localizedExplanation = explanationText?.[language] ?? explanationText?.sv;
  const explanation =
    localizedExplanation ??
    (language === 'en' && explanationEn ? explanationEn : (explanationSv ?? copy.fallback));
  const panelAccessibilityLabel = `${copy.accessibilityLabelPrefix}: ${explanation}`;

  return (
    <Card accessibilityLabel={panelAccessibilityLabel}>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.body}>{explanation}</Text>
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
      fontSize: typography.navButton.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
      marginTop: space[1],
    },
  });
}
