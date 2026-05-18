import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../../lib/auth/displayName';
import { colors, radius, space, typography } from '../../lib/theme';

const DISMISSED_KEY = 'welcomeBannerDismissedFor';

function readDismissed(): string | null {
  if (typeof globalThis === 'undefined') return null;
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage?.getItem(DISMISSED_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeDismissed(userId: string) {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    storage?.setItem(DISMISSED_KEY, userId);
  } catch {
    /* no-op */
  }
}

export function WelcomeBanner() {
  const { status, user } = useAuth();
  const info = deriveDisplayInfo(user);
  const [dismissedFor, setDismissedFor] = useState<string | null>(() => readDismissed());

  useEffect(() => {
    setDismissedFor(readDismissed());
  }, [user]);

  if (status !== 'authenticated' || !user) return null;
  if (dismissedFor === user.id) return null;

  const greeting = info.firstName ? `Welcome, ${info.firstName}!` : 'Welcome!';

  const handleDismiss = () => {
    writeDismissed(user.id);
    setDismissedFor(user.id);
  };

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.textColumn}>
        <Text style={styles.title}>{greeting}</Text>
        <Text style={styles.body}>
          Your progress now syncs across devices. Remove-Ads purchases also link to your account.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Dismiss welcome banner"
        accessibilityRole="button"
        onPress={handleDismiss}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'flex-start',
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space[1.5],
    padding: space[2],
  },
  textColumn: {
    flex: 1,
    gap: space[0.5],
  },
  title: {
    color: colors.badgeBlueText,
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  dismissButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  dismissText: {
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
