/* Almost Swedish — Ebook highlights + custom notes
   - Highlight selected text
   - Add a note to a highlight, edit later
   - Persisted locally in localStorage per chapter
   - Restored when chapter is rendered
*/

(function () {
  'use strict';

  function lang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }
  function uid() {
    return 'h_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }
  const COPY = Object.freeze({
    en: Object.freeze({
      addNote: 'Add note',
      close: 'Close',
      delete: 'Delete',
      edit: 'Edit',
      find: 'Find highlight',
      highlight: 'Highlight',
      highlighted: 'Highlighted',
      noHighlights: 'No highlights yet. Select text to mark it.',
      note: 'Note',
      noteSaved: 'Note saved',
      noteText: 'Note text',
      remove: 'Remove highlight',
      save: 'Save',
      writeNote: 'Write your note...',
    }),
    sv: Object.freeze({
      addNote: 'Lägg till anteckning',
      close: 'Stäng',
      delete: 'Radera',
      edit: 'Redigera',
      find: 'Hitta markering',
      highlight: 'Markera',
      highlighted: 'Markerat',
      noHighlights: 'Inga markeringar än. Välj text för att markera.',
      note: 'Anteckna',
      noteSaved: 'Anteckning sparad',
      noteText: 'Anteckningstext',
      remove: 'Ta bort markering',
      save: 'Spara',
      writeNote: 'Skriv din anteckning...',
    }),
  });

  // Per-key 12-locale overrides for strings that must localize beyond sv/en.
  // (Most COPY keys are sv/en only; only keys listed here resolve all locales.)
  const COPY_I18N = Object.freeze({
    noHighlights: Object.freeze({
      en: 'No highlights yet. Select text to mark it.',
      sv: 'Inga markeringar än. Välj text för att markera.',
      'zh-Hans': '还没有标注。选中文字即可标记。',
      'zh-Hant': '還沒有標註。選取文字即可標記。',
      ar: 'لا توجد تظليلات بعد. حدّد نصًا لتمييزه.',
      ckb: 'هێشتا هیچ نیشانەکردنێک نییە. دەقێک هەڵبژێرە بۆ نیشانەکردنی.',
      fa: 'هنوز هایلایتی نیست. متنی را انتخاب کنید تا علامت‌گذاری شود.',
      pl: 'Brak zaznaczeń. Zaznacz tekst, aby go oznaczyć.',
      so: 'Weli ma jiraan calaamado. Dooro qoraal si aad u calaamadayso.',
      ti: 'ገና ምልክታት የለን። ንምልካት ጽሑፍ ምረጽ።',
      tr: 'Henüz işaretleme yok. İşaretlemek için metin seçin.',
      uk: 'Поки що немає виділень. Виділіть текст, щоб позначити його.',
    }),
  });

  function copy() {
    const base = lang() === 'sv' ? COPY.sv : COPY.en;
    const l = lang();
    const out = {};
    for (const k of Object.keys(base)) {
      const override = COPY_I18N[k];
      out[k] = (override && (override[l] || override.en)) || base[k];
    }
    return out;
  }

  function localizeButton(button, label, text) {
    if (!button) return;
    button.title = label;
    button.setAttribute('aria-label', label);
    if (typeof text === 'string') {
      button.textContent = text;
    }
  }

  function activeChapter() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    const m = hash.match(/[?&]c=([^&]+)/);
    return m ? m[1] : 'intro';
  }
  function isOnEbook() {
    return (location.hash || '#/').replace(/^#/, '').split('?')[0] === '/ebook';
  }

  /* ---------- storage ---------- */

  const HIGHLIGHT_ID_MAX_LENGTH = 160;
  const HIGHLIGHT_TEXT_MAX_LENGTH = 500;
  const HIGHLIGHT_ANCHOR_MAX_LENGTH = 120;
  const HIGHLIGHT_NOTE_MAX_LENGTH = 2000;

  function isPlainHighlightRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function normalizeRequiredString(value, maxLength) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    if (!normalized || normalized.length > maxLength) return null;
    return normalized;
  }

  function normalizeOptionalString(value, maxLength) {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    if (normalized.length > maxLength) return null;
    return normalized;
  }

  function normalizeHighlightRecord(value) {
    if (!isPlainHighlightRecord(value)) return null;
    const id = normalizeRequiredString(value.id, HIGHLIGHT_ID_MAX_LENGTH);
    const text = normalizeRequiredString(value.text, HIGHLIGHT_TEXT_MAX_LENGTH);
    const before = normalizeOptionalString(value.before, HIGHLIGHT_ANCHOR_MAX_LENGTH);
    const after = normalizeOptionalString(value.after, HIGHLIGHT_ANCHOR_MAX_LENGTH);
    const note = normalizeOptionalString(value.note, HIGHLIGHT_NOTE_MAX_LENGTH);
    if (!id || !text || before === null || after === null || note === null) return null;
    return { id, text, before, after, note };
  }

  function normalizeHighlights(value) {
    if (!Array.isArray(value)) return [];
    return value.map(normalizeHighlightRecord).filter(Boolean);
  }

  function loadHighlights(chId) {
    try {
      return normalizeHighlights(JSON.parse(localStorage.getItem('smt_hl_' + chId) || '[]'));
    } catch {
      return [];
    }
  }
  function saveHighlights(chId, arr) {
    try {
      localStorage.setItem('smt_hl_' + chId, JSON.stringify(normalizeHighlights(arr)));
    } catch {}
  }

  /* ---------- highlight serialization ----------
     We store: { id, text, before, after, note }
     `before` + `after` are tiny anchors (15 chars each) used to find the
     selection inside the chapter body on next render. Robust enough for
     static body content.
  */

  function captureSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return null;
    const reader = document.getElementById('ebook-reader');
    if (!reader || !reader.contains(sel.anchorNode)) return null;
    const text = sel.toString().trim();
    if (text.length < 3) return null;
    if (text.length > HIGHLIGHT_TEXT_MAX_LENGTH) return null;
    const range = sel.getRangeAt(0);
    // capture small slices of plain text on either side of the selection
    // using the chapter's plain text as the canonical search space
    const plain = reader.innerText;
    const idx = plain.indexOf(text);
    if (idx < 0) return null;
    const before = plain.slice(Math.max(0, idx - 25), idx);
    const after = plain.slice(idx + text.length, idx + text.length + 25);
    return { text, before, after };
  }

  /* ---------- apply (restore) highlights to rendered chapter ---------- */

  function applyHighlights() {
    const reader = document.getElementById('ebook-reader');
    if (!reader) return;
    const hls = loadHighlights(activeChapter());
    if (!hls.length) return;

    // For each highlight, walk text nodes and wrap matching text in <mark>.
    // Use a fresh tree-walker each time to avoid stale node refs.
    hls.forEach((hl) => {
      wrapMatch(reader, hl);
    });
  }

  function wrapMatch(root, hl) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.parentElement.closest('mark, h1, h2, h3, h4, h5') || !n.nodeValue.trim()
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    let node;
    while ((node = walker.nextNode())) {
      const i = node.nodeValue.indexOf(hl.text);
      if (i < 0) continue;
      // light sanity check using before/after anchors
      const pre = node.nodeValue.slice(Math.max(0, i - 25), i);
      const post = node.nodeValue.slice(i + hl.text.length, i + hl.text.length + 25);
      // not a perfect anchor check but good enough
      if (hl.before && pre && !pre.endsWith(hl.before.slice(-Math.min(8, hl.before.length)))) {
        // fall through anyway — anchors are a best-effort
      }
      const rangeText = node.nodeValue;
      const before = rangeText.slice(0, i);
      const matched = rangeText.slice(i, i + hl.text.length);
      const after = rangeText.slice(i + hl.text.length);
      const mark = document.createElement('mark');
      mark.className = 'eb-hl';
      mark.dataset.hlId = hl.id;
      if (hl.note) mark.dataset.hasNote = '1';
      mark.textContent = matched;
      const parent = node.parentNode;
      parent.insertBefore(document.createTextNode(before), node);
      parent.insertBefore(mark, node);
      parent.insertBefore(document.createTextNode(after), node);
      parent.removeChild(node);
      return; // one wrap per highlight
    }
  }

  /* ---------- floating popover on selection ---------- */

  let popEl = null;
  let selectionPopoverTimer = 0;
  function ensurePop() {
    if (popEl) return popEl;
    popEl = document.createElement('div');
    popEl.className = 'eb-pop';
    popEl.hidden = true;
    popEl.innerHTML = `
      <button class="eb-pop__btn" data-act="hl" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20l-7-7 9-9 7 7-9 9z"/><path d="M5 20h14"/>
        </svg>
        <span class="eb-pop__lbl"></span>
      </button>
      <button class="eb-pop__btn" data-act="note" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4M8 12h8M8 16h6"/>
        </svg>
        <span class="eb-pop__lbl-note"></span>
      </button>
    `;
    document.body.appendChild(popEl);
    return popEl;
  }

  function hidePop() {
    if (popEl) popEl.hidden = true;
  }

  function showPopForSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      hidePop();
      return;
    }
    const reader = document.getElementById('ebook-reader');
    if (!reader || !reader.contains(sel.anchorNode)) {
      hidePop();
      return;
    }
    const range = sel.getRangeAt(0);
    const r = range.getBoundingClientRect();
    const p = ensurePop();
    const c = copy();
    const highlightButton = p.querySelector('[data-act="hl"]');
    const noteButton = p.querySelector('[data-act="note"]');
    localizeButton(highlightButton, c.highlight);
    localizeButton(noteButton, c.addNote);
    p.querySelector('.eb-pop__lbl').textContent = c.highlight;
    p.querySelector('.eb-pop__lbl-note').textContent = c.note;
    p.dataset.mode = 'create';
    p.hidden = false;
    const popRect = p.getBoundingClientRect();
    const popW = popRect.width || 220;
    const popH = popRect.height || 56;
    const top = r.top + window.scrollY - popH - 10;
    const left = Math.max(
      8,
      Math.min(window.innerWidth - popW - 8, r.left + window.scrollX + r.width / 2 - popW / 2),
    );
    p.style.top = top + 'px';
    p.style.left = left + 'px';
  }

  function schedulePopForSelection() {
    if (!isOnEbook()) return;
    if (selectionPopoverTimer) clearTimeout(selectionPopoverTimer);
    selectionPopoverTimer = setTimeout(() => {
      selectionPopoverTimer = 0;
      showPopForSelection();
    }, 30);
  }

  /* ---------- create / edit ---------- */

  function createHighlightFromSelection(withNote) {
    const cap = captureSelection();
    if (!cap) return;
    const chId = activeChapter();
    const hls = loadHighlights(chId);
    const hl = { id: uid(), text: cap.text, before: cap.before, after: cap.after, note: '' };
    hls.push(hl);
    saveHighlights(chId, hls);
    // re-render chapter to apply (cleaner than DOM splicing)
    if (window.smtEbookRender) window.smtEbookRender();
    else applyHighlights();
    window.getSelection().removeAllRanges();
    hidePop();
    if (withNote) {
      setTimeout(() => openNoteEditor(hl.id), 50);
    }
    if (window.smtFx) window.smtFx.toast(copy().highlighted, { duration: 1200 });
  }

  function openNoteEditor(hlId) {
    const chId = activeChapter();
    const hls = loadHighlights(chId);
    const hl = hls.find((h) => h.id === hlId);
    if (!hl) return;
    const mark = document.querySelector(highlightSelector(hlId));
    if (!mark) return;
    const r = mark.getBoundingClientRect();
    let panel = document.getElementById('eb-note');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'eb-note';
      panel.className = 'eb-note';
      panel.innerHTML = `
        <div class="eb-note__head">
          <span class="eb-note__quote"></span>
          <button class="eb-note__close" type="button">✕</button>
        </div>
        <textarea class="eb-note__ta" placeholder=""></textarea>
        <div class="eb-note__actions">
          <button class="eb-note__del" type="button"></button>
          <button class="eb-note__save btn btn--gold btn--sm" type="button"></button>
        </div>
      `;
      document.body.appendChild(panel);
    }
    const c = copy();
    panel.dataset.hlId = hlId;
    panel.querySelector('.eb-note__quote').textContent =
      '“' + hl.text.slice(0, 80) + (hl.text.length > 80 ? '…' : '') + '”';
    localizeButton(panel.querySelector('.eb-note__close'), c.close);
    const ta = panel.querySelector('.eb-note__ta');
    ta.value = hl.note || '';
    ta.placeholder = c.writeNote;
    ta.setAttribute('aria-label', c.noteText);
    localizeButton(panel.querySelector('.eb-note__del'), c.delete, c.delete);
    localizeButton(panel.querySelector('.eb-note__save'), c.save, c.save);
    panel.hidden = false;
    // Position near the highlight
    const w = 340;
    let top = r.bottom + window.scrollY + 8;
    let left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + window.scrollX));
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    setTimeout(() => ta.focus(), 50);
  }

  function closeNote() {
    const p = document.getElementById('eb-note');
    if (p) p.hidden = true;
  }

  function saveNote() {
    const p = document.getElementById('eb-note');
    if (!p) return;
    const hlId = p.dataset.hlId;
    const chId = activeChapter();
    const hls = loadHighlights(chId);
    const hl = hls.find((h) => h.id === hlId);
    if (!hl) return;
    hl.note = p.querySelector('.eb-note__ta').value.trim().slice(0, HIGHLIGHT_NOTE_MAX_LENGTH);
    saveHighlights(chId, hls);
    if (window.smtEbookRender) window.smtEbookRender();
    else applyHighlights();
    closeNote();
    if (window.smtFx) window.smtFx.toast(copy().noteSaved, { duration: 1400 });
  }

  function deleteHighlight() {
    const p = document.getElementById('eb-note');
    if (!p) return;
    const hlId = p.dataset.hlId;
    const chId = activeChapter();
    const hls = loadHighlights(chId).filter((h) => h.id !== hlId);
    saveHighlights(chId, hls);
    if (window.smtEbookRender) window.smtEbookRender();
    else applyHighlights();
    closeNote();
  }

  /* ---------- notes panel: list all highlights for current chapter ---------- */

  function renderNotesList() {
    const host = document.getElementById('eb-notes-list');
    if (!host) return;
    const hls = loadHighlights(activeChapter());
    const c = copy();
    if (!hls.length) {
      host.innerHTML = `<p class="eb-notes-empty">${c.noHighlights}</p>`;
      return;
    }
    host.innerHTML = hls
      .map(
        (h) => `
      <div class="eb-notes-item ${h.note ? 'has-note' : ''}" data-hl-id="${escapeHtmlAttribute(h.id)}">
        <div class="eb-notes-item__text">${escapeHtml(h.text)}</div>
        ${h.note ? `<div class="eb-notes-item__note">${escapeHtml(h.note)}</div>` : ''}
        <div class="eb-notes-item__actions">
          <button data-act="edit" type="button" title="${escapeHtml(c.edit)}" aria-label="${escapeHtml(c.edit)}">${escapeHtml(c.edit)}</button>
          <button data-act="goto" type="button" title="${escapeHtml(c.find)}" aria-label="${escapeHtml(c.find)}">${escapeHtml(c.find)}</button>
          <button data-act="del" type="button" title="${escapeHtml(c.remove)}" aria-label="${escapeHtml(c.remove)}">${escapeHtml(c.remove)}</button>
        </div>
      </div>
    `,
      )
      .join('');
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  }

  function escapeHtmlAttribute(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  function escapeCssString(s) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(String(s));
    }
    return String(s)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\a ')
      .replace(/\r/g, '\\d ')
      .replace(/\f/g, '\\c ');
  }

  function highlightSelector(hlId) {
    return `mark.eb-hl[data-hl-id="${escapeCssString(hlId)}"]`;
  }

  /* ---------- listeners ---------- */

  document.addEventListener('mouseup', (e) => {
    if (!isOnEbook()) return;
    if (e.target.closest('.eb-pop, .eb-note')) return;
    schedulePopForSelection();
  });
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      hidePop();
      return;
    }
    schedulePopForSelection();
  });
  document.addEventListener('keyup', (e) => {
    if (!isOnEbook()) return;
    if (e.target?.closest?.('.eb-pop, .eb-note')) return;
    schedulePopForSelection();
  });

  document.addEventListener('click', (e) => {
    // pop actions
    const popBtn = e.target.closest('.eb-pop__btn');
    if (popBtn) {
      const act = popBtn.dataset.act;
      if (act === 'hl') createHighlightFromSelection(false);
      else if (act === 'note') createHighlightFromSelection(true);
      return;
    }
    // clicking a highlight: open its note
    const mark = e.target.closest('mark.eb-hl');
    if (mark && isOnEbook()) {
      openNoteEditor(mark.dataset.hlId);
      return;
    }
    // close note panel
    if (e.target.closest('.eb-note__close')) {
      closeNote();
      return;
    }
    if (e.target.closest('.eb-note__save')) {
      saveNote();
      return;
    }
    if (e.target.closest('.eb-note__del')) {
      deleteHighlight();
      return;
    }

    // notes list buttons
    const item = e.target.closest('.eb-notes-item');
    if (item) {
      const act = e.target.closest('button')?.dataset.act;
      const hlId = item.dataset.hlId;
      if (act === 'edit') {
        openNoteEditor(hlId);
      } else if (act === 'goto') {
        const mark = document.querySelector(highlightSelector(hlId));
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          mark.classList.add('is-flash');
          setTimeout(() => mark.classList.remove('is-flash'), 1400);
        }
      } else if (act === 'del') {
        const chId = activeChapter();
        const hls = loadHighlights(chId).filter((h) => h.id !== hlId);
        saveHighlights(chId, hls);
        if (window.smtEbookRender) window.smtEbookRender();
      }
      return;
    }

    // outside everything → hide pop
    if (!e.target.closest('.eb-pop')) hidePop();
  });

  // Public: called by ebook.js after rendering a chapter
  window.smtApplyEbookHighlights = function () {
    applyHighlights();
    renderNotesList();
  };

  // Re-render notes list when chapter changes
  window.addEventListener('hashchange', () => {
    if (isOnEbook()) renderNotesList();
  });
})();
