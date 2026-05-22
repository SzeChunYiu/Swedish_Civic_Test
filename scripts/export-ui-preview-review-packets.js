#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repoRoot, 'docs/localization/review-packets/ui-preview-v8');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const checkMode = process.argv.includes('--check');

const previewModules = [
  { locale: 'ar', file: 'lib/localization/arUiPreview.ts', constName: 'arUiPreview' },
  { locale: 'ckb', file: 'lib/localization/ckbUiPreview.ts', constName: 'ckbUiPreview' },
  { locale: 'fa', file: 'lib/localization/faUiPreview.ts', constName: 'faUiPreview' },
  { locale: 'pl', file: 'lib/localization/plUiPreview.ts', constName: 'plUiPreview' },
  { locale: 'so', file: 'lib/localization/soUiPreview.ts', constName: 'soUiPreview' },
  { locale: 'ti', file: 'lib/localization/tiUiPreview.ts', constName: 'tiUiPreview' },
  { locale: 'tr', file: 'lib/localization/trUiPreview.ts', constName: 'trUiPreview' },
  { locale: 'uk', file: 'lib/localization/ukUiPreview.ts', constName: 'ukUiPreview' },
  { locale: 'zh-Hans', file: 'lib/localization/zhHansUiPreview.ts', constName: 'zhHansUiPreview' },
  { locale: 'zh-Hant', file: 'lib/localization/zhHantUiPreview.ts', constName: 'zhHantUiPreview' },
];

const header = [
  'locale',
  'ui_path',
  'surface',
  'target_text',
  'placeholders',
  'source_style_guide',
  'source_phrasebook',
  'review_focus',
  'native_review_status',
  'reviewer_notes',
];

const UNSUPPORTED_OUTCOME_CLAIM_PATTERNS = [
  /\bpassport\s+(?:guarantee|guaranteed|promise)\b/i,
  /\bguarante(?:e|ed|es)\b[^.?!]*(?:pass|passport|citizenship|approval)/i,
  /\b(?:pass|passing)\b[^.?!]*(?:guarante(?:e|ed|es)|official citizenship test)/i,
  /(?:护照|護照)[^.。！？]*(?:保证|保證|包过|包過|通过|通過)/i,
  /(?:取得|获得|獲得)[^.。！？]*(?:公民身份|公民身分)/i,
  /(?:جواز السفر|المواطنة)[^.؟!]*(?:مضمون|ضمان|نضمن)/i,
  /(?:پاسپۆرت|هاوڵاتیبوون|شهروندی|گذرنامه)[^.؟!]*(?:گەرەنتی|تضمین)/i,
  /(?:paszport|obywatelstwo)[^.?!]*(?:gwaranc|zagwarant)/i,
  /(?:pasaport|vatandaşlık)[^.?!]*(?:garanti|kesin)/i,
  /(?:паспорт|громадянство)[^.?!]*(?:гарант|точно)/i,
];
const APPROVED_SWEDISH_PROPER_NAMES = ['UHR', 'Migrationsverket', 'Skolverket', 'Riksdag'];
const COMMON_SWEDISH_CIVIC_TERMS = [
  { term: 'kommun', pattern: /\bkommun(?:en|er|erna|al|ala)?\b/i },
  { term: 'region', pattern: /\bregion(?:en|er|erna|al|ala)?\b/i },
  { term: 'välfärd', pattern: /\bv[äa]lf[aä]rd(?:en|s)?\b/i },
  { term: 'myndighet', pattern: /\bmyndighet(?:en|er|erna|s)?\b/i },
];
const CIVIC_TERM_BLOCKLIST_BY_LOCALE = Object.fromEntries(
  previewModules.map(({ locale }) => [
    locale,
    {
      approvedProperNames: APPROVED_SWEDISH_PROPER_NAMES,
      blockedTerms: COMMON_SWEDISH_CIVIC_TERMS,
    },
  ]),
);

