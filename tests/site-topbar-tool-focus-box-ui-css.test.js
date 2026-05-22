const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static topbar tool buttons use tactile focus and expanded boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /TOPBAR TOOL BUTTON FOCUS BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.topbar__tools \.icon-btn:focus-visible,[\s\S]*\.topbar__tools \.signin-trigger:focus-visible\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.78\);[\s\S]*border-color: rgba\(0, 106, 167, 0\.22\);[\s\S]*0 0 0 3px rgba\(0, 106, 167, 0\.12\),[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /\.topbar__tools \.icon-btn\[aria-expanded='true'\],[\s\S]*\.topbar__tools \.signin-trigger\[aria-expanded='true'\]\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.16\);[\s\S]*border-color: rgba\(217, 169, 0, 0\.32\);[\s\S]*color: var\(--blue-ink\);/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.topbar__tools \.icon-btn:focus-visible,[\s\S]*\.topbar__tools \.signin-trigger:focus-visible\s*{[\s\S]*transform: none;/,
  );
});
