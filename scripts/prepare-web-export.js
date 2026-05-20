#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { webDocumentMetadata } = require('../lib/scaffold/webDocumentMetadata');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const WEB_MANIFEST_HREF = 'manifest.webmanifest';
const WEB_EXPORT_FRESHNESS_MARKER = 'web-export-freshness.json';
const WEB_EXPORT_FRESHNESS_VERSION = 1;
const PNG_SIGNATURE = '89504e470d0a1a0a';
const WEB_EXPORT_SOURCE_INPUTS = [
  'app',
  'app.json',
  'assets',
  'babel.config.js',
  'components',
  'data',
  'lib',
  'metro.config.js',
  'package-lock.json',
  'package.json',
  'playwright.config.ts',
  'public',
  'scripts/prepare-web-export.js',
  'tests/e2e',
  'tsconfig.json',
  'types',
];
const EMPTY_ROUTER_CONTEXT_MARKER = 'No modules in context';
const REQUIRED_ROUTE_CONTEXT_MARKERS = [
  './_layout.tsx',
  './(tabs)/home.tsx',
  './about-the-test.tsx',
  './chapter/[chapterId].tsx',
  './quiz/[sessionId].tsx',
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const check = args.includes('--check');
  const outputDir = args.find((arg) => arg !== '--check') ?? 'dist-web';
  return { check, outputDir };
}

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required web export file: ${filePath}`);
  }
}

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function readThemeCanvasColor() {
  const themeSource = fs.readFileSync(path.join(process.cwd(), 'lib/theme/colors.ts'), 'utf8');
  const match = themeSource.match(/const\s+canvas\s*=\s*'([^']+)'\s+satisfies\s+ColorToken/);
  if (!match) {
    throw new Error('Could not read colors.canvas from lib/theme/colors.ts');
  }
  return match[1];
}

function readExpoAppName() {
  const appConfig = readJsonFile(path.join(process.cwd(), 'app.json'));
  return appConfig.expo?.name;
}

function tagsFor(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? [];
}

function tagHasAttribute(tag, name, value) {
  return new RegExp(`\\b${escapeRegExp(name)}=["']${escapeRegExp(value)}["']`, 'i').test(tag);
}

