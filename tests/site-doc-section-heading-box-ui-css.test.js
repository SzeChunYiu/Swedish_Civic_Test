const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc section headings use tactile title boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC SECTION HEADING BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__main h2\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.36\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 18px;[\s\S]*display: flex;[\s\S]*padding: 12px 14px 12px 16px;/,
  );
  assert.match(
    css,
    /\.doc__main h2::after\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*border-radius: 999px;[\s\S]*height: 3px;[\s\S]*opacity: 0\.52;/,
  );
  assert.match(css, /\.doc__main > h2:first-child\s*{[\s\S]*padding-top: 12px;/);
  assert.match(
    css,
    /\.doc__main > h2:first-child\s*{[\s\S]*border-top: 1px solid rgba\(0, 106, 167, 0\.1\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__main h2\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__main h2\s*{[\s\S]*border-radius: 15px;[\s\S]*font-size: 24px;/,
  );
});
