const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc list items use tactile marker boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC LIST ITEM MARKER BOX OPTIMIZATION ROUND/);
  assert.match(css, /\.doc__main ul\s*{[\s\S]*list-style: none;[\s\S]*padding: 14px 16px;/);
  assert.match(
    css,
    /\.doc__main li\s*{[\s\S]*margin: 0;[\s\S]*padding: 8px 0 8px 32px;[\s\S]*position: relative;/,
  );
  assert.match(
    css,
    /\.doc__main li::before\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.13\);[\s\S]*border-radius: 999px;[\s\S]*content: '•';[\s\S]*height: 20px;[\s\S]*width: 20px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__main li::before\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__main ul\s*{[\s\S]*padding: 12px 14px;[\s\S]*\.doc__main li::before\s*{[\s\S]*height: 18px;/,
  );
});
