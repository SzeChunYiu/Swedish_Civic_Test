const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function loadTypescriptModule(relativePath) {
  const { outputText } = ts.transpileModule(read(relativePath), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: relativePath,
  });
  const module = { exports: {} };

  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      URL,
    },
    { filename: relativePath },
  );

  return module.exports;
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

function valuesForFieldInConstArray(source, constName, fieldName) {
  const escapedConstName = escapeRegExp(constName);
  const match = source.match(
    new RegExp(`export const ${escapedConstName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as const`),
  );

  assert.notEqual(match, null, `${constName} should be declared as a readonly array`);

  return valuesForFieldInSource(match[1], fieldName);
}

function extractStackScreenNames(rootLayoutSource) {
  return Array.from(
    rootLayoutSource.matchAll(/<Stack\.Screen\s+name=(["'])([^"']+)\1/g),
    (match) => match[2],
  );
}

function extractTabScreenNames(tabLayoutSource) {
  return Array.from(
    tabLayoutSource.matchAll(/<Tabs\.Screen\s+name=(["'])([^"']+)\1/g),
    (match) => match[2],
  );
}

function readRouterShellManifest() {
  const manifest = read('lib/scaffold/routerShellManifest.ts');

  return {
    files: valuesForFieldInConstArray(manifest, 'expoRouterShellFiles', 'file'),
    roles: valuesForFieldInSource(manifest, 'role'),
    recoveryHrefs: valuesInConstArray(manifest, 'expoRouterShellRecoveryHrefs'),
    rootStackScreenNames: valuesForFieldInConstArray(
      manifest,
      'expoRouterRootStackScreens',
      'name',
    ),
    rootStackScreenFiles: valuesForFieldInConstArray(
      manifest,
      'expoRouterRootStackScreens',
      'file',
    ),
    tabScreenNames: valuesForFieldInConstArray(manifest, 'expoRouterTabScreens', 'name'),
    tabScreenFiles: valuesForFieldInConstArray(manifest, 'expoRouterTabScreens', 'file'),
    tabScreenCopyKeys: valuesForFieldInConstArray(manifest, 'expoRouterTabScreens', 'copyKey'),
    dynamicRouteNames: valuesForFieldInConstArray(manifest, 'expoRouterDynamicRoutes', 'name'),
    dynamicRouteFiles: valuesForFieldInConstArray(manifest, 'expoRouterDynamicRoutes', 'file'),
    dynamicRouteHrefSamples: valuesForFieldInConstArray(
      manifest,
      'expoRouterDynamicRoutes',
      'hrefSample',
    ),
    nativeIntentStaticRoutes: valuesInConstArray(manifest, 'expoRouterNativeIntentStaticRoutes'),
    nativeIntentDynamicRoutes: valuesForFieldInSource(manifest, 'route'),
    nativeIntentDynamicRouteFiles: valuesForFieldInSource(manifest, 'routeFile'),
    nativeIntentDynamicPatternNames: valuesForFieldInSource(manifest, 'patternName'),
    nativeIntentDynamicSamplePaths: valuesForFieldInSource(manifest, 'samplePath'),
    nativeIntentRuntimeSampleInputs: valuesForFieldInSource(manifest, 'input'),
    nativeIntentRuntimeSampleExpectedPaths: valuesForFieldInSource(manifest, 'expectedPath'),
    nativeIntentConfigFiles: valuesInConstArray(manifest, 'expoRouterNativeIntentConfigFiles'),
    webDocumentMetaDescriptionLanguages: valuesForFieldInConstArray(
      manifest,
      'expoRouterWebDocumentMetaDescriptions',
      'language',
    ),
    webDocumentMetaDescriptions: valuesForFieldInConstArray(
      manifest,
      'expoRouterWebDocumentMetaDescriptions',
      'description',
    ),
    standaloneRouteNames: valuesForFieldInConstArray(
      manifest,
      'expoRouterStandaloneRoutes',
      'name',
    ),
    standaloneRouteFiles: valuesForFieldInConstArray(
      manifest,
      'expoRouterStandaloneRoutes',
      'file',
    ),
    standaloneRouteHrefs: valuesForFieldInConstArray(
      manifest,
      'expoRouterStandaloneRoutes',
      'href',
    ),
    standaloneHeaderHiddenRoutes: valuesInConstArray(
      manifest,
      'expoRouterStandaloneHeaderHiddenRoutes',
    ),
    notFoundRouteNames: valuesForFieldInSource(manifest, 'notFoundRouteName'),
    notFoundHeaderModes: valuesForFieldInSource(manifest, 'notFoundHeaderMode'),
    rootStackHeaderModes: valuesForFieldInSource(manifest, 'rootStackHeaderMode'),
    notFoundRedirectHrefs: valuesForFieldInSource(manifest, 'notFoundRedirectHref'),
    notFoundFileProtocolFallbacks: valuesForFieldInSource(manifest, 'notFoundFileProtocolFallback'),
    webLanguages: valuesForFieldInSource(manifest, 'webLanguage'),
    webAppShellMarkers: valuesForFieldInSource(manifest, 'webAppShellMarker'),
    themeColorTokens: valuesForFieldInSource(manifest, 'themeColorToken'),
    statusBarStyles: valuesForFieldInSource(manifest, 'statusBarStyle'),
    nativeFallbackHrefs: valuesForFieldInSource(manifest, 'nativeFallbackHref'),
    appSchemes: valuesForFieldInSource(manifest, 'appScheme'),
  };
}

test('router shell fallback is registered in the root Expo stack', () => {
  const rootLayout = read('app/_layout.tsx');

  assertMatches(rootLayout, /<Stack\b/, 'root layout should render the Expo Router stack');
  assertMatches(
    rootLayout,
    /<Stack\s+screenOptions=\{\{\s*headerShown:\s*false\s*\}\}>/,
    'root stack should hide standalone route headers so in-page localized headers are the only visible headings',
  );
  assertMatches(
    rootLayout,
    /<Stack\.Screen\s+name=["']\+not-found["']\s*\/>/,
    'root stack should register the not-found recovery route under the hidden root header contract',
  );
  assertMatches(
    rootLayout,
    /SystemUI\.setBackgroundColorAsync\(colors\.canvas\)/,
    'native shell background should follow the theme canvas color',
  );
  assertMatches(
    rootLayout,
    /<LaunchPopupAd\s+entitlements=\{monetizationEntitlements\}\s*\/>/,
    'root shell should keep launch ad placement wired with resolved entitlements',
  );
  assertMatches(
    rootLayout,
    /<StatusBar[\s\S]*style=["']auto["']/,
    'status bar should stay on the Expo shell auto style',
  );
});

const nativeIntentStaticRouteFiles = {
  '/': 'app/index.tsx',
  '/disclaimer': 'app/disclaimer.tsx',
  '/exam': 'app/(tabs)/exam.tsx',
  '/home': 'app/(tabs)/home.tsx',
  '/learn': 'app/(tabs)/learn.tsx',
  '/mistakes': 'app/(tabs)/mistakes.tsx',
  '/onboarding': 'app/onboarding.tsx',
  '/practice': 'app/(tabs)/practice.tsx',
  '/privacy': 'app/privacy.tsx',
  '/profile': 'app/(tabs)/profile.tsx',
  '/settings': 'app/settings.tsx',
  '/sources': 'app/sources.tsx',
  '/support': 'app/support.tsx',
  '/terms': 'app/terms.tsx',
};

const nativeIntentDynamicRouteFiles = {
  '/chapter/[chapterId]': {
    routeFile: 'app/chapter/[chapterId].tsx',
    patternName: 'chapterRoutePattern',
    samplePath: '/chapter/ch01',
    patternLiteral: 'const chapterRoutePattern = /^\\/chapter\\/ch\\d{2}$/;',
  },
  '/quiz/[sessionId]': {
    routeFile: 'app/quiz/[sessionId].tsx',
    patternName: 'quizRoutePattern',
    samplePath: '/quiz/q001',
    patternLiteral: 'const quizRoutePattern = /^\\/quiz\\/[A-Za-z0-9_-]+$/;',
  },
};

const nativeIntentRuntimeSamples = [
  {
    input: '   ',
    expectedPath: '/home',
  },
  {
    input: '/practice?mode=review#question',
    expectedPath: '/practice?mode=review#question',
  },
  {
    input: 'swedish-civic-test://app/chapter/ch01?from=learn',
    expectedPath: '/chapter/ch01?from=learn',
  },
  {
    input: 'swedish-civic-test://quiz/q001',
    expectedPath: '/quiz/q001',
  },
  {
    input: 'swedish-civic-test://app/not-real',
    expectedPath: '/home',
  },
];

const nativeIntentConfigFiles = ['app.json', 'app/+native-intent.ts'];

const rootStackScreens = [
  {
    name: 'index',
    file: 'app/index.tsx',
  },
  {
    name: '(tabs)',
    file: 'app/(tabs)/_layout.tsx',
  },
  {
    name: '+not-found',
    file: 'app/+not-found.tsx',
  },
];

const tabScreens = [
  {
    name: 'home',
    file: 'app/(tabs)/home.tsx',
    copyKey: 'home',
  },
  {
    name: 'learn',
    file: 'app/(tabs)/learn.tsx',
    copyKey: 'learn',
  },
  {
    name: 'practice',
    file: 'app/(tabs)/practice.tsx',
    copyKey: 'practice',
  },
  {
    name: 'exam',
    file: 'app/(tabs)/exam.tsx',
    copyKey: 'exam',
  },
  {
    name: 'mistakes',
    file: 'app/(tabs)/mistakes.tsx',
    copyKey: 'mistakes',
  },
  {
    name: 'profile',
    file: 'app/(tabs)/profile.tsx',
    copyKey: 'profile',
  },
];

const dynamicRoutes = [
  {
    name: 'chapter/[chapterId]',
    file: 'app/chapter/[chapterId].tsx',
    hrefSample: '/chapter/ch01',
  },
  {
    name: 'quiz/[sessionId]',
    file: 'app/quiz/[sessionId].tsx',
    hrefSample: '/quiz/q001',
  },
];

const webDocumentMetaDescriptions = [
  {
    language: 'sv',
    description: 'Öva svensk samhällskunskap med offlinequiz, lokala framsteg och källreferenser.',
  },
  {
    language: 'en',
    description:
      'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.',
  },
];

const standaloneRoutes = [
  {
    name: 'disclaimer',
    file: 'app/disclaimer.tsx',
    href: '/disclaimer',
  },
  {
    name: 'onboarding',
    file: 'app/onboarding.tsx',
    href: '/onboarding',
  },
  {
    name: 'privacy',
    file: 'app/privacy.tsx',
    href: '/privacy',
  },
  {
    name: 'settings',
    file: 'app/settings.tsx',
    href: '/settings',
  },
  {
    name: 'sources',
    file: 'app/sources.tsx',
    href: '/sources',
  },
  {
    name: 'support',
    file: 'app/support.tsx',
    href: '/support',
  },
  {
    name: 'terms',
    file: 'app/terms.tsx',
    href: '/terms',
  },
];

test('native intent static route allowlist stays aligned with route files', () => {
  const manifest = readRouterShellManifest();
  const nativeIntent = read('app/+native-intent.ts');

  assert.deepEqual(manifest.nativeIntentStaticRoutes, Object.keys(nativeIntentStaticRouteFiles));

  for (const [route, routeFile] of Object.entries(nativeIntentStaticRouteFiles)) {
    assertContains(
      nativeIntent,
      `  '${route}',`,
      `${route} should remain accepted by native intent routing`,
    );
    assert.equal(
      fs.existsSync(path.join(repoRoot, routeFile)),
      true,
      `${route} should resolve to an existing route file`,
    );
  }
});

test('native intent dynamic route allowlist stays aligned with route files', () => {
  const manifest = readRouterShellManifest();
  const nativeIntent = read('app/+native-intent.ts');
  const dynamicRouteRecords = Object.values(nativeIntentDynamicRouteFiles);

  assert.deepEqual(manifest.nativeIntentDynamicRoutes, Object.keys(nativeIntentDynamicRouteFiles));
  assert.deepEqual(
    manifest.nativeIntentDynamicRouteFiles,
    dynamicRouteRecords.map((record) => record.routeFile),
  );
  assert.deepEqual(
    manifest.nativeIntentDynamicPatternNames,
    dynamicRouteRecords.map((record) => record.patternName),
  );
  assert.deepEqual(
    manifest.nativeIntentDynamicSamplePaths,
    dynamicRouteRecords.map((record) => record.samplePath),
  );

  for (const record of dynamicRouteRecords) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, record.routeFile)),
      true,
      `${record.routeFile} should resolve to an existing dynamic route file`,
    );
    assertContains(
      nativeIntent,
      record.patternLiteral,
      `${record.patternName} should remain defined in native intent routing`,
    );
    assertContains(
      nativeIntent,
      `${record.patternName}.test(pathname)`,
      `${record.patternName} should remain part of known study route detection`,
    );
  }
});

test('native intent runtime samples normalize study links and fall back safely', () => {
  const manifest = readRouterShellManifest();
  const { redirectSystemPath } = loadTypescriptModule('app/+native-intent.ts');

  assert.deepEqual(
    manifest.nativeIntentRuntimeSampleInputs,
    nativeIntentRuntimeSamples.map((sample) => sample.input),
  );
  assert.deepEqual(
    manifest.nativeIntentRuntimeSampleExpectedPaths,
    nativeIntentRuntimeSamples.map((sample) => sample.expectedPath),
  );

  assert.equal(typeof redirectSystemPath, 'function');
  for (const sample of nativeIntentRuntimeSamples) {
    assert.equal(
      redirectSystemPath({ initial: true, path: sample.input }),
      sample.expectedPath,
      `${sample.input} should resolve to ${sample.expectedPath}`,
    );
  }
});

test('native intent app scheme stays aligned with Expo app config', () => {
  const manifest = readRouterShellManifest();
  const appConfig = readJson('app.json').expo;
  const nativeIntent = read('app/+native-intent.ts');
  const { redirectSystemPath } = loadTypescriptModule('app/+native-intent.ts');
  const [appScheme] = manifest.appSchemes;

  assert.deepEqual(manifest.nativeIntentConfigFiles, nativeIntentConfigFiles);
  for (const relativePath of manifest.nativeIntentConfigFiles) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, relativePath)),
      true,
      `${relativePath} should remain part of the native intent config contract`,
    );
  }

  assert.equal(appConfig.scheme, appScheme);
  assertContains(nativeIntent, `const APP_LINK_BASE = '${appScheme}://app';`);
  assert.equal(
    redirectSystemPath({
      initial: true,
      path: `${appScheme}://app/learn?from=config#section`,
    }),
    '/learn?from=config#section',
  );
  assert.equal(redirectSystemPath({ initial: true, path: `${appScheme}://practice` }), '/practice');
});

