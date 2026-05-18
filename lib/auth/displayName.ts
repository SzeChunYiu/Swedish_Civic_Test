import type { User } from '@supabase/supabase-js';

export type DisplayInfo = {
  name: string | null;
  firstName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function deriveDisplayInfo(user: User | null): DisplayInfo {
  if (!user) {
    return { name: null, firstName: null, email: null, avatarUrl: null };
  }
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullNameRaw =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    null;
  const avatarRaw =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null;
  const firstName = fullNameRaw ? fullNameRaw.split(/\s+/)[0] : null;

  return {
    name: fullNameRaw,
    firstName,
    email: user.email ?? null,
    avatarUrl: avatarRaw,
  };
}
