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

function createSigninHarness(hash = '#/ebook?c=ch04', storageValues = new Map(), options = {}) {
  const sessionValues = new Map();
  const localStorageOps = [];
  const sessionStorageOps = [];
  const listeners = new Map();
  const location = {
    hash,
    hostname: 'almostswedish.se',
    origin: 'https://almostswedish.se',
    pathname: '/',
  };
  const document = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    body: { style: {} },
    getElementById() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  function shouldDeny(storageName, operation) {
    const denied = options[storageName] || [];
    return denied === true || denied.includes(operation);
  }
  function recordStorageOp(ops, storageName, operation, key) {
    ops.push({ key, operation, storageName });
    if (shouldDeny(storageName, operation)) {
      throw new Error(`${storageName}.${operation} denied`);
    }
  }
  const localStorage = {
    getItem(key) {
      recordStorageOp(localStorageOps, 'localStorage', 'getItem', key);
      return storageValues.has(key) ? storageValues.get(key) : null;
    },
    removeItem(key) {
      recordStorageOp(localStorageOps, 'localStorage', 'removeItem', key);
      storageValues.delete(key);
    },
    setItem(key, value) {
      recordStorageOp(localStorageOps, 'localStorage', 'setItem', key);
      storageValues.set(key, String(value));
    },
  };
  const sessionStorage = {
    getItem(key) {
      recordStorageOp(sessionStorageOps, 'sessionStorage', 'getItem', key);
      return sessionValues.has(key) ? sessionValues.get(key) : null;
    },
    removeItem(key) {
      recordStorageOp(sessionStorageOps, 'sessionStorage', 'removeItem', key);
      sessionValues.delete(key);
    },
    setItem(key, value) {
      recordStorageOp(sessionStorageOps, 'sessionStorage', 'setItem', key);
      sessionValues.set(key, String(value));
    },
  };
  const context = {
    console,
    document,
    Event,
    location,
    localStorage,
    sessionStorage,
    window: {
      SMT_SITE_ORIGIN: 'https://almostswedish.se',
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      dispatchEvent() {},
      location,
      localStorage,
      sessionStorage,
    },
  };
  context.globalThis = context;

  vm.runInNewContext(read('site/signin.js'), context, { filename: 'site/signin.js' });

  return { context, listeners, localStorageOps, sessionStorageOps, sessionValues, storageValues };
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
  assert.match(purchase, /plan/);
  assert.match(purchase, /functions\/v1\/create-checkout/);
  assert.match(purchase, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(purchase, /body:\s*JSON\.stringify\(\{\s*plan\s*\}\)/);
  assert.match(purchase, /Stripe Checkout Session/);
  assert.match(purchase, /client\.from\('entitlements'\)\.select\('plan'\)\.eq\('active', true\)/);
});