test('initial route redirects into the Home tab shell', () => {
  const indexRoute = read('app/index.tsx');

  assertMatches(
    indexRoute,
    /import\s+\{\s*Redirect\s*\}\s+from ['"]expo-router['"]/,
    'initial route should use the Expo Router redirect primitive',
  );
  assertMatches(
    indexRoute,
    /<Redirect\s+href=["']\/home["']\s*\/>/,
    'initial route should keep Home as the app entry point',
  );
});

test('root stack screen manifest stays aligned with the root layout', () => {
  const manifest = readRouterShellManifest();
  const rootLayout = read('app/_layout.tsx');

  assert.deepEqual(
    manifest.rootStackScreenNames,
    rootStackScreens.map((screen) => screen.name),
  );
  assert.deepEqual(
    manifest.rootStackScreenFiles,
    rootStackScreens.map((screen) => screen.file),
  );
  assert.deepEqual(extractStackScreenNames(rootLayout), manifest.rootStackScreenNames);

  for (const screen of rootStackScreens) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, screen.file)),
      true,
      `${screen.file} should resolve to an existing root stack screen`,
    );
    assertMatches(
      rootLayout,
      new RegExp(`<Stack\\.Screen\\s+name=["']${escapeRegExp(screen.name)}["']\\s*\\/>`),
      `${screen.name} should remain registered in the root stack`,
    );
  }
});

