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

function countMatches(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

function assertPracticeAudioAutoplaySingleton(source) {
  assert.equal(
    countMatches(source, /const hasSelectedAnswer =/g),
    1,
    'Practice must declare hasSelectedAnswer exactly once',
  );
  assert.equal(
    countMatches(source, /const questionSpeechText = useMemo\(/g),
    1,
    'Practice must declare questionSpeechText exactly once',
  );
  assert.equal(
    countMatches(source, /\buseQuestionAudioAutoplay\(\{/g),
    1,
    'Practice must call useQuestionAudioAutoplay exactly once',
  );
  assert.match(
    source,
    /questionKey:\s*question\s*\?\s*`practice:\$\{question\.id\}:\$\{shuffleSessionId\}`\s*:\s*null/,
    'Practice autoplay key must include question id and shuffle session id',
  );
  assert.doesNotMatch(
    source,
    /questionKey:\s*question\s*\?\s*`practice:\$\{question\.id\}`\s*:\s*null/,
    'Practice autoplay key must not fall back to the question id alone',
  );
}

test('learning AudioButton keeps playback guards and accessibility copy in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/learning/AudioButton.tsx'),
    'utf8',
  );

  assert.equal(summary.audioButtonAccessibilityRulesValidated, 29);
  assert.equal(summary.audioButtonAccessibilityParityValidated, true);
  assert.match(source, /import \{ useEffect, useRef, useState \} from 'react';/);
  assert.match(source, /import type \{ AppLanguage \}/);
  assert.match(source, /const audioButtonCopy: Record<AppLanguage, AudioButtonCopy>/);
  assert.match(source, /language = 'sv'/);
  assert.match(source, /rate,/);
  assert.match(source, /rate\?: number;/);
  assert.match(source, /const \[isSpeaking, setIsSpeaking\] = useState\(false\);/);
  assert.match(source, /const playbackRunRef = useRef\(0\);/);
  assert.match(source, /const previousSpeechTextRef = useRef<string \| null>\(null\);/);
  assert.match(
    source,
    /const clearSpeakingForRun = \(runId: number\) => \{[\s\S]*playbackRunRef\.current === runId[\s\S]*setIsSpeaking\(false\);/,
  );
  assert.match(source, /const speechText = typeof text === 'string' \? text\.trim\(\) : '';/);
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
  assert.match(
    source,
    /if \(isSpeaking\)[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
  );
  assert.match(
    source,
    /const runId = playbackRunRef\.current \+ 1;[\s\S]*playbackRunRef\.current = runId;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(true\);/,
  );
  assert.match(
    source,
    /speakSwedish\(speechText, \{[\s\S]*rate,[\s\S]*onDone: \(\) => clearSpeakingForRun\(runId\),[\s\S]*onError: \(\) => clearSpeakingForRun\(runId\),[\s\S]*onStopped: \(\) => clearSpeakingForRun\(runId\),/,
  );
  assert.match(
    source,
    /previousSpeechTextRef\.current === null[\s\S]*previousSpeechTextRef\.current = speechText;[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
  );
  assert.match(
    source,
    /return \(\) => \{[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*\};[\s\S]*\}, \[\]\);/,
  );
  assert.match(
    source,
    /if \(!canPlayAudio && isSpeaking\) \{[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
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
  assert.match(source, /import \{ useEffect, useRef, useState \} from 'react';/);
  assert.match(source, /playLabel: 'Lyssna på återkopplingen'/);
  assert.match(source, /stopLabel: 'Stoppa återkoppling'/);
  assert.match(source, /playLabel: 'Listen to feedback'/);
  assert.match(source, /stopLabel: 'Stop feedback'/);
  assert.match(source, /const playbackRunRef = useRef\(0\);/);
  assert.match(source, /const previousSpeechTextRef = useRef<string \| null>\(null\);/);
  assert.match(
    source,
    /const clearSpeakingForRun = \(runId: number\) => \{[\s\S]*playbackRunRef\.current === runId[\s\S]*setIsSpeaking\(false\);/,
  );
  assert.match(source, /const speechText = typeof text === 'string' \? text\.trim\(\) : '';/);
  assert.match(source, /const hasSpeechText = speechText\.length > 0;/);
  assert.match(source, /const canPlayAudio = enabled && hasSpeechText;/);
  assert.match(source, /accessibilityState=\{\{ busy: isSpeaking, disabled: !canPlayAudio \}\}/);
  assert.match(source, /if \(!canPlayAudio\) return;/);
  assert.match(
    source,
    /if \(isSpeaking\)[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
  );
  assert.match(
    source,
    /const runId = playbackRunRef\.current \+ 1;[\s\S]*playbackRunRef\.current = runId;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(true\);/,
  );
  assert.match(
    source,
    /speakSwedish\(speechText, \{[\s\S]*onDone: \(\) => clearSpeakingForRun\(runId\),[\s\S]*onError: \(\) => clearSpeakingForRun\(runId\),[\s\S]*onStopped: \(\) => clearSpeakingForRun\(runId\),/,
  );
  assert.match(
    source,
    /if \(!canPlayAudio && isSpeaking\) \{[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
  );
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

test('listen-first question audio is opt-in, rate-aware, and excluded from timed exams', () => {
  const hookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/audio/questionAudioAutoplay.ts'),
    'utf8',
  );
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const quizSource = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.match(hookSource, /export function shouldAutoplayQuestionAudio/);
  assert.match(hookSource, /audioEnabled[\s\S]*listenFirstAudioEnabled[\s\S]*!stopSignal/);
  assert.match(hookSource, /normalizeAutoplaySpeechText\(speechText\)\.length > 0/);
  assert.match(hookSource, /const lastPlayedQuestionKeyRef = useRef<string \| null>\(null\);/);
  assert.match(
    hookSource,
    /if \(lastPlayedQuestionKeyRef\.current === questionKey\) return undefined;/,
  );
  assert.match(
    hookSource,
    /stopSpeech\(\);[\s\S]*speakSwedish\(normalizedSpeechText, \{ rate \}\);/,
  );
  assert.match(hookSource, /return \(\) => \{[\s\S]*stopSpeech\(\);[\s\S]*\};/);

  for (const routeSource of [practiceSource, quizSource]) {
    assert.match(routeSource, /useQuestionAudioAutoplay/);
    assert.match(
      routeSource,
      /const audioPlaybackRate = useAccessibilityStore\(\(state\) => state\.audioPlaybackRate\);/,
    );
    assert.match(routeSource, /\(state\) => state\.listenFirstAudioEnabled\)?[,)]/);
    assert.match(routeSource, /const questionSpeechText = useMemo\(/);
    assert.match(routeSource, /speechText: questionSpeechText/);
    assert.match(routeSource, /rate: audioPlaybackRate/);
    assert.match(routeSource, /stopSignal: hasSelectedAnswer/);
    assert.match(routeSource, /stopSpeech\(\);[\s\S]*recordAnswer/);
    assert.match(
      routeSource,
      /<AudioButton[\s\S]*rate=\{audioPlaybackRate\}[\s\S]*text=\{questionSpeechText\}/,
    );
    assert.match(routeSource, /<FeedbackAudioButton[\s\S]*rate=\{audioPlaybackRate\}/);
  }

  assertPracticeAudioAutoplaySingleton(practiceSource);
  assert.doesNotMatch(examSource, /useQuestionAudioAutoplay|listenFirstAudioEnabled|AudioButton/);
});

test('Practice audio autoplay source guard rejects duplicate or weak-key drift', () => {
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const duplicatedAutoplaySource = `${practiceSource}
const hasSelectedAnswer = false;
const questionSpeechText = useMemo(() => '', []);
useQuestionAudioAutoplay({
  audioEnabled,
  listenFirstAudioEnabled,
  questionKey: question ? \`practice:\${question.id}\` : null,
  rate: audioPlaybackRate,
  speechText: questionSpeechText,
  stopSignal: hasSelectedAnswer,
});
`;

  assert.throws(
    () => assertPracticeAudioAutoplaySingleton(duplicatedAutoplaySource),
    /Practice must declare hasSelectedAnswer exactly once/,
  );
  assert.throws(
    () =>
      assertPracticeAudioAutoplaySingleton(
        practiceSource.replace(
          '`practice:${question.id}:${shuffleSessionId}`',
          '`practice:${question.id}`',
        ),
      ),
    /Practice autoplay key must include question id and shuffle session id/,
  );
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
      .replace('if (isSpeaking) {\\n          playbackRunRef.current += 1;\\n          stopSpeech();\\n          setIsSpeaking(false);\\n          return;\\n        }', '');
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
      .replace('return () => {\\n      playbackRunRef.current += 1;\\n      stopSpeech();\\n    };', 'return undefined;');
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
    /AudioButton missing unmount cleanup invalidates playback run before stopping speech/,
  );
});

test('AudioButton accessibility parity rejects stale lifecycle callbacks', () => {
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
      .replace('onDone: () => clearSpeakingForRun(runId),', 'onDone: () => setIsSpeaking(false),');
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
    /AudioButton missing done callback clears only the current playback run/,
  );
});

test('FeedbackAudioButton accessibility parity rejects stale lifecycle callbacks', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/FeedbackAudioButton.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('onStopped: () => clearSpeakingForRun(runId),', 'onStopped: () => setIsSpeaking(false),');
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
    /FeedbackAudioButton missing feedback stop and error callbacks clear only the current playback run/,
  );
});
