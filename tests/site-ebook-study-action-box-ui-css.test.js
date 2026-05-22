const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook study actions use tactile progress and link boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK STUDY ACTION BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__study-actions\s*{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.07\), rgba\(254, 204, 0, 0\.08\)\)[\s\S]*border-radius: 22px;[\s\S]*box-shadow: var\(--card-shadow\)/,
  );
  assert.match(
    css,
    /\.ebook__study-actions::before\s*{[\s\S]*width: 4px;[\s\S]*height: calc\(100% - 20px\);[\s\S]*background: var\(--card-rail\);/,
  );
  assert.match(
    css,
    /\.ebook__study-actions p\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 16px;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /\.ebook__progress\s*{[\s\S]*display: inline-flex;[\s\S]*border-radius: 999px;[\s\S]*background: rgba\(0, 106, 167, 0\.08\);/,
  );
  assert.match(
    css,
    /\.ebook__study-links\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.38\);[\s\S]*border-radius: 18px;[\s\S]*padding: 8px;/,
  );
  assert.match(
    css,
    /\.ebook__study-links \.btn\s*{[\s\S]*min-height: 46px;[\s\S]*border-radius: 16px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__progress\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.14\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__study-actions\s*{[\s\S]*grid-template-columns: 1fr;[\s\S]*border-radius: 18px;[\s\S]*\.ebook__study-links \.btn\s*{[\s\S]*flex: 1 1 100%;[\s\S]*width: 100%;[\s\S]*box-sizing: border-box;/,
  );
});
