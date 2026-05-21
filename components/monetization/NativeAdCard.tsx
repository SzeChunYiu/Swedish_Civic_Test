import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getNativeAdCardCopy } from '../../lib/monetization/adCopy';
import {
  getAdUnit,
  shouldShowAd,
  WEB_AD_FALLBACK_CONSENT_DECISION,
} from '../../lib/monetization/ads';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

export function NativeAdCard({
  entitlements,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const language = useSettingsStore((state) => state.language);
  const resultsNativeUnit = getAdUnit('results_native');
  const copy = getNativeAdCardCopy(language, { testOnly: resultsNativeUnit?.testOnly });
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);

  if (
    !entitlementsReady ||
    !shouldShowAd('results_native', resolvedEntitlements, WEB_AD_FALLBACK_CONSENT_DECISION)
  ) {
    return null;
  }

  return (
    <Card accessibilityHint={copy.hint} accessibilityLabel={copy.accessibilityLabel}>
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.meta}>{copy.meta}</Text>
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    eyebrow: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      textTransform: 'uppercase',
    },
    title: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      marginTop: space[0.5],
    },
    meta: {
      color: themeColors.textMuted,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.caption.lineHeight,
      marginTop: space[0.5],
    },
  });
}
