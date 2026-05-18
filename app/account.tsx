import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '../components/auth/Avatar';
import { useAuth } from '../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../lib/auth/displayName';
import { useRemoteEntitlement } from '../lib/auth/entitlements';
import { supabase } from '../lib/supabase';
import { colors, radius, space, typography } from '../lib/theme';

export default function AccountScreen() {
  const { status, user, signOut } = useAuth();
  const { entitlement } = useRemoteEntitlement();
  const info = deriveDisplayInfo(user);
  const [editedName, setEditedName] = useState(info.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setEditedName(info.name ?? '');
  }, [info.name]);

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading your account…</Text>
      </View>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>You're not signed in</Text>
        <Text style={styles.muted}>
          Sign in to sync progress across devices and tie Remove-Ads to your account.
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

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (trimmed === (info.name ?? '')) return;
    setSavingName(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, display_name: trimmed || null, updated_at: new Date().toISOString() });
      if (profileError) throw profileError;
      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: trimmed || null },
      });
      if (metaError) throw metaError;
    } catch (err) {
      Alert.alert('Could not save name', err instanceof Error ? err.message : String(err));
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Sign-out failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Link
        accessibilityLabel="Back to home"
        accessibilityRole="link"
        href="/(tabs)/home"
        style={styles.backLink}
      >
        ← Back
      </Link>

      <View style={styles.hero}>
        <Avatar uri={info.avatarUrl} name={info.name} email={info.email} size={88} />
        <View style={styles.heroText}>
          <Text style={styles.title}>{info.name ?? info.email}</Text>
          <Text style={styles.muted}>{info.email}</Text>
          {memberSince ? <Text style={styles.muted}>Member since {memberSince}</Text> : null}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          value={editedName}
          onChangeText={setEditedName}
          placeholder="How you want to appear"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={80}
        />
        <Pressable
          accessibilityLabel="Save display name"
          accessibilityRole="button"
          accessibilityState={{ disabled: savingName }}
          disabled={savingName}
          onPress={handleSaveName}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>
            {savingName ? 'Saving…' : 'Save name'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Remove-Ads</Text>
        <Text style={styles.muted}>
          {entitlement.removeAds
            ? `Active${entitlement.source ? ` · ${entitlement.source}` : ''}`
            : 'Not active. Purchase Remove-Ads from the Premium banner to disable ads app-wide.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & data</Text>
        <Text style={styles.muted}>
          We store your profile, study progress, and entitlement in Supabase (EU, Frankfurt).
          To export or delete your data, email support — automated deletion is coming.
        </Text>
        <Link
          accessibilityLabel="Open privacy policy"
          accessibilityRole="link"
          href="/privacy"
          style={styles.linkButton}
        >
          Privacy policy
        </Link>
      </View>

      <Pressable
        accessibilityLabel="Sign out"
        accessibilityRole="button"
        accessibilityState={{ disabled: signingOut }}
        disabled={signingOut}
        onPress={handleSignOut}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2.25],
    padding: space[3],
    paddingBottom: space[10],
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[1.5],
    justifyContent: 'center',
    padding: space[3],
  },
  backLink: {
    color: colors.accent,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  hero: {
    alignItems: 'center',
    gap: space[1.5],
  },
  heroText: {
    alignItems: 'center',
    gap: space[0.5],
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    textAlign: 'center',
  },
  muted: {
    color: colors.textMuted,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    padding: space[2],
  },
  cardTitle: {
    color: colors.text,
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  buttonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  linkButton: {
    alignSelf: 'flex-start',
    color: colors.accent,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  signOutButton: {
    alignSelf: 'flex-start',
    borderColor: colors.warning,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  signOutText: {
    color: colors.warning,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
