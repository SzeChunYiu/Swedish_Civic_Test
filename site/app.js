/* ------------------------------------------------------------------
   Almost Swedish — site behaviour
   - hash routing (/, /privacy, /support, /terms, /sources)
   - language toggle (EN/SV) with localStorage persistence
   - try-a-question demo card
------------------------------------------------------------------ */

/* ============================ ROUTING */

function route() {
  const hash = (location.hash || '#/').replace(/^#/, '');
  // strip fragment after slash route
  const [pathRaw] = hash.split('?');
  let path = pathRaw.startsWith('/') ? pathRaw : '/';
  // map unknown paths to /
  const known = ['/', '/practice', '/mock', '/ebook', '/privacy', '/support', '/terms', '/sources'];
  if (!known.includes(path)) path = '/';

  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.page === path);
  });
  document.querySelectorAll('.nav a[data-route]').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.route === path && path !== '/');
  });

  // scroll to top on page change (but allow in-page anchors like #try)
  if (!hash.includes('#') || hash === '#/') {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  // if there's an inner-page anchor like "/privacy#p3", scroll to it
  const innerAnchor = pathRaw.match(/#(.+)$/);
  smtSetMobileNav(false);
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);

function smtMobileNavLabel(open) {
  const sv = document.documentElement.lang === 'sv';
  if (open) return sv ? 'Stäng navigering' : 'Close navigation';
  return sv ? 'Öppna navigering' : 'Open navigation';
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
    'nav.home': 'Home',
    'nav.practice': 'Practice',
    'nav.mock': 'Mock exam',
    'nav.ebook': 'Ebook',
    'nav.support': 'Support',
    'nav.privacy': 'Privacy',
    'nav.terms': 'Terms',
    'nav.sources': 'Sources',
    'nav.cta': 'Get the app ↗',

    'hero.eyebrow': 'Unofficial · Free MVP · Source-backed questions',
    'hero.h1a': 'Study the material.',
    'hero.h1b': 'Practice with sources.',
    'hero.h1c': 'Feel calmer on exam day.',
    'hero.lede':
      "A friendly, unofficial study app for Sweden's medborgarskapsprov. Bite-sized chapters, smart practice, and a mock exam that feels less scary than small talk with your neighbour.",
    'hero.cta1': "Start studying — it's free",
    'hero.cta2': 'Try a question',
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
    'demo.h1': 'No textbooks.',
    'demo.h2': 'Just clicks.',
    'demo.deck':
      'Every question comes with a plain-language explanation and a link to the source. Get it wrong? It quietly shows up again later. Get it right? Move on, pour another coffee.',
    'demo.li1': '<b>Spaced repetition</b> resurfaces tricky questions on the right day.',
    'demo.li2': '<b>Plain-language explanations</b> — no legalese, no jargon-jungle.',
    'demo.li3': '<b>Mock exam mode</b> with real timing, so test day feels familiar.',

    'qcard.chip': 'Chapter 3 · Q47',
    'qcard.q':
      'Which Swedish principle gives everyone the right to walk, swim, and pick berries on most land in nature?',
    'qcard.a': 'Jantelagen — the law of staying humble',
    'qcard.b': 'Allemansrätten — the right of public access',
    'qcard.c': 'Lagom — the doctrine of just-enough',
    'qcard.d': 'Fika — the constitutional coffee break',
    'qcard.ex.b': 'Allemansrätten',
    'qcard.ex.p':
      " — \"everyone's right\" — lets you walk, swim, ski, camp, and forage on most land in Sweden. The catch: be careful, considerate, and don't pitch a tent in someone's flowerbed.",
    'qcard.src': 'Source · § Grundlagarna',
    'qcard.again': 'Try again →',

    'numbers.1': 'questions sourced from public records',
    'numbers.2': 'chapters covering history, society & rights',
    'numbers.3': 'daily — a fika-sized study habit',
    'numbers.4': 'to start. No login. Study progress stays local.',

    'chap.eyebrow': "What's inside",
    'chap.h1': 'From kanelbullar to',
    'chap.h2': 'Karl XIV Johan.',
    'chap.deck':
      "Compact chapters, sized so you can finish one between trams. Each one mixes the official material with the kind of context you'd actually get from a Swedish friend over coffee.",

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
      'Timed full-length exams that look and feel like the real thing. Plus a what-to-bring list.',
    'chap.12.m2': '60 min each',
    'chap.13.t': 'Traditions, holidays & everyday culture',

    'how.eyebrow': 'How it works',
    'how.h1': 'Study lagom.',
    'how.h2': 'Study smart.',
    'how.deck':
      'Three modes, one app. Use them in any order — most people end up cycling through all three the week before the exam.',
    'how.s1.t': 'Learn — short chapters',
    'how.s1.p':
      'Read a 5-minute explainer, then a tiny quiz. Like having a patient Swedish friend who actually finishes their sentences.',
    'how.s2.t': 'Practice — smart drills',
    'how.s2.p':
      "Mistakes resurface on the right day. You'll be surprised how quickly Riksdagen stops sounding like furniture.",
    'how.s3.t': 'Mock exam — full timing',
    'how.s3.p':
      'Run the real format under real timing. Test day becomes Tuesday with a worse chair.',

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
      'No. The MVP needs zero registration. No email, no phone number, no awkward profile photo from 2017. Progress lives on your device.',
    'faq.4.q': 'Is it free?',
    'faq.4.a':
      'Free to start, free to study, and free to take mock exams. Ads help keep the core app available; Remove Ads is an optional one-time 29 SEK purchase that removes ads.',
    'faq.5.q': 'Does it work in Swedish too?',
    'faq.5.a':
      "Yes. Toggle the EN / SV switch in the nav, or change it inside the app. Many learners use both at once — read the question in Swedish, peek at the English when you're stuck.",
    'faq.6.q': 'Is my data shared with anyone?',
    'faq.6.a':
      "Your study progress, answers, mistakes, and settings stay local. Google Mobile Ads (AdMob) in the app can process ad and consent signals. The website's Google AdSense slots stay disabled until reviewed web slot IDs are configured, and ads never receive your study answers or progress.",

    'doc.back': '← Back to home',

    'privacy.kicker': 'Privacy policy',
    'privacy.h1a': 'Your data',
    'privacy.h1b': 'stays on your phone.',
    'privacy.lede':
      "Almost Swedish is an independent study app. We don't ask for an account, and study progress stays local. This page explains the Google AdSense-ready web ad slots, Google Mobile Ads app ads, and optional one-time Remove Ads purchase.",
    'privacy.meta1.b': 'Effective',
    'privacy.meta1.v': '2026-05-15',
    'privacy.meta2.b': 'Version',
    'privacy.meta2.v': '1.0 MVP',
    'privacy.meta3.b': 'Reading time',
    'privacy.meta3.v': '~3 min',
    'privacy.toc': 'In this policy',
    'privacy.s1.t': 'Independence',
    'privacy.s1.p':
      'Almost Swedish is an independent study app for Swedish civic knowledge practice. It is not official and is not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. Anything you read here represents what <em>this app</em> does — nothing more.',
    'privacy.s2.t': 'No account required',
    'privacy.s2.p':
      "The MVP requires no account, email address, phone number, or profile registration. You open the app, you study, you close the app. That's the deal.",
    'privacy.s3.t': 'Local study progress',
    'privacy.s3.p':
      'Study progress, settings, mistakes, XP, streaks, badges, bookmarks, and audio preferences are stored locally on your device. They never leave it. If you uninstall the app, that data is gone — fair warning.',
    'privacy.s4.t': 'Current data-collection posture',
    'privacy.s4.callout.b': 'In plain Swedish:',
    'privacy.s4.callout.p':
      'study progress and answers stay local; ad systems do not receive them.',
    'privacy.s4.p':
      'We do not run account profiles or send study answers, mistakes, progress, settings, XP, streaks, badges, bookmarks, or audio preferences to ad providers. Google ad systems may process ad and consent signals as described below.',
    'privacy.s5.t': 'Ads and purchases',
    'privacy.s5.p':
      "This website has Google AdSense-ready ad slots, but they stay disabled until reviewed slot IDs are configured. The mobile app uses Google Mobile Ads (AdMob) behind Google's consent flow. Remove Ads is an optional one-time 29 SEK purchase that removes ads. Ads help fund the free study experience, and ads never collect study answers or progress.",
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
      'The current question bank is written from UHR\'s public study material <em>Sverige i fokus</em>, and every question shows its section and page citation. Humans miss things. If you find an error, the <a href="#/support">support page</a> is the fastest fix.',
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
      "The current question bank cites UHR's public study material <em>Sverige i fokus</em>. We don't list other source families until questions backed by them actually ship.",
    'sources.meta1.b': 'Primary source',
    'sources.meta1.v': '1',
    'sources.meta2.b': 'Last review',
    'sources.meta2.v': '2026-05',
    'sources.meta3.b': 'Current bank',
    'sources.meta3.v': 'Sverige i fokus',
    'sources.toc': 'Source checks',
    'sources.s1.t': 'Current question source',
    'sources.s1.li1':
      '<b>UHR — Sverige i fokus</b> — public study material for the Swedish citizenship test.',
    'sources.s1.li2':
      'Every shipped question cites a chapter, section, and page from this material.',
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
    'sources.s4.li1': 'The bank is UHR-only today, based on <em>Sverige i fokus</em>.',
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
    'footer.brag2': 'Study smart.',
    'footer.h.app': 'The app',
    'footer.app.1': 'Why it exists',
    'footer.app.2': 'Try a question',
    'footer.app.3': 'Chapters',
    'footer.app.4': 'Mock exam',
    'footer.app.5': 'Roadmap',
    'footer.h.legal': 'Fine print',
    'footer.about.p':
      "An independent study tool, built by people who've taken the test themselves. Free to start, study, and take mock exams.",
    'footer.h.honest': 'Honest disclaimer',
    'footer.honest.p':
      'Unofficial. Independent. Not affiliated with UHR, Skolverket, Migrationsverket, or the Swedish government. We just really like helping people study.',
    'footer.copyright': '© 2026 Almost Swedish. Made with kanelbullar in Stockholm.',
    'footer.fika': 'Lagom built. Fika tested.',

    'ad.label': 'Sponsored',
    'ad.placeholder': 'Ad space reserved while reviewed AdSense slots are configured.',
    'ad.anchor.placeholder': 'Ad space reserved.',
    'ad.native.placeholder': 'Native sponsored row',
    'a11y.settings.open': 'Settings',
    'a11y.close': 'Close',
    'a11y.ad.close': 'Close ad',
    'a11y.studyBuddy': 'Study buddy',
    'practice.kicker': 'Practice round',
    'practice.title': 'Ten questions.',
    'practice.subtitle': 'No pressure.',
    'consent.title': 'Cookies, lagom-style.',
    'consent.body':
      'When web ad slots are enabled, Google AdSense can set cookies and may use them for ad personalisation. Accept all, accept only what\'s needed, or read the <a href="#/privacy">privacy page</a>.',
    'consent.min': 'Necessary only',
    'consent.all': 'Accept all',

    'privacy.s5.web.t': 'Ads on this website',
    'privacy.s5.web.p':
      'This website is prepared for <b>Google AdSense</b>, but the static build does not load AdSense until reviewed web slot IDs are configured. When enabled, AdSense and its partners may set cookies on your device and use them to personalise ads, measure performance, and detect fraud. We load AdSense according to your cookie choice: <em>Accept all</em> allows personalised ads, while <em>Necessary only</em> keeps ads non-personalised. You can change your choice by clearing site data for this domain.',
    'privacy.s5.app.t': 'Ads in the mobile app',
    'privacy.s5.app.p':
      "The mobile app uses <b>Google Mobile Ads (AdMob)</b>. On first launch the app shows Google's official consent screen (via the <em>User Messaging Platform</em> SDK), where you can pick personalised, non-personalised, or — in regions where the choice is available — opt out. Ads keep the app free. We never use ads to collect your study answers or progress.",
  },

  sv: {
    brand: 'Almost Swedish',
    'nav.home': 'Hem',
    'nav.practice': 'Öva',
    'nav.mock': 'Övningsprov',
    'nav.ebook': 'E-bok',
    'nav.support': 'Support',
    'nav.privacy': 'Integritet',
    'nav.terms': 'Villkor',
    'nav.sources': 'Källor',
    'nav.cta': 'Hämta appen ↗',

    'hero.eyebrow': 'Inofficiell · Gratis MVP · Källstödda frågor',
    'hero.h1a': 'Plugga materialet.',
    'hero.h1b': 'Öva med källor.',
    'hero.h1c': 'Känn dig lugnare på provdagen.',
    'hero.lede':
      'En vänlig, inofficiell studieapp för Sveriges medborgarskapsprov. Lagom korta kapitel, smart övning och ett tidsatt övningsprov som känns mindre läskigt än småprat med grannen.',
    'hero.cta1': 'Börja plugga — det är gratis',
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
    'demo.h1': 'Inga läroböcker.',
    'demo.h2': 'Bara klick.',
    'demo.deck':
      'Varje fråga har en förklaring på begriplig svenska och en länk till källan. Fel svar? Den dyker upp igen senare, i lugn och ro. Rätt svar? Gå vidare, häll upp ett kaffe till.',
    'demo.li1': '<b>Spaced repetition</b> tar fram svåra frågor på rätt dag.',
    'demo.li2': '<b>Begripliga förklaringar</b> — ingen juridiska, ingen byråkratdjungel.',
    'demo.li3': '<b>Provläge</b> med riktig tidsbegränsning, så provdagen känns bekant.',

    'qcard.chip': 'Kapitel 3 · F47',
    'qcard.q':
      'Vilken svensk princip ger alla rätt att gå, simma och plocka bär på det mesta av Sveriges mark?',
    'qcard.a': 'Jantelagen — lagen om att vara lagom',
    'qcard.b': 'Allemansrätten — rätten till naturen',
    'qcard.c': 'Lagom — läran om att inte överdriva',
    'qcard.d': 'Fika — den grundlagsskyddade kafferasten',
    'qcard.ex.b': 'Allemansrätten',
    'qcard.ex.p':
      ' — "allas rätt" — låter dig gå, simma, åka skidor, tälta och plocka bär på det mesta av Sveriges mark. Haken: var försiktig, hänsynsfull, och slå inte upp tältet i någons rabatt.',
    'qcard.src': 'Källa · § Grundlagarna',
    'qcard.again': 'Försök igen →',

    'numbers.1': 'frågor från offentliga källor',
    'numbers.2': 'kapitel om historia, samhälle & rättigheter',
    'numbers.3': 'om dagen — en fika-stor studievana',
    'numbers.4': 'att börja. Ingen inloggning. Studieframsteg stannar lokalt.',

    'chap.eyebrow': 'Vad ingår',
    'chap.h1': 'Från kanelbullar till',
    'chap.h2': 'Karl XIV Johan.',
    'chap.deck':
      'Korta kapitel, lagom stora så du hinner ett mellan spårvagnarna. Varje kapitel blandar det officiella materialet med den sortens sammanhang du faktiskt skulle få av en svensk vän över kaffe.',

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
    'how.h2': 'Plugga smart.',
    'how.deck':
      'Tre lägen, en app. Använd i valfri ordning — de flesta cyklar genom alla tre veckan innan provet.',
    'how.s1.t': 'Lär — korta kapitel',
    'how.s1.p':
      'Läs en 5-minuters förklaring, gör sedan ett litet quiz. Som att ha en tålmodig svensk vän som faktiskt avslutar sina meningar.',
    'how.s2.t': 'Öva — smarta drills',
    'how.s2.p':
      'Misstag dyker upp igen på rätt dag. Du kommer bli förvånad över hur snabbt Riksdagen slutar låta som möbler.',
    'how.s3.t': 'Provläge — riktig timing',
    'how.s3.p': 'Kör riktigt format med riktig tid. Provdagen blir en tisdag med sämre stol.',

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
      'Nej. MVP:n kräver ingen registrering. Ingen e-post, inget telefonnummer, ingen pinsam profilbild från 2017. Dina framsteg sparas på enheten.',
    'faq.4.q': 'Är den gratis?',
    'faq.4.a':
      'Gratis att börja, plugga och göra övningsprov. Annonser hjälper oss hålla kärnfunktionerna tillgängliga; Ta bort annonser är ett valfritt engångsköp på 29 SEK som tar bort annonser.',
    'faq.5.q': 'Fungerar den på svenska också?',
    'faq.5.a':
      'Ja. Växla med EN / SV-knappen i menyn, eller byt inne i appen. Många använder båda samtidigt — läs frågan på svenska, kika på engelska när det kör ihop sig.',
    'faq.6.q': 'Delas mina data med någon?',
    'faq.6.a':
      'Dina studieframsteg, svar, misstag och inställningar sparas lokalt. Google Mobile Ads (AdMob) i appen kan behandla annons- och samtyckessignaler. Webbplatsens Google AdSense-ytor är avstängda tills granskade webbplats-ID:n är konfigurerade, och annonser får aldrig dina studiesvar eller framsteg.',

    'doc.back': '← Tillbaka till hem',

    'privacy.kicker': 'Integritetspolicy',
    'privacy.h1a': 'Dina data',
    'privacy.h1b': 'stannar i telefonen.',
    'privacy.lede':
      'Almost Swedish är en fristående studieapp. Vi ber inte om konto, och studieframsteg stannar lokalt. Den här sidan förklarar webbens Google AdSense-förberedda annonsytor, Google Mobile Ads i appen och det valfria engångsköpet Ta bort annonser.',
    'privacy.meta1.b': 'Gäller från',
    'privacy.meta1.v': '2026-05-15',
    'privacy.meta2.b': 'Version',
    'privacy.meta2.v': '1.0 MVP',
    'privacy.meta3.b': 'Lästid',
    'privacy.meta3.v': '~3 min',
    'privacy.toc': 'I denna policy',
    'privacy.s1.t': 'Oberoende',
    'privacy.s1.p':
      'Almost Swedish är en fristående studieapp för övning av svensk samhällskunskap. Den är inte officiell och inte kopplad till UHR, Skolverket, Migrationsverket eller svenska staten. Allt du läser här gäller bara vad <em>denna app</em> gör — inget mer.',
    'privacy.s2.t': 'Inget konto krävs',
    'privacy.s2.p':
      'MVP:n kräver inget konto, ingen e-post, inget telefonnummer och ingen profilregistrering. Du öppnar appen, pluggar, stänger appen. Det är avtalet.',
    'privacy.s3.t': 'Lokala studieframsteg',
    'privacy.s3.p':
      'Framsteg, inställningar, misstag, XP, studiesviter, märken, bokmärken och ljudpreferenser lagras lokalt på din enhet. De lämnar den aldrig. Avinstallerar du appen är de borta — bra att veta.',
    'privacy.s4.t': 'Nuvarande datahantering',
    'privacy.s4.callout.b': 'På klarspråk:',
    'privacy.s4.callout.p': 'studieframsteg och svar stannar lokalt; annonssystem får inte dem.',
    'privacy.s4.p':
      'Vi kör inga kontoprofiler och skickar inte studiesvar, misstag, framsteg, inställningar, XP, studiesviter, märken, bokmärken eller ljudpreferenser till annonsleverantörer. Googles annonssystem kan behandla annons- och samtyckessignaler enligt beskrivningen nedan.',
    'privacy.s5.t': 'Annonser och köp',
    'privacy.s5.p':
      'Den här webbplatsen har Google AdSense-förberedda annonsytor, men de är avstängda tills granskade plats-ID:n är konfigurerade. Mobilappen använder Google Mobile Ads (AdMob) bakom Googles samtyckesflöde. Ta bort annonser är ett valfritt engångsköp på 29 SEK som tar bort annonser. Annonser hjälper till att finansiera den kostnadsfria studieupplevelsen, och annonser samlar aldrig in dina studiesvar eller framsteg.',
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
      'Den nuvarande frågebanken bygger på UHR:s offentliga studiematerial <em>Sverige i fokus</em>, och varje fråga visar avsnitt och sidangivelse. Människor missar saker. Hittar du fel är <a href="#/support">supportsidan</a> snabbaste vägen.',
    'terms.s4.t': 'Inga garantier',
    'terms.s4.p':
      'Vi garanterar inte att du klarar det officiella provet. Vi garanterar inte att appen funkar perfekt på varje enhet varje dag. Vi garanterar att vi fortsätter försöka.',
    'terms.s5.t': 'Ansvar',
    'terms.s5.callout':
      '<b>Kort version:</b> appen tillhandahålls "i befintligt skick" enligt vad som tillåts av svensk lag. Vi är inte ansvariga för missade deadlines, avslagna ansökningar, fika-skador eller beslut som en myndighet tar i ditt ärende.',
    'terms.s6.t': 'Ändringar',
    'terms.s6.p':
      'Om villkoren ändras väsentligt uppdateras datumet ovan och appen visar en notis vid nästa start. Fortsatt användning innebär att du godkänner de nya villkoren.',

    'sources.kicker': 'Källor & metod',
    'sources.h1a': 'Var svaren',
    'sources.h1b': 'faktiskt kommer ifrån.',
    'sources.lede':
      'Den nuvarande frågebanken hänvisar till UHR:s offentliga studiematerial <em>Sverige i fokus</em>. Vi listar inte andra källfamiljer förrän frågor med den källan faktiskt finns i banken.',
    'sources.meta1.b': 'Primär källa',
    'sources.meta1.v': '1',
    'sources.meta2.b': 'Senaste översyn',
    'sources.meta2.v': '2026-05',
    'sources.meta3.b': 'Nuvarande bank',
    'sources.meta3.v': 'Sverige i fokus',
    'sources.toc': 'Källkontroller',
    'sources.s1.t': 'Nuvarande frågekälla',
    'sources.s1.li1':
      '<b>UHR — Sverige i fokus</b> — offentligt studiematerial för medborgarskapsprovet.',
    'sources.s1.li2': 'Varje publicerad fråga anger kapitel, avsnitt och sida från materialet.',
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
    'sources.s4.li1': 'Frågebanken är UHR-only i dag och bygger på <em>Sverige i fokus</em>.',
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
    'footer.brag2': 'Plugga smart.',
    'footer.h.app': 'Appen',
    'footer.app.1': 'Varför den finns',
    'footer.app.2': 'Testa en fråga',
    'footer.app.3': 'Kapitel',
    'footer.app.4': 'Övningsprov',
    'footer.app.5': 'Roadmap',
    'footer.h.legal': 'Finstilta',
    'footer.about.p':
      'Ett fristående studieverktyg byggt av personer som själva har gjort provet. Gratis att börja, plugga och göra övningsprov.',
    'footer.h.honest': 'Ärlig friskrivning',
    'footer.honest.p':
      'Inofficiell. Fristående. Inte kopplad till UHR, Skolverket, Migrationsverket eller svenska staten. Vi gillar bara verkligen att hjälpa folk plugga.',
    'footer.copyright': '© 2026 Almost Swedish. Gjort med kanelbullar i Stockholm.',
    'footer.fika': 'Lagom byggt. Fika-testat.',

    'ad.label': 'Annons',
    'ad.placeholder': 'Annonsyta reserverad medan granskade AdSense-platser konfigureras.',
    'ad.anchor.placeholder': 'Annonsyta reserverad.',
    'ad.native.placeholder': 'Sponsrad rad',
    'a11y.settings.open': 'Inställningar',
    'a11y.close': 'Stäng',
    'a11y.ad.close': 'Stäng annons',
    'a11y.studyBuddy': 'Studiekompis',
    'practice.kicker': 'Övningsrunda',
    'practice.title': 'Tio frågor.',
    'practice.subtitle': 'Ingen press.',
    'consent.title': 'Cookies, på lagom-vis.',
    'consent.body':
      'När webbannonser är aktiverade kan Google AdSense sätta cookies och använda dem för personalisering. Godkänn allt, bara det nödvändiga, eller läs <a href="#/privacy">integritetssidan</a>.',
    'consent.min': 'Bara nödvändiga',
    'consent.all': 'Godkänn allt',

    'privacy.s5.web.t': 'Annonser på webbplatsen',
    'privacy.s5.web.p':
      'Den här webbplatsen är förberedd för <b>Google AdSense</b>, men den statiska versionen laddar inte AdSense förrän granskade webbplats-ID:n är konfigurerade. När funktionen är aktiverad kan AdSense och dess partner sätta cookies på din enhet och använda dem för personalisering, mätning och bedrägeridetektering. Vi laddar AdSense enligt ditt cookieval: <em>Godkänn allt</em> tillåter personaliserade annonser, medan <em>Bara nödvändiga</em> håller annonserna icke-personaliserade. Du kan ändra valet genom att tömma platsdata för domänen.',
    'privacy.s5.app.t': 'Annonser i mobilappen',
    'privacy.s5.app.p':
      'Mobilappen använder <b>Google Mobile Ads (AdMob)</b>. Vid första start visar appen Googles officiella samtyckesskärm (via <em>User Messaging Platform</em>-SDK:n) där du kan välja personaliserat, icke-personaliserat eller — där det går — avstå. Annonser håller appen gratis. Vi använder aldrig annonser för att samla in dina studiesvar eller framsteg.',
  },
});

