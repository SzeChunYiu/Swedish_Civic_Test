const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static chapter intro uses tactile guide box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /CHAPTER INTRO BOX OPTIMIZATION ROUND/);
  assert.match(css, /\.quiet \.wrap > \.eyebrow,[\s\S]*\.quiet \.deck\s*{[\s\S]*z-index: 1;/);
  assert.match(
    css,
    /\.quiet \.wrap--narrow::before\s*{[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.6\), rgba\(255, 248, 228, 0\.36\)\)[\s\S]*border-radius: 28px;[\s\S]*height: 268px;/,
  );
  assert.match(
    css,
    /\.quiet \.wrap--narrow::after\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*border-radius: 999px;[\s\S]*height: 70px;/,
  );
  assert.match(
    css,
    /\.quiet \.wrap > \.eyebrow\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 7px 12px;/,
  );
  assert.match(
    css,
    /\.quiet \.deck\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 18px;[\s\S]*margin-bottom: 44px;[\s\S]*padding: 14px 16px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.quiet \.wrap--narrow::before,[\s\S]*\.quiet \.wrap > \.eyebrow\s*{[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.quiet \.wrap--narrow::before\s*{[\s\S]*height: 314px;[\s\S]*\.quiet \.deck\s*{[\s\S]*border-radius: 16px;/,
  );
});
