import type { User } from '@supabase/supabase-js';

export type AuthDisplayInfo = {
  avatarUrl: string | null;
  email: string | null;
  name: string | null;
};

function stringMetadataValue(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function deriveAuthDisplayInfo(user: User | null): AuthDisplayInfo {
  if (!user) return { avatarUrl: null, email: null, name: null };

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = stringMetadataValue(metadata, 'full_name') ?? stringMetadataValue(metadata, 'name');
  const avatarUrl =
    stringMetadataValue(metadata, 'avatar_url') ?? stringMetadataValue(metadata, 'picture');

  return {
    avatarUrl,
    email: user.email ?? null,
    name,
  };
}
