const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

const reviewedSomaliSignedInCopy =
  'Waad gashay. Calaamadahaaga, qoraalladaada iyo dashboard-kaaga ayaa la isku waafajinayaa dhammaan qalabkaaga.';

const signInLocales = [
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

const signedInMeaningPatterns = {
  en: [/signed in/i, /highlights/i, /notes/i, /dashboard/i, /sync/i, /devices/i],
  sv: [/inloggad/i, /markeringar/i, /anteckningar/i, /panel/i, /synkas/i, /enheter/i],
  'zh-Hans': [/已登录/, /标注/, /笔记/, /学习面板/, /同步/, /设备/],
  'zh-Hant': [/已登入/, /標註/, /筆記/, /學習面板/, /同步/, /裝置/],
  ar: [/سجّلت الدخول/, /تظليلاتك/, /ملاحظاتك/, /لوحتك/, /تتزامن/, /أجهزتك/],
  ckb: [/چوویتە ژوورەوە/, /هایلایت/, /تێبینی/, /داشبۆرد/, /هاوکات/, /ئامێرەکانت/],
  fa: [/وارد شده‌ای/, /هایلایت/, /یادداشت/, /داشبورد/, /همگام/, /دستگاه/],
  pl: [/zalogowan/i, /zaznaczenia/i, /notatki/i, /panel/i, /synchronizują/i, /urządzeniami/i],
  so: [
    /Waad gashay/i,
    /Calaamadahaaga/i,
    /qoraalladaada/i,
    /dashboard-kaaga/i,
    /isku waafajinayaa/i,
    /qalabkaaga/i,
  ],
  ti: [/ኣቲኻ/, /ምልክታትካ/, /መዘኻኸር/, /ዳሽቦርድካ/, /ይሳነዩ/, /መሳርሕታትካ/],
  tr: [/Giriş yaptın/i, /Vurguların/i, /notların/i, /panon/i, /senkronize/i, /cihazlarında/i],
  uk: [/увійшли/i, /Виділення/i, /нотатки/i, /панель/i, /синхронізуються/i, /пристроями/i],
};

const ledeCoreStudyPatterns = {
  en: [/highlights/i, /notes/i, /progress/i, /core study flow/i, /without sign-in/i],
  sv: [/markeringar/i, /anteckningar/i, /framsteg/i, /studieflödet/i, /utan inloggning/i],
  'zh-Hans': [/标注/, /笔记/, /学习进度/, /核心学习流程/, /无需登录/],
  'zh-Hant': [/標註/, /筆記/, /學習進度/, /核心學習流程/, /無需登入/],
  ar: [/تظليلاتك/, /ملاحظاتك/, /تقدّمك/, /مسار الدراسة الأساسي/, /بدون تسجيل الدخول/],
  ckb: [/هایلایت/, /تێبینی/, /پێشکەوتن/, /ڕەوتی سەرەکی خوێندن/, /بێ چوونەژوورەوە/],
  fa: [/هایلایت/, /یادداشت/, /پیشرفت/, /مسیر اصلی مطالعه/, /بدون ورود/],
  pl: [/zaznaczenia/i, /notatki/i, /postępy/i, /podstawowa nauka/i, /bez logowania/i],
  so: [
    /calaamadahaaga/i,
    /qoraalladaada/i,
    /horumarkaaga/i,
    /waxbarashada aasaasiga ah/i,
    /adigoon soo gelin/i,
  ],
  ti: [/ምልክታትካ/, /መዘኻኸር/, /ምዕባለኻ/, /መሰረታዊ መጽናዕቲ/, /ብዘይ ምእታው/],
  tr: [/Vurgularını/i, /notlarını/i, /ilerlemeni/i, /temel çalışma akışı/i, /giriş yapmadan/i],
  uk: [/виділення/i, /нотатки/i, /прогрес/i, /основний навчальний сценарій/i, /без входу/i],
};

const oldLedeAbsoluteAccountPatterns = [
  /everything works without an account/i,
  /all features work without/i,
  /allt fungerar utan konto/i,
  /全部功能/,
  /كل شيء يعمل بدون حساب/,
  /هەموو شتێک بێ هەژمار کار دەکات/,
  /همه‌چیز بدون حساب کار می‌کند/,
  /wszystko działa bez konta/i,
  /wax walba way shaqeeyaan/i,
  /ኩሉ ነገር ብዘይ ሕሳብ ይሰርሕ/,
  /her şey hesapsız çalışır/i,
  /усе працює без облікового запису/i,
];

function injectCopyExport(source) {
  return source.replace(
    '\n\n  // ----------------------------------------------------------------',
    '\n\n  window.__smtSigninCopy = T;\n\n  // ----------------------------------------------------------------',
  );
}

function createStaticScriptContext({ lang = 'en', signedIn = false } = {}) {
  const storage = new Map();
  storage.set('smt_lang', lang);
  if (signedIn) {
    storage.set('smt_signed_in', '1');
    storage.set('smt_account_id', 'acct-static-signin-test');
    storage.set('smt_account_email', 'learner@example.test');
  }

  const listeners = new Map();
  const signedInMessage = {
    dataset: { sk: 'signin.signedin' },
    textContent: '',
  };
  const loginSection = { hidden: false };
  const accountSection = { hidden: true };
  const triggerLabel = { textContent: '' };
  const trigger = {
    classList: { toggle() {} },
    setAttribute(name, value) {
      this[name] = value;
    },
    querySelector() {
      return triggerLabel;
    },
    title: '',
  };
  const modal = {
    hidden: true,
    querySelector(selector) {
      if (selector === '.signin__login') return loginSection;
      if (selector === '.signin__account') return accountSection;
      return null;
    },
  };
  const context = {
    console,
    document: {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      body: { style: {} },
      getElementById(id) {
        if (id === 'signin-modal') return modal;
        if (id === 'signin-open') return trigger;
        return null;
      },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '#signin-modal [data-sk]') return [signedInMessage];
        return [];
      },
    },
    Event,
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
    location: { hash: '#/' },
    sessionStorage: {
      getItem() {
        return null;
      },
      removeItem() {},
      setItem() {},
    },
    window: {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      dispatchEvent(event) {
        const listener = listeners.get(event.type);
        if (listener) listener(event);
      },
      location: { hash: '#/' },
    },
  };
  context.window.localStorage = context.localStorage;
  context.window.sessionStorage = context.sessionStorage;
  context.globalThis = context;
  context.window.window = context.window;

  vm.runInNewContext(injectCopyExport(read('site/signin.js')), context, {
    filename: 'site/signin.js',
  });

  return { accountSection, context, loginSection, signedInMessage, storage, trigger, triggerLabel };
}

