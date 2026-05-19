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

function readThemeCanvasColor() {
  const themeSource = read('lib/theme/colors.ts');
  const match = themeSource.match(/const\s+canvas\s*=\s*'([^']+)'\s+satisfies\s+ColorToken/);
  assert.notEqual(match, null, 'colors.canvas should stay parseable for web manifest checks');
  return match[1];
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
  const match = source.match(
    new RegExp(`export const ${escapeRegExp(constName)}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as const`),
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

function readRouterShellManifest() {
  const manifest = read('lib/scaffold/routerShellManifest.ts');

  return {
    files: valuesForFieldInConstArray(manifest, 'expoRouterShellFiles', 'file'),
    roles: valuesForFieldInConstArray(manifest, 'expoRouterShellFiles', 'role'),
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
    dynamicRouteNames: valuesForFieldInConstArray(manifest, 'expoRouterDynamicRoutes', 'name'),
    dynamicRouteFiles: valuesForFieldInConstArray(manifest, 'expoRouterDynamicRoutes', 'file'),
    dynamicRouteHrefSamples: valuesForFieldInConstArray(
      manifest,
      'expoRouterDynamicRoutes',
      'hrefSample',
    ),
    recoveryHrefs: valuesInConstArray(manifest, 'expoRouterShellRecoveryHrefs'),
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
    webMetaDescriptionLanguages: valuesForFieldInConstArray(
      manifest,
      'expoRouterWebDocumentMetaDescriptions',
      'language',
    ),
    webMetaDescriptions: valuesForFieldInConstArray(
      manifest,
      'expoRouterWebDocumentMetaDescriptions',
      'description',
    ),
    themeColorTokens: valuesForFieldInSource(manifest, 'themeColorToken'),
    statusBarStyles: valuesForFieldInSource(manifest, 'statusBarStyle'),
    nativeFallbackHrefs: valuesForFieldInSource(manifest, 'nativeFallbackHref'),
    appSchemes: valuesForFieldInSource(manifest, 'appScheme'),
    nativeIntentStaticRoutes: valuesInConstArray(manifest, 'expoRouterNativeIntentStaticRoutes'),
    nativeIntentDynamicRouteRoutes: valuesForFieldInConstArray(
      manifest,
      'expoRouterNativeIntentDynamicRoutes',
      'route',
    ),
    nativeIntentDynamicRouteFiles: valuesForFieldInConstArray(
      manifest,
      'expoRouterNativeIntentDynamicRoutes',
      'routeFile',
    ),
    nativeIntentDynamicRoutePatternNames: valuesForFieldInConstArray(
      manifest,
      'expoRouterNativeIntentDynamicRoutes',
      'patternName',
    ),
    nativeIntentDynamicRouteSamplePaths: valuesForFieldInConstArray(
      manifest,
      'expoRouterNativeIntentDynamicRoutes',
      'samplePath',
    ),
    nativeIntentRuntimeSampleInputs: valuesForFieldInConstArray(
      manifest,
      'expoRouterNativeIntentRuntimeSamples',
      'input',
    ),
    nativeIntentRuntimeSampleExpectedPaths: valuesForFieldInConstArray(
      manifest,
      'expoRouterNativeIntentRuntimeSamples',
      'expectedPath',
    ),
  };
}

function loadNativeIntentRuntime() {
  const source = read('app/+native-intent.ts');
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
      URL,
    },
    { filename: 'app/+native-intent.ts' },
  );

  return module.exports;
}

function metaDescriptionForLanguage(manifest, language) {
  const index = manifest.webMetaDescriptionLanguages.indexOf(language);

  assert.notEqual(index, -1, `web manifest should define a ${language} meta description`);

  return manifest.webMetaDescriptions[index];
}

