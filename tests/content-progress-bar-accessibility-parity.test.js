const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('shared ProgressBar keeps visual progress and accessibility values in parity', () => {
  const summary = parseValidationSummary();
  const foundationSource = fs.readFileSync(
    path.join(repoRoot, 'components/ProgressBar.tsx'),
    'utf8',
  );
  const adapterSource = fs.readFileSync(
    path.join(repoRoot, 'components/ui/ProgressBar.tsx'),
    'utf8',
  );

  assert.equal(
    summary.progressBarAccessibilityRulesValidated,
    summary.progressBarAccessibilityRulesExpected,
  );
  assert.equal(summary.progressBarAccessibilityParityValidated, true);
  assert.match(foundationSource, /type AppLanguage \} from '\.\.\/lib\/storage\/settingsStore';/);
  assert.match(foundationSource, /useReducedMotion/);
  assert.match(foundationSource, /const shouldAnimate = animated && !reducedMotionEnabled;/);
  assert.match(foundationSource, /aria-valuenow=\{progressPercent\}/);
  assert.match(foundationSource, /aria-valuetext=\{resolvedAccessibilityLabel\}/);
  assert.match(
    foundationSource,
    /const progressBarCopy: Record<AppLanguage, ProgressBarCopy> = \{/,
  );
  assert.match(foundationSource, /`\$\{progressPercent\} procent klart`/);
  assert.match(foundationSource, /`\$\{progressPercent\} percent complete`/);
  assert.match(
    foundationSource,
    /const clampedProgress = Math\.max\(0, Math\.min\(1, progress\)\);/,
  );
  assert.match(foundationSource, /const progressPercent = Math\.round\(clampedProgress \* 100\);/);
  assert.match(foundationSource, /const copy = progressBarCopy\[language\];/);
  assert.match(
    foundationSource,
    /const progressAccessibilityLabel = copy\.progressLabel\(progressPercent\);/,
  );
  assert.match(foundationSource, /accessibilityRole=\{accessibilityRole\}/);
  assert.match(
    foundationSource,
    /accessibilityValue=\{\{[\s\S]*min:\s*0,[\s\S]*max:\s*100,[\s\S]*now:\s*progressPercent,[\s\S]*text:\s*resolvedAccessibilityLabel,[\s\S]*\.\.\.accessibilityValue,[\s\S]*\}\}/,
  );
  assert.match(foundationSource, /new Animated\.Value\(clampedProgress\)/);
  assert.match(
    foundationSource,
    /if \(!shouldAnimate\) \{\s*animatedProgress\.setValue\(clampedProgress\);\s*return undefined;\s*\}/,
  );
  assert.match(adapterSource, /ProgressBar as RootProgressBar/);
  assert.match(adapterSource, /type ProgressBarProps as RootProgressBarProps/);
  assert.match(adapterSource, /language\?: AppLanguage/);
  assert.match(adapterSource, /languageOverride=\{language\}/);
  assert.doesNotMatch(adapterSource, /Animated\.timing|new Animated\.Value|Easing\./);
  assert.doesNotMatch(adapterSource, /ProgressBarCopy|progressBarCopy|progressAccessibilityLabel/);
  assert.doesNotMatch(adapterSource, /useReducedMotion/);
});

test('route and chapter progress bars receive the selected settings language', () => {
  const callSites = [
    ['app/(tabs)/home.tsx', /<ProgressBar language=\{language\} progress=\{progress\} \/>/],
    ['app/(tabs)/practice.tsx', /<ProgressBar language=\{language\} progress=\{bankProgress\} \/>/],
    [
      'app/(tabs)/exam.tsx',
      /<ProgressBar\s+language=\{language\}\s+progress=\{examQuestions\.length > 0 \? answeredCount \/ examQuestions\.length : 0\}\s+\/>/,
    ],
    [
      'app/quiz/[sessionId].tsx',
      /<ProgressBar language=\{language\} progress=\{hasSelectedAnswer \? 1 : 0\} \/>/,
    ],
    [
      'components/learning/ChapterCard.tsx',
      /<ProgressBar language=\{language\} progress=\{progress\} \/>/,
    ],
  ];

  for (const [relativePath, pattern] of callSites) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, pattern, `${relativePath} should pass language to ProgressBar`);
  }
});

test('ProgressBar accessibility parity rejects unclamped native value drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ProgressBar.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('now: progressPercent,', 'now: progress,');
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
    /ProgressBar missing native clamped accessibility value for accessibility parity/,
  );
});

test('ProgressBar accessibility parity rejects missing reduced-motion hook usage', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ProgressBar.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const reducedMotionEnabled = useReducedMotion();', 'const reducedMotionEnabled = false;');
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
    /ProgressBar missing reduced-motion hook for accessibility parity/,
  );
});

test('ProgressBar accessibility parity rejects duplicate adapter implementations', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/ProgressBar.tsx')) {
    return \`\${originalReadFileSync.call(this, filePath, ...args)}
const progressBarCopy = {};\`;
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
    /components\/ui\/ProgressBar\.tsx must stay a thin adapter without duplicate localized copy implementation/,
  );
});