function assertRelativeUrl(label, value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty relative URL`);
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/')) {
    throw new Error(`${label} must stay host-agnostic and relative`);
  }
}

function readPngSize(filePath) {
  const header = fs.readFileSync(filePath);
  if (header.length < 24 || header.toString('hex', 0, 8) !== PNG_SIGNATURE) {
    throw new Error(`${filePath} must be a PNG image`);
  }
  return {
    height: header.readUInt32BE(20),
    width: header.readUInt32BE(16),
  };
}

function assertWebInstallShell(outputDir, html) {
  const canvasColor = readThemeCanvasColor();
  const linkTags = tagsFor(html, 'link');
  const hasManifestLink = linkTags.some(
    (tag) =>
      tagHasAttribute(tag, 'rel', 'manifest') && tagHasAttribute(tag, 'href', WEB_MANIFEST_HREF),
  );
  if (!hasManifestLink) {
    throw new Error('index.html is missing the relative web app manifest link');
  }

  const themeMeta = tagsFor(html, 'meta').some(
    (tag) =>
      tagHasAttribute(tag, 'name', 'theme-color') && tagHasAttribute(tag, 'content', canvasColor),
  );
  if (!themeMeta) {
    throw new Error('index.html theme-color meta must match colors.canvas');
  }

  const bodyTag = html.match(/<body\b[^>]*>/i)?.[0] ?? '';
  if (!new RegExp(`background-color\\s*:\\s*${escapeRegExp(canvasColor)}`, 'i').test(bodyTag)) {
    throw new Error('index.html body background must match colors.canvas');
  }

  assertWebManifestContract(outputDir, canvasColor);
  assertWebDocumentMetadata(html);
}

function assertWebManifestContract(outputDir, canvasColor) {
  const manifestPath = path.join(outputDir, WEB_MANIFEST_HREF);
  assertFile(manifestPath);

  const manifest = readJsonFile(manifestPath);
  const appName = readExpoAppName();
  if (manifest.name !== appName || manifest.short_name !== appName) {
    throw new Error('manifest.webmanifest name fields must match app.json expo.name');
  }
  if (manifest.display !== 'standalone') {
    throw new Error('manifest.webmanifest display must be standalone');
  }
  if (manifest.start_url !== '.' || manifest.scope !== '.') {
    throw new Error('manifest.webmanifest start_url and scope must be host-agnostic "." values');
  }
  assertRelativeUrl('manifest.webmanifest start_url', manifest.start_url);
  assertRelativeUrl('manifest.webmanifest scope', manifest.scope);
  if (manifest.theme_color !== canvasColor || manifest.background_color !== canvasColor) {
    throw new Error('manifest.webmanifest colors must match colors.canvas');
  }

  const requiredIcons = [
    { src: 'icons/pwa-icon-192.png', sizes: '192x192', purpose: 'any', width: 192, height: 192 },
    { src: 'icons/pwa-icon-512.png', sizes: '512x512', purpose: 'any', width: 512, height: 512 },
    {
      src: 'icons/pwa-maskable-512.png',
      sizes: '512x512',
      purpose: 'maskable',
      width: 512,
      height: 512,
    },
  ];

  if (!Array.isArray(manifest.icons)) {
    throw new Error('manifest.webmanifest icons must be an array');
  }

  for (const expected of requiredIcons) {
    const icon = manifest.icons.find((candidate) => candidate.src === expected.src);
    if (!icon) {
      throw new Error(`manifest.webmanifest is missing ${expected.src}`);
    }
    assertRelativeUrl(`manifest icon ${expected.src}`, icon.src);
    if (icon.src.includes('..')) {
      throw new Error(`manifest icon ${expected.src} must stay inside the web export`);
    }
    if (icon.sizes !== expected.sizes || icon.type !== 'image/png') {
      throw new Error(`manifest icon ${expected.src} must declare ${expected.sizes} image/png`);
    }
    if (
      !String(icon.purpose ?? '')
        .split(/\s+/)
        .includes(expected.purpose)
    ) {
      throw new Error(`manifest icon ${expected.src} must include purpose ${expected.purpose}`);
    }

    const iconPath = path.resolve(outputDir, icon.src);
    const relativeIconPath = path.relative(outputDir, iconPath);
    if (relativeIconPath.startsWith('..') || path.isAbsolute(relativeIconPath)) {
      throw new Error(`manifest icon ${expected.src} must resolve inside the web export`);
    }
    assertFile(iconPath);
    const size = readPngSize(iconPath);
    if (size.width !== expected.width || size.height !== expected.height) {
      throw new Error(`manifest icon ${expected.src} must be ${expected.sizes}`);
    }
  }
}

function insertBeforeHeadEnd(html, tag) {
  return html.replace(
    /(\s*)<\/head>/i,
    (_match, whitespace) => `${whitespace}${tag}\n${whitespace}</head>`,
  );
}

function webDocumentMetaTags() {
  return [
    { attribute: 'name', key: 'application-name', content: webDocumentMetadata.applicationName },
    {
      attribute: 'name',
      key: 'apple-mobile-web-app-title',
      content: webDocumentMetadata.appleMobileWebAppTitle,
    },
    { attribute: 'name', key: 'description', content: webDocumentMetadata.description },
    {
      attribute: 'property',
      key: 'og:site_name',
      content: webDocumentMetadata.openGraphSiteName,
    },
    { attribute: 'property', key: 'og:title', content: webDocumentMetadata.openGraphTitle },
    {
      attribute: 'property',
      key: 'og:description',
      content: webDocumentMetadata.openGraphDescription,
    },
  ];
}

function webDocumentMetaTag({ attribute, key, content }) {
  return `<meta ${attribute}="${escapeHtmlAttribute(key)}" content="${escapeHtmlAttribute(content)}" />`;
}

function ensureDocumentTitle(html) {
  const title = `<title>${escapeHtmlAttribute(webDocumentMetadata.title)}</title>`;
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, title);
  }
  return insertBeforeHeadEnd(html, title);
}

function ensureMetaTag(html, spec) {
  const existingMeta = new RegExp(
    `<meta\\b(?=[^>]*\\b${escapeRegExp(spec.attribute)}=["']${escapeRegExp(spec.key)}["'])[^>]*>`,
    'i',
  );
  const tag = webDocumentMetaTag(spec);
  if (existingMeta.test(html)) {
    return html.replace(existingMeta, tag);
  }
  return insertBeforeHeadEnd(html, tag);
}

function ensureWebDocumentMetadata(html) {
  return webDocumentMetaTags().reduce(
    (nextHtml, spec) => ensureMetaTag(nextHtml, spec),
    ensureDocumentTitle(html),
  );
}

function assertWebDocumentMetadata(html) {
  const expectedTitle = `<title>${escapeHtmlAttribute(webDocumentMetadata.title)}</title>`;
  if (!new RegExp(escapeRegExp(expectedTitle), 'i').test(html)) {
    throw new Error('index.html title must match shared web document metadata');
  }

  const metaTags = tagsFor(html, 'meta');
  for (const spec of webDocumentMetaTags()) {
    const hasTag = metaTags.some(
      (tag) =>
        tagHasAttribute(tag, spec.attribute, spec.key) &&
        tagHasAttribute(tag, 'content', spec.content),
    );
    if (!hasTag) {
      throw new Error(`${spec.attribute}=${spec.key} meta must match shared web document metadata`);
    }
  }
}

function ensureThemeColorMeta(html) {
  const canvasColor = readThemeCanvasColor();
  const themeColorMeta = `<meta name="theme-color" content="${canvasColor}" />`;
  const existingThemeColor = /<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/i;
  if (existingThemeColor.test(html)) {
    return html.replace(existingThemeColor, themeColorMeta);
  }
  return insertBeforeHeadEnd(html, themeColorMeta);
}

function ensureWebManifestLink(html) {
  const linkTags = tagsFor(html, 'link');
  const hasManifestLink = linkTags.some(
    (tag) =>
      tagHasAttribute(tag, 'rel', 'manifest') && tagHasAttribute(tag, 'href', WEB_MANIFEST_HREF),
  );
  if (hasManifestLink) return html;
  return insertBeforeHeadEnd(html, `<link rel="manifest" href="${WEB_MANIFEST_HREF}" />`);
}

function ensureBodyBackground(html) {
  const canvasColor = readThemeCanvasColor();
  return html.replace(/<body\b([^>]*)>/i, (bodyTag, attributes) => {
    const styleMatch = attributes.match(/\sstyle=(["'])(.*?)\1/i);
    if (!styleMatch) {
      return `<body${attributes} style="background-color:${canvasColor}">`;
    }

    const nextStyle = /background-color\s*:/i.test(styleMatch[2])
      ? styleMatch[2].replace(/background-color\s*:\s*[^;]+;?/i, `background-color:${canvasColor};`)
      : `${styleMatch[2].replace(/;?\s*$/, '')};background-color:${canvasColor}`;
    return bodyTag.replace(styleMatch[0], ` style="${nextStyle}"`);
  });
}

function ensureWebInstallMarkup(html) {
  return ensureWebDocumentMetadata(
    ensureBodyBackground(ensureWebManifestLink(ensureThemeColorMeta(html))),
  );
}

function walkFiles(directory, predicate) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath, predicate));
    } else if (!predicate || predicate(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

function listWebExportSourceFiles(repoRoot = process.cwd()) {
  const files = new Map();
  const resolvedRepoRoot = path.resolve(repoRoot);

  function addFile(filePath) {
    const relativePath = path.relative(resolvedRepoRoot, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return;
    }
    files.set(toPosixPath(relativePath), filePath);
  }

  for (const sourceInput of WEB_EXPORT_SOURCE_INPUTS) {
    const sourcePath = path.join(resolvedRepoRoot, sourceInput);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      for (const sourceFile of walkFiles(sourcePath)) {
        if (fs.statSync(sourceFile).isFile()) {
          addFile(sourceFile);
        }
      }
    } else if (stat.isFile()) {
      addFile(sourcePath);
    }
  }

  return [...files.keys()].sort();
}

function buildWebExportSourceFingerprint(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const sourceFiles = listWebExportSourceFiles(repoRoot);
  const hash = crypto.createHash('sha256');

  for (const relativePath of sourceFiles) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath));
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(source.length));
    hash.update('\0');
    hash.update(source);
    hash.update('\0');
  }

  return {
    hash: hash.digest('hex'),
    sourceFileCount: sourceFiles.length,
  };
}