test('router shell fallback is registered in the root Expo stack', () => {
  const rootLayout = read('app/_layout.tsx');

  assertMatches(rootLayout, /<Stack\b/, 'root layout should render the Expo Router stack');
  assertMatches(
    rootLayout,
    /<Stack\s+screenOptions=\{\{[\s\S]*headerShown:\s*true,[\s\S]*headerTitle:\s*'',[\s\S]*headerBackVisible:\s*false,[\s\S]*headerShadowVisible:\s*false,[\s\S]*headerStyle:\s*\{\s*backgroundColor:\s*colors\.canvas\s*\},[\s\S]*headerRight:\s*\(\)\s*=>\s*<LanguagePicker\s*\/>,[\s\S]*\}\}/,
    'root stack should expose the empty-title language picker header contract',
  );
  assertMatches(
    rootLayout,
    /<Stack\.Screen\s+name=["']\+not-found["']\s*\/>/,
    'root stack should register the not-found recovery route under the language picker header contract',
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
  const manifest = readRouterShellManifest();
  const pwaManifest = readJson('public/manifest.webmanifest');
  const appConfig = readJson('app.json').expo;
  const canvasColor = readThemeCanvasColor();
  const webLanguage = manifest.webLanguages[0];
  const localizedDescription = metaDescriptionForLanguage(manifest, webLanguage);
  const englishDescription = metaDescriptionForLanguage(manifest, 'en');

  assertContains(
    htmlShell,
    `<html data-app-shell="${manifest.webAppShellMarkers[0]}" lang="${webLanguage}">`,
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
  assertContains(htmlShell, '<link href="manifest.webmanifest" rel="manifest" />');
  assertContains(htmlShell, '<ScrollViewStyleReset />');
  assertMatches(
    htmlShell,
    /<body[\s\S]*backgroundColor:\s*colors\.canvas/,
    'web body background should use the theme canvas color',
  );
  assert.deepEqual([...manifest.webMetaDescriptionLanguages].sort(), ['en', 'sv']);
  assert.notEqual(
    localizedDescription,
    englishDescription,
    'localized web descriptions should not collapse to one English-only string',
  );
  assert.doesNotMatch(
    localizedDescription,
    /\b(?:offline)?quiz(?:zes)?\b/i,
    'Swedish web metadata should avoid English quiz loanwords',
  );
  assertContains(htmlShell, `content="${localizedDescription}"`);
  if (webLanguage === 'sv') {
    assert.equal(
      htmlShell.includes(`content="${englishDescription}"`),
      false,
      'the Swedish web shell should not pair lang="sv" with the English meta description',
    );
  }
  assert.equal(pwaManifest.name, appConfig.name);
  assert.equal(pwaManifest.short_name, appConfig.name);
  assert.equal(pwaManifest.lang, webLanguage);
  assert.equal(pwaManifest.start_url, '.');
  assert.equal(pwaManifest.scope, '.');
  assert.equal(pwaManifest.display, 'standalone');
  assert.equal(pwaManifest.theme_color, canvasColor);
  assert.equal(pwaManifest.background_color, canvasColor);
  assert.equal(pwaManifest.description, localizedDescription);
  assert.deepEqual(
    pwaManifest.icons.map((icon) => [icon.src, icon.sizes, icon.purpose]),
    [
      ['icons/pwa-icon-192.png', '192x192', 'any'],
      ['icons/pwa-icon-512.png', '512x512', 'any'],
      ['icons/pwa-maskable-512.png', '512x512', 'maskable'],
    ],
  );
  for (const icon of pwaManifest.icons) {
    assert.equal(path.isAbsolute(icon.src), false, `${icon.src} should be host-agnostic`);
    assert.equal(icon.src.includes('..'), false, `${icon.src} should stay inside public/`);
    assert.equal(fs.existsSync(path.join(repoRoot, 'public', icon.src)), true);
  }
});

test('router shell manifest stays aligned with special Expo Router files', () => {
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
    '+not-found',
  ]);
  assert.deepEqual(manifest.rootStackScreenFiles, [
    'app/index.tsx',
    'app/(tabs)/_layout.tsx',
    'app/search.tsx',
    'app/dashboard.tsx',
    'app/+not-found.tsx',
  ]);
  assert.deepEqual(manifest.tabScreenNames, [
    'home',
    'learn',
    'practice',
    'exam',
    'mistakes',
    'profile',
  ]);
  assert.deepEqual(manifest.dynamicRouteNames, ['chapter/[chapterId]', 'quiz/[sessionId]']);
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
  ]);
  assert.deepEqual(manifest.notFoundRouteNames, ['+not-found']);
  assert.deepEqual(manifest.notFoundHeaderModes, ['visible-language-picker']);
  assert.deepEqual(manifest.rootStackHeaderModes, ['visible-language-picker']);
  assert.deepEqual(manifest.notFoundRedirectHrefs, ['/home']);
  assert.deepEqual(manifest.notFoundFileProtocolFallbacks, ['HomeScreen']);
  assert.deepEqual(manifest.webLanguages, ['sv']);
  assert.deepEqual(manifest.webAppShellMarkers, ['expo-router']);
  assert.deepEqual(manifest.themeColorTokens, ['colors.canvas']);
  assert.deepEqual(manifest.statusBarStyles, ['auto']);
  assert.deepEqual(manifest.nativeFallbackHrefs, ['/home']);
  assert.deepEqual(manifest.appSchemes, ['almost-swedish']);
  assert.deepEqual(
    [...manifest.nativeIntentStaticRoutes].sort(),
    [
      '/',
      ...manifest.tabScreenNames.map((name) => `/${name}`),
      ...manifest.rootStackScreenNames
        .filter((name) => !['index', '(tabs)', '+not-found'].includes(name))
        .map((name) => `/${name}`),
      ...manifest.standaloneRouteHrefs,
    ].sort(),
    'native intent static route allowlist should mirror manifest route declarations',
  );
  assert.deepEqual(
    manifest.nativeIntentDynamicRouteRoutes,
    manifest.dynamicRouteNames.map((name) => `/${name}`),
  );
  assert.deepEqual(manifest.nativeIntentDynamicRouteFiles, manifest.dynamicRouteFiles);
  assert.deepEqual(manifest.nativeIntentDynamicRouteSamplePaths, manifest.dynamicRouteHrefSamples);

  for (const file of manifest.files) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
  for (const file of manifest.rootStackScreenFiles) {
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
  for (const route of manifest.nativeIntentStaticRoutes) {
    assertContains(
      nativeIntent,
      `'${route}'`,
      `native intent runtime should include static route ${route}`,
    );
  }
  for (const patternName of manifest.nativeIntentDynamicRoutePatternNames) {
    assertMatches(
      nativeIntent,
      new RegExp(`const\\s+${escapeRegExp(patternName)}\\s*=`),
      `native intent runtime should declare dynamic pattern ${patternName}`,
    );
  }
  assertMatches(
    rootLayout,
    new RegExp(
      `<Stack\\.Screen\\s+name=["']${escapeRegExp(manifest.notFoundRouteNames[0])}["']\\s*\\/>`,
    ),
    'root stack should register the fallback route under the language picker header contract',
  );
  assertContains(rootLayout, `SystemUI.setBackgroundColorAsync(${manifest.themeColorTokens[0]})`);
  assertContains(rootLayout, `<StatusBar style="${manifest.statusBarStyles[0]}" />`);
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

test('native intent resolves every manifest runtime sample before the Home fallback', () => {
  const manifest = readRouterShellManifest();
  const { redirectSystemPath } = loadNativeIntentRuntime();

  assert.equal(typeof redirectSystemPath, 'function');
  assert.equal(
    manifest.nativeIntentRuntimeSampleInputs.length,
    manifest.nativeIntentRuntimeSampleExpectedPaths.length,
    'native intent runtime sample inputs and expectations should stay paired',
  );

  for (const [index, input] of manifest.nativeIntentRuntimeSampleInputs.entries()) {
    assert.equal(
      redirectSystemPath({ initial: true, path: input }),
      manifest.nativeIntentRuntimeSampleExpectedPaths[index],
      `native intent sample ${input} should resolve to its manifest expectation`,
    );
  }
});

test('top-bar language picker keeps a token-sized target and feedback', () => {
  const languagePicker = read('components/ui/LanguagePicker.tsx');
  const topBarActions = read('components/ui/TopBarActions.tsx');

  assertContains(topBarActions, '<LanguagePicker />');
  assertMatches(
    languagePicker,
    /style=\{\(\{ pressed \}\) => \[styles\.trigger, pressed \? styles\.triggerPressed : null\]\}/,
    'language picker trigger should keep tokenized pressed feedback',
  );
  assertMatches(
    languagePicker,
    /trigger:\s*\{[\s\S]*minHeight:\s*space\[6\],[\s\S]*minWidth:\s*space\[6\],[\s\S]*\}/,
    'language picker trigger should preserve the shared 48px top-bar target',
  );
  assertContains(languagePicker, 'backgroundColor: colors.focusSoft');
  assertContains(languagePicker, 'transform: [{ scale: motion.pressedScale }]');
});

test('router shell tooling guard is wired into package scripts', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.scripts['test:router-shell'], 'node --test scripts/router-shell.test.js');
  assertMatches(
    pkg.scripts['test:all'],
    /npm run test:router-shell/,
    'aggregate npm test should include the router shell scaffold guard',
  );
});
