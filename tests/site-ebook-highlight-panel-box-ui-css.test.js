const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook highlight panel uses a tactile local-notes box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK HIGHLIGHT PANEL BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__notes\s*{[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.055\), rgba\(254, 204, 0, 0\.06\)\)[\s\S]*border-radius: 22px;[\s\S]*padding: 16px;/,
  );
  assert.match(
    css,
    /\.ebook__notes::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 4px;/,
  );
  assert.match(
    css,
    /\.ebook__notes h2\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.56\);[\s\S]*border-radius: 16px;[\s\S]*margin: 0 0 12px;/,
  );
  assert.match(
    css,
    /\.ebook__notes h2::after\s*{[\s\S]*content: 'local';[\s\S]*border-radius: 999px;[\s\S]*font-family: var\(--mono\);/,
  );
  assert.match(css, /#eb-notes-list\s*{[\s\S]*position: relative;[\s\S]*z-index: 1;/);
  assert.match(
    css,
    /\.eb-notes-empty\s*{[\s\S]*border-style: dashed;[\s\S]*border-color: rgba\(0, 106, 167, 0\.16\) !important;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__notes h2::after\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__notes\s*{[\s\S]*border-radius: 18px;[\s\S]*padding: 14px;[\s\S]*\.ebook__notes h2\s*{[\s\S]*border-radius: 14px;/,
  );
});
