const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('static site exposes no reachable sign-in, OAuth, or magic-link surface', () => {
  const index = read('site/index.html');
  const app = read('site/app.js');
  const extras = read('site/i18n-extras.js');
  const styles = read('site/styles.css');
  const ebookTools = read('site/ebook-tools.js');

  const staticSurface = [index, app, extras, styles, ebookTools].join('\n');

  assert.doesNotMatch(index, /id="signin-open"|id="signin-modal"|signin\.js/);
  assert.doesNotMatch(staticSurface, /Continue with Google|Continue with Apple|Send magic link/i);
  assert.doesNotMatch(staticSurface, /smtOpenSignin|smt_signed_in|signin__/);
  assert.doesNotMatch(staticSurface, /Sign in to (?:sync|highlight)|Logga in for att markera/i);
});

test('ebook highlights and notes stay local without account prompts', () => {
  const index = read('site/index.html');
  const ebookTools = read('site/ebook-tools.js');

  assert.match(index, /Highlights and notes stay in this browser\. No account is needed\./);
  assert.match(ebookTools, /localStorage\.setItem\("smt_hl_"/);
  assert.match(ebookTools, /function showPopForSelection\(\)/);
  assert.doesNotMatch(ebookTools, /isSignedIn|showSigninNudge|data-act="signin"/);
});
