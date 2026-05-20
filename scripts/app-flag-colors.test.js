const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const sourceRoots = ['app', 'components'];

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function walk(relativePath) {
  return fs
    .readdirSync(path.join(repoRoot, relativePath), { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(relativePath, entry.name);
      if (entry.isDirectory()) return walk(entryPath);
      if (/\.tsx?$/.test(entry.name)) return [entryPath];
      return [];
    });
}

test('app flag constants expose fixed Swedish flag colors outside the mutable palette', () => {
  const flagSource = readText('lib/theme/flag.ts');
  const themeIndex = readText('lib/theme/index.ts');

  assert.match(flagSource, /export const SWEDISH_FLAG_BLUE = '#006aa7' satisfies ColorToken;/);
  assert.match(flagSource, /export const SWEDISH_FLAG_GOLD = '#fecc00' satisfies ColorToken;/);
  assert.match(flagSource, /export const flagColors = \{/);
  assert.match(
    themeIndex,
    /export \{ flagColors, SWEDISH_FLAG_BLUE, SWEDISH_FLAG_GOLD \} from '\.\/flag';/,
  );
});

test('app and components do not draw flag surfaces from mutable swedish color tokens', () => {
  const offenders = [];

  for (const sourceRoot of sourceRoots) {
    for (const relativePath of walk(sourceRoot)) {
      readText(relativePath)
        .split('\n')
        .forEach((line, index) => {
          if (/colors\.swedish(?:Blue|Gold)\b/.test(line)) {
            offenders.push(`${relativePath}:${index + 1}: ${line.trim()}`);
          }
        });
    }
  }

  const flagBand = readText('components/ui/SwedishFlagBand.tsx');

  assert.deepEqual(offenders, []);
  assert.match(flagBand, /import \{ flagColors, radius \} from '..\/..\/lib\/theme';/);
  assert.match(flagBand, /backgroundColor:\s*flagColors\.blue/);
  assert.match(flagBand, /backgroundColor:\s*flagColors\.gold/);
});
