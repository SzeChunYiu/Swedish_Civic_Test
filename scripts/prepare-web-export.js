#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const HTML_LOADER_MARKER = 'data-web-export-loader="true"';
const REPO_ROOT = path.resolve(__dirname, '..');
const FAVICON_FILE_NAME = 'favicon.png';
const FAVICON_SOURCE = path.join(REPO_ROOT, 'assets/icon.png');
const { webDocumentMetadata } = require('../lib/scaffold/webDocumentMetadata.js');
const FORBIDDEN_EXPORTED_ASSET_PATH_PATTERN = /(?:^|\/)(?:__home|node_modules)(?:\/|$)/;
const FORBIDDEN_EXPORTED_ASSET_REFERENCE_PATTERN =
  /(?:^|["'(:])\/?assets\/[^"'()\s]*(?:__home|node_modules)[^"'()\s]*/;

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

function hasForbiddenExportPathFragment(relativePath) {
  return FORBIDDEN_EXPORTED_ASSET_PATH_PATTERN.test(relativePath.split(path.sep).join('/'));
}

function hasForbiddenExportAssetReference(source) {
  return FORBIDDEN_EXPORTED_ASSET_REFERENCE_PATTERN.test(source);
}

function contentHash(filePath) {
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
}

function uniqueAssetName(assetRoot, sourcePath) {
  const parsed = path.parse(path.basename(sourcePath));
  let candidate = path.basename(sourcePath);
  let candidatePath = path.join(assetRoot, candidate);

  if (!fs.existsSync(candidatePath)) {
    return candidate;
  }

  const hash = contentHash(sourcePath);
  candidate = `${parsed.name}.${hash}${parsed.ext}`;
  candidatePath = path.join(assetRoot, candidate);
  let suffix = 2;

  while (fs.existsSync(candidatePath)) {
    if (fs.readFileSync(candidatePath).equals(fs.readFileSync(sourcePath))) {
      return candidate;
    }
    candidate = `${parsed.name}.${hash}-${suffix}${parsed.ext}`;
    candidatePath = path.join(assetRoot, candidate);
    suffix += 1;
  }

  return candidate;
}

function removeEmptyDirectories(directory, stopAt) {
  if (!fs.existsSync(directory) || path.resolve(directory) === path.resolve(stopAt)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirectories(path.join(directory, entry.name), stopAt);
    }
  }

  if (fs.readdirSync(directory).length === 0) {
    fs.rmdirSync(directory);
  }
}

function flattenLeakedAssetPaths(outputDir) {
  const assetRoot = path.join(outputDir, 'assets');
  if (!fs.existsSync(assetRoot)) return new Map();

  const replacements = new Map();
  const files = walkFiles(assetRoot);

  for (const filePath of files) {
    const relativeAssetPath = path.relative(assetRoot, filePath).split(path.sep).join('/');
    if (!hasForbiddenExportPathFragment(relativeAssetPath)) continue;

    const targetName = uniqueAssetName(assetRoot, filePath);
    const targetPath = path.join(assetRoot, targetName);
    if (path.resolve(targetPath) !== path.resolve(filePath)) {
      fs.renameSync(filePath, targetPath);
    }

    replacements.set(`assets/${relativeAssetPath}`, `assets/${targetName}`);
    replacements.set(`/assets/${relativeAssetPath}`, `assets/${targetName}`);
  }

  removeEmptyDirectories(assetRoot, assetRoot);
  return replacements;
}

function rewriteLeakedAssetReferences(source, replacements) {
  let rewritten = source;
  for (const [from, to] of replacements) {
    rewritten = rewritten.split(from).join(to);
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

  const leakedAssetReplacements = flattenLeakedAssetPaths(outputDir);
  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    const rewritten = rewriteLeakedAssetReferences(
      rewriteRootRelativeBundlePaths(source),
      leakedAssetReplacements,
    );
    if (rewritten !== source) {
      fs.writeFileSync(jsFile, rewritten);
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

  const jsFiles = walkFiles(path.join(outputDir, '_expo'), (filePath) => filePath.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const source = fs.readFileSync(jsFile, 'utf8');
    if (/["']\/(_expo|assets)\//.test(source)) {
      throw new Error(`${jsFile} still contains root-relative exported asset URLs`);
    }
    if (hasForbiddenExportAssetReference(source)) {
      throw new Error(`${jsFile} leaks local build path or dependency path fragments`);
    }
  }

  const exportedFiles = walkFiles(outputDir);
  for (const exportedFile of exportedFiles) {
    const relativePath = path.relative(outputDir, exportedFile);
    if (hasForbiddenExportPathFragment(relativePath)) {
      throw new Error(`Exported file path leaks local build details: ${relativePath}`);
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
  prepare,
  readWebDocumentMetadata,
  rewriteHtml,
  rewriteRootRelativeBundlePaths,
  rewriteWebDocumentMetadata,
};
