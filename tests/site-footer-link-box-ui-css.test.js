const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer links use tactile hoverable boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER LINK BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__cols a\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.035\);[\s\S]*border: 1px solid transparent;[\s\S]*border-radius: 12px;[\s\S]*display: inline-flex;[\s\S]*gap: 7px;[\s\S]*min-height: 32px;[\s\S]*padding: 4px 8px 4px 7px;/,
  );
  assert.match(
    css,
    /\.footer__cols a::before\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.7\);[\s\S]*border-radius: 999px;[\s\S]*height: 5px;[\s\S]*opacity: 0\.72;[\s\S]*width: 5px;/,
  );
  assert.match(
    css,
    /\.footer__cols a:hover,[\s\S]*\.footer__cols a:focus-visible\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.1\);[\s\S]*border-color: rgba\(254, 204, 0, 0\.24\);[\s\S]*color: var\(--gold\);[\s\S]*transform: translateX\(2px\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__cols a\s*{[\s\S]*min-height: 44px;[\s\S]*width: 100%;/,
  );

  const mobileLinkRule = css.match(
    /@media \(max-width: 720px\)\s*{[\s\S]*?\.footer__cols a\s*{(?<rule>[\s\S]*?)}/,
  )?.groups?.rule;
  assert.ok(mobileLinkRule);
  assert.doesNotMatch(mobileLinkRule, /min-height: 3[0-9]px;/);
});
