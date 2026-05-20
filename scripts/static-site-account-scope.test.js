const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function createEbookToolsHarness() {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const elementsById = new Map();
  const storageValues = new Map();
  const appended = [];

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
  reader.contains = () => true;
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
          isCollapsed: false,
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

  return { appended, context, documentListeners, localStorage, notesHost, windowListeners };
}

test('static site exposes no reachable sign-in, OAuth, or magic-link surface', () => {
  const index = read('site/index.html');
  const app = read('site/app.js');
  const extras = read('site/i18n-extras.js');
  const styles = read('site/styles.css');
  const ebookTools = read('site/ebook-tools.js');

  const staticSurface = [index, app, extras, styles, ebookTools].join('\n');

  assert.doesNotMatch(index, /id="signin-open"|id="signin-modal"|signin\.js/);
  assert.doesNotMatch(staticSurface, /Continue with Google|Continue with Apple|Send magic link/i);
  assert.doesNotMatch(staticSurface, /smtOpenSignin|smt_signed_in|signin__/);
  assert.doesNotMatch(staticSurface, /Sign in to (?:sync|highlight)|Logga in for att markera/i);
});

test('ebook highlights and notes stay local without account prompts', () => {
  const index = read('site/index.html');
  const ebookTools = read('site/ebook-tools.js');

  assert.match(index, /Highlights and notes stay in this browser\. No account is needed\./);
  assert.match(ebookTools, /localStorage\.setItem\("smt_hl_"/);
  assert.match(ebookTools, /function showPopForSelection\(\)/);
  assert.doesNotMatch(ebookTools, /isSignedIn|showSigninNudge|data-act="signin"/);
});

test('ebook highlight and note controls expose localized accessible names', () => {
  const ebookTools = read('site/ebook-tools.js');

  assert.doesNotMatch(ebookTools, /title="Highlight"|title="Add note"|aria-label="Close"/);
  assert.doesNotMatch(ebookTools, /<button class="eb-note__del">Delete<\/button>/);
  assert.doesNotMatch(ebookTools, /<button class="eb-note__save[^>]*>Save<\/button>/);
  assert.match(ebookTools, /addNote: "Lägg till anteckning"/);
  assert.match(ebookTools, /remove: "Ta bort markering"/);
  assert.match(
    ebookTools,
    /localizeButton\(panel\.querySelector\("\.eb-note__close"\), c\.close\)/,
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
