const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { assertStaticToastCallSitesSafe } = require('./static-toast-callsite-guard');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function createEbookToolsHarness() {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const elementsById = new Map();
  const storageValues = new Map();
  const querySelectors = [];
  const appended = [];
  const selectionState = {
    anchorInsideReader: true,
    isCollapsed: false,
  };

  function makeElement(tagName) {
    const selectors = new Map();
    const attributes = new Map();
    const element = {
      tagName,
      attributes,
      children: [],
      className: '',
      dataset: {},
      hidden: false,
      id: '',
      style: {},
      textContent: '',
      value: '',
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      appendChild(child) {
        this.children.push(child);
        return child;
      },
      focus() {},
      querySelector(selector) {
        return selectors.get(selector) ?? null;
      },
      set innerHTML(value) {
        this._innerHTML = String(value);
        selectors.clear();
        if (this._innerHTML.includes('eb-pop__btn')) {
          const highlightButton = makeElement('button');
          const noteButton = makeElement('button');
          const highlightLabel = makeElement('span');
          const noteLabel = makeElement('span');
          selectors.set('[data-act="hl"]', highlightButton);
          selectors.set('[data-act="note"]', noteButton);
          selectors.set('.eb-pop__lbl', highlightLabel);
          selectors.set('.eb-pop__lbl-note', noteLabel);
        }
        if (this._innerHTML.includes('eb-note__head')) {
          const closeButton = makeElement('button');
          const deleteButton = makeElement('button');
          const quote = makeElement('span');
          const saveButton = makeElement('button');
          const textarea = makeElement('textarea');
          selectors.set('.eb-note__close', closeButton);
          selectors.set('.eb-note__del', deleteButton);
          selectors.set('.eb-note__quote', quote);
          selectors.set('.eb-note__save', saveButton);
          selectors.set('.eb-note__ta', textarea);
        }
      },
      get innerHTML() {
        return this._innerHTML ?? '';
      },
    };
    return element;
  }

  const reader = makeElement('section');
  reader.innerText = 'viktig text for the ebook reader';
  reader.contains = () => selectionState.anchorInsideReader;
  elementsById.set('ebook-reader', reader);

  const notesHost = makeElement('section');
  notesHost.id = 'eb-notes-list';
  elementsById.set('eb-notes-list', notesHost);

  const mark = makeElement('mark');
  mark.dataset.hlId = 'h1';
  mark.getBoundingClientRect = () => ({ bottom: 80, left: 24 });
  mark.classList = { add() {}, remove() {} };
  mark.closest = (selector) => (selector === 'mark.eb-hl' ? mark : null);
  mark.scrollIntoView = () => {};

  const localStorage = {
    getItem(key) {
      return storageValues.has(key) ? storageValues.get(key) : null;
    },
    setItem(key, value) {
      storageValues.set(key, String(value));
    },
  };

  const context = {
    console,
    document: {
      body: {
        appendChild(element) {
          appended.push(element);
          if (element.id) elementsById.set(element.id, element);
          return element;
        },
      },
      addEventListener(type, listener) {
        documentListeners.set(type, listener);
      },
      createElement: makeElement,
      getElementById(id) {
        return elementsById.get(id) ?? null;
      },
      querySelector(selector) {
        querySelectors.push(selector);
        return selector.startsWith('mark.eb-hl') ? mark : null;
      },
    },
    localStorage,
    location: { hash: '#/ebook?c=intro' },
    setTimeout(callback) {
      callback();
      return 0;
    },
    window: {
      addEventListener(type, listener) {
        windowListeners.set(type, listener);
      },
      getSelection() {
        return {
          anchorNode: {},
          isCollapsed: selectionState.isCollapsed,
          getRangeAt() {
            return {
              getBoundingClientRect() {
                return { left: 40, top: 100, width: 80 };
              },
            };
          },
        };
      },
      innerWidth: 390,
      localStorage,
      location: { hash: '#/ebook?c=intro' },
      scrollX: 0,
      scrollY: 0,
    },
  };
  context.globalThis = context;
  context.window.location = context.location;

  vm.runInNewContext(read('site/ebook-tools.js'), context, {
    filename: 'site/ebook-tools.js',
  });

  return {
    appended,
    context,
    documentListeners,
    localStorage,
    notesHost,
    querySelectors,
    selectionState,
    windowListeners,
  };
}

