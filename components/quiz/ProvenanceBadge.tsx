import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    setSourceNoteVisible(false);
  }, [question?.id, language]);

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
        aria-expanded={sourceNoteVisible}
        hitSlop={space[1]}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={() => setSourceNoteVisible((visible) => !visible)}
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
        <Text accessibilityRole="text" style={styles.sourceNote}>
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
      borderWidth: StyleSheet.hairlineWidth,
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
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      paddingHorizontal: space[1],
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
