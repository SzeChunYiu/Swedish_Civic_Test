#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const REPO_ROOT = path.resolve(__dirname, '..');
const FAVICON_FILE_NAME = 'favicon.png';
const FAVICON_SOURCE = path.join(REPO_ROOT, 'assets/icon.png');
const { webDocumentMetadata } = require('../lib/scaffold/webDocumentMetadata.js');
const EXPORT_PATH_LEAK_PATTERNS = [
  /(?:^|[\\/])node_modules(?:[\\/]|$)/,
  /__home[\\/]/,
  /__Users[\\/]/,
  /(?:^|[\\/])home[\\/][^\\/]+[\\/]/,
  /(?:^|[\\/])Users[\\/][^\\/]+[\\/]/,
];
const EXPORT_CONTENT_LEAK_PATTERNS = [
  /(?:^|["'(:])\/?assets\/__(?:home|Users)\//,
  /(?:^|["'(:])\/?assets\/(?:home|Users)\/[^"'\s]+\/[^"'\s]+\/node_modules\//,
];

const TEXT_EXPORT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.txt',
  '.webmanifest',
]);

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

function hasForbiddenExportPathFragment(value) {
  const normalized = value.split(path.sep).join('/');
  return EXPORT_PATH_LEAK_PATTERNS.some((pattern) => pattern.test(normalized));
}

function hasForbiddenExportContentFragment(value) {
  const normalized = value.split(path.sep).join('/');
  return EXPORT_CONTENT_LEAK_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isTextExportFile(filePath) {
  return TEXT_EXPORT_EXTENSIONS.has(path.extname(filePath));
}

function toRelativeBundlePath(bundlePath) {
  return bundlePath.replace(/^\/+/, '');
}

function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractManifestString(source, fieldName) {
  const match = source.match(new RegExp(`${escapeRegExp(fieldName)}:\\s*['"]([^'"]+)['"]`));

  if (!match) {
    throw new Error(`Could not find ${fieldName} in router shell manifest`);
  }

  return match[1];
}

function extractMetaDescriptionForLanguage(source, language) {
  const match = source.match(
    new RegExp(
      `language:\\s*['"]${escapeRegExp(language)}['"][\\s\\S]*?description:\\s*['"]([^'"]+)['"]`,
    ),
  );

  if (!match) {
    throw new Error(`Could not find ${language} web meta description in router shell manifest`);
  }

  return match[1];
}

function readWebDocumentMetadata() {
  return {
    description: webDocumentMetadata.description,
    language: webDocumentMetadata.language,
  };
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
  const rewrittenLoader = html.includes(HTML_LOADER_MARKER)
    ? html
    : html.replace(
        /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer><\/script>/,
        (_match, bundlePath) => createRuntimeLoader(bundlePath),
      );

  return rewriteWebDocumentMetadata(rewrittenLoader);
}

function rewriteWebDocumentMetadata(html) {
  const metadata = readWebDocumentMetadata();
  const escapedLanguage = escapeHtmlAttribute(metadata.language);
  const escapedDescription = escapeHtmlAttribute(metadata.description);
  let next = html.replace(
    /<html([^>]*)>/,
    (_match, attributes) =>
      `<html${attributes.replace(/\s+lang=(["'])[^"']*\1/, '')} lang="${escapedLanguage}">`,
  );

  if (/<meta\s+[^>]*name=["']description["'][^>]*>/i.test(next)) {
    next = next.replace(
      /<meta\s+[^>]*name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapedDescription}">`,
    );
  } else if (/<meta\s+[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i.test(next)) {
    next = next.replace(
      /<meta\s+[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapedDescription}">`,
    );
  } else {
    next = next.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  <meta name="description" content="${escapedDescription}">`,
    );
  }

  return next;
}

function rewriteRootRelativeBundlePaths(source) {
  return source.replace(/(["'])\/(_expo|assets)\//g, '$1$2/');
}

function createSafeAssetRelativePath(relativePath, usedTargets) {
  const basename = path.posix.basename(relativePath);
  const parsed = path.posix.parse(basename);
  const defaultTarget = `assets/${basename}`;

  if (!usedTargets.has(defaultTarget)) {
    usedTargets.add(defaultTarget);
    return defaultTarget;
  }

  const hash = crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 8);
  let target = `assets/${parsed.name}.${hash}${parsed.ext}`;
  let counter = 2;
  while (usedTargets.has(target)) {
    target = `assets/${parsed.name}.${hash}-${counter}${parsed.ext}`;
    counter += 1;
  }
  usedTargets.add(target);
  return target;
}

function removeEmptyParents(filePath, stopDirectory) {
  let directory = path.dirname(filePath);
  while (directory.startsWith(stopDirectory) && directory !== stopDirectory) {
    try {
      fs.rmdirSync(directory);
    } catch {
      return;
    }
    directory = path.dirname(directory);
  }
}

function flattenLeakedAssetPaths(outputDir) {
  const rewrites = new Map();
  const usedTargets = new Set(
    walkFiles(path.join(outputDir, 'assets')).map((filePath) =>
      path.relative(outputDir, filePath).split(path.sep).join('/'),
    ),
  );
  const leakedFiles = walkFiles(outputDir).filter((filePath) => {
    const relativePath = path.relative(outputDir, filePath).split(path.sep).join('/');
    return relativePath.startsWith('assets/') && hasForbiddenExportPathFragment(relativePath);
  });

  for (const leakedFile of leakedFiles) {
    const relativePath = path.relative(outputDir, leakedFile).split(path.sep).join('/');
    const safeRelativePath = createSafeAssetRelativePath(relativePath, usedTargets);
    const safeFile = path.join(outputDir, ...safeRelativePath.split('/'));
    fs.mkdirSync(path.dirname(safeFile), { recursive: true });
    fs.copyFileSync(leakedFile, safeFile);
    fs.unlinkSync(leakedFile);
    removeEmptyParents(leakedFile, outputDir);
    rewrites.set(relativePath, safeRelativePath);
  }

  return rewrites;
}

function rewriteLeakedAssetReferences(source, rewrites) {
  let rewritten = source;
  const sortedRewrites = [...rewrites.entries()].sort(
    (left, right) => right[0].length - left[0].length,
  );
  for (const [from, to] of sortedRewrites) {
    rewritten = rewritten.replace(new RegExp(escapeRegExp(from), 'g'), to);
  }
  return rewritten;
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

  const assetPathRewrites = flattenLeakedAssetPaths(outputDir);
  const textFiles = walkFiles(outputDir, isTextExportFile);
  for (const textFile of textFiles) {
    const source = fs.readFileSync(textFile, 'utf8');
    const rewritten = rewriteLeakedAssetReferences(
      rewriteRootRelativeBundlePaths(source),
      assetPathRewrites,
    );
    if (rewritten !== source) {
      fs.writeFileSync(textFile, rewritten);
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
  const metadata = readWebDocumentMetadata();
  if (index !== fallback) {
    throw new Error('404.html must match index.html for SPA fallback routing');
  }
  if (!index.includes(HTML_LOADER_MARKER)) {
    throw new Error('index.html is missing the web export runtime loader');
  }
  if (!index.includes(`lang="${metadata.language}"`)) {
    throw new Error(`index.html must declare lang="${metadata.language}"`);
  }
  if (!index.includes(`content="${escapeHtmlAttribute(metadata.description)}"`)) {
    throw new Error('index.html must include the configured web document description');
  }
  if (/src="\/_expo\//.test(index) || /href="\/_expo\//.test(index)) {
    throw new Error('index.html still contains root-relative Expo bundle URLs');
  }

  const exportedFiles = walkFiles(outputDir);
  for (const filePath of exportedFiles) {
    const relativePath = path.relative(outputDir, filePath).split(path.sep).join('/');
    if (hasForbiddenExportPathFragment(relativePath)) {
      throw new Error(`Exported file path leaks local build details: ${relativePath}`);
    }

    if (isTextExportFile(filePath)) {
      const source = fs.readFileSync(filePath, 'utf8');
      if (hasForbiddenExportContentFragment(source)) {
        throw new Error(
          `Exported file content leaks local build path or dependency path fragments: ${relativePath}`,
        );
      }
    }
  }

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    if (/["']\/(_expo|assets)\//.test(source)) {
      throw new Error(`${jsFile} still contains root-relative exported asset URLs`);
    }
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
  check,
  flattenLeakedAssetPaths,
  hasForbiddenExportPathFragment,
  prepare,
  rewriteLeakedAssetReferences,
  readWebDocumentMetadata,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
  rewriteWebDocumentMetadata,
};