test('tab screen manifest stays aligned with the primary tab layout', () => {
  const manifest = readRouterShellManifest();
  const tabLayout = read('app/(tabs)/_layout.tsx');

  assert.deepEqual(
    manifest.tabScreenNames,
    tabScreens.map((screen) => screen.name),
  );
  assert.deepEqual(
    manifest.tabScreenFiles,
    tabScreens.map((screen) => screen.file),
  );
  assert.deepEqual(
    manifest.tabScreenCopyKeys,
    tabScreens.map((screen) => screen.copyKey),
  );
  assert.deepEqual(extractTabScreenNames(tabLayout), manifest.tabScreenNames);

  for (const screen of tabScreens) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, screen.file)),
      true,
      `${screen.file} should resolve to an existing tab screen`,
    );
    assertMatches(
      tabLayout,
      new RegExp(
        `<Tabs\\.Screen\\s+name=["']${escapeRegExp(
          screen.name,
        )}["']\\s+options=\\{getTabOptions\\(copy\\.${escapeRegExp(screen.copyKey)}\\)\\}\\s*\\/>`,
      ),
      `${screen.name} should stay registered with localized accessible tab options`,
    );
  }
});

test('standalone route manifest stays aligned with file-based support routes', () => {
  const manifest = readRouterShellManifest();
  const nativeIntent = read('app/+native-intent.ts');

  assert.deepEqual(
    manifest.standaloneRouteNames,
    standaloneRoutes.map((route) => route.name),
  );
  assert.deepEqual(
    manifest.standaloneRouteFiles,
    standaloneRoutes.map((route) => route.file),
  );
  assert.deepEqual(
    manifest.standaloneRouteHrefs,
    standaloneRoutes.map((route) => route.href),
  );
  assert.deepEqual(
    manifest.standaloneHeaderHiddenRoutes,
    standaloneRoutes.map((route) => route.name),
  );

  for (const route of standaloneRoutes) {
    const routeSource = read(route.file);

    assert.equal(
      fs.existsSync(path.join(repoRoot, route.file)),
      true,
      `${route.file} should resolve to an existing standalone route file`,
    );
    assertMatches(routeSource, /export\s+default\s+/, `${route.file} should export a route`);
    assertContains(
      nativeIntent,
      `  '${route.href}',`,
      `${route.href} should remain accepted by native intent routing`,
    );
  }
});

