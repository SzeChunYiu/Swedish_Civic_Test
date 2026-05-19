const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const INTERACTIVE_TAG = /<(Pressable|Link|Button)\b/;
const QUESTION_NAVIGATOR_SOURCE = path.join(ROOT, 'components', 'QuestionNavigator.tsx');
const TOP_BAR_ACTIONS_SOURCE = path.join(ROOT, 'components', 'ui', 'TopBarActions.tsx');

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

test('exam answer options use the shared OptionCard radio contract', () => {
  const source = fs.readFileSync(path.join(ROOT, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.match(source, /import \{ OptionCard \} from '..\/..\/components\/OptionCard';/);
  assert.match(source, /<OptionCard/);
  assert.match(
    source,
    /accessibilityLabel=\{copy\.answerAccessibilityLabel\(optionText, index \+ 1\)\}/,
  );
  assert.match(source, /accessibilityRole="radio"/);
  assert.match(source, /aria-checked=\{isSelected\}/);
  assert.match(source, /aria-selected=\{isSelected\}/);
  assert.match(source, /accessibilityState=\{\{ checked: isSelected, selected: isSelected \}\}/);
  assert.match(source, /state=\{isSelected \? 'selected' : 'idle'\}/);
  assert.match(source, /languageOverride=\{language\}/);
  assert.doesNotMatch(source, /<Pressable[\s\S]*copy\.answerAccessibilityLabel/);
  assert.doesNotMatch(source, /style=\{\[styles\.option/);
});
