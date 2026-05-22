const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc callouts use boxed text and label treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC CALLOUT TEXT BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.callout p\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border: 1px solid rgba\(217, 169, 0, 0\.2\);[\s\S]*border-radius: 16px;[\s\S]*display: grid;[\s\S]*gap: 8px;[\s\S]*margin: 0;[\s\S]*padding: 14px 15px;/,
  );
  assert.match(
    css,
    /\.callout b\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.2\);[\s\S]*border: 1px solid rgba\(217, 169, 0, 0\.28\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*font-family: var\(--mono\);[\s\S]*width: fit-content;/,
  );
  assert.match(css, /\.callout span\s*{[\s\S]*line-height: 1\.58;/);
  assert.match(
    css,
    /\.callout--blue b\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-color: rgba\(0, 106, 167, 0\.18\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.callout p\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);[\s\S]*border-color: rgba\(255, 255, 255, 0\.08\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.callout\s*{[\s\S]*padding: 14px 15px;[\s\S]*\.callout p\s*{[\s\S]*border-radius: 14px;[\s\S]*padding: 12px 13px;/,
  );
});
