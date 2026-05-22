import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

const nativeSessionStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

function getSessionStorage() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return nativeSessionStorage;
}

function warnMissingSupabaseConfig() {
  if (isSupabaseConfigured || typeof console === 'undefined') return;

  console.warn(
    '[auth] EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set. Optional account sign-in is unavailable; anonymous study remains enabled.',
  );
}

warnMissingSupabaseConfig();

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://optional-auth-not-configured.supabase.co',
  supabasePublishableKey || 'optional-auth-not-configured',
  {
    auth: {
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured && Platform.OS === 'web',
      persistSession: isSupabaseConfigured,
      storage: getSessionStorage(),
    },
  },
);