test('sign-in session persistence exposes stable account identity for purchases', () => {
  const signin = read('site/signin.js');

  assert.match(signin, /session\.user\.id/);
  assert.match(signin, /smt_account_id/);
  assert.match(signin, /smt_account_email/);
  assert.match(signin, /localStorage\.removeItem\(['"]smt_account_id['"]\)/);
  assert.match(signin, /window\.dispatchEvent\(new Event\(['"]smt:authchange['"]\)\)/);
});

test('static sign-in preserves sanitized hash return routes without putting them in Supabase redirects', () => {
  const signin = read('site/signin.js');
  assert.match(signin, /SIGNIN_RETURN_ROUTE_KEY = ['"]smt_signin_return_route['"]/);
  assert.match(
    signin,
    /captureSigninReturnRoute\(\);\s*\n\s*client\.auth\s*\n\s*\.signInWithOAuth/,
  );
  assert.match(signin, /captureSigninReturnRoute\(\);\s*\n\s*client\.auth\s*\n\s*\.signInWithOtp/);
  assert.match(signin, /if \(nowSignedIn\) restoreSigninReturnRoute\(\)/);

  const { context, sessionValues, storageValues } = createSigninHarness('#/ebook?c=ch04');
  assert.equal(context.window.smtSigninRedirectTarget(), 'https://almostswedish.se/');
  assert.equal(context.window.smtSigninCaptureReturnRoute(), '#/ebook?c=ch04');
  assert.equal(JSON.parse(sessionValues.get('smt_signin_return_route')).route, '#/ebook?c=ch04');
  assert.equal(JSON.parse(storageValues.get('smt_signin_return_route')).route, '#/ebook?c=ch04');

  context.location.hash = '#access_token=fake-token&refresh_token=fake-refresh';
  assert.equal(context.window.smtSigninRestoreReturnRoute(), '#/ebook?c=ch04');
  assert.equal(context.location.hash, '#/ebook?c=ch04');
  assert.equal(sessionValues.has('smt_signin_return_route'), false);
  assert.equal(storageValues.has('smt_signin_return_route'), false);

  const firstTab = createSigninHarness('#/practice?c=4');
  assert.equal(firstTab.context.window.smtSigninCaptureReturnRoute(), '#/practice?c=4');
  const magicLinkTab = createSigninHarness(
    '#access_token=fake-token&refresh_token=fake-refresh',
    firstTab.storageValues,
  );
  assert.equal(magicLinkTab.context.window.smtSigninRestoreReturnRoute(), '#/practice?c=4');
  assert.equal(magicLinkTab.context.location.hash, '#/practice?c=4');
  assert.equal(firstTab.storageValues.has('smt_signin_return_route'), false);

  assert.equal(context.window.smtNormalizeSigninReturnRoute('#/dashboard'), '#/dashboard');
  assert.equal(context.window.smtNormalizeSigninReturnRoute('#/practice?c=4'), '#/practice?c=4');
  assert.equal(
    context.window.smtNormalizeSigninReturnRoute('#/#purchase-account-gate'),
    '#/#purchase-account-gate',
  );
  assert.equal(context.window.smtNormalizeSigninReturnRoute('#/admin'), '#/');
  assert.equal(context.window.smtNormalizeSigninReturnRoute('https://evil.test/#/ebook'), '#/');
  assert.equal(context.window.smtNormalizeSigninReturnRoute('#/ebook?c=<script>'), '#/');
});

test('static sign-in return-route storage ignores stale and unsafe payloads', () => {
  const key = 'smt_signin_return_route';
  const stale = createSigninHarness('#access_token=fake-token&refresh_token=fake-refresh');
  stale.storageValues.set(
    key,
    JSON.stringify({
      route: '#/ebook?c=ch04',
      storedAt: Date.now() - 31 * 60 * 1000,
    }),
  );

  assert.equal(stale.context.window.smtSigninRestoreReturnRoute(), '');
  assert.equal(stale.context.location.hash, '#access_token=fake-token&refresh_token=fake-refresh');
  assert.equal(stale.storageValues.has(key), false);

  const legacyRawRoute = createSigninHarness(
    '#access_token=fake-token&refresh_token=fake-refresh',
    new Map([[key, '#/practice?c=4']]),
  );
  assert.equal(legacyRawRoute.context.window.smtSigninRestoreReturnRoute(), '#/practice?c=4');
  assert.equal(legacyRawRoute.context.location.hash, '#/practice?c=4');
  assert.equal(legacyRawRoute.storageValues.has(key), false);

  const malformedUnsafe = createSigninHarness(
    '#access_token=fake-token&refresh_token=fake-refresh',
    new Map([[key, '{"route":"https://evil.test/#/ebook"']]),
  );
  assert.equal(malformedUnsafe.context.window.smtSigninRestoreReturnRoute(), '#/');
  assert.equal(malformedUnsafe.context.location.hash, '#/');
  assert.equal(malformedUnsafe.storageValues.has(key), false);
});

test('static sign-in return-route storage fails closed when browser storage is denied', () => {
  const denied = createSigninHarness('#/ebook?c=ch04', new Map(), {
    localStorage: ['getItem', 'removeItem', 'setItem'],
    sessionStorage: ['getItem', 'removeItem', 'setItem'],
  });

  assert.doesNotThrow(() => {
    assert.equal(denied.context.window.smtSigninCaptureReturnRoute(), '#/ebook?c=ch04');
  });

  denied.context.location.hash = '#access_token=fake-token&refresh_token=fake-refresh';
  assert.doesNotThrow(() => {
    assert.equal(denied.context.window.smtSigninRestoreReturnRoute(), '');
  });
  assert.equal(denied.context.location.hash, '#access_token=fake-token&refresh_token=fake-refresh');
});

test('static sign-in return-route restore consumes session and local stores once', () => {
  const key = 'smt_signin_return_route';
  const harness = createSigninHarness('#/dashboard');

  assert.equal(harness.context.window.smtSigninCaptureReturnRoute(), '#/dashboard');
  harness.context.location.hash = '#access_token=fake-token&refresh_token=fake-refresh';
  assert.equal(harness.context.window.smtSigninRestoreReturnRoute(), '#/dashboard');
  assert.equal(harness.context.location.hash, '#/dashboard');
  assert.equal(harness.sessionValues.has(key), false);
  assert.equal(harness.storageValues.has(key), false);

  assert.equal(
    harness.sessionStorageOps.filter((op) => op.operation === 'removeItem' && op.key === key)
      .length,
    1,
  );
  assert.equal(
    harness.localStorageOps.filter((op) => op.operation === 'removeItem' && op.key === key).length,
    1,
  );
});
