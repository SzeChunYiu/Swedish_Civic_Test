const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc h3 subheadings use compact tactile boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC SUBHEADING BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__main h3\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.34\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.09\);[\s\S]*border-radius: 16px;[\s\S]*display: flex;[\s\S]*gap: 9px;[\s\S]*padding: 10px 12px;[\s\S]*width: fit-content;/,
  );
  assert.match(
    css,
    /\.doc__main h3::before\s*{[\s\S]*background: var\(--gold\);[\s\S]*border: 1px solid rgba\(217, 169, 0, 0\.34\);[\s\S]*border-radius: 999px;[\s\S]*box-shadow: 0 0 0 4px rgba\(254, 204, 0, 0\.14\);[\s\S]*height: 8px;[\s\S]*width: 8px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__main h3\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);[\s\S]*border-color: rgba\(255, 255, 255, 0\.08\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__main h3\s*{[\s\S]*border-radius: 14px;[\s\S]*font-size: 17px;[\s\S]*padding: 9px 10px;/,
  );
});