function smtChapterQuestionCountLabel(chapterNumber, lang) {
  const chapterId = Number(chapterNumber);
  const chapters = Array.isArray(window.SMT_CHAPTERS_META) ? window.SMT_CHAPTERS_META : [];
  const chapter = chapters.find((entry) => Number(entry && entry.id) === chapterId);
  const count = Number(chapter && chapter.questionCount);
  if (!Number.isInteger(chapterId) || !Number.isInteger(count) || count < 0) return undefined;
  return lang === 'sv' ? `${count} frågor` : `${count} questions`;
}
window.smtChapterQuestionCountLabel = smtChapterQuestionCountLabel;

function smtDynamicI18nValue(key, lang) {
  const chapterQuestionCountMatch = key.match(/^chap\.(\d+)\.m1$/);
  if (chapterQuestionCountMatch) {
    return smtChapterQuestionCountLabel(chapterQuestionCountMatch[1], lang);
  }
  return undefined;
}

function smtI18nValue(key, lang) {
  const dynamicValue = smtDynamicI18nValue(key, lang);
  if (dynamicValue !== undefined) return dynamicValue;
  const dict = i18n[lang] || i18n.en;
  if (dict && dict[key] !== undefined) return dict[key];
  return i18n.en && i18n.en[key];
}
window.smtI18nValue = smtI18nValue;

