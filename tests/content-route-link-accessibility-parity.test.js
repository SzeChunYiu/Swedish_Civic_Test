const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const sourceRoots = ['app', 'components'];
const tokenScalePattern = /motion\.(?:hoverScale|pressedScale)/;
const reducedMotionOptOutPattern =
  /useReducedMotion|!reduceMotion|!reducedMotionEnabled|ReducedMotion|prefers-reduced-motion/;

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.tsx?$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function collectScaledFeedbackOffenders(entries) {
  const offenders = [];

  for (const [relativePath, source] of entries) {
    if (!tokenScalePattern.test(source)) continue;
    if (!reducedMotionOptOutPattern.test(source)) {
      offenders.push(`${relativePath}: token scale feedback lacks a reduced-motion opt-out`);
    }
  }

  return offenders;
}

function interactiveSourceEntries() {
  return sourceRoots.flatMap((sourceRoot) =>
    walk(path.join(repoRoot, sourceRoot)).map((fullPath) => [
      path.relative(repoRoot, fullPath),
      fs.readFileSync(fullPath, 'utf8'),
    ]),
  );
}

test('RouteLink preserves web anchors, keyboard feedback, caller handlers, and reduced-motion fallbacks', () => {
  const source = read('components/ui/RouteLink.tsx');

  assert.match(source, /export function RouteLink\(/);
  assert.match(source, /<Link\s/);
  assert.doesNotMatch(source, /<Link[^>]*\basChild\b/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /keyboardActivationKeys = new Set\(\['Enter', ' ', 'Spacebar'\]\)/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\);/);
  assert.match(
    source,
    /onKeyDown: \(event: Parameters<NonNullable<typeof onKeyDown>>\[0\]\) => \{/,
  );
  assert.match(source, /if \(isKeyboardActivationKey\(event\.key\)\) setIsPressed\(true\);/);
  assert.match(source, /onKeyDown\?\.\(event\);/);
  assert.match(source, /if \(isKeyboardActivationKey\(event\.key\)\) setIsPressed\(false\);/);
  assert.match(source, /onKeyUp\?\.\(event\);/);
  assert.match(source, /onMouseDown\?\.\(event\);/);
  assert.match(source, /onMouseUp\?\.\(event\);/);
  assert.match(source, /onMouseEnter\?\.\(event\);/);
  assert.match(source, /onMouseLeave\?\.\(event\);/);
  assert.match(source, /onPressIn=\{\(event\) => \{[\s\S]*onPressIn\?\.\(event\);/);
  assert.match(source, /onPressOut=\{\(event\) => \{[\s\S]*onPressOut\?\.\(event\);/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /textDecorationLine: 'none'/);
  assert.match(
    source,
    /isFocused \|\| isHovered[\s\S]*styles\.primaryInteractiveReducedMotion[\s\S]*styles\.primaryInteractive[\s\S]*styles\.interactiveReducedMotion[\s\S]*styles\.interactive/,
  );
  assert.match(
    source,
    /isPressed[\s\S]*styles\.primaryPressedReducedMotion[\s\S]*styles\.primaryPressed[\s\S]*styles\.pressedReducedMotion[\s\S]*styles\.pressed/,
  );
  assert.match(source, /interactive: \{\s*backgroundColor: themeColors\.focusSoft,/);
  assert.match(source, /transform: \[\{ scale: motion\.hoverScale \}\]/);
  assert.match(
    source,
    /interactiveReducedMotion: \{\s*backgroundColor: themeColors\.focusSoft,\s*\}/,
  );
  assert.match(source, /pressed: \{\s*backgroundColor: themeColors\.focusSoft,/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /pressedReducedMotion: \{\s*backgroundColor: themeColors\.focusSoft,\s*\}/);
});

test('all token scale feedback in app and components has a reduced-motion opt-out', () => {
  assert.deepEqual(collectScaledFeedbackOffenders(interactiveSourceEntries()), []);
});

test('interactive reduced-motion guard rejects scaled feedback without an opt-out', () => {
  const offenders = collectScaledFeedbackOffenders([
    [
      'components/FakeScaledControl.tsx',
      "import { motion } from '../lib/theme';\nconst styles = { pressed: { transform: [{ scale: motion.pressedScale }] } };\n",
    ],
  ]);

  assert.deepEqual(offenders, [
    'components/FakeScaledControl.tsx: token scale feedback lacks a reduced-motion opt-out',
  ]);
});
