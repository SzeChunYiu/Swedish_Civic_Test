const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const e2eDir = __dirname;
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

function waitForServerReady(child) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`dist-web server did not become ready:\n${output}`));
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeout);
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
      child.off('exit', onExit);
    };
    const onData = (data) => {
      output += data.toString();
      if (output.includes('Serving dist-web on http://127.0.0.1:4173')) {
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
    /const returnedFirstChapter = page\.getByLabel\(englishFirstChapterLabel\)\.last\(\);/,
    'English chapter navigation should verify the returned Learn card after using the back link',
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
