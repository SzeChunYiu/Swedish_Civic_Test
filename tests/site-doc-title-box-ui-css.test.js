const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc hero titles use tactile title box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC HERO TITLE BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc h1\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.32\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 26px;[\s\S]*max-width: min\(18ch, 100%\);[\s\S]*padding: 18px 22px 20px 26px;/,
  );
  assert.match(
    css,
    /\.doc h1 em\s*{[\s\S]*background: linear-gradient\(90deg, var\(--blue\), #059bd3\);[\s\S]*background-clip: text;[\s\S]*color: transparent;[\s\S]*display: inline-block;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc h1\s*{[\s\S]*rgba\(45, 168, 255, 0\.24\) 0 6px[\s\S]*rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc h1\s*{[\s\S]*border-radius: 20px;[\s\S]*font-size: clamp\(32px, 10vw, 42px\);/,
  );
});
