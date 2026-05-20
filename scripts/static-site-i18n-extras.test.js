const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createI18nContext({ storedLanguage = 'en' } = {}) {
  const listeners = { document: [], window: [] };
  const storage = new Map([['smt_lang', storedLanguage]]);
  const translatedNodes = ['nav.home', 'hero.cta1', 'settings.title', 'consent.title'].map(
    (key) => ({
      dataset: { i18n: key },
      innerHTML: '',
    }),
  );
  const languageButtons = ['en', 'sv', 'zh-Hans', 'zh-Hant', 'ar', 'so'].map((lang) => ({
    dataset: { lang },
    classList: {
      active: false,
      toggle(_className, enabled) {
        this.active = !!enabled;
      },
    },
  }));
  const documentElement = {
    attributes: new Map(),
    dir: 'ltr',
    lang: storedLanguage,
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      this[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes.get(name) || null;
    },
  };

  const sandbox = {
    CustomEvent: function CustomEvent(type, init = {}) {
      return { type, detail: init.detail || null };
    },
    Event: function Event(type) {
      return { type };
    },
    console,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: { hash: '#/' },
    document: {
      documentElement,
      getElementById() {
        return null;
      },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '[data-i18n]') return translatedNodes;
        if (selector === '.lang button[data-lang]') return languageButtons;
        return [];
      },
      addEventListener(type, handler) {
        listeners.document.push({ type, handler });
      },
    },
    window: {},
    scrollTo() {},
  };

  sandbox.window = sandbox;
  sandbox.window.addEventListener = (type, handler) => {
    listeners.window.push({ type, handler });
  };
  sandbox.window.dispatchEvent = (event) => {
    listeners.window
      .filter((entry) => entry.type === event.type)
      .forEach((entry) => entry.handler(event));
    return true;
  };

  vm.createContext(sandbox);
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext(read('site/i18n-extras.js'), sandbox, { timeout: 3000 });

  return {
    activeLanguages() {
      return languageButtons
        .filter((button) => button.classList.active)
        .map((button) => button.dataset.lang);
    },
    dispatchWindow(type) {
      listeners.window
        .filter((entry) => entry.type === type)
        .forEach((entry) => entry.handler({ type }));
    },
    documentElement,
    sandbox,
    storage,
    translated(key) {
      return translatedNodes.find((node) => node.dataset.i18n === key).innerHTML;
    },
  };
}

test('static extra-language selection applies Arabic RTL direction and renders Arabic UI strings', () => {
  const context = createI18nContext();

  vm.runInContext('smtSetLanguage("ar");', context.sandbox, { timeout: 3000 });

  assert.equal(context.documentElement.lang, 'ar');
  assert.equal(context.documentElement.dir, 'rtl');
  assert.equal(context.documentElement.getAttribute('dir'), 'rtl');
  assert.equal(context.storage.get('smt_lang'), 'ar');
  assert.deepEqual(context.activeLanguages(), ['ar']);
  assert.equal(context.translated('nav.home'), 'الرئيسية');
  assert.equal(context.translated('settings.title'), 'الإعدادات');
  assert.equal(context.translated('consent.title'), 'ملفات تعريف الارتباط، باعتدال.');
});

test('static extra-language restore applies RTL only for Arabic and resets other languages to LTR', () => {
  const context = createI18nContext({ storedLanguage: 'ar' });

  context.dispatchWindow('DOMContentLoaded');
  assert.equal(context.documentElement.lang, 'ar');
  assert.equal(context.documentElement.dir, 'rtl');

  vm.runInContext('smtSetLanguage("zh-Hans");', context.sandbox, { timeout: 3000 });
  assert.equal(context.documentElement.lang, 'zh-Hans');
  assert.equal(context.documentElement.dir, 'ltr');
  assert.equal(context.translated('settings.title'), '设置');

  vm.runInContext('smtSetLanguage("so");', context.sandbox, { timeout: 3000 });
  assert.equal(context.documentElement.lang, 'so');
  assert.equal(context.documentElement.dir, 'ltr');
  assert.equal(context.translated('nav.home'), 'Bogga Hore');
});

test('static RTL stylesheet covers visible navigation, hero, settings, and consent surfaces', () => {
  const styles = read('site/styles.css');

  assert.match(styles, /:root\[dir="rtl"\]\s*\{\s*direction:\s*rtl;/);
  assert.match(
    styles,
    /:root\[dir="rtl"\]\s+\.nav\s*\{[^}]*margin-left:\s*0;[^}]*margin-right:\s*auto;/s,
  );
  assert.match(styles, /:root\[dir="rtl"\]\s+\.hero__inner,[\s\S]*?text-align:\s*right;/);
  assert.match(styles, /:root\[dir="rtl"\]\s+\.consent__copy,[\s\S]*?text-align:\s*right;/);
  assert.match(
    styles,
    /:root\[dir="rtl"\]\s+\.modal__panel--settings\s*\{[^}]*text-align:\s*right;/s,
  );
});
