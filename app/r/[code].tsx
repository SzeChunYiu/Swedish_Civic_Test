import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RouteLink } from '../../components/ui/RouteLink';
import { isReferralCode, normalizeReferralCode } from '../../lib/referral/generateCode';
import { storePendingReferralCode } from '../../lib/referral/pendingReferralStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ReferralInviteCopy = {
  anonymous: string;
  body: string;
  invalidBody: string;
  invalidTitle: string;
  signIn: string;
  statusReady: string;
  storing: string;
  title: string;
};

const referralInviteCopy: Record<AppLanguage, ReferralInviteCopy> = {
  en: {
    anonymous: 'Continue studying without an account',
    body: 'Sign in to save this invite for later redemption. You can still study locally without using the invite.',
    invalidBody:
      'This invite link is not usable. No invite code was saved, and you can keep studying without an account.',
    invalidTitle: 'Invite link unavailable',
    signIn: 'Continue to sign-in',
    statusReady: 'Invite saved for sign-in',
    storing: 'Checking invite...',
    title: 'Referral invite',
  },
  sv: {
    anonymous: 'Fortsatt studera utan konto',
    body: 'Logga in för att spara inbjudan för senare inlösen. Du kan fortfarande studera lokalt utan att använda inbjudan.',
    invalidBody:
      'Den här inbjudningslänken går inte att använda. Ingen inbjudningskod sparades, och du kan fortsätta studera utan konto.',
    invalidTitle: 'Inbjudningslänken fungerar inte',
    signIn: 'Fortsätt till inloggning',
    statusReady: 'Inbjudan sparad för inloggning',
    storing: 'Kontrollerar inbjudan...',
    title: 'Inbjudan via tips',
  },
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function ReferralInviteScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const rawCode = firstParam(params.code);
  const normalizedCode = normalizeReferralCode(rawCode);
  const isValidCode = isReferralCode(normalizedCode);
  const [storedCode, setStoredCode] = useState<string | null>(null);
  const language = useSettingsStore((state) => state.language);
  const copy = referralInviteCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  useEffect(() => {
    let cancelled = false;

    if (!isValidCode) {
      setStoredCode(null);
      return;
    }

    storePendingReferralCode(normalizedCode).then((code) => {
      if (!cancelled) setStoredCode(code);
    });

    return () => {
      cancelled = true;
    };
  }, [isValidCode, normalizedCode]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          {isValidCode ? copy.title : copy.invalidTitle}
        </Text>
        <Text style={styles.body}>{isValidCode ? copy.body : copy.invalidBody}</Text>
        {isValidCode ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {storedCode ? copy.statusReady : copy.storing}
          </Text>
        ) : null}
        <View style={styles.links}>
          {isValidCode ? (
            <RouteLink
              accessibilityLabel={copy.signIn}
              href="/(auth)/sign-in"
              style={styles.link}
              variant="primary"
            >
              {copy.signIn}
            </RouteLink>
          ) : null}
          <RouteLink
            accessibilityLabel={copy.anonymous}
            href="/home"
            style={styles.link}
            variant={isValidCode ? 'secondary' : 'primary'}
          >
            {copy.anonymous}
          </RouteLink>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    body: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    card: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: space.hairline,
      gap: space[2],
      maxWidth: 560,
      padding: space[3],
      width: '100%',
    },
    container: {
      backgroundColor: themeColors.surface,
      flex: 1,
    },
    content: {
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center',
      padding: space[3],
      paddingBottom: space[10],
    },
    link: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
    },
    links: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    status: {
      backgroundColor: themeColors.successSoft,
      borderColor: themeColors.success,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      color: themeColors.success,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      padding: space[1.5],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.sectionHeading.fontSize,
      fontWeight: typography.sectionHeading.fontWeight,
      lineHeight: typography.sectionHeading.lineHeight,
    },
  });
}
