const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const COLOR_LITERAL = /#[0-9a-fA-F]{6}|rgba?\(/;
const SPACING_LITERAL = /\b(?:padding(?:Horizontal|Vertical)?|marginTop|gap|borderRadius):\s*\d/;
const TYPOGRAPHY_LITERAL =
  /\b(?:fontSize|lineHeight|letterSpacing):\s*-?\d|\bfontWeight:\s*['\"]\d/;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.tsx?$/.test(entry.name)) return [fullPath];
    return [];
  });
}

test('app and component styles use theme tokens instead of literal colors, spacing, or typography', () => {
  const offenders = [];

  for (const sourceDir of SOURCE_DIRS) {
    for (const filePath of walk(path.join(ROOT, sourceDir))) {
      const relPath = path.relative(ROOT, filePath);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (
          COLOR_LITERAL.test(line) ||
          SPACING_LITERAL.test(line) ||
          TYPOGRAPHY_LITERAL.test(line)
        ) {
          offenders.push(`${relPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }

  assert.deepEqual(offenders, []);
});
