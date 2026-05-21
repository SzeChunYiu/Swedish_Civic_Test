const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createTsLoader } = require('./helpers/monetizationRuntimeHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const loadTs = createTsLoader(repoRoot);

function loadMobileAdsConsent() {
  return loadTs('lib/monetization/mobileAdsConsent.ts');
}

function createRuntime({ calls, platform = 'android', ...handlers }) {
  return {
    async gatherUmpConsent() {
      calls.push('ump');
      return handlers.gatherUmpConsent?.() ?? { status: 'NOT_REQUIRED' };
    },
    async getTrackingPermissionsAsync() {
      calls.push('att:get');
      return handlers.getTrackingPermissionsAsync?.() ?? { status: 'denied' };
    },
    async getUmpConsentInfo() {
      calls.push('ump:cached-info');
      return handlers.getUmpConsentInfo?.() ?? { status: 'NOT_REQUIRED' };
    },
    async initializeGoogleMobileAds() {
      calls.push('ads:init');
      return handlers.initializeGoogleMobileAds?.();
    },
    platform,
    async requestTrackingPermissionsAsync() {
      calls.push('att:request');
      return handlers.requestTrackingPermissionsAsync?.() ?? { status: 'denied' };
    },
  };
}

test('Mobile Ads consent runtime requests ATT before UMP and SDK init', async () => {
  const { initializeGoogleMobileAdsAfterConsent } = loadMobileAdsConsent();
  const calls = [];

  const result = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    region: 'eea',
    runtime: createRuntime({
      calls,
      gatherUmpConsent: () => ({ canRequestAds: true, status: 'OBTAINED' }),
      getTrackingPermissionsAsync: () => ({ status: 'undetermined' }),
      platform: 'ios',
      requestTrackingPermissionsAsync: () => ({ status: 'denied' }),
    }),
  });

  assert.deepEqual(calls, ['att:get', 'att:request', 'ump', 'ads:init']);
  assert.equal(result.initialized, true);
  assert.equal(result.state.trackingTransparencyStatus, 'denied');
  assert.equal(result.state.umpConsentStatus, 'obtained');
  assert.equal(result.decision.canInitializeGoogleMobileAds, true);
  assert.equal(result.decision.requestNonPersonalizedAdsOnly, true);
});

test('Mobile Ads consent runtime skips UMP for non-UMP regions', async () => {
  const { initializeGoogleMobileAdsAfterConsent } = loadMobileAdsConsent();

  for (const region of ['us', 'other']) {
    const calls = [];
    const result = await initializeGoogleMobileAdsAfterConsent({
      entitlements: { adsDisabled: false },
      googleMobileAdsEnabled: true,
      realAdsEnabled: true,
      region,
      runtime: createRuntime({
        calls,
        gatherUmpConsent: () => {
          throw new Error(`${region} must not gather UMP consent`);
        },
      }),
    });

    assert.deepEqual(calls, ['ads:init'], `${region} should initialize without UMP`);
    assert.equal(result.initialized, true);
    assert.equal(result.state.region, region);
    assert.equal(result.state.umpConsentStatus, 'not_required');
    assert.equal(result.decision.canInitializeGoogleMobileAds, true);
  }
});

test('Mobile Ads consent runtime treats invalid region as unknown and fails closed', async () => {
  const { initializeGoogleMobileAdsAfterConsent } = loadMobileAdsConsent();
  const calls = [];

  const result = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    region: 'invalid-region',
    runtime: createRuntime({
      calls,
      gatherUmpConsent: () => ({ status: 'REQUIRED' }),
    }),
  });

  assert.deepEqual(calls, ['ump']);
  assert.equal(result.initialized, false);
  assert.equal(result.state.region, 'unknown');
  assert.equal(result.state.umpConsentStatus, 'required');
  assert.equal(result.decision.canInitializeGoogleMobileAds, false);
  assert.equal(result.decision.blockReason, 'pending_consent_prompts');
  assert.deepEqual(result.decision.consentDecision.pendingPrompts, ['ump_consent_form']);
});

test('Mobile Ads consent runtime skips prompts and SDK init for Remove Ads', async () => {
  const { initializeGoogleMobileAdsAfterConsent } = loadMobileAdsConsent();
  const calls = [];

  const result = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: true },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    region: 'eea',
    runtime: createRuntime({
      calls,
      platform: 'ios',
    }),
  });

  assert.deepEqual(calls, []);
  assert.equal(result.initialized, false);
  assert.equal(result.state.trackingTransparencyStatus, 'unavailable');
  assert.equal(result.state.umpConsentStatus, 'not_required');
  assert.equal(result.decision.blockReason, 'remove_ads_entitlement');
});

test('Mobile Ads consent runtime falls back to cached UMP info before SDK init', async () => {
  const { initializeGoogleMobileAdsAfterConsent } = loadMobileAdsConsent();
  const calls = [];

  const result = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    region: 'uk',
    runtime: createRuntime({
      calls,
      gatherUmpConsent: () => {
        throw new Error('UMP unavailable');
      },
      getUmpConsentInfo: () => ({ canRequestAds: true, status: 'UNKNOWN' }),
    }),
  });

  assert.deepEqual(calls, ['ump', 'ump:cached-info', 'ads:init']);
  assert.equal(result.initialized, true);
  assert.equal(result.state.umpConsentStatus, 'obtained');
  assert.equal(result.decision.canInitializeGoogleMobileAds, true);
});

test('Mobile Ads consent runtime keeps SDK init blocked when Google ads are disabled', async () => {
  const { initializeGoogleMobileAdsAfterConsent } = loadMobileAdsConsent();
  const calls = [];

  const result = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: false,
    realAdsEnabled: true,
    region: 'us',
    runtime: createRuntime({ calls }),
  });

  assert.deepEqual(calls, []);
  assert.equal(result.initialized, false);
  assert.equal(result.state.umpConsentStatus, 'not_required');
  assert.equal(result.decision.blockReason, 'google_ads_disabled');
});
