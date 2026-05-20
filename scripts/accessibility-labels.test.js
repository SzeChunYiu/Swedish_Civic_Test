const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const INTERACTIVE_TAG = /<(Pressable|Link|Button)\b/;
const QUESTION_NAVIGATOR_SOURCE = path.join(ROOT, 'components', 'QuestionNavigator.tsx');
const TOP_BAR_ACTIONS_SOURCE = path.join(ROOT, 'components/ui/TopBarActions.tsx');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.tsx?$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function collectOpeningTag(lines, startIndex) {
  let tag = '';
  for (let index = startIndex; index < lines.length; index += 1) {
    tag += `\n${lines[index]}`;
    if (lines[index].includes('>')) return tag;
  }
  return tag;
}

test('interactive elements expose explicit accessibility labels, roles, and states', () => {
  const offenders = [];

  for (const sourceDir of SOURCE_DIRS) {
    for (const filePath of walk(path.join(ROOT, sourceDir))) {
      const relPath = path.relative(ROOT, filePath);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (!INTERACTIVE_TAG.test(line)) return;
        const tag = collectOpeningTag(lines, index);
        const isButtonImplementation = relPath === 'components/ui/Button.tsx';
        const tagName = (tag.match(/<(Pressable|Link|Button)\b/) || [])[1];
        const isIntentionallyHidden =
          tag.includes('accessible={false}') &&
          tag.includes('importantForAccessibility="no-hide-descendants"');

        if (isIntentionallyHidden) return;

        if (!isButtonImplementation && !tag.includes('accessibilityLabel=')) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityLabel: ${line.trim()}`);
        }
        if (!tag.includes('accessibilityRole=')) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityRole: ${line.trim()}`);
        }
        if (tagName === 'Link' && !tag.includes('accessibilityRole="link"')) {
          offenders.push(
            `${relPath}:${index + 1}: Link should use accessibilityRole="link": ${line.trim()}`,
          );
        }
        if (
          tagName === 'Pressable' &&
          (tag.includes('accessibilityRole="switch"') ||
            /accessibilityState=\{\{[^}]*checked:/.test(tag)) &&
          !tag.includes('aria-checked=')
        ) {
          offenders.push(
            `${relPath}:${index + 1}: missing aria-checked mirror for web false state: ${line.trim()}`,
          );
        }
        if (
          tagName === 'Pressable' &&
          /accessibilityState=\{\{[^}]*expanded:/.test(tag) &&
          !tag.includes('aria-expanded=')
        ) {
          offenders.push(
            `${relPath}:${index + 1}: missing aria-expanded mirror for web false state: ${line.trim()}`,
          );
        }
        if (
          (tag.includes('disabled=') || tag.includes('Selected') || tag.includes('Active')) &&
          !tag.includes('accessibilityState=')
        ) {
          offenders.push(`${relPath}:${index + 1}: missing accessibilityState: ${line.trim()}`);
        }
      });
    }
  }

  assert.deepEqual(offenders, []);
});

test('QuestionNavigator tabs keep token-sized touch targets', () => {
  const source = fs.readFileSync(QUESTION_NAVIGATOR_SOURCE, 'utf8');

  assert.match(source, /accessibilityRole="tab"/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
});

test('TopBar audio switch keeps web state and token feedback parity with route links', () => {
  const source = fs.readFileSync(TOP_BAR_ACTIONS_SOURCE, 'utf8');

  assert.match(source, /const \[audioFocused,\s*setAudioFocused\] = useState\(false\);/);
  assert.match(source, /const \[audioHovered,\s*setAudioHovered\] = useState\(false\);/);
  assert.match(source, /const \[audioPressed,\s*setAudioPressed\] = useState\(false\);/);
  assert.match(source, /aria-checked=\{audioEnabled\}/);
  assert.match(source, /accessibilityRole="switch"/);
  assert.match(source, /accessibilityState=\{\{\s*checked:\s*audioEnabled\s*\}\}/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /onFocus:\s*\(\)\s*=>\s*setAudioFocused\(true\)/);
  assert.match(source, /onMouseEnter:\s*\(\)\s*=>\s*setAudioHovered\(true\)/);
  assert.match(source, /setAudioHovered\(false\);\s*setAudioPressed\(false\);/);
  assert.match(source, /onPressIn=\{\(\)\s*=>\s*setAudioPressed\(true\)\}/);
  assert.match(source, /onPressOut=\{\(\)\s*=>\s*setAudioPressed\(false\)\}/);
  assert.match(source, /audioFocused \|\| audioHovered \? styles\.iconButtonHover : null/);
  assert.match(source, /pressed \|\| audioPressed \? styles\.iconButtonPressed : null/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
  assert.match(source, /iconButtonHover:\s*\{\s*backgroundColor:\s*colors\.focusSoft/);
  assert.match(source, /transform:\s*\[\{\s*scale:\s*motion\.hoverScale\s*\}\]/);
  assert.match(source, /iconButtonPressed:\s*\{\s*backgroundColor:\s*colors\.focusSoft/);
  assert.match(source, /transform:\s*\[\{\s*scale:\s*motion\.pressedScale\s*\}\]/);
});
