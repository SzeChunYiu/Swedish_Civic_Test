const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer column headings use compact tactile boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER COLUMN HEADING BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__cols h4\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.045\);[\s\S]*border: 1px solid rgba\(254, 204, 0, 0\.18\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*gap: 8px;[\s\S]*padding: 7px 10px 7px 8px;[\s\S]*width: fit-content;/,
  );
  assert.match(
    css,
    /\.footer__cols h4::before\s*{[\s\S]*background: var\(--gold\);[\s\S]*border-radius: 999px;[\s\S]*box-shadow: 0 0 0 3px rgba\(254, 204, 0, 0\.16\);[\s\S]*height: 7px;[\s\S]*width: 7px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__cols h4\s*{[\s\S]*margin-bottom: 12px;/,
  );
});
