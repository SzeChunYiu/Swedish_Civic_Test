#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

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
  if (html.includes(HTML_LOADER_MARKER)) {
    return html;
  }

  return html.replace(
    /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
    (_match, bundlePath) => createRuntimeLoader(bundlePath),
  );
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
  if (/src="\/_expo\//.test(index) || /href="\/_expo\//.test(index)) {
    throw new Error('index.html still contains root-relative Expo bundle URLs');
  }

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
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
  check,
  hasForbiddenExportPathFragment,
  normalizeExportedAssetPaths,
  prepare,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
};
