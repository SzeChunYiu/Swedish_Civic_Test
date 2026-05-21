const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-audio-button-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
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

  assert.equal(summary.audioButtonAccessibilityRulesValidated, 17);
  assert.equal(summary.audioButtonAccessibilityParityValidated, true);
  assert.match(source, /import \{ useEffect, useState \} from 'react';/);
  assert.match(source, /import type \{ AppLanguage \}/);
  assert.match(source, /const audioButtonCopy: Record<AppLanguage, AudioButtonCopy>/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /const \[isSpeaking, setIsSpeaking\] = useState\(false\);/);
  assert.match(source, /const speechText = text\.trim\(\);/);
  assert.match(source, /const hasSpeechText = speechText\.length > 0;/);
  assert.match(source, /const canPlayAudio = enabled && hasSpeechText;/);
  assert.match(source, /Lyssna på den svenska frågan och svaren/);
  assert.match(source, /Stoppa frågeljud/);
  assert.match(source, /Stop question audio/);
  assert.match(source, /unavailableLabel: 'Audio is unavailable for this question'/);
  assert.match(
    source,
    /const label = !enabled[\s\S]*\? copy\.disabledLabel[\s\S]*\? copy\.unavailableLabel[\s\S]*\? copy\.stopLabel[\s\S]*: copy\.enabledLabel;/,
  );
  assert.match(source, /const accessibilityLabel = label;/);
  assert.match(source, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ busy: isSpeaking, disabled: !canPlayAudio \}\}/);
  assert.match(source, /disabled=\{!canPlayAudio\}/);
  assert.match(source, /if \(!canPlayAudio\) return;/);
  assert.match(source, /if \(isSpeaking\)[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/);
  assert.match(source, /stopSpeech\(\);/);
  assert.match(source, /setIsSpeaking\(true\);/);
  assert.match(source, /speakSwedish\(speechText, \{[\s\S]*onDone:[\s\S]*onStopped:/);
  assert.match(
    source,
    /useEffect\(\(\) => \{[\s\S]*setIsSpeaking\(false\);[\s\S]*return \(\) => \{[\s\S]*stopSpeech\(\);[\s\S]*\};[\s\S]*\}, \[speechText\]\);/,
  );
});

test('learning FeedbackAudioButton exposes localized play and stop states', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/learning/FeedbackAudioButton.tsx'),
    'utf8',
  );
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const quizSource = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.match(source, /const feedbackAudioCopy: Record<AppLanguage, FeedbackAudioCopy>/);
  assert.match(source, /playLabel: 'Lyssna på återkopplingen'/);
  assert.match(source, /stopLabel: 'Stoppa återkoppling'/);
  assert.match(source, /playLabel: 'Listen to feedback'/);
  assert.match(source, /stopLabel: 'Stop feedback'/);
  assert.match(source, /const speechText = text\.trim\(\);/);
  assert.match(source, /const hasSpeechText = speechText\.length > 0;/);
  assert.match(source, /const canPlayAudio = enabled && hasSpeechText;/);
  assert.match(source, /accessibilityState=\{\{ busy: isSpeaking, disabled: !canPlayAudio \}\}/);
  assert.match(source, /if \(!canPlayAudio\) return;/);
  assert.match(source, /if \(isSpeaking\)[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/);
  assert.match(source, /speakSwedish\(speechText, \{[\s\S]*onDone:[\s\S]*onStopped:/);
  assert.match(
    practiceSource,
    /<FeedbackAudioButton[\s\S]*text=\{buildAnswerFeedbackSpeechText\(question, selectedOptionId\)\}[\s\S]*\/>/,
  );
  assert.match(
    quizSource,
    /<FeedbackAudioButton[\s\S]*text=\{buildAnswerFeedbackSpeechText\(question, selectedOptionId\)\}[\s\S]*\/>/,
  );
  assert.doesNotMatch(examSource, /FeedbackAudioButton|buildAnswerFeedbackSpeechText/);
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
      .replace('speakSwedish(speechText, {', 'speakSwedish(text, {');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-audio-button-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AudioButton missing trimmed speech playback with lifecycle cleanup for accessibility parity/,
  );
});

test('AudioButton accessibility parity rejects missing stop lifecycle', () => {
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
      .replace('if (isSpeaking) {\\n          stopSpeech();\\n          setIsSpeaking(false);\\n          return;\\n        }', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-audio-button-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AudioButton missing second press stops active question audio/,
  );
});

test('AudioButton accessibility parity rejects missing speech cleanup', () => {
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
      .replace('return () => {\\n      stopSpeech();\\n    };', 'return undefined;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-audio-button-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AudioButton missing speech cleanup on text change and unmount for accessibility parity/,
  );
});
