import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import {
  DEFAULT_COMPANION_ID,
  getMascot,
  type MascotDescriptor,
  type MascotId,
} from '../../lib/mascot/catalog';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import { Button } from '../Button';
import { MascotArtwork, mascotArtworkExpressionForFeedbackState } from './MascotArtwork';

export type StudyCompanionFeedbackState = 'neutral' | 'correct' | 'incorrect';

type StudyCompanionCardCopy = {
  accessibilityLabel: (label: string, body: string) => string;
  correctBody: (label: string) => string;
  correctState: string;
  incorrectBody: (label: string) => string;
  incorrectState: string;
  neutralBody: (label: string, anchor: string) => string;
  neutralState: string;
  settingsAccessibilityLabel: string;
  settingsLabel: string;
  title: string;
};

const studyCompanionCardCopy: Record<AppLanguage, StudyCompanionCardCopy> = {
  sv: {
    accessibilityLabel: (label, body) => `Studiekompis ${label}. ${body}`,
    correctBody: (label) => `${label} markerar rätt svar. Fortsätt i samma takt.`,
    correctState: 'Rätt svar',
    incorrectBody: (label) => `${label} föreslår: läs källan, jämför alternativen och prova igen.`,
    incorrectState: 'Repetera',
    neutralBody: (label, anchor) => `${label} följer med i övningen. ${anchor}`,
    neutralState: 'Redo',
    settingsAccessibilityLabel: 'Byt studiekompis i Inställningar',
    settingsLabel: 'Byt i Inställningar',
    title: 'Din studiekompis',
  },
  en: {
    accessibilityLabel: (label, body) => `Study companion ${label}. ${body}`,
    correctBody: (label) => `${label} marks the correct answer. Keep the same pace.`,
    correctState: 'Correct',
    incorrectBody: (label) =>
      `${label} suggests: read the source, compare the options, and try again.`,
    incorrectState: 'Review',
    neutralBody: (label, anchor) => `${label} is with you in practice. ${anchor}`,
    neutralState: 'Ready',
    settingsAccessibilityLabel: 'Change study companion in Settings',
    settingsLabel: 'Change in Settings',
    title: 'Your study companion',
  },
};

/**
 * Defaults: `feedbackState="neutral"` and a compact Settings link so the
 * selected free companion can be changed without gating practice.
 */
export interface StudyCompanionCardProps {
  feedbackState?: StudyCompanionFeedbackState;
  language: AppLanguage;
  mascotId: MascotId;
  style?: StyleProp<ViewStyle>;
}

export function StudyCompanionCard({
  feedbackState = 'neutral',
  language,
  mascotId,
  style,
}: StudyCompanionCardProps) {
  const copy = studyCompanionCardCopy[language];
  const mascot = resolveMascot(mascotId);
  const label = language === 'sv' ? mascot.labelSv : mascot.labelEn;
  const anchor = language === 'sv' ? mascot.anchorSv : mascot.anchorEn;
  const body = bodyForState(copy, feedbackState, label, anchor);
  const stateLabel = stateLabelFor(copy, feedbackState);
  const artworkExpression = mascotArtworkExpressionForFeedbackState(feedbackState);

  return (
    <View
      accessibilityLabel={copy.accessibilityLabel(label, body)}
      style={[styles.card, styles[feedbackState], style]}
    >
      <MascotArtwork expression={artworkExpression} mascotId={mascot.id} style={styles.artwork} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={[styles.state, stateStyleFor(feedbackState)]}>{stateLabel}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.body}>{body}</Text>
        <Link
          accessibilityLabel={copy.settingsAccessibilityLabel}
          accessibilityRole="link"
          asChild
          href="/settings?focus=companion"
        >
          <Button
            accessibilityLabel={copy.settingsAccessibilityLabel}
            accessibilityRole="link"
            style={styles.settingsLink}
            variant="secondary"
          >
            {copy.settingsLabel}
          </Button>
        </Link>
      </View>
    </View>
  );
}

function resolveMascot(mascotId: MascotId): MascotDescriptor {
  return getMascot(mascotId) ?? getMascot(DEFAULT_COMPANION_ID)!;
}

function bodyForState(
  copy: StudyCompanionCardCopy,
  feedbackState: StudyCompanionFeedbackState,
  label: string,
  anchor: string,
) {
  if (feedbackState === 'correct') return copy.correctBody(label);
  if (feedbackState === 'incorrect') return copy.incorrectBody(label);
  return copy.neutralBody(label, anchor);
}

function stateLabelFor(copy: StudyCompanionCardCopy, feedbackState: StudyCompanionFeedbackState) {
  if (feedbackState === 'correct') return copy.correctState;
  if (feedbackState === 'incorrect') return copy.incorrectState;
  return copy.neutralState;
}

function stateStyleFor(feedbackState: StudyCompanionFeedbackState) {
  if (feedbackState === 'correct') return styles.correctState;
  if (feedbackState === 'incorrect') return styles.incorrectState;
  return styles.neutralState;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    gap: space[1.5],
    padding: space[2],
  },
  correct: {
    backgroundColor: colors.correctBg,
    borderColor: colors.success,
  },
  incorrect: {
    backgroundColor: colors.incorrectBg,
    borderColor: colors.warning,
  },
  neutral: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  artwork: {
    marginTop: space[0.5],
  },
  content: {
    flex: 1,
    gap: space[0.75],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  state: {
    borderRadius: radius.pill,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
    overflow: 'hidden',
    paddingHorizontal: space[1],
    paddingVertical: space[0.5],
    textTransform: 'uppercase',
  },
  correctState: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
  incorrectState: {
    backgroundColor: colors.warningSoft,
    color: colors.warning,
  },
  neutralState: {
    backgroundColor: colors.badgeBlueBg,
    color: colors.badgeBlueText,
  },
  label: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    marginTop: space[0.5],
  },
});
