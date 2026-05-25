const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer brand and tagline use tactile hero boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER BRAND AND TAGLINE BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__brand\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.09\);[\s\S]*border-radius: 999px;[\s\S]*min-height: 44px;[\s\S]*padding: 7px 12px 7px 9px;/,
  );
  assert.match(
    css,
    /\.footer__brand:hover,[\s\S]*\.footer__brand:focus-visible\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.1\);[\s\S]*border-color: rgba\(254, 204, 0, 0\.28\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /\.footer__tagline\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.035\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.08\);[\s\S]*border-radius: 28px;[\s\S]*max-width: min\(17ch, 100%\);[\s\S]*padding: 18px 22px 20px;/,
  );
  assert.match(
    css,
    /\.footer__tagline em\s*{[\s\S]*background: linear-gradient\(90deg, var\(--gold\), #ffe680\);[\s\S]*background-clip: text;[\s\S]*color: transparent;/,
  );
  const footerBrandSection = css.slice(
    css.indexOf('FOOTER BRAND AND TAGLINE BOX OPTIMIZATION ROUND'),
  );
  const mobileFooterBrandRule = footerBrandSection.match(
    /@media \(max-width: 720px\)\s*{[\s\S]*?\.footer__brand\s*{(?<rule>[\s\S]*?)}[\s\S]*?\.footer__tagline\s*{[\s\S]*?border-radius: 22px;[\s\S]*?font-size: clamp\(31px, 10vw, 42px\);/,
  );
  assert.ok(mobileFooterBrandRule?.groups?.rule, 'mobile footer brand rule should exist');
  assert.match(mobileFooterBrandRule.groups.rule, /min-height: 44px;/);
  assert.doesNotMatch(mobileFooterBrandRule.groups.rule, /min-height: 42px;/);
});
