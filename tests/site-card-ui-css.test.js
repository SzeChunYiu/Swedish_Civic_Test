const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site card surfaces use the tactile UI treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /--card-surface:/, 'card surface token is present');
  assert.match(
    css,
    /--card-rail:\s*linear-gradient\(180deg,\s*var\(--flag-blue\),\s*var\(--flag-gold\)\)/,
  );
  assert.match(
    css,
    /\.qcard,\s*\n\.hub__stats > div,\s*\n\.hub__card,\s*\n\.mock-card,\s*\n\.purchase__card\s*{[\s\S]*box-shadow: var\(--card-shadow\)/,
  );
  assert.match(css, /\.purchase__card:hover\s*{[\s\S]*transform: translateY\(-3px\)/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.purchase__card:hover,[\s\S]*transform: none/,
  );
});
