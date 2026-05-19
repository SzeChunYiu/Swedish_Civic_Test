const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readSourceAuthorityWiringSources() {
  return {
    helperSource: fs.readFileSync(
      path.join(repoRoot, 'scripts', 'sourceAuthorityStemPatterns.js'),
      'utf8',
    ),
    validateSource: fs.readFileSync(path.join(repoRoot, 'scripts', 'validate-content.js'), 'utf8'),
    csvGateSource: fs.readFileSync(
      path.join(repoRoot, 'tests', 'content-uhr-source-citation-stem.test.js'),
      'utf8',
    ),
  };
}

function assertSourceAuthorityStemHelperWiring(sources) {
  assert.match(
    sources.helperSource,
    /SOURCE_AUTHORITY_STEM_PATTERNS\s*=\s*Object\.freeze\(\[/,
    'shared source-authority pattern list',
  );
  assert.match(
    sources.helperSource,
    /SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES\s*=\s*Object\.freeze\(\[/,
    'direct source-authority pattern fixtures',
  );
  assert.match(
    sources.validateSource,
    /require\('\.\/sourceAuthorityStemPatterns'\)/,
    'validate-content helper import',
  );
  assert.match(
    sources.validateSource,
    /return findSourceAuthorityStemPattern\(text\);/,
    'validate-content helper call',
  );
  assert.match(
    sources.csvGateSource,
    /require\('\.\.\/scripts\/sourceAuthorityStemPatterns'\)/,
    'CSV guard helper import',
  );
  assert.match(
    sources.csvGateSource,
    /hasSourceAuthorityStemPattern\(v\)/,
    'CSV guard helper call',
  );
  assert.match(
    sources.csvGateSource,
    /SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES\.length,\s*SOURCE_AUTHORITY_STEM_PATTERNS\.length/s,
    'CSV fixture count mirrors shared pattern count',
  );
  assert.doesNotMatch(
    sources.validateSource,
    /QUESTION_STEM_SOURCE_AUTHORITY_PATTERNS\s*=/,
    'validate-content should not keep a local source-authority list',
  );
  assert.doesNotMatch(
    sources.csvGateSource,
    /\bBANNED\s*=\s*\[/,
    'CSV guard should not keep a local source-authority list',
  );
}

test('source-authority stem checks use the shared pattern helper', () => {
  assertSourceAuthorityStemHelperWiring(readSourceAuthorityWiringSources());
});

test('source-authority stem helper wiring rejects bypassed helper calls', () => {
  const sources = readSourceAuthorityWiringSources();

  assert.throws(
    () =>
      assertSourceAuthorityStemHelperWiring({
        ...sources,
        validateSource: sources.validateSource.replace(
          'return findSourceAuthorityStemPattern(text);',
          'return undefined;',
        ),
      }),
    /validate-content helper call/,
  );
  assert.throws(
    () =>
      assertSourceAuthorityStemHelperWiring({
        ...sources,
        csvGateSource: sources.csvGateSource.replace('hasSourceAuthorityStemPattern(v)', 'false'),
      }),
    /CSV guard helper call/,
  );
});

test('test:content script includes every content test file exactly once', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const testContentScript = packageJson.scripts?.['test:content'];

  assert.equal(typeof testContentScript, 'string');

  const contentTestFiles = fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .map((fileName) => `tests/${fileName}`)
    .sort();
  const wiredContentTests = testContentScript
    .split(/\s+/)
    .filter((token) => token.startsWith('tests/content-') && token.endsWith('.test.js'));

  const missingTests = contentTestFiles.filter((fileName) => !wiredContentTests.includes(fileName));
  const unknownTests = wiredContentTests.filter((fileName) => !contentTestFiles.includes(fileName));
  const duplicateTests = wiredContentTests.filter(
    (fileName, index) => wiredContentTests.indexOf(fileName) !== index,
  );

  assert.deepEqual(missingTests, [], `test:content missing tests: ${missingTests.join(', ')}`);
  assert.deepEqual(
    unknownTests,
    [],
    `test:content references unknown tests: ${unknownTests.join(', ')}`,
  );
  assert.deepEqual(
    duplicateTests,
    [],
    `test:content duplicates tests: ${duplicateTests.join(', ')}`,
  );
});

test('generated-id fixture guard scans content test globs', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/content-published-question-types.test.js'),
    'utf8',
  );

  assert.match(source, /function contentMutationFixtureFiles\(\)/);
  assert.match(source, /readdirSync\(path\.join\(repoRoot, 'tests'\)\)/);
  assert.match(source, /\^content-\.\*\\\.test\\\.js\$/);
  assert.match(source, /readdirSync\(path\.join\(repoRoot, 'scripts'\)\)/);
  assert.match(source, /\^.\*content.\*\\\.test\\\.js\$/);
  assert.doesNotMatch(source, /const scannedFiles = \[\s*['"`]tests\/content-published/);
  assert.match(source, /generated id fixture guard rejects raw generated ids/);
  assert.match(source, /generated id fixture guard allows source ids and helper-derived ids/);
});
