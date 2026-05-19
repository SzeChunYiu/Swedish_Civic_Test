const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('default mock exam config stays UHR-based and ad-free during exams', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
  const configSource = fs.readFileSync(path.join(repoRoot, 'data/mockExamConfig.ts'), 'utf8');

  assert.equal(summary.mockExamConfigTypeFieldsValidated, 5);
  assert.equal(summary.mockExamConfigTypeSchemaParityValidated, true);
  assert.equal(summary.mockExamConfigExactSchemaKeysValidated, true);
  assert.equal(summary.mockExamConfigValidated, true);
  assert.match(configSource, /export interface MockExamConfig/);
  assert.match(configSource, /sourceScope: 'uhr_based';/);
  assert.equal(config.sourceScope, 'uhr_based');
  assert.equal(config.showExplanationsDuringExam, false);
  assert.equal(config.adsAllowedDuringExam, false);
  assert.ok(Number.isInteger(config.questionCount));
  assert.ok(config.questionCount > 0);
  assert.ok(config.questionCount <= summary.publishedQuestions);
  assert.ok(Number.isInteger(config.durationMinutes));
  assert.ok(config.durationMinutes > 0);
});

test('mock exam config panel uses unofficial practice-result copy', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'components/MockExamConfigPanel.tsx'), 'utf8');
  const unsupportedFragments = [
    ['pass', 'ing', 'Percent'].join(''),
    ['pass', 'ing', 'Label'].join(''),
    ['Gräns för ', 'godkänt'].join(''),
    ['Pass', 'ing line'].join(''),
    '75' + '%',
  ];

  assert.match(source, /scoreModeLabel: 'Resultat är övning'/);
  assert.match(source, /scoreModeLabel: 'Practice result'/);
  assert.match(source, /sourceScopeLabel: 'UHR-baserade frågor'/);
  assert.match(source, /sourceScopeLabel: 'UHR-based questions'/);
  assert.match(source, /<PillBadge variant="accent">\{resolvedSourceScopeLabel\}<\/PillBadge>/);
  assert.match(source, /<PillBadge>\{resolvedScoreModeLabel\}<\/PillBadge>/);

  for (const fragment of unsupportedFragments) {
    assert.doesNotMatch(
      source,
      new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `MockExamConfigPanel should not expose unsupported score-source copy: ${fragment}`,
    );
  }
});

test('mock exam config TypeScript schema parity rejects optional field drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/mockExamConfig.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('durationMinutes: number;', 'durationMinutes?: number;');
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
    /MockExamConfig\.durationMinutes optional=true, expected false/,
  );
});

test('mock exam config exact schema rejects internal field leakage', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/mockExamConfig.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '  adsAllowedDuringExam: false,\\n};',
        "  adsAllowedDuringExam: false,\\n  debugNotes: 'internal QA field',\\n};",
      );
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
    /defaultMockExamConfig\.debugNotes is not part of MockExamConfig schema/,
  );
});
