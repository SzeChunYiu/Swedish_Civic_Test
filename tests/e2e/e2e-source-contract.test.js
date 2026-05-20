const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const e2eDir = __dirname;
const browserSpecPaths = fs
  .readdirSync(e2eDir)
  .filter((name) => name.endsWith('.spec.ts'))
  .map((name) => path.join(e2eDir, name))
  .sort();

function readRelative(relativePath) {
  return fs.readFileSync(path.join(e2eDir, relativePath), 'utf8');
}

function collectMatches({ pattern, source, filePath }) {
  return Array.from(source.matchAll(pattern), (match) => ({
    file: path.relative(process.cwd(), filePath),
    literal: match[0],
  }));
}

test('browser specs do not hardcode stale chapter count copy', () => {
  const staleCountPatterns = [
    /0\/50 besvarade/g,
    /0\/50 practiced/g,
    /Övningsfrågor \(50\)/g,
    /Practice questions \(50\)/g,
  ];

  const violations = [];
  for (const filePath of browserSpecPaths) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const pattern of staleCountPatterns) {
      violations.push(...collectMatches({ pattern, source, filePath }));
    }
  }

  assert.deepEqual(
    violations,
    [],
    'derive chapter progress and question totals from runtime question data instead of fixed 50-copy literals',
  );
});

test('browser specs do not assert obsolete dash-style answer feedback text', () => {
  const staleAnswerResultText =
    /[\wÅÄÖåäö][^'"`\n]*\s—\s(?:Correct answer|Correct|Wrong|Rätt svar|Fel)/g;

  const violations = [];
  for (const filePath of browserSpecPaths) {
    const source = fs.readFileSync(filePath, 'utf8');
    violations.push(...collectMatches({ pattern: staleAnswerResultText, source, filePath }));
  }

  assert.deepEqual(
    violations,
    [],
    'assert answer-result states through the current runtime accessibility/copy contract, e.g. "Answer text, Wrong"',
  );
});

test('learn chapter navigation derives the rendered chapter total from questions data', () => {
  const source = readRelative('learn-chapter-navigation.spec.ts');

  assert.match(
    source,
    /import\s+\{\s*questions\s*\}\s+from\s+['"]\.\.\/\.\.\/data\/questions['"]/,
    'learn chapter navigation spec should import the runtime question data',
  );
  assert.match(
    source,
    /questions\.filter\(\s*\(?question\)?\s*=>\s*question\.chapterId\s*===\s*['"]ch01['"]\s*\)\.length/,
    'learn chapter navigation spec should calculate the ch01 total from data/questions',
  );
});

test('practice feedback specs target answer option accessibility result labels', () => {
  const source = readRelative('practice-feedback.spec.ts');

  for (const label of [
    'In the Nordic region in northern Europe, Correct',
    'In southern Europe, Wrong',
    'In the Nordic region in northern Europe, Correct answer',
    'I södra Europa, Fel',
    'I Norden i norra Europa, Rätt svar',
  ]) {
    assert.ok(
      source.includes(`getByLabel('${label}')`),
      `practice feedback spec should assert the runtime accessibility label "${label}"`,
    );
  }
});
