const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static FAQ intro uses tactile heading box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FAQ INTRO BOX OPTIMIZATION ROUND/);
  assert.match(css, /\.faq \.wrap > \.eyebrow,[\s\S]*\.faq \.headline\s*{[\s\S]*z-index: 1;/);
  assert.match(
    css,
    /\.faq \.wrap--narrow::before\s*{[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.62\), rgba\(255, 248, 228, 0\.38\)\)[\s\S]*border-radius: 28px;[\s\S]*height: 210px;/,
  );
  assert.match(
    css,
    /\.faq \.wrap--narrow::after\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*border-radius: 999px;[\s\S]*height: 62px;/,
  );
  assert.match(
    css,
    /\.faq \.wrap > \.eyebrow\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 7px 12px;/,
  );
  assert.match(css, /\.faq \.faq__list\s*{[\s\S]*margin-top: 52px;[\s\S]*z-index: 1;/);
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.faq \.wrap--narrow::before,[\s\S]*\.faq \.wrap > \.eyebrow\s*{[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.faq \.wrap--narrow::before\s*{[\s\S]*height: 236px;[\s\S]*\.faq \.faq__list\s*{[\s\S]*margin-top: 38px;/,
  );
});
