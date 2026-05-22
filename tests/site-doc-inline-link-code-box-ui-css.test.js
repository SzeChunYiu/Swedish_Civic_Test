const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc inline links and code use compact tactile boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC INLINE LINK AND CODE BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__main a\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.07\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.13\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*text-decoration: none;/,
  );
  assert.match(
    css,
    /\.doc__main a:hover,[\s\S]*\.doc__main a:focus-visible\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.18\);[\s\S]*box-shadow: 0 10px 24px -20px rgba\(11, 31, 51, 0\.6\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /\.doc__main code\s*{[\s\S]*background:[\s\S]*rgba\(0, 106, 167, 0\.08\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.14\);[\s\S]*border-radius: 9px;[\s\S]*font-family: var\(--mono\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__main a\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 520px\)\s*{[\s\S]*\.doc__main a\s*{[\s\S]*border-radius: 12px;/,
  );
});
