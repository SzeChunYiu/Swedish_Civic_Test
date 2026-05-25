import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { consumePendingReferralGrant } from '../referral/pendingReferralFlow';
import type { ReferralSupabaseClient } from '../referral/redeemReferral';
import { isSupabaseConfigured, supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

export type AuthProviderId = 'apple' | 'google';
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

type AuthContextValue = {
  isAuthConfigured: boolean;
  session: Session | null;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthStatus;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authUnavailableError(): Error {
  return new Error(
    'Optional account sign-in is not configured on this build. You can continue without an account and keep studying locally.',
  );
}

function authRedirectUri(): string {
  return makeRedirectUri({
    path: 'auth/callback',
    scheme: 'almost-swedish',
  });
}

function tokensFromRedirectUrl(
  url: string,
): { access_token: string; refresh_token: string } | null {
  const redirectUrl = new URL(url);
  const hashParams = new URLSearchParams(redirectUrl.hash.replace(/^#/, ''));
  const searchParams = redirectUrl.searchParams;
  const access_token = hashParams.get('access_token') ?? searchParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token') ?? searchParams.get('refresh_token');

  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

async function signInWithOAuthProvider(provider: AuthProviderId): Promise<void> {
  if (!isSupabaseConfigured) throw authUnavailableError();

  const redirectTo = authRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) throw error;
  if (Platform.OS === 'web' || !data?.url) return;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return;

  const tokens = tokensFromRedirectUrl(result.url);
  if (!tokens) return;

  const { error: sessionError } = await supabase.auth.setSession(tokens);
  if (sessionError) throw sessionError;
}

async function signInWithNativeApple(): Promise<void> {
  if (!isSupabaseConfigured) throw authUnavailableError();

  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    await signInWithOAuthProvider('apple');
    return;
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setStatus('anonymous');
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setStatus(data.session ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (cancelled) return;
        setSession(null);
        setStatus('anonymous');
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'anonymous');
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user?.id) return;

    void consumePendingReferralGrant({
      client: supabase as unknown as ReferralSupabaseClient,
    }).catch(() => undefined);
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthConfigured: isSupabaseConfigured,
      session,
      signInWithApple: signInWithNativeApple,
      signInWithGoogle: () => signInWithOAuthProvider('google'),
      signOut: async () => {
        if (!isSupabaseConfigured) {
          setSession(null);
          setStatus('anonymous');
          return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      status,
      user: session?.user ?? null,
    }),
    [session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
