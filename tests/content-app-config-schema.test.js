const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('app config schema stays aligned with release app metadata and ad/IAP plugins', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const appConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));
  const packageMetadata = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const plugins = appConfig.expo.plugins;

  assert.equal(summary.appConfigPluginsValidated, 5);
  assert.equal(summary.appConfigSchemaValidated, true);
  assert.equal(appConfig.expo.name, 'Almost Swedish');
  assert.equal(appConfig.expo.slug, 'almost-swedish');
  assert.equal(appConfig.expo.version, packageMetadata.version);
  assert.equal(appConfig.expo.scheme, appConfig.expo.slug);
  assert.equal(appConfig.expo.ios.bundleIdentifier, 'com.billyyiu.almostswedish');
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