test('static site optional account surface keeps ebook highlights account-free', () => {
  const index = read('site/index.html');
  const app = read('site/app.js');
  const ebookTools = read('site/ebook-tools.js');
  const purchase = read('site/purchase.js');
  const signin = read('site/signin.js');
  const v11 = read('site/v11.js');
  const staticSurface = `${index}\n${app}\n${signin}`;

  assert.match(index, /id="signin-open"/);
  assert.match(index, /id="signin-modal"/);
  assert.match(index, /<script src="signin\.js"><\/script>/);
  assert.match(staticSurface, /Continue with Google|Forts[aä]tt med Google/i);
  assert.match(staticSurface, /Continue with Apple|Forts[aä]tt med Apple/i);
  assert.match(staticSurface, /Email me a magic link|Mejla mig en magisk l[aä]nk/i);
  assert.match(app, /Core study works without sign-in, and your progress lives on your device/);
  assert.match(app, /Signing in is optional, but it unlocks more/);
  assert.match(app, /Your study progress, answers, mistakes, and settings stay local/);
  assert.match(app, /Dina studieframsteg, svar, misstag och inställningar sparas lokalt/);

  assert.match(index, /window\.SMT_SITE_ORIGIN = 'https:\/\/almostswedish\.se'/);
  assert.match(
    index,
    /window\.SMT_SUPABASE_URL\s*=\s*\n\s*window\.SMT_SUPABASE_URL \|\| 'https:\/\/uesfowwijbdlffyweyum\.supabase\.co'/,
  );
  assert.match(
    index,
    /window\.SMT_SUPABASE_ANON_KEY\s*=\s*\n\s*window\.SMT_SUPABASE_ANON_KEY \|\| 'sb_publishable_/,
  );
  assert.doesNotMatch(index, /intentionally LEFT EMPTY|leave EMPTY|no CDN is contacted/i);
  assert.doesNotMatch(index, /<script[^>]+supabase-js/i);

  assert.match(signin, /function\s+isConfigured\(\)/);
  assert.match(signin, /if\s*\(!isConfigured\(\)\)\s+return Promise\.resolve\(null\)/);
  assert.match(signin, /import\('https:\/\/esm\.sh\/@supabase\/supabase-js@2'\)/);
  assert.match(signin, /function\s+hasSigninCallbackInLocation\(\)/);
  assert.match(signin, /search\.has\('code'\)/);
  assert.match(signin, /params\.has\('access_token'\)\s*&&\s*params\.has\('refresh_token'\)/);
  assert.match(signin, /if \(!hasSigninCallbackInLocation\(\) && !signedIn\(\)\) return;/);
  assert.match(
    signin,
    /if\s*\(!isConfigured\(\)\)\s+return;[\s\S]*clearConfiguredLocalDemoSession\(\);[\s\S]*getClient\(\)\.then/,
  );
  assert.match(signin, /window\.smtOpenSignin = open/);
  assert.match(signin, /window\.smtIsSignedIn = signedIn/);
  assert.match(signin, /signin\.unavailable/);
  assert.match(signin, /function\s+failClosedAuth\b/);
  assert.match(signin, /if\s*\(!client\)\s*\{\s*failClosedAuth\(\);/);
  assert.match(signin, /\.catch\(\(err\) => failClosedAuth\(err\)\)/);
  assert.match(signin, /accountId === 'local-demo'/);
  assert.match(signin, /localStorage\.removeItem\('smt_signed_in'\)/);
  assert.doesNotMatch(signin, /Supabase load failed; using local stub/);
  assert.doesNotMatch(signin, /if\s*\(!client\)\s*\{\s*stubSignIn\(\);/);

  assert.match(purchase, /account\.id === 'local-demo'/);
  assert.match(purchase, /function\s+isRealPurchaseAccount\b/);
  assert.match(purchase, /account\.id !== 'local-demo'/);
  assert.match(purchase, /purchase\.status\.realSignin/);
  assert.match(purchase, /window\.smtOpenSignin\(\)/);
  assert.match(v11, /accountId !== 'local-demo'/);

  assert.doesNotMatch(ebookTools, /isSignedIn|showSigninNudge|data-act="signin"/);
  assert.doesNotMatch(ebookTools, /Sign in to (?:sync|highlight)|Logga in för att markera/i);
});

test('ebook highlights and notes stay local without account prompts', () => {
  const index = read('site/index.html');
  const ebookTools = read('site/ebook-tools.js');

  assert.match(
    index,
    /Highlights and notes stay in this browser and work locally without sign-in\./,
  );
  assert.match(ebookTools, /localStorage\.setItem\(\s*['"]smt_hl_['"]\s*\+/);
  assert.match(ebookTools, /function showPopForSelection\(\)/);
  assert.match(ebookTools, /function schedulePopForSelection\(\)/);
  assert.match(ebookTools, /document\.addEventListener\('keyup'/);
  assert.match(ebookTools, /document\.addEventListener\('selectionchange'/);
  assert.doesNotMatch(ebookTools, /isSignedIn|showSigninNudge|data-act="signin"/);
});

test('ebook annotation popover is reachable after keyboard text selection', () => {
  const harness = createEbookToolsHarness();

  harness.documentListeners.get('keyup')({ target: { closest: () => null } });
  const popover = harness.appended.find((element) => element.className === 'eb-pop');
  assert.ok(popover, 'keyboard selection should create the annotation popover');
  assert.equal(popover.hidden, false);
  assert.equal(popover.querySelector('[data-act="hl"]').getAttribute('aria-label'), 'Highlight');
  assert.equal(popover.querySelector('[data-act="note"]').getAttribute('aria-label'), 'Add note');

  harness.selectionState.isCollapsed = true;
  harness.documentListeners.get('selectionchange')();
  assert.equal(popover.hidden, true, 'collapsed keyboard selection should hide the popover');

  harness.selectionState.isCollapsed = false;
  harness.selectionState.anchorInsideReader = false;
  harness.documentListeners.get('keyup')({ target: { closest: () => null } });
  assert.equal(popover.hidden, true, 'selection outside the reader should not show the popover');
});

test('static toast helper keeps account and study messages text-safe by default', () => {
  const fx = read('site/fx.js');
  const calls = assertStaticToastCallSitesSafe();

  assert.match(fx, /t\.textContent\s*=\s*String\(msg \?\? ''\)/);
  assert.doesNotMatch(fx, /t\.innerHTML\s*=\s*msg/);
  assert.equal(calls.length, 18);
});

test('ebook highlight and note controls expose localized accessible names', () => {
  const ebookTools = read('site/ebook-tools.js');

  assert.doesNotMatch(ebookTools, /(?:title|aria-label)=['"](?:Highlight|Add note|Close)['"]/);
  assert.doesNotMatch(ebookTools, /<button class=['"]eb-note__del['"]>Delete<\/button>/);
  assert.doesNotMatch(ebookTools, /<button class=['"]eb-note__save[^'"]*['"][^>]*>Save<\/button>/);
  assert.match(ebookTools, /addNote:\s*['"]Lägg till anteckning['"]/);
  assert.match(ebookTools, /remove:\s*['"]Ta bort markering['"]/);
  assert.match(
    ebookTools,
    /localizeButton\(panel\.querySelector\((['"])\.eb-note__close\1\), c\.close\)/,
  );

  const harness = createEbookToolsHarness();
  harness.localStorage.setItem('smt_lang', 'sv');
  harness.localStorage.setItem(
    'smt_hl_intro',
    JSON.stringify([{ id: 'h1', text: 'viktig text', before: '', after: '', note: 'egen notis' }]),
  );

  harness.documentListeners.get('mouseup')({ target: { closest: () => null } });
  const popover = harness.appended.find((element) => element.className === 'eb-pop');
  const highlightButton = popover.querySelector('[data-act="hl"]');
  const noteButton = popover.querySelector('[data-act="note"]');
  assert.equal(highlightButton.getAttribute('aria-label'), 'Markera');
  assert.equal(highlightButton.title, 'Markera');
  assert.equal(popover.querySelector('.eb-pop__lbl').textContent, 'Markera');
  assert.equal(noteButton.getAttribute('aria-label'), 'Lägg till anteckning');
  assert.equal(noteButton.title, 'Lägg till anteckning');
  assert.equal(popover.querySelector('.eb-pop__lbl-note').textContent, 'Anteckna');

  harness.documentListeners.get('click')({
    target: {
      closest: (selector) => (selector === 'mark.eb-hl' ? { dataset: { hlId: 'h1' } } : null),
    },
  });
  const notePanel = harness.context.document.getElementById('eb-note');
  assert.equal(notePanel.querySelector('.eb-note__close').getAttribute('aria-label'), 'Stäng');
  assert.equal(notePanel.querySelector('.eb-note__close').title, 'Stäng');
  assert.equal(notePanel.querySelector('.eb-note__del').getAttribute('aria-label'), 'Radera');
  assert.equal(notePanel.querySelector('.eb-note__del').title, 'Radera');
  assert.equal(notePanel.querySelector('.eb-note__del').textContent, 'Radera');
  assert.equal(notePanel.querySelector('.eb-note__save').getAttribute('aria-label'), 'Spara');
  assert.equal(notePanel.querySelector('.eb-note__save').title, 'Spara');
  assert.equal(notePanel.querySelector('.eb-note__save').textContent, 'Spara');
  assert.equal(
    notePanel.querySelector('.eb-note__ta').getAttribute('aria-label'),
    'Anteckningstext',
  );
  assert.equal(notePanel.querySelector('.eb-note__ta').placeholder, 'Skriv din anteckning...');

  harness.windowListeners.get('hashchange')();
  assert.match(harness.notesHost.innerHTML, /aria-label="Redigera"/);
  assert.match(harness.notesHost.innerHTML, /title="Hitta markering"/);
  assert.match(harness.notesHost.innerHTML, /aria-label="Ta bort markering"/);
  assert.doesNotMatch(
    harness.notesHost.innerHTML,
    /aria-label="(?:Edit|Find highlight|Remove highlight)"/,
  );

  harness.localStorage.setItem('smt_lang', 'en');
  harness.documentListeners.get('mouseup')({ target: { closest: () => null } });
  assert.equal(highlightButton.getAttribute('aria-label'), 'Highlight');
  assert.equal(noteButton.getAttribute('aria-label'), 'Add note');
});

test('ebook malformed highlight storage hydrates to a safe empty notes list', () => {
  const malformedStorageValues = [
    '"not an array"',
    '{"length":1}',
    '42',
    'null',
    JSON.stringify([
      null,
      [],
      { id: '', text: 'viktig text', before: '', after: '', note: '' },
      { id: 'h1', text: '', before: '', after: '', note: '' },
      { id: 'h2', text: 'x'.repeat(501), before: '', after: '', note: '' },
      { id: 'h3', text: 'viktig text', before: '', after: '', note: 'x'.repeat(2001) },
      { id: 'h4', text: 'viktig text', before: {}, after: '', note: '' },
    ]),
  ];

  for (const storedValue of malformedStorageValues) {
    const harness = createEbookToolsHarness();
    harness.localStorage.setItem('smt_hl_intro', storedValue);

    assert.doesNotThrow(() => harness.context.window.smtApplyEbookHighlights());
    assert.match(
      harness.notesHost.innerHTML,
      /No highlights yet\. Select text to mark it\./,
      `malformed storage should render an empty note list for ${storedValue}`,
    );
    assert.doesNotMatch(harness.notesHost.innerHTML, /eb-notes-item/);
  }
});

test('ebook highlight storage drops unsupported rows while preserving valid local records', () => {
  const harness = createEbookToolsHarness();
  const overlongAnchor = 'a'.repeat(121);
  const unsafeId = 'h1"][autofocus][data-extra="x';

  harness.localStorage.setItem(
    'smt_hl_intro',
    JSON.stringify([
      { id: '', text: 'viktig text', before: '', after: '', note: '' },
      { id: 'h-missing-text', before: '', after: '', note: '' },
      { id: 'h-overlong-anchor', text: 'viktig text', before: overlongAnchor, after: '', note: '' },
      {
        id: unsafeId,
        text: 'viktig text',
        before: '',
        after: '',
        note: 'egen notis',
      },
    ]),
  );

  harness.windowListeners.get('hashchange')();

  assert.match(harness.notesHost.innerHTML, /data-hl-id="h1&quot;\]\[autofocus\]/);
  assert.match(harness.notesHost.innerHTML, /viktig text/);
  assert.match(harness.notesHost.innerHTML, /egen notis/);
  assert.doesNotMatch(harness.notesHost.innerHTML, /h-missing-text/);
  assert.doesNotMatch(harness.notesHost.innerHTML, /h-overlong-anchor/);
});

test('ebook highlight ids are escaped before note rendering and selector lookup', () => {
  const harness = createEbookToolsHarness();
  const unsafeId = 'h1"][autofocus][data-extra="x';
  const rawSelector = `mark.eb-hl[data-hl-id="${unsafeId}"]`;

  harness.localStorage.setItem(
    'smt_hl_intro',
    JSON.stringify([
      {
        id: unsafeId,
        text: '<img src=x onerror=alert(1)>',
        before: '',
        after: '',
        note: '<svg onload=alert(1)>',
      },
    ]),
  );

  harness.windowListeners.get('hashchange')();

  assert.match(harness.notesHost.innerHTML, /data-hl-id="h1&quot;\]\[autofocus\]/);
  assert.doesNotMatch(harness.notesHost.innerHTML, /data-hl-id="h1"\]\[autofocus\]/);
  assert.match(harness.notesHost.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(harness.notesHost.innerHTML, /&lt;svg onload=alert\(1\)&gt;/);

  const notesListEvent = (act) => ({
    target: {
      closest(selector) {
        if (selector === '.eb-notes-item') return { dataset: { hlId: unsafeId } };
        if (selector === 'button') return { dataset: { act } };
        return null;
      },
    },
  });

  harness.documentListeners.get('click')(notesListEvent('goto'));
  harness.documentListeners.get('click')(notesListEvent('edit'));

  const highlightSelectors = harness.querySelectors.filter((selector) =>
    selector.startsWith('mark.eb-hl'),
  );
  assert.equal(highlightSelectors.includes(rawSelector), false);
  assert.ok(
    highlightSelectors.every((selector) => selector.includes('\\"')),
    `highlight selectors should escape quotes: ${highlightSelectors.join(' | ')}`,
  );
});
