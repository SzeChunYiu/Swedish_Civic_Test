#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { webDocumentMetadata } = require('../lib/scaffold/webDocumentMetadata');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const TEXT_EXPORT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.txt']);
const FORBIDDEN_EXPORT_PATH_PATTERNS = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)__[^/]*(home|swedish_civic_test|sct-worktrees)[^/]*(\/|$)/i,
  /\/home\//,
  /sct-worktrees/i,
  /Swedish_Civic_Test/,
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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function toRelativePosixPath(rootDir, filePath) {
  return toPosixPath(path.relative(rootDir, filePath));
}

function isTextExportFile(filePath) {
  return TEXT_EXPORT_EXTENSIONS.has(path.extname(filePath));
}

function hasForbiddenExportPathFragment(value) {
  return FORBIDDEN_EXPORT_PATH_PATTERNS.some((pattern) => pattern.test(value));
}

function uniqueFlatAssetPath({ existingTargets, oldRelativePath, outputDir }) {
  const basename = path.basename(oldRelativePath);
  let candidate = `assets/${basename}`;
  const candidatePath = path.join(outputDir, ...candidate.split('/'));

  if (!existingTargets.has(candidate) && !fs.existsSync(candidatePath)) {
    return candidate;
  }

  const parsed = path.parse(basename);
  const digest = crypto.createHash('sha1').update(oldRelativePath).digest('hex').slice(0, 8);
  candidate = `assets/${parsed.name}.${digest}${parsed.ext}`;

  let suffix = 1;
  while (
    existingTargets.has(candidate) ||
    fs.existsSync(path.join(outputDir, ...candidate.split('/')))
  ) {
    candidate = `assets/${parsed.name}.${digest}-${suffix}${parsed.ext}`;
    suffix += 1;
  }

  return candidate;
}

function removeEmptyDirectories(directory, stopAt) {
  if (!fs.existsSync(directory) || path.resolve(directory) === path.resolve(stopAt)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirectories(path.join(directory, entry.name), stopAt);
    }
  }

  if (fs.readdirSync(directory).length === 0) {
    fs.rmdirSync(directory);
  }
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

function rewriteTextFileReferences(outputDir, replacements) {
  if (replacements.size === 0) return;

  const textFiles = walkFiles(outputDir, isTextExportFile);
  for (const textFile of textFiles) {
    const source = fs.readFileSync(textFile, 'utf8');
    let rewritten = source;

    for (const [oldPath, newPath] of replacements) {
      rewritten = rewritten.split(`/${oldPath}`).join(newPath);
      rewritten = rewritten.split(oldPath).join(newPath);
    }

    if (rewritten !== source) {
      fs.writeFileSync(textFile, rewritten);
    }
  }
}

function normalizeExportedAssetPaths(outputDir) {
  const assetsDir = path.join(outputDir, 'assets');
  const assetFiles = walkFiles(assetsDir);
  const replacements = new Map();
  const existingTargets = new Set();

  for (const assetFile of assetFiles) {
    const oldRelativePath = toRelativePosixPath(outputDir, assetFile);
    const oldAssetSubpath = toRelativePosixPath(assetsDir, assetFile);
    const isFlatAsset = !oldAssetSubpath.includes('/');

    if (isFlatAsset && !hasForbiddenExportPathFragment(oldRelativePath)) {
      existingTargets.add(oldRelativePath);
    }
  }

  for (const assetFile of assetFiles) {
    if (!fs.existsSync(assetFile)) continue;

    const oldRelativePath = toRelativePosixPath(outputDir, assetFile);
    const oldAssetSubpath = toRelativePosixPath(assetsDir, assetFile);
    const needsNormalization =
      oldAssetSubpath.includes('/') || hasForbiddenExportPathFragment(oldRelativePath);

    if (!needsNormalization) continue;

    const newRelativePath = uniqueFlatAssetPath({ existingTargets, oldRelativePath, outputDir });
    const newAssetPath = path.join(outputDir, ...newRelativePath.split('/'));
    fs.mkdirSync(path.dirname(newAssetPath), { recursive: true });
    fs.renameSync(assetFile, newAssetPath);
    existingTargets.add(newRelativePath);
    replacements.set(oldRelativePath, newRelativePath);
  }

  rewriteTextFileReferences(outputDir, replacements);

  if (fs.existsSync(assetsDir)) {
    for (const entry of fs.readdirSync(assetsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        removeEmptyDirectories(path.join(assetsDir, entry.name), assetsDir);
      }
    }
  }
}

function assertNoForbiddenExportPathFragments(outputDir) {
  const files = walkFiles(outputDir);

  for (const file of files) {
    const relativePath = toRelativePosixPath(outputDir, file);
    if (hasForbiddenExportPathFragment(relativePath)) {
      throw new Error(`Exported file path leaks local build details: ${relativePath}`);
    }

    if (!isTextExportFile(file)) continue;

    const source = fs.readFileSync(file, 'utf8');
    if (hasForbiddenExportPathFragment(source)) {
      throw new Error(`${relativePath} leaks local build path or dependency path fragments`);
    }
  }
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

  normalizeExportedAssetPaths(outputDir);
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
  const jsSources = [];
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    jsSources.push(source);
    if (/["']\/(_expo|assets)\//.test(source)) {
      throw new Error(`${jsFile} still contains root-relative exported asset URLs`);
    }
  }

  assertNoForbiddenExportPathFragments(outputDir);
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
  hasForbiddenExportPathFragment,
  normalizeExportedAssetPaths,
  prepare,
  REQUIRED_ROUTE_CONTEXT_KEYS,
  rewriteHtml,
  rewriteRootRelativeHtmlAssetPaths,
  rewriteRootRelativeBundlePaths,
  assertWebManifestContract,
  webExportFreshnessMarkerPath,
  writeWebExportFreshnessMarker,
};