function webExportFreshnessMarkerPath(outputDir) {
  return path.join(outputDir, WEB_EXPORT_FRESHNESS_MARKER);
}

function writeWebExportFreshnessMarker(outputDir, options = {}) {
  const fingerprint = buildWebExportSourceFingerprint(options);
  const marker = {
    version: WEB_EXPORT_FRESHNESS_VERSION,
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/prepare-web-export.js',
    sourceHash: fingerprint.hash,
    sourceFileCount: fingerprint.sourceFileCount,
    sourceInputs: WEB_EXPORT_SOURCE_INPUTS,
  };

  fs.writeFileSync(webExportFreshnessMarkerPath(outputDir), `${JSON.stringify(marker, null, 2)}\n`);
  return marker;
}

function assertWebExportFreshness(outputDir, options = {}) {
  const markerPath = webExportFreshnessMarkerPath(outputDir);
  if (!fs.existsSync(markerPath)) {
    throw new Error(
      `${markerPath} is missing. Run \`npm run build:web:export\` first so E2E serves a fresh web export.`,
    );
  }

  const marker = readJsonFile(markerPath);
  if (marker.version !== WEB_EXPORT_FRESHNESS_VERSION) {
    throw new Error(
      `${markerPath} has unsupported freshness marker version ${JSON.stringify(marker.version)}. Run \`npm run build:web:export\` first.`,
    );
  }
  if (typeof marker.sourceHash !== 'string' || marker.sourceHash.length === 0) {
    throw new Error(`${markerPath} is missing sourceHash. Run \`npm run build:web:export\` first.`);
  }

  const current = buildWebExportSourceFingerprint(options);
  if (marker.sourceHash !== current.hash || marker.sourceFileCount !== current.sourceFileCount) {
    throw new Error(
      [
        'dist-web is stale for the current app/components/tests source tree.',
        `Freshness marker sourceHash=${marker.sourceHash} sourceFileCount=${marker.sourceFileCount};`,
        `current sourceHash=${current.hash} sourceFileCount=${current.sourceFileCount}.`,
        'Run `npm run build:web:export` first.',
      ].join(' '),
    );
  }

  return { current, marker };
}

