import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getProvenanceDescription, getQuestionProvenance } from '../../lib/content/provenance';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../../types/content';

type ProvenanceBadgeCopy = {
  uhrLabel: string;
  supplementaryLabel: string;
  editorialLabel: string;
  accessibilityPrefix: string;
  collapsedHint: string;
  expandedHint: string;
  sourceNoteLabel: string;
};

const provenanceBadgeCopy: Record<AppLanguage, ProvenanceBadgeCopy> = {
  sv: {
    uhrLabel: 'UHR-källa',
    supplementaryLabel: 'Tilläggsfråga',
    editorialLabel: 'Redaktionell',
    accessibilityPrefix: 'Källtyp',
    collapsedHint: 'Visa källanteckning',
    expandedHint: 'Dölj källanteckning',
    sourceNoteLabel: 'Källanteckning',
  },
  en: {
    uhrLabel: 'UHR source',
    supplementaryLabel: 'Supplementary',
    editorialLabel: 'Editorial',
    accessibilityPrefix: 'Provenance',
    collapsedHint: 'Show source note',
    expandedHint: 'Hide source note',
    sourceNoteLabel: 'Source note',
  },
};

function sourceNoteIdFor(questionId: string | undefined, language: AppLanguage) {
  const safeQuestionId = (questionId ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `provenance-source-note-${language}-${safeQuestionId}`;
}

export function ProvenanceBadge({
  question,
  language = 'sv',
  themeColors: providedThemeColors,
}: {
  question?: PracticeQuestion;
  language?: AppLanguage;
  themeColors?: ThemeColors;
}) {
  const fallbackThemeColors = useThemeColors();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const reduceMotion = useReducedMotion();
  const [sourceNoteVisible, setSourceNoteVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const focusRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceNoteId = useMemo(
    () => sourceNoteIdFor(question?.id, language),
    [question?.id, language],
  );

  const clearFocusRevealTimeout = () => {
    if (focusRevealTimeoutRef.current == null) return;
    clearTimeout(focusRevealTimeoutRef.current);
    focusRevealTimeoutRef.current = null;
  };

  const showSourceNote = () => {
    setFocused(true);
    clearFocusRevealTimeout();
    focusRevealTimeoutRef.current = setTimeout(() => {
      focusRevealTimeoutRef.current = null;
      setSourceNoteVisible(true);
    }, 0);
  };

  const hideSourceNote = () => {
    clearFocusRevealTimeout();
    setFocused(false);
    setSourceNoteVisible(false);
  };

  const toggleSourceNote = () => {
    clearFocusRevealTimeout();
    setSourceNoteVisible((visible) => !visible);
  };

  useEffect(() => {
    clearFocusRevealTimeout();
    setSourceNoteVisible(false);
  }, [question?.id, language]);

  useEffect(
    () => () => {
      clearFocusRevealTimeout();
    },
    [],
  );

  if (!question) return null;
  const copy = provenanceBadgeCopy[language];
  const provenance = getQuestionProvenance(question);
  const sourceNote = getProvenanceDescription(provenance, language);
  const label =
    provenance === 'uhr'
      ? copy.uhrLabel
      : provenance === 'derived'
        ? copy.supplementaryLabel
        : copy.editorialLabel;
  const tone =
    provenance === 'uhr'
      ? styles.uhr
      : provenance === 'derived'
        ? styles.supplementary
        : styles.editorial;
  const textTone =
    provenance === 'uhr'
      ? styles.uhrText
      : provenance === 'derived'
        ? styles.supplementaryText
        : styles.editorialText;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint={sourceNoteVisible ? copy.expandedHint : copy.collapsedHint}
        accessibilityLabel={`${copy.accessibilityPrefix}: ${label}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: sourceNoteVisible }}
        aria-controls={sourceNoteVisible ? sourceNoteId : undefined}
        aria-describedby={sourceNoteVisible ? sourceNoteId : undefined}
        aria-expanded={sourceNoteVisible}
        hitSlop={space[1]}
        onBlur={hideSourceNote}
        onFocus={showSourceNote}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={toggleSourceNote}
        style={({ pressed }) => [
          styles.badge,
          tone,
          focused || hovered ? styles.badgeFocused : null,
          pressed && !reduceMotion ? styles.badgePressed : null,
        ]}
      >
        <Text style={[styles.badgeText, textTone]}>{label}</Text>
      </Pressable>
      {sourceNoteVisible ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
          aria-live="polite"
          nativeID={sourceNoteId}
          style={styles.sourceNote}
        >
          {copy.sourceNoteLabel}: {sourceNote}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'flex-start',
      gap: space[0.75],
    },
    badge: {
      alignSelf: 'flex-start',
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: space[6],
      overflow: 'hidden',
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.5],
    },
    badgeFocused: {
      borderColor: themeColors.focus,
    },
    badgePressed: {
      transform: [{ scale: motion.pressedScale }],
    },
    badgeText: {
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      textTransform: 'uppercase',
    },
    uhr: {
      backgroundColor: themeColors.badgeBlueBg,
    },
    supplementary: {
      backgroundColor: themeColors.surfaceWarm,
    },
    editorial: {
      backgroundColor: themeColors.surfaceMuted,
    },
    sourceNote: {
      alignSelf: 'flex-start',
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      maxWidth: '100%',
      paddingHorizontal: space[1.25],
      paddingVertical: space[0.75],
    },
    uhrText: {
      color: themeColors.badgeBlueText,
    },
    supplementaryText: {
      color: themeColors.text,
    },
    editorialText: {
      color: themeColors.textMuted,
    },
  });
}