function smtStaticControlLabel(key, lang) {
  return smtI18nValue(key, lang || document.documentElement.lang || 'en') || '';
}
window.smtStaticControlLabel = smtStaticControlLabel;

function smtUpdateStaticControlLabels(lang) {
  const activeLang = lang || document.documentElement.lang || 'en';
  document.querySelectorAll('[data-a11y-label]').forEach((el) => {
    const key = el.dataset && el.dataset.a11yLabel;
    const value = key ? smtStaticControlLabel(key, activeLang) : '';
    if (!value || typeof el.setAttribute !== 'function') return;
    el.setAttribute('aria-label', value);
  });
}
window.smtUpdateStaticControlLabels = smtUpdateStaticControlLabels;

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = smtI18nValue(key, lang);
    if (value === undefined) return;
    // some strings have HTML (em, b, a) — preserve via innerHTML
    el.innerHTML = value;
  });
  document.querySelectorAll('.lang button[data-lang]').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.lang === lang);
  });
  smtUpdateStaticControlLabels(lang);
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
  const nextLang = i18n[lang] ? lang : 'en';
  applyLang(nextLang);
  smtEmitLanguageChange(nextLang);
}
window.smtSetLanguage = smtSetLanguage;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.lang button[data-lang]');
  if (!btn) return;
  smtSetLanguage(btn.dataset.lang);
});

