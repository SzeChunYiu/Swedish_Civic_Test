const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static homepage demo explanation uses tactile receipt box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DEMO EXPLANATION BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.qcard__explain\s*{[\s\S]*linear-gradient\(135deg, rgba\(254, 204, 0, 0\.18\), rgba\(255, 255, 255, 0\.62\)\)[\s\S]*border-radius: 18px;[\s\S]*padding: 18px 18px 18px 22px;[\s\S]*overflow: hidden;/,
  );
  assert.match(
    css,
    /\.qcard__explain::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*border-radius: 999px;[\s\S]*width: 4px;/,
  );
  assert.match(
    css,
    /\.qcard__explain b\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 4px 9px;/,
  );
  assert.match(css, /\.qcard__explain p\s*{[\s\S]*max-width: 62ch;/);
  assert.match(
    css,
    /\.qcard\.is-answered \.qcard__explain\s*{[\s\S]*animation: demoExplainIn 0\.24s ease-out both;/,
  );
  assert.match(
    css,
    /@keyframes demoExplainIn\s*{[\s\S]*transform: translateY\(6px\);[\s\S]*transform: translateY\(0\);/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.qcard\.is-answered \.qcard__explain\s*{[\s\S]*animation: none;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.qcard__explain\s*{[\s\S]*border-radius: 16px;[\s\S]*font-size: 14px;[\s\S]*\.qcard__explain::before\s*{[\s\S]*width: 3px;/,
  );
});