function loadSigninCopy() {
  const { context } = createStaticScriptContext();
  return context.window.__smtSigninCopy;
}

test('static sign-in trigger and modal copy are localized display text', () => {
  const index = read('site/index.html');
  const signin = read('site/signin.js');
  const requiredKeys = [
    'signin.cta',
    'signin.account',
    'signin.signout',
    'signin.signedin',
    'signin.lede',
    'signin.google',
    'signin.apple',
    'signin.or',
    'signin.magic',
    'signin.fineprint',
    'signin.unavailable',
  ];

  for (const key of requiredKeys) {
    assert.match(index + signin, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(signin, new RegExp(`['"]${key}['"]`));
  }

  assert.match(signin, /window\.addEventListener\('smt:languagechange', localize\)/);
  assert.match(signin, /btn\.title = triggerText/);
  assert.match(signin, /btn\.setAttribute\('aria-label', triggerText\)/);
});

test('Somali sign-in signed-in copy uses reviewed dashboard sync wording', () => {
  const signin = read('site/signin.js');

  assert.match(signin, /['"]signin\.signedin['"]/);
  assert.match(
    signin,
    new RegExp(reviewedSomaliSignedInCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  assert.doesNotMatch(signin, /\bdhban\b/i);
  assert.doesNotMatch(signin, /isugu\s+dhban/i);
});

test('signin.signedin has reviewed account-sync copy for every locale', () => {
  const copy = loadSigninCopy();
  const signedInCopy = copy['signin.signedin'];
  const seenValues = new Map();

  assert.deepEqual(Object.keys(signedInCopy).sort(), [...signInLocales].sort());

  for (const locale of signInLocales) {
    const value = signedInCopy[locale];
    assert.equal(typeof value, 'string', `${locale} signed-in copy should be a string`);
    assert.ok(value.trim().length > 0, `${locale} signed-in copy should not be empty`);

    if (locale !== 'en') {
      assert.notEqual(
        value,
        signedInCopy.en,
        `${locale} signed-in copy should not fall back to English`,
      );
    }

    const duplicateLocale = seenValues.get(value);
    assert.equal(
      duplicateLocale,
      undefined,
      `${locale} signed-in copy duplicates ${duplicateLocale} instead of localizing account state`,
    );
    seenValues.set(value, locale);

    for (const pattern of signedInMeaningPatterns[locale]) {
      assert.match(value, pattern, `${locale} signed-in copy should preserve account-sync meaning`);
    }
  }
});

test('signin.signedin renders from the active locale for signed-in accounts', () => {
  const copy = loadSigninCopy();

  for (const locale of signInLocales) {
    const harness = createStaticScriptContext({ lang: locale, signedIn: true });
    harness.context.window.smtOpenSignin();

    assert.equal(harness.loginSection.hidden, true, `${locale} login view should hide`);
    assert.equal(harness.accountSection.hidden, false, `${locale} account view should show`);
    assert.equal(harness.signedInMessage.textContent, copy['signin.signedin'][locale]);
    assert.equal(harness.triggerLabel.textContent, copy['signin.account'][locale]);
    assert.equal(harness.trigger.title, copy['signin.account'][locale]);

    if (locale !== 'en') {
      assert.notEqual(
        harness.signedInMessage.textContent,
        copy['signin.signedin'].en,
        `${locale} rendered signed-in copy should not fall back to English`,
      );
    }
  }
});

test('signin.lede limits anonymous promises to the core study flow', () => {
  const copy = loadSigninCopy();
  const ledeCopy = copy['signin.lede'];
  const index = read('site/index.html');
  const signin = read('site/signin.js');
  const surface = `${index}\n${signin}`;

  assert.deepEqual(Object.keys(ledeCopy).sort(), [...signInLocales].sort());
  assert.match(
    index,
    /Save your highlights, notes, and progress across devices\. Totally optional — the core\s+study flow works without sign-in\./,
  );
  oldLedeAbsoluteAccountPatterns.forEach((pattern) => assert.doesNotMatch(surface, pattern));

  for (const locale of signInLocales) {
    const value = ledeCopy[locale];

    assert.equal(typeof value, 'string', `${locale} lede copy should be a string`);
    assert.ok(value.trim().length > 0, `${locale} lede copy should not be empty`);
    assert.doesNotMatch(value, /everything works without an account/i);
    assert.doesNotMatch(value, /all features work without/i);

    if (locale !== 'en') {
      assert.notEqual(value, ledeCopy.en, `${locale} lede should not fall back to English`);
    }

    for (const pattern of ledeCoreStudyPatterns[locale]) {
      assert.match(value, pattern, `${locale} lede should preserve optional core-study meaning`);
    }
  }
});
