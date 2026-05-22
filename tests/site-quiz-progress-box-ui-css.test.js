const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static quiz progress and action tray use tactile boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /QUIZ PROGRESS BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.quiz__progress\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.46\);[\s\S]*border-radius: 999px;[\s\S]*flex-wrap: wrap;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /\.quiz__dot\s*{[\s\S]*background: rgba\(11, 31, 51, 0\.14\);[\s\S]*flex: 1 1 12px;[\s\S]*height: 9px;[\s\S]*min-width: 12px;/,
  );
  assert.match(
    css,
    /button\.quiz__dot\.is-nav:hover\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.26\);[\s\S]*transform: translateY\(-1px\) scaleY\(1\.25\);/,
  );
  assert.match(
    css,
    /\.quiz__dot\.is-on\s*{[\s\S]*background: var\(--blue\);[\s\S]*box-shadow:[\s\S]*rgba\(0, 106, 167, 0\.12\)/,
  );
  assert.match(css, /\.quiz__dot\.is-right\s*{[\s\S]*background: #1e874b;/);
  assert.match(css, /\.quiz__dot\.is-wrong\s*{[\s\S]*background: #c2410c;/);
  assert.match(
    css,
    /\.quiz__actions\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 18px;[\s\S]*padding: 12px;/,
  );
  assert.match(
    css,
    /\.quiz__counter\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.07\);[\s\S]*border-radius: 999px;[\s\S]*padding: 7px 10px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.quiz__progress\s*{[\s\S]*border-radius: 18px;[\s\S]*max-width: 34px;[\s\S]*\.quiz__actions\s*{[\s\S]*flex-direction: column-reverse;/,
  );
});
