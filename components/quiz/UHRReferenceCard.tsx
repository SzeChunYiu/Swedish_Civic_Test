import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion, UHRReference } from '../../types/content';
import { getQuestionProvenanceLabel, getQuestionSourceCitation } from '../../lib/quiz/questionText';
import { Card } from '../ui/Card';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';

type SourceBackedQuestion = Pick<
  PracticeQuestion,
  'provenance' | 'sourceReference' | 'uhrReference'
>;

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

// Provenance-aware: external-authority questions must NOT be titled as a UHR
// reference (hard provenance-label rule — learners must always know UHR vs
// supplementary external source). UHR questions keep the UHR-källa title.
const externalReferenceCardCopy: Record<AppLanguage, UHRReferenceCardCopy> = {
  sv: {
    accessibilityLabelPrefix: 'Källa',
    approximatePage: 'Ungefär sida',
    title: 'Källa',
    unavailable: 'Källreferens saknas',
  },
  en: {
    accessibilityLabelPrefix: 'Source',
    approximatePage: 'Approx. page',
    title: 'Source',
    unavailable: 'Source reference unavailable',
  },
};

export function UHRReferenceCard({
  language = 'sv',
  question,
  reference,
}: {
  language?: AppLanguage;
  question?: SourceBackedQuestion;
  reference?: UHRReference;
}) {
  const isExternalProvenance = question?.provenance === 'external';
  const copy = isExternalProvenance
    ? externalReferenceCardCopy[language]
    : uhrReferenceCardCopy[language];
  const resolvedReference = reference ?? question?.uhrReference;
  const provenanceLabel = getQuestionProvenanceLabel(question);
  const sourceCitation = getQuestionSourceCitation(question ?? { uhrReference: resolvedReference });
  const label = resolvedReference
    ? `${resolvedReference.chapter} · ${resolvedReference.section}`
    : copy.unavailable;
  const pageLabel = resolvedReference?.pageApprox
    ? `${copy.approximatePage} ${resolvedReference.pageApprox}`
    : null;
  const referenceAccessibilityLabel = pageLabel
    ? `${copy.accessibilityLabelPrefix}: ${label}. ${pageLabel}. ${sourceCitation}`
    : `${copy.accessibilityLabelPrefix}: ${label}. ${sourceCitation}`;

  return (
    <Card accessibilityLabel={referenceAccessibilityLabel}>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      {provenanceLabel ? <Text style={styles.provenanceLabel}>{provenanceLabel}</Text> : null}
      <Text style={styles.body}>{label}</Text>
      {pageLabel ? <Text style={styles.meta}>{pageLabel}</Text> : null}
      <Text style={styles.sourceCitation}>{sourceCitation}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[1],
  },
  provenanceLabel: {
    color: colors.warning,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.navButton.fontWeight,
    marginTop: space[1],
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.badge.fontSize,
    marginTop: space[0.5],
  },
  sourceCitation: {
    color: colors.textDisclaimer,
    fontSize: typography.disclaimer.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
    marginTop: space[1],
  },
});
