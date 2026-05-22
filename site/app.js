/* ------------------------------------------------------------------
   Almost Swedish — site behaviour
   - hash routing (/, /practice, /dashboard, /mock, /ebook, legal/source pages)
   - language toggle (EN/SV) with localStorage persistence
   - try-a-question demo card
------------------------------------------------------------------ */

/* ============================ ROUTING */

const SMT_EBOOK_SCRIPT_SOURCES = Object.freeze(['ebook-tools.js', 'ebook.js']);
const SMT_EBOOK_LOAD_STATE = {
  loaded: false,
  promise: null,
};

function smtRoutePathFromHash() {
  const hash = (location.hash || '#/').replace(/^#/, '');
  const routeEndIndexes = [hash.indexOf('?'), hash.indexOf('#')].filter((index) => index >= 0);
  const routeEnd = routeEndIndexes.length ? Math.min(...routeEndIndexes) : hash.length;
  const pathRaw = hash.slice(0, routeEnd) || '/';
  return pathRaw.startsWith('/') ? pathRaw : '/';
}

function smtIsEbookRoute() {
  return smtRoutePathFromHash() === '/ebook';
}

function smtRenderEbookRouteStatus(kind) {
  const reader = document.getElementById('ebook-reader');
  if (!reader || !smtIsEbookRoute()) return;
  if (kind === 'loading' && reader.children.length > 0) return;

  const copy =
    kind === 'error'
      ? {
          title: smtTr({
            sv: 'E-boken kunde inte laddas',
            en: 'Ebook could not load',
            'zh-Hans': '电子书无法加载',
            'zh-Hant': '電子書無法載入',
            ar: 'تعذّر تحميل الكتاب الإلكتروني',
            ckb: 'ئیبووکەکە بار نەکرا',
            fa: 'کتاب الکترونیکی بار نشد',
            pl: 'Nie udało się wczytać e-booka',
            so: 'Ebook-ka lama soo dejin karin',
            ti: 'እቲ ኢ-መጽሓፍ ክጽዓን ኣይከኣለን',
            tr: 'E-kitap yüklenemedi',
            uk: 'Не вдалося завантажити е-книгу',
          }),
          body: smtTr({
            sv: 'Kontrollera anslutningen och öppna e-boken igen.',
            en: 'Check your connection and open the ebook again.',
            'zh-Hans': '请检查连接后重新打开电子书。',
            'zh-Hant': '請檢查連線後重新開啟電子書。',
            ar: 'تحقّق من الاتصال وافتح الكتاب الإلكتروني مرة أخرى.',
            ckb: 'پەیوەندییەکەت بپشکنە و ئیبووکەکە دووبارە بکەرەوە.',
            fa: 'اتصال را بررسی کنید و کتاب الکترونیکی را دوباره باز کنید.',
            pl: 'Sprawdź połączenie i otwórz e-book ponownie.',
            so: 'Hubi xiriirkaaga oo mar kale fur ebook-ka.',
            ti: 'ርክብካ ኣረጋግጽ እሞ ነቲ ኢ-መጽሓፍ ደጊምካ ክፈቶ።',
            tr: 'Bağlantınızı kontrol edip e-kitabı yeniden açın.',
            uk: 'Перевірте з’єднання і відкрийте е-книгу ще раз.',
          }),
        }
      : {
          title: smtTr({
            sv: 'E-boken laddas',
            en: 'Ebook loading',
            'zh-Hans': '电子书正在加载',
            'zh-Hant': '電子書正在載入',
            ar: 'جارٍ تحميل الكتاب الإلكتروني',
            ckb: 'ئیبووکەکە بار دەکرێت',
            fa: 'کتاب الکترونیکی در حال بارگیری است',
            pl: 'E-book się wczytuje',
            so: 'Ebook-ka waa la soo dejinayaa',
            ti: 'እቲ ኢ-መጽሓፍ ይጽዓን ኣሎ',
            tr: 'E-kitap yükleniyor',
            uk: 'Е-книга завантажується',
          }),
          body: smtTr({
            sv: 'Läsaren öppnas strax.',
            en: 'The reader will open shortly.',
            'zh-Hans': '阅读器即将打开。',
            'zh-Hant': '閱讀器即將開啟。',
            ar: 'سيفتح القارئ بعد لحظات.',
            ckb: 'خوێنەرەکە بەم زووانە دەکرێتەوە.',
            fa: 'خواننده تا لحظاتی دیگر باز می‌شود.',
            pl: 'Czytnik zaraz się otworzy.',
            so: 'Akhristaha dhawaan ayuu furmi doonaa.',
            ti: 'እቲ ኣንባቢ ብቐረባ ክኽፈት እዩ።',
            tr: 'Okuyucu birazdan açılacak.',
            uk: 'Читалка скоро відкриється.',
          }),
        };

  reader.innerHTML = `
    <div class="ebook__stub ebook__route-status" role="status" aria-live="polite">
      <h3>${copy.title}</h3>
      <p>${copy.body}</p>
    </div>
  `;
}

function smtLoadStaticScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-smt-lazy-script="${src}"]`);
    if (existing?.dataset.smtLoaded === 'true') {
      resolve();
      return;
    }
    if (existing?.dataset.smtFailed === 'true') existing.remove();

    const script =
      existing?.dataset.smtFailed === 'true' || !existing
        ? document.createElement('script')
        : existing;
    script.async = false;
    script.src = src;
    script.dataset.smtLazyScript = src;
    script.addEventListener('load', () => {
      script.dataset.smtLoaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => {
      script.dataset.smtFailed = 'true';
      reject(new Error(`Could not load ${src}`));
    });
    if (!existing || existing.dataset.smtFailed === 'true') document.body.appendChild(script);
  });
}

function smtEnsureEbookScripts() {
  if (!smtIsEbookRoute()) return Promise.resolve(false);
  if (window.smtEbookRender) {
    window.smtEbookRender();
    return Promise.resolve(true);
  }
  if (SMT_EBOOK_LOAD_STATE.loaded) return Promise.resolve(true);

  smtRenderEbookRouteStatus('loading');

  if (!SMT_EBOOK_LOAD_STATE.promise) {
    SMT_EBOOK_LOAD_STATE.promise = SMT_EBOOK_SCRIPT_SOURCES.reduce(
      (chain, src) => chain.then(() => smtLoadStaticScript(src)),
      Promise.resolve(),
    )
      .then(() => {
        SMT_EBOOK_LOAD_STATE.loaded = true;
        if (smtIsEbookRoute() && window.smtEbookRender) window.smtEbookRender();
        return true;
      })
      .catch(() => {
        SMT_EBOOK_LOAD_STATE.promise = null;
        smtRenderEbookRouteStatus('error');
        return false;
      });
  }

  return SMT_EBOOK_LOAD_STATE.promise;
}

window.smtEnsureEbookScripts = smtEnsureEbookScripts;

function route() {
  const hash = (location.hash || '#/').replace(/^#/, '');
  const routeEndIndexes = [hash.indexOf('?'), hash.indexOf('#')].filter((index) => index >= 0);
  const routeEnd = routeEndIndexes.length ? Math.min(...routeEndIndexes) : hash.length;
  const pathRaw = hash.slice(0, routeEnd) || '/';
  const innerAnchorMatch = hash.slice(routeEnd).match(/^#([^?]+)/);
  const innerAnchor = innerAnchorMatch ? decodeURIComponent(innerAnchorMatch[1]) : '';
  let path = pathRaw.startsWith('/') ? pathRaw : '/';
  // map unknown paths to /
  const known = [
    '/',
    '/practice',
    '/dashboard',
    '/mock',
    '/ebook',
    '/privacy',
    '/support',
    '/terms',
    '/sources',
  ];
  if (!known.includes(path)) path = '/';

  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.page === path);
  });
  document.querySelectorAll('.nav a[data-route]').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.route === path && path !== '/');
  });

  // scroll to top on page change, or focus an in-page document section.
  if (innerAnchor) {
    smtFocusInnerAnchor(innerAnchor);
  } else if (!hash.includes('#') || hash === '#/') {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  smtSetMobileNav(false);
  if (path === '/ebook') smtEnsureEbookScripts();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);

function smtFocusInnerAnchor(anchor) {
  const target = document.getElementById(anchor);
  if (!target) return;
  if (typeof target.getAttribute === 'function' && target.getAttribute('tabindex') === null) {
    target.setAttribute('tabindex', '-1');
  }
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ block: 'start', behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  if (typeof target.focus === 'function') {
    target.focus({ preventScroll: true });
  }
}

function smtTr(map) {
  let l = 'en';
  try {
    l = localStorage.getItem('smt_lang') || 'en';
  } catch {
    /* keep default */
  }
  return (map && (map[l] || map.en)) || '';
}
function smtMobileNavLabel(open) {
  if (open)
    return smtTr({
      sv: 'Stäng navigering',
      en: 'Close navigation',
      'zh-Hans': '关闭导航',
      'zh-Hant': '關閉導覽',
      ar: 'إغلاق التنقّل',
      ckb: 'داخستنی گەشتکردن',
      fa: 'بستن پیمایش',
      pl: 'Zamknij nawigację',
      so: 'Xir hagista',
      ti: 'ምልጋብ ዕጸው',
      tr: 'Gezinmeyi kapat',
      uk: 'Закрити навігацію',
    });
  return smtTr({
    sv: 'Öppna navigering',
    en: 'Open navigation',
    'zh-Hans': '打开导航',
    'zh-Hant': '開啟導覽',
    ar: 'فتح التنقّل',
    ckb: 'کردنەوەی گەشتکردن',
    fa: 'باز کردن پیمایش',
    pl: 'Otwórz nawigację',
    so: 'Fur hagista',
    ti: 'ምልጋብ ክፈት',
    tr: 'Gezinmeyi aç',
    uk: 'Відкрити навігацію',
  });
}

function smtSetMobileNav(open) {
  const topbar = document.querySelector('.topbar');
  const toggle = document.getElementById('nav-toggle');
  if (!topbar || !toggle) return;
  topbar.classList.toggle('is-nav-open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-label', smtMobileNavLabel(open));
}

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('#nav-toggle');
  if (toggle) {
    smtSetMobileNav(toggle.getAttribute('aria-expanded') !== 'true');
    return;
  }
  if (e.target.closest('.nav a')) {
    smtSetMobileNav(false);
    return;
  }
  if (!e.target.closest('.topbar')) {
    smtSetMobileNav(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') smtSetMobileNav(false);
});

window.addEventListener('resize', () => {
  if (window.matchMedia('(min-width: 721px)').matches) smtSetMobileNav(false);
});
window.addEventListener('smt:languagechange', () => {
  const toggle = document.querySelector('#nav-toggle');
  const isOpen =
    toggle && typeof toggle.getAttribute === 'function'
      ? toggle.getAttribute('aria-expanded') === 'true'
      : false;
  smtSetMobileNav(isOpen);
});

/* ============================ LANGUAGE TOGGLE + DICT */

const i18n = (window.i18n = {
  en: {
    brand: 'Almost Swedish',
    'meta.title': 'Almost Swedish — Study and practice.',
    'meta.description':
      'Unofficial Swedish civic knowledge practice with source-backed questions, short chapters, and calm revision tools.',
    'nav.home': 'Home',
    'nav.practice': 'Practice',
    'nav.mock': 'Mock exam',
    'nav.dashboard': 'Dashboard',
    'nav.ebook': 'Ebook',
    'nav.support': 'Support',
    'nav.privacy': 'Privacy',
    'nav.terms': 'Terms',
    'nav.sources': 'Sources',
    'nav.cta': 'Get the app ↗',
    'hero.eyebrow': 'Unofficial study tool · source-backed · no account',
    'hero.h1a': 'Learn Sweden.',
    'hero.h1b': 'Practise with sources.',
    'hero.h1c': 'Go in prepared.',
    'hero.lede':
      'A calm, unofficial study tool for Swedish civic knowledge. Short chapters, focused practice, and mock exams help you understand the material without turning it into a full-time job.',
    'hero.cta1': 'Start practising',
    'hero.cta2': 'Try one question',
    'hero.stat1': 'civic questions',
    'hero.stat2': 'chapters, lagom-sized',
    'hero.stat3': 'to start, no account',
    'phone.crumb': 'Chapter 3 · Society & Rights',
    'phone.q': 'Which Swedish principle gives everyone the right to roam in nature?',
    'phone.hint': 'Nice. 18 streak days. Keep going.',
    'marquee.1': 'Allemansrätten',
    'marquee.2': 'Riksdagen',
    'marquee.3': 'Grundlagar',
    'marquee.4': 'Skatteverket',
    'marquee.5': 'Folkhemmet',
    'marquee.6': 'Jämställdhet',
    'marquee.7': 'Vasaloppet',
    'marquee.8': 'Midsommar',
    'demo.eyebrow': 'Try a question',
    'demo.h1': 'No cramming.',
    'demo.h2': 'Just steady practice.',
    'demo.deck':
      'Answer one question, read the explanation, and keep going. Hard questions come back later, so review feels manageable.',
    'demo.li1': '<b>Spaced repetition</b> resurfaces tricky questions on the right day.',
    'demo.li2': '<b>Plain-language explanations</b> — no legalese, no jargon-jungle.',
    'demo.li3':
      '<b>Mock exam mode</b> with a timed practice flow, so longer sessions feel less stressful.',
    'qcard.chip': 'Chapter 5 · q039',
    'qcard.q':
      'Which Swedish principle gives everyone the right to walk, swim, and pick berries on most land in nature?',
    'qcard.a': 'Jantelagen — the law of staying humble',
    'qcard.b': 'Allemansrätten — the right of public access',
    'qcard.c': 'Lagom — the doctrine of just-enough',
    'qcard.d': 'Fika — the constitutional coffee break',
    'qcard.ex.b': 'Allemansrätten',
    'qcard.ex.p':
      " — \"everyone's right\" — lets you walk, swim, ski, camp, and forage on most land in Sweden. The catch: be careful, considerate, and don't pitch a tent in someone's flowerbed.",
    'qcard.prov': 'UHR',
    'qcard.src': 'Source: Sverige i fokus · Lag och rätt · Allemansrätten · p. 17',
    'qcard.again': 'Try again →',
    'numbers.1': 'questions sourced from public records',
    'numbers.2': 'chapters covering history, society & rights',
    'numbers.3': 'daily — a fika-sized study habit',
    'numbers.4': 'to start. No login. Study progress stays local.',
    'chap.eyebrow': "What's inside",
    'chap.h1': 'Short chapters.',
    'chap.h2': 'Clear Swedish context.',
    'chap.deck':
      'Each chapter keeps the official material close, while explaining Swedish words and ideas in everyday language.',
    'chap.1.t': 'A very short history of Sweden',
    'chap.1.d':
      'Vikings → kings → 1809 → folkhemmet → EU. The whole rollercoaster, minus the dynastic family tree memorisation.',
    'chap.1.m2': '~9 min',
    'chap.2.t': 'How Sweden is governed',
    'chap.2.d':
      'Riksdag, regering, kommun, region. Who decides what, who you vote for, and why nobody fears the king.',
    'chap.2.m2': '~12 min',
    'chap.3.t': 'Rights, freedoms & the four basic laws',
    'chap.3.d':
      "Grundlagarna in plain English. Press freedom, free speech, and why your boss can't ask about your religion.",
    'chap.3.m2': '~11 min',
    'chap.4.t': 'Work, taxes & the welfare state',
    'chap.4.d':
      'Skatteverket, kollektivavtal, föräldraledighet, sjukpenning. The deal you signed up for.',
    'chap.4.m2': '~10 min',
    'chap.5.t': 'Equality & the modern household',
    'chap.5.d':
      'Jämställdhet, LGBTQ+ rights, parental leave splits. The reason Sweden keeps showing up in those ranking lists.',
    'chap.5.m2': '~9 min',
    'chap.6.t': 'Society, school & healthcare',
    'chap.6.d': 'Förskola to universitet, BVC to 1177. How daily life is plumbed.',
    'chap.6.m2': '~10 min',
    'chap.7.t': 'Nature, climate & allemansrätten',
    'chap.7.d':
      "The right to roam, environmental rules, why you can't actually pick someone's apples (sorry).",
    'chap.7.m2': '~8 min',
    'chap.8.t': 'Culture, traditions & the calendar',
    'chap.8.d':
      'Midsommar, lucia, kräftskiva, semla day. Useful for the test. Essential for the small talk.',
    'chap.8.m2': '~9 min',
    'chap.9.t': 'Money, banks & BankID',
    'chap.9.d':
      'Personnummer, BankID, Swish, kronor. Sweden runs on plastic and identifiers — meet them.',
    'chap.9.m2': '~7 min',
    'chap.10.t': 'Sweden, the EU & the world',
    'chap.10.d':
      'Member of EU since 1995, neutral-ish for centuries, now NATO. The international story.',
    'chap.10.m2': '~8 min',
    'chap.11.t': 'Migration, residence & citizenship',
    'chap.11.d':
      'The actual path to a passport. Routes, requirements, the difference between PUT, medborgarskap, and "just visiting".',
    'chap.11.m2': '~9 min',
    'chap.12.t': 'Mock exam & survival guide',
    'chap.12.d':
      'Timed full-length practice exams that help you rehearse pacing without claiming to mirror the official test. Plus a what-to-bring note.',
    'chap.12.m2': '60 min each',
    'chap.13.t': 'Traditions, holidays & everyday culture',
    'how.eyebrow': 'How it works',
    'how.h1': 'Study lagom.',
    'how.h2': 'Practise smart.',
    'how.deck':
      'Three modes, one app. Use them in any order — most people end up cycling through all three the week before the exam.',
    'how.s1.t': 'Learn — short chapters',
    'how.s1.p':
      'Read a 5-minute explainer, then a tiny quiz. Like having a patient Swedish friend who actually finishes their sentences.',
    'how.s2.t': 'Practice — smart drills',
    'how.s2.p':
      "Mistakes resurface on the right day. You'll be surprised how quickly Riksdagen stops sounding like furniture.",
    'how.s3.t': 'Mock exam — practice pacing',
    'how.s3.p':
      'Run a longer timed practice set and review it like a study session. The official format can still change.',
    'faq.eyebrow': 'Frequently, honestly asked',
    'faq.h1': "Questions you'd ask",
    'faq.h2': 'over coffee.',
    'faq.1.q': 'Is this the official Swedish citizenship test?',
    'faq.1.a':
      "No, and we say so on every page. We're independent — not affiliated with UHR, Skolverket, Migrationsverket, or anyone who actually decides who becomes a citizen. We make a study tool. They run the exam.",
    'faq.2.q': 'Will it really help me pass?',
    'faq.2.a':
      "It'll help you <em>study</em>. The rest depends on you, the official source material, and how much fika you take. We pull questions from the public bank and explain each one in plain language.",
    'faq.3.q': 'Do I need an account?',
    'faq.3.a':
      'No — you can do everything without registering, and your progress lives on your device. Signing in is optional, but it unlocks more: your highlights, notes, and dashboard sync across all your devices.',
    'faq.4.q': 'Is it free?',
    'faq.4.a':
      'Free to start, free to study, and free to take mock exams. Ads help keep the core app available; Remove Ads is an optional one-time 29 SEK purchase that removes ads.',
    'faq.5.q': 'Does it work in Swedish too?',
    'faq.5.a':
      "Yes. Tap the language button in the top bar to switch — Swedish, English, and ten more. Many learners use two at once: read in Swedish, then peek at another when you're stuck.",
    'faq.6.q': 'Is my data shared with anyone?',
    'faq.6.a':
      'Your study progress, answers, mistakes, and settings stay local. The website uses Google AdSense auto ads after your cookie choice; Google Mobile Ads (AdMob) in the app can process ad and consent signals. Ads never receive your study answers or progress.',
    'doc.back': '← Back to home',
    'privacy.kicker': 'Privacy policy',
    'privacy.h1a': 'Your data',
    'privacy.h1b': 'stays on your phone.',
    'privacy.lede':
      "Almost Swedish is an independent study app. We don't ask for an account, and study progress stays local. This page explains Google AdSense web ads, Google Mobile Ads app ads, and optional one-time Remove Ads purchase.",
    'privacy.meta1.b': 'Effective',
    'privacy.meta1.v': '2026-05-15',
    'privacy.meta2.b': 'Version',
    'privacy.meta2.v': '1.0',
    'privacy.meta3.b': 'Reading time',
    'privacy.meta3.v': '~3 min',
    'privacy.toc': 'In this policy',
    'privacy.s1.t': 'Independence',
    'privacy.s1.p':
      'Almost Swedish is an independent study app for Swedish civic knowledge practice. It is not official and is not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Anything you read here represents what <em>this app</em> does — nothing more.',
    'privacy.s2.t': 'No account required',
    'privacy.s2.p':
      "The app requires no account, email address, phone number, or profile registration. You open the app, you study, you close the app. That's the deal.",
    'privacy.s3.t': 'Local study progress',
    'privacy.s3.p':
      'Study progress, settings, mistakes, XP, streaks, badges, bookmarks, and audio preferences are stored locally on your device. They never leave it. If you uninstall the app, that data is gone — fair warning.',
    'privacy.s4.t': 'Current data-collection posture',
    'privacy.s4.callout.b': 'In plain English:',
    'privacy.s4.callout.p':
      'study progress and answers stay local; ad systems do not receive them.',
    'privacy.s4.p':
      'We do not run account profiles or send study answers, mistakes, progress, settings, XP, streaks, badges, bookmarks, or audio preferences to ad providers. Google ad systems may process ad and consent signals as described below.',
    'privacy.s5.t': 'Ads and purchases',
    'privacy.s5.p':
      "This website uses Google AdSense auto ads after your cookie choice. Manual in-content panels in Practice and Ebook stay as reserved spaces until reviewed slot IDs are configured. The mobile app uses Google Mobile Ads (AdMob) behind Google's consent flow. Remove Ads is an optional one-time 29 SEK purchase that removes ads. Ads help fund the free study experience, and ads never collect study answers or progress.",
    'privacy.s6.t': 'Changes & contact',
    'privacy.s6.p':
      'If this policy changes, the effective date at the top of this page will change with it. Questions, concerns, or "wait, what does this actually mean?" — head over to the <a href="#/support">support page</a>.',
    'support.kicker': 'Support',
    'support.h1a': 'Something broken?',
    'support.h1b': 'Let us fix it.',
    'support.lede':
      "We can help with app bugs, content errors, broken audio, and confusing Swedish wording. We can't tell you the answers to the real exam, give immigration advice, or speed up Migrationsverket. Sorry.",
    'support.meta1.b': 'Reply time',
    'support.meta1.v': '~2 business days',
    'support.meta2.b': 'Language',
    'support.meta2.v': 'English or Swedish',
    'support.meta3.b': 'Cost',
    'support.meta3.v': 'Free',
    'support.toc': 'On this page',
    'support.s1.t': 'What we can help with',
    'support.s1.p': 'Email us if you find:',
    'support.s1.li1':
      'A content issue — a wrong answer, an outdated reference, a typo with attitude.',
    'support.s1.li2': 'Confusing Swedish wording in a question or explanation.',
    'support.s1.li3': 'A broken source link or missing citation.',
    'support.s1.li4':
      'An audio problem — clip cutting off, wrong pronunciation, silence where speech should be.',
    'support.s1.li5':
      "A study-flow bug — progress that didn't save, a streak that broke for no reason, an unfinishable mock exam.",
    'support.s1.li6':
      "A store or build issue — crash on launch, billing weirdness, a download that won't.",
    'support.s2.t': 'What to include',
    'support.s2.p': 'Help us help you faster:',
    'support.s2.li1': 'Device + OS version (Pixel 7, Android 14 / iPhone 13, iOS 17).',
    'support.s2.li2': 'App version (Settings → About).',
    'support.s2.li3': 'What you did, what you expected, what happened instead.',
    'support.s2.li4': "A screenshot, if it's a visual bug.",
    'support.s3.t': "Please don't include sensitive info",
    'support.s3.callout.b': 'No personal data, please.',
    'support.s3.callout.p':
      "Don't send government identifiers (personnummer, samordningsnummer), immigration case details, passport scans, financial info, or anything you wouldn't write on a postcard.",
    'support.s4.t': "What we can't do",
    'support.s4.p': "We can fix app functionality and content corrections. We can't:",
    'support.s4.li1': 'Provide official exam answers or leaked content.',
    'support.s4.li2': 'Give migration or legal advice.',
    'support.s4.li3': 'Speak for any government agency.',
    'support.s4.li4': 'Predict when your case will be decided. (Nobody can.)',
    'support.s5.t': 'Contact',
    'support.s5.p':
      'Email <a href="mailto:support@medborgartest.app">support@medborgartest.app</a>. We read everything. We answer almost everything. Privacy details live on the <a href="#/privacy">privacy page</a>.',
    'terms.kicker': 'Terms of use',
    'terms.h1a': 'Plain rules,',
    'terms.h1b': 'plainly written.',
    'terms.lede':
      'Using the app means you agree to these terms. They are short on purpose. If anything here feels unclear, the support page is one tap away.',
    'terms.meta1.b': 'Effective',
    'terms.meta1.v': '2026-05-15',
    'terms.meta2.b': 'Governing law',
    'terms.meta2.v': 'Sweden',
    'terms.meta3.b': 'Length',
    'terms.meta3.v': '~2 min read',
    'terms.toc': 'In these terms',
    'terms.s1.t': 'What this is',
    'terms.s1.p':
      'Almost Swedish is an unofficial study app. It is not the exam, it is not run by UHR, Skolverket, Migrationsverket, or the Swedish government, and a perfect score here does not grant citizenship.',
    'terms.s2.t': 'Acceptable use',
    'terms.s2.p':
      "Use the app to study. Don't scrape it, reverse-engineer it, or rebrand it as your own product. Don't use it to harass anyone. Treat the app the way you'd treat a borrowed bicycle: well.",
    'terms.s3.t': 'Content & accuracy',
    'terms.s3.p':
      'The current question bank has 179 questions cited directly to UHR\'s public study material <em>Sverige i fokus</em> and 716 editorially derived questions from those same UHR themes. Every question carries a <strong>UHR</strong> or <strong>Derived</strong> provenance badge so you always know which is which, and Settings → Question sources lets you restrict practice + mock to UHR only. Humans miss things — if you find an error, the <a href="#/support">support page</a> is the fastest fix.',
    'terms.s4.t': 'No guarantees',
    'terms.s4.p':
      "We don't guarantee you'll pass the official test. We don't guarantee the app works perfectly on every device on every day. We do guarantee we'll keep trying.",
    'terms.s5.t': 'Liability',
    'terms.s5.callout':
      '<b>Short version:</b> the app is provided "as is", to the maximum extent permitted by Swedish law. We are not liable for missed deadlines, denied applications, fika injuries, or any decision an actual government agency makes about your case.',
    'terms.s6.t': 'Changes',
    'terms.s6.p':
      'If these terms change materially, the effective date above will change and the app will surface a notice on next launch. Continued use after that means you accept the new terms.',
    'sources.kicker': 'Sources & method',
    'sources.h1a': 'Where the answers',
    'sources.h1b': 'actually come from.',
    'sources.lede':
      'The current question bank has two provenance families and every question is badged: <strong>UHR</strong> (179 questions cited directly to <em>Sverige i fokus</em>) and <strong>Derived</strong> (716 questions written editorially from those same UHR themes for additional practice volume). You can restrict practice + mock to UHR only in Settings → Question sources.',
    'sources.meta1.b': 'Primary source',
    'sources.meta1.v': '1',
    'sources.meta2.b': 'Last review',
    'sources.meta2.v': '2026-05',
    'sources.meta3.b': 'Current bank',
    'sources.meta3.v': 'UHR + derived',
    'sources.toc': 'Source checks',
    'sources.s1.t': 'Current question source',
    'sources.s1.li1':
      '<b>UHR — Sverige i fokus</b> — public study material for the Swedish citizenship test.',
    'sources.s1.li2':
      'Direct UHR questions cite a chapter, section, and page from this material; derived questions are badged separately and written from the same UHR themes.',
    'sources.s1.li3':
      'The public source list changes only when the shipped question bank contains questions with that visible provenance.',
    'sources.s2.t': 'How citations work',
    'sources.s2.li1':
      'Question cards show the source line below the question, separate from the stem.',
    'sources.s2.li2':
      'The static question bank stores the same source title, chapter, section, and page for every row.',
    'sources.s3.t': 'Future source families',
    'sources.s3.li1':
      'Other public sources may be added later, but only after matching questions ship with visible citations.',
    'sources.s3.li2':
      'This page is checked against <code>site/questions.js</code> so source copy cannot outrun the current bank.',
    'sources.s4.t': 'Current-source scope',
    'sources.s4.li1':
      'The bank has 179 UHR-cited questions and 716 editorially derived questions; the per-question badge tells you which family each one belongs to, and Settings → Question sources lets you opt out of derived content.',
    'sources.s4.li2': 'The app is independent and is not an official UHR product.',
    'sources.s5.t': 'Editorial method',
    'sources.s5.callout.b': 'House rule:',
    'sources.s5.callout.p':
      "if it can't be cited to a public source, it doesn't make the question bank.",
    'sources.s5.p':
      'Every question goes through draft → source-check → plain-language pass → native-Swedish review. When a source updates (a new election, a law amendment, a renamed agency), the affected questions get a refresh tag and re-enter review.',
    'sources.s5.p2':
      'See a question that disagrees with its cited source? <a href="#/support">Tell us</a> — corrections are usually live within a week.',
    'footer.brag1': 'Study lagom.',
    'footer.brag2': 'Practise smart.',
    'footer.h.app': 'The app',
    'footer.app.1': 'Why it exists',
    'footer.app.2': 'Try a question',
    'footer.app.3': 'Chapters',
    'footer.app.4': 'Mock exam',
    'footer.app.5': 'Roadmap',
    'footer.h.legal': 'Fine print',
    'footer.about.p':
      'An independent study tool built around public study material and visible source lines. Free to start, study, and take mock exams.',
    'footer.h.honest': 'Honest disclaimer',
    'footer.honest.p':
      'Unofficial. Independent. Not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. We just really like helping people study.',
    'footer.copyright': '© 2026 Almost Swedish. Made with kanelbullar in Stockholm.',
    'footer.fika': 'Lagom built. Fika tested.',
    'ad.label': 'Sponsored',
    'ad.placeholder': 'Ad space reserved while reviewed ad slots are configured.',
    'ad.anchor.placeholder': 'Reserved ad area',
    'ad.native.placeholder': 'Native sponsored row',
    'practice.kicker': 'Practice round',
    'practice.title': 'Ten questions.',
    'practice.subtitle': 'No pressure.',
    'consent.title': 'Cookies, lagom-style.',
    'consent.body':
      'Google AdSense can set cookies after you choose. Accept all for personalised ads, accept only what\'s needed for non-personalised ads, or read the <a href="#/privacy">privacy page</a>.',
    'consent.min': 'Necessary only',
    'consent.all': 'Accept all',
    'purchase.eyebrow': 'Account purchases',
    'purchase.h1a': 'Upgrade only after sign-in.',
    'purchase.h1b': 'Your purchase stays with that account.',
    'purchase.lede':
      'Web upgrades require a signed-in Almost Swedish account first. After sign-in we create a Supabase purchase intent for that user, then hand Android buyers to Google Play to finish the one-time purchase with the same account in the app.',
    'purchase.removeAds.eyebrow': 'Ad-free',
    'purchase.removeAds.title': 'Remove Ads',
    'purchase.removeAds.body':
      'Turns off study ads after Google Play/App Store confirmation. Core study stays free.',
    'purchase.removeAds.locked': 'Sign in to buy ad-free',
    'purchase.removeAds.ready': 'Continue with Google Play — 29 kr',
    'purchase.premium.eyebrow': 'Premium',
    'purchase.premium.title': 'Premium Lifetime',
    'purchase.premium.body':
      'Includes everything in Ad-free, plus premium study tools — ebook highlighting, notes, and more — for the account you sign in with.',
    'purchase.premium.locked': 'Sign in to buy Premium',
    'purchase.premium.ready': 'Continue with Google Play — 59 kr',
    'purchase.price.once': 'one-time',
    'purchase.status.locked': 'Sign in first so the upgrade can be attached to your account.',
    'purchase.status.ready': 'Ready for purchases as {account}.',
    'purchase.status.needSignIn':
      'Sign in first. Purchases are attached to the account you use here.',
    'purchase.status.realSignin': 'Real Supabase sign-in is required before purchase handoff.',
    'purchase.status.preparing': 'Preparing your account-bound Google Play handoff…',
    'purchase.status.error': 'Purchase could not start. Please sign in again and retry.',
    'purchase.status.backendMissing':
      'Purchase setup is not finished yet: the purchase-intent table is missing in Supabase.',
    'privacy.s5.web.t': 'Ads on this website',
    'privacy.s5.web.p':
      'This website uses <b>Google AdSense</b> auto ads after your cookie choice. AdSense and its partners may set cookies on your device and use them to personalise ads, measure performance, and detect fraud. We load AdSense according to your cookie choice: <em>Accept all</em> allows personalised ads, while <em>Necessary only</em> keeps ads non-personalised. Manual in-content panels in Practice and Ebook stay as reserved spaces until reviewed slot IDs are configured. You can change your choice by clearing site data for this domain.',
    'privacy.s5.app.t': 'Ads in the mobile app',
    'privacy.s5.app.p':
      "The mobile app uses <b>Google Mobile Ads (AdMob)</b>. On first launch the app shows Google's official consent screen (via the <em>User Messaging Platform</em> SDK), where you can pick personalised, non-personalised, or — in regions where the choice is available — opt out. Ads keep the app free. We never use ads to collect your study answers or progress.",
    'footer.t1': 'Study clearly.',
    'footer.t2': 'Practise with sources.',
    'ebook.ch.intro.title': 'How to read this book',
    'ebook.ch.1.title': 'A very short history of Sweden',
    'ebook.ch.2.title': 'How Sweden is governed',
    'ebook.ch.3.title': 'Rights & the four basic laws',
    'ebook.ch.4.title': 'Work, taxes & the welfare state',
    'ebook.ch.5.title': 'Equality & the modern household',
    'ebook.ch.6.title': 'Society, school & healthcare',
    'ebook.ch.7.title': 'Nature, climate & allemansrätten',
    'ebook.ch.8.title': 'Culture, traditions & the calendar',
    'ebook.ch.9.title': 'Money, banks & BankID',
    'ebook.ch.10.title': 'Sweden, the EU & the world',
    'ebook.ch.11.title': 'Migration, residence & citizenship',
    'ebook.ch.12.title': 'Mock exam & survival guide',
    'ebook.ch.13.title': 'Traditions, holidays & everyday culture',
    'ebook.title': 'The Field Guide',
    'ebook.sub': 'An unofficial companion to the citizenship test.',
    'footer.h.study': 'Study',
    'footer.h.about': 'About',
    'footer.h.fika': 'Mood',
    'footer.fika.p': 'Type <kbd>fika</kbd> anywhere for a coffee break.',
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.auto': 'Auto',
    'settings.palette': 'Color palette',
    'settings.palette.sub': 'Choose a Swedish mood.',
    'settings.buddy': 'Study buddy',
    'settings.buddy.sub': 'Choose a Swedish buddy. They will cheer you on with tips and facts.',
    'settings.buddy.show': 'Show study buddy',
    'settings.language': 'Language',
    'settings.sources': 'Question sources',
    'settings.sources.all': 'All sources',
    'settings.sources.uhr': 'UHR only',
    'settings.sources.hint':
      'All sources includes UHR-cited and derived practice questions. UHR only limits practice and mock exams to the 179 questions traceable to Sverige i fokus citations.',
    'settings.text': 'Text size',
    'settings.text.s': 'Small',
    'settings.text.m': 'Regular',
    'settings.text.l': 'Large',
    'settings.misc': 'Other',
    'settings.motion': 'Reduce motion',
    'settings.aurora': 'Northern lights in dark mode',
    'settings.flag': 'Show flag cross in hero',
    'settings.consent.reset': 'Reset cookie / ad consent…',
    'settings.savedHint': 'Changes save automatically.',
    'settings.done': 'Done',
    'a11y.settings.open': 'Settings',
    'a11y.close': 'Close',
    'a11y.ad.close': 'Close ad',
    'a11y.studyBuddy': 'Study buddy',
    'palette.flag.hint': 'Blue + gold, the original',
    'palette.midsommar.hint': 'Pasture green + flower yellow',
    'palette.falu.hint': 'The red of every Swedish barn',
    'palette.skargard.hint': 'Slate sea + low summer sun',
    'palette.norrsken.hint': 'Northern lights — best with dark theme',
  },
  sv: {
    brand: 'Almost Swedish',
    'meta.title': 'Nästan svensk — plugga och öva.',
    'meta.description':
      'Inofficiell övning för svenska samhällskunskaper med källstödda frågor, korta kapitel och lugna repetitionsverktyg.',
    'nav.home': 'Hem',
    'nav.practice': 'Öva',
    'nav.mock': 'Övningsprov',
    'nav.dashboard': 'Översikt',
    'nav.ebook': 'E-bok',
    'nav.support': 'Hjälp',
    'nav.privacy': 'Integritet',
    'nav.terms': 'Villkor',
    'nav.sources': 'Källor',
    'nav.cta': 'Hämta appen ↗',
    'hero.eyebrow': 'Fristående studieverktyg · källstött · inget konto',
    'hero.h1a': 'Lär känna Sverige.',
    'hero.h1b': 'Öva med källor.',
    'hero.h1c': 'Känn dig förberedd.',
    'hero.lede':
      'Ett lugnt, fristående studieverktyg för svensk samhällskunskap. Korta kapitel, fokuserad övning och tidsatt övningsprov hjälper dig att förstå innehållet steg för steg.',
    'hero.cta1': 'Börja öva',
    'hero.cta2': 'Testa en fråga',
    'hero.stat1': 'samhällsfrågor',
    'hero.stat2': 'kapitel, i lagom format',
    'hero.stat3': 'att börja, inget konto',
    'phone.crumb': 'Kapitel 3 · Samhälle & Rättigheter',
    'phone.q': 'Vilken svensk princip ger alla rätt att vistas fritt i naturen?',
    'phone.hint': 'Snyggt. 18 dagars streak. Fortsätt.',
    'marquee.1': 'Allemansrätten',
    'marquee.2': 'Riksdagen',
    'marquee.3': 'Grundlagar',
    'marquee.4': 'Skatteverket',
    'marquee.5': 'Folkhemmet',
    'marquee.6': 'Jämställdhet',
    'marquee.7': 'Vasaloppet',
    'marquee.8': 'Midsommar',
    'demo.eyebrow': 'Testa en fråga',
    'demo.h1': 'Inget hetsplugg.',
    'demo.h2': 'Bara jämn övning.',
    'demo.deck':
      'Svara på en fråga, läs förklaringen och fortsätt. Svåra frågor kommer tillbaka senare, så repetitionen blir hanterbar.',
    'demo.li1': '<b>Repetition med intervall</b> tar fram svåra frågor på rätt dag.',
    'demo.li2': '<b>Begripliga förklaringar</b> — inget juridiskt krångel, ingen byråkratdjungel.',
    'demo.li3': '<b>Provläge</b> med tidsatt övning, så längre pass känns lugnare.',
    'qcard.chip': 'Kapitel 5 · q039',
    'qcard.q':
      'Vilken svensk princip ger alla rätt att gå, simma och plocka bär på det mesta av Sveriges mark?',
    'qcard.a': 'Jantelagen — lagen om att vara lagom',
    'qcard.b': 'Allemansrätten — rätten till naturen',
    'qcard.c': 'Lagom — läran om att inte överdriva',
    'qcard.d': 'Fika — den grundlagsskyddade kafferasten',
    'qcard.ex.b': 'Allemansrätten',
    'qcard.ex.p':
      ' — "allas rätt" — låter dig gå, simma, åka skidor, tälta och plocka bär på det mesta av Sveriges mark. Haken: var försiktig, hänsynsfull, och slå inte upp tältet i någons rabatt.',
    'qcard.prov': 'UHR',
    'qcard.src': 'Källa: Sverige i fokus · Lag och rätt · Allemansrätten · s. 17',
    'qcard.again': 'Försök igen →',
    'numbers.1': 'frågor från offentliga källor',
    'numbers.2': 'kapitel om historia, samhälle & rättigheter',
    'numbers.3': 'om dagen — en kort studievana',
    'numbers.4': 'att börja. Ingen inloggning. Dina framsteg sparas lokalt.',
    'chap.eyebrow': 'Vad ingår',
    'chap.h1': 'Korta kapitel.',
    'chap.h2': 'Tydligt svenskt sammanhang.',
    'chap.deck':
      'Varje kapitel håller sig nära källorna och förklarar ord och idéer på vanlig svenska.',
    'chap.1.t': 'Sveriges historia, mycket kortfattat',
    'chap.1.d':
      'Vikingar → kungar → 1809 → folkhemmet → EU. Hela berg-och-dalbanan, utan släktträdsplugget.',
    'chap.1.m2': '~9 min',
    'chap.2.t': 'Så styrs Sverige',
    'chap.2.d':
      'Riksdag, regering, kommun, region. Vem bestämmer vad, vem du röstar på, och varför ingen är rädd för kungen.',
    'chap.2.m2': '~12 min',
    'chap.3.t': 'Rättigheter, friheter & de fyra grundlagarna',
    'chap.3.d':
      'Grundlagarna på enkel svenska. Tryckfrihet, yttrandefrihet, och varför chefen inte får fråga om din religion.',
    'chap.3.m2': '~11 min',
    'chap.4.t': 'Arbete, skatt & välfärden',
    'chap.4.d':
      'Skatteverket, kollektivavtal, föräldraledighet, sjukpenning. Avtalet du gick med på.',
    'chap.4.m2': '~10 min',
    'chap.5.t': 'Jämställdhet & det moderna hushållet',
    'chap.5.d':
      'Jämställdhet, HBTQ+-rättigheter, hur föräldraledigheten delas. Anledningen till att Sverige dyker upp i alla rankinglistor.',
    'chap.5.m2': '~9 min',
    'chap.6.t': 'Samhälle, skola & sjukvård',
    'chap.6.d': 'Förskola till universitet, BVC till 1177. Hur vardagen är monterad.',
    'chap.6.m2': '~10 min',
    'chap.7.t': 'Natur, klimat & allemansrätten',
    'chap.7.d':
      'Rätten att vistas fritt, miljöregler, varför man trots allt inte får plocka grannens äpplen (tyvärr).',
    'chap.7.m2': '~8 min',
    'chap.8.t': 'Kultur, traditioner & kalendern',
    'chap.8.d':
      'Midsommar, lucia, kräftskiva, semladagen. Bra för provet. Avgörande för småpratet.',
    'chap.8.m2': '~9 min',
    'chap.9.t': 'Pengar, banker & BankID',
    'chap.9.d':
      'Personnummer, BankID, Swish, kronor. Sverige drivs av plast och identifierare — lär känna dem.',
    'chap.9.m2': '~7 min',
    'chap.10.t': 'Sverige, EU & världen',
    'chap.10.d':
      'Med i EU sedan 1995, lite-neutralt i sekler, nu i NATO. Den internationella berättelsen.',
    'chap.10.m2': '~8 min',
    'chap.11.t': 'Migration, uppehållstillstånd & medborgarskap',
    'chap.11.d':
      'Den faktiska vägen till passet. Vägar, krav, skillnaden mellan PUT, medborgarskap och "bara på besök".',
    'chap.11.m2': '~9 min',
    'chap.12.t': 'Övningsprov & överlevnadsguide',
    'chap.12.d':
      'Tidsatta övningsprov i full längd som hjälper dig träna provsituationen. Plus en "så här packar du väskan"-lista.',
    'chap.12.m2': '60 min styck',
    'chap.13.t': 'Traditioner, helgdagar & vardagskultur',
    'how.eyebrow': 'Så funkar det',
    'how.h1': 'Plugga lagom.',
    'how.h2': 'Öva smart.',
    'how.deck':
      'Tre lägen, en app. Använd i valfri ordning — de flesta cyklar genom alla tre veckan innan provet.',
    'how.s1.t': 'Lär — korta kapitel',
    'how.s1.p':
      'Läs en 5-minuters förklaring, gör sedan en kort övning. Som att ha en tålmodig svensk vän som faktiskt avslutar sina meningar.',
    'how.s2.t': 'Öva — smarta drills',
    'how.s2.p':
      'Misstag dyker upp igen på rätt dag. Du kommer bli förvånad över hur snabbt Riksdagen slutar låta som möbler.',
    'how.s3.t': 'Provläge — träningspass med tid',
    'how.s3.p':
      'Öva med ett längre tidsatt upplägg och gå igenom resultatet som en studieomgång. Det officiella upplägget kan ändras.',
    'faq.eyebrow': 'Ofta och uppriktigt ställda',
    'faq.h1': 'Frågor du skulle ställa',
    'faq.h2': 'över kaffe.',
    'faq.1.q': 'Är det här det officiella medborgarskapsprovet?',
    'faq.1.a':
      'Nej, och vi säger det på varje sida. Vi är fristående — inte kopplade till UHR, Skolverket, Migrationsverket eller någon som faktiskt avgör vem som blir medborgare. Vi gör ett studiematerial. De håller i provet.',
    'faq.2.q': 'Hjälper det mig verkligen att klara provet?',
    'faq.2.a':
      'Det hjälper dig att <em>plugga</em>. Resten beror på dig, det officiella materialet och hur många fikapauser du tar. Vi hämtar frågor från den offentliga banken och förklarar varje en på enkel svenska.',
    'faq.3.q': 'Behöver jag ett konto?',
    'faq.3.a':
      'Nej — du kan göra allt utan att registrera dig, och dina framsteg sparas på din enhet. Att logga in är valfritt, men låser upp mer: dina markeringar, anteckningar och panel synkas mellan alla dina enheter.',
    'faq.4.q': 'Är den gratis?',
    'faq.4.a':
      'Gratis att börja, plugga och öva med övningsprov. Du kan göra övningsprov i appen utan betalning; annonser hjälper oss hålla kärnfunktionerna tillgängliga, och Ta bort annonser är ett valfritt engångsköp på 29 SEK som tar bort annonser.',
    'faq.5.q': 'Fungerar den på svenska också?',
    'faq.5.a':
      'Ja. Tryck på språkknappen i toppmenyn för att byta — svenska, engelska och tio till. Många pluggar på två språk samtidigt: läs på svenska och kika på ett annat när du fastnar.',
    'faq.6.q': 'Delas mina data med någon?',
    'faq.6.a':
      'Dina studieframsteg, svar, misstag och inställningar sparas lokalt. Webbplatsen använder automatiska Google AdSense-annonser efter ditt cookieval; Google Mobile Ads (AdMob) i appen kan behandla annons- och samtyckessignaler. Annonser får aldrig dina studiesvar eller framsteg.',
    'doc.back': '← Tillbaka till hem',
    'privacy.kicker': 'Integritetspolicy',
    'privacy.h1a': 'Dina data',
    'privacy.h1b': 'stannar i telefonen.',
    'privacy.lede':
      'Almost Swedish är en fristående studieapp. Vi ber inte om konto, och studieframsteg stannar lokalt. Den här sidan förklarar Google AdSense-annonser på webben, Google Mobile Ads i appen och det valfria engångsköpet Ta bort annonser.',
    'privacy.meta1.b': 'Gäller från',
    'privacy.meta1.v': '2026-05-15',
    'privacy.meta2.b': 'Version',
    'privacy.meta2.v': '1.0',
    'privacy.meta3.b': 'Lästid',
    'privacy.meta3.v': '~3 min',
    'privacy.toc': 'I denna policy',
    'privacy.s1.t': 'Oberoende',
    'privacy.s1.p':
      'Almost Swedish är en fristående studieapp för övning av svensk samhällskunskap. Den är inte officiell och inte kopplad till UHR, Skolverket, Migrationsverket eller svenska staten. Allt du läser här gäller bara vad <em>denna app</em> gör — inget mer.',
    'privacy.s2.t': 'Inget konto krävs',
    'privacy.s2.p':
      'Appen kräver inget konto, ingen e-post, inget telefonnummer och ingen profilregistrering. Du öppnar appen, pluggar, stänger appen. Det är avtalet.',
    'privacy.s3.t': 'Lokala studieframsteg',
    'privacy.s3.p':
      'Framsteg, inställningar, misstag, XP, streaks, märken, bokmärken och ljudpreferenser lagras lokalt på din enhet. De lämnar den aldrig. Avinstallerar du appen är de borta — bra att veta.',
    'privacy.s4.t': 'Nuvarande datahantering',
    'privacy.s4.callout.b': 'På klarspråk:',
    'privacy.s4.callout.p': 'studieframsteg och svar stannar lokalt; annonssystem får inte dem.',
    'privacy.s4.p':
      'Vi kör inga kontoprofiler och skickar inte studiesvar, misstag, framsteg, inställningar, XP, streaks, märken, bokmärken eller ljudpreferenser till annonsleverantörer. Googles annonssystem kan behandla annons- och samtyckessignaler enligt beskrivningen nedan.',
    'privacy.s5.t': 'Annonser och köp',
    'privacy.s5.p':
      'Den här webbplatsen använder automatiska Google AdSense-annonser efter ditt cookieval. Manuella annonsytor i övning och e-bok visas som reserverade ytor tills granskade annonsplats-ID:n är konfigurerade. Mobilappen använder Google Mobile Ads (AdMob) bakom Googles samtyckesflöde. Ta bort annonser är ett valfritt engångsköp på 29 SEK som tar bort annonser. Annonser hjälper till att finansiera den kostnadsfria studieupplevelsen, och annonser samlar aldrig in dina studiesvar eller framsteg.',
    'privacy.s6.t': 'Ändringar & kontakt',
    'privacy.s6.p':
      'Om policyn ändras uppdateras datumet längst upp. Frågor, oro, eller "vad betyder det här egentligen?" — gå till <a href="#/support">supportsidan</a>.',
    'support.kicker': 'Support',
    'support.h1a': 'Är något trasigt?',
    'support.h1b': 'Vi fixar det.',
    'support.lede':
      'Vi kan hjälpa med buggar, faktafel, trasigt ljud och otydlig svenska. Vi kan inte ge svar på det riktiga provet, ge migrationsråd eller skynda på Migrationsverket. Tyvärr.',
    'support.meta1.b': 'Svarstid',
    'support.meta1.v': '~2 arbetsdagar',
    'support.meta2.b': 'Språk',
    'support.meta2.v': 'Engelska eller svenska',
    'support.meta3.b': 'Pris',
    'support.meta3.v': 'Gratis',
    'support.toc': 'På den här sidan',
    'support.s1.t': 'Vad vi kan hjälpa med',
    'support.s1.p': 'Mejla oss om du hittar:',
    'support.s1.li1': 'Ett innehållsfel — fel svar, utdaterad referens, ett stavfel med attityd.',
    'support.s1.li2': 'Otydlig svenska i en fråga eller förklaring.',
    'support.s1.li3': 'En trasig källänk eller saknad referens.',
    'support.s1.li4':
      'Ett ljudproblem — klipp som hackar, fel uttal, tystnad där det borde vara tal.',
    'support.s1.li5':
      'Ett studieflöde-bug — framsteg som inte sparades, en streak som bröts utan anledning, ett övningsprov som inte går att avsluta.',
    'support.s1.li6':
      'Ett butik- eller bygge-problem — krasch vid start, betalningskrångel, en nedladdning som vägrar.',
    'support.s2.t': 'Vad du bör inkludera',
    'support.s2.p': 'Hjälp oss hjälpa dig snabbare:',
    'support.s2.li1': 'Enhet + OS-version (Pixel 7, Android 14 / iPhone 13, iOS 17).',
    'support.s2.li2': 'App-version (Inställningar → Om).',
    'support.s2.li3': 'Vad du gjorde, vad du förväntade dig, vad som hände.',
    'support.s2.li4': 'En skärmdump om det är ett visuellt fel.',
    'support.s3.t': 'Skicka inte känslig information',
    'support.s3.callout.b': 'Inga personuppgifter, tack.',
    'support.s3.callout.p':
      'Skicka inte personnummer, samordningsnummer, ärendeinformation, passkopior, ekonomisk info eller något du inte skulle skriva på ett vykort.',
    'support.s4.t': 'Vad vi inte kan göra',
    'support.s4.p': 'Vi kan fixa app-funktioner och rätta innehåll. Vi kan inte:',
    'support.s4.li1': 'Ge officiella provsvar eller läckt material.',
    'support.s4.li2': 'Ge migrations- eller juridisk rådgivning.',
    'support.s4.li3': 'Tala för någon myndighet.',
    'support.s4.li4': 'Förutsäga när ditt ärende avgörs. (Det kan ingen.)',
    'support.s5.t': 'Kontakt',
    'support.s5.p':
      'Mejla <a href="mailto:support@medborgartest.app">support@medborgartest.app</a>. Vi läser allt. Vi svarar nästan på allt. Integritetsdetaljer finns på <a href="#/privacy">integritetssidan</a>.',
    'terms.kicker': 'Användarvillkor',
    'terms.h1a': 'Enkla regler,',
    'terms.h1b': 'enkelt skrivna.',
    'terms.lede':
      'Att använda appen innebär att du godkänner dessa villkor. De är korta med flit. Är något oklart är supportsidan ett tryck bort.',
    'terms.meta1.b': 'Gäller från',
    'terms.meta1.v': '2026-05-15',
    'terms.meta2.b': 'Tillämplig lag',
    'terms.meta2.v': 'Sverige',
    'terms.meta3.b': 'Längd',
    'terms.meta3.v': '~2 min läsning',
    'terms.toc': 'I villkoren',
    'terms.s1.t': 'Vad det här är',
    'terms.s1.p':
      'Almost Swedish är en inofficiell studieapp. Det är inte provet, det drivs inte av UHR, Skolverket, Migrationsverket eller svenska staten, och full pott här ger inte medborgarskap.',
    'terms.s2.t': 'Acceptabel användning',
    'terms.s2.p':
      'Använd appen för att plugga. Skrapa den inte, reverse-engineera den inte, bygg inte om den och kalla den din. Använd den inte för att trakassera någon. Behandla appen som du behandlar en lånad cykel: väl.',
    'terms.s3.t': 'Innehåll & korrekthet',
    'terms.s3.p':
      'Den nuvarande frågebanken har 179 frågor med direkt hänvisning till UHR:s offentliga studiematerial <em>Sverige i fokus</em> och 716 redaktionellt härledda frågor som bygger på samma UHR-teman. Varje fråga är märkt med <strong>UHR</strong> eller <strong>Härledd</strong> så du alltid vet vilken familj den tillhör, och i Inställningar → Frågekällor kan du begränsa övning + provsim till enbart UHR. Människor missar saker — hittar du fel är <a href="#/support">supportsidan</a> snabbaste vägen.',
    'terms.s4.t': 'Inga garantier',
    'terms.s4.p':
      'Vi garanterar inte att du klarar det officiella provet. Vi garanterar inte att appen funkar perfekt på varje enhet varje dag. Vi garanterar att vi fortsätter försöka.',
    'terms.s5.t': 'Ansvar',
    'terms.s5.callout':
      '<b>Kort version:</b> appen tillhandahålls "i befintligt skick" enligt vad som tillåts av svensk lag. Vi är inte ansvariga för missade deadlines, avslagna ansökningar eller beslut som en myndighet tar i ditt ärende.',
    'terms.s6.t': 'Ändringar',
    'terms.s6.p':
      'Om villkoren ändras väsentligt uppdateras datumet ovan och appen visar en notis vid nästa start. Fortsatt användning innebär att du godkänner de nya villkoren.',
    'sources.kicker': 'Källor & metod',
    'sources.h1a': 'Var svaren',
    'sources.h1b': 'faktiskt kommer ifrån.',
    'sources.lede':
      'Den nuvarande frågebanken har två källfamiljer och varje fråga är märkt: <strong>UHR</strong> (179 frågor med direkt hänvisning till <em>Sverige i fokus</em>) och <strong>Härledd</strong> (716 redaktionellt härledda frågor från samma UHR-teman för extra övningsmängd). Du kan begränsa övning + provsim till enbart UHR i Inställningar → Frågekällor.',
    'sources.meta1.b': 'Primär källa',
    'sources.meta1.v': '1',
    'sources.meta2.b': 'Senaste översyn',
    'sources.meta2.v': '2026-05',
    'sources.meta3.b': 'Nuvarande bank',
    'sources.meta3.v': 'UHR + härledd',
    'sources.toc': 'Källkontroller',
    'sources.s1.t': 'Nuvarande frågekälla',
    'sources.s1.li1':
      '<b>UHR — Sverige i fokus</b> — offentligt studiematerial för medborgarskapsprovet.',
    'sources.s1.li2':
      'Direkta UHR-frågor anger kapitel, avsnitt och sida från materialet; härledda frågor är märkta separat och skrivna från samma UHR-teman.',
    'sources.s1.li3':
      'Den offentliga källistan ändras bara när frågebanken innehåller frågor med den synliga proveniensen.',
    'sources.s2.t': 'Så fungerar hänvisningar',
    'sources.s2.li1': 'Frågekort visar källraden under frågan, separat från frågetexten.',
    'sources.s2.li2':
      'Den statiska frågebanken lagrar samma källtitel, kapitel, avsnitt och sida för varje rad.',
    'sources.s3.t': 'Framtida källfamiljer',
    'sources.s3.li1':
      'Andra offentliga källor kan läggas till senare, men bara när matchande frågor publiceras med synliga hänvisningar.',
    'sources.s3.li2':
      'Den här sidan kontrolleras mot <code>site/questions.js</code> så källcopy inte kan springa före den aktuella banken.',
    'sources.s4.t': 'Nuvarande källomfång',
    'sources.s4.li1':
      'Frågebanken har 179 UHR-citerade frågor och 716 redaktionellt härledda frågor; märkningen per fråga visar vilken familj varje fråga tillhör, och i Inställningar → Frågekällor kan du välja bort härlett innehåll.',
    'sources.s4.li2': 'Appen är fristående och är inte en officiell UHR-produkt.',
    'sources.s5.t': 'Redaktionell metod',
    'sources.s5.callout.b': 'Husregel:',
    'sources.s5.callout.p':
      'om något inte kan refereras till en offentlig källa kommer det inte med i frågebanken.',
    'sources.s5.p':
      'Varje fråga går igenom utkast → källkoll → enkel-svenska-pass → granskning av modersmålstalare. När en källa uppdateras (nytt val, lagändring, omdöpt myndighet) får berörda frågor en refresh-tagg och går tillbaka till granskning.',
    'sources.s5.p2':
      'Ser du en fråga som inte stämmer med sin källa? <a href="#/support">Berätta för oss</a> — rättelser är oftast live inom en vecka.',
    'footer.brag1': 'Plugga lagom.',
    'footer.brag2': 'Öva smart.',
    'footer.h.app': 'Appen',
    'footer.app.1': 'Varför den finns',
    'footer.app.2': 'Testa en fråga',
    'footer.app.3': 'Kapitel',
    'footer.app.4': 'Övningsprov',
    'footer.app.5': 'Roadmap',
    'footer.h.legal': 'Finstilta',
    'footer.about.p':
      'Ett fristående studieverktyg byggt kring offentligt studiematerial och tydliga källrader. Gratis att börja, plugga och göra övningsprov.',
    'footer.h.honest': 'Ärlig friskrivning',
    'footer.honest.p':
      'Inofficiell. Fristående. Inte kopplad till UHR, Skolverket, Migrationsverket eller svenska staten. Vi gillar bara verkligen att hjälpa folk plugga.',
    'footer.copyright': '© 2026 Almost Swedish. Gjort med kanelbullar i Stockholm.',
    'footer.fika': 'Lagom byggt. Fika-testat.',
    'ad.label': 'Annons',
    'ad.placeholder': 'Annonsyta reserverad tills granskade annonsplatser är konfigurerade.',
    'ad.anchor.placeholder': 'Reserverad annonsyta',
    'ad.native.placeholder': 'Sponsrad rad',
    'practice.kicker': 'Övningsrunda',
    'practice.title': 'Tio frågor.',
    'practice.subtitle': 'Ingen press.',
    'consent.title': 'Cookies, på lagom-vis.',
    'consent.body':
      'Google AdSense kan sätta cookies efter ditt val. Godkänn allt för personaliserade annonser, välj bara det nödvändiga för icke-personaliserade annonser, eller läs <a href="#/privacy">integritetssidan</a>.',
    'consent.min': 'Bara nödvändiga',
    'consent.all': 'Godkänn allt',
    'purchase.eyebrow': 'Kontoköp',
    'purchase.h1a': 'Uppgradera först efter inloggning.',
    'purchase.h1b': 'Köpet följer det kontot.',
    'purchase.lede':
      'Webbuppgraderingar kräver först ett inloggat Almost Swedish-konto. Efter inloggning skapar vi en Supabase-köpavsikt för den användaren och skickar sedan Android-köpare till Google Play för att slutföra engångsköpet med samma konto i appen.',
    'purchase.removeAds.eyebrow': 'Annonsfritt',
    'purchase.removeAds.title': 'Ta bort annonser',
    'purchase.removeAds.body':
      'Stänger av studieannonser efter bekräftelse från Google Play/App Store. Kärnstudierna förblir gratis.',
    'purchase.removeAds.locked': 'Logga in för att köpa annonsfritt',
    'purchase.removeAds.ready': 'Fortsätt med Google Play — 29 kr',
    'purchase.premium.eyebrow': 'Premium',
    'purchase.premium.title': 'Premium livstid',
    'purchase.premium.body':
      'Innehåller allt i Annonsfritt, plus premiumverktyg för studier — markeringar och anteckningar i e-boken med mera — för kontot du loggar in med.',
    'purchase.premium.locked': 'Logga in för att köpa Premium',
    'purchase.premium.ready': 'Fortsätt med Google Play — 59 kr',
    'purchase.price.once': 'engångsköp',
    'purchase.status.locked': 'Logga in först så uppgraderingen kan kopplas till ditt konto.',
    'purchase.status.ready': 'Redo för köp som {account}.',
    'purchase.status.needSignIn': 'Logga in först. Köp kopplas till kontot du använder här.',
    'purchase.status.realSignin': 'Riktig Supabase-inloggning krävs innan köpet skickas vidare.',
    'purchase.status.preparing': 'Förbereder kontoanknuten vidarebefordran till Google Play…',
    'purchase.status.error': 'Köpet kunde inte starta. Logga in igen och försök på nytt.',
    'purchase.status.backendMissing':
      'Köpet är inte färdigkopplat än: tabellen för köpintentioner saknas i Supabase.',
    'privacy.s5.web.t': 'Annonser på webbplatsen',
    'privacy.s5.web.p':
      'Den här webbplatsen använder automatiska <b>Google AdSense</b>-annonser efter ditt cookieval. AdSense och dess partner kan sätta cookies på din enhet och använda dem för personalisering, mätning och bedrägeridetektering. Vi laddar AdSense enligt ditt cookieval: <em>Godkänn allt</em> tillåter personaliserade annonser, medan <em>Bara nödvändiga</em> håller annonserna icke-personaliserade. Manuella annonsytor i övning och e-bok visas som reserverade ytor tills granskade annonsplats-ID:n är konfigurerade. Du kan ändra valet genom att tömma platsdata för domänen.',
    'privacy.s5.app.t': 'Annonser i mobilappen',
    'privacy.s5.app.p':
      'Mobilappen använder <b>Google Mobile Ads (AdMob)</b>. Vid första start visar appen Googles officiella samtyckesskärm (via <em>User Messaging Platform</em>-SDK:n) där du kan välja personaliserat, icke-personaliserat eller — där det går — avstå. Annonser håller appen gratis. Vi använder aldrig annonser för att samla in dina studiesvar eller framsteg.',
    'footer.t1': 'Plugga tydligt.',
    'footer.t2': 'Öva med källor.',
    'ebook.ch.intro.title': 'Så läser du boken',
    'ebook.ch.1.title': 'Sveriges historia, mycket kortfattat',
    'ebook.ch.2.title': 'Så styrs Sverige',
    'ebook.ch.3.title': 'Rättigheter, friheter & de fyra grundlagarna',
    'ebook.ch.4.title': 'Arbete, skatt & välfärden',
    'ebook.ch.5.title': 'Jämställdhet & det moderna hushållet',
    'ebook.ch.6.title': 'Samhälle, skola & sjukvård',
    'ebook.ch.7.title': 'Natur, klimat & allemansrätten',
    'ebook.ch.8.title': 'Kultur, traditioner & kalendern',
    'ebook.ch.9.title': 'Pengar, banker & BankID',
    'ebook.ch.10.title': 'Sverige, EU & världen',
    'ebook.ch.11.title': 'Migration, uppehållstillstånd & medborgarskap',
    'ebook.ch.12.title': 'Övningsprov & överlevnadsguide',
    'ebook.ch.13.title': 'Traditioner, helgdagar & vardagskultur',
    'ebook.title': 'Fältguiden',
    'ebook.sub': 'En inofficiell följeslagare till medborgarskapsprovet.',
    'footer.h.study': 'Studera',
    'footer.h.about': 'Om',
    'footer.h.fika': 'Stämning',
    'footer.fika.p': 'Skriv <kbd>fika</kbd> var som helst för en kaffepaus.',
    'settings.title': 'Inställningar',
    'settings.theme': 'Tema',
    'settings.theme.light': 'Ljust',
    'settings.theme.dark': 'Mörkt',
    'settings.theme.auto': 'Automatiskt',
    'settings.palette': 'Färgpalett',
    'settings.palette.sub': 'Välj en svensk stämning.',
    'settings.buddy': 'Studiekompis',
    'settings.buddy.sub': 'Välj en svensk kompis. De peppar dig med tips och fakta.',
    'settings.buddy.show': 'Visa studiekompis',
    'settings.language': 'Språk',
    'settings.sources': 'Frågekällor',
    'settings.sources.all': 'Alla källor',
    'settings.sources.uhr': 'Endast UHR',
    'settings.sources.hint':
      'Alla källor visar UHR-hänvisade frågor och härledda övningsfrågor. Endast UHR begränsar övning och övningsprov till de 179 frågor som kan spåras till hänvisningar i Sverige i fokus.',
    'settings.text': 'Textstorlek',
    'settings.text.s': 'Liten',
    'settings.text.m': 'Normal',
    'settings.text.l': 'Stor',
    'settings.misc': 'Övrigt',
    'settings.motion': 'Minska rörelse',
    'settings.aurora': 'Norrsken i mörkt läge',
    'settings.flag': 'Visa flaggkors i hjälten',
    'settings.consent.reset': 'Återställ cookie-/annonssamtycke…',
    'settings.savedHint': 'Ändringar sparas automatiskt.',
    'settings.done': 'Klar',
    'a11y.settings.open': 'Inställningar',
    'a11y.close': 'Stäng',
    'a11y.ad.close': 'Stäng annons',
    'a11y.studyBuddy': 'Studiekompis',
    'palette.flag.hint': 'Blått + gult, originalet',
    'palette.midsommar.hint': 'Ängsgrönt + blomgult',
    'palette.falu.hint': 'Rött som svenska lador',
    'palette.skargard.hint': 'Skifferhav + låg sommarsol',
    'palette.norrsken.hint': 'Norrsken — bäst med mörkt tema',
  },
});

function smtMergePreloadedExtraI18n() {
  const extra = window.__i18n_extra;
  if (!extra || typeof extra !== 'object') return false;
  Object.assign(i18n, extra);
  delete window.__i18n_extra;
  return true;
}
const smtPreloadedExtraI18nMerged = smtMergePreloadedExtraI18n();
window.smtMergePreloadedExtraI18n = smtMergePreloadedExtraI18n;

const SMT_RTL_LANGUAGES = new Set(['ar', 'ckb', 'fa']);

function smtNormalizeLanguage(lang) {
  return i18n[lang] ? lang : 'en';
}
window.smtNormalizeLanguage = smtNormalizeLanguage;

function smtApplyLanguageDirection(lang) {
  const normalized = smtNormalizeLanguage(lang);
  const direction = SMT_RTL_LANGUAGES.has(normalized) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('lang', normalized);
  document.documentElement.setAttribute('dir', direction);
  return normalized;
}
window.smtApplyLanguageDirection = smtApplyLanguageDirection;

const SMT_CHAPTER_QUESTION_COUNT_FORMATTERS = {
  en: (count) => `${count} ${count === 1 ? 'question' : 'questions'}`,
  sv: (count) => `${count} ${count === 1 ? 'fråga' : 'frågor'}`,
  'zh-Hans': (count) => `${count}道题`,
  'zh-Hant': (count) => `${count}題`,
  ar: (count) => `${count} سؤالاً`,
  ckb: (count) => `${count} پرسیار`,
  fa: (count) => `${count} پرسش`,
  pl: (count) => `${count} pytań`,
  so: (count) => `${count} su’aalood`,
  ti: (count) => `${count} ሕቶታት`,
  tr: (count) => `${count} soru`,
  uk: (count) => `${count} питань`,
};

function smtChapterQuestionCountLabel(chapterId, lang) {
  const chapters = Array.isArray(window.SMT_CHAPTERS_META) ? window.SMT_CHAPTERS_META : [];
  const chapter = chapters.find((candidate) => Number(candidate.id) === Number(chapterId));
  const count = Number(chapter ? chapter.questionCount : chapterId);
  if (!Number.isFinite(count) || count < 0) return '';
  const normalized = smtNormalizeLanguage(lang);
  const requested = typeof lang === 'string' ? lang : normalized;
  const formatter =
    SMT_CHAPTER_QUESTION_COUNT_FORMATTERS[requested] ||
    SMT_CHAPTER_QUESTION_COUNT_FORMATTERS[normalized] ||
    SMT_CHAPTER_QUESTION_COUNT_FORMATTERS.en;
  return formatter(Math.floor(count));
}
window.smtChapterQuestionCountLabel = smtChapterQuestionCountLabel;

function smtApplyChapterQuestionCounts(lang) {
  const chapters = Array.isArray(window.SMT_CHAPTERS_META) ? window.SMT_CHAPTERS_META : [];
  chapters.forEach((chapter) => {
    if (!chapter || !Number.isFinite(Number(chapter.id))) return;
    document.querySelectorAll(`[data-i18n="chap.${chapter.id}.m1"]`).forEach((el) => {
      el.innerHTML = smtChapterQuestionCountLabel(chapter.id, lang);
    });
  });
}
window.smtApplyChapterQuestionCounts = smtApplyChapterQuestionCounts;

function smtApplyA11yLabels(lang) {
  document.querySelectorAll('[data-a11y-label]').forEach((el) => {
    const key = el.dataset.a11yLabel;
    const value = i18n[lang] && i18n[lang][key];
    if (value === undefined) return;
    el.setAttribute('aria-label', value);
  });
}
window.smtApplyA11yLabels = smtApplyA11yLabels;

function smtApplyDocumentMetadata(lang) {
  const dict = i18n[lang] || i18n.en || {};
  const title = dict['meta.title'];
  const description = dict['meta.description'];
  if (title) document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta && description) descriptionMeta.setAttribute('content', description);
}
window.smtApplyDocumentMetadata = smtApplyDocumentMetadata;

function applyLang(lang) {
  lang = smtApplyLanguageDirection(lang);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = i18n[lang] && i18n[lang][key];
    if (value === undefined) return;
    // some strings have HTML (em, b, a) — preserve via innerHTML
    el.innerHTML = value;
  });
  smtApplyChapterQuestionCounts(lang);
  smtApplyA11yLabels(lang);
  smtApplyDocumentMetadata(lang);
  document.querySelectorAll('.lang button[data-lang]').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('is-on', on);
    if (typeof b.setAttribute === 'function') b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  try {
    localStorage.setItem('smt_lang', lang);
  } catch {}
}
window.applyLang = applyLang;

function smtEmitLanguageChange(lang) {
  if (typeof window.dispatchEvent !== 'function') return;
  const event =
    typeof CustomEvent === 'function'
      ? new CustomEvent('smt:languagechange', { detail: { lang } })
      : typeof Event === 'function'
        ? new Event('smt:languagechange')
        : { type: 'smt:languagechange' };
  window.dispatchEvent(event);
}

function smtSetLanguage(lang) {
  const nextLang = smtNormalizeLanguage(lang);
  applyLang(nextLang);
  smtEmitLanguageChange(nextLang);
}
window.smtSetLanguage = smtSetLanguage;

function smtApplySavedLanguage() {
  let saved = 'en';
  try {
    saved = localStorage.getItem('smt_lang') || 'en';
  } catch {}
  applyLang(saved);
}
window.smtApplySavedLanguage = smtApplySavedLanguage;

if (
  smtPreloadedExtraI18nMerged &&
  (document.readyState === 'interactive' || document.readyState === 'complete')
) {
  smtApplySavedLanguage();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.lang button[data-lang]');
  if (!btn) return;
  smtSetLanguage(btn.dataset.lang);
});

window.addEventListener('DOMContentLoaded', smtApplySavedLanguage);

/* ============================ TRY-A-QUESTION DEMO */

document.addEventListener('click', (e) => {
  const opt = e.target.closest('.qopt');
  if (opt) {
    const card = opt.closest('.qcard');
    if (!card || card.classList.contains('is-answered')) return;
    const correct = opt.dataset.correct === 'true';
    opt.classList.add(correct ? 'is-correct' : 'is-wrong');
    if (!correct) {
      // also mark the correct one
      const right = card.querySelector(".qopt[data-correct='true']");
      if (right) right.classList.add('is-correct');
    }
    card.querySelectorAll('.qopt').forEach((o) => (o.disabled = true));
    card.classList.add('is-answered');
    return;
  }
  if (e.target.closest('#qreset')) {
    const card = document.getElementById('qcard');
    if (!card) return;
    card.classList.remove('is-answered');
    card.querySelectorAll('.qopt').forEach((o) => {
      o.disabled = false;
      o.classList.remove('is-correct', 'is-wrong');
    });
  }
});

/* ============================ ADS + CONSENT */

const SMT_ADS = {
  publisherId: 'ca-pub-2451892671779738',
  autoAds: true,
  slots: {
    inline: '',
    anchor: '',
    practice: '',
    ebook: '',
  },
  scriptLoaded: false,
};

function smtNormalizeConsent(value) {
  return value === 'all' || value === 'min' ? value : null;
}

function smtClearConsent() {
  try {
    localStorage.removeItem('smt_consent');
  } catch {}
}

function smtGetConsent() {
  try {
    const stored = localStorage.getItem('smt_consent');
    const normalized = smtNormalizeConsent(stored);
    if (stored && !normalized) smtClearConsent();
    return normalized;
  } catch {
    return null;
  }
}

function smtSetConsent(v) {
  const normalized = smtNormalizeConsent(v);
  if (!normalized) {
    smtClearConsent();
    return;
  }
  try {
    localStorage.setItem('smt_consent', normalized);
  } catch {}
}

function smtIsRealAdSenseSlotId(slotId) {
  return typeof slotId === 'string' && /^[0-9]{10,}$/.test(slotId) && !/^0+$/.test(slotId);
}

function smtAdSensePublisherIsConfigured() {
  return /^ca-pub-[0-9]{16}$/.test(SMT_ADS.publisherId || '');
}

function smtStaticManualAdsAreConfigured() {
  return (
    smtAdSensePublisherIsConfigured() &&
    smtIsRealAdSenseSlotId(SMT_ADS.slots.inline) &&
    smtIsRealAdSenseSlotId(SMT_ADS.slots.anchor)
  );
}

function smtStaticAdsAreConfigured() {
  return smtStaticManualAdsAreConfigured();
}

function smtAdSenseCanLoad() {
  return (
    smtAdSensePublisherIsConfigured() && (SMT_ADS.autoAds || smtStaticManualAdsAreConfigured())
  );
}

function smtConfigureAdSenseSlots() {
  document.querySelectorAll('ins.adsbygoogle[data-smt-ad-placement]').forEach((el) => {
    const placement = el.getAttribute('data-smt-ad-placement');
    const slotId = SMT_ADS.slots[placement];
    el.setAttribute('data-ad-client', SMT_ADS.publisherId);
    if (!smtIsRealAdSenseSlotId(slotId)) {
      el.removeAttribute('data-ad-slot');
      return;
    }
    el.setAttribute('data-ad-slot', slotId);
  });
}

function smtLoadAdSense() {
  if (SMT_ADS.scriptLoaded) return;
  if (!smtAdSenseCanLoad()) {
    return;
  }
  smtConfigureAdSenseSlots();
  SMT_ADS.scriptLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + SMT_ADS.publisherId;
  document.head.appendChild(s);
  document
    .querySelectorAll('ins.adsbygoogle[data-ad-slot]:not([data-smt-pushed])')
    .forEach((el) => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.setAttribute('data-smt-pushed', '1');
      } catch (e) {}
    });
}

function smtApplyConsent(choice) {
  // 'all' = personalised, 'min' = non-personalised (NPA=1)
  const normalized = smtNormalizeConsent(choice);
  if (!normalized) {
    smtClearConsent();
    smtShowConsent();
    if (window.smtRefreshAds) window.smtRefreshAds();
    return;
  }
  if (!smtAdSenseCanLoad()) {
    smtHideConsent();
    if (window.smtRefreshAds) window.smtRefreshAds();
    return;
  }
  if (normalized === 'all' || normalized === 'min') {
    document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
      if (normalized === 'min') el.setAttribute('data-npa', '1');
      else el.removeAttribute('data-npa');
    });
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = normalized === 'min' ? 1 : 0;
    smtLoadAdSense();
  }
  if (window.smtRefreshAds) window.smtRefreshAds();
}

function smtNotifyConsentVisibility(visible) {
  try {
    document.documentElement.toggleAttribute('data-consent-visible', !!visible);
    window.dispatchEvent(
      new CustomEvent('smt:consentvisibility', { detail: { visible: !!visible } }),
    );
  } catch {}
}
function smtShowConsent() {
  const el = document.getElementById('consent');
  if (el) el.hidden = false;
  smtNotifyConsentVisibility(true);
}
function smtHideConsent() {
  const el = document.getElementById('consent');
  if (el) el.hidden = true;
  smtNotifyConsentVisibility(false);
}

function smtShowAds(mode) {
  // 'none' | 'inline' | 'anchor' | 'both'
  const consent = smtGetConsent();
  const canShowAds = !!consent && smtAdSenseCanLoad();
  let anchorDismissed = false;
  try {
    anchorDismissed = sessionStorage.getItem('smt_anchor_closed') === '1';
  } catch {}
  // In-content rectangle slots: the static landing "inline" slot plus any
  // SPA-injected slots (practice, ebook). Use querySelectorAll so every slot
  // toggles, not just the first match. Per-route visibility is handled by the
  // [data-page] is-active CSS, so off-route slots stay hidden regardless.
  const inContent = document.querySelectorAll('[data-ad-slot]:not([data-ad-slot="anchor"])');
  const anchor = document.querySelector('[data-ad-slot="anchor"]');
  const native = document.querySelectorAll('.list-quiet__ad');
  const showInline = canShowAds && (mode === 'inline' || mode === 'both');
  const showAnchor = canShowAds && !anchorDismissed && (mode === 'anchor' || mode === 'both');
  const showNative = canShowAds && (mode === 'inline' || mode === 'both');
  inContent.forEach((el) => {
    el.hidden = !showInline;
  });
  if (anchor) anchor.hidden = !showAnchor;
  native.forEach((el) => {
    el.hidden = !showNative;
  });
}
window.smtSetAdsMode = (mode) => {
  try {
    localStorage.setItem('smt_ads_mode', mode);
  } catch {}
  smtShowAds(mode);
};
window.smtGetAdsMode = () => {
  try {
    return localStorage.getItem('smt_ads_mode') || 'both';
  } catch {
    return 'both';
  }
};
window.smtRefreshAds = () => smtShowAds(window.smtGetAdsMode());

// Markup for an in-content ad slot, used by SPA-rendered pages (practice, ebook).
// Mirrors the static landing "inline" slot in index.html. Starts hidden; smtShowAds
// reveals it only when consent is given AND a real slot ID is configured for `placement`.
window.smtAdSlotMarkup = (placement) => {
  const p = placement || 'inline';
  return (
    '<aside class="ad-slot ad-slot--inline" data-ad-slot="' +
    p +
    '" hidden>' +
    '<div class="ad-slot__inner">' +
    '<span class="ad-slot__label" data-i18n="ad.label">Sponsored</span>' +
    '<div class="ad-slot__frame">' +
    '<ins class="adsbygoogle" style="display: block; width: 100%; min-height: 120px" ' +
    'data-smt-ad-placement="' +
    p +
    '" data-ad-format="auto" data-full-width-responsive="true"></ins>' +
    '<div class="ad-slot__placeholder" data-i18n="ad.placeholder">' +
    'Ad space reserved while reviewed AdSense slots are configured.</div>' +
    '</div></div></aside>'
  );
};

// Call after injecting smtAdSlotMarkup() into a freshly rendered SPA view.
// Localizes the slot's data-i18n labels, wires real slot IDs (if configured),
// fills any not-yet-pushed <ins> when AdSense is already loaded, and applies visibility.
window.smtMountAds = () => {
  try {
    if (window.applyLang) window.applyLang(localStorage.getItem('smt_lang') || 'en');
  } catch (e) {}
  if (typeof smtConfigureAdSenseSlots === 'function') smtConfigureAdSenseSlots();
  if (SMT_ADS.scriptLoaded) {
    document.querySelectorAll('ins.adsbygoogle:not([data-smt-pushed])').forEach((el) => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.setAttribute('data-smt-pushed', '1');
      } catch (e) {}
    });
  }
  if (window.smtRefreshAds) window.smtRefreshAds();
};

document.addEventListener('click', (e) => {
  if (e.target.closest('#consent-all')) {
    smtSetConsent('all');
    smtHideConsent();
    smtApplyConsent('all');
  } else if (e.target.closest('#consent-min')) {
    smtSetConsent('min');
    smtHideConsent();
    smtApplyConsent('min');
  } else if (e.target.closest('#ad-anchor-close')) {
    try {
      sessionStorage.setItem('smt_anchor_closed', '1');
    } catch {}
    const a = document.querySelector('[data-ad-slot="anchor"]');
    if (a) a.hidden = true;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const c = smtGetConsent();
  if (!c) smtShowConsent();
  else smtApplyConsent(c);
});

/* ============================ PRACTICE QUIZ */

const SMT_FALLBACK_QUESTIONS = [
  {
    chapter: 'Ch. 7 · Nature',
    q: {
      en: 'Which Swedish principle gives everyone the right to walk, swim, and pick berries on most land?',
      sv: 'Vilken svensk princip ger alla rätt att gå, simma och plocka bär på det mesta av marken?',
    },
    opts: [
      { en: 'Jantelagen', sv: 'Jantelagen' },
      { en: 'Allemansrätten', sv: 'Allemansrätten' },
      { en: 'Lagom', sv: 'Lagom' },
      { en: 'Fika', sv: 'Fika' },
    ],
    answer: 1,
    why: {
      en: "Allemansrätten — 'everyone's right' — lets you roam, swim, ski, camp, and forage on most land. The catch: be considerate.",
      sv: "Allemansrätten — 'allas rätt' — låter dig vandra, simma, åka skidor, tälta och plocka bär på det mesta av marken. Haken: var hänsynsfull.",
    },
  },
  {
    chapter: 'Ch. 2 · Government',
    q: { en: "Sweden's parliament is called:", sv: 'Sveriges parlament heter:' },
    opts: [
      { en: 'Folketinget', sv: 'Folketinget' },
      { en: 'Stortinget', sv: 'Stortinget' },
      { en: 'Riksdagen', sv: 'Riksdagen' },
      { en: 'Eduskunta', sv: 'Eduskunta' },
    ],
    answer: 2,
    why: {
      en: "The Riksdag is Sweden's parliament — 349 seats, four-year terms.",
      sv: 'Riksdagen är Sveriges parlament — 349 platser, fyraåriga mandatperioder.',
    },
  },
  {
    chapter: 'Ch. 10 · EU & the world',
    q: {
      en: 'When did Sweden join the European Union?',
      sv: 'När gick Sverige med i Europeiska unionen?',
    },
    opts: [
      { en: '1973', sv: '1973' },
      { en: '1986', sv: '1986' },
      { en: '1995', sv: '1995' },
      { en: '2004', sv: '2004' },
    ],
    answer: 2,
    why: {
      en: 'Sweden joined the EU on January 1, 1995, alongside Austria and Finland.',
      sv: 'Sverige gick med i EU den 1 januari 1995, tillsammans med Österrike och Finland.',
    },
  },
  {
    chapter: 'Ch. 2 · Government',
    q: { en: "Who is Sweden's current head of state?", sv: 'Vem är Sveriges statschef?' },
    opts: [
      { en: 'The Prime Minister', sv: 'Statsministern' },
      { en: 'The President', sv: 'Presidenten' },
      { en: 'The Speaker of the Riksdag', sv: 'Riksdagens talman' },
      { en: 'The King', sv: 'Kungen' },
    ],
    answer: 3,
    why: {
      en: 'Sweden is a constitutional monarchy. The King is head of state with purely ceremonial duties; the Prime Minister leads the government.',
      sv: 'Sverige är en konstitutionell monarki. Kungen är statschef med rent ceremoniella uppgifter; statsministern leder regeringen.',
    },
  },
  {
    chapter: 'Ch. 3 · Rights',
    q: {
      en: 'How many basic laws (grundlagar) does Sweden have?',
      sv: 'Hur många grundlagar har Sverige?',
    },
    opts: [
      { en: 'One', sv: 'En' },
      { en: 'Three', sv: 'Tre' },
      { en: 'Four', sv: 'Fyra' },
      { en: 'Seven', sv: 'Sju' },
    ],
    answer: 2,
    why: {
      en: 'Four: Instrument of Government, Act of Succession, Freedom of the Press Act, Fundamental Law on Freedom of Expression.',
      sv: 'Fyra: regeringsformen, successionsordningen, tryckfrihetsförordningen och yttrandefrihetsgrundlagen.',
    },
  },
  {
    chapter: 'Ch. 9 · Money',
    q: { en: 'The Swedish currency is:', sv: 'Sveriges valuta är:' },
    opts: [
      { en: 'The Euro', sv: 'Euro' },
      { en: 'The Krona', sv: 'Kronan' },
      { en: 'The Mark', sv: 'Mark' },
      { en: 'The Öre', sv: 'Öre' },
    ],
    answer: 1,
    why: {
      en: 'Sweden uses the krona (SEK). 1 krona = 100 öre, though öre coins are no longer in circulation.',
      sv: 'Sverige använder kronan (SEK). 1 krona = 100 öre, men öremynt används inte längre.',
    },
  },
  {
    chapter: 'Ch. 8 · Culture',
    q: { en: "Sweden's national day is:", sv: 'Sveriges nationaldag är:' },
    opts: [
      { en: 'May 1 (Labour Day)', sv: '1 maj (Arbetarrörelsens dag)' },
      { en: 'June 6', sv: '6 juni' },
      { en: 'December 13 (Lucia)', sv: '13 december (Lucia)' },
      { en: 'Midsommar Eve', sv: 'Midsommarafton' },
    ],
    answer: 1,
    why: {
      en: "June 6 marks Gustav Vasa's election as king in 1523 and the 1809 constitution. Public holiday since 2005.",
      sv: 'Den 6 juni markerar Gustav Vasas val till kung 1523 och 1809 års regeringsform. Helgdag sedan 2005.',
    },
  },
  {
    chapter: 'Ch. 10 · EU & the world',
    q: { en: 'Sweden became a member of NATO in:', sv: 'Sverige blev medlem i NATO år:' },
    opts: [
      { en: '1949', sv: '1949' },
      { en: '1995', sv: '1995' },
      { en: '2022', sv: '2022' },
      { en: '2024', sv: '2024' },
    ],
    answer: 3,
    why: {
      en: 'Sweden formally joined NATO on March 7, 2024, ending more than two centuries of military non-alignment.',
      sv: 'Sverige blev formellt NATO-medlem den 7 mars 2024 — slutet på över två sekler av militär alliansfrihet.',
    },
  },
  {
    chapter: 'Ch. 4 · Work & taxes',
    q: { en: 'The Swedish Tax Agency is called:', sv: 'Den svenska skattemyndigheten heter:' },
    opts: [
      { en: 'Skatteverket', sv: 'Skatteverket' },
      { en: 'Försäkringskassan', sv: 'Försäkringskassan' },
      { en: 'Migrationsverket', sv: 'Migrationsverket' },
      { en: 'Arbetsförmedlingen', sv: 'Arbetsförmedlingen' },
    ],
    answer: 0,
    why: {
      en: 'Skatteverket — also handles personnummer (the all-purpose Swedish ID), folkbokföring (residency registration), and ID cards.',
      sv: 'Skatteverket — hanterar också personnummer, folkbokföring och ID-kort.',
    },
  },
  {
    chapter: 'Ch. 8 · Culture',
    q: {
      en: 'Which holiday celebrates the summer solstice in Sweden?',
      sv: 'Vilken högtid firar sommarsolståndet i Sverige?',
    },
    opts: [
      { en: 'Walpurgis Night', sv: 'Valborg' },
      { en: 'Lucia', sv: 'Lucia' },
      { en: 'Midsommar', sv: 'Midsommar' },
      { en: 'Kräftskiva', sv: 'Kräftskiva' },
    ],
    answer: 2,
    why: {
      en: "Midsommar — the Friday between June 19–25. Maypole, herring, snaps, and a flower crown if you're committed.",
      sv: 'Midsommar — fredagen mellan 19–25 juni. Midsommarstång, sill, snaps och blomsterkrans om du satsar.',
    },
  },
];

const SMT_QUIZ_COPY = {
  en: {
    next: 'Next →',
    finish: 'See score →',
    counter: (i, n) => `Question ${i + 1} / ${n}`,
    correct: 'Correct.',
    wrong: 'Not quite.',
    of: 'of',
    scoreEyebrow: 'Practice round complete',
    verdict: (pct) =>
      pct === 100
        ? "Lysande! That's a perfect round."
        : pct >= 80
          ? 'Strong practice round. Keep reviewing the source material before the official test.'
          : pct >= 60
            ? "Decent. A couple more rounds and you've got this."
            : pct >= 40
              ? "Early days — that's fine. Practice again, the wrong ones come back."
              : 'Lots of room to grow. The app does the heavy lifting — give it a try.',
    again: 'Try again',
    cta: 'Get the app',
    correctLabel: 'Correct',
    wrongLabel: 'Wrong',
    scoreLabel: 'Score',
  },
  sv: {
    next: 'Nästa →',
    finish: 'Visa resultat →',
    counter: (i, n) => `Fråga ${i + 1} / ${n}`,
    correct: 'Rätt.',
    wrong: 'Inte riktigt.',
    of: 'av',
    scoreEyebrow: 'Övningsrunda klar',
    verdict: (pct) =>
      pct === 100
        ? 'Lysande! En perfekt runda.'
        : pct >= 80
          ? 'Starkt övningspass. Fortsätt repetera källmaterialet inför det officiella provet.'
          : pct >= 60
            ? 'Hyfsat. Ett par till och du sitter med det.'
            : pct >= 40
              ? 'Tidigt — det är okej. Öva igen, fel-frågorna återkommer.'
              : 'Massor att växa in i. Appen gör det tunga lyftet — testa.',
    again: 'Försök igen',
    cta: 'Hämta appen',
    correctLabel: 'Rätt',
    wrongLabel: 'Fel',
    scoreLabel: 'Poäng',
  },
};

const SMT_QUIZ_BUDDY_COPY = {
  perfect: {
    en: 'Brilliant! 10/10. Tell people I helped.',
    sv: 'Lysande! 10/10. Berätta att jag hjälpte.',
    'zh-Hans': '太棒了！10/10。记得说我帮忙了。',
    'zh-Hant': '太棒了！10/10。記得說我幫忙了。',
    ar: 'رائع! 10/10. أخبرهم أنني ساعدت.',
    ckb: 'ناوازە! 10/10. بە خەڵک بڵێ من یارمەتیم دا.',
    fa: 'درخشان! ۱۰ از ۱۰. به بقیه بگو من کمک کردم.',
    pl: 'Świetnie! 10/10. Powiedz innym, że pomogłem.',
    so: 'Cajiib! 10/10. Dadka u sheeg inaan ku caawiyay.',
    ti: 'ብሉጽ! 10/10። ከም ዝሓገዝኩ ንሰባት ንገሮም።',
    tr: 'Harika! 10/10. Yardım ettiğimi söyle.',
    uk: 'Блискуче! 10/10. Скажи іншим, що я допоміг.',
  },
  streak: {
    en: '{streak} in a row. You are on a roll.',
    sv: '{streak} i rad. Du är på gång.',
    'zh-Hans': '连续 {streak} 题。状态正好。',
    'zh-Hant': '連續 {streak} 題。狀態正好。',
    ar: '{streak} على التوالي. أنت منطلق.',
    ckb: '{streak} لەسەر یەک. تۆ لە ڕێگادایت.',
    fa: '{streak} تا پشت سر هم. روی دور هستی.',
    pl: '{streak} z rzędu. Masz dobrą passę.',
    so: '{streak} isku xigta. Si fiican baad u socotaa.',
    ti: '{streak} ብተኸታታሊ። ጽቡቕ ትኸይድ ኣለኻ።',
    tr: 'Üst üste {streak}. İyi gidiyorsun.',
    uk: '{streak} поспіль. Ти набираєш хід.',
  },
  praise: {
    en: 'Nice one.',
    sv: 'Snyggt.',
    'zh-Hans': '答得好。',
    'zh-Hant': '答得好。',
    ar: 'إجابة جميلة.',
    ckb: 'جوان بوو.',
    fa: 'خوب بود.',
    pl: 'Dobra odpowiedź.',
    so: 'Si fiican.',
    ti: 'ጽቡቕ።',
    tr: 'Güzel cevap.',
    uk: 'Гарна відповідь.',
  },
  wrong: {
    en: "Not this time. You'll see this one again — that's how it sticks.",
    sv: 'Inte den här gången. Du får se den igen — så fastnar den.',
    'zh-Hans': '这次不是。之后还会再看到——这样才记得住。',
    'zh-Hant': '這次不是。之後還會再看到——這樣才記得住。',
    ar: 'ليس هذه المرة. سترى هذا السؤال مرة أخرى — هكذا يثبت في الذاكرة.',
    ckb: 'ئەم جارە نا. دیسان ئەمە دەبینیتەوە — ئاوا لەبیر دەمێنێت.',
    fa: 'این بار نه. دوباره این یکی را می‌بینی — همین‌طور در ذهن می‌ماند.',
    pl: 'Nie tym razem. Zobaczysz to jeszcze raz — tak się utrwala.',
    so: 'Markan ma aha. Mar kale ayaad arki doontaa — sidaas ayay ku xasuusnaanaysaa.',
    ti: 'ኣብዚ ግዜ ኣይኮነን። እዚ እንደገና ክትርእዮ ኢኻ — ከምኡ እዩ ዝጸንዕ።',
    tr: 'Bu kez değil. Bunu tekrar göreceksin — böyle akılda kalır.',
    uk: 'Не цього разу. Ти побачиш це ще раз — так воно запам’ятовується.',
  },
};

function smtQuizBuddyMessage(key, values = {}) {
  const copy = SMT_QUIZ_BUDDY_COPY[key] || SMT_QUIZ_BUDDY_COPY.praise;
  const template = copy[smtQuizCurrentLang()] || copy.en;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}

const SMT_QUIZ = { i: 0, score: 0, answers: [], scope: '' };

function smtQuizCurrentLang() {
  try {
    return localStorage.getItem('smt_lang') || 'en';
  } catch {
    return 'en';
  }
}

function smtQuizChapterLabel(question, lang) {
  const chapterId = Number(question && question.chapterId);
  const meta = Array.isArray(window.SMT_CHAPTERS_META)
    ? window.SMT_CHAPTERS_META.find((chapter) => chapter.id === chapterId)
    : null;
  const title = meta && meta.title && (meta.title[lang] || meta.title.en);
  if (title) return `${meta.emoji || ''} ${title}`.trim();
  return question && question.chapter ? question.chapter : '';
}

function smtQuizEscapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"]/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
      })[c],
  );
}

const SMT_QUIZ_SOURCE_CITATION_COPY = {
  en: { source: 'Source', page: 'p.' },
  sv: { source: 'Källa', page: 's.' },
  'zh-Hans': { source: '来源', page: '页' },
  'zh-Hant': { source: '來源', page: '頁' },
  ar: { source: 'المصدر', page: 'ص.' },
  ckb: { source: 'سەرچاوە', page: 'ل.' },
  fa: { source: 'منبع', page: 'ص.' },
  pl: { source: 'Źródło', page: 's.' },
  so: { source: 'Ilaha', page: 'b.' },
  ti: { source: 'ምንጪ', page: 'ገጽ' },
  tr: { source: 'Kaynak', page: 's.' },
  uk: { source: 'Джерело', page: 'с.' },
};

function smtQuizSourceCitation(question, lang) {
  const source = question && question.source;
  if (!source)
    return smtTr({
      sv: 'Källhänvisning saknas',
      en: 'Source citation unavailable',
      'zh-Hans': '缺少资料来源标注',
      'zh-Hant': '缺少資料來源標註',
      ar: 'لا تتوفر إشارة إلى المصدر',
      ckb: 'ئاماژە بە سەرچاوە بەردەست نییە',
      fa: 'ارجاع به منبع در دسترس نیست',
      pl: 'Brak źródła',
      so: 'Tixraac lama hayo',
      ti: 'ምንጪ የለን',
      tr: 'Kaynak gösterimi yok',
      uk: 'Джерело недоступне',
    });
  const title = source.title || 'Sverige i fokus';
  if (!source.chapter || !source.section || source.page === undefined || source.page === null) {
    return smtTr({
      sv: 'Källhänvisning saknas',
      en: 'Source citation unavailable',
      'zh-Hans': '缺少资料来源标注',
      'zh-Hant': '缺少資料來源標註',
      ar: 'لا تتوفر إشارة إلى المصدر',
      ckb: 'ئاماژە بە سەرچاوە بەردەست نییە',
      fa: 'ارجاع به منبع در دسترس نیست',
      pl: 'Brak źródła',
      so: 'Tixraac lama hayo',
      ti: 'ምንጪ የለን',
      tr: 'Kaynak gösterimi yok',
      uk: 'Джерело недоступне',
    });
  }
  const copy = SMT_QUIZ_SOURCE_CITATION_COPY[lang] || SMT_QUIZ_SOURCE_CITATION_COPY.en;
  const uhrCitation = `${copy.source}: ${title}, ${source.chapter}, ${source.section}, ${copy.page} ${source.page}`;
  const supplementalCitations = Array.isArray(source.supplementalSources)
    ? source.supplementalSources
        .filter((supplementalSource) => supplementalSource && supplementalSource.title)
        .map((supplementalSource) => {
          const published = supplementalSource.publishedDate
            ? lang === 'sv'
              ? `publicerad ${supplementalSource.publishedDate}`
              : `published ${supplementalSource.publishedDate}`
            : '';
          const retrieved = supplementalSource.retrievedDate
            ? lang === 'sv'
              ? `hämtad ${supplementalSource.retrievedDate}`
              : `retrieved ${supplementalSource.retrievedDate}`
            : '';
          return [
            `${copy.source}: ${supplementalSource.title}`,
            supplementalSource.publisher,
            published,
            retrieved,
            supplementalSource.url,
          ]
            .filter(Boolean)
            .join(', ');
        })
    : [];
  return [uhrCitation, ...supplementalCitations].join('; ');
}

function smtQuizQuestionDisclaimer(lang) {
  return smtTr({
    sv: 'Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga.',
    en: 'Independent study practice, not a real exam or an official UHR question.',
    'zh-Hans': '独立练习，并非真正的考试，也不是官方 UHR 试题。',
    'zh-Hant': '獨立練習，並非真正的考試，也不是官方 UHR 試題。',
    ar: 'تدريب مستقل، وليس اختبارًا حقيقيًا ولا سؤالًا رسميًا من UHR.',
    ckb: 'مەشقی سەربەخۆیە، نەک تاقیکردنەوەیەکی ڕاستەقینە یان پرسیارێکی فەرمیی UHR.',
    fa: 'تمرین مستقل است، نه یک آزمون واقعی و نه یک سؤال رسمی UHR.',
    pl: 'Niezależne ćwiczenie, nie prawdziwy egzamin ani oficjalne pytanie UHR.',
    so: "Tababar madaxbannaan, ma aha imtixaan dhab ah ama su'aal rasmi ah oo UHR.",
    ti: 'ናጻ ልምምድ፣ ናይ ሓቂ ፈተና ወይ ወግዓዊ ሕቶ UHR ኣይኮነን።',
    tr: 'Bağımsız alıştırma; gerçek bir sınav veya resmî bir UHR sorusu değildir.',
    uk: 'Незалежне тренування, не справжній іспит і не офіційне питання UHR.',
  });
}

function smtQuizQuestionProvenance(question) {
  const direct = question && question.questionProvenance;
  if (direct === 'uhr' || direct === 'derived' || direct === 'editorial') return direct;
  const tags = Array.isArray(question && question.tags) ? question.tags : [];
  if (tags.includes('editorial')) return 'editorial';
  if (tags.includes('published-variant')) return 'derived';
  return question && question.source ? 'uhr' : 'derived';
}

const SMT_QUIZ_PROVENANCE_COPY = {
  uhr: {
    en: { label: 'UHR', description: "Based on UHR's study material Sverige i fokus." },
    sv: { label: 'UHR', description: 'Baserad på UHR:s studiematerial Sverige i fokus.' },
    'zh-Hans': { label: 'UHR', description: '基于 UHR 的学习材料《Sverige i fokus》。' },
    'zh-Hant': { label: 'UHR', description: '基於 UHR 的學習材料《Sverige i fokus》。' },
    ar: { label: 'UHR', description: 'مبني على مادة UHR الدراسية Sverige i fokus.' },
    ckb: {
      label: 'UHR',
      description: 'پشت بە ماددەی خوێندنی UHR بە ناوی Sverige i fokus دەبەستێت.',
    },
    fa: { label: 'UHR', description: 'بر پایه ماده آموزشی UHR با نام Sverige i fokus.' },
    pl: { label: 'UHR', description: 'Na podstawie materiału UHR Sverige i fokus.' },
    so: {
      label: 'UHR',
      description: 'Waxay ku salaysan tahay agabka waxbarasho ee UHR, Sverige i fokus.',
    },
    ti: { label: 'UHR', description: 'ኣብ ናይ UHR መጽናዕቲ ንብረት Sverige i fokus ዝተመርኮሰ።' },
    tr: { label: 'UHR', description: 'UHR’nin Sverige i fokus çalışma materyaline dayanır.' },
    uk: { label: 'UHR', description: 'На основі навчального матеріалу UHR Sverige i fokus.' },
  },
  derived: {
    en: {
      label: 'Supplementary',
      description: 'Variant of an app-authored, UHR-referenced practice question.',
    },
    sv: {
      label: 'Tillägg',
      description: 'Variant av en appskriven, UHR-hänvisad övningsfråga.',
    },
    'zh-Hans': { label: '补充', description: '由应用编写、带 UHR 引用的练习题变体。' },
    'zh-Hant': { label: '補充', description: '由應用程式撰寫、附 UHR 引用的練習題變體。' },
    ar: { label: 'تكميلي', description: 'صيغة من سؤال تدريبي كتبه التطبيق مع إحالة إلى UHR.' },
    ckb: {
      label: 'تەواوکەر',
      description: 'جۆرێک لە پرسیاری مەشقە کە ئەپەکە نووسیویەتی و ئاماژەی UHRی هەیە.',
    },
    fa: {
      label: 'تکمیلی',
      description: 'گونه‌ای از سؤال تمرینی نوشته‌شده در برنامه با ارجاع به UHR.',
    },
    pl: {
      label: 'Dodatkowe',
      description: 'Wariant pytania ćwiczeniowego napisanego w aplikacji z odwołaniem do UHR.',
    },
    so: {
      label: 'Dheeraad',
      description: "Nooc ka mid ah su'aal tababar oo app-ku qoray, oo leh tixraac UHR.",
    },
    ti: { label: 'ተወሳኺ', description: 'ብመተግበሪ ዝተጻሕፈ፣ ናብ UHR ዝምልከት ናይ ልምምድ ሕቶ ቅያር።' },
    tr: {
      label: 'Ek',
      description: 'UHR atıflı, uygulama tarafından yazılmış alıştırma sorusunun varyantı.',
    },
    uk: {
      label: 'Додаткове',
      description: 'Варіант тренувального питання, написаного в застосунку, з посиланням на UHR.',
    },
  },
  editorial: {
    en: { label: 'Editorial', description: 'Hand-written editorial context.' },
    sv: { label: 'Redaktionell', description: 'Redaktionellt skrivet sammanhang.' },
    'zh-Hans': { label: '编辑', description: '手写的编辑背景说明。' },
    'zh-Hant': { label: '編輯', description: '手寫的編輯背景說明。' },
    ar: { label: 'تحريري', description: 'سياق تحريري مكتوب يدويًا.' },
    ckb: {
      label: 'دەستنووسی دەستکاریکراو',
      description: 'دەقێکی ڕوونکردنەوەی دەستکاری بە دەست نووسراو.',
    },
    fa: { label: 'تحریریه', description: 'زمینه تحریریه‌ای که دستی نوشته شده است.' },
    pl: { label: 'Redakcyjne', description: 'Ręcznie napisany kontekst redakcyjny.' },
    so: { label: 'Tifaftir', description: 'Sharaxaad tifaftir oo gacanta lagu qoray.' },
    ti: { label: 'ኤዲቶርያል', description: 'ብኢድ ዝተጻሕፈ ኤዲቶርያላዊ ኩነታት።' },
    tr: { label: 'Editoryal', description: 'Elle yazılmış editoryal bağlam.' },
    uk: { label: 'Редакційне', description: 'Вручну написаний редакційний контекст.' },
  },
};

function smtQuizProvenanceBadge(question, lang) {
  const provenance = smtQuizQuestionProvenance(question);
  const copy =
    SMT_QUIZ_PROVENANCE_COPY[provenance][lang] || SMT_QUIZ_PROVENANCE_COPY[provenance].en;
  const ariaPrefix = smtTr({
    sv: 'Källtyp',
    en: 'Provenance',
    'zh-Hans': '来源类型',
    'zh-Hant': '來源類型',
    ar: 'نوع المصدر',
    ckb: 'جۆری سەرچاوە',
    fa: 'نوع منبع',
    pl: 'Typ źródła',
    so: 'Nooca ilaha',
    ti: 'ዓይነት ምንጪ',
    tr: 'Kaynak türü',
    uk: 'Тип джерела',
  });
  const notePrefix = smtTr({
    sv: 'Källanteckning',
    en: 'Source note',
    'zh-Hans': '来源备注',
    'zh-Hant': '來源備註',
    ar: 'ملاحظة المصدر',
    ckb: 'تێبینیی سەرچاوە',
    fa: 'یادداشت منبع',
    pl: 'Notatka o źródle',
    so: 'Qoraal ilaha',
    ti: 'መዘክር ምንጪ',
    tr: 'Kaynak notu',
    uk: 'Примітка до джерела',
  });
  const label = smtQuizEscapeHtml(copy.label);
  const note = smtQuizEscapeHtml(
    `${ariaPrefix}: ${copy.label}. ${notePrefix}: ${copy.description}`,
  );
  return `<span class="quiz__provenance quiz__provenance--${provenance}" role="text" aria-label="${note}" title="${note}">${label}</span>`;
}

function smtQuizQuestionSourceRow(question, lang, citationClassName = 'quiz__source') {
  const sourceCitation = smtQuizEscapeHtml(smtQuizSourceCitation(question, lang));
  return `
      <div class="quiz__source-row">
        ${smtQuizProvenanceBadge(question, lang)}
        <p class="${citationClassName}">${sourceCitation}</p>
      </div>
    `;
}

const SMT_QUIZ_MAX_CORRECT_POSITION_SHARE = 0.35;

function smtQuizHashString(value) {
  let hash = 2166136261;
  const text = String(value ?? '');
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function smtQuizSeededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function smtQuizQuestionShuffleKey(question) {
  if (!question) return '';
  if (question.id) return question.id;
  if (question.q && (question.q.en || question.q.sv)) return question.q.en || question.q.sv;
  return JSON.stringify(question.q || question.opts || '');
}

function smtQuizShouldShuffleOptions(question) {
  return (
    question &&
    question.type === 'single_choice' &&
    Array.isArray(question.opts) &&
    question.opts.length > 2
  );
}

function smtQuizOptionDisplayOrder(question, sessionId) {
  const options = Array.isArray(question && question.opts) ? question.opts : [];
  const order = options.map((_, index) => index);
  if (!smtQuizShouldShuffleOptions(question)) return order;

  const seed = smtQuizHashString(
    `${smtQuizQuestionShuffleKey(question)}:${sessionId || 'default'}`,
  );
  const random = smtQuizSeededRandom(seed);
  for (let index = order.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  if (order.every((originalIndex, displayIndex) => originalIndex === displayIndex)) {
    const offset = 1 + (seed % (order.length - 1));
    return order.slice(offset).concat(order.slice(0, offset));
  }

  return order;
}

function smtQuizDisplayOptions(question, sessionId) {
  const options = Array.isArray(question && question.opts) ? question.opts : [];
  return smtQuizOptionDisplayOrder(question, sessionId).map((originalIndex, displayIndex) => ({
    displayIndex,
    originalIndex,
    option: options[originalIndex],
  }));
}

function smtQuizAnswerShuffleSummary(questions, sessionId) {
  const counts = [0, 0, 0, 0];
  let totalQuestions = 0;

  (questions || []).forEach((question) => {
    if (!smtQuizShouldShuffleOptions(question)) return;
    const correctDisplayIndex = smtQuizDisplayOptions(question, sessionId).findIndex(
      (entry) => entry.originalIndex === question.answer,
    );
    if (correctDisplayIndex < 0 || correctDisplayIndex >= counts.length) return;
    counts[correctDisplayIndex]++;
    totalQuestions++;
  });

  const maxCorrectPositionShare = totalQuestions ? Math.max(...counts) / totalQuestions : 0;

  return {
    counts,
    maxCorrectPositionShare,
    maxCorrectPositionShareLimit: SMT_QUIZ_MAX_CORRECT_POSITION_SHARE,
    sessionId,
    totalQuestions,
  };
}

window.smtQuizDisplayOptions = smtQuizDisplayOptions;
window.smtQuizAnswerShuffleSummary = smtQuizAnswerShuffleSummary;

function smtQuizHash() {
  return (location.hash || '#/').replace(/^#/, '');
}

function smtQuizPath() {
  return smtQuizHash().split('?')[0];
}

function smtQuizScopeKey() {
  const hash = smtQuizHash();
  const match = hash.match(/[?&]c=([^&]+)/);
  return match ? 'chapter:' + match[1] : 'all';
}

function smtQuizShouldRender() {
  const hash = smtQuizHash();
  if (smtQuizPath() !== '/practice') return false;
  return /[?&]c=/.test(hash) || typeof window.smtRenderPracticeHub !== 'function';
}

function smtQuizQuestionSet() {
  const filtered =
    typeof window.smtPracticeFilterFor === 'function' ? window.smtPracticeFilterFor() : null;
  if (Array.isArray(filtered)) return filtered;
  if (window.SMT_QUESTIONS && window.SMT_QUESTIONS.length) return window.SMT_QUESTIONS;
  return SMT_FALLBACK_QUESTIONS;
}

function smtQuizRender() {
  const stage = document.getElementById('quiz-stage');
  if (!stage) return;
  const scope = smtQuizScopeKey();
  if (SMT_QUIZ.scope !== scope) {
    SMT_QUIZ.i = 0;
    SMT_QUIZ.score = 0;
    SMT_QUIZ.answers = [];
    SMT_QUIZ.scope = scope;
  }
  const lang = smtQuizCurrentLang();
  const copy = SMT_QUIZ_COPY[lang] || SMT_QUIZ_COPY.en;
  const questions = smtQuizQuestionSet();
  const n = questions.length;

  if (!n) {
    stage.innerHTML = `
      <div class="quiz__card">
        <div class="quiz__crumb">Practice</div>
        <h2 class="quiz__q">${smtTr({ sv: 'Inga frågor hittades.', en: 'No questions found.', 'zh-Hans': '未找到任何题目。', 'zh-Hant': '找不到任何題目。', ar: 'لم يُعثر على أسئلة.', ckb: 'هیچ پرسیارێک نەدۆزرایەوە.', fa: 'هیچ سؤالی یافت نشد.', pl: 'Nie znaleziono pytań.', so: "Su'aalo lama helin.", ti: 'ሕቶታት ኣይተረኽቡን።', tr: 'Soru bulunamadı.', uk: 'Питань не знайдено.' })}</h2>
        <p class="quiz__counter">${smtTr({ sv: 'Välj ett annat kapitel.', en: 'Pick another chapter.', 'zh-Hans': '请选择其他章节。', 'zh-Hant': '請選擇其他章節。', ar: 'اختر فصلًا آخر.', ckb: 'بەشێکی تر هەڵبژێرە.', fa: 'فصل دیگری را انتخاب کنید.', pl: 'Wybierz inny rozdział.', so: 'Dooro cutub kale.', ti: 'ካልእ ምዕራፍ ምረጽ።', tr: 'Başka bir bölüm seçin.', uk: 'Виберіть інший розділ.' })}</p>
      </div>
    `;
    return;
  }

  // result screen
  if (SMT_QUIZ.i >= n) {
    const correct = SMT_QUIZ.score;
    const pct = Math.round((correct / n) * 100);
    stage.innerHTML = `
      <div class="quiz__result">
        <span class="eyebrow">${copy.scoreEyebrow}</span>
        <p class="quiz__score"><span id="score-num">0</span><em>/</em>${n}</p>
        <p class="quiz__verdict">${copy.verdict(pct)}</p>
        <ul class="quiz__breakdown">
          <li><b>${correct}</b> ${copy.correctLabel}</li>
          <li><b>${n - correct}</b> ${copy.wrongLabel}</li>
          <li><b>${pct}%</b> ${copy.scoreLabel}</li>
        </ul>
        <div class="quiz__cta">
          <button class="btn btn--ghost" id="quiz-again">${copy.again} ↻</button>
          <a class="btn btn--gold" href="#/">${copy.cta} ↗</a>
        </div>
      </div>
      ${window.smtAdSlotMarkup ? window.smtAdSlotMarkup('practice') : ''}
    `;
    if (window.smtMountAds) window.smtMountAds();
    // count up + celebrate
    const fx = window.smtFx;
    if (fx) {
      fx.countUp(document.getElementById('score-num'), 0, correct, 1100);
      if (pct === 100) {
        setTimeout(() => fx.rain({ colors: fx.PALETTES.big, count: 120 }), 300);
        if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(smtQuizBuddyMessage('perfect'));
      } else if (pct >= 70) {
        setTimeout(() => fx.rain({ colors: fx.PALETTES.flag, count: 60 }), 300);
      }
    }
    return;
  }

  const q = questions[SMT_QUIZ.i];
  const ans = SMT_QUIZ.answers[SMT_QUIZ.i];
  const answered = ans !== undefined;
  const sessionId = `practice:${scope}`;
  const sourceRow = smtQuizQuestionSourceRow(q, lang);
  const qNavLabel = smtTr({
    sv: 'Fråga',
    en: 'Question',
    'zh-Hans': '题目',
    'zh-Hant': '題目',
    ar: 'سؤال',
    ckb: 'پرسیار',
    fa: 'سؤال',
    pl: 'Pytanie',
    so: "Su'aal",
    ti: 'ሕቶ',
    tr: 'Soru',
    uk: 'Питання',
  });
  const dots = Array.from({ length: n }, (_, k) => {
    const isAnswered = SMT_QUIZ.answers[k] !== undefined;
    const navigable = isAnswered || k === SMT_QUIZ.i;
    let cls = '';
    if (k === SMT_QUIZ.i) cls = 'is-on';
    else if (isAnswered)
      cls = SMT_QUIZ.answers[k] === questions[k].answer ? 'is-right' : 'is-wrong';
    if (navigable) cls += ' is-nav';
    cls = cls.trim();
    if (!navigable) return `<span class="quiz__dot ${cls}"></span>`;
    return `<button type="button" class="quiz__dot ${cls}" data-go="${k}" aria-label="${qNavLabel} ${k + 1}"${k === SMT_QUIZ.i ? ' aria-current="true"' : ''}></button>`;
  }).join('');

  const opts = smtQuizDisplayOptions(q, sessionId)
    .map(({ option: o, originalIndex, displayIndex }) => {
      const letter = String.fromCharCode(65 + displayIndex);
      let cls = '';
      if (answered) {
        if (originalIndex === q.answer) cls = 'is-correct';
        else if (originalIndex === ans) cls = 'is-wrong';
      }
      return `
      <button class="quiz__opt ${cls}" data-i="${originalIndex}" ${answered ? 'disabled' : ''}>
        <span class="key">${letter}</span>
        <span>${o[lang] || o.en}</span>
      </button>`;
    })
    .join('');

  let feedback = '';
  if (answered) {
    const right = ans === q.answer;
    const feedbackSource = smtQuizEscapeHtml(smtQuizSourceCitation(q, lang));
    feedback = `
      <div class="quiz__feedback ${right ? '' : 'is-wrong'}">
        <b>${right ? copy.correct : copy.wrong}</b> ${q.why[lang] || q.why.en}
        <p class="quiz__feedback-source">${feedbackSource}</p>
      </div>
    `;
  }

  const isLast = SMT_QUIZ.i === n - 1;
  const nextLabel = isLast
    ? smtTr({
        sv: 'Visa resultat',
        en: 'See score',
        'zh-Hans': '查看成绩',
        'zh-Hant': '查看成績',
        ar: 'عرض النتيجة',
        ckb: 'بینینی ئەنجام',
        fa: 'مشاهده نتیجه',
        pl: 'Zobacz wynik',
        so: 'Arag natiijada',
        ti: 'ውጽኢት ርአ',
        tr: 'Sonucu gör',
        uk: 'Переглянути результат',
      })
    : smtTr({
        sv: 'Nästa',
        en: 'Next',
        'zh-Hans': '下一题',
        'zh-Hant': '下一題',
        ar: 'التالي',
        ckb: 'دواتر',
        fa: 'بعدی',
        pl: 'Następne',
        so: 'Xiga',
        ti: 'ዝቕጽል',
        tr: 'Sonraki',
        uk: 'Наступне',
      });
  const skipLabel = smtTr({
    sv: 'Hoppa över',
    en: 'Skip',
    'zh-Hans': '跳过',
    'zh-Hant': '跳過',
    ar: 'تخطّي',
    ckb: 'پەڕاندن',
    fa: 'رد کردن',
    pl: 'Pomiń',
    so: 'Ka bood',
    ti: 'ሕለፍ',
    tr: 'Atla',
    uk: 'Пропустити',
  });
  const nextBtn = answered
    ? `<button class="btn btn--gold" id="quiz-next">${nextLabel} →</button>`
    : `<button class="btn btn--ghost" id="quiz-skip">${skipLabel} →</button>`;
  const prevBtn =
    SMT_QUIZ.i > 0
      ? `<button class="btn btn--ghost" id="quiz-prev">← ${smtTr({ sv: 'Föregående', en: 'Previous', 'zh-Hans': '上一题', 'zh-Hant': '上一題', ar: 'السابق', ckb: 'پێشتر', fa: 'قبلی', pl: 'Poprzednie', so: 'Hore', ti: 'ዝሓለፈ', tr: 'Önceki', uk: 'Попереднє' })}</button>`
      : `<span></span>`;
  const screenDisclaimer = smtQuizEscapeHtml(smtQuizQuestionDisclaimer(lang));

  stage.innerHTML = `
    <p class="quiz__screen-disclaimer">${screenDisclaimer}</p>
    <div class="quiz__progress">${dots}</div>
    <div class="quiz__card">
      <div class="quiz__crumb">${smtQuizEscapeHtml(smtQuizChapterLabel(q, lang))}</div>
      <h2 class="quiz__q">${q.q[lang] || q.q.en}</h2>
      ${sourceRow}
      <div class="quiz__opts">${opts}</div>
      ${feedback}
      <div class="quiz__actions">
        ${prevBtn}
        <span class="quiz__counter">${copy.counter(SMT_QUIZ.i, n)}</span>
        ${nextBtn}
      </div>
    </div>
    ${window.smtAdSlotMarkup ? window.smtAdSlotMarkup('practice') : ''}
  `;
  if (window.smtMountAds) window.smtMountAds();
}

function smtQuizReset() {
  SMT_QUIZ.i = 0;
  SMT_QUIZ.score = 0;
  SMT_QUIZ.answers = [];
  smtQuizRender();
}

document.addEventListener('click', (e) => {
  const opt = e.target.closest('#quiz-stage .quiz__opt');
  if (opt && !opt.hasAttribute('disabled')) {
    const k = parseInt(opt.dataset.i, 10);
    const questions = smtQuizQuestionSet();
    const q = questions[SMT_QUIZ.i];
    const correct = k === q.answer;
    SMT_QUIZ.answers[SMT_QUIZ.i] = k;
    if (correct) SMT_QUIZ.score++;
    if (typeof window.smtRecordAnswer === 'function' && q.chapterId) {
      window.smtRecordAnswer(q.chapterId, correct);
    }

    // ---- effects at click location ----
    const r = opt.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const fx = window.smtFx;
    if (correct) {
      if (fx) {
        fx.burst(cx, cy, { colors: fx.PALETTES.win, count: 30 });
        fx.floatPlus(cx, r.top + 10, '+1', '#1e874b');
      }
      // streak detection
      let streak = 0;
      for (let i = SMT_QUIZ.i; i >= 0; i--) {
        if (SMT_QUIZ.answers[i] === questions[i].answer) streak++;
        else break;
      }
      if (streak >= 3 && fx) {
        fx.toast(`🔥 STREAK ×${streak}`, { flavor: 'streak', duration: 1800 });
        fx.burst(cx, cy, { colors: fx.PALETTES.streak, count: 40, spread: 200 });
      }
      if (window.smtBuddyCelebrate) {
        if (streak >= 3) window.smtBuddyCelebrate(smtQuizBuddyMessage('streak', { streak }));
        else window.smtBuddyCelebrate(smtQuizBuddyMessage('praise'));
      }
    } else {
      if (fx) fx.shakeEl(opt);
      if (window.smtBuddyConsole) window.smtBuddyConsole(smtQuizBuddyMessage('wrong'));
    }

    smtQuizRender();

    // pulse correct option subtly after re-render
    if (!correct) {
      requestAnimationFrame(() => {
        const right = document.querySelector('#quiz-stage .quiz__opt.is-correct');
        if (right) right.classList.add('is-pulse');
      });
    }
    return;
  }
  if (e.target.closest('#quiz-next')) {
    SMT_QUIZ.i++;
    smtQuizRender();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (e.target.closest('#quiz-skip')) {
    SMT_QUIZ.i++;
    smtQuizRender();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (e.target.closest('#quiz-prev')) {
    if (SMT_QUIZ.i > 0) {
      SMT_QUIZ.i--;
      smtQuizRender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }
  const quizDot = e.target.closest('#quiz-stage .quiz__dot[data-go]');
  if (quizDot) {
    const k = parseInt(quizDot.dataset.go, 10);
    if (!Number.isNaN(k) && k !== SMT_QUIZ.i) {
      SMT_QUIZ.i = k;
      smtQuizRender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }
  if (e.target.closest('#quiz-again')) {
    smtQuizReset();
    return;
  }
});

// Re-render on route change to /practice, and on language change
window.addEventListener('hashchange', () => {
  if (smtQuizShouldRender()) smtQuizRender();
});
window.addEventListener('DOMContentLoaded', () => {
  if (smtQuizShouldRender()) smtQuizRender();
});
window.addEventListener('smt:languagechange', () => {
  if (smtQuizShouldRender()) smtQuizRender();
});
document.addEventListener('click', (e) => {
  if (e.target.closest('.lang button[data-lang]')) {
    // applyLang already runs; re-render the quiz if visible
    setTimeout(() => {
      if (smtQuizShouldRender()) smtQuizRender();
    }, 0);
  }
});

// ---- Topbar language picker dropdown ------------------------------------
function smtInitLangPicker() {
  const btn = document.getElementById('lang-open');
  const menu = document.getElementById('lang-menu');
  if (!btn || !menu) return;
  function close() {
    menu.hidden = true;
    if (typeof btn.setAttribute === 'function') btn.setAttribute('aria-expanded', 'false');
  }
  function open() {
    menu.hidden = false;
    if (typeof btn.setAttribute === 'function') btn.setAttribute('aria-expanded', 'true');
    const cur = (function () {
      try {
        return localStorage.getItem('smt_lang') || 'en';
      } catch {
        return 'en';
      }
    })();
    menu.querySelectorAll('button[data-lang]').forEach(function (b) {
      const on = b.dataset.lang === cur;
      b.classList.toggle('is-on', on);
      if (typeof b.setAttribute === 'function')
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.hidden) open();
    else close();
  });
  menu.addEventListener('click', function (e) {
    const b = e.target.closest('button[data-lang]');
    if (!b) return;
    const lang = b.dataset.lang;
    if (window.smtSetLanguage) {
      window.smtSetLanguage(lang);
    } else if (window.applyLang) {
      window.applyLang(lang);
    } else {
      try {
        localStorage.setItem('smt_lang', lang);
      } catch {}
      location.reload();
    }
    close();
  });
  document.addEventListener('click', function (e) {
    if (menu.hidden) return;
    if (e.target === btn || (typeof btn.contains === 'function' && btn.contains(e.target))) return;
    if (typeof menu.contains === 'function' && menu.contains(e.target)) return;
    close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', smtInitLangPicker);
} else {
  smtInitLangPicker();
}