window.addEventListener('DOMContentLoaded', () => {
  let saved = 'en';
  try {
    saved = localStorage.getItem('smt_lang') || 'en';
  } catch {}
  applyLang(saved);
});

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
  slots: {
    inline: '',
    anchor: '',
  },
  scriptLoaded: false,
};

function smtIsRealAdSenseSlotId(slotId) {
  const value = String(slotId || '').trim();
  return /^[0-9]{8,}$/.test(value) && !/^0+$/.test(value);
}

function smtGetConfiguredAdSenseSlots() {
  const publisherReady = /^ca-pub-[0-9]{16}$/.test(SMT_ADS.publisherId);
  const requiredPlacements = ['inline', 'anchor'];
  if (!publisherReady) return null;
  const configured = requiredPlacements.map((placement) => [placement, SMT_ADS.slots?.[placement]]);
  if (configured.some(([, slotId]) => !smtIsRealAdSenseSlotId(slotId))) return null;
  return Object.fromEntries(configured);
}

function smtStaticAdsAreConfigured() {
  return !!smtGetConfiguredAdSenseSlots();
}

function smtSyncAdSenseSlots(configuredSlots) {
  document.querySelectorAll('ins.adsbygoogle[data-smt-ad-placement]').forEach((el) => {
    const slotId = configuredSlots[el.getAttribute('data-smt-ad-placement')];
    if (!slotId) return;
    el.setAttribute('data-ad-client', SMT_ADS.publisherId);
    el.setAttribute('data-ad-slot', slotId);
  });
}

