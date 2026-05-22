const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static source and provenance metadata use tactile receipt boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /SOURCE \+ PROVENANCE BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.qcard__meta,[\s\S]*\.quiz__source-row,[\s\S]*\.ebook__provenance-badge,[\s\S]*\.ebook__footnotes\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.5\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.12\);[\s\S]*box-shadow:/,
  );
  assert.match(
    css,
    /\.qcard__meta::before,[\s\S]*\.quiz__source-row::before,[\s\S]*\.ebook__provenance-badge::before,[\s\S]*\.ebook__footnotes::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 4px;/,
  );
  assert.match(
    css,
    /\.qcard__meta\s*{[\s\S]*margin-top: 20px;[\s\S]*padding: 10px 12px 10px 16px;/,
  );
  assert.match(
    css,
    /\.quiz__source-row\s*{[\s\S]*align-items: center;[\s\S]*padding: 11px 12px 11px 16px;/,
  );
  assert.match(
    css,
    /\.quiz__provenance\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.68\);[\s\S]*min-height: 28px;[\s\S]*padding: 5px 10px;/,
  );
  assert.match(
    css,
    /\.quiz__provenance--uhr\s*{[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.15\)/,
  );
  assert.match(
    css,
    /\.ebook__provenance-badge,[\s\S]*\.ebook__footnotes\s*{[\s\S]*border-radius: 16px !important;[\s\S]*padding-left: 18px !important;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.qcard__meta,[\s\S]*\.quiz__source-row\s*{[\s\S]*flex-direction: column;/,
  );
});
