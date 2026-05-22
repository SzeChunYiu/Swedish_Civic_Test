const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');
const extrasPath = path.join(__dirname, '..', 'site', 'extras.js');

test('static cheatsheet easter egg uses tactile command card boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /CHEATSHEET BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.cheats__panel\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border-radius: 28px;[\s\S]*box-shadow: var\(--card-shadow-hover\);[\s\S]*max-height: calc\(100vh - 32px\);[\s\S]*overflow-y: auto;/,
  );
  assert.match(
    css,
    /\.cheats__panel::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 7px;/,
  );
  assert.match(css, /\.cheats__panel h3\s*{[\s\S]*display: flex;[\s\S]*gap: 10px;/);
  assert.match(
    css,
    /\.cheats__close\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.5\);[\s\S]*display: inline-grid;/,
  );
  assert.match(
    css,
    /\.cheats__panel li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.5\);[\s\S]*border-radius: 16px;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /\.cheats__panel kbd\s*{[\s\S]*linear-gradient\(180deg[\s\S]*border-radius: 10px;[\s\S]*min-width: 48px;/,
  );
  assert.match(
    css,
    /\.cheats__foot\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.12\);[\s\S]*border-radius: 999px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 520px\)\s*{[\s\S]*\.cheats__panel\s*{[\s\S]*border-radius: 22px;[\s\S]*\.cheats__panel li\s*{[\s\S]*flex-direction: column;/,
  );
});

test('static cheatsheet easter egg renders localized copy without changing command tokens', () => {
  const source = fs.readFileSync(extrasPath, 'utf8');

  for (const key of [
    'cheatsheetClose',
    'cheatsheetTitle',
    'cheatsheetFika',
    'cheatsheetIkea',
    'cheatsheetFoot',
  ]) {
    assert.match(source, new RegExp(`${key}:\\s*\\{`), `${key} copy should be defined`);
    assert.match(source, new RegExp(`extrasText\\('${key}'\\)`), `${key} should render via lang()`);
  }

  for (const token of ['fika', 'abba', 'snö', 'snow', 'vasa', 'ikea', 'skål', 'lagom']) {
    assert.match(source, new RegExp(`<kbd>${token}</kbd>`), `${token} command token is stable`);
  }

  assert.match(source, /<kbd>↑↑↓↓←→←→ b a<\/kbd>/);
  assert.match(source, /<kbd>\?<\/kbd>/);
  assert.match(source, /<b>5×<\/b>/);
  assert.match(source, /<b>3×<\/b>/);
});

test('static cheatsheet easter egg uses modal dialog semantics and focus controls', () => {
  const source = fs.readFileSync(extrasPath, 'utf8');

  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="smt-cheats-title"/);
  assert.match(source, /<h3 id="smt-cheats-title">/);
  assert.match(source, /cheatsheetPreviouslyFocused/);
  assert.match(source, /closeCheatsheet\(true\)/);
  assert.match(source, /e\.key === 'Escape'/);
  assert.match(source, /e\.key !== 'Tab'/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
});
