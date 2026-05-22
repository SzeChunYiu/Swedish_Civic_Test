import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { getQuestionSourceCitation } from '../../lib/quiz/questionText';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { typography } from '../../lib/theme';
import type { ThemeColors } from '../../lib/theme';
import type { OfficialSourceReference, UHRReference } from '../../types/content';
import { useResolvedThemeColors } from '../useResolvedThemeColors';
import { SourceCitation } from './SourceCitation';
import type { SourceCitationProps } from './SourceCitation';

export type QuestionSourceCitationQuestion = {
  uhrReference?: UHRReference;
  supplementalSources?: OfficialSourceReference[];
};

type QuestionSourceCitationLabelCopy = {
  label: string;
};

const questionSourceCitationLabels: Record<AppLanguage, QuestionSourceCitationLabelCopy> = {
  sv: {
    label: 'Källhänvisning',
  },
  en: {
    label: 'Source citation',
  },
};

/**
 * Defaults: `language="sv"`, localized citation label, computed
 * `getQuestionSourceCitation(question, language)` body text, and the shared
 * `SourceCitation` surface. Pass `citationText` when a caller already computed
 * the validated visible source line.
 */
export interface QuestionSourceCitationProps extends Omit<
  SourceCitationProps,
  'children' | 'language' | 'reference'
> {
  bodyStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  citationText?: string;
  language?: AppLanguage;
  question?: QuestionSourceCitationQuestion;
  themeColors?: ThemeColors;
}

export function QuestionSourceCitation({
  accessibilityLabel,
  bodyStyle,
  children,
  citationText,
  label,
  language = 'sv',
  question,
  themeColors,
  ...citationProps
}: QuestionSourceCitationProps) {
  const resolvedThemeColors = useResolvedThemeColors(themeColors);
  const styles = useMemo(() => createStyles(resolvedThemeColors), [resolvedThemeColors]);
  const sourceCitation = citationText ?? getQuestionSourceCitation(question, language);
  const resolvedLabel = label ?? questionSourceCitationLabels[language].label;
  const resolvedAccessibilityLabel = accessibilityLabel ?? `${resolvedLabel}: ${sourceCitation}`;
  const hasCustomBody = children !== undefined && children !== null;

  return (
    <SourceCitation
      accessibilityLabel={resolvedAccessibilityLabel}
      label={resolvedLabel}
      language={language}
      reference={question?.uhrReference}
      themeColors={resolvedThemeColors}
      {...citationProps}
    >
      {hasCustomBody ? (
        children
      ) : (
        <NativeText style={[styles.body, bodyStyle]}>{sourceCitation}</NativeText>
      )}
    </SourceCitation>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    body: {
      color: themeColors.textDisclaimer,
      fontSize: typography.disclaimer.fontSize,
      lineHeight: typography.disclaimer.lineHeight,
    },
  });
}
