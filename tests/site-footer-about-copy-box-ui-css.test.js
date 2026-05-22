const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer about copy uses a compact reading box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER ABOUT COPY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__cols > div:nth-child\(3\) p\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.035\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.075\);[\s\S]*border-radius: 16px;[\s\S]*max-width: 32ch;[\s\S]*padding: 13px 14px 13px 18px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__cols > div:nth-child\(3\) p\s*{[\s\S]*border-radius: 14px;[\s\S]*max-width: none;[\s\S]*padding: 12px 13px 12px 17px;/,
  );
});
