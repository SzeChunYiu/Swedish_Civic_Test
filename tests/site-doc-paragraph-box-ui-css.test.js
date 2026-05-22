const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc standalone paragraphs use tactile reading boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC STANDALONE PARAGRAPH BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__main > p\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.34\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 16px;[\s\S]*padding: 13px 15px;/,
  );
  assert.match(css, /\.doc__main > p \+ p\s*{[\s\S]*margin-top: 10px;/);
  assert.match(css, /\.doc__main > p a\s*{[\s\S]*margin-inline: 2px;/);
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__main > p\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__main > p\s*{[\s\S]*border-radius: 14px;[\s\S]*font-size: 15\.5px;/,
  );
});
