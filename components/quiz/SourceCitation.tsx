import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography } from '../../lib/theme';
import type { ThemeColors } from '../../lib/theme';
import type { UHRReference } from '../../types/content';
import { useResolvedThemeColors } from '../useResolvedThemeColors';

type SourceCitationCopy = {
  label: string;
  pagePrefix: string;
  unavailable: string;
};

const sourceCitationCopy: Record<AppLanguage, SourceCitationCopy> = {
  sv: {
    label: 'Källhänvisning',
    pagePrefix: 's.',
    unavailable: 'Källhänvisning saknas',
  },
  en: {
    label: 'Source citation',
    pagePrefix: 'p.',
    unavailable: 'Source citation unavailable',
  },
};

/**
 * Defaults: `language="sv"`, source title `"Sverige i fokus"`,
 * `accessibilityRole="text"`, `showLabel=true`, and localized citation
 * labels. Pass a `reference` to render the source line separately from
 * disclaimer copy.
 */
export interface SourceCitationProps extends Omit<
  ComponentProps<typeof View>,
  'children' | 'style'
> {
  bodyStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  language?: AppLanguage;
  metaStyle?: StyleProp<TextStyle>;
  reference?: UHRReference;
  showLabel?: boolean;
  sourceTitle?: string;
  style?: StyleProp<ViewStyle>;
  themeColors?: ThemeColors;
  unavailableLabel?: string;
}

function getCitationText({
  copy,
  reference,
  sourceTitle,
  unavailableLabel,
}: {
  copy: SourceCitationCopy;
  reference?: UHRReference;
  sourceTitle: string;
  unavailableLabel?: string;
}) {
  if (!reference) return unavailableLabel ?? copy.unavailable;
  return `${sourceTitle}, ${reference.chapter}, ${reference.section}`;
}

function getPageText(copy: SourceCitationCopy, reference?: UHRReference) {
  return reference?.pageApprox ? `${copy.pagePrefix} ${reference.pageApprox}` : undefined;
}

export function SourceCitation({
  accessibilityLabel,
  accessibilityRole = 'text',
  bodyStyle,
  children,
  label,
  labelStyle,
  language = 'sv',
  metaStyle,
  reference,
  showLabel = true,
  sourceTitle = 'Sverige i fokus',
  style,
  themeColors,
  unavailableLabel,
  ...viewProps
}: SourceCitationProps) {
  const resolvedThemeColors = useResolvedThemeColors(themeColors);
  const styles = useMemo(() => createStyles(resolvedThemeColors), [resolvedThemeColors]);
  const copy = sourceCitationCopy[language];
  const resolvedLabel = label ?? copy.label;
  const citationText = getCitationText({ copy, reference, sourceTitle, unavailableLabel });
  const hasCustomBody = children !== undefined && children !== null;
  const pageText = getPageText(copy, reference);
  const defaultAccessibilityLabel = [resolvedLabel, citationText, pageText]
    .filter(Boolean)
    .join('. ');
  const resolvedAccessibilityLabel =
    accessibilityRole === 'none' ? undefined : (accessibilityLabel ?? defaultAccessibilityLabel);

  return (
    <View
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.container, style]}
      {...viewProps}
    >
      {showLabel ? (
        <NativeText style={[styles.label, labelStyle]}>{resolvedLabel}</NativeText>
      ) : null}
      {hasCustomBody ? (
        children
      ) : (
        <NativeText style={[styles.body, bodyStyle]}>{citationText}</NativeText>
      )}
      {!hasCustomBody && pageText ? (
        <NativeText style={[styles.meta, metaStyle]}>{pageText}</NativeText>
      ) : null}
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      gap: space[0.5],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    label: {
      ...typography.badge,
      color: themeColors.textDisclaimer,
      textTransform: 'uppercase',
    },
    body: {
      ...typography.captionLight,
      color: themeColors.textSecondary,
    },
    meta: {
      ...typography.micro,
      color: themeColors.textMuted,
    },
  });
}
