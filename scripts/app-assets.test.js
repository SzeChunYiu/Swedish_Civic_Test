const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function pngDimensions(relativePath) {
  const buffer = fs.readFileSync(path.join(repoRoot, relativePath));
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function assertHexColor(value, label) {
  assert.match(value, /^#[0-9a-f]{6}$/i, `${label} should be a six-digit hex color`);
}

test('release app assets are configured and present at store-safe sizes', () => {
  const app = readJson('app.json').expo;
  const splashDimensions = pngDimensions('assets/splash-icon.png');

  assert.equal(app.icon, './assets/icon.png');
  assert.equal(app.splash.image, './assets/splash-icon.png');
  assert.equal(app.splash.resizeMode, 'contain');
  assert.equal(app.splash.backgroundColor, '#fffcf9');
  assert.equal(app.android.adaptiveIcon.foregroundImage, './assets/adaptive-icon.png');
  assertHexColor(app.splash.backgroundColor, 'splash background');
  assertHexColor(app.android.adaptiveIcon.backgroundColor, 'adaptive icon background');
  assert.equal(app.android.adaptiveIcon.backgroundColor, app.splash.backgroundColor);

  assert.deepEqual(pngDimensions('assets/icon.png'), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions('assets/adaptive-icon.png'), { width: 1024, height: 1024 });
  assert.deepEqual(splashDimensions, { width: 1024, height: 1024 });
});
