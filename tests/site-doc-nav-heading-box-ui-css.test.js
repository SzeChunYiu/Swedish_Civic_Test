const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc navigation headings use compact tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC NAV HEADING BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__nav h5\s*{[\s\S]*background:[\s\S]*rgba\(0, 106, 167, 0\.065\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.12\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*width: fit-content;/,
  );
  assert.match(
    css,
    /\.doc__nav h5::before\s*{[\s\S]*background: var\(--gold\);[\s\S]*border-radius: 999px;[\s\S]*height: 7px;[\s\S]*width: 7px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__nav h5\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__nav h5\s*{[\s\S]*margin-bottom: 12px;/,
  );
});
