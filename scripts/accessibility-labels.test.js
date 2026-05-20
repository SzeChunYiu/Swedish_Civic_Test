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

test('QuestionNavigator tabs keep token-sized touch targets', () => {
  const source = fs.readFileSync(QUESTION_NAVIGATOR_SOURCE, 'utf8');

  assert.match(source, /accessibilityRole="tab"/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
});

test('LanguagePicker menu rows expose menu-item state semantics', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'LanguagePicker.tsx'), 'utf8');

  assert.match(source, /accessibilityRole="menu"/);
  assert.match(source, /accessibilityRole="menuitem"/);
  assert.match(source, /aria-selected=\{selected\}/);
  assert.match(source, /aria-disabled=\{!opt\.available\}/);
  assert.match(source, /accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/);
  assert.doesNotMatch(
    source,
    /key=\{opt\.code\}[\s\S]*accessibilityRole="button"[\s\S]*accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/,
  );
});

test('FirstRunAboutTheTestModal keeps only guide and skip actions exposed', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'components', 'onboarding', 'FirstRunAboutTheTestModal.tsx'),
    'utf8',
  );

  assert.match(source, /accessibilityViewIsModal/);
  assert.match(source, /accessibilityLabel=\{copy\.title\}/);
  assert.match(source, /accessible=\{false\}/);
  assert.match(source, /accessibilityElementsHidden/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  assert.match(source, /accessibilityLabel=\{copy\.openAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /accessibilityLabel=\{copy\.skipAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /ref=\{guideLinkRef\}/);
  assert.match(source, /ref=\{skipButtonRef\}/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.doesNotMatch(
    source,
    /<Pressable[\s\S]*accessibilityLabel=\{copy\.skipAccessibilityLabel\}[\s\S]*styles\.backdrop/,
  );
});

test('NativeAdCard native summary and CTA are separate accessibility elements', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'components', 'monetization', 'NativeAdCard.native.tsx'),
    'utf8',
  );
  const copySource = fs.readFileSync(path.join(ROOT, 'lib', 'monetization', 'adCopy.ts'), 'utf8');

  assert.match(source, /<NativeAdView accessible=\{false\}/);
  assert.match(
    source,
    /<View\s+accessible\s+accessibilityHint=\{copy\.hint\}\s+accessibilityLabel=\{copy\.accessibilityLabel\}\s+accessibilityRole="summary"[\s\S]*?style=\{styles\.summary\}/,
  );
  assert.match(
    source,
    /<NativeAsset assetType=\{NativeAssetType\.CALL_TO_ACTION\}>\s*<Text\s+accessible\s+accessibilityHint=\{copy\.ctaHint\}\s+accessibilityLabel=\{copy\.ctaAccessibilityLabel\(nativeAd\.callToAction\)\}\s+accessibilityRole="button"\s+style=\{styles\.cta\}\s*>/,
  );
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.doesNotMatch(source, /<NativeAdView\s+accessible[\s>]/);
  assert.match(
    copySource,
    /ctaAccessibilityLabel: \(callToAction\) => `Annonsåtgärd: \$\{callToAction\}`/,
  );
  assert.match(
    copySource,
    /ctaAccessibilityLabel: \(callToAction\) => `Ad action: \$\{callToAction\}`/,
  );
  assert.match(copySource, /getNativeAdCardCopy/);
  assert.match(copySource, /live:\s*\{[\s\S]*?accessibilityLabel:\s*'Ad:/);
  assert.match(copySource, /test:\s*\{[\s\S]*?accessibilityLabel:\s*'Test native ad:/);
  assert.doesNotMatch(copySource, new RegExp(['Sponsrad', 'studieplacering'].join('\\s+'), 'i'));
});

test('MockExamConfigPanel summary header is separate from interactive controls', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', 'MockExamConfigPanel.tsx'), 'utf8');

  assert.match(source, /const resolvedPanelAccessibilityLabel =/);
  assert.match(source, /accessibilityRole="none"/);
  assert.match(source, /accessible=\{false\}/);
  assert.match(
    source,
    /<View\s+accessible\s+accessibilityLabel=\{resolvedPanelAccessibilityLabel\}\s+accessibilityRole=\{accessibilityRole\}\s+style=\{styles\.header\}/,
  );
  assert.match(source, /accessibilityRole="adjustable"/);
  assert.match(source, /accessibilityActions=\{stepperAccessibilityActions\}/);
  assert.match(source, /\{ name: 'decrement', label: decrementAccessibilityLabel \}/);
  assert.match(source, /\{ name: 'increment', label: incrementAccessibilityLabel \}/);
  assert.match(source, /onAccessibilityAction=\{handleAccessibilityAction\}/);
  assert.match(source, /case 'decrement':[\s\S]*getNextValue\(value, step, -1, min, max\)/);
  assert.match(source, /case 'increment':[\s\S]*getNextValue\(value, step, 1, min, max\)/);
  assert.match(source, /accessibilityRole="checkbox"/);
  assert.doesNotMatch(
    source,
    /<View\s+accessibilityLabel=\{resolvedChaptersLabel\}\s+accessibilityRole="summary"\s+style=\{styles\.chips\}/,
  );
  assert.doesNotMatch(source, /<Surface\b[^>]*accessibilityLabel=/);
});

test('Dashboard summary text is separate from interactive links, buttons, and scrolling', () => {
  const dashboardSource = fs.readFileSync(path.join(ROOT, 'app', 'dashboard.tsx'), 'utf8');
  const activitySource = fs.readFileSync(
    path.join(ROOT, 'components', 'dashboard', 'ActivityHeatmap.tsx'),
    'utf8',
  );
  const chapterSource = fs.readFileSync(
    path.join(ROOT, 'components', 'dashboard', 'PerChapterProgressBars.tsx'),
    'utf8',
  );

  assert.match(
    dashboardSource,
    /const summaryAccessibilityLabel = copy\.summaryAccessibilityLabel\(/,
  );
  assert.match(
    dashboardSource,
    /<Text accessibilityRole="summary" style=\{styles\.accessibilitySummary\}>\s*\{summaryAccessibilityLabel\}\s*<\/Text>/,
  );
  assert.doesNotMatch(
    dashboardSource,
    /<Card[\s\S]{0,180}accessibilityLabel=\{summaryAccessibilityLabel\}[\s\S]{0,900}<Link/,
  );
  assert.match(
    activitySource,
    /<ScrollView[\s\S]*accessibilityLabel=\{accessibilityLabel\}[\s\S]*accessibilityRole="summary"[\s\S]*aria-label=\{accessibilityLabel\}/,
  );
  assert.doesNotMatch(
    activitySource,
    /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}/,
  );
  assert.match(
    chapterSource,
    /<Text accessibilityRole="summary" style=\{styles\.accessibilitySummary\}>\s*\{accessibilityLabel\}\s*<\/Text>/,
  );
  assert.doesNotMatch(chapterSource, /<Card[\s\S]{0,120}accessibilityLabel=\{accessibilityLabel\}/);
});

test('TopBarActions audio switch keeps web hover, focus, and touch-target feedback', () => {
  const source = fs.readFileSync(TOP_BAR_ACTIONS_SOURCE, 'utf8');

  assert.match(source, /function TopBarAudioSwitch/);
  assert.match(source, /accessibilityRole="switch"/);
  assert.match(source, /accessibilityState=\{\{ checked: audioEnabled \}\}/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /onFocus: \(\) => setIsFocused\(true\)/);
  assert.match(source, /onBlur: \(\) => setIsFocused\(false\)/);
  assert.match(source, /onHoverIn: \(\) => setIsHovered\(true\)/);
  assert.match(
    source,
    /onHoverOut: \(\) => \{[\s\S]*setIsHovered\(false\);[\s\S]*setIsPressed\(false\);[\s\S]*\}/,
  );
  assert.match(source, /onPressIn=\{\(\) => setIsPressed\(true\)\}/);
  assert.match(source, /onPressOut=\{\(\) => setIsPressed\(false\)\}/);
  assert.match(source, /isFocused \|\| isHovered \? styles\.iconButtonHover : null/);
  assert.match(source, /isPressed \? styles\.iconButtonPressed : null/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
  assert.match(source, /iconButtonHover:\s*\{[\s\S]*backgroundColor: colors\.focusSoft/);
  assert.match(
    source,
    /iconButtonHover:\s*\{[\s\S]*transform: \[\{ scale: motion\.hoverScale \}\]/,
  );
  assert.match(
    source,
    /iconButtonPressed:\s*\{[\s\S]*transform: \[\{ scale: motion\.pressedScale \}\]/,
  );
});
