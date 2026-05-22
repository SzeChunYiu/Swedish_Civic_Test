const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer honest copy uses a tactile disclosure box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER HONEST COPY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__honest\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.04\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.08\);[\s\S]*border-radius: 18px;[\s\S]*max-width: min\(42ch, 100%\);[\s\S]*padding: 14px 16px 14px 20px;/,
  );
  assert.match(
    css,
    /\.footer__honest::first-letter\s*{[\s\S]*color: var\(--gold\);[\s\S]*font-family: var\(--display\);[\s\S]*font-weight: 900;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__honest\s*{[\s\S]*border-radius: 15px;[\s\S]*font-size: 13\.5px;[\s\S]*padding: 12px 13px 12px 17px;/,
  );
});
