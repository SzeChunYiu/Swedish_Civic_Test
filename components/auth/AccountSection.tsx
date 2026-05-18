import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../../lib/auth/displayName';
import { useRemoteEntitlement } from '../../lib/auth/entitlements';
import { colors, radius, space, typography } from '../../lib/theme';
import { Avatar } from './Avatar';

export function AccountSection() {
  const { status, user } = useAuth();
  const { entitlement } = useRemoteEntitlement();
  const info = deriveDisplayInfo(user);

  if (status === 'loading') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.subtitle}>Checking sign-in status…</Text>
      </View>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sign in</Text>
        <Text style={styles.subtitle}>
          Sync your progress across devices and tie Remove-Ads to your account. Optional — the app
          works fully anonymous.
        </Text>
        <Link
          accessibilityLabel="Open sign-in"
          accessibilityRole="link"
          href="/(auth)/sign-in"
          style={styles.primaryButton}
        >
          Sign in
        </Link>
      </View>
    );
  }

  return (
    <Link
      accessibilityLabel={`Open account for ${info.name ?? info.email ?? 'your account'}`}
      accessibilityRole="link"
      href="/account"
      style={styles.linkSection}
    >
      <View style={styles.row}>
        <Avatar uri={info.avatarUrl} name={info.name} email={info.email} size={48} />
        <View style={styles.textColumn}>
          <Text numberOfLines={1} style={styles.name}>
            {info.name ?? info.email}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {entitlement.removeAds ? 'Remove-Ads · active' : 'Manage account →'}
          </Text>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  linkSection: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[2],
    textDecorationLine: 'none',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
  },
  textColumn: {
    flex: 1,
    gap: space[0.5],
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  name: {
    color: colors.text,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
