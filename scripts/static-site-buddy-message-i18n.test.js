const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('buddy message API resolves locale maps instead of English/Swedish branching', () => {
  const buddiesSource = read('site/buddies.js');

  assert.match(buddiesSource, /function buddyRuntimeMessage\(message, fallback\)/);
  assert.doesNotMatch(buddiesSource, /lang\s*===\s*['"]sv['"]\s*\?\s*msgSv\s*:\s*msgEn/);
});

test('quiz and practice buddy messages provide locale-map copy', () => {
  const appSource = read('site/app.js');
  const practiceSource = read('site/practice.js');

  assert.match(appSource, /function smtQuizBuddyMessage\(key, values = \{\}\)/);
  assert.match(appSource, /const SMT_QUIZ_BUDDY_COPY\s*=\s*\{/);
  assert.match(practiceSource, /function mockBuddyMessage\(key, values = \{\}\)/);
  assert.match(practiceSource, /const mockBuddyCopy\s*=\s*\{/);

  for (const source of [appSource, practiceSource]) {
    assert.doesNotMatch(source, /smtBuddyCelebrate\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*\)/);
    assert.doesNotMatch(source, /smtBuddyConsole\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*\)/);
  }
});
