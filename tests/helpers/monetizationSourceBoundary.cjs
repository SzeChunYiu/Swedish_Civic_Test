const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const canonicalTimestampHelperExportPattern =
  /export\s+(?:function|const|let|var)\s+isCanonicalUtcIsoTimestamp\b|export\s*\{[^}]*\bisCanonicalUtcIsoTimestamp\b[^}]*\}/;
const sharedCanonicalTimestampImportPattern =
  /import\s*\{\s*isCanonicalUtcIsoTimestamp\s*\}\s*from\s*['"]\.\.\/time\/canonicalTimestamp['"]/;
const purchasesCanonicalTimestampImportPattern =
  /import\s*\{[^}]*\bisCanonicalUtcIsoTimestamp\b[^}]*\}\s*from\s*['"](?:\.\/|\.\.\/)*purchases['"]/;

function readSource(repoRoot, relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function walkSourceFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkSourceFiles(entryPath);
    if (/\.[jt]sx?$/.test(entry.name)) return [entryPath];
    return [];
  });
}

function relativeUnixPath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function findCanonicalTimestampBoundaryOffenders(repoRoot) {
  const offenders = [];
  const purchasesSource = readSource(repoRoot, 'lib/monetization/purchases.ts');

  if (canonicalTimestampHelperExportPattern.test(purchasesSource)) {
    offenders.push(
      'lib/monetization/purchases.ts exports or re-exports isCanonicalUtcIsoTimestamp',
    );
  }

  for (const filePath of walkSourceFiles(path.join(repoRoot, 'lib/monetization'))) {
    const relativePath = relativeUnixPath(repoRoot, filePath);
    if (relativePath === 'lib/monetization/purchases.ts') continue;
    const source = fs.readFileSync(filePath, 'utf8');
    if (purchasesCanonicalTimestampImportPattern.test(source)) {
      offenders.push(`${relativePath} imports isCanonicalUtcIsoTimestamp through purchases.ts`);
    }
  }

  return offenders;
}

function assertCanonicalTimestampSourceBoundary(repoRoot, { sharedImportFiles = [] } = {}) {
  const offenders = findCanonicalTimestampBoundaryOffenders(repoRoot);
  assert.deepEqual(offenders, []);

  for (const relativePath of sharedImportFiles) {
    assert.match(readSource(repoRoot, relativePath), sharedCanonicalTimestampImportPattern);
  }
}

module.exports = {
  assertCanonicalTimestampSourceBoundary,
  canonicalTimestampHelperExportPattern,
  findCanonicalTimestampBoundaryOffenders,
  purchasesCanonicalTimestampImportPattern,
  sharedCanonicalTimestampImportPattern,
};
