const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc metadata uses nested tactile chip boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC META CHIP BOX OPTIMIZATION ROUND/);
  assert.match(css, /\.doc__meta\s*{[\s\S]*align-items: stretch;[\s\S]*flex-wrap: wrap;/);
  assert.match(
    css,
    /\.doc__meta > span\s*{[\s\S]*background:[\s\S]*rgba\(0, 106, 167, 0\.04\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 16px;[\s\S]*display: inline-flex;[\s\S]*min-height: 42px;/,
  );
  assert.match(
    css,
    /\.doc__meta > span > b\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*font-weight: 900;[\s\S]*text-transform: uppercase;/,
  );
  assert.match(
    css,
    /\.doc__meta > span > span\s*{[\s\S]*background: transparent;[\s\S]*border: 0;[\s\S]*font-weight: 850;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__meta > span > b\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 420px\)\s*{[\s\S]*\.doc__meta > span\s*{[\s\S]*flex-direction: column;/,
  );
});
