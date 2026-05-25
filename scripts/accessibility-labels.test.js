const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components'];
const INTERACTIVE_TAG = /<(Pressable|Link|Button)\b/;
const HOME_ROUTE_SOURCE = path.join(ROOT, 'app', '(tabs)', 'home.tsx');
const EXAM_ROUTE_SOURCE = path.join(ROOT, 'app', '(tabs)', 'exam.tsx');
const PRACTICE_ROUTE_SOURCE = path.join(ROOT, 'app', '(tabs)', 'practice.tsx');
const QUESTION_NAVIGATOR_SOURCE = path.join(ROOT, 'components', 'QuestionNavigator.tsx');
const ROUTE_LINK_SOURCE = path.join(ROOT, 'components', 'ui', 'RouteLink.tsx');
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
        const isButtonImplementation = relPath === 'components/Button.tsx';
        const tagName = (tag.match(/<(Pressable|Link|Button)\b/) || [])[1];
        const isIntentionallyHidden =
          tag.includes('accessible={false}') &&
          (tag.includes('importantForAccessibility="no"') ||
            tag.includes('importantForAccessibility="no-hide-descendants"'));

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
        const hasNativeCheckedState =
          tag.includes('accessibilityRole="switch"') ||
          /accessibilityState=\{\{[^}]*checked:/.test(tag);
        const hasWebCheckedMirror = tag.includes('aria-checked=');
        const hasWebPressedToggleMirror =
          tag.includes('accessibilityRole="button"') && tag.includes('aria-pressed=');

        if (
          tagName === 'Pressable' &&
          hasNativeCheckedState &&
          !hasWebCheckedMirror &&
          !hasWebPressedToggleMirror
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

test('QuestionNavigator keeps interactive tabs and status-only dots distinct', () => {
  const source = fs.readFileSync(QUESTION_NAVIGATOR_SOURCE, 'utf8');

  assert.match(
    source,
    /const isInteractive = disabled !== true && typeof onSelect === 'function';/,
  );
  assert.match(source, /isInteractive \? copy\.navigationLabel : copy\.statusLabel/);
  assert.match(source, /isInteractive[\s\S]*\?\s*\(requestedAccessibilityRole \?\? 'tablist'\)/);
  assert.match(source, /requestedAccessibilityRole === 'tablist'[\s\S]*\?\s*'list'/);
  assert.match(
    source,
    /<View[\s\S]*accessible[\s\S]*accessibilityLabel=\{itemLabel\}[\s\S]*accessibilityRole="text"/,
  );
  assert.match(source, /accessibilityRole="tab"/);
  assert.match(source, /accessibilityState=\{\{ selected \}\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ disabled: isDisabled, selected \}\}/);
  assert.match(source, /hitSlop=\{space\[1\]\}/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
});

test('RouteLink keeps web accessible names and delayed keyboard activation guarded', () => {
  const source = fs.readFileSync(ROUTE_LINK_SOURCE, 'utf8');
  const keyDownStart = source.indexOf('onKeyDown:');
  const keyUpStart = source.indexOf('onKeyUp:');
  const mouseDownStart = source.indexOf('onMouseDown:');

  assert.notEqual(keyDownStart, -1, 'RouteLink should define an onKeyDown web handler');
  assert.notEqual(keyUpStart, -1, 'RouteLink should define an onKeyUp web handler');
  assert.notEqual(mouseDownStart, -1, 'RouteLink should define mouse handlers after key handlers');

  const keyDownBlock = source.slice(keyDownStart, keyUpStart);
  const keyUpBlock = source.slice(keyUpStart, mouseDownStart);

  assert.match(source, /<Link\s/);
  assert.doesNotMatch(source, /<Link[^>]*\basChild\b/);
  assert.match(source, /aria-label=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /keyboardActivationKeys = new Set\(\['Enter', ' ', 'Space', 'Spacebar'\]\)/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\);/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /pressedReducedMotion: \{\s*backgroundColor: themeColors\.focusSoft,\s*\}/);

  assert.match(keyDownBlock, /if \(isKeyboardActivationKey\(event\.key\)\)/);
  assert.match(keyDownBlock, /setIsPressed\(true\);/);
  assert.match(keyDownBlock, /event\.preventDefault\?\.\(\);/);
  assert.match(keyDownBlock, /onKeyDown\?\.\(event\);/);
  assert.doesNotMatch(keyDownBlock, /click\?\.\(\)/);

  assert.match(keyUpBlock, /if \(isKeyboardActivationKey\(event\.key\)\)/);
  assert.match(keyUpBlock, /setIsPressed\(false\);/);
  assert.match(keyUpBlock, /event\.preventDefault\?\.\(\);/);
  assert.match(keyUpBlock, /event\.currentTarget\?\.click\?\.\(\);/);
  assert.match(keyUpBlock, /onKeyUp\?\.\(event\);/);
});

test('Home rewarded extra exam actions expose labels roles and state', () => {
  const source = fs.readFileSync(HOME_ROUTE_SOURCE, 'utf8');

  assert.match(source, /rewardedExamPreviewAccessibilityLabel/);
  assert.match(source, /rewardedExamUnlockAccessibilityLabel/);
  assert.match(source, /rewardedExamUnlockedCtaAccessibilityLabel/);
  assert.match(
    source,
    /<Link\s+accessibilityLabel=\{copy\.rewardedExamUnlockedCtaAccessibilityLabel\}[\s\S]*?accessibilityRole="link"[\s\S]*?style=\{styles\.rewardedExamLink\}/,
  );
  assert.match(
    source,
    /<Button\s+accessibilityLabel=\{copy\.rewardedExamPreviewAccessibilityLabel\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ disabled: rewardPreviewCompleted \}\}[\s\S]*?disabled=\{rewardPreviewCompleted\}/,
  );
  assert.match(
    source,
    /<Button\s+accessibilityLabel=\{copy\.rewardedExamUnlockAccessibilityLabel\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{[\s\S]*?busy: rewardUnlockInFlight,[\s\S]*?disabled: !rewardPreviewCompleted \|\| rewardUnlockInFlight,[\s\S]*?\}\}[\s\S]*?disabled=\{!rewardPreviewCompleted \|\| rewardUnlockInFlight\}/,
  );
});