function sanitize(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadPreview({ file, constName, locale }) {
  const filePath = path.join(repoRoot, file);
  const source = fs.readFileSync(filePath, 'utf8');
  const withoutConstAssertion = source.replace(/\s+as\s+const\s*;\s*$/s, ';');
  const rewritten = withoutConstAssertion.replace(
    new RegExp(`export\\s+const\\s+${constName}\\s*=`),
    'exports.preview =',
  );
  if (rewritten === source) throw new Error(`${file} does not export ${constName}`);

  const sandbox = { exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(rewritten, sandbox, { filename: file, timeout: 3000 });
  const preview = sandbox.exports.preview;
  if (!preview || typeof preview !== 'object')
    throw new Error(`${file} did not load a preview object`);
  if (preview.locale !== locale)
    throw new Error(`${file} locale mismatch: expected ${locale}, got ${preview.locale}`);
  if (preview.status !== 'preview_only_release_blocked') {
    throw new Error(`${file} must stay preview_only_release_blocked`);
  }
  assertReviewerGuidanceFile(locale, 'sourceStyleGuide', preview.sourceStyleGuide);
  assertReviewerGuidanceFile(locale, 'sourcePhrasebook', preview.sourcePhrasebook);
  return preview;
}

function assertReviewerGuidanceFile(locale, fieldName, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    throw new Error(`${locale} ${fieldName} path missing`);
  }
  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (path.isAbsolute(normalizedPath) || normalizedPath.includes('..')) {
    throw new Error(`${locale} ${fieldName} path must be repo-relative`);
  }
  if (!fs.existsSync(path.join(repoRoot, normalizedPath))) {
    throw new Error(`${locale} ${fieldName} file missing: ${normalizedPath}`);
  }
}

function localeEntrySource(localeSource, locale) {
  const marker = `code: '${locale}',`;
  const start = localeSource.indexOf(marker);
  if (start === -1) return '';
  const nextEntry = localeSource.indexOf('\n  {', start + marker.length);
  const end = nextEntry === -1 ? localeSource.indexOf('\n];', start) : nextEntry;
  return localeSource.slice(start, end === -1 ? undefined : end);
}

function assertPreviewLocalesFailClosed() {
  const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
  const localeSource = fs.readFileSync(localesPath, 'utf8');

  for (const { locale } of previewModules) {
    const readinessEntry = readiness.locales?.[locale];
    if (
      !readinessEntry ||
      readinessEntry.appAvailable !== false ||
      readinessEntry.uiStrings !== 'not_started' ||
      readinessEntry.releaseGate !== 'blocked'
    ) {
      throw new Error(
        `${locale} readiness must remain fail-closed (appAvailable=false, uiStrings=not_started, releaseGate=blocked)`,
      );
    }

    const entrySource = localeEntrySource(localeSource, locale);
    if (!/available:\s*false/.test(entrySource) || !/fallback:\s*'en'/.test(entrySource)) {
      throw new Error(`${locale} locale option must remain unavailable with English fallback`);
    }
  }
}

function placeholders(text) {
  return Array.from(new Set(String(text).match(/\{[A-Za-z0-9_]+\}/g) ?? [])).join(',');
}

function assertPlaceholdersWellFormed(preview, uiPath, text) {
  const normalizedText = sanitize(text);
  if (!normalizedText) return;
  const withoutSupportedPlaceholders = normalizedText.replace(/\{[A-Za-z0-9_]+\}/g, '');
  if (/\$\{[A-Za-z0-9_]+\}/.test(normalizedText) || /[{}]/.test(withoutSupportedPlaceholders)) {
    throw new Error(`malformed placeholder in ${preview.locale} ${uiPath}: ${normalizedText}`);
  }
}

function reviewFocus(uiPath, text) {
  const haystack = `${uiPath} ${text}`.toLowerCase();
  if (haystack.includes('accessibilitylabel')) return 'accessibility_label';
  if (haystack.includes('privacy') || haystack.includes('dataBoundary'.toLowerCase()))
    return 'privacy_boundary';
  if (
    haystack.includes('official') ||
    haystack.includes('färmi') ||
    haystack.includes('fërmi') ||
    haystack.includes('uhr') ||
    haystack.includes('migrationsverket') ||
    haystack.includes('independence') ||
    haystack.includes('sourceboundary')
  ) {
    return 'authority_boundary';
  }
  if (
    haystack.includes('monetization') ||
    haystack.includes('purchase') ||
    haystack.includes('ads') ||
    haystack.includes('removeads') ||
    haystack.includes('price')
  ) {
    return 'monetization_copy';
  }
  if (placeholders(text)) return 'placeholder_interpolation';
  return 'native_style_accuracy';
}

function assertNoUnsupportedOutcomeClaim(preview, uiPath, text) {
  const normalizedText = sanitize(text);
  if (!normalizedText) return;
  const matchedPattern = UNSUPPORTED_OUTCOME_CLAIM_PATTERNS.find((pattern) =>
    pattern.test(normalizedText),
  );
  if (matchedPattern) {
    throw new Error(`unsupported outcome claim in ${preview.locale} ${uiPath}: ${normalizedText}`);
  }
}

function assertNoUnlocalizedCivicTerm(preview, uiPath, text) {
  const normalizedText = sanitize(text);
  if (!normalizedText) return;
  const registry = CIVIC_TERM_BLOCKLIST_BY_LOCALE[preview.locale];
  if (!registry) {
    throw new Error(`${preview.locale} missing UI preview civic-term blocklist registry`);
  }
  const matchedTerm = registry.blockedTerms.find(({ pattern }) => pattern.test(normalizedText));
  if (matchedTerm) {
    throw new Error(
      `unlocalized civic term "${matchedTerm.term}" in ${preview.locale} ${uiPath}: ${normalizedText}`,
    );
  }
}

function collectRows(preview) {
  const rows = [];
  const skipRoot = new Set(['locale', 'status', 'sourceStyleGuide', 'sourcePhrasebook']);

  function visit(value, pathParts) {
    if (typeof value === 'string') {
      if (pathParts.length === 1 && skipRoot.has(pathParts[0])) return;
      const uiPath = pathParts.join('.');
      const surface = pathParts[0];
      assertPlaceholdersWellFormed(preview, uiPath, value);
      assertNoUnsupportedOutcomeClaim(preview, uiPath, value);
      assertNoUnlocalizedCivicTerm(preview, uiPath, value);
      rows.push([
        preview.locale,
        uiPath,
        surface,
        value,
        placeholders(value),
        preview.sourceStyleGuide,
        preview.sourcePhrasebook,
        reviewFocus(uiPath, value),
        'pending_native_review',
        'pending_reviewer_notes',
      ]);
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
      visit(value[key], [...pathParts, key]);
    }
  }

  visit(preview, []);
  return rows.sort((a, b) => a[1].localeCompare(b[1]));
}

function buildReadme() {
  return `# UI preview v8 native-review packets

These are preview-only app UI copy review packets for the blocked localization target locales.

Do not use these packets to enable a locale. They exist so native reviewers can check natural wording, civic terminology, placeholders, accessibility labels, privacy/authority boundaries, monetization copy, script direction, punctuation, and runtime-risk notes before any readiness gate moves.

## Scope

- Source: typed preview-only objects under \`lib/localization/*UiPreview.ts\`.
- Review locales: ${previewModules.map(({ locale }) => `\`${locale}\``).join(', ')}.
- Status: every source object must remain \`preview_only_release_blocked\`.
- Readiness: target locales remain \`available=false\`, \`uiStrings=not_started\`, and \`releaseGate=blocked\` in the readiness ledger.

## Reviewer instructions

For each row, check that:

1. target text is natural in the target language and not a literal English/Swedish calque,
2. civic terms such as UHR, Migrationsverket, and Riksdag are handled consistently,
3. the text does not promise official outcomes, citizenship, pass results, or authority endorsement,
4. placeholders in \`{braces}\` are preserved and grammatically usable,
5. accessibility labels are understandable when read by screen readers,
6. RTL/CJK/Ge'ez/script-specific punctuation and layout risks are noted, and
7. \`native_review_status\` remains \`pending_native_review\` until a reviewed copy records a reviewer decision.
`;
}

