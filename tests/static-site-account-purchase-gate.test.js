const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const purchaseLocales = ['ckb', 'fa', 'so', 'ti', 'tr'];

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function loadExtraI18n() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('site/i18n-extras.js'), sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra;
}

function createStaticFxHarness() {
  const elementsById = new Map();
  const timeouts = [];

  function makeElement(tagName) {
    return {
      tagName,
      children: [],
      className: '',
      id: '',
      innerHTML: '',
      style: {},
      textContent: '',
      appendChild(child) {
        this.children.push(child);
        if (child.id) elementsById.set(child.id, child);
        return child;
      },
      remove() {
        this.removed = true;
      },
    };
  }

  const sandbox = {
    document: {
      body: {
        appendChild(child) {
          if (child.id) elementsById.set(child.id, child);
          return child;
        },
      },
      createElement: makeElement,
      documentElement: {
        getAttribute() {
          return null;
        },
      },
      getElementById(id) {
        return elementsById.get(id) ?? null;
      },
    },
    matchMedia() {
      return { matches: false };
    },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setTimeout(callback, delay) {
      timeouts.push({ callback, delay });
      return timeouts.length;
    },
    window: {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('site/fx.js'), sandbox, { timeout: 3000 });
  return { elementsById, sandbox, timeouts };
}

test('static toast helper renders public messages as text by default', () => {
  const fxSource = read('site/fx.js');
  const { elementsById, sandbox, timeouts } = createStaticFxHarness();
  const unsafeMessage = '<img src=x onerror=alert(1)> Signed in as a&b@example.test';

  sandbox.window.smtFx.toast(unsafeMessage, { duration: 1234, flavor: 'win' });

  const host = elementsById.get('smt-toast-host');
  assert.ok(host, 'toast host should be created');
  assert.equal(host.children.length, 1);

  const toast = host.children[0];
  assert.equal(toast.className, 'smt-toast smt-toast--win');
  assert.equal(toast.textContent, unsafeMessage);
  assert.equal(toast.innerHTML, '');
  assert.equal(timeouts[0].delay, 1234);
  assert.match(fxSource, /t\.textContent\s*=\s*String\(msg \?\? ''\)/);
  assert.doesNotMatch(fxSource, /t\.innerHTML\s*=\s*msg/);
});

test('static web purchase surface is present but locked to signed-in accounts', () => {
  const index = read('site/index.html');
  const purchase = read('site/purchase.js');

  assert.match(index, /id="purchase-account-gate"/);
  assert.match(index, /data-purchase-kind="remove_ads"/);
  assert.match(index, /data-purchase-kind="pro_lifetime"/);
  assert.match(index, /29\s*(?:SEK|kr)/i);
  assert.match(index, /59\s*(?:SEK|kr)/i);
  assert.match(purchase, /function\s+requireSignedInAccount\b/);
  assert.match(purchase, /window\.smtOpenSignin\(\)/);
  assert.match(purchase, /purchaseLocked/);
  assert.match(purchase, /smt:authchange/);
});

test('purchase handoff binds the selected plan to the signed-in Supabase account', () => {
  const purchase = read('site/purchase.js');

  assert.match(purchase, /smt_account_id/);
  assert.match(purchase, /smt_account_email/);
  assert.match(purchase, /URLSearchParams/);
  assert.match(purchase, /account_id/);
  assert.match(purchase, /plan/);
  assert.match(purchase, /play\.google\.com\/store\/apps\/details/);
  assert.match(purchase, /purchase_intents/);
  assert.match(purchase, /user_id:\s*account\.id/);
  assert.match(purchase, /plan:\s*kind/);
});

test('sign-in session persistence exposes stable account identity for purchases', () => {
  const signin = read('site/signin.js');

  assert.match(signin, /session\.user\.id/);
  assert.match(signin, /smt_account_id/);
  assert.match(signin, /smt_account_email/);
  assert.match(signin, /localStorage\.removeItem\(['"]smt_account_id['"]\)/);
  assert.match(signin, /window\.dispatchEvent\(new Event\(['"]smt:authchange['"]\)\)/);
});

test('extra-locale purchase copy preserves account interpolation and plan prices', () => {
  const extra = loadExtraI18n();

  for (const locale of purchaseLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);
    assert.match(
      dictionary['purchase.status.ready'],
      /\{account\}/,
      `${locale} ready status must keep the account placeholder`,
    );
    assert.match(
      dictionary['purchase.removeAds.ready'],
      /Google Play[\s\S]*29 kr/,
      `${locale} Remove Ads purchase CTA should keep Google Play and 29 kr`,
    );
    assert.match(
      dictionary['purchase.premium.ready'],
      /Google Play[\s\S]*59 kr/,
      `${locale} Premium purchase CTA should keep Google Play and 59 kr`,
    );
  }
});