test('dynamic route manifest stays aligned with file-based study routes', () => {
  const manifest = readRouterShellManifest();

  assert.deepEqual(
    manifest.dynamicRouteNames,
    dynamicRoutes.map((route) => route.name),
  );
  assert.deepEqual(
    manifest.dynamicRouteFiles,
    dynamicRoutes.map((route) => route.file),
  );
  assert.deepEqual(
    manifest.dynamicRouteHrefSamples,
    dynamicRoutes.map((route) => route.hrefSample),
  );
  assert.deepEqual(
    manifest.dynamicRouteFiles,
    manifest.nativeIntentDynamicRouteFiles,
    'dynamic route files should stay aligned with native-intent dynamic route recovery',
  );
  assert.deepEqual(
    manifest.dynamicRouteHrefSamples,
    manifest.nativeIntentDynamicSamplePaths,
    'dynamic route samples should stay executable through native-intent recovery',
  );

  for (const route of dynamicRoutes) {
    const routeSource = read(route.file);

    assert.equal(
      fs.existsSync(path.join(repoRoot, route.file)),
      true,
      `${route.file} should resolve to an existing dynamic route file`,
    );
    assertMatches(
      routeSource,
      /export\s+default\s+function\b/,
      `${route.file} should export a route`,
    );
    assert.equal(
      manifest.nativeIntentDynamicRoutes.includes(`/${route.name}`),
      true,
      `${route.name} should stay recoverable from native deep links`,
    );
  }
});

