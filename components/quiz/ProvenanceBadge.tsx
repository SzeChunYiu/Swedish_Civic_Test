import { StyleSheet, Text } from 'react-native';

import { getQuestionProvenance } from '../../lib/content/provenance';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { PracticeQuestion } from '../../types/content';

type ProvenanceBadgeCopy = {
  uhrLabel: string;
  supplementaryLabel: string;
  editorialLabel: string;
  accessibilityPrefix: string;
};

const provenanceBadgeCopy: Record<AppLanguage, ProvenanceBadgeCopy> = {
  sv: {
    uhrLabel: 'UHR-källa',
    supplementaryLabel: 'Tilläggsfråga',
    editorialLabel: 'Redaktionell',
    accessibilityPrefix: 'Källtyp',
  },
  en: {
    uhrLabel: 'UHR source',
    supplementaryLabel: 'Supplementary',
    editorialLabel: 'Editorial',
    accessibilityPrefix: 'Provenance',
  },
};

export function ProvenanceBadge({
  question,
  language = 'sv',
}: {
  question?: PracticeQuestion;
  language?: AppLanguage;
}) {
  if (!question) return null;
  const copy = provenanceBadgeCopy[language];
  const provenance = getQuestionProvenance(question);
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

  return (
    <Text
      accessibilityRole="text"
      accessibilityLabel={`${copy.accessibilityPrefix}: ${label}`}
      style={[styles.badge, tone]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    overflow: 'hidden',
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
    textTransform: 'uppercase',
  },
  uhr: {
    backgroundColor: colors.badgeBlueBg,
    color: colors.badgeBlueText,
  },
  supplementary: {
    backgroundColor: colors.surfaceWarm,
    color: colors.text,
  },
  editorial: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
});
