const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('native app keeps study access anonymous and local by default', () => {
  const privacyRoute = read('app/privacy.tsx');
  const onboardingRoute = read('app/onboarding.tsx');
  const profileRoute = read('app/(tabs)/profile.tsx');
  const ebookContent = read('lib/content/ebookContent.ts');
  const appSource = [privacyRoute, onboardingRoute, profileRoute, ebookContent].join('\n');

  assert.match(privacyRoute, /Account optional/);
  assert.match(privacyRoute, /works without sign-in/);
  assert.match(privacyRoute, /full study experience anonymously|without sign-in/);
  assert.match(privacyRoute, /sparas lokalt p[åa] enheten/);
  assert.match(onboardingRoute, /without an account/);
  assert.match(profileRoute, /Progress without an account/);
  assert.match(ebookContent, /without an account or network connection/);

  assert.doesNotMatch(appSource, /Continue with Google|Continue with Apple|magic link/i);
  assert.doesNotMatch(appSource, /SMT_SUPABASE|smtOpenSignin|smt_signed_in/i);
  assert.doesNotMatch(appSource, /sign in to (?:study|practice|highlight|save)/i);
});