test('not-found route redirects unknown routes to Home with a file-export fallback', () => {
  const notFoundRoute = read('app/+not-found.tsx');

  assertMatches(
    notFoundRoute,
    /import\s+\{\s*Redirect\s*\}\s+from ['"]expo-router['"]/,
    'fallback route should use the Expo Router redirect primitive',
  );
  assertMatches(
    notFoundRoute,
    /import\s+HomeScreen\s+from ['"]\.\/\(tabs\)\/home['"]/,
    'static file exports should keep a concrete Home fallback component',
  );
  assertMatches(
    notFoundRoute,
    /window\.location\.protocol\s+===\s+['"]file:['"]/,
    'fallback route should detect static file protocol exports',
  );
  assertMatches(
    notFoundRoute,
    /return\s+<HomeScreen\s*\/>/,
    'file protocol exports should render Home directly',
  );
  assertMatches(
    notFoundRoute,
    /<Redirect\s+href=["']\/home["']\s*\/>/,
    'runtime unknown routes should redirect to Home',
  );
});

test('web document shell keeps Swedish metadata and React Native web reset', () => {
  const manifest = readRouterShellManifest();
  const htmlShell = read('app/+html.tsx');

  assert.deepEqual(
    manifest.webDocumentMetaDescriptionLanguages,
    webDocumentMetaDescriptions.map((entry) => entry.language),
  );
  assert.deepEqual(
    manifest.webDocumentMetaDescriptions,
    webDocumentMetaDescriptions.map((entry) => entry.description),
  );
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
  assertContains(htmlShell, 'const webDocumentMetaDescription = {');
  for (const { language, description } of webDocumentMetaDescriptions) {
    assertContains(htmlShell, `${language}: '${description}'`);
  }
  assertContains(htmlShell, 'content={webDocumentMetaDescription.sv} name="description"');
});

test('router shell manifest stays aligned with special Expo Router files', () => {
  const manifest = readRouterShellManifest();
  const indexRoute = read('app/index.tsx');
  const rootLayout = read('app/_layout.tsx');
  const notFoundRoute = read('app/+not-found.tsx');
  const htmlShell = read('app/+html.tsx');
  const nativeIntent = read('app/+native-intent.ts');

  assert.deepEqual(manifest.files, [
    'app/index.tsx',
    'app/_layout.tsx',
    'app/+not-found.tsx',
    'app/+html.tsx',
    'app/+native-intent.ts',
  ]);
  assert.deepEqual(manifest.roles, [
    'initial-redirect',
    'root-layout',
    'not-found-route',
    'web-document',
    'native-intent',
  ]);
  assert.deepEqual(manifest.recoveryHrefs, ['/home']);
  assert.deepEqual(
    manifest.rootStackScreenNames,
    rootStackScreens.map((screen) => screen.name),
  );
  assert.deepEqual(
    manifest.rootStackScreenFiles,
    rootStackScreens.map((screen) => screen.file),
  );
  assert.deepEqual(
    manifest.tabScreenNames,
    tabScreens.map((screen) => screen.name),
  );
  assert.deepEqual(
    manifest.tabScreenFiles,
    tabScreens.map((screen) => screen.file),
  );
  assert.deepEqual(
    manifest.tabScreenCopyKeys,
    tabScreens.map((screen) => screen.copyKey),
  );
  assert.deepEqual(
    manifest.dynamicRouteNames,
    dynamicRoutes.map((route) => route.name),
  );
  assert.deepEqual(
    manifest.dynamicRouteFiles,
    dynamicRoutes.map((route) => route.file),
  );
  assert.deepEqual(
    manifest.dynamicRouteHrefSamples,
    dynamicRoutes.map((route) => route.hrefSample),
  );
  assert.deepEqual(manifest.nativeIntentStaticRoutes, Object.keys(nativeIntentStaticRouteFiles));
  assert.deepEqual(manifest.nativeIntentDynamicRoutes, Object.keys(nativeIntentDynamicRouteFiles));
  assert.deepEqual(
    manifest.nativeIntentDynamicRouteFiles,
    Object.values(nativeIntentDynamicRouteFiles).map((record) => record.routeFile),
  );
  assert.deepEqual(
    manifest.nativeIntentRuntimeSampleInputs,
    nativeIntentRuntimeSamples.map((sample) => sample.input),
  );
  assert.deepEqual(
    manifest.nativeIntentRuntimeSampleExpectedPaths,
    nativeIntentRuntimeSamples.map((sample) => sample.expectedPath),
  );
  assert.deepEqual(manifest.nativeIntentConfigFiles, nativeIntentConfigFiles);
  assert.deepEqual(
    manifest.webDocumentMetaDescriptionLanguages,
    webDocumentMetaDescriptions.map((entry) => entry.language),
  );
  assert.deepEqual(
    manifest.webDocumentMetaDescriptions,
    webDocumentMetaDescriptions.map((entry) => entry.description),
  );
  assert.deepEqual(
    manifest.standaloneRouteNames,
    standaloneRoutes.map((route) => route.name),
  );
  assert.deepEqual(
    manifest.standaloneRouteFiles,
    standaloneRoutes.map((route) => route.file),
  );
  assert.deepEqual(
    manifest.standaloneRouteHrefs,
    standaloneRoutes.map((route) => route.href),
  );
  assert.deepEqual(manifest.standaloneHeaderHiddenRoutes, [
    'disclaimer',
    'onboarding',
    'privacy',
    'settings',
    'sources',
    'support',
    'terms',
  ]);
  assert.deepEqual(manifest.notFoundRouteNames, ['+not-found']);
  assert.deepEqual(manifest.notFoundHeaderModes, ['hidden']);
  assert.deepEqual(manifest.rootStackHeaderModes, ['hidden']);
  assert.deepEqual(manifest.notFoundRedirectHrefs, ['/home']);
  assert.deepEqual(manifest.notFoundFileProtocolFallbacks, ['HomeScreen']);
  assert.deepEqual(manifest.webLanguages, ['sv']);
  assert.deepEqual(manifest.webAppShellMarkers, ['expo-router']);
  assert.deepEqual(manifest.themeColorTokens, ['colors.canvas']);
  assert.deepEqual(manifest.statusBarStyles, ['auto']);
  assert.deepEqual(manifest.nativeFallbackHrefs, ['/home']);
  assert.deepEqual(manifest.appSchemes, ['swedish-civic-test']);

  for (const file of manifest.files) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }

  assertMatches(
    rootLayout,
    /<Stack\s+screenOptions=\{\{\s*headerShown:\s*false\s*\}\}>/,
    'root stack should hide standalone route headers from the manifest contract',
  );
  for (const routeName of manifest.standaloneHeaderHiddenRoutes) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, `app/${routeName}.tsx`)),
      true,
      `${routeName} should stay covered by the hidden standalone header contract`,
    );
  }
  assertMatches(
    rootLayout,
    new RegExp(
      `<Stack\\.Screen\\s+name=["']${escapeRegExp(manifest.notFoundRouteNames[0])}["']\\s*\\/>`,
    ),
    'root stack should register the fallback route under the hidden header contract',
  );
  assertContains(rootLayout, `SystemUI.setBackgroundColorAsync(${manifest.themeColorTokens[0]})`);
  assertContains(rootLayout, `<StatusBar style="${manifest.statusBarStyles[0]}" />`);
  for (const href of manifest.recoveryHrefs) {
    assertMatches(
      indexRoute,
      new RegExp(`<Redirect\\s+href=["']${escapeRegExp(href)}["']\\s*\\/>`),
      `${href} should remain the initial redirect target`,
    );
    assertMatches(
      notFoundRoute,
      new RegExp(`<Redirect\\s+href=["']${escapeRegExp(href)}["']\\s*\\/>`),
      `${href} should remain the not-found redirect target`,
    );
  }
  assertContains(
    notFoundRoute,
    `return <${manifest.notFoundFileProtocolFallbacks[0]} />;`,
    'file protocol fallback should match the manifest component',
  );
  assertContains(
    htmlShell,
    `<html data-app-shell="${manifest.webAppShellMarkers[0]}" lang="${manifest.webLanguages[0]}">`,
  );
  assertContains(htmlShell, `content={${manifest.themeColorTokens[0]}} name="theme-color"`);
  for (const description of manifest.webDocumentMetaDescriptions) {
    assertContains(htmlShell, description);
  }
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
