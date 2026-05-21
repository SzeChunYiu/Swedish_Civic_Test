import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getProvenanceDescription, getQuestionProvenance } from '../../lib/content/provenance';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import type { PracticeQuestion } from '../../types/content';

type ProvenanceBadgeCopy = {
  accessibilityPrefix: string;
  editorialLabel: string;
  sourceNoteHint: string;
  sourceNotePrefix: string;
  supplementaryLabel: string;
  uhrLabel: string;
};

const provenanceBadgeCopy: Record<AppLanguage, ProvenanceBadgeCopy> = {
  sv: {
    accessibilityPrefix: 'Källtyp',
    editorialLabel: 'Redaktionell',
    sourceNoteHint: 'Visar en kort källanteckning.',
    sourceNotePrefix: 'Källanteckning',
    supplementaryLabel: 'Tilläggsfråga',
    uhrLabel: 'UHR-källa',
  },
  en: {
    accessibilityPrefix: 'Provenance',
    editorialLabel: 'Editorial',
    sourceNoteHint: 'Shows a short source note.',
    sourceNotePrefix: 'Source note',
    supplementaryLabel: 'Supplementary',
    uhrLabel: 'UHR source',
  },
};

/**
 * Defaults: `language="sv"`, localized provenance label and source note copy,
 * `accessibilityRole="button"`, collapsed source note, and token-sized hit
 * slop. Pass `language` when the surrounding question card is rendered in
 * English support mode.
 */
export interface ProvenanceBadgeProps {
  language?: AppLanguage;
  question?: PracticeQuestion;
}

export function ProvenanceBadge({ question, language = 'sv' }: ProvenanceBadgeProps) {
  const focusShowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerPressStarted = useRef(false);
  const [sourceNoteVisible, setSourceNoteVisible] = useState(false);

  const clearFocusShowTimeout = () => {
    if (focusShowTimeout.current === null) return;
    clearTimeout(focusShowTimeout.current);
    focusShowTimeout.current = null;
  };

  useEffect(
    () => () => {
      if (focusShowTimeout.current !== null) clearTimeout(focusShowTimeout.current);
    },
    [],
  );

  if (!question) return null;

  const copy = provenanceBadgeCopy[language];
  const provenance = getQuestionProvenance(question);
  const sourceNoteText = getProvenanceDescription(provenance, language);
  const label =
    provenance === 'uhr'
      ? copy.uhrLabel
      : provenance === 'derived'
        ? copy.supplementaryLabel
        : copy.editorialLabel;
  const tone =
    provenance === 'uhr'
      ? { badge: styles.uhrBadge, label: styles.uhrLabel }
      : provenance === 'derived'
        ? { badge: styles.supplementaryBadge, label: styles.supplementaryLabel }
        : { badge: styles.editorialBadge, label: styles.editorialLabel };
  const noteLabel = `${copy.sourceNotePrefix}: ${sourceNoteText}`;
  const showSourceNote = () => {
    clearFocusShowTimeout();
    focusShowTimeout.current = setTimeout(() => {
      focusShowTimeout.current = null;
      if (!pointerPressStarted.current) setSourceNoteVisible(true);
    }, 0);
  };
  const toggleSourceNote = () => setSourceNoteVisible((visible) => !visible);
  const beginPointerPress = () => {
    clearFocusShowTimeout();
    pointerPressStarted.current = true;
  };
  const endPointerPress = () => {
    pointerPressStarted.current = false;
  };
  const hideSourceNote = () => {
    clearFocusShowTimeout();
    setSourceNoteVisible(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        aria-expanded={sourceNoteVisible}
        aria-label={`${copy.accessibilityPrefix}: ${label}. ${noteLabel}`}
        accessibilityHint={copy.sourceNoteHint}
        accessibilityLabel={`${copy.accessibilityPrefix}: ${label}. ${noteLabel}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: sourceNoteVisible }}
        hitSlop={space[1]}
        onBlur={hideSourceNote}
        onFocus={showSourceNote}
        onPress={toggleSourceNote}
        onPressIn={beginPointerPress}
        onPressOut={endPointerPress}
        style={({ pressed }) => [
          styles.badge,
          tone.badge,
          sourceNoteVisible ? styles.badgeExpanded : null,
          pressed ? styles.badgePressed : null,
        ]}
      >
        <Text style={[styles.label, tone.label]}>{label}</Text>
      </Pressable>
      {sourceNoteVisible ? (
        <Text accessibilityRole="text" style={styles.sourceNote}>
          {noteLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    gap: space[0.75],
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    justifyContent: 'center',
    minHeight: space[6],
    overflow: 'hidden',
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
  },
  badgeExpanded: {
    borderColor: colors.focus,
  },
  badgePressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  label: {
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  sourceNote: {
    ...typography.disclaimer,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    color: colors.textSecondary,
    paddingHorizontal: space[1.25],
    paddingVertical: space[1],
  },
  uhrBadge: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueBg,
  },
  uhrLabel: {
    color: colors.badgeBlueText,
  },
  supplementaryBadge: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  supplementaryLabel: {
    color: colors.text,
  },
  editorialBadge: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  editorialLabel: {
    color: colors.textMuted,
  },
});
