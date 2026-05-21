import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { mascotAssetPath, type MascotExpression, type MascotId } from '../../lib/mascot/catalog';
import { colors, radius, space } from '../../lib/theme';
import type { StudyCompanionFeedbackState } from './StudyCompanionCard';

declare const require: (assetPath: string) => ImageSourcePropType;

type PracticeMascotExpression = Extract<MascotExpression, 'idle' | 'happy' | 'oops'>;

const artworkSize = space[7];

const mascotArtworkSources = {
  'dala-horse': {
    idle: require('../../assets/mascot/dala-horse/idle.svg'),
    happy: require('../../assets/mascot/dala-horse/happy.svg'),
    oops: require('../../assets/mascot/dala-horse/oops.svg'),
  },
  kanelbulle: {
    idle: require('../../assets/mascot/kanelbulle/idle.svg'),
    happy: require('../../assets/mascot/kanelbulle/happy.svg'),
    oops: require('../../assets/mascot/kanelbulle/oops.svg'),
  },
  skoglimpa: {
    idle: require('../../assets/mascot/skoglimpa/idle.svg'),
    happy: require('../../assets/mascot/skoglimpa/happy.svg'),
    oops: require('../../assets/mascot/skoglimpa/oops.svg'),
  },
  moose: {
    idle: require('../../assets/mascot/moose/idle.svg'),
    happy: require('../../assets/mascot/moose/happy.svg'),
    oops: require('../../assets/mascot/moose/oops.svg'),
  },
  tomte: {
    idle: require('../../assets/mascot/tomte/idle.svg'),
    happy: require('../../assets/mascot/tomte/happy.svg'),
    oops: require('../../assets/mascot/tomte/oops.svg'),
  },
  salmon: {
    idle: require('../../assets/mascot/salmon/idle.svg'),
    happy: require('../../assets/mascot/salmon/happy.svg'),
    oops: require('../../assets/mascot/salmon/oops.svg'),
  },
  'fika-cup': {
    idle: require('../../assets/mascot/fika-cup/idle.svg'),
    happy: require('../../assets/mascot/fika-cup/happy.svg'),
    oops: require('../../assets/mascot/fika-cup/oops.svg'),
  },
  'vasa-ship': {
    idle: require('../../assets/mascot/vasa-ship/idle.svg'),
    happy: require('../../assets/mascot/vasa-ship/happy.svg'),
    oops: require('../../assets/mascot/vasa-ship/oops.svg'),
  },
  'midsummer-pole': {
    idle: require('../../assets/mascot/midsummer-pole/idle.svg'),
    happy: require('../../assets/mascot/midsummer-pole/happy.svg'),
    oops: require('../../assets/mascot/midsummer-pole/oops.svg'),
  },
  lucia: {
    idle: require('../../assets/mascot/lucia/idle.svg'),
    happy: require('../../assets/mascot/lucia/happy.svg'),
    oops: require('../../assets/mascot/lucia/oops.svg'),
  },
  snowman: {
    idle: require('../../assets/mascot/snowman/idle.svg'),
    happy: require('../../assets/mascot/snowman/happy.svg'),
    oops: require('../../assets/mascot/snowman/oops.svg'),
  },
} satisfies Record<MascotId, Record<PracticeMascotExpression, ImageSourcePropType>>;

/**
 * Defaults: renders the catalog SVG as decorative practice artwork at the
 * token-bounded companion-card size.
 */
export interface MascotArtworkProps {
  expression: PracticeMascotExpression;
  mascotId: MascotId;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function MascotArtwork({
  expression,
  mascotId,
  size = artworkSize,
  style,
}: MascotArtworkProps) {
  const uri = resolveMascotArtworkUri(mascotId, expression);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { height: size, width: size }, style]}
      testID={`study-companion-artwork-${mascotId}-${expression}`}
    >
      <SvgUri
        accessibilityElementsHidden
        height={size}
        importantForAccessibility="no-hide-descendants"
        onError={ignoreMascotArtworkError}
        uri={uri}
        width={size}
      />
    </View>
  );
}

export function mascotArtworkExpressionForFeedbackState(
  feedbackState: StudyCompanionFeedbackState,
): PracticeMascotExpression {
  if (feedbackState === 'correct') return 'happy';
  if (feedbackState === 'incorrect') return 'oops';
  return 'idle';
}

export function mascotArtworkAssetPath(mascotId: MascotId, expression: PracticeMascotExpression) {
  return mascotAssetPath(mascotId, expression);
}

function resolveMascotArtworkUri(mascotId: MascotId, expression: PracticeMascotExpression) {
  const source = mascotArtworkSources[mascotId][expression];
  if (typeof source === 'string') return source;
  if (!Array.isArray(source) && typeof source === 'object' && typeof source.uri === 'string') {
    return source.uri;
  }

  const resolveAssetSource =
    typeof Image.resolveAssetSource === 'function' ? Image.resolveAssetSource : null;
  return resolveAssetSource?.(source)?.uri ?? null;
}

function ignoreMascotArtworkError() {
  return undefined;
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexShrink: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
