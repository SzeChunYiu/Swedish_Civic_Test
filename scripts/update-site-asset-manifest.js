#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultSiteDir = path.join(repoRoot, 'site');
const defaultManifestPath = path.join(defaultSiteDir, 'asset-manifest.json');
const manifestFileName = 'asset-manifest.json';
const scalarAssetReferenceAttributes = new Set(['href', 'poster', 'src']);
const srcsetAssetReferenceAttributes = new Set(['imagesrcset', 'srcset']);

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function listSiteAssetFiles(siteDir) {
  const files = [];

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
      files.push(relativePath);
    }
  }

  walk(siteDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function hashFile(absolutePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

function isExternalAssetReference(value) {
  return /^(?:https?:|data:|mailto:|tel:|#|javascript:|\/\/)/i.test(value);
}

function normalizeAssetReference(value) {
  return value
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/^\.?\//, '');
}

function normalizeLocalAssetReference(value) {
  if (!value || isExternalAssetReference(value.trim())) return null;
  const normalized = normalizeAssetReference(value);
  return normalized || null;
}

function parseSrcsetAssetCandidates(value) {
  const candidates = [];
  let index = 0;

  while (index < value.length) {
    while (index < value.length && /[\s,]/.test(value[index])) index += 1;
    const start = index;

    while (index < value.length) {
      const char = value[index];
      const currentUrl = value.slice(start, index).toLowerCase();
      if (/\s/.test(char)) break;
      if (char === ',' && !currentUrl.startsWith('data:')) break;
      index += 1;
    }

    const candidate = value.slice(start, index).trim();
    if (candidate) candidates.push(candidate);

    while (index < value.length && value[index] !== ',') index += 1;
    if (value[index] === ',') index += 1;
  }

  return candidates;
}

function extractLocalAssetReferences(indexHtml) {
  const references = [];
  const attributePattern = /\b([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

  for (const match of indexHtml.matchAll(attributePattern)) {
    const attributeName = match[1].toLowerCase();
    const attributeValue = match[2] ?? match[3] ?? match[4] ?? '';

    if (scalarAssetReferenceAttributes.has(attributeName)) {
      const reference = normalizeLocalAssetReference(attributeValue);
      if (reference) references.push(reference);
      continue;
    }

    if (srcsetAssetReferenceAttributes.has(attributeName)) {
      for (const candidate of parseSrcsetAssetCandidates(attributeValue)) {
        const reference = normalizeLocalAssetReference(candidate);
        if (reference) references.push(reference);
      }
    }
  }

  return [...new Set(references)];
}

function findAssetReferencesMissingFromManifest(indexHtml, manifest) {
  const manifestAssets = new Set(Object.keys(manifest.assets || {}));
  return extractLocalAssetReferences(indexHtml).filter(
    (assetPath) => !manifestAssets.has(assetPath),
  );
}

function buildAssetManifest(options = {}) {
  const siteDir = path.resolve(options.siteDir || defaultSiteDir);
  const assets = {};

  for (const relativePath of listSiteAssetFiles(siteDir)) {
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

function checkAssetManifest(options = {}) {
  const manifestPath = path.resolve(options.manifestPath || defaultManifestPath);
  const expected = buildAssetManifest(options);

  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      manifestPath,
      mismatches: [`${path.relative(repoRoot, manifestPath)}: missing committed manifest`],
    };
  }

  const actual = readManifest(manifestPath);
  const mismatches = findManifestMismatches(expected, actual);
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
  formatAssetManifest,
  isExternalAssetReference,
  listSiteAssetFiles,
  normalizeAssetReference,
  parseSrcsetAssetCandidates,
  writeAssetManifest,
};
