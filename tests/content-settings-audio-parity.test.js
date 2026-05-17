const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('audio setting stays in parity between storage and settings switch', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const settingsStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );
  const settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsAudioLabelsValidated, 2);
  assert.equal(summary.settingsAudioParityValidated, true);
  assert.match(settingsStore, /const audioEnabledKey = 'audioEnabled';/);
  assert.match(settingsStore, /settingsStorage\?\.getBoolean\(audioEnabledKey\)/);
  assert.match(settingsStore, /return storedValue \?\? true;/);
  assert.match(settingsRoute, /accessibilityRole="switch"/);
  assert.match(settingsRoute, /accessibilityState=\{\{ checked: audioEnabled \}\}/);
  assert.match(settingsRoute, /setAudioEnabled\(!audioEnabled\)/);
  assert.match(settingsRoute, /Audio enabled/);
  assert.match(settingsRoute, /Audio disabled/);
});
