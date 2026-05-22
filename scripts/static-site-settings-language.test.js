const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const staticSiteLanguageValues = [
  'en',
  'sv',
  'zh-Hans',
  'zh-Hant',
  'ar',
  'ckb',
  'fa',
  'pl',
  'so',
  'ti',
  'tr',
  'uk',
];

const sampleQuestion = {
  id: 'q-settings-language',
  type: 'single_choice',
  chapter: 'Ch. 1',
  chapterId: 1,
  q: {
    en: 'Where is Sweden located?',
    sv: 'Var ligger Sverige?',
  },
  opts: [
    { en: 'In southern Europe', sv: 'I södra Europa' },
    { en: 'In the Nordic region in northern Europe', sv: 'I Norden i norra Europa' },
  ],
  answer: 1,
  why: {
    en: 'Sweden is part of the Nordic region in northern Europe.',
    sv: 'Sverige är en del av Norden i norra Europa.',
  },
  source: {
    title: 'Sverige i fokus',
    chapter: 'Landet Sverige',
    section: 'Geografi',
    page: 7,
  },
};

const chapterMeta = [
  {
    id: 1,
    emoji: '01',
    title: {
      en: 'Land of Sweden',
      sv: 'Landet Sverige',
    },
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function extractSigninDictionaryBlock(source, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`'${escapedKey}':\\s*\\{([\\s\\S]*?)\\n    \\},`));
  assert.ok(match, `signin dictionary should include ${key}`);
  return match[1];
}

function extractSigninDictionaryLocales(source, key) {
  const block = extractSigninDictionaryBlock(source, key);
  return new Set(
    Array.from(
      block.matchAll(/(?:'([^']+)'|([a-z][\w-]*)):\s*'[^']*'/g),
      (match) => match[1] || match[2],
    ),
  );
}

