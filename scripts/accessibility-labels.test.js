const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const INTERACTIVE_TAG = /<(Pressable|Link|Button)\b/;

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

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
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

test('launch popup close button keeps a token-sized dismiss target', () => {
  const source = read('components/monetization/LaunchPopupAd.tsx');

  assert.match(
    source,
    /<Pressable[\s\S]*accessibilityLabel=\{copy\.closeAccessibilityLabel\}[\s\S]*accessibilityRole=["']button["'][\s\S]*hitSlop=\{space\[1\]\}/,
    'launch popup close button should keep explicit label, button role, and token hit slop',
  );
  assert.match(
    source,
    /style=\{\(\{ pressed \}\) => \[[\s\S]*styles\.closeButton,[\s\S]*pressed \? styles\.closeButtonPressed : null,[\s\S]*\]\}/,
    'launch popup close button should keep token pressed feedback wired through Pressable state',
  );
  assert.match(
    source,
    /closeButton:\s*\{[\s\S]*alignItems:\s*['"]center['"],[\s\S]*backgroundColor:\s*colors\.accent,[\s\S]*borderRadius:\s*radius\.card,[\s\S]*justifyContent:\s*['"]center['"],[\s\S]*minHeight:\s*space\[6\],[\s\S]*paddingHorizontal:\s*space\[2\],[\s\S]*paddingVertical:\s*space\[1\],[\s\S]*\}/,
    'launch popup close button should render with a stable 48px token minimum target',
  );
  assert.match(
    source,
    /closeButtonPressed:\s*\{[\s\S]*backgroundColor:\s*colors\.accentActive,[\s\S]*transform:\s*\[\{ scale:\s*motion\.pressedScale \}\],[\s\S]*\}/,
    'launch popup close button pressed state should use theme interaction tokens',
  );
});
