const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('practice hub stats and chapter cards have polished card depth', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /PRACTICE HUB CARD DEPTH OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.hub__stats > div\s*{[\s\S]*isolation: isolate;[\s\S]*overflow: hidden;[\s\S]*position: relative;[\s\S]*transition:/,
  );
  assert.match(
    css,
    /\.hub__stats > div::before\s*{[\s\S]*background: linear-gradient\(90deg, var\(--flag-blue\), var\(--flag-gold\)\);[\s\S]*height: 4px;/,
  );
  assert.match(
    css,
    /\.hub__stats > div:hover,\s*\n\.hub__stats > div:focus-within\s*{[\s\S]*box-shadow: var\(--card-shadow-hover\);[\s\S]*transform: translateY\(-2px\);/,
  );
  assert.match(
    css,
    /\.hub__statvalue\s*{[\s\S]*font-variant-numeric: tabular-nums;[\s\S]*letter-spacing: -0\.035em;/,
  );
  assert.match(
    css,
    /\.hub__card:focus-visible\s*{[\s\S]*box-shadow:[\s\S]*var\(--card-shadow-hover\);[\s\S]*outline: none;/,
  );
  assert.match(
    css,
    /\.hub__bar i\s*{[\s\S]*background: linear-gradient\(90deg, var\(--flag-blue\), var\(--flag-gold\)\);/,
  );
  assert.match(
    css,
    /\.hub__quickbtn:hover,\s*\n\.hub__quickbtn:focus-visible\s*{[\s\S]*box-shadow: 0 16px 32px -20px rgba\(0, 58, 92, 0\.7\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(css, /:root\[data-theme='dark'\] \.hub__bar\s*{[\s\S]*rgba\(45, 168, 255, 0\.12\)/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.hub__quickbtn:focus-visible\s*{[\s\S]*transform: none;/,
  );
});
