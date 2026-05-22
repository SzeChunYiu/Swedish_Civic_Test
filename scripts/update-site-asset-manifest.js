#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultSiteDir = path.join(repoRoot, 'site');
const defaultManifestPath = path.join(defaultSiteDir, 'asset-manifest.json');
const manifestFileName = 'asset-manifest.json';
const maxStylesheetImportDepth = 16;

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function listSiteAssetFiles(siteDir, options = {}) {
  const files = [];
  const includeAsset =
    typeof options.includeAsset === 'function' ? options.includeAsset : () => true;

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const relativePath = normalizeRelativePath(path.relative(siteDir, absolutePath));
      if (relativePath === manifestFileName) continue;
      if (!includeAsset(relativePath)) continue;
      files.push(relativePath);
    }
  }

  walk(siteDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function isIgnoredReference(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}

function normalizeAssetReference(value, baseDir = '') {
  const trimmed = value
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .trim();
  if (!trimmed || isIgnoredReference(trimmed) || /\bvar\(/i.test(trimmed)) return null;

  const withoutHashOrQuery = trimmed.replace(/[?#].*$/, '');
  if (!withoutHashOrQuery) return null;

  if (withoutHashOrQuery.startsWith('/')) {
    return path.posix.normalize(withoutHashOrQuery.replace(/^\/+/, ''));
  }

  const normalized = path.posix.normalize(path.posix.join(baseDir, withoutHashOrQuery));
  return normalized === '.' ? null : normalized.replace(/^\.\//, '');
}

function stripCssBlockComments(cssText) {
  return cssText.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractCssUrlReferences(cssText, baseDir = '') {
  const references = [];
  const urlPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi;
  const uncommentedCssText = stripCssBlockComments(cssText);

  for (const match of uncommentedCssText.matchAll(urlPattern)) {
    const reference = normalizeAssetReference(match[1] ?? match[2] ?? match[3] ?? '', baseDir);
    if (reference) references.push(reference);
  }

  return references;
}

function extractCssImportReferences(cssText, baseDir = '') {
  const references = [];
  const uncommentedCssText = stripCssBlockComments(cssText);
  const importPattern =
    /@import\s+(?:url\(\s*)?(?:"([^"]*)"|'([^']*)'|([^)'";\s]+))(?:\s*\))?[^;]*;/gi;

  for (const match of uncommentedCssText.matchAll(importPattern)) {
    const reference = normalizeAssetReference(match[1] ?? match[2] ?? match[3] ?? '', baseDir);
    if (reference) references.push(reference);
  }

  return references;
}

function isPathInsideDirectory(directory, candidatePath) {
  const relativePath = path.relative(directory, candidatePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function realPathInsideDirectory(directory, candidatePath) {
  try {
    return isPathInsideDirectory(fs.realpathSync(directory), fs.realpathSync(candidatePath));
  } catch {
    return false;
  }
}

function extractHtmlAttribute(tag, attributeName) {
  const attributePattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  );
  const match = tag.match(attributePattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
}

function listHtmlAssetAttributeReferences(indexHtml) {
  return Array.from(indexHtml.matchAll(/\b(?:src|href|poster)\s*=\s*(["'])(.*?)\1/gi), (match) =>
    normalizeAssetReference(match[2]),
  ).filter(Boolean);
}

function listInlineStyleAssetReferences(indexHtml) {
  return Array.from(indexHtml.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)).flatMap((match) =>
    extractCssUrlReferences(match[2]),
  );
}

function listStyleBlockAssetReferences(indexHtml) {
  return Array.from(indexHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)).flatMap((match) =>
    extractCssUrlReferences(match[1]),
  );
}

function listSrcSetReferences(value) {
  return value
    .replace(/\bdata:[^\s]+(?:\s+[-+]?(?:\d*\.)?\d+[wx])?/gi, '')
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .map((candidate) => normalizeAssetReference(candidate))
    .filter((reference) => reference && path.posix.extname(reference));
}

function listHtmlDirectAssetReferences(indexHtml) {
  const references = [];
  const attributePattern =
    /\b(src|href|poster|srcset|imagesrcset|style)\s*=\s*([\"'])([\s\S]*?)\2/gi;

  for (const match of indexHtml.matchAll(attributePattern)) {
    const attributeName = match[1].toLowerCase();
    const value = match[3];
    if (attributeName === 'srcset' || attributeName === 'imagesrcset') {
      references.push(...listSrcSetReferences(value));
    } else if (attributeName === 'style') {
      references.push(...extractCssUrlReferences(value));
    } else {
      const reference = normalizeAssetReference(value);
      if (reference) references.push(reference);
    }
  }

  return references;
}

function listStylesheetAssetReferences(siteDir, indexHtml) {
  const references = [];
  const visitedStylesheets = new Set();

  function collectStylesheetReferences(stylesheetPath, depth = 0) {
    if (depth > maxStylesheetImportDepth) {
      throw new Error(`CSS import depth exceeded while scanning ${stylesheetPath}`);
    }

    const absoluteStylesheetPath = path.resolve(siteDir, stylesheetPath);
    if (!isPathInsideDirectory(siteDir, absoluteStylesheetPath)) return [stylesheetPath];
    if (!fs.existsSync(absoluteStylesheetPath)) return [stylesheetPath];
    if (!realPathInsideDirectory(siteDir, absoluteStylesheetPath)) return [stylesheetPath];

    const normalizedStylesheetPath = normalizeRelativePath(
      path.relative(siteDir, absoluteStylesheetPath),
    );
    if (visitedStylesheets.has(normalizedStylesheetPath)) return [normalizedStylesheetPath];
    visitedStylesheets.add(normalizedStylesheetPath);

    const stylesheetText = fs.readFileSync(absoluteStylesheetPath, 'utf8');
    const baseDir = path.posix.dirname(normalizedStylesheetPath);
    const stylesheetBaseDir = baseDir === '.' ? '' : baseDir;
    const stylesheetReferences = [normalizedStylesheetPath];

    for (const importedStylesheetPath of extractCssImportReferences(
      stylesheetText,
      stylesheetBaseDir,
    )) {
      stylesheetReferences.push(importedStylesheetPath);
      if (path.extname(importedStylesheetPath).toLowerCase() === '.css') {
        stylesheetReferences.push(
          ...collectStylesheetReferences(importedStylesheetPath, depth + 1),
        );
      }
    }

    stylesheetReferences.push(...extractCssUrlReferences(stylesheetText, stylesheetBaseDir));
    return stylesheetReferences;
  }

  for (const match of indexHtml.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = extractHtmlAttribute(tag, 'rel');
    if (!rel.split(/\s+/).some((token) => token.toLowerCase() === 'stylesheet')) continue;

    const stylesheetPath = normalizeAssetReference(extractHtmlAttribute(tag, 'href'));
    if (!stylesheetPath || path.extname(stylesheetPath).toLowerCase() !== '.css') continue;

    references.push(...collectStylesheetReferences(stylesheetPath));
  }

  return references;
}

function listIndexAssetReferences(siteDir) {
  const indexPath = path.join(siteDir, 'index.html');
  if (!fs.existsSync(indexPath)) return [];

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  return extractLocalAssetReferences(indexHtml, { siteDir }).sort((a, b) => a.localeCompare(b));
}

function extractLocalAssetReferences(indexHtml, options = {}) {
  const siteDir = path.resolve(options.siteDir || defaultSiteDir);
  const references = [
    ...listHtmlDirectAssetReferences(indexHtml),
    ...listStyleBlockAssetReferences(indexHtml),
    ...listStylesheetAssetReferences(siteDir, indexHtml),
  ];

  return [...new Set(references)];
}

function findAssetReferencesMissingFromManifest(indexHtml, manifest, options = {}) {
  const manifestAssets = manifest.assets || {};
  return extractLocalAssetReferences(indexHtml, options).filter(
    (referencePath) => !manifestAssets[referencePath],
  );
}

function hashFile(absolutePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

function buildAssetManifest(options = {}) {
  const siteDir = path.resolve(options.siteDir || defaultSiteDir);
  const assets = {};

  for (const relativePath of listSiteAssetFiles(siteDir, options)) {
    const absolutePath = path.join(siteDir, relativePath);
    assets[relativePath] = {
      bytes: fs.statSync(absolutePath).size,
      sha256: hashFile(absolutePath),
    };
  }

  return {
    version: 1,
    algorithm: 'sha256',
    generatedBy: 'scripts/update-site-asset-manifest.js',
    assets,
  };
}

function formatAssetManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function readManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function writeAssetManifest(options = {}) {
  const manifestPath = path.resolve(options.manifestPath || defaultManifestPath);
  const manifest = buildAssetManifest(options);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, formatAssetManifest(manifest));
  return manifest;
}

function findManifestMismatches(expected, actual) {
  const mismatches = [];
  const expectedAssets = expected.assets || {};
  const actualAssets = actual.assets || {};
  const assetPaths = new Set([...Object.keys(expectedAssets), ...Object.keys(actualAssets)]);

  for (const assetPath of [...assetPaths].sort((a, b) => a.localeCompare(b))) {
    const expectedAsset = expectedAssets[assetPath];
    const actualAsset = actualAssets[assetPath];
    if (!expectedAsset) {
      mismatches.push(`${assetPath}: unexpected in committed manifest`);
      continue;
    }
    if (!actualAsset) {
      mismatches.push(`${assetPath}: missing from committed manifest`);
      continue;
    }
    if (expectedAsset.bytes !== actualAsset.bytes) {
      mismatches.push(
        `${assetPath}: bytes expected ${expectedAsset.bytes}, found ${actualAsset.bytes}`,
      );
    }
    if (expectedAsset.sha256 !== actualAsset.sha256) {
      mismatches.push(
        `${assetPath}: sha256 expected ${expectedAsset.sha256}, found ${actualAsset.sha256}`,
      );
    }
  }

  return mismatches;
}

function findReferencedAssetMismatches(siteDir, manifest) {
  const manifestAssets = manifest.assets || {};

  return listIndexAssetReferences(siteDir)
    .filter((referencePath) => !manifestAssets[referencePath])
    .map(
      (referencePath) =>
        `${referencePath}: referenced by index.html or linked stylesheets but missing from committed manifest`,
    );
}

function checkAssetManifest(options = {}) {
  const manifestPath = path.resolve(options.manifestPath || defaultManifestPath);
  const siteDir = path.resolve(options.siteDir || defaultSiteDir);
  const expected = buildAssetManifest(options);

  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      manifestPath,
      mismatches: [`${path.relative(repoRoot, manifestPath)}: missing committed manifest`],
    };
  }

  const actual = readManifest(manifestPath);
  const mismatches = [
    ...findManifestMismatches(expected, actual),
    ...findReferencedAssetMismatches(siteDir, actual),
  ];
  return {
    ok: mismatches.length === 0,
    manifestPath,
    mismatches,
  };
}

function parseArgs(argv) {
  const options = { check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--site-dir') {
      options.siteDir = argv[++index];
    } else if (arg === '--manifest') {
      options.manifestPath = argv[++index];
    } else {
      throw new Error(`Unsupported argument: ${arg}`);
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.check) {
    const result = checkAssetManifest(options);
    if (!result.ok) {
      console.error(
        `site asset manifest is stale: ${path.relative(repoRoot, result.manifestPath)}`,
      );
      for (const mismatch of result.mismatches) {
        console.error(`- ${mismatch}`);
      }
      console.error('Run `npm run update:site-asset-manifest` to refresh it.');
      process.exit(1);
    }
    console.log(`site asset manifest OK: ${path.relative(repoRoot, result.manifestPath)}`);
    return;
  }

  const manifest = writeAssetManifest(options);
  console.log(`wrote ${Object.keys(manifest.assets).length} site asset fingerprints`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

module.exports = {
  buildAssetManifest,
  checkAssetManifest,
  extractLocalAssetReferences,
  findAssetReferencesMissingFromManifest,
  findManifestMismatches,
  findReferencedAssetMismatches,
  formatAssetManifest,
  listIndexAssetReferences,
  listSiteAssetFiles,
  maxStylesheetImportDepth,
  writeAssetManifest,
};
