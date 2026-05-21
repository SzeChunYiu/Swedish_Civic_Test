const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const e2eDir = __dirname;
const repoRoot = path.resolve(e2eDir, '../..');
const browserSpecPaths = fs
  .readdirSync(e2eDir)
  .filter((name) => name.endsWith('.spec.ts'))
  .map((name) => path.join(e2eDir, name))
  .sort();

function readRelative(relativePath) {
  return fs.readFileSync(path.join(e2eDir, relativePath), 'utf8');
}

function createPreparedDistWebFixture() {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sct-dist-web-'));
  const { webDocumentMetadata } = require('../../lib/scaffold/webDocumentMetadata.js');
  const html = [
    '<!doctype html>',
    `<html lang="${webDocumentMetadata.language}">`,
    '<head>',
    `<meta name="description" content="${webDocumentMetadata.description}">`,
    '</head>',
    '<body>',
    '<script data-web-export-loader="true"></script>',
    '</body>',
    '</html>',
  ].join('');

  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  fs.writeFileSync(path.join(outputDir, '404.html'), html);
  return outputDir;
}

function assertPortCanBind(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
}

function waitForServerReady(child, readyText = 'Serving dist-web on http://127.0.0.1:4173') {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`server did not become ready (${readyText}):\n${output}`));
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeout);
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
      child.off('exit', onExit);
    };
    const onData = (data) => {
      output += data.toString();
      if (output.includes(readyText)) {
        cleanup();
        resolve(output);
      }
    };
    const onExit = (code, signal) => {
      cleanup();
      reject(new Error(`dist-web server exited before ready (${code ?? signal}):\n${output}`));
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', onExit);
  });
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });
}

function collectMatches({ pattern, source, filePath }) {
  return Array.from(source.matchAll(pattern), (match) => ({
    file: path.relative(process.cwd(), filePath),
    literal: match[0],
  }));
}

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function topLevelArgumentCount(args) {
  const trimmedArgs = args.trim();
  if (!trimmedArgs) {
    return 0;
  }

  let count = 1;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (const char of trimmedArgs) {
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '(' || char === '[' || char === '{') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      count += 1;
    }
  }

  return count;
}

function callArgumentCounts(source, functionName) {
  const counts = [];
  const callPattern = new RegExp(`${escapeRegExp(functionName)}\\(`, 'g');
  let match;

  while ((match = callPattern.exec(source)) !== null) {
    let depth = 1;
    let args = '';
    let quote = null;
    let escaped = false;

    for (let index = callPattern.lastIndex; index < source.length; index += 1) {
      const char = source[index];

      if (quote) {
        args += char;
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }

      if (char === '"' || char === "'" || char === '`') {
        quote = char;
        args += char;
        continue;
      }

      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          counts.push(topLevelArgumentCount(args));
          callPattern.lastIndex = index + 1;
          break;
        }
      }

      args += char;
    }
  }

  return counts;
}

test('browser specs do not hardcode stale chapter count copy', () => {
  const staleCountPatterns = [
    /0\/50 besvarade/g,
    /0\/50 practiced/g,
    /Övningsfrågor \(50\)/g,
    /Practice questions \(50\)/g,
  ];

  const violations = [];
  for (const filePath of browserSpecPaths) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const pattern of staleCountPatterns) {
      violations.push(...collectMatches({ pattern, source, filePath }));
    }
  }

  assert.deepEqual(
    violations,
    [],
    'derive chapter progress and question totals from runtime question data instead of fixed 50-copy literals',
  );
});

