import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import {
  getQuestionPrimarySourceCitation,
  getQuestionSourceCitation,
  getQuestionSupplementalSourceCitations,
} from '../../lib/quiz/questionText';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { space, typography } from '../../lib/theme';
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
  const hasCustomBody = children !== undefined && children !== null;
  const primarySourceCitation =
    question?.uhrReference && !hasCustomBody
      ? getQuestionPrimarySourceCitation(question, language)
      : sourceCitation;
  const supplementalSourceCitations = getQuestionSupplementalSourceCitations(question, language);
  const resolvedLabel = label ?? questionSourceCitationLabels[language].label;
  const resolvedAccessibilityLabel = accessibilityLabel ?? `${resolvedLabel}: ${sourceCitation}`;

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
        <View style={styles.bodyStack}>
          <NativeText style={[styles.body, bodyStyle]}>{primarySourceCitation}</NativeText>
          {supplementalSourceCitations.length > 0 ? (
            <View style={styles.supplementalSourceList}>
              {supplementalSourceCitations.map((source) => (
                <Link
                  key={`${source.publisher}-${source.url}`}
                  accessibilityLabel={source.accessibilityLabel}
                  accessibilityRole="link"
                  href={source.url as Href}
                  rel="noreferrer"
                  style={styles.supplementalSourceLink}
                  target="_blank"
                >
                  {source.label}: {source.title}
                  {'\n'}
                  {source.meta}
                </Link>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </SourceCitation>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    bodyStack: {
      gap: space[0.75],
    },
    body: {
      color: themeColors.textDisclaimer,
      fontSize: typography.disclaimer.fontSize,
      lineHeight: typography.disclaimer.lineHeight,
    },
    supplementalSourceLink: {
      color: themeColors.accent,
      fontSize: typography.disclaimer.fontSize,
      lineHeight: typography.disclaimer.lineHeight,
      textDecorationLine: 'underline',
    },
    supplementalSourceList: {
      gap: space[0.5],
    },
  });
}
