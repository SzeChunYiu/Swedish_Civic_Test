const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'components/ui/TopBarActions.tsx');

function readSource() {
  return fs.readFileSync(sourcePath, 'utf8');
}

test('top bar route links keep web anchor touch targets and token feedback', () => {
  const source = readSource();

  assert.match(source, /function TopBarActionLink\(/);
  assert.match(source, /<Link\s/);
  assert.doesNotMatch(source, /<Link[^>]*\basChild\b/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /keyboardActivationKeys = new Set\(\['Enter', ' ', 'Spacebar'\]\)/);
  assert.match(source, /onPressIn=\{\(\) => setIsPressed\(true\)\}/);
  assert.match(source, /onPressOut=\{\(\) => setIsPressed\(false\)\}/);
  assert.match(
    source,
    /onKeyDown: \(event: \{ key\?: string \}\) => \{[\s\S]*isKeyboardActivationKey\(event\.key\)[\s\S]*setIsPressed\(true\)/,
  );
  assert.match(
    source,
    /onKeyUp: \(event: \{ key\?: string \}\) => \{[\s\S]*isKeyboardActivationKey\(event\.key\)[\s\S]*setIsPressed\(false\)/,
  );
  assert.match(source, /onMouseDown: \(\) => setIsPressed\(true\)/);
  assert.match(source, /onMouseUp: \(\) => setIsPressed\(false\)/);
  assert.match(source, /onMouseEnter: \(\) => setIsHovered\(true\)/);
  assert.match(source, /setIsHovered\(false\);\s*setIsPressed\(false\);/);
  assert.match(source, /setIsFocused\(false\);\s*setIsPressed\(false\);/);
  assert.match(source, /isFocused \|\| isHovered[\s\S]*styles\.iconLinkHover/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\);/);
  assert.match(
    source,
    /reduceMotion[\s\S]*styles\.iconLinkHoverReducedMotion[\s\S]*styles\.iconLinkHover/,
  );
  assert.match(
    source,
    /isPressed[\s\S]*reduceMotion[\s\S]*styles\.iconLinkPressedReducedMotion[\s\S]*styles\.iconLinkPressed/,
  );
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /minWidth: space\[6\]/);
  assert.match(source, /iconLinkHover: \{\s*backgroundColor: colors\.focusSoft,/);
  assert.match(source, /transform: \[\{ scale: motion\.hoverScale \}\]/);
  assert.match(source, /iconLinkHoverReducedMotion: \{\s*backgroundColor: colors\.focusSoft,\s*\}/);
  assert.match(source, /iconLinkPressed: \{\s*backgroundColor: colors\.focusSoft,/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transform: none;/);
});
