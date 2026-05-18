import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function signInWithOAuthProvider(provider: 'google' | 'facebook'): Promise<void> {
  const redirectTo = makeRedirectUri({ scheme: 'swedish-civic-test', path: 'auth/callback' });

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

  const url = new URL(result.url);
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const params = new URLSearchParams(hash || url.search);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return;

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) throw sessionError;
}

async function signInWithAppleNative(): Promise<void> {
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
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'anonymous');
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

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      signInWithGoogle: () => signInWithOAuthProvider('google'),
      signInWithFacebook: () => signInWithOAuthProvider('facebook'),
      signInWithApple: async () => {
        if (Platform.OS === 'ios') {
          await signInWithAppleNative();
        } else {
          await signInWithOAuthProvider('google');
        }
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [status, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
