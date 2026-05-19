import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getProvenanceDescription, getQuestionProvenance } from '../../lib/content/provenance';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import type { PracticeQuestion } from '../../types/content';

type ProvenanceBadgeCopy = {
  uhrLabel: string;
  supplementaryLabel: string;
  editorialLabel: string;
  accessibilityPrefix: string;
  sourceNotePrefix: string;
  sourceNoteHint: string;
};

const provenanceBadgeCopy: Record<AppLanguage, ProvenanceBadgeCopy> = {
  sv: {
    uhrLabel: 'UHR-källa',
    supplementaryLabel: 'Tilläggsfråga',
    editorialLabel: 'Redaktionell',
    accessibilityPrefix: 'Källtyp',
    sourceNotePrefix: 'Källanteckning',
    sourceNoteHint: 'Visar eller döljer en kort källanteckning.',
  },
  en: {
    uhrLabel: 'UHR source',
    supplementaryLabel: 'Supplementary',
    editorialLabel: 'Editorial',
    accessibilityPrefix: 'Provenance',
    sourceNotePrefix: 'Source note',
    sourceNoteHint: 'Shows or hides a short source note.',
  },
};

/**
 * Defaults: `language="sv"`, localized provenance label and source note copy,
 * `accessibilityRole="button"`, collapsed toggleable source note, and
 * token-sized hit slop. Pass `language` when the surrounding question card is
 * rendered in English support mode.
 */
export interface ProvenanceBadgeProps {
  question?: PracticeQuestion;
  language?: AppLanguage;
}

export function ProvenanceBadge({ question, language = 'sv' }: ProvenanceBadgeProps) {
  const [sourceNoteVisible, setSourceNoteVisible] = useState(false);
  const showSourceNote = () => setSourceNoteVisible(true);
  const toggleSourceNote = () => setSourceNoteVisible((visible) => !visible);

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

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint={copy.sourceNoteHint}
        accessibilityLabel={`${copy.accessibilityPrefix}: ${label}. ${noteLabel}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: sourceNoteVisible }}
        hitSlop={space[1]}
        onBlur={() => setSourceNoteVisible(false)}
        onFocus={showSourceNote}
        onPress={toggleSourceNote}
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
    minHeight: space[6],
    justifyContent: 'center',
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
