import { AdBanner } from './AdBanner';
import type { PremiumEntitlements } from '../../types/monetization';

export function AdInterstitial({
  entitlements,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  triggerKey?: string;
}) {
  return <AdBanner entitlements={entitlements} placement="quiz_completed_interstitial" />;
}