function createRenderContext({
  hash,
  language = 'en',
  reducedMotion = false,
  storedMotion,
  storedTextSize,
  storedPalette,
  storedTheme,
  systemDark = false,
}) {
  const elements = new Map();
  const listeners = { document: [], window: [] };
  const rootAttributes = new Map();
  const rootStyleProperties = new Map();
  const storage = new Map([
    ['smt_lang', language],
    ['smt_mock_cfg', JSON.stringify({ count: 5, minutes: 30, chapters: [1] })],
  ]);
  if (storedMotion !== undefined) storage.set('smt_motion', storedMotion);
  if (storedTextSize !== undefined) storage.set('smt_textsize', storedTextSize);
  if (storedPalette !== undefined) storage.set('smt_palette', storedPalette);
  if (storedTheme !== undefined) storage.set('smt_theme', storedTheme);
  let reloadCount = 0;

  function createSegmentButton(value) {
    return {
      attributes: {},
      dataset: { val: value },
      classNames: new Set(),
      classList: {
        toggle(name, on) {
          if (on) this.owner.classNames.add(name);
          else this.owner.classNames.delete(name);
        },
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
    };
  }

  const segmentButtons = {
    language: staticSiteLanguageValues.map(createSegmentButton),
    textsize: ['90', '100', '115'].map(createSegmentButton),
  };
  Object.values(segmentButtons)
    .flat()
    .forEach((button) => {
      button.classList.owner = button;
    });
  const settingButtons = segmentButtons.language;
  const a11yControlKeys = new Map([
    ['settings-open', 'a11y.settings.open'],
    ['settings-modal-close', 'a11y.close'],
    ['ad-anchor-close', 'a11y.ad.close'],
    ['dala-bubble-close', 'a11y.close'],
    ['dala-figure', 'a11y.studyBuddy'],
  ]);

  function element(id) {
    if (!elements.has(id)) {
      const attributes = new Map();
      const node = {
        id,
        attributes,
        dataset: a11yControlKeys.has(id) ? { a11yLabel: a11yControlKeys.get(id) } : {},
        hidden: false,
        innerHTML: '',
        max: '',
        style: {},
        textContent: '',
        value: id === 'cfg-count' ? '5' : '',
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        setAttribute(name, value) {
          attributes.set(name, String(value));
        },
        getAttribute(name) {
          return attributes.get(name) ?? null;
        },
        closest() {
          return {
            querySelector() {
              return { textContent: '' };
            },
          };
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
      };
      elements.set(id, node);
    }
    return elements.get(id);
  }
  Array.from(a11yControlKeys.keys()).forEach(element);

  const sandbox = {
    Array,
    CustomEvent: function CustomEvent(type, init = {}) {
      return { type, detail: init.detail || null };
    },
    console,
    confirm: () => true,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      removeItem(key) {
        storage.delete(key);
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: {
      hash,
      reload() {
        reloadCount += 1;
      },
    },
    document: {
      body: { style: {} },
      documentElement: {
        dir: language === 'ar' || language === 'ckb' || language === 'fa' ? 'rtl' : 'ltr',
        lang: language,
        setAttribute(name, value) {
          rootAttributes.set(name, String(value));
          if (name === 'dir') this.dir = String(value);
          if (name === 'lang') this.lang = String(value);
        },
        getAttribute(name) {
          return rootAttributes.get(name) ?? null;
        },
        style: {
          setProperty(name, value) {
            rootStyleProperties.set(name, String(value));
          },
        },
      },
      createElement() {
        return {
          async: false,
          crossOrigin: '',
          src: '',
        };
      },
      getElementById: element,
      head: { appendChild() {} },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        const segmentMatch = selector.match(/^\[data-set="([^"]+)"\] button$/);
        if (segmentMatch && segmentButtons[segmentMatch[1]]) {
          return segmentButtons[segmentMatch[1]];
        }
        if (selector === '[data-a11y-label]') {
          return Array.from(elements.values()).filter((node) => node.dataset.a11yLabel);
        }
        return [];
      },
      addEventListener(type, handler) {
        listeners.document.push({ type, handler });
      },
    },
    sessionStorage: {
      getItem() {
        return null;
      },
      removeItem() {},
      setItem() {},
    },
    window: {},
    clearInterval() {},
    matchMedia: (query) => {
      const matches =
        query === '(prefers-reduced-motion: reduce)'
          ? reducedMotion
          : query === '(prefers-color-scheme: dark)'
            ? systemDark
            : false;
      return {
        matches,
        addEventListener() {},
      };
    },
    requestAnimationFrame(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
    setInterval: () => 1,
    setTimeout(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
  };

  sandbox.window = sandbox;
  sandbox.window.SMT_CHAPTERS_META = chapterMeta;
  sandbox.window.SMT_QUESTIONS = [sampleQuestion];
  sandbox.window.addEventListener = (type, handler) => {
    listeners.window.push({ type, handler });
  };
  sandbox.window.dispatchEvent = (event) => {
    listeners.window
      .filter((entry) => entry.type === event.type)
      .forEach((entry) => entry.handler(event));
    return true;
  };
  sandbox.window.scrollTo = () => {};

  vm.createContext(sandbox);
  return {
    clickSettingsOpen() {
      const target = {
        closest(selector) {
          return selector === '#settings-open' ? this : null;
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'click')
        .forEach((entry) => entry.handler({ target }));
    },
    clickSettingsLanguage(nextLanguage) {
      const target = {
        dataset: { val: nextLanguage },
        parentElement: { dataset: { set: 'language' } },
        closest(selector) {
          return selector === '[data-set] button[data-val]:not(.set-palette)' ? this : null;
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'click')
        .forEach((entry) => entry.handler({ target }));
    },
    clickSettingsTextSize(nextTextSize) {
      const target = {
        dataset: { val: nextTextSize },
        parentElement: { dataset: { set: 'textsize' } },
        closest(selector) {
          return selector === '[data-set] button[data-val]:not(.set-palette)' ? this : null;
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'click')
        .forEach((entry) => entry.handler({ target }));
    },
    changeSettingsMotion(checked) {
      const target = {
        checked,
        dataset: { set: 'motion' },
        matches(selector) {
          return selector === 'input[type=checkbox][data-set]';
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'change')
        .forEach((entry) => entry.handler({ target }));
    },
    element,
    fireWindowEvent(type) {
      listeners.window
        .filter((entry) => entry.type === type)
        .forEach((entry) => entry.handler({ type }));
    },
    get reloadCount() {
      return reloadCount;
    },
    rootAttribute(name) {
      return rootAttributes.get(name) ?? null;
    },
    rootFontSize() {
      return sandbox.document.documentElement.style.fontSize;
    },
    rootStyleProperty(name) {
      return rootStyleProperties.get(name) ?? null;
    },
    sandbox,
    settingLanguageValues() {
      return settingButtons.map((button) => button.dataset.val);
    },
    textSizePressedValues() {
      return segmentButtons.textsize
        .filter((button) => button.getAttribute('aria-pressed') === 'true')
        .map((button) => button.dataset.val);
    },
    storage,
  };
}

function loadScripts(context, practiceInjection = '') {
  vm.runInContext(read('site/app.js'), context.sandbox, { timeout: 3000 });
  vm.runInContext(read('site/i18n-extras.js'), context.sandbox, { timeout: 3000 });
  const practiceSource = practiceInjection
    ? read('site/practice.js').replace(/\}\)\(\);\s*$/, `${practiceInjection}\n})();`)
    : read('site/practice.js');
  vm.runInContext(practiceSource, context.sandbox, { timeout: 3000 });
  vm.runInContext(read('site/settings.js'), context.sandbox, { timeout: 3000 });
}

test('Settings modal source keeps keyboard focus inside the dialog', () => {
  const html = read('site/index.html');
  const source = read('site/settings.js');

  assert.match(
    html,
    /id="settings-modal"[\s\S]*?role="dialog"[\s\S]*?aria-modal="true"[\s\S]*?aria-labelledby="settings-title"[\s\S]*?tabindex="-1"/,
  );
  assert.match(source, /let settingsModalInvoker = null/);
  assert.match(source, /function getSettingsFocusableControls\(modal\)/);
  assert.match(source, /function trapSettingsModalTab\(e, modal\)/);
  assert.match(source, /if \(!modal\.contains\(active\) \|\| active === modal\)/);
  assert.match(source, /focusElement\(e\.shiftKey \? last : first\)/);
  assert.match(source, /if \(e\.shiftKey && active === first\)/);
  assert.match(source, /else if \(!e\.shiftKey && active === last\)/);
  assert.match(source, /function restoreSettingsInvoker\(\)/);
  assert.match(source, /if \(invoker && document\.contains\(invoker\)\) focusElement\(invoker\)/);
  assert.match(source, /const settingsOpen = e\.target\.closest\(['"]#settings-open['"]\)/);
  assert.match(source, /if \(settingsOpen\) \{[\s\S]*?open\(settingsOpen\);[\s\S]*?return;/);
  assert.match(source, /e\.key === ['"]Tab['"]/);
  assert.match(source, /trapSettingsModalTab\(e, m\)/);
  assert.match(source, /close\(\{ restoreFocus: false \}\)/);
  assert.match(source, /focusConsentPrompt\(\)/);
});

test('Static icon-control accessible names follow smtSetLanguage without reload', () => {
  const context = createRenderContext({ hash: '#/', language: 'en' });
  loadScripts(context);

  assert.equal(context.element('settings-open').getAttribute('aria-label'), 'Settings');
  assert.equal(context.element('settings-modal-close').getAttribute('aria-label'), 'Close');
  assert.equal(context.element('ad-anchor-close').getAttribute('aria-label'), 'Close ad');
  assert.equal(context.element('dala-bubble-close').getAttribute('aria-label'), 'Close');
  assert.equal(context.element('dala-figure').getAttribute('aria-label'), 'Study buddy');

  context.clickSettingsLanguage('sv');

  assert.equal(context.element('settings-open').getAttribute('aria-label'), 'Inställningar');
  assert.equal(context.element('settings-modal-close').getAttribute('aria-label'), 'Stäng');
  assert.equal(context.element('ad-anchor-close').getAttribute('aria-label'), 'Stäng annons');
  assert.equal(context.element('dala-bubble-close').getAttribute('aria-label'), 'Stäng');
  assert.equal(context.element('dala-figure').getAttribute('aria-label'), 'Studiekompis');
  assert.equal(context.reloadCount, 0);

  vm.runInContext('smtSetLanguage("zh-Hans");', context.sandbox, { timeout: 3000 });

  assert.equal(context.element('settings-open').getAttribute('aria-label'), '设置');
  assert.equal(context.element('settings-modal-close').getAttribute('aria-label'), '关闭');
  assert.equal(context.element('ad-anchor-close').getAttribute('aria-label'), '关闭广告');
  assert.equal(context.element('dala-bubble-close').getAttribute('aria-label'), '关闭');
  assert.equal(context.element('dala-figure').getAttribute('aria-label'), '学习伙伴');
  assert.equal(context.reloadCount, 0);
});

test('Static Settings exposes the shipped extra language choices', () => {
  const html = read('site/index.html');

  for (const value of staticSiteLanguageValues) {
    assert.ok(html.includes(`data-val="${value}"`), `missing Settings language button ${value}`);
  }

  const context = createRenderContext({ hash: '#/', language: 'en' });
  loadScripts(context);

  assert.deepEqual(context.settingLanguageValues(), staticSiteLanguageValues);
});

test('static sign-in email field labels are localized for every static locale', () => {
  const index = read('site/index.html');
  const signin = read('site/signin.js');

  assert.match(index, /data-sk-placeholder="signin\.email\.placeholder"/);
  assert.match(index, /data-sk-aria-label="signin\.email\.label"/);
  assert.match(signin, /document\.querySelectorAll\('#signin-modal \[data-sk-placeholder\]'\)/);
  assert.match(signin, /document\.querySelectorAll\('#signin-modal \[data-sk-aria-label\]'\)/);
  assert.match(signin, /sv:\s*'E-postadress'/);
  assert.match(signin, /sv:\s*'namn@example\.com'/);
  assert.match(signin, /pl:\s*'Adres e-mail'/);
  assert.match(signin, /pl:\s*'imie@example\.com'/);

  for (const key of ['signin.email.label', 'signin.email.placeholder']) {
    const locales = extractSigninDictionaryLocales(signin, key);
    assert.deepEqual([...locales].sort(), [...staticSiteLanguageValues].sort());
  }
});

test('Settings language change persists extra locales and updates root direction', () => {
  const context = createRenderContext({ hash: '#/', language: 'en' });
  const languageChanges = [];
  loadScripts(context);
  context.sandbox.window.addEventListener('smt:languagechange', (event) => {
    languageChanges.push(event.detail.lang);
  });

  for (const language of ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk']) {
    const direction = language === 'ar' || language === 'ckb' || language === 'fa' ? 'rtl' : 'ltr';

    context.clickSettingsLanguage(language);

    assert.equal(context.storage.get('smt_lang'), language);
    assert.equal(context.sandbox.document.documentElement.lang, language);
    assert.equal(context.sandbox.document.documentElement.dir, direction);
    assert.equal(context.rootAttribute('dir'), direction);
    assert.equal(context.reloadCount, 0);
  }

  assert.deepEqual(languageChanges, [
    'zh-Hans',
    'zh-Hant',
    'ar',
    'ckb',
    'fa',
    'pl',
    'so',
    'ti',
    'tr',
    'uk',
  ]);
});

test('Settings Reduce motion toggle persists smt_motion and updates the static root flag', () => {
  const context = createRenderContext({ hash: '#/', language: 'en' });
  const motionEvents = [];
  loadScripts(context);
  context.sandbox.window.addEventListener('smt:motionchange', (event) => {
    motionEvents.push(event.detail.reduced);
  });

  context.changeSettingsMotion(true);

  assert.equal(context.storage.get('smt_motion'), 'reduce');
  assert.equal(context.rootAttribute('data-motion'), 'reduce');
  assert.deepEqual(motionEvents, [true]);
  assert.equal(context.reloadCount, 0);

  context.changeSettingsMotion(false);

  assert.equal(context.storage.get('smt_motion'), '');
  assert.equal(context.rootAttribute('data-motion'), '');
  assert.deepEqual(motionEvents, [true, false]);
  assert.equal(context.reloadCount, 0);
});

test('Settings applies prefers-reduced-motion on first load without claiming a user preference', () => {
  const context = createRenderContext({ hash: '#/', language: 'en', reducedMotion: true });
  loadScripts(context);

  context.fireWindowEvent('DOMContentLoaded');

  assert.equal(context.rootAttribute('data-motion'), 'reduce');
  assert.equal(context.storage.has('smt_motion'), false);

  const explicitOffContext = createRenderContext({
    hash: '#/',
    language: 'en',
    reducedMotion: true,
    storedMotion: '',
  });
  loadScripts(explicitOffContext);
  explicitOffContext.fireWindowEvent('DOMContentLoaded');

  assert.equal(explicitOffContext.rootAttribute('data-motion'), '');
  assert.equal(explicitOffContext.storage.get('smt_motion'), '');

  const explicitOnContext = createRenderContext({
    hash: '#/',
    language: 'en',
    reducedMotion: false,
    storedMotion: 'reduce',
  });
  loadScripts(explicitOnContext);
  explicitOnContext.fireWindowEvent('DOMContentLoaded');

  assert.equal(explicitOnContext.rootAttribute('data-motion'), 'reduce');
  assert.equal(explicitOnContext.storage.get('smt_motion'), 'reduce');
});

test('Settings normalizes unsupported theme and palette values before persisting them', () => {
  const context = createRenderContext({
    hash: '#/',
    language: 'en',
    storedPalette: 'unknown',
    storedTheme: 'sepia',
    systemDark: true,
  });
  loadScripts(context);

  context.fireWindowEvent('DOMContentLoaded');

  assert.equal(context.rootAttribute('data-theme'), 'dark');
  assert.equal(context.rootAttribute('data-theme-pref'), 'auto');
  assert.equal(context.storage.get('smt_theme'), 'auto');
  assert.equal(context.storage.get('smt_palette'), 'flag');
  assert.equal(context.rootStyleProperty('--blue'), '#006aa7');
  assert.equal(context.rootStyleProperty('--gold'), '#fecc00');

  vm.runInContext('smtApplyTheme("light"); smtApplyPalette("falu");', context.sandbox, {
    timeout: 3000,
  });
  assert.equal(context.rootAttribute('data-theme'), 'light');
  assert.equal(context.rootAttribute('data-theme-pref'), 'light');
  assert.equal(context.storage.get('smt_theme'), 'light');
  assert.equal(context.storage.get('smt_palette'), 'falu');
  assert.equal(context.rootStyleProperty('--blue'), '#8c1a2b');

  vm.runInContext('smtApplyTheme("sepia"); smtApplyPalette("unknown");', context.sandbox, {
    timeout: 3000,
  });
  assert.equal(context.rootAttribute('data-theme'), 'dark');
  assert.equal(context.rootAttribute('data-theme-pref'), 'auto');
  assert.equal(context.storage.get('smt_theme'), 'auto');
  assert.equal(context.storage.get('smt_palette'), 'flag');
  assert.equal(context.rootStyleProperty('--blue'), '#006aa7');
  assert.equal(context.rootStyleProperty('--gold'), '#fecc00');
});

const mockOfficialPassLineClaimPatterns = [
  new RegExp(['passing', 'line'].join('\\s+'), 'i'),
  new RegExp('godk' + '[aä]nt[-\\s]*gr[aä]ns', 'i'),
  new RegExp('75\\s*' + '%\\s*next\\s*time', 'i'),
  new RegExp(['you', 'passed'].join('\\s+'), 'i'),
  new RegExp('underk' + '[aä]nt', 'i'),
  new RegExp('godk' + '[aä]nt', 'i'),
];

function assertNoMockOfficialPassLineCopy(html) {
  for (const pattern of mockOfficialPassLineClaimPatterns) {
    assert.doesNotMatch(html, pattern);
  }
}

function settingButtonTags(html, dataSet) {
  const block = html.match(
    new RegExp(`<div class="set-(?:segment|palettes)" data-set="${dataSet}">([\\s\\S]*?)</div>`),
  );
  assert.ok(block, `settings ${dataSet} control should exist`);
  return Array.from(block[1].matchAll(/<button\b[^>]*>/g), (match) => match[0]);
}

test('Static Settings selected visuals mirror aria-pressed state', () => {
  const settingsSource = read('site/settings.js');
  const html = read('site/index.html');

  assert.match(
    settingsSource,
    /const SUPPORTED_TEXT_SIZES = new Set\(\[['"]90['"], ['"]100['"], ['"]115['"]\]\)/,
  );
  assert.match(settingsSource, /function normalizeTextSize\(s\)/);
  assert.match(settingsSource, /SUPPORTED_TEXT_SIZES\.has\(value\) \? value : ['"]100['"]/);
  assert.match(settingsSource, /function setPressedState\(el, on\) \{[\s\S]*?aria-pressed/);
  assert.equal(
    Array.from(settingsSource.matchAll(/\.classList\.toggle\(['"]is-on['"]/g)).length,
    1,
    'Settings should toggle .is-on only through setPressedState so aria-pressed stays in sync',
  );
  assert.match(
    settingsSource,
    /setAttribute\(['"]aria-pressed['"], on \? ['"]true['"] : ['"]false['"]\)/,
  );
  assert.match(settingsSource, /setPressedState\(b, b\.dataset\.val === String\(value\)\)/);
  assert.match(settingsSource, /setPressedState\(b, b\.dataset\.val === value\)/);
  assert.match(settingsSource, /setPressedState\(c, c\.dataset\.buddy === id\)/);
  assert.match(
    settingsSource,
    /aria-pressed="\$\{b\.id === cur \? ['"]true['"] : ['"]false['"]\}"/,
  );

  for (const dataSet of ['theme', 'palette', 'language', 'textsize']) {
    settingButtonTags(html, dataSet).forEach((tag) => {
      assert.match(tag, /aria-pressed="(?:true|false)"/, `${dataSet} button ${tag}`);
    });
  }
});

test('Static Settings text size falls back for corrupt stored and clicked values', () => {
  for (const storedTextSize of ['abc', '2500', '-50', '90.5', '', '115px']) {
    const context = createRenderContext({ hash: '#/', language: 'en', storedTextSize });
    loadScripts(context);
    context.fireWindowEvent('DOMContentLoaded');
    context.clickSettingsOpen();

    assert.equal(context.rootFontSize(), '16px', `root font size for ${storedTextSize}`);
    assert.equal(context.storage.get('smt_textsize'), '100', `stored value for ${storedTextSize}`);
    assert.deepEqual(
      context.textSizePressedValues(),
      ['100'],
      `pressed value for ${storedTextSize}`,
    );
  }

  const context = createRenderContext({ hash: '#/', language: 'en', storedTextSize: '90' });
  loadScripts(context);
  context.fireWindowEvent('DOMContentLoaded');
  context.clickSettingsOpen();

  assert.equal(context.rootFontSize(), '14.4px');
  assert.equal(context.storage.get('smt_textsize'), '90');
  assert.deepEqual(context.textSizePressedValues(), ['90']);

  context.clickSettingsTextSize('115');
  assert.equal(context.rootFontSize(), '18.4px');
  assert.equal(context.storage.get('smt_textsize'), '115');
  assert.deepEqual(context.textSizePressedValues(), ['115']);

  context.clickSettingsTextSize('100.5');
  assert.equal(context.rootFontSize(), '16px');
  assert.equal(context.storage.get('smt_textsize'), '100');
  assert.deepEqual(context.textSizePressedValues(), ['100']);
});

test('Static document table-of-contents hashes preserve legal routes and focus headings', () => {
  const html = read('site/index.html');
  assert.match(html, /href="#\/privacy#p3" data-i18n="privacy\.s3\.t"/);
  assert.match(html, /href="#\/terms#t3" data-i18n="terms\.s3\.t"/);
  assert.match(html, /href="#\/sources#src2" data-i18n="sources\.s2\.t"/);

  for (const [hash, headingId] of [
    ['#/privacy#p3', 'p3'],
    ['#/terms#t3', 't3'],
    ['#/sources#src2', 'src2'],
  ]) {
    const context = createRenderContext({ hash, language: 'en' });
    const heading = context.element(headingId);
    let scrollOptions = null;
    let focusOptions = null;
    heading.scrollIntoView = (options) => {
      scrollOptions = options;
    };
    heading.focus = (options) => {
      focusOptions = options;
    };

    loadScripts(context);
    vm.runInContext('route();', context.sandbox, { timeout: 3000 });

    assert.equal(heading.getAttribute('tabindex'), '-1', `${hash} heading focus target`);
    assert.equal(scrollOptions.block, 'start', `${hash} scroll block`);
    assert.equal(scrollOptions.behavior, 'auto', `${hash} scroll behavior`);
    assert.equal(focusOptions.preventScroll, true, `${hash} focus`);
  }
});

test('Static hash route allowlist covers every linked page route', () => {
  const appSource = read('site/app.js');
  const html = read('site/index.html');
  const knownRoutes = new Set(extractQuotedArray(appSource, 'known'));
  const pageRoutes = new Set(extractAttributeValues(html, 'data-page'));
  const linkedRoutes = extractAttributeValues(html, 'data-route');
  const missingPages = linkedRoutes.filter((route) => !pageRoutes.has(route));
  const missingAllowlistEntries = linkedRoutes.filter(
    (route) => pageRoutes.has(route) && !knownRoutes.has(route),
  );

  assert.equal(
    missingPages.length,
    0,
    `static nav links should target real data-page routes: ${missingPages.join(', ')}`,
  );
  assert.equal(
    missingAllowlistEntries.length,
    0,
    `linked static page routes should be in the hash-router allowlist: ${missingAllowlistEntries.join(
      ', ',
    )}`,
  );
  assert.ok(knownRoutes.has('/dashboard'), 'dashboard hash route should not fall back to Home');
});

test('Settings language change rerenders an active Practice question without reload', () => {
  const context = createRenderContext({ hash: '#/practice?c=1', language: 'en' });
  loadScripts(context);
  vm.runInContext('smtQuizRender();', context.sandbox, { timeout: 3000 });

  assert.match(context.element('quiz-stage').innerHTML, /Where is Sweden located\?/);
  context.clickSettingsLanguage('sv');

  const html = context.element('quiz-stage').innerHTML;
  assert.match(html, /Var ligger Sverige\?/);
  assert.match(html, /I Norden i norra Europa/);
  assert.match(html, /Fråga 1 \/ 1/);
  assert.equal(context.storage.get('smt_lang'), 'sv');
  assert.equal(context.reloadCount, 0);
});

test('Settings language change rerenders the Mock landing without reload', () => {
  const context = createRenderContext({ hash: '#/mock', language: 'en' });
  loadScripts(context, 'renderMockLanding();');

  assert.match(context.element('mock-stage').innerHTML, /Build your practice round\./);
  assert.match(context.element('mock-stage').innerHTML, /Practice timer only/);
  assertNoMockOfficialPassLineCopy(context.element('mock-stage').innerHTML);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Bygg ditt övningsprov\./);
  assert.match(html, /Starta övningsprov/);
  assert.match(html, /Övningspoäng/);
  assertNoMockOfficialPassLineCopy(html);
  assert.doesNotMatch(html, /Skarp tentamen|Bygg din tentamen|Starta tentamen/);
  assert.equal(context.reloadCount, 0);
});

test('Settings language change rerenders an active Mock exam without reload', () => {
  const context = createRenderContext({ hash: '#/mock?run=1', language: 'en' });
  loadScripts(
    context,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [null];',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = false;',
      'renderMockExam();',
    ].join('\n'),
  );

  assert.match(context.element('mock-stage').innerHTML, /Timed practice/);
  assert.match(context.element('mock-stage').innerHTML, /Time left/);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Tidsatt övning/);
  assert.match(html, /Återstår/);
  assert.match(html, /Lämna in/);
  assert.match(html, /Var ligger Sverige\?/);
  assert.doesNotMatch(html, /Skarp tentamen|tentamen/);
  assert.equal(context.reloadCount, 0);
});

test('Settings language change rerenders submitted Mock results without restarting', () => {
  const context = createRenderContext({ hash: '#/mock?run=1', language: 'en' });
  loadScripts(
    context,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [1];',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = true;',
      'renderMockResult();',
    ].join('\n'),
  );

  assert.match(context.element('mock-stage').innerHTML, /Question review/);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Frågegenomgång/);
  assert.match(html, /Rätt svar/);
  assert.match(html, /Övningspass klart/);
  assertNoMockOfficialPassLineCopy(html);
  assert.doesNotMatch(
    html,
    /Build your exam|Start exam|Bygg din tentamen|Starta tentamen|Skarp tentamen/,
  );
  assert.equal(context.reloadCount, 0);
});
