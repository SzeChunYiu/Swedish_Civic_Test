const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('learning AudioButton keeps playback guards and accessibility copy in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/learning/AudioButton.tsx'),
    'utf8',
  );

  assert.equal(summary.audioButtonAccessibilityRulesValidated, 13);
  assert.equal(summary.audioButtonAccessibilityParityValidated, true);
  assert.match(source, /import type \{ AppLanguage \}/);
  assert.match(source, /const audioButtonCopy: Record<AppLanguage, AudioButtonCopy>/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /const speechText = text\.trim\(\);/);
  assert.match(source, /const hasSpeechText = speechText\.length > 0;/);
  assert.match(source, /const canPlayAudio = enabled && hasSpeechText;/);
  assert.match(source, /Lyssna på den svenska frågan och svaren/);
  assert.match(source, /unavailableLabel: 'Audio is unavailable for this question'/);
  assert.match(
    source,
    /const label = !enabled[\s\S]*\? copy\.disabledLabel[\s\S]*\? copy\.enabledLabel[\s\S]*: copy\.unavailableLabel;/,
  );
  assert.match(source, /const accessibilityLabel = label;/);
  assert.match(source, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ disabled: !canPlayAudio \}\}/);
  assert.match(source, /disabled=\{!canPlayAudio\}/);
  assert.match(source, /if \(!canPlayAudio\) return;/);
  assert.match(source, /stopSpeech\(\);/);
  assert.match(source, /speakSwedish\(speechText\);/);
});

test('AudioButton accessibility parity rejects untrimmed playback drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/AudioButton.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('speakSwedish(speechText);', 'speakSwedish(text);');
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
    /AudioButton missing trimmed speech playback for accessibility parity/,
  );
});