function toRelativeBundlePath(bundlePath) {
  return bundlePath.replace(/^\/+/, '');
}

function createRuntimeLoader(bundlePath) {
  const relativeBundlePath = toRelativeBundlePath(bundlePath);
  return [
    `  <script ${HTML_LOADER_MARKER}>`,
    '    (function () {',
    '      var base = document.createElement("base");',
    '      base.href = window.location.protocol === "file:" ? "./" : "/";',
    '      document.head.appendChild(base);',
    '',
    '      var script = document.createElement("script");',
    `      script.src = ${JSON.stringify(relativeBundlePath)};`,
    '      script.defer = true;',
    '      document.body.appendChild(script);',
    '    })();',
    '  </script>',
  ].join('\n');
}

function rewriteHtml(html) {
  const withRuntimeLoader = html.includes(HTML_LOADER_MARKER)
    ? html
    : html.replace(
        /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
        (_match, bundlePath) => createRuntimeLoader(bundlePath),
      );
  return ensureWebInstallMarkup(rewriteRootRelativeHtmlAssetPaths(withRuntimeLoader));
}

function rewriteRootRelativeHtmlAssetPaths(source) {
  return source.replace(/\b(src|href)=(["'])\/(_expo|assets)\//g, '$1=$2$3/');
}

function rewriteRootRelativeBundlePaths(source) {
  return source.replace(/(["'])\/(_expo|assets)\//g, '$1$2/');
}

function prepare(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  assertFile(indexPath);

  const originalIndex = fs.readFileSync(indexPath, 'utf8');
  const preparedIndex = rewriteHtml(originalIndex);
  if (preparedIndex === originalIndex && !preparedIndex.includes(HTML_LOADER_MARKER)) {
    throw new Error('Could not find Expo web bundle script in index.html');
  }

  fs.writeFileSync(indexPath, preparedIndex);
  fs.writeFileSync(fallbackPath, preparedIndex);

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    const rewritten = rewriteRootRelativeBundlePaths(source);
    if (rewritten !== source) {
      fs.writeFileSync(jsFile, rewritten);
    }
  }

  writeWebExportFreshnessMarker(outputDir);
}

function check(outputDir) {
  const indexPath = path.join(outputDir, 'index.html');
  const fallbackPath = path.join(outputDir, '404.html');
  assertFile(indexPath);
  assertFile(fallbackPath);

  const index = fs.readFileSync(indexPath, 'utf8');
  const fallback = fs.readFileSync(fallbackPath, 'utf8');
  if (index !== fallback) {
    throw new Error('404.html must match index.html for SPA fallback routing');
  }
  if (!index.includes(HTML_LOADER_MARKER)) {
    throw new Error('index.html is missing the web export runtime loader');
  }
  if (/\b(?:src|href)=["']\/(?:_expo|assets)\//.test(index)) {
    throw new Error('index.html still contains root-relative exported asset URLs');
  }
  assertWebInstallShell(outputDir, index);

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  const bundledSource = jsFiles.map((jsFile) => fs.readFileSync(jsFile, 'utf8')).join('\n');

  if (bundledSource.includes(EMPTY_ROUTER_CONTEXT_MARKER)) {
    throw new Error('Web export bundle contains an empty Expo Router route context');
  }

  const missingRouteMarkers = REQUIRED_ROUTE_CONTEXT_MARKERS.filter(
    (marker) => !bundledSource.includes(marker),
  );
  if (missingRouteMarkers.length > 0) {
    throw new Error(
      `Web export bundle is missing Expo Router route modules: ${missingRouteMarkers.join(', ')}`,
    );
  }

  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    if (/["']\/(_expo|assets)\//.test(source)) {
      throw new Error(`${jsFile} still contains root-relative exported asset URLs`);
    }
  }

  assertWebExportFreshness(outputDir);
}

function main() {
  const { check: shouldCheck, outputDir } = parseArgs(process.argv);
  const resolvedOutputDir = path.resolve(process.cwd(), outputDir);
  if (shouldCheck) {
    check(resolvedOutputDir);
    console.log(`Web export artifact ready: ${outputDir}`);
    return;
  }

  prepare(resolvedOutputDir);
  check(resolvedOutputDir);
  console.log(`Prepared web export artifact: ${outputDir}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  WEB_EXPORT_FRESHNESS_MARKER,
  WEB_EXPORT_FRESHNESS_VERSION,
  assertWebDocumentMetadata,
  check,
  ensureWebDocumentMetadata,
  prepare,
  assertWebExportFreshness,
  buildWebExportSourceFingerprint,
  REQUIRED_ROUTE_CONTEXT_MARKERS,
  rewriteHtml,
  rewriteRootRelativeHtmlAssetPaths,
  rewriteRootRelativeBundlePaths,
  assertWebManifestContract,
  webExportFreshnessMarkerPath,
  writeWebExportFreshnessMarker,
};
