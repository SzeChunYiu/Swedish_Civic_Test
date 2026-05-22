const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook local browser note uses a tactile helper box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK LOCAL NOTE BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__local-note\s*{[\s\S]*overflow: hidden;[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.07\), rgba\(254, 204, 0, 0\.08\)\)[\s\S]*border-radius: 16px;[\s\S]*box-shadow:/,
  );
  assert.match(
    css,
    /\.ebook__local-note::before\s*{[\s\S]*width: 4px;[\s\S]*background: var\(--card-rail\);[\s\S]*opacity: 0\.82;/,
  );
  assert.match(
    css,
    /\.ebook__local-note::after\s*{[\s\S]*content: 'browser note';[\s\S]*border-radius: 999px;[\s\S]*font-family: var\(--mono\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__local-note\s*{[\s\S]*rgba\(45, 168, 255, 0\.12\)[\s\S]*border-color: rgba\(255, 255, 255, 0\.08\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__local-note::after\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__local-note\s*{[\s\S]*margin: 0 0 14px;[\s\S]*border-radius: 14px;[\s\S]*\.ebook__local-note::before\s*{[\s\S]*width: 3px;/,
  );
});
