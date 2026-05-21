const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site hero intro and CTA area use tactile action box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /HERO ACTION BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.hero__col\s*{[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(css, /\.hero__col::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(css, /\.hero__eyebrow\s*{[\s\S]*border-radius: 999px;[\s\S]*padding: 9px 13px;/);
  assert.match(
    css,
    /\.hero__ctas\s*{[\s\S]*border-radius: 22px;[\s\S]*display: inline-flex;[\s\S]*padding: 10px;/,
  );
  assert.match(css, /\.hero__ctas \.btn--ghost\s*{[\s\S]*border-color: rgba\(11, 31, 51, 0\.22\);/);
  assert.match(
    css,
    /@media \(max-width: 420px\)\s*{[\s\S]*\.hero__col\s*{[\s\S]*padding: 28px 18px 24px;/,
  );
});
