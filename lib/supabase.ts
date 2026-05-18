import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  // Don't throw — the app must still load when env is unset (e.g. on a Vercel
  // preview deployment where the env vars haven't been added yet). Auth-
  // dependent flows degrade to anonymous and show a clear message.
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing. ' +
      'Auth and remote sync are disabled. Set both env vars in Vercel → Project Settings → Environment Variables.',
  );
}

// Build the client with placeholder values when env is missing so the bundle
// can load. Any actual auth/data call will reject at runtime with a clear
// error path, but the rest of the app keeps working anonymously.
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.invalid',
  supabasePublishableKey ?? 'placeholder-key',
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured && Platform.OS === 'web',
    },
  },
);