function buildPackets() {
  assertPreviewLocalesFailClosed();

  const files = new Map();
  files.set('README.md', buildReadme());

  for (const moduleInfo of previewModules) {
    const preview = loadPreview(moduleInfo);
    const rows = collectRows(preview);
    if (rows.length < 80)
      throw new Error(`${moduleInfo.locale} has too few UI preview strings: ${rows.length}`);
    const lines = [header.join('\t'), ...rows.map((row) => row.map(sanitize).join('\t'))];
    files.set(`${moduleInfo.locale}.tsv`, `${lines.join('\n')}\n`);
  }

  return files;
}

function main() {
  const files = buildPackets();
  const mismatches = [];

  if (!checkMode) fs.mkdirSync(outputRoot, { recursive: true });

  for (const [fileName, content] of files) {
    const filePath = path.join(outputRoot, fileName);
    if (checkMode) {
      if (!fs.existsSync(filePath)) {
        mismatches.push(`${path.relative(repoRoot, filePath)} missing`);
        continue;
      }
      const existing = fs.readFileSync(filePath, 'utf8');
      if (existing !== content) mismatches.push(`${path.relative(repoRoot, filePath)} stale`);
    } else {
      fs.writeFileSync(filePath, content);
    }
  }

  if (mismatches.length > 0) {
    console.error(`UI preview review packets are stale:\n${mismatches.join('\n')}`);
    process.exit(1);
  }

  console.log(
    `UI preview review packets ${checkMode ? 'OK' : 'exported'} (${previewModules.length} locales)`,
  );
}

main();