function smtGetConsent() {
  try {
    return localStorage.getItem('smt_consent');
  } catch {
    return null;
  }
}
function smtSetConsent(v) {
  try {
    localStorage.setItem('smt_consent', v);
  } catch {}
}

function smtLoadAdSense() {
  if (SMT_ADS.scriptLoaded) return;
  const configuredSlots = smtGetConfiguredAdSenseSlots();
  if (!configuredSlots) {
    // Keep static web ads disabled until reviewed web slot IDs are configured.
    return;
  }
  smtSyncAdSenseSlots(configuredSlots);
  SMT_ADS.scriptLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + SMT_ADS.publisherId;
  document.head.appendChild(s);
  document.querySelectorAll('ins.adsbygoogle').forEach(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  });
}

function smtApplyConsent(choice) {
  // 'all' = personalised, 'min' = non-personalised (NPA=1)
  if (choice === 'all' || choice === 'min') {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = choice === 'min' ? 1 : 0;
    document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
      if (choice === 'min') el.setAttribute('data-npa', '1');
      else el.removeAttribute('data-npa');
    });
    smtLoadAdSense();
  }
  if (window.smtRefreshAds) window.smtRefreshAds();
}

function smtShowConsent() {
  const el = document.getElementById('consent');
  if (el) el.hidden = false;
}
function smtHideConsent() {
  const el = document.getElementById('consent');
  if (el) el.hidden = true;
}

