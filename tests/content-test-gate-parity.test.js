const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function contentTestFiles() {
  return fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .map((fileName) => `tests/${fileName}`)
    .sort();
}

function propertyName(node) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return node.getText();
}

function isProcessExecPath(node) {
  return (
    node &&
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'execPath' &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'process'
  );
}

function isEvalFlagArray(node) {
  return (
    node &&
    ts.isArrayLiteralExpression(node) &&
    node.elements.length > 0 &&
    ts.isStringLiteral(node.elements[0]) &&
    node.elements[0].text === '-e'
  );
}

function hasRepoRootCwdOption(node) {
  return (
    node &&
    ts.isObjectLiteralExpression(node) &&
    node.properties.some(
      (property) =>
        ts.isPropertyAssignment(property) &&
        propertyName(property.name) === 'cwd' &&
        ts.isIdentifier(property.initializer) &&
        property.initializer.text === 'repoRoot',
    )
  );
}

test('test:content script includes every content test file exactly once', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const testContentScript = packageJson.scripts?.['test:content'];

  assert.equal(typeof testContentScript, 'string');

  const wiredContentTests = testContentScript
    .split(/\s+/)
    .filter((token) => token.startsWith('tests/content-') && token.endsWith('.test.js'));

  const expectedContentTests = contentTestFiles();
  const missingTests = expectedContentTests.filter(
    (fileName) => !wiredContentTests.includes(fileName),
  );
  const unknownTests = wiredContentTests.filter(
    (fileName) => !expectedContentTests.includes(fileName),
  );
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

test('content eval spawnSync calls run from repoRoot', () => {
  const violations = [];

  for (const relativePath of contentTestFiles()) {
    const absolutePath = path.join(repoRoot, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      absolutePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );

    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'spawnSync' &&
        isProcessExecPath(node.arguments[0]) &&
        isEvalFlagArray(node.arguments[1]) &&
        !hasRepoRootCwdOption(node.arguments[2])
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push(`${relativePath}:${line + 1}`);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  assert.deepEqual(
    violations,
    [],
    `spawnSync(process.execPath, ['-e', ...]) calls must pass { cwd: repoRoot }: ${violations.join(', ')}`,
  );
});
