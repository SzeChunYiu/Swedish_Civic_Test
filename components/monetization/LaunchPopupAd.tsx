import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAdUnit, shouldShowLaunchPopupAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { colors, radius, space, typography } from '../../lib/theme';
import type { PremiumEntitlements } from '../../types/monetization';

let launchPopupShownThisRuntime = false;

export function LaunchPopupAd({
  entitlements = FREE_ENTITLEMENTS,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      !shouldShowLaunchPopupAd({
        alreadyShownThisLaunch: launchPopupShownThisRuntime,
        entitlements,
      })
    ) {
      return;
    }

    launchPopupShownThisRuntime = true;
    setVisible(true);
  }, [entitlements]);

  const unit = getAdUnit('app_open_launch');

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.backdrop}>
        <View
          accessibilityLabel="Launch sponsor ad"
          accessibilityViewIsModal
          aria-modal={true}
          role="dialog"
          style={styles.card}
        >
          <Text style={styles.eyebrow}>Google AdMob</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Launch sponsor
          </Text>
          <Text style={styles.body}>
            {unit?.testOnly
              ? 'App-open test ad preview shown once per app launch.'
              : 'Sponsored launch placement.'}
          </Text>
          <Pressable
            accessibilityLabel="Close launch sponsor ad"
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>Continue studying</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.textDisclaimer,
    flex: 1,
    justifyContent: 'center',
    padding: space[3],
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    maxWidth: 360,
    padding: space[3],
    width: '100%',
  },
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    marginTop: space[1],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  closeText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