function smtShowAds(mode) {
  // 'none' | 'inline' | 'anchor' | 'both'
  const consent = smtGetConsent();
  let anchorDismissed = false;
  try {
    anchorDismissed = sessionStorage.getItem('smt_anchor_closed') === '1';
  } catch {}
  const inline = document.querySelector('[data-ad-slot="inline"]');
  const anchor = document.querySelector('[data-ad-slot="anchor"]');
  const native = document.querySelectorAll('.list-quiet__ad');
  const adsConfigured = smtStaticAdsAreConfigured();
  const showInline = adsConfigured && !!consent && (mode === 'inline' || mode === 'both');
  const showAnchor =
    adsConfigured && !!consent && !anchorDismissed && (mode === 'anchor' || mode === 'both');
  const showNative = adsConfigured && !!consent && (mode === 'inline' || mode === 'both');
  if (inline) inline.hidden = !showInline;
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
  if (!smtStaticAdsAreConfigured()) {
    smtHideConsent();
    smtShowAds('none');
    return;
  }
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
          ? "Strong. You're almost ready for the real thing."
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
          ? 'Starkt. Nästan redo för det riktiga.'
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

const SMT_QUIZ = { i: 0, score: 0, answers: [], scope: '' };

function smtQuizCurrentLang() {
  try {
    return localStorage.getItem('smt_lang') || 'en';
  } catch {
    return 'en';
  }
}

function smtQuizFxPrefersReducedMotion(fx) {
  return !!(fx && typeof fx.prefersReducedMotion === 'function' && fx.prefersReducedMotion());
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

function smtQuizSourceCitation(question, lang) {
  const source = question && question.source;
  if (!source) return lang === 'sv' ? 'Källhänvisning saknas' : 'Source citation unavailable';
  const title = source.title || 'Sverige i fokus';
  if (!source.chapter || !source.section || source.page === undefined || source.page === null) {
    return lang === 'sv' ? 'Källhänvisning saknas' : 'Source citation unavailable';
  }
  return lang === 'sv'
    ? `Källa: ${title}, ${source.chapter}, ${source.section}, s. ${source.page}`
    : `Source: ${title}, ${source.chapter}, ${source.section}, p. ${source.page}`;
}

function smtQuizQuestionDisclaimer(lang) {
  return lang === 'sv'
    ? 'Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga.'
    : 'Independent study practice, not a real exam or an official UHR question.';
}

const SMT_QUIZ_PROVENANCE_COPY = {
  uhr: {
    en: { label: 'UHR', description: "Directly from UHR's study material Sverige i fokus." },
    sv: { label: 'UHR', description: 'Direkt från UHR:s utbildningsmaterial Sverige i fokus.' },
  },
  derived: {
    en: { label: 'Supplementary', description: 'Variant generated from a UHR question.' },
    sv: { label: 'Tillägg', description: 'Variant som genererats från en UHR-fråga.' },
  },
  editorial: {
    en: { label: 'Editorial', description: 'Hand-written editorial context.' },
    sv: { label: 'Redaktionell', description: 'Redaktionellt skrivet sammanhang.' },
  },
};

function smtQuizQuestionProvenance(question) {
  const direct = question && question.questionProvenance;
  if (direct === 'uhr' || direct === 'derived' || direct === 'editorial') return direct;
  const tags = Array.isArray(question && question.tags) ? question.tags : [];
  if (tags.includes('editorial')) return 'editorial';
  if (tags.includes('published-variant')) return 'derived';
  return 'uhr';
}

function smtQuizProvenanceBadge(question, lang) {
  const provenance = smtQuizQuestionProvenance(question);
  const copy =
    SMT_QUIZ_PROVENANCE_COPY[provenance][lang] || SMT_QUIZ_PROVENANCE_COPY[provenance].en;
  const ariaPrefix = lang === 'sv' ? 'Källtyp' : 'Provenance';
  const notePrefix = lang === 'sv' ? 'Källanteckning' : 'Source note';
  const label = smtQuizEscapeHtml(copy.label);
  const note = smtQuizEscapeHtml(
    `${ariaPrefix}: ${copy.label}. ${notePrefix}: ${copy.description}`,
  );
  return `<span class="quiz__provenance quiz__provenance--${provenance}" role="text" aria-label="${note}" title="${note}">${label}</span>`;
}

function smtQuizSourceRow(question, lang, citationClassName = 'quiz__source') {
  const citation = smtQuizEscapeHtml(smtQuizSourceCitation(question, lang));
  return `
    <div class="quiz__source-row">
      ${smtQuizProvenanceBadge(question, lang)}
      <p class="${citationClassName}">${citation}</p>
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
  if (filtered && filtered.length) return filtered;
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
        <h2 class="quiz__q">${lang === 'sv' ? 'Inga frågor hittades.' : 'No questions found.'}</h2>
        <p class="quiz__counter">${lang === 'sv' ? 'Välj ett annat kapitel.' : 'Pick another chapter.'}</p>
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
    `;
    // count up + celebrate
    const fx = window.smtFx;
    if (fx) {
      fx.countUp(document.getElementById('score-num'), 0, correct, 1100);
      if (pct === 100) {
        if (!smtQuizFxPrefersReducedMotion(fx)) {
          setTimeout(() => fx.rain({ colors: fx.PALETTES.big, count: 120 }), 300);
        }
        if (window.smtBuddyCelebrate)
          window.smtBuddyCelebrate(
            'Lysande! 10/10. Tell people I helped.',
            'Lysande! 10/10. Berätta att jag hjälpte.',
          );
      } else if (pct >= 70) {
        if (!smtQuizFxPrefersReducedMotion(fx)) {
          setTimeout(() => fx.rain({ colors: fx.PALETTES.flag, count: 60 }), 300);
        }
      }
    }
    return;
  }

  const q = questions[SMT_QUIZ.i];
  const ans = SMT_QUIZ.answers[SMT_QUIZ.i];
  const answered = ans !== undefined;
  const sessionId = `practice:${scope}`;
  const sourceRow = smtQuizSourceRow(q, lang);
  const dots = Array.from({ length: n }, (_, k) => {
    let cls = '';
    if (k < SMT_QUIZ.i) cls = SMT_QUIZ.answers[k] === questions[k].answer ? 'is-right' : 'is-wrong';
    else if (k === SMT_QUIZ.i) cls = 'is-on';
    return `<span class="quiz__dot ${cls}"></span>`;
  }).join('');

  const opts = smtQuizDisplayOptions(q, sessionId)
    .map(({ option: o, originalIndex, displayIndex }) => {
      const letter = String.fromCharCode(65 + displayIndex);
      const optionText = smtQuizEscapeHtml(o[lang] || o.en);
      let cls = '';
      if (answered) {
        if (originalIndex === q.answer) cls = 'is-correct';
        else if (originalIndex === ans) cls = 'is-wrong';
      }
      return `
      <button class="quiz__opt ${cls}" data-i="${originalIndex}" ${answered ? 'disabled' : ''}>
        <span class="key">${letter}</span>
        <span>${optionText}</span>
      </button>`;
    })
    .join('');

  let feedback = '';
  if (answered) {
    const right = ans === q.answer;
    const feedbackDisclaimer = smtQuizEscapeHtml(smtQuizQuestionDisclaimer(lang));
    const explanation = smtQuizEscapeHtml(q.why[lang] || q.why.en);
    feedback = `
      <div class="quiz__feedback ${right ? '' : 'is-wrong'}">
        <b>${right ? copy.correct : copy.wrong}</b> ${explanation}
        ${smtQuizSourceRow(q, lang, 'quiz__feedback-source')}
        <p class="quiz__feedback-disclaimer">${feedbackDisclaimer}</p>
      </div>
    `;
  }

  const isLast = SMT_QUIZ.i === n - 1;
  const nextLabel = isLast ? copy.finish : copy.next;
  const nextBtn = answered
    ? `<button class="btn btn--gold" id="quiz-next">${nextLabel}</button>`
    : `<span></span>`;

  stage.innerHTML = `
    <div class="quiz__progress">${dots}</div>
    <div class="quiz__card">
      <div class="quiz__crumb">${smtQuizEscapeHtml(q.chapter)}</div>
      <h2 class="quiz__q">${smtQuizEscapeHtml(q.q[lang] || q.q.en)}</h2>
      ${sourceRow}
      <div class="quiz__opts">${opts}</div>
      ${feedback}
      <div class="quiz__actions">
        <span class="quiz__counter">${copy.counter(SMT_QUIZ.i, n)}</span>
        ${nextBtn}
      </div>
    </div>
  `;
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
        if (streak >= 3)
          window.smtBuddyCelebrate(
            `${streak} in a row. Du är på gång.`,
            `${streak} i rad. Du är på gång.`,
          );
        else
          window.smtBuddyCelebrate(
            ['Bra!', 'Nice one.', 'Snyggt.', 'Spot on.'][Math.floor(Math.random() * 4)],
            ['Bra!', 'Snyggt.', 'Just det.'][Math.floor(Math.random() * 3)],
          );
      }
    } else {
      if (fx) fx.shakeEl(opt);
      if (window.smtBuddyConsole)
        window.smtBuddyConsole(
          "Not this time. You'll see this one again — that's how it sticks.",
          'Inte den här gången. Du får se den igen — så fastnar den.',
        );
    }

    smtQuizRender();

    // pulse correct option subtly after re-render
    if (!correct && !smtQuizFxPrefersReducedMotion(fx)) {
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
