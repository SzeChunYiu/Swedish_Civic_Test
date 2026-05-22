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

function readAppScheme() {
  const appConfig = readJson('app.json').expo;

  assert.equal(typeof appConfig?.scheme, 'string');
  assert.notEqual(appConfig.scheme, '');

  return appConfig.scheme;
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

function extractStackScreenNames(rootLayoutSource) {
  return Array.from(
    rootLayoutSource.matchAll(/<Stack\.Screen\s+name=(["'])([^"']+)\1/g),
    (match) => match[2],
  );
}

function loadTsRuntime(relativePath, globals = {}) {
  const source = read(relativePath);
  const module = { exports: {} };
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  vm.runInNewContext(
    transpiled,
    {
      module,
      exports: module.exports,
      ...globals,
    },
    { filename: relativePath },
  );

  return module.exports;
}

function readRouterShellManifest() {
  const manifest = loadTsRuntime('lib/scaffold/routerShellManifest.ts');

  return {
    files: Array.from(manifest.expoRouterShellFiles, (entry) => entry.file),
    roles: Array.from(manifest.expoRouterShellFiles, (entry) => entry.role),
    rootStackScreenNames: Array.from(manifest.expoRouterRootStackScreens, (entry) => entry.name),
    rootStackScreenFiles: Array.from(manifest.expoRouterRootStackScreens, (entry) => entry.file),
    recoveryHrefs: Array.from(manifest.expoRouterShellRecoveryHrefs),
    standaloneHeaderHiddenRoutes: Array.from(manifest.expoRouterStandaloneHeaderHiddenRoutes),
    notFoundRouteNames: [manifest.expoRouterShellContract.notFoundRouteName],
    notFoundHeaderModes: [manifest.expoRouterShellContract.notFoundHeaderMode],
    rootStackHeaderModes: [manifest.expoRouterShellContract.rootStackHeaderMode],
    notFoundRedirectHrefs: [manifest.expoRouterShellContract.notFoundRedirectHref],
    notFoundFileProtocolFallbacks: [manifest.expoRouterShellContract.notFoundFileProtocolFallback],
    webLanguages: [manifest.expoRouterShellContract.webLanguage],
    webAppShellMarkers: [manifest.expoRouterShellContract.webAppShellMarker],
    themeColorTokens: [manifest.expoRouterShellContract.themeColorToken],
    statusBarStyles: [manifest.expoRouterShellContract.statusBarStyle],
    nativeFallbackHrefs: [manifest.expoRouterShellContract.nativeFallbackHref],
    appSchemes: [manifest.expoRouterShellContract.appScheme],
    webDescriptionLanguages: Array.from(
      manifest.expoRouterWebDocumentMetaDescriptions,
      (entry) => entry.language,
    ),
    webDescriptions: Array.from(
      manifest.expoRouterWebDocumentMetaDescriptions,
      (entry) => entry.description,
    ),
    nativeIntentStaticRoutes: Array.from(manifest.expoRouterNativeIntentStaticRoutes),
    nativeIntentRuntimeSampleInputs: Array.from(
      manifest.expoRouterNativeIntentRuntimeSamples,
      (entry) => entry.input,
    ),
    nativeIntentRuntimeSampleExpectedPaths: Array.from(
      manifest.expoRouterNativeIntentRuntimeSamples,
      (entry) => entry.expectedPath,
    ),
    nativeIntentConfigFiles: Array.from(manifest.expoRouterNativeIntentConfigFiles),
  };
}

function readWebDocumentMetadata() {
  return require('../lib/scaffold/webDocumentMetadata.js');
}

function loadNativeIntentRuntime() {
  return loadTsRuntime('app/+native-intent.ts', { URL });
}

test('router shell fallback is registered in the root Expo stack', () => {
  const rootLayout = read('app/_layout.tsx');

  assertMatches(rootLayout, /<Stack\b/, 'root layout should render the Expo Router stack');
  assertMatches(
    rootLayout,
    /<Stack\s+screenOptions=\{\{[\s\S]*headerShown:\s*true,[\s\S]*headerTitle:\s*'',[\s\S]*headerBackVisible:\s*false,[\s\S]*headerShadowVisible:\s*false,[\s\S]*headerStyle:\s*\{\s*backgroundColor:\s*themeColors\.canvas\s*\},[\s\S]*headerRight:\s*\(\)\s*=>\s*<LanguagePicker\s*\/>,[\s\S]*\}\}/,
    'root stack should expose the empty-title language picker header contract',
  );
  assertMatches(
    rootLayout,
    /<Stack\.Screen\s+name=["']\+not-found["']\s*\/>/,
    'root stack should register the not-found recovery route under the language picker header contract',
  );
  assertMatches(
    rootLayout,
    /useSystemCanvasColor\(themeColors\.canvas\)/,
    'native shell background should follow the theme canvas color',
  );
  assertMatches(
    rootLayout,
    /<LaunchPopupAd\s+entitlements=\{monetizationEntitlements\}\s*\/>/,
    'root shell should keep launch ad placement wired with resolved entitlements',
  );
  assertMatches(
    rootLayout,
    /<StatusBar\s+style=\{resolvedColorScheme === ['"]dark['"] \? ['"]light['"] : ['"]dark['"]\}\s*\/>/,
    'status bar should follow the resolved theme color scheme',
  );
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
  const htmlShell = read('app/+html.tsx');

  assertContains(
    htmlShell,
    "import { webDocumentMetadata } from '../lib/scaffold/webDocumentMetadata';",
  );
  assertContains(
    htmlShell,
    '<html data-app-shell="expo-router" lang={webDocumentMetadata.language}>',
  );
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
    '<meta content={webDocumentMetadata.description} name="description" />',
  );
  assertContains(
    htmlShell,
    '<meta content={webDocumentMetadata.openGraphDescription} property="og:description" />',
  );
});

test('web document metadata descriptions stay aligned with the router shell manifest', () => {
  const manifest = readRouterShellManifest();
  const { webDocumentDescriptionForLanguage, webDocumentMetadata, webDocumentMetaDescriptions } =
    readWebDocumentMetadata();
  const descriptionsByLanguage = Object.fromEntries(
    manifest.webDescriptionLanguages.map((language, index) => [
      language,
      manifest.webDescriptions[index],
    ]),
  );

  assert.deepEqual(manifest.webDescriptionLanguages, ['sv', 'en']);
  assert.deepEqual(
    webDocumentMetaDescriptions.map((entry) => entry.language),
    manifest.webDescriptionLanguages,
  );
  assert.equal(
    webDocumentMetadata.description,
    descriptionsByLanguage[webDocumentMetadata.language],
  );
  assert.equal(descriptionsByLanguage.sv, webDocumentDescriptionForLanguage('sv'));
  assert.equal(descriptionsByLanguage.en, webDocumentDescriptionForLanguage('en'));
  assert.equal(typeof descriptionsByLanguage.en, 'string');
  assert.notEqual(descriptionsByLanguage.en, '');
});

test('router shell manifest stays aligned with special Expo Router files', () => {
  const appScheme = readAppScheme();
  const manifest = readRouterShellManifest();
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
  assert.deepEqual(manifest.rootStackScreenNames, [
    'index',
    '(tabs)',
    'search',
    'dashboard',
    'citizenship-requirements',
    '+not-found',
  ]);
  assert.deepEqual(manifest.rootStackScreenFiles, [
    'app/index.tsx',
    'app/(tabs)/_layout.tsx',
    'app/search.tsx',
    'app/dashboard.tsx',
    'app/citizenship-requirements.tsx',
    'app/+not-found.tsx',
  ]);
  assert.deepEqual(manifest.recoveryHrefs, ['/home']);
  assert.deepEqual(manifest.standaloneHeaderHiddenRoutes, [
    'disclaimer',
    'onboarding',
    'privacy',
    'settings',
    'sources',
    'support',
    'terms',
    'about-the-test',
    'citizenship-requirements',
  ]);
  assert.deepEqual(manifest.notFoundRouteNames, ['+not-found']);
  assert.deepEqual(manifest.notFoundHeaderModes, ['visible-language-picker']);
  assert.deepEqual(manifest.rootStackHeaderModes, ['visible-language-picker']);
  assert.deepEqual(manifest.notFoundRedirectHrefs, ['/home']);
  assert.deepEqual(manifest.notFoundFileProtocolFallbacks, ['HomeScreen']);
  assert.deepEqual(manifest.webLanguages, ['sv']);
  assert.deepEqual(manifest.webAppShellMarkers, ['expo-router']);
  assert.deepEqual(manifest.themeColorTokens, ['colors.canvas']);
  assert.deepEqual(manifest.statusBarStyles, ['resolved-theme']);
  assert.deepEqual(manifest.nativeFallbackHrefs, ['/home']);
  assert.deepEqual(manifest.appSchemes, [appScheme]);
  assert.deepEqual(manifest.nativeIntentConfigFiles, ['app.json', 'app/+native-intent.ts']);
  assert.equal(
    manifest.nativeIntentStaticRoutes.includes('/about-the-test'),
    true,
    'native intent static route allowlist should include the about-the-test guide',
  );
  assert.equal(
    manifest.nativeIntentStaticRoutes.includes('/search'),
    true,
    'native intent static route allowlist should include the registered search route',
  );
  assert.equal(
    manifest.nativeIntentStaticRoutes.includes('/dashboard'),
    true,
    'native intent static route allowlist should include the registered dashboard route',
  );
  assert.equal(
    manifest.nativeIntentStaticRoutes.includes('/ebook'),
    true,
    'native intent static route allowlist should include the native ebook route',
  );
  assert.equal(
    manifest.nativeIntentStaticRoutes.includes('/citizenship-requirements'),
    true,
    'native intent static route allowlist should include the citizenship requirements guide',
  );
  assert.deepEqual(manifest.nativeIntentRuntimeSampleInputs.slice(0, 6), [
    '   ',
    '/practice?mode=review#question',
    '/about-the-test',
    '/citizenship-requirements',
    '/search?q=riksdag',
    '/ebook',
  ]);
  assert.deepEqual(manifest.nativeIntentRuntimeSampleExpectedPaths.slice(0, 6), [
    '/home',
    '/practice?mode=review#question',
    '/about-the-test',
    '/citizenship-requirements',
    '/search?q=riksdag',
    '/ebook',
  ]);

  for (const file of manifest.files) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
  for (const file of manifest.rootStackScreenFiles) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
  for (const file of manifest.nativeIntentConfigFiles) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }

  assert.deepEqual(
    extractStackScreenNames(rootLayout).sort(),
    [...manifest.rootStackScreenNames].sort(),
  );

  assertMatches(
    rootLayout,
    /<Stack\s+screenOptions=\{\{[\s\S]*headerShown:\s*true,[\s\S]*headerTitle:\s*'',[\s\S]*headerRight:\s*\(\)\s*=>\s*<LanguagePicker\s*\/>,[\s\S]*\}\}/,
    'root stack should expose the language picker header from the manifest contract',
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
    'root stack should register the fallback route under the language picker header contract',
  );
  assertContains(rootLayout, 'useSystemCanvasColor(themeColors.canvas);');
  assertContains(rootLayout, "resolvedColorScheme === 'dark' ? 'light' : 'dark'");
  for (const href of manifest.recoveryHrefs) {
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
    `<html data-app-shell="${manifest.webAppShellMarkers[0]}" lang={webDocumentMetadata.language}>`,
  );
  assertContains(htmlShell, `content={${manifest.themeColorTokens[0]}} name="theme-color"`);
  assertContains(nativeIntent, `const APP_SCHEME = '${appScheme}:';`);
  assertContains(nativeIntent, `const APP_LINK_BASE = '${appScheme}://app';`);
  assert.equal(
    manifest.nativeIntentRuntimeSampleInputs.some((input) => input.startsWith(`${appScheme}://`)),
    true,
    'native intent manifest should include configured app-scheme runtime samples',
  );
  for (const input of manifest.nativeIntentRuntimeSampleInputs) {
    if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(input) && !/^(https|ftp):\/\//.test(input)) {
      assert.equal(
        input.startsWith(`${appScheme}://`),
        true,
        `${input} should use app.json expo.scheme`,
      );
    }
  }
  assertMatches(
    nativeIntent,
    new RegExp(`return ["']${escapeRegExp(manifest.nativeFallbackHrefs[0])}["']`, 'g'),
    'native intent should keep the safe fallback route from the manifest',
  );
});

test('native intent runtime samples stay aligned with the router shell manifest', () => {
  const manifest = readRouterShellManifest();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(
    manifest.nativeIntentRuntimeSampleInputs.length,
    manifest.nativeIntentRuntimeSampleExpectedPaths.length,
    'native intent runtime sample inputs and expected paths should stay paired',
  );

  manifest.nativeIntentRuntimeSampleInputs.forEach((input, index) => {
    assert.equal(
      redirectSystemPath({ initial: true, path: input }),
      manifest.nativeIntentRuntimeSampleExpectedPaths[index],
      `${input} should resolve to ${manifest.nativeIntentRuntimeSampleExpectedPaths[index]}`,
    );
  });
});

test('native intent resolves about-the-test deep links before the Home fallback', () => {
  const appScheme = readAppScheme();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(typeof redirectSystemPath, 'function');
  assert.equal(redirectSystemPath({ initial: true, path: '/about-the-test' }), '/about-the-test');
  assert.equal(
    redirectSystemPath({
      initial: true,
      path: `${appScheme}://app/about-the-test`,
    }),
    '/about-the-test',
  );
  assert.equal(redirectSystemPath({ initial: true, path: `${appScheme}://app/not-real` }), '/home');
});

test('native intent resolves citizenship requirements deep links before the Home fallback', () => {
  const appScheme = readAppScheme();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(
    redirectSystemPath({ initial: true, path: '/citizenship-requirements' }),
    '/citizenship-requirements',
  );
  assert.equal(
    redirectSystemPath({
      initial: true,
      path: `${appScheme}://app/citizenship-requirements`,
    }),
    '/citizenship-requirements',
  );
  assert.equal(
    redirectSystemPath({ initial: true, path: '/citizenship-requirements/details' }),
    '/home',
  );
});

test('native intent resolves search deep links before the Home fallback', () => {
  const appScheme = readAppScheme();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(redirectSystemPath({ initial: true, path: '/search' }), '/search');
  assert.equal(
    redirectSystemPath({ initial: true, path: '/search?q=riksdag' }),
    '/search?q=riksdag',
  );
  assert.equal(
    redirectSystemPath({
      initial: true,
      path: `${appScheme}://app/search?q=riksdag`,
    }),
    '/search?q=riksdag',
  );
  assert.equal(
    redirectSystemPath({
      initial: true,
      path: `${appScheme}://search?q=riksdag`,
    }),
    '/search?q=riksdag',
  );
  assert.equal(redirectSystemPath({ initial: true, path: '/searching' }), '/home');
});

test('native intent resolves ebook deep links before the Home fallback', () => {
  const appScheme = readAppScheme();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(redirectSystemPath({ initial: true, path: '/ebook' }), '/ebook');
  assert.equal(redirectSystemPath({ initial: true, path: '/ebook?c=1' }), '/ebook?c=1');
  assert.equal(
    redirectSystemPath({
      initial: true,
      path: `${appScheme}://app/ebook?c=1`,
    }),
    '/ebook?c=1',
  );
  assert.equal(
    redirectSystemPath({ initial: true, path: `${appScheme}://ebook?c=1` }),
    '/ebook?c=1',
  );
  assert.equal(redirectSystemPath({ initial: true, path: '/ebook/intro' }), '/home');
});

test('native intent rejects foreign absolute URL schemes before route allowlisting', () => {
  const appScheme = readAppScheme();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(
    redirectSystemPath({ initial: true, path: 'https://app/search?q=riksdag' }),
    '/home',
  );
  assert.equal(redirectSystemPath({ initial: true, path: 'ftp://app/settings' }), '/home');
  assert.equal(redirectSystemPath({ initial: true, path: 'https://quiz/q001' }), '/home');
  assert.equal(redirectSystemPath({ initial: true, path: '//app/search?q=riksdag' }), '/home');
  assert.equal(
    redirectSystemPath({ initial: true, path: `${appScheme}://app/search?q=riksdag` }),
    '/search?q=riksdag',
  );
  assert.equal(
    redirectSystemPath({ initial: true, path: `${appScheme}://search?q=riksdag` }),
    '/search?q=riksdag',
  );
});

test('router shell tooling guard is wired into package scripts', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.scripts['test:router-shell'], 'node --test scripts/router-shell.test.js');
  if (pkg.scripts.test === 'node scripts/test-dispatch.js') {
    const testDispatcher = read('scripts/test-dispatch.js');
    assertMatches(
      testDispatcher,
      /runNpmScript\('test:all'\)|runNpmScripts\(\['test:all'\]\)/,
      'npm test dispatcher should run the full aggregate suite without a selector',
    );
    assertMatches(
      pkg.scripts['test:all'],
      /npm run test:router-shell/,
      'aggregate test script should include the router shell scaffold guard',
    );
    return;
  }

  assertMatches(
    pkg.scripts.test,
    /npm run test:router-shell/,
    'aggregate test script should include the router shell scaffold guard',
  );
});
