#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const FULL_TEST_SCRIPTS = [
  'test:learning',
  'test:practice',
  'test:exam',
  'test:answer-validation',
  'test:question-text',
  'test:answer-shuffle',
  'test:audio',
  'test:derived-content',
  'test:content',
  'test:compliance',
  'test:monetization',
  'test:ui-effects',
  'test:ux-simulation',
  'test:publishing',
  'test:ownership',
  'test:external-blockers',
  'test:public-urls',
  'test:static-site-account-scope',
  'test:static-site-asset-references',
  'test:native-account-scope',
  'test:static-site-privacy-copy',
  'test:static-site-question-feedback',
  'test:static-site-settings-language',
  'test:static-site-practice-result-i18n',
  'test:static-site-answer-shuffle',
  'test:static-site-flag-palette',
  'test:static-site-mobile-nav',
  'test:static-site-question-count-copy',
  'test:static-site-chapter-count-copy',
  'test:static-site-source-provenance-copy',
  'test:build-config',
  'test:app-assets',
  'test:router-shell',
  'test:architecture',
  'test:screenshot-manifest',
  'test:release-preflight',
  'test:release-gates-writer',
  'test:theme-discipline',
  'test:a11y-labels',
];

const TEST_FILTERS = new Map([['monetization', ['test:monetization']]]);

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function runNpmScript(scriptName) {
  const result = spawnSync(npmCommand(), ['run', scriptName], { stdio: 'inherit' });

  if (result.error) {
    console.error(`Failed to run npm script "${scriptName}": ${result.error.message}`);
    return 1;
  }

  if (result.signal) {
    console.error(`npm script "${scriptName}" stopped with signal ${result.signal}`);
    return 1;
  }

  return result.status ?? 1;
}

function supportedFiltersLabel() {
  return [...TEST_FILTERS.keys()].sort().join(', ');
}

function selectScripts(args) {
  const selectors = args.filter((arg) => arg && arg !== '--');

  if (selectors.length === 0) {
    return { ok: true, scripts: FULL_TEST_SCRIPTS };
  }

  if (selectors.length === 1 && TEST_FILTERS.has(selectors[0])) {
    return { ok: true, scripts: TEST_FILTERS.get(selectors[0]) };
  }

  return {
    ok: false,
    message: `Unsupported test selector "${selectors.join(' ')}". Supported selectors: ${supportedFiltersLabel()}.`,
  };
}

function main(args = process.argv.slice(2)) {
  const selected = selectScripts(args);

  if (!selected.ok) {
    console.error(selected.message);
    return 1;
  }

  for (const scriptName of selected.scripts) {
    const status = runNpmScript(scriptName);
    if (status !== 0) return status;
  }

  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  FULL_TEST_SCRIPTS,
  TEST_FILTERS,
  selectScripts,
  supportedFiltersLabel,
};
