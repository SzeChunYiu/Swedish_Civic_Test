const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer cards expose tactile focus-within boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER CARD FOCUS BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__cols > div:focus-within\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.06\);[\s\S]*border-color: rgba\(254, 204, 0, 0\.3\);[\s\S]*box-shadow:[\s\S]*0 0 0 3px rgba\(254, 204, 0, 0\.12\),[\s\S]*transform: translateY\(-2px\);/,
  );
  assert.match(
    css,
    /\.footer__cols > div:focus-within h4\s*{[\s\S]*border-color: rgba\(254, 204, 0, 0\.28\);[\s\S]*color: #ffe680;/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.footer__cols > div:focus-within\s*{[\s\S]*transform: none;/,
  );
});
