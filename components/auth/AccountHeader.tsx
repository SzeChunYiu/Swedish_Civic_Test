import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../../lib/auth/displayName';
import { colors, radius, space, typography } from '../../lib/theme';
import { Avatar } from './Avatar';

export function AccountHeader() {
  const { status, user } = useAuth();
  const info = deriveDisplayInfo(user);

  if (status === 'loading') {
    return (
      <View style={styles.row} accessibilityRole="header">
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText} />
      </View>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <Link
        accessibilityLabel="Sign in to sync your progress"
        accessibilityRole="link"
        href="/(auth)/sign-in"
        style={styles.signInPill}
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      accessibilityLabel={`Open account for ${info.name ?? info.email ?? 'your account'}`}
      accessibilityRole="link"
      href="/account"
      style={styles.row}
    >
      <Avatar uri={info.avatarUrl} name={info.name} email={info.email} size={32} />
      <View style={styles.textColumn}>
        <Text numberOfLines={1} style={styles.name}>
          {info.firstName ?? info.email}
        </Text>
        <Text numberOfLines={1} style={styles.subtext}>
          Synced
        </Text>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space[1],
    paddingHorizontal: space[0.75],
    paddingVertical: space[0.5],
  },
  textColumn: {
    paddingRight: space[1],
  },
  name: {
    color: colors.text,
    fontFamily: typography.captionLight.fontFamily,
    fontSize: typography.captionLight.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  subtext: {
    color: colors.success,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
  },
  signInPill: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
    textDecorationLine: 'none',
  },
  skeletonAvatar: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 32,
    width: 32,
  },
  skeletonText: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    height: space[1.5],
    width: space[8],
  },
});
