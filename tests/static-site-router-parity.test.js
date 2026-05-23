const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createRouterContext(hash) {
  const listeners = { document: new Map(), window: new Map() };
  const scripts = [];
  const pageElements = [
    '/',
    '/practice',
    '/dashboard',
    '/mock',
    '/ebook',
    '/privacy',
    '/support',
    '/terms',
    '/sources',
  ].map((page) => ({
    classNames: new Set(),
    dataset: { page },
    classList: {
      toggle(name, enabled) {
        if (enabled) this.owner.classNames.add(name);
        else this.owner.classNames.delete(name);
      },
    },
  }));
  const navElements = [
    '/practice',
    '/dashboard',
    '/mock',
    '/ebook',
    '/privacy',
    '/support',
    '/terms',
    '/sources',
  ].map((route) => ({
    classNames: new Set(),
    dataset: { route },
    classList: {
      toggle(name, enabled) {
        if (enabled) this.owner.classNames.add(name);
        else this.owner.classNames.delete(name);
      },
    },
  }));
  for (const element of [...pageElements, ...navElements]) {
    element.classList.owner = element;
  }

  const focusTarget = {
    attributes: {},
    focusOptions: null,
    scrollOptions: null,
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    focus(options) {
      this.focusOptions = options;
    },
    scrollIntoView(options) {
      this.scrollOptions = options;
    },
  };

  const document = {
    body: {
      appendChild(node) {
        scripts.push(node);
      },
    },
    head: {
      appendChild(node) {
        scripts.push(node);
      },
    },
    documentElement: { dataset: {}, style: { setProperty() {} } },
    addEventListener(type, listener) {
      listeners.document.set(type, listener);
    },
    createElement() {
      return {
        dataset: {},
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        setAttribute() {},
      };
    },
    getElementById(id) {
      return id === 'src2' ? focusTarget : null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-page]') return pageElements;
      if (selector === '.nav a[data-route]') return navElements;
      return [];
    },
  };

  const context = {
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init?.detail;
    },
    Event: function Event(type) {
      this.type = type;
    },
    clearTimeout,
    console,
    document,
    localStorage: {
      getItem() {
        return null;
      },
      removeItem() {},
      setItem() {},
    },
    location: { hash },
    matchMedia() {
      return { matches: false, addEventListener() {}, removeEventListener() {} };
    },
    navigator: {},
    scrollCalls: [],
    scrollTo(options) {
      this.scrollCalls.push(options);
    },
    sessionStorage: {
      getItem() {
        return null;
      },
      removeItem() {},
      setItem() {},
    },
    setTimeout,
    window: null,
  };
  context.window = context;
  context.addEventListener = (type, listener) => listeners.window.set(type, listener);
  context.dispatchEvent = () => true;

  const sandbox = vm.createContext(context);
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });

  return {
    activePage() {
      return pageElements.find((element) => element.classNames.has('is-active'))?.dataset.page;
    },
    focusTarget,
    route() {
      vm.runInContext('route();', sandbox, { timeout: 3000 });
    },
    sandbox,
    scripts,
  };
}

test('static router ignores malformed inner anchors while keeping the route active', () => {
  const context = createRouterContext('#/sources#%E0%A4%A');

  assert.doesNotThrow(() => context.route());
  assert.equal(context.activePage(), '/sources');
  assert.equal(context.focusTarget.scrollOptions, null);
  assert.equal(context.focusTarget.focusOptions, null);
  assert.equal(context.sandbox.smtDecodeStaticInnerAnchor('%E0%A4%A'), '');
});

test('static router still decodes and focuses valid inner anchors', () => {
  const context = createRouterContext('#/sources#src2');

  context.route();

  assert.equal(context.activePage(), '/sources');
  assert.equal(context.focusTarget.getAttribute('tabindex'), '-1');
  assert.equal(context.focusTarget.scrollOptions.block, 'start');
  assert.equal(context.focusTarget.scrollOptions.behavior, 'auto');
  assert.equal(context.focusTarget.focusOptions.preventScroll, true);
  assert.equal(context.sandbox.smtDecodeStaticInnerAnchor('src2'), 'src2');
});
