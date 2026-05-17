const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertContains(source, literal, message) {
  assert.equal(source.includes(literal), true, message ?? `expected source to include ${literal}`);
}

function assertMatches(source, pattern, message) {
  assert.match(source, pattern, message);
}

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function valuesInConstArray(source, constName) {
  const escapedConstName = escapeRegExp(constName);
  const match = source.match(
    new RegExp(`export const ${escapedConstName}\\s*=\\s*\\[([\\s\\S]*?)\\]`),
  );

  assert.notEqual(match, null, `${constName} should be declared as a readonly array`);

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((arrayMatch) => arrayMatch[1]);
}

function valuesForFieldInSource(source, fieldName) {
  return [
    ...source.matchAll(new RegExp(`${escapeRegExp(fieldName)}:\\s*['"]([^'"]+)['"]`, 'g')),
  ].map((match) => match[1]);
}

function readRouterShellManifest() {
  const manifest = read('lib/scaffold/routerShellManifest.ts');

  return {
    files: valuesForFieldInSource(manifest, 'file'),
    roles: valuesForFieldInSource(manifest, 'role'),
    recoveryHrefs: valuesInConstArray(manifest, 'expoRouterShellRecoveryHrefs'),
    notFoundRouteNames: valuesForFieldInSource(manifest, 'notFoundRouteName'),
    notFoundTitles: valuesForFieldInSource(manifest, 'notFoundTitle'),
    webLanguages: valuesForFieldInSource(manifest, 'webLanguage'),
    webAppShellMarkers: valuesForFieldInSource(manifest, 'webAppShellMarker'),
    themeColorTokens: valuesForFieldInSource(manifest, 'themeColorToken'),
    nativeFallbackHrefs: valuesForFieldInSource(manifest, 'nativeFallbackHref'),
    appSchemes: valuesForFieldInSource(manifest, 'appScheme'),
  };
}

test('router shell fallback is registered in the root Expo stack', () => {
  const rootLayout = read('app/_layout.tsx');

  assertMatches(rootLayout, /<Stack\b/, 'root layout should render the Expo Router stack');
  assertMatches(
    rootLayout,
    /<Stack\.Screen\s+name=["']\+not-found["'][\s\S]*title:\s*["']Page not found["']/,
    'root stack should register the not-found recovery route with a stable title',
  );
  assertMatches(
    rootLayout,
    /SystemUI\.setBackgroundColorAsync\(colors\.canvas\)/,
    'native shell background should follow the theme canvas color',
  );
  assertContains(
    rootLayout,
    '<LaunchPopupAd />',
    'root shell should keep launch ad placement wired',
  );
  assertMatches(
    rootLayout,
    /<StatusBar[\s\S]*backgroundColor=\{colors\.canvas\}[\s\S]*style=["']dark["']/,
    'status bar should stay aligned with the light Expo shell theme',
  );
});

test('not-found route offers safe Home and Practice recovery actions', () => {
  const notFoundRoute = read('app/+not-found.tsx');

  assertContains(notFoundRoute, 'Page not found recovery screen');
  assertContains(notFoundRoute, 'Safe route recovery actions');
  assertMatches(
    notFoundRoute,
    /router\.replace\(["']\/home["']\)/,
    'fallback route should provide a safe Home recovery action',
  );
  assertMatches(
    notFoundRoute,
    /router\.replace\(["']\/practice["']\)/,
    'fallback route should provide a safe Practice recovery action',
  );
  assertContains(notFoundRoute, 'Return to study home');
  assertContains(notFoundRoute, 'Start practice from the route fallback');
});

test('web document shell keeps Swedish metadata and React Native web reset', () => {
  const htmlShell = read('app/+html.tsx');

  assertContains(htmlShell, '<html data-app-shell="expo-router" lang="sv">');
  assertContains(htmlShell, '<meta charSet="utf-8" />');
  assertMatches(
    htmlShell,
    /name=["']viewport["'][\s\S]*viewport-fit=cover|viewport-fit=cover[\s\S]*name=["']viewport["']/,
    'web shell should keep viewport-fit coverage for native-style safe areas',
  );
  assertMatches(
    htmlShell,
    /name=["']theme-color["'][\s\S]*content=\{colors\.canvas\}|content=\{colors\.canvas\}[\s\S]*name=["']theme-color["']/,
    'web shell theme color should follow theme canvas',
  );
  assertContains(htmlShell, '<ScrollViewStyleReset />');
  assertMatches(
    htmlShell,
    /<body[\s\S]*backgroundColor:\s*colors\.canvas/,
    'web body background should use the theme canvas color',
  );
  assertContains(
    htmlShell,
    'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.',
  );
});

test('router shell manifest stays aligned with special Expo Router files', () => {
  const manifest = readRouterShellManifest();
  const rootLayout = read('app/_layout.tsx');
  const notFoundRoute = read('app/+not-found.tsx');
  const htmlShell = read('app/+html.tsx');
  const nativeIntent = read('app/+native-intent.ts');

  assert.deepEqual(manifest.files, [
    'app/_layout.tsx',
    'app/+not-found.tsx',
    'app/+html.tsx',
    'app/+native-intent.ts',
  ]);
  assert.deepEqual(manifest.roles, [
    'root-layout',
    'not-found-route',
    'web-document',
    'native-intent',
  ]);
  assert.deepEqual(manifest.recoveryHrefs, ['/home', '/practice']);
  assert.deepEqual(manifest.notFoundRouteNames, ['+not-found']);
  assert.deepEqual(manifest.notFoundTitles, ['Page not found']);
  assert.deepEqual(manifest.webLanguages, ['sv']);
  assert.deepEqual(manifest.webAppShellMarkers, ['expo-router']);
  assert.deepEqual(manifest.themeColorTokens, ['colors.canvas']);
  assert.deepEqual(manifest.nativeFallbackHrefs, ['/home']);
  assert.deepEqual(manifest.appSchemes, ['swedish-civic-test']);

  for (const file of manifest.files) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }

  assertMatches(
    rootLayout,
    new RegExp(
      `name=["']${escapeRegExp(manifest.notFoundRouteNames[0])}["'][\\s\\S]*title:\\s*["']${escapeRegExp(manifest.notFoundTitles[0])}["']`,
    ),
    'root stack should match the fallback route manifest contract',
  );
  assertContains(rootLayout, `SystemUI.setBackgroundColorAsync(${manifest.themeColorTokens[0]})`);
  for (const href of manifest.recoveryHrefs) {
    assertMatches(
      notFoundRoute,
      new RegExp(`router\\.replace\\(["']${escapeRegExp(href)}["']\\)`),
      `${href} should remain a not-found recovery action`,
    );
  }
  assertContains(
    htmlShell,
    `<html data-app-shell="${manifest.webAppShellMarkers[0]}" lang="${manifest.webLanguages[0]}">`,
  );
  assertContains(htmlShell, `content={${manifest.themeColorTokens[0]}} name="theme-color"`);
  assertContains(nativeIntent, `const APP_LINK_BASE = '${manifest.appSchemes[0]}://app';`);
  assertMatches(
    nativeIntent,
    new RegExp(`return ["']${escapeRegExp(manifest.nativeFallbackHrefs[0])}["']`, 'g'),
    'native intent should keep the safe fallback route from the manifest',
  );
});

test('router shell tooling guard is wired into package scripts', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.scripts['test:router-shell'], 'node --test scripts/router-shell.test.js');
  assertMatches(
    pkg.scripts.test,
    /npm run test:router-shell/,
    'aggregate npm test should include the router shell scaffold guard',
  );
});
