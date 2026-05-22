const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc nav links use tactile hoverable boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC NAV LINK BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__nav a\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.28\);[\s\S]*border: 1px solid transparent;[\s\S]*border-radius: 12px;[\s\S]*display: inline-flex;[\s\S]*margin: -5px -7px;[\s\S]*min-height: 32px;[\s\S]*padding: 5px 7px;/,
  );
  assert.match(
    css,
    /\.doc__nav a:hover,[\s\S]*\.doc__nav a:focus-visible\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-color: rgba\(0, 106, 167, 0\.14\);[\s\S]*color: var\(--blue-ink\);[\s\S]*transform: translateX\(2px\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__nav a\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.035\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__nav a:hover,[\s\S]*:root\[data-theme='dark'\] \.doc__nav a:focus-visible\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*border-color: rgba\(45, 168, 255, 0\.22\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__nav a\s*{[\s\S]*min-height: 36px;[\s\S]*width: 100%;/,
  );
});
