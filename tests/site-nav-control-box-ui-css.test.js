const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site topbar navigation controls use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /NAV CONTROL BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.nav\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.44\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 999px;[\s\S]*padding: 4px;/,
  );
  assert.match(
    css,
    /\.topbar__tools\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 999px;[\s\S]*padding: 4px;/,
  );
  assert.match(
    css,
    /\.icon-btn,[\s\S]*\.signin-trigger\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.52\);[\s\S]*box-shadow: 0 10px 24px -20px rgba\(0, 58, 92, 0\.56\);/,
  );
  assert.match(
    css,
    /\.lang-menu\s*{[\s\S]*var\(--card-surface\);[\s\S]*border-color: var\(--card-border\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.nav\s*{[\s\S]*var\(--card-surface\);[\s\S]*border-radius: 24px;[\s\S]*padding: 14px;/,
  );
  assert.match(css, /\.nav::before\s*{[\s\S]*background: var\(--card-rail\);/);
});
