#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { webDocumentMetadata } = require('../lib/scaffold/webDocumentMetadata');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const WEB_EXPORT_FRESHNESS_MARKER = 'web-export-freshness.json';
const WEB_EXPORT_SOURCE_INPUTS = ['app', 'components', 'lib', 'scripts', 'tests/e2e'];
const TEXT_EXPORT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.txt']);
const FORBIDDEN_EXPORT_PATH_PATTERNS = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)__[^/]*(home|swedish_civic_test|sct-worktrees)[^/]*(\/|$)/i,
  /\/home\//,
  /sct-worktrees/i,
  /(^|\/)Swedish_Civic_Test(\/|$)/,
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

function webExportFreshnessMarkerPath(outputDir) {
  return path.join(outputDir, WEB_EXPORT_FRESHNESS_MARKER);
}

function hashFile(hash, filePath, repoRoot) {
  hash.update(toRelativePosixPath(repoRoot, filePath));
  hash.update('\0');
  hash.update(fs.readFileSync(filePath));
  hash.update('\0');
}

function hashDirectory(hash, directory, repoRoot) {
  for (const filePath of walkFiles(directory).sort()) {
    if (fs.statSync(filePath).isFile()) {
      hashFile(hash, filePath, repoRoot);
    }
  }
}

function computeWebExportSourceHash({ repoRoot = path.resolve(__dirname, '..') } = {}) {
  const hash = crypto.createHash('sha256');
  for (const input of WEB_EXPORT_SOURCE_INPUTS) {
    const inputPath = path.join(repoRoot, input);
    hash.update(input);
    hash.update('\0');
    if (fs.existsSync(inputPath)) {
      const stat = fs.statSync(inputPath);
      if (stat.isDirectory()) {
        hashDirectory(hash, inputPath, repoRoot);
      } else if (stat.isFile()) {
        hashFile(hash, inputPath, repoRoot);
      }
    }
  }
  return hash.digest('hex');
}

function writeWebExportFreshnessMarker(outputDir, options = {}) {
  const marker = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceInputs: [...WEB_EXPORT_SOURCE_INPUTS],
    sourceHash: computeWebExportSourceHash(options),
  };
  fs.writeFileSync(webExportFreshnessMarkerPath(outputDir), `${JSON.stringify(marker, null, 2)}\n`);
  return marker;
}

function assertWebExportFreshness(outputDir, options = {}) {
  const markerPath = webExportFreshnessMarkerPath(outputDir);
  if (!fs.existsSync(markerPath)) {
    throw new Error(`${WEB_EXPORT_FRESHNESS_MARKER} is missing; run npm run build:web:export`);
  }
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  const expectedHash = computeWebExportSourceHash(options);
  if (marker.sourceHash !== expectedHash) {
    throw new Error('dist-web is stale; run npm run build:web:export');
  }
  return marker;
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

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readThemeCanvasColor() {
  const themeSource = fs.readFileSync(path.resolve(__dirname, '../lib/theme/colors.ts'), 'utf8');
  const match = themeSource.match(/const\s+canvas\s*=\s*'([^']+)'\s+satisfies\s+ColorToken/);
  if (!match) {
    throw new Error('colors.canvas should stay parseable for web export metadata');
  }
  return match[1];
}

function upsertHeadElement(html, pattern, element) {
  if (pattern.test(html)) {
    return html.replace(pattern, element);
  }
  return html.replace('</head>', `${element}\n</head>`);
}

function applyWebDocumentMetadata(html) {
  const canvasColor = readThemeCanvasColor();
  let rewritten = html;
  rewritten = rewritten.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtmlAttribute(webDocumentMetadata.title)}</title>`,
  );
  if (!/<title>[^<]*<\/title>/.test(rewritten)) {
    rewritten = rewritten.replace(
      '</head>',
      `<title>${escapeHtmlAttribute(webDocumentMetadata.title)}</title>\n</head>`,
    );
  }

  const metaElements = [
    `<meta name="theme-color" content="${escapeHtmlAttribute(canvasColor)}" />`,
    `<meta name="application-name" content="${escapeHtmlAttribute(webDocumentMetadata.applicationName)}" />`,
    `<meta name="apple-mobile-web-app-title" content="${escapeHtmlAttribute(webDocumentMetadata.appleMobileWebAppTitle)}" />`,
    `<meta name="description" content="${escapeHtmlAttribute(webDocumentMetadata.description)}" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttribute(webDocumentMetadata.openGraphSiteName)}" />`,
    `<meta property="og:title" content="${escapeHtmlAttribute(webDocumentMetadata.openGraphTitle)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttribute(webDocumentMetadata.openGraphDescription)}" />`,
  ];
  const metaPatterns = [
    /<meta\s+name=["']theme-color["'][^>]*>/,
    /<meta\s+name=["']application-name["'][^>]*>/,
    /<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>/,
    /<meta\s+name=["']description["'][^>]*>/,
    /<meta\s+property=["']og:site_name["'][^>]*>/,
    /<meta\s+property=["']og:title["'][^>]*>/,
    /<meta\s+property=["']og:description["'][^>]*>/,
  ];
  for (let index = 0; index < metaElements.length; index += 1) {
    rewritten = upsertHeadElement(rewritten, metaPatterns[index], metaElements[index]);
  }
  rewritten = upsertHeadElement(
    rewritten,
    /<link\s+rel=["']manifest["'][^>]*>/,
    '<link rel="manifest" href="manifest.webmanifest" />',
  );

  if (/<body\b[^>]*style=/.test(rewritten)) {
    rewritten = rewritten.replace(
      /<body\b([^>]*)style=["'][^"']*["']([^>]*)>/,
      `<body$1style="background-color:${canvasColor}"$2>`,
    );
  } else {
    rewritten = rewritten.replace(/<body\b([^>]*)>/, `<body$1 style="background-color:${canvasColor}">`);
  }
  return rewritten;
}

function rewriteHtml(html) {
  const withRuntimeLoader = html.includes(HTML_LOADER_MARKER)
    ? html
    : html.replace(
        /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
        (_match, bundlePath) => createRuntimeLoader(bundlePath),
      );
  return applyWebDocumentMetadata(rewriteRootRelativeHtmlAssetPaths(withRuntimeLoader));
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
  writeWebExportFreshnessMarker(outputDir);
}

function assertNonEmptyExpoRouterContext(outputDir) {
  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    if (source.includes('No modules in context') || /\.keys\s*=\s*\(\)\s*=>\s*\[\]/.test(source)) {
      throw new Error('Web export contains an empty Expo Router route context');
    }
  }
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
  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    if (/["']\/(_expo|assets)\//.test(source)) {
      throw new Error(`${jsFile} still contains root-relative exported asset URLs`);
    }
  }

  assertNonEmptyExpoRouterContext(outputDir);
  assertNoForbiddenExportPathFragments(outputDir);
  if (!index.includes(`<title>${webDocumentMetadata.title}</title>`)) {
    throw new Error(`index.html must include <title>${webDocumentMetadata.title}</title>`);
  }
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
  assertWebExportFreshness,
  check,
  computeWebExportSourceHash,
  hasForbiddenExportPathFragment,
  normalizeExportedAssetPaths,
  prepare,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
  webExportFreshnessMarkerPath,
  writeWebExportFreshnessMarker,
};
