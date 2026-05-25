const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { runFocusedValidatorMutation } = require('./helpers/focusedValidatorMutation.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'components/ui/TopBarActions.tsx');
const focusFlag = '--focus-topbar-actions-accessibility';
const targetFile = 'components/ui/TopBarActions.tsx';

function readSource() {
  return fs.readFileSync(sourcePath, 'utf8');
}

test('TopBarActions accessibility parity uses focused content validation routing', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-content.js', focusFlag], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /ReferenceError|Cannot access/);

  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused TopBarActions validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.topBarActionsAccessibilityRulesValidated, 33);
  assert.equal(summary.topBarActionsAccessibilityParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('top bar route links keep web anchor touch targets and theme token feedback', () => {
  const source = readSource();

  assert.match(source, /function TopBarActionLink\(/);
  assert.match(source, /<Link\s/);
  assert.match(source, /const themeColors = useThemeColors\(\);/);
  assert.match(
    source,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\);/,
  );
  assert.match(source, /function createStyles\(themeColors: ThemeColors\)/);
  assert.match(source, /useTopBarActionLinkWebStyles\(themeColors\)/);
  assert.doesNotMatch(source, /<Link[^>]*\basChild\b/);
  assert.doesNotMatch(
    source,
    /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/lib\/theme['"]/,
  );
  assert.doesNotMatch(source, /\bcolors\./);
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
  assert.match(source, /background-color: \$\{themeColors\.focusSoft\}/);
  assert.match(source, /iconLinkHover: \{\s*backgroundColor: themeColors\.focusSoft,/);
  assert.match(source, /transform: \[\{ scale: motion\.hoverScale \}\]/);
  assert.match(
    source,
    /iconLinkHoverReducedMotion: \{\s*backgroundColor: themeColors\.focusSoft,\s*\}/,
  );
  assert.match(source, /iconLinkPressed: \{\s*backgroundColor: themeColors\.focusSoft,/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transform: none;/);
});

test('focused TopBarActions accessibility validator rejects realistic link mutations', () => {
  const mutationFixtures = [
    {
      label: 'missing web focus feedback',
      expectedFailure: /TopBarActions missing web focus soft feedback for accessibility parity/,
      mutateSource: (source) =>
        source.replaceAll(
          'background-color: ${themeColors.focusSoft};',
          'background-color: transparent;',
        ),
    },
    {
      label: 'missing keyboard pressed-state reset',
      expectedFailure: /TopBarActions missing keyboard up pressed reset for accessibility parity/,
      mutateSource: (source) =>
        source.replace(
          /    onKeyUp: \(event: \{ key\?: string \}\) => \{\n      if \(isKeyboardActivationKey\(event\.key\)\) setIsPressed\(false\);\n    \},/,
          '    onKeyUp: () => undefined,',
        ),
    },
    {
      label: 'Expo Link asChild bypass',
      expectedFailure: /TopBarActions must not include Expo Link asChild bypass/,
      mutateSource: (source) => source.replace('<Link\n', '<Link asChild\n'),
    },
  ];

  for (const fixture of mutationFixtures) {
    const result = runFocusedValidatorMutation({
      focusFlag,
      targetFile,
      mutateSource: fixture.mutateSource,
    });
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, `${fixture.label} should fail focused validation\n${output}`);
    assert.match(output, fixture.expectedFailure);
    assert.doesNotMatch(output, /questionSchemasValidated/);
  }
});
