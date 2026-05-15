const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('EAS build and submit profiles are configured for internal and production releases', () => {
  const eas = readJson('eas.json');
  assert.equal(eas.cli.version, '>= 13.0.0');
  assert.equal(eas.build.preview.distribution, 'internal');
  assert.equal(eas.build.preview.android.buildType, 'apk');
  assert.equal(eas.build.production.autoIncrement, true);
  assert.equal(eas.submit.production.ios.appleId, 'TBD');
  assert.equal(
    eas.submit.production.android.serviceAccountKeyPath,
    './publishing/google-play-service-account.json',
  );
});

test('store build scripts document the exact release commands', () => {
  const pkg = readJson('package.json');
  assert.equal(
    pkg.scripts['build:preview'],
    'npx --yes eas-cli@18.13.0 build --profile preview --platform all',
  );
  assert.equal(
    pkg.scripts['build:production'],
    'npx --yes eas-cli@18.13.0 build --profile production --platform all',
  );
  assert.equal(
    pkg.scripts['submit:production'],
    'npx --yes eas-cli@18.13.0 submit --profile production --platform all',
  );
});

test('EAS CLI is invoked through npx so Expo Doctor accepts the dependency graph', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.devDependencies['eas-cli'], undefined);
  assert.match(pkg.scripts['build:preview'], /^npx --yes eas-cli@18\.13\.0 /);
  assert.match(pkg.scripts['build:production'], /^npx --yes eas-cli@18\.13\.0 /);
  assert.match(pkg.scripts['submit:production'], /^npx --yes eas-cli@18\.13\.0 /);
});

test('web export script is available for local production bundle smoke', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['build:web:export'], 'expo export --platform web --output-dir dist-web');
  assert.match(fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8'), /^dist-web\/$/m);
});
