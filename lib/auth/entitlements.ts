import { useEffect, useState } from 'react';

import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

export type RemoteEntitlement = {
  removeAds: boolean;
  source: string | null;
  purchasedAt: string | null;
};

const EMPTY: RemoteEntitlement = { removeAds: false, source: null, purchasedAt: null };

export function useRemoteEntitlement(): {
  loading: boolean;
  entitlement: RemoteEntitlement;
} {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState<RemoteEntitlement>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setEntitlement(EMPTY);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('entitlements')
      .select('remove_ads, source, purchased_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setEntitlement(EMPTY);
        } else {
          setEntitlement({
            removeAds: Boolean(data.remove_ads),
            source: data.source ?? null,
            purchasedAt: data.purchased_at ?? null,
          });
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { loading, entitlement };
}
