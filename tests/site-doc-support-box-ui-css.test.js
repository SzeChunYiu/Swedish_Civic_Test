const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static legal and support doc pages use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC \+ SUPPORT BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__meta\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.doc__nav,[\s\S]*\.doc__main\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.doc__nav::before,[\s\S]*\.doc__main::before\s*{[\s\S]*background: var\(--card-rail\);/,
  );
  assert.match(
    css,
    /\.doc__nav li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.44\);[\s\S]*border-radius: 14px;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /\.callout\s*{[\s\S]*var\(--card-surface\);[\s\S]*border-left: 7px solid var\(--gold\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(css, /\.callout--blue\s*{[\s\S]*border-left-color: var\(--blue\);/);
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__main\s*{[\s\S]*padding: 28px 20px 32px 24px;/,
  );
});