test('browser specs do not assert obsolete dash-style answer feedback text', () => {
  const staleAnswerResultText =
    /[\wÅÄÖåäö][^'"`\n]*\s—\s(?:Correct answer|Correct|Wrong|Rätt svar|Fel)/g;

  const violations = [];
  for (const filePath of browserSpecPaths) {
    const source = fs.readFileSync(filePath, 'utf8');
    violations.push(...collectMatches({ pattern: staleAnswerResultText, source, filePath }));
  }

  assert.deepEqual(
    violations,
    [],
    'assert answer-result states through the current runtime accessibility/copy contract, e.g. "Answer text, Wrong"',
  );
});

test('about Swedish copy browser spec covers route, first-run guide, and English preservation', () => {
  const source = readRelative('about-test-sv-copy.spec.ts');

  assert.match(
    source,
    /about-the-test route uses Swedish settings copy without mockprov wording/,
    'about Swedish copy e2e should cover the route-level Swedish copy',
  );
  assert.match(
    source,
    /first-run about guide follows Swedish settings copy without mockprov wording/,
    'about Swedish copy e2e should cover the first-run guide modal',
  );
  assert.match(
    source,
    /about route keeps intentional English guide copy available/,
    'about Swedish copy e2e should preserve intentional English wording',
  );
  assert.match(
    source,
    /forbiddenSwedishMockprovCopy\s*=\s*\/mockprov\|mock-provet\/i/,
    'about Swedish copy e2e should reject stale Swedish mockprov wording',
  );
  assert.match(
    source,
    /getByText\('övningsprov från andra aktörer'\)/,
    'about Swedish copy e2e should assert app-standard övningsprov wording',
  );
  assert.match(
    source,
    /getByRole\('link', \{ name: 'Öppna guiden om medborgarskapsprovet' \}\)/,
    'about Swedish copy e2e should assert the medborgarskapsprovet guide action',
  );
  assert.match(
    source,
    /getByText\('practice tests from other actors'\)/,
    'about Swedish copy e2e should keep intentional English practice-test copy available',
  );
});

test('learn chapter navigation derives the rendered chapter total from questions data', () => {
  const source = readRelative('learn-chapter-navigation.spec.ts');

  assert.match(
    source,
    /import\s+\{\s*questions\s*\}\s+from\s+['"]\.\.\/\.\.\/data\/questions['"]/,
    'learn chapter navigation spec should import the runtime question data',
  );
  assert.match(
    source,
    /questions\.filter\(\s*\(?question\)?\s*=>\s*question\.chapterId\s*===\s*['"]ch01['"],?\s*\)\.length/,
    'learn chapter navigation spec should calculate the ch01 total from data/questions',
  );
});

test('learn chapter navigation covers localized back-link round trips', () => {
  const source = readRelative('learn-chapter-navigation.spec.ts');

  assert.match(
    source,
    /page\.getByLabel\(['"]Tillbaka till kapitellistan['"]\)\.click\(\)/,
    'Swedish chapter navigation should activate the localized back link',
  );
  assert.match(
    source,
    /page\.getByLabel\(['"]Back to chapter list['"]\)/,
    'English chapter navigation should locate the localized back link',
  );
  assert.match(
    source,
    /await\s+backToChapterList\.click\(\);/,
    'English chapter navigation should activate the localized back link',
  );
  assert.match(
    source,
    /const returnedFirstChapter = page\.getByRole\('link', \{ name: englishFirstChapterLabel \}\);/,
    'English chapter navigation should verify the returned Learn card through a role-visible link query',
  );
  assert.match(
    source,
    /await expect\(page\)\.toHaveURL\(\/\\\/learn\$\/\);\s+const returnedFirstChapter = page\.getByRole\('link', \{ name: englishFirstChapterLabel \}\);\s+await expect\(returnedFirstChapter\)\.toHaveCount\(1\);/s,
    'English chapter navigation should verify the route returns to /learn before checking the returned card',
  );
  assert.doesNotMatch(
    source,
    /getByLabel\(englishFirstChapterLabel\)\.(?:first|last)\(\)/,
    'English chapter navigation must not select around retained hidden chapter links',
  );
  const chapterSource = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  assert.match(
    chapterSource,
    /accessibilityLabel=\{copy\.backToListAccessibilityLabel\}[\s\S]*href="\/learn"[\s\S]*replace[\s\S]*style=\{styles\.link\}/,
    'Chapter back links should replace the detail route instead of pushing a duplicate Learn route',
  );
  assert.match(
    source,
    /await expect\(returnedFirstChapter\)\.toContainText\(['"]The country of Sweden['"]\);[\s\S]*await expect\(returnedFirstChapter\)\.toContainText\(['"]Landet Sverige['"]\);[\s\S]*await expect\(returnedFirstChapter\)\.toContainText\(`0\/\$\{questionCount\} practiced`\);/,
    'English chapter navigation should verify language-specific chapter card copy after returning to Learn',
  );
});

test('routed quiz Back to Practice links use stack-aware route dismissal', () => {
  const source = readRelative('practice-feedback.spec.ts');
  const quizSource = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  const backToPracticeLinks =
    quizSource.match(
      /<Link\b[\s\S]*?accessibilityLabel=\{copy\.backToPracticeAccessibilityLabel\}[\s\S]*?<\/Link>/g,
    ) ?? [];

  assert.equal(
    backToPracticeLinks.length,
    3,
    'routed quiz should keep every Back to Practice link under the same navigation contract',
  );
  for (const backToPracticeLink of backToPracticeLinks) {
    assert.match(
      backToPracticeLink,
      /href="\/practice"/,
      'Back to Practice links should keep their /practice destination',
    );
    assert.match(
      backToPracticeLink,
      /\bdismissTo\b|\breplace\b/,
      'Back to Practice links should dismiss to or replace /practice instead of pushing a duplicate route',
    );
  }
  assert.match(
    source,
    /routed quiz Back to Practice and Tillbaka till övning return without retained quiz content/,
    'practice feedback e2e should cover localized routed quiz return links',
  );
  assert.match(
    source,
    /await expect\(page\)\.toHaveURL\(\/\\\/practice\\\/\?\$\/\);/,
    'routed quiz return e2e should verify the route lands on /practice',
  );
  assert.match(
    source,
    /await expect\(page\.getByRole\('heading', \{ name: scenario\.sessionHeading \}\)\)\.toHaveCount\(0\);/,
    'routed quiz return e2e should verify the old quiz heading is no longer role-queryable',
  );
  assert.doesNotMatch(
    source,
    /getByRole\('link', \{ name: scenario\.backLabel \}\)\.(?:first|last)\(\)/,
    'routed quiz return e2e should not select around retained hidden Back to Practice links',
  );
});

test('practice feedback specs target answer option accessibility result labels', () => {
  const source = readRelative('practice-feedback.spec.ts');

  for (const label of [
    'In the Nordic region in northern Europe, Correct',
    'In southern Europe, Wrong',
    'In the Nordic region in northern Europe, Correct answer',
    'I södra Europa, Fel',
    'I Norden i norra Europa, Rätt svar',
  ]) {
    assert.ok(
      source.includes(`getByLabel('${label}')`),
      `practice feedback spec should assert the runtime accessibility label "${label}"`,
    );
  }
});

test('Home copy specs use shared route setup and language picker helpers', () => {
  const browserLaunchSource = readRelative('browserLaunch.ts');
  const studyLoopSource = readRelative('home-study-loop-copy.spec.ts');
  const mistakeReviewSource = readRelative('home-sv-mistake-review-copy.spec.ts');

  assert.match(
    browserLaunchSource,
    /export async function setupHomeCopyRoute\(page: Page, language: AppLanguage\): Promise<void>/,
    'browserLaunch should expose shared Home route setup',
  );
  assert.match(
    browserLaunchSource,
    /export async function switchLanguageThroughTopBarPicker\(\s+page: Page,\s+language: AppLanguage,\s+\): Promise<void>/,
    'browserLaunch should expose shared top-bar language switching',
  );
  assert.match(
    browserLaunchSource,
    /getByRole\('menuitem', \{ name: language === 'sv' \? 'Swedish' : 'English' \}\)/,
    'language helper should pick localized menu items through one contract',
  );

  for (const [label, source] of [
    ['study loop', studyLoopSource],
    ['mistake review', mistakeReviewSource],
  ]) {
    assert.match(
      source,
      /collectConsoleAndPageErrors/,
      `${label} Home spec should share console and page error collection`,
    );
    assert.match(
      source,
      /setupHomeCopyRoute/,
      `${label} Home spec should share language seeding, navigation, and modal dismissal`,
    );
    assert.doesNotMatch(
      source,
      /function collectConsoleErrors|async function clickIfVisible|async function dismissBlockingModals/,
      `${label} Home spec should not define local launch or modal helpers`,
    );
  }

  assert.match(
    studyLoopSource,
    /switchLanguageThroughTopBarPicker\(page, 'en'\)/,
    'study loop Home spec should switch support language through the shared picker helper',
  );
  assert.doesNotMatch(
    studyLoopSource,
    /getByRole\('menuitem', \{ name: 'English' \}\)/,
    'study loop Home spec should not manually drive language menu internals',
  );
});

test('countdown browser date coverage uses the shared clock helper', () => {
  const browserLaunchSource = readRelative('browserLaunch.ts');
  const countdownSource = readRelative('countdown-banner-source-affordance.spec.ts');

  assert.match(
    browserLaunchSource,
    /export async function mockBrowserDate\(page: Page, fixedDate: string \| Date\): Promise<void>/,
    'browserLaunch should export the shared browser clock helper',
  );
  assert.match(
    browserLaunchSource,
    /page\.addInitScript\(\(mockedNow: number\) => \{/,
    'mockBrowserDate should install the clock before the app script runs',
  );
  assert.match(
    browserLaunchSource,
    /if \(!new\.target\) \{\s+return new RealDate\(mockedNow\)\.toString\(\);/s,
    'mockBrowserDate should preserve callable Date() behavior',
  );
  assert.match(
    browserLaunchSource,
    /MockDate\.now = \(\) => mockedNow/,
    'mockBrowserDate should pin Date.now as well as new Date()',
  );
  assert.match(
    countdownSource,
    /import \{ dismissBlockingModals, mockBrowserDate \} from '\.\/browserLaunch';/,
    'countdown e2e coverage should import the shared browser clock helper',
  );
  assert.match(
    countdownSource,
    /await mockBrowserDate\(page, '2026-05-21T12:00:00\.000Z'\);/,
    'countdown e2e coverage should pin the browser before route navigation',
  );
});

test('static site privacy grep focus stays isolated to privacy assertions', () => {
  const privacySource = readRelative('static-site-network-privacy.spec.ts');
  const networkSource = readRelative('static-site-network-fonts.spec.ts');
  const privacyTitles = Array.from(privacySource.matchAll(/test\('([^']+)'/g), (match) => match[1]);

  assert.deepEqual(privacyTitles, [
    'privacy route renders localized plain-language callout labels',
    'privacy and consent copy describe unconfigured AdSense slots in both languages',
  ]);
  assert.ok(
    privacyTitles.every((title) => /privacy|consent/i.test(title)),
    'the documented --grep "privacy" command should select only privacy or consent assertions',
  );
  assert.doesNotMatch(
    privacySource,
    /Google Fonts|font fallback|primary routes inside/i,
    'static-site-network-privacy.spec.ts must not contain broad font or route-overflow smokes',
  );
  assert.match(
    networkSource,
    /static site first load and necessary-only consent do not request Google Fonts/,
    'Google Fonts request trapping should stay covered in the neutral network spec',
  );
  assert.match(
    networkSource,
    /static system font fallback keeps primary routes inside mobile and desktop viewports/,
    'primary route overflow coverage should stay covered in the neutral network spec',
  );
});

test('static site network specs share one external request trap helper', () => {
  const helperSource = readRelative('staticSiteNetworkGuards.ts');
  const privacySource = readRelative('static-site-network-privacy.spec.ts');
  const networkSource = readRelative('static-site-network-fonts.spec.ts');

  assert.match(
    helperSource,
    /export async function trapExternalRequests\(\s*page: Page,\s*allowedOrigin: string,\s*capturedGoogleFontRequests\?: string\[\],\s*\): Promise<void>/,
    'static-site network request trapping should be owned by the shared helper with an optional capture array',
  );
  assert.match(
    helperSource,
    /capturedGoogleFontRequests\?\.push\(url\)/,
    'the shared request trap should collect blocked Google Font requests when a caller asks for them',
  );

  for (const [fileName, source] of [
    ['static-site-network-privacy.spec.ts', privacySource],
    ['static-site-network-fonts.spec.ts', networkSource],
  ]) {
    assert.match(
      source,
      /import\s+\{\s*trapExternalRequests\s*\}\s+from\s+['"]\.\/staticSiteNetworkGuards['"]/,
      `${fileName} should import the shared request trap helper`,
    );
    assert.doesNotMatch(
      source,
      /(?:async\s+)?function\s+trapExternalRequests\b|(?:const|let|var)\s+trapExternalRequests\b/,
      `${fileName} must not define a route-local request trap copy`,
    );
  }

  assert.deepEqual(
    callArgumentCounts(privacySource, 'trapExternalRequests'),
    [2, 2],
    'privacy network coverage should use the shared helper without a capture array',
  );
  assert.deepEqual(
    callArgumentCounts(networkSource, 'trapExternalRequests'),
    [3, 3],
    'font/network coverage should use the shared helper with an explicit capture array',
  );
  assert.match(
    networkSource,
    /const googleFontRequests: string\[\] = \[\];[\s\S]*trapExternalRequests\(page, new URL\(staticSite\.baseUrl\)\.origin, googleFontRequests\)/,
    'Google Fonts coverage should pass a named captured-request array to the shared helper',
  );
});

test('browser specs do not define local Date browser clock stubs', () => {
  const forbiddenClockStubPatterns = [
    /\b(?:window|globalThis)\.Date\s*=/g,
    /\bDate\.now\s*=/g,
    /\bclass\s+\w*Date\s+extends\s+Date\b/g,
    /\b(?:RealDate|OriginalDate|NativeDate)\b/g,
  ];

  const violations = [];
  for (const filePath of browserSpecPaths) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const pattern of forbiddenClockStubPatterns) {
      violations.push(...collectMatches({ pattern, source, filePath }));
    }
  }

  assert.deepEqual(
    violations,
    [],
    'use mockBrowserDate from tests/e2e/browserLaunch.ts instead of local Date constructor or Date.now stubs',
  );
});

test('Home browser specs use the shared setup and error harness', () => {
  const homeSpecNames = [
    'home-link-targets.spec.ts',
    'home-preparation-signal-copy.spec.ts',
    'home-resume-cta.spec.ts',
  ];

  for (const specName of homeSpecNames) {
    const source = readRelative(specName);

    assert.match(
      source,
      /collectConsoleAndPageErrors/,
      `${specName} should collect browser failures through browserLaunch`,
    );
    assert.match(
      source,
      /seedFreshSettingsLanguageAndAboutSeen/,
      `${specName} should seed Home state through browserLaunch`,
    );
    assert.match(
      source,
      /dismissBlockingModals/,
      `${specName} should use the shared blocking-modal dismissal helper`,
    );
    assert.doesNotMatch(
      source,
      /function\s+collectConsoleErrors|page\.on\(['"]console['"]|page\.on\(['"]pageerror['"]/,
      `${specName} should not define a local console/page error collector`,
    );
    assert.doesNotMatch(
      source,
      /page\.addInitScript|window\.localStorage\.clear\(\)|settings\\\\language|settings\\\\hasSeenAboutTheTest/,
      `${specName} should not duplicate browserLaunch localStorage setup`,
    );
    assert.doesNotMatch(
      source,
      /getByRole\(['"]button['"],\s*\{[^}]*name:\s*\/.*(?:Language picker|Språkväljare)/s,
      `${specName} should not use stale LanguagePicker button selectors`,
    );
  }
});

test('dist-web e2e server releases the default port on SIGTERM', async () => {
  const source = readRelative('serve-dist-web.cjs');
  assert.match(
    source,
    /process\.once\('SIGTERM', shutdown\);/,
    'serve-dist-web should install a SIGTERM handler',
  );
  assert.match(
    source,
    /process\.once\('SIGINT', shutdown\);/,
    'serve-dist-web should install a SIGINT handler',
  );
  assert.match(source, /server\.close\(/, 'serve-dist-web should close the HTTP server');

  const port = 4173;
  await assertPortCanBind(port);

  const outputDir = createPreparedDistWebFixture();
  const child = spawn(process.execPath, [path.join(e2eDir, 'serve-dist-web.cjs')], {
    cwd: path.resolve(e2eDir, '../..'),
    env: {
      ...process.env,
      DIST_WEB_ROOT: outputDir,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServerReady(child);
    const exited = waitForExit(child);
    child.kill('SIGTERM');
    const result = await exited;

    assert.equal(result.code, 0, 'SIGTERM shutdown should exit cleanly');
    assert.equal(
      result.signal,
      null,
      'SIGTERM should be handled instead of surfacing as a signal exit',
    );
    await assertPortCanBind(port);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
    fs.rmSync(outputDir, { force: true, recursive: true });
  }
});

test('static-site e2e server releases the default port on SIGTERM', async () => {
  const source = readRelative('serve-static-site.cjs');
  assert.match(
    source,
    /process\.once\('SIGTERM', shutdown\);/,
    'serve-static-site should install a SIGTERM handler',
  );
  assert.match(
    source,
    /process\.once\('SIGINT', shutdown\);/,
    'serve-static-site should install a SIGINT handler',
  );
  assert.match(source, /server\.close\(/, 'serve-static-site should close the HTTP server');

  const port = 4173;
  await assertPortCanBind(port);

  const child = spawn(process.execPath, [path.join(e2eDir, 'serve-static-site.cjs')], {
    cwd: path.resolve(e2eDir, '../..'),
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServerReady(child, `Serving static site on http://127.0.0.1:${port}`);
    const exited = waitForExit(child);
    child.kill('SIGTERM');
    const result = await exited;

    assert.equal(result.code, 0, 'SIGTERM shutdown should exit cleanly');
    assert.equal(
      result.signal,
      null,
      'SIGTERM should be handled instead of surfacing as a signal exit',
    );
    await assertPortCanBind(port);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
  }
});
