const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer fika hint uses tactile keycap box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER FIKA KEYCAP BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__fikahint\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.04\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.08\);[\s\S]*border-radius: 16px;[\s\S]*display: flex;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /\.footer__fikahint kbd\s*{[\s\S]*border: 1px solid rgba\(254, 204, 0, 0\.28\);[\s\S]*border-radius: 9px;[\s\S]*box-shadow:[\s\S]*0 3px 0 rgba\(0, 0, 0, 0\.3\);[\s\S]*font-weight: 900;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.footer__fikahint\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__fikahint\s*{[\s\S]*flex-direction: column;/,
  );
});
