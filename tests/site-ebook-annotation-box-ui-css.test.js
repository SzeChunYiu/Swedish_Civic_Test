const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

function assertTouchTargetRule(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(
    css,
    new RegExp(`${escapedSelector}\\s*{[\\s\\S]*min-height: 44px;[\\s\\S]*min-width: 44px;`),
    `${selector} should keep a 44px minimum target in both dimensions`,
  );
}

test('static ebook annotation popovers and note rows use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK ANNOTATION BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.eb-hl\s*{[\s\S]*background: linear-gradient[\s\S]*border-radius: 0\.28em;[\s\S]*box-decoration-break: clone;/,
  );
  assert.match(
    css,
    /\.eb-pop,[\s\S]*\.eb-note\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);[\s\S]*position: absolute;/,
  );
  assert.match(
    css,
    /\.eb-pop\[hidden\],[\s\S]*\.eb-note\[hidden\]\s*{[\s\S]*display: none !important;/,
  );
  assert.match(
    css,
    /\.eb-pop\s*{[\s\S]*border-radius: 999px;[\s\S]*display: flex;[\s\S]*max-width: min\(calc\(100vw - 24px\), 340px\);/,
  );
  assert.match(
    css,
    /\.eb-pop__btn\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.07\);[\s\S]*border-radius: 999px;[\s\S]*min-height: 44px;/,
  );
  assert.match(
    css,
    /\.eb-note\s*{[\s\S]*border-radius: 22px;[\s\S]*max-width: min\(calc\(100vw - 24px\), 360px\);[\s\S]*width: 340px;/,
  );
  assert.match(
    css,
    /\.eb-note__ta\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.62\);[\s\S]*border-radius: 16px;[\s\S]*min-height: 112px;/,
  );
  assert.match(css, /\.eb-note__close\s*{[\s\S]*height: 44px;[\s\S]*width: 44px;/);
  assertTouchTargetRule(css, '.eb-pop__btn');
  assertTouchTargetRule(css, '.eb-note__del');
  assertTouchTargetRule(css, '.eb-note__save');
  assertTouchTargetRule(css, '.eb-notes-item__actions button');
  assert.match(
    css,
    /\.eb-notes-empty,[\s\S]*\.eb-notes-item\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.46\);[\s\S]*border-radius: 16px;[\s\S]*padding: 14px 14px 14px 18px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.eb-pop\s*{[\s\S]*left: 12px !important;[\s\S]*\.eb-note\s*{[\s\S]*left: 12px !important;/,
  );
});
