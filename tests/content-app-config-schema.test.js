const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const REAL_ADS_ENABLED_ENV_KEY = 'EXPO_PUBLIC_REAL_ADS_ENABLED';
const REAL_ADMOB_APP_ID_ENV_KEYS = {
  android: 'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
  ios: 'EXPO_PUBLIC_ADMOB_IOS_APP_ID',
};
const GOOGLE_SAMPLE_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};
const VALIDATOR_REAL_ADMOB_APP_IDS = {
  android: 'ca-app-pub-1234567890123456~1111111111',
  ios: 'ca-app-pub-1234567890123456~2222222222',
};

function envWithOverrides(overrides) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
}

function readGoogleMobileAdsPluginConfig(overrides = {}) {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      `
const { getConfig } = require('@expo/config');
const config = getConfig(process.cwd(), { skipSDKVersionRequirement: true });
const plugin = config.exp.plugins.find(
  (entry) => Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads',
);
process.stdout.write(JSON.stringify(plugin && plugin[1]));
`,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: envWithOverrides(overrides),
    },
  );

  return JSON.parse(output);
}

function spawnExpoConfig(overrides = {}) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const { getConfig } = require('@expo/config');
getConfig(process.cwd(), { skipSDKVersionRequirement: true });
`,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: envWithOverrides(overrides),
    },
  );
}

test('app config schema stays aligned with release app metadata and ad/IAP plugins', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-app-config-schema'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const appConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));
  const packageMetadata = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const plugins = appConfig.expo.plugins;

  assert.equal(summary.appConfigPluginsValidated, 5);
  assert.equal(summary.appConfigSchemaValidated, true);
  assert.equal(summary.appConfigAdMobAppIdsValidated, 4);
  assert.equal(summary.appConfigAdMobRealFlagRejectsSampleAppIds, true);
  assert.equal(summary.staticHeadMetadataTitleValidated, 1);
  assert.equal(summary.staticHeadMetadataDescriptionValidated, 1);
  assert.equal(summary.staticHeadMetadataOutcomeClaimPatternsValidated, 22);
  assert.equal(summary.staticHeadMetadataParityValidated, true);
  assert.equal(appConfig.expo.version, packageMetadata.version);
  assert.equal(appConfig.expo.scheme, appConfig.expo.slug);
  assert.equal(appConfig.expo.ios.bundleIdentifier, appConfig.expo.android.package);
  assert.ok(plugins.some((plugin) => plugin === 'react-native-iap'));
  assert.ok(
    plugins.some((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-tracking-transparency'),
  );
  assert.ok(
    plugins.some(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads',
    ),
  );
});

test('app config resolves AdMob App IDs from env only when real ads are enabled', () => {
  const fallbackConfig = readGoogleMobileAdsPluginConfig({
    [REAL_ADS_ENABLED_ENV_KEY]: undefined,
    [REAL_ADMOB_APP_ID_ENV_KEYS.android]: undefined,
    [REAL_ADMOB_APP_ID_ENV_KEYS.ios]: undefined,
  });
  const realConfig = readGoogleMobileAdsPluginConfig({
    [REAL_ADS_ENABLED_ENV_KEY]: 'true',
    [REAL_ADMOB_APP_ID_ENV_KEYS.android]: VALIDATOR_REAL_ADMOB_APP_IDS.android,
    [REAL_ADMOB_APP_ID_ENV_KEYS.ios]: VALIDATOR_REAL_ADMOB_APP_IDS.ios,
  });

  assert.equal(fallbackConfig.androidAppId, GOOGLE_SAMPLE_ADMOB_APP_IDS.android);
  assert.equal(fallbackConfig.iosAppId, GOOGLE_SAMPLE_ADMOB_APP_IDS.ios);
  assert.equal(realConfig.androidAppId, VALIDATOR_REAL_ADMOB_APP_IDS.android);
  assert.equal(realConfig.iosAppId, VALIDATOR_REAL_ADMOB_APP_IDS.ios);
  assert.equal(realConfig.delayAppMeasurementInit, true);
});

test('app config rejects Google sample AdMob App IDs when real ads are enabled', () => {
  const result = spawnExpoConfig({
    [REAL_ADS_ENABLED_ENV_KEY]: 'true',
    [REAL_ADMOB_APP_ID_ENV_KEYS.android]: GOOGLE_SAMPLE_ADMOB_APP_IDS.android,
    [REAL_ADMOB_APP_ID_ENV_KEYS.ios]: GOOGLE_SAMPLE_ADMOB_APP_IDS.ios,
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /must not use Google's sample AdMob/);
});

test('app config schema rejects unsafe Google Ads measurement init drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app.json')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('"delayAppMeasurementInit": true', '"delayAppMeasurementInit": false');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /react-native-google-mobile-ads must delay app measurement initialization/,
  );
});

test('web shell brand metadata rejects stale browser metadata', () => {
  const metadataMutations = [
    {
      source: "const WEB_DOCUMENT_TITLE = 'Almost Swedish';",
      replacement:
        "const WEB_DOCUMENT_TITLE = ['Sweden', 'Citizenship', 'Test', 'Prep'].join(' ');",
      message: /webDocumentTitle must match app\.json expo\.name/,
    },
    {
      source:
        "'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.'",
      replacement: "'Pass the test.'",
      message: /webDocumentDescription English pass-the-test slogan/,
    },
    {
      source: 'openGraphTitle: WEB_DOCUMENT_TITLE,',
      replacement: "openGraphTitle: 'Sweden Citizenship Test Prep',",
      message: /webDocumentOpenGraphTitle must match app\.json expo\.name/,
    },
  ];

  for (const { source, replacement, message } of metadataMutations) {
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/scaffold/webDocumentMetadata.js')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(${JSON.stringify(source)}, ${JSON.stringify(replacement)});
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-app-config-schema');
require('./scripts/validate-content.js');
`,
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, message);
  }
});