test('Exam review filters expose labels and selected state mirrors', () => {
  const source = fs.readFileSync(EXAM_ROUTE_SOURCE, 'utf8');

  assert.match(
    source,
    /<Pressable\s+accessibilityLabel=\{copy\.reviewFilterFlagged\(flaggedReviewCount\)\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ selected: reviewFilter === 'flagged' \}\}[\s\S]*?aria-selected=\{reviewFilter === 'flagged'\}/,
  );
  assert.match(
    source,
    /<Pressable\s+accessibilityLabel=\{copy\.reviewFilterAll\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ selected: reviewFilter === 'all' \}\}[\s\S]*?aria-selected=\{reviewFilter === 'all'\}/,
  );
});

test('Practice hero controls keep token-sized touch targets', () => {
  const source = fs.readFileSync(PRACTICE_ROUTE_SOURCE, 'utf8');

  assert.match(
    source,
    /accessibilityLabel=\{copy\.bookmarkAccessibilityLabel\(isBookmarked\)\}[\s\S]*?accessibilityRole="button"[\s\S]*?hitSlop=\{space\[1\]\}[\s\S]*?styles\.bookmarkButton/,
  );
  assert.match(
    source,
    /accessibilityRole="switch"[\s\S]*?accessibilityState=\{\{ checked: includeSupplementary \}\}[\s\S]*?hitSlop=\{space\[1\]\}[\s\S]*?styles\.bookmarkButton/,
  );
  assert.match(
    source,
    /accessibilityState=\{\{ expanded: aboutSourcesOpen \}\}[\s\S]*?accessibilityLabel=\{aboutSourcesOpen \? copy\.aboutSourcesHide : copy\.aboutSourcesShow\}[\s\S]*?hitSlop=\{space\[1\]\}[\s\S]*?styles\.aboutSourcesTrigger/,
  );
  assert.match(source, /bookmarkButton:\s*\{[\s\S]*?minHeight:\s*space\[6\]/);
  assert.match(source, /bookmarkButton:\s*\{[\s\S]*?minWidth:\s*space\[6\]/);
  assert.match(source, /aboutSourcesTrigger:\s*\{[\s\S]*?minHeight:\s*space\[6\]/);
  assert.match(source, /aboutSourcesTrigger:\s*\{[\s\S]*?minWidth:\s*space\[6\]/);
});

test('LanguagePicker menu rows expose menu-item state semantics', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'LanguagePicker.tsx'), 'utf8');

  assert.match(source, /aria-haspopup="menu"/);
  assert.match(source, /accessibilityRole="menu"/);
  assert.match(source, /accessibilityRole="menuitem"/);
  assert.match(source, /aria-selected=\{selected\}/);
  assert.match(source, /aria-disabled=\{!opt\.available\}/);
  assert.match(source, /tabIndex: option\.available \? 0 : -1/);
  assert.match(
    source,
    /onKeyDown: \(event: KeyboardEventLike\) => handleRowKeyDown\(event, option\)/,
  );
  assert.match(source, /\{\.\.\.getRowWebKeyboardProps\(opt\)\}/);
  assert.match(source, /const closeButtonRef = useRef<FocusableElement \| null>\(null\);/);
  assert.match(
    source,
    /const focusCloseButton = useCallback\(\(\) => \{[\s\S]*closeButtonRef\.current\?\.focus\?\.\(\);/,
  );
  assert.match(
    source,
    /const focusFirstAvailableLocale = useCallback\(\(\) => \{[\s\S]*focusAvailableLocale\(0\);/,
  );
  assert.match(
    source,
    /const focusLastAvailableLocale = useCallback\(\(\) => \{[\s\S]*focusAvailableLocale\(availableLocales\.length - 1\);/,
  );
  assert.match(source, /case 'Tab':[\s\S]*focusCloseButton\(\);/);
  assert.match(source, /const handleCloseKeyDown = \(event: KeyboardEventLike\) => \{/);
  assert.match(source, /if \(key !== 'Tab'\) return;[\s\S]*event\.preventDefault\?\.\(\);/);
  assert.match(source, /if \(shiftKey\) \{[\s\S]*focusLastAvailableLocale\(\);/);
  assert.match(source, /else \{[\s\S]*focusFirstAvailableLocale\(\);/);
  assert.match(source, /\{\.\.\.getCloseWebKeyboardProps\(\)\}/);
  assert.match(source, /case 'Escape':[\s\S]*closeMenu\(\);/);
  assert.match(source, /case 'ArrowDown':[\s\S]*focusAvailableLocale/);
  assert.match(source, /case 'Home':[\s\S]*focusAvailableLocale\(0\);/);
  assert.match(source, /case 'End':[\s\S]*focusAvailableLocale\(availableLocales\.length - 1\);/);
  assert.match(source, /case 'Enter':[\s\S]*handleSelect\(option\);/);
  assert.match(source, /case ' ':[\s\S]*handleSelect\(option\);/);
  assert.match(source, /accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/);
  assert.match(
    source,
    /accessible=\{false\}[\s\S]*importantForAccessibility="no-hide-descendants"/,
  );
  assert.match(
    source,
    /accessibilityLabel=\{copy\.closeLabel\}[\s\S]*accessibilityRole="button"[\s\S]*hitSlop=\{space\[1\]\}[\s\S]*styles\.closeButton/,
  );
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
  assert.doesNotMatch(
    source,
    /key=\{opt\.code\}[\s\S]*accessibilityRole="button"[\s\S]*accessibilityState=\{\{ selected, disabled: !opt\.available \}\}/,
  );
  const backdropTag = source.match(
    /<Pressable\s+accessible=\{false\}[\s\S]*?style=\{\(\{ pressed \}\) => \[styles\.backdrop[\s\S]*?\/>/,
  );
  assert.ok(backdropTag, 'LanguagePicker backdrop must be hidden from accessibility');
  assert.doesNotMatch(backdropTag[0], /accessibilityRole=|accessibilityLabel=/);
});

test('shared interactive scale feedback respects reduced-motion preferences', () => {
  const checkedSources = [
    'app/(tabs)/practice.tsx',
    'app/settings.tsx',
    'components/Button.tsx',
    'components/ChapterProgressCard.tsx',
    'components/MockExamConfigPanel.tsx',
    'components/OptionCard.tsx',
    'components/QuestionNavigator.tsx',
    'components/compliance/ComplianceActionLink.tsx',
    'components/monetization/LaunchPopupAd.tsx',
    'components/onboarding/FirstRunAboutTheTestModal.tsx',
    'components/quiz/ConfidenceRatingPicker.tsx',
    'components/quiz/ProvenanceBadge.tsx',
    'components/ui/LanguagePicker.tsx',
    'components/ui/RouteLink.tsx',
    'components/ui/SocialProofRow.tsx',
    'components/ui/TopBarActions.tsx',
  ];

  checkedSources.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.match(source, /useReducedMotion/);
    assert.match(source, /reduceMotion/);
  });

  const topBarSource = fs.readFileSync(TOP_BAR_ACTIONS_SOURCE, 'utf8');
  const complianceSource = fs.readFileSync(
    path.join(ROOT, 'components', 'compliance', 'ComplianceActionLink.tsx'),
    'utf8',
  );

  [topBarSource, complianceSource].forEach((source) => {
    assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(source, /transform: none;/);
  });
});

test('NativeAdCard native summary and CTA are separate accessibility elements', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'components', 'monetization', 'NativeAdCard.native.tsx'),
    'utf8',
  );
  const copySource = fs.readFileSync(path.join(ROOT, 'lib', 'monetization', 'adCopy.ts'), 'utf8');

  assert.match(source, /<NativeAdView accessible=\{false\}/);
  assert.match(source, /getNativeAdSummaryAccessibilityLabel/);
  assert.match(source, /const summaryAccessibilityLabel = getNativeAdSummaryAccessibilityLabel/);
  assert.match(source, /headline: nativeAd\.headline/);
  assert.match(source, /advertiser: nativeAd\.advertiser/);
  assert.match(source, /body: nativeAd\.body/);
  assert.match(
    source,
    /<View\s+accessible\s+accessibilityHint=\{copy\.hint\}\s+accessibilityLabel=\{summaryAccessibilityLabel\}\s+accessibilityRole="summary"[\s\S]*?style=\{styles\.summary\}/,
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
  assert.match(copySource, /getNativeAdSummaryAccessibilityLabel/);
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
  assert.match(activitySource, /accessibilityLabel=\{copy\.dayLabel\(bin\.date, bin\.count\)\}/);
  assert.match(dashboardSource, /dayLabel: \(date, answers\) => `\$\{date\}: \$\{answers\} svar`/);
  assert.match(
    dashboardSource,
    /dayLabel: \(date, answers\) => `\$\{date\}: \$\{answers\} answers`/,
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
  assert.match(
    source,
    /onBlur: \(\) => \{[\s\S]*setIsFocused\(false\);[\s\S]*setIsPressed\(false\);[\s\S]*\}/,
  );
  assert.match(source, /onHoverIn: \(\) => setIsHovered\(true\)/);
  assert.match(
    source,
    /onHoverOut: \(\) => \{[\s\S]*setIsHovered\(false\);[\s\S]*setIsPressed\(false\);[\s\S]*\}/,
  );
  assert.match(source, /onPressIn=\{\(\) => setIsPressed\(true\)\}/);
  assert.match(source, /onPressOut=\{\(\) => setIsPressed\(false\)\}/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\);/);
  assert.match(
    source,
    /isFocused \|\| isHovered[\s\S]*styles\.iconButtonHoverReducedMotion[\s\S]*styles\.iconButtonHover/,
  );
  assert.match(
    source,
    /isPressed[\s\S]*styles\.iconButtonPressedReducedMotion[\s\S]*styles\.iconButtonPressed/,
  );
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /minWidth:\s*space\[6\]/);
  assert.match(source, /iconButtonHover:\s*\{[\s\S]*backgroundColor: themeColors\.focusSoft/);
  assert.match(
    source,
    /iconButtonHoverReducedMotion:\s*\{[\s\S]*backgroundColor: themeColors\.focusSoft/,
  );
  assert.match(
    source,
    /iconButtonHover:\s*\{[\s\S]*transform: \[\{ scale: motion\.hoverScale \}\]/,
  );
  assert.match(
    source,
    /iconButtonPressedReducedMotion:\s*\{[\s\S]*backgroundColor: themeColors\.focusSoft/,
  );
  assert.match(
    source,
    /iconButtonPressed:\s*\{[\s\S]*transform: \[\{ scale: motion\.pressedScale \}\]/,
  );
});
