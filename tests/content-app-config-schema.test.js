const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName, moduleCache = new Map()) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  if (filePath.endsWith('.json')) {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    moduleCache.set(filePath, parsed);
    return exportName ? parsed[exportName] : parsed;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(specifier) {
    if (specifier.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(filePath), specifier);
      const candidates = [
        resolvedPath,
        `${resolvedPath}.ts`,
        `${resolvedPath}.tsx`,
        `${resolvedPath}.js`,
        `${resolvedPath}.json`,
        path.join(resolvedPath, 'index.ts'),
      ];
      const found = candidates.find(
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );

      if (found?.startsWith(repoRoot)) {
        return loadTs(path.relative(repoRoot, found), undefined, moduleCache);
      }
    }

    return require(specifier);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function withEnv(overrides, fn) {
  const previous = new Map();

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function getGoogleAdsPluginConfig(expoConfig) {
  return expoConfig.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads',
  )?.[1];
}

test('app config schema stays aligned with release app metadata and ad/IAP plugins', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const appConfig = { expo: loadTs('app.config.ts').default() };
  const packageMetadata = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const plugins = appConfig.expo.plugins;

  assert.equal(summary.appConfigPluginsValidated, 5);
  assert.equal(summary.appConfigSchemaValidated, true);
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

test('app config keeps sample AdMob app ids unless real ads are explicitly enabled', () => {
  const { GOOGLE_SAMPLE_ADMOB_APP_IDS } = loadTs('app.config.ts');
  const appConfig = withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: undefined,
      EXPO_PUBLIC_ADMOB_IOS_APP_ID: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => loadTs('app.config.ts', undefined, new Map()).default(),
  );
  const googleAdsConfig = getGoogleAdsPluginConfig(appConfig);

  assert.equal(googleAdsConfig.androidAppId, GOOGLE_SAMPLE_ADMOB_APP_IDS.android);
  assert.equal(googleAdsConfig.iosAppId, GOOGLE_SAMPLE_ADMOB_APP_IDS.ios);
});

test('app config requires recorded real AdMob app ids when real ads are enabled', () => {
  const { EXPECTED_REAL_ADMOB_APP_IDS, resolveGoogleMobileAdsAppIds } = loadTs('app.config.ts');

  assert.deepEqual(
    resolveGoogleMobileAdsAppIds({
      EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
      EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: EXPECTED_REAL_ADMOB_APP_IDS.android,
      EXPO_PUBLIC_ADMOB_IOS_APP_ID: EXPECTED_REAL_ADMOB_APP_IDS.ios,
    }),
    {
      androidAppId: EXPECTED_REAL_ADMOB_APP_IDS.android,
      iosAppId: EXPECTED_REAL_ADMOB_APP_IDS.ios,
      realAdsEnabled: true,
    },
  );
  assert.throws(
    () => resolveGoogleMobileAdsAppIds({ EXPO_PUBLIC_REAL_ADS_ENABLED: 'true' }),
    /EXPO_PUBLIC_REAL_ADS_ENABLED=true requires EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=/,
  );
  assert.throws(
    () =>
      resolveGoogleMobileAdsAppIds({
        EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
        EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: 'ca-app-pub-3940256099942544~3347511713',
        EXPO_PUBLIC_ADMOB_IOS_APP_ID: EXPECTED_REAL_ADMOB_APP_IDS.ios,
      }),
    /must not use Google's sample AdMob publisher id/,
  );
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
