/* Sveriges Medborgartest — Ebook highlights + custom notes
   - Highlight selected text
   - Add a note to a highlight, edit later
   - Persisted locally in localStorage per chapter
   - Restored when chapter is rendered
*/

(function () {
  "use strict";

  function lang() { try { return localStorage.getItem("smt_lang") || "en"; } catch { return "en"; } }
  function uid() { return "h_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

  function activeChapter() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const m = hash.match(/[?&]c=([^&]+)/);
    return m ? m[1] : "intro";
  }
  function isOnEbook() {
    return (location.hash || "#/").replace(/^#/, "").split("?")[0] === "/ebook";
  }

  /* ---------- storage ---------- */

  function loadHighlights(chId) {
    try { return JSON.parse(localStorage.getItem("smt_hl_" + chId) || "[]"); }
    catch { return []; }
  }
  function saveHighlights(chId, arr) {
    try { localStorage.setItem("smt_hl_" + chId, JSON.stringify(arr)); } catch {}
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
    const reader = document.getElementById("ebook-reader");
    if (!reader || !reader.contains(sel.anchorNode)) return null;
    const text = sel.toString().trim();
    if (text.length < 3) return null;
    const range = sel.getRangeAt(0);
    // capture small slices of plain text on either side of the selection
    // using the chapter's plain text as the canonical search space
    const plain = reader.innerText;
    const idx = plain.indexOf(text);
    if (idx < 0) return null;
    const before = plain.slice(Math.max(0, idx - 25), idx);
    const after  = plain.slice(idx + text.length, idx + text.length + 25);
    return { text, before, after };
  }

  /* ---------- apply (restore) highlights to rendered chapter ---------- */

  function applyHighlights() {
    const reader = document.getElementById("ebook-reader");
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
        n.parentElement.closest("mark, h1, h2, h3, h4, h5") || !n.nodeValue.trim()
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
      const mark = document.createElement("mark");
      mark.className = "eb-hl";
      mark.dataset.hlId = hl.id;
      if (hl.note) mark.dataset.hasNote = "1";
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
  function ensurePop() {
    if (popEl) return popEl;
    popEl = document.createElement("div");
    popEl.className = "eb-pop";
    popEl.hidden = true;
    popEl.innerHTML = `
      <button class="eb-pop__btn" data-act="hl" title="Highlight">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20l-7-7 9-9 7 7-9 9z"/><path d="M5 20h14"/>
        </svg>
        <span class="eb-pop__lbl"></span>
      </button>
      <button class="eb-pop__btn" data-act="note" title="Add note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4M8 12h8M8 16h6"/>
        </svg>
        <span class="eb-pop__lbl-note"></span>
      </button>
    `;
    document.body.appendChild(popEl);
    return popEl;
  }

  function hidePop() { if (popEl) popEl.hidden = true; }

  function showPopForSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { hidePop(); return; }
    const reader = document.getElementById("ebook-reader");
    if (!reader || !reader.contains(sel.anchorNode)) { hidePop(); return; }
    const range = sel.getRangeAt(0);
    const r = range.getBoundingClientRect();
    const p = ensurePop();
    p.querySelector(".eb-pop__lbl").textContent = lang() === "sv" ? "Markera" : "Highlight";
    p.querySelector(".eb-pop__lbl-note").textContent = lang() === "sv" ? "Anteckna" : "Note";
    p.dataset.mode = "create";
    p.hidden = false;
    const popW = 220, popH = 38;
    const top = r.top + window.scrollY - popH - 10;
    const left = Math.max(8, Math.min(window.innerWidth - popW - 8,
      r.left + window.scrollX + r.width / 2 - popW / 2));
    p.style.top = top + "px";
    p.style.left = left + "px";
  }

  /* ---------- create / edit ---------- */

  function createHighlightFromSelection(withNote) {
    const cap = captureSelection();
    if (!cap) return;
    const chId = activeChapter();
    const hls = loadHighlights(chId);
    const hl = { id: uid(), text: cap.text, before: cap.before, after: cap.after, note: "" };
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
    if (window.smtFx) window.smtFx.toast(
      lang() === "sv" ? "Markerat" : "Highlighted",
      { duration: 1200 }
    );
  }

  function openNoteEditor(hlId) {
    const chId = activeChapter();
    const hls = loadHighlights(chId);
    const hl = hls.find((h) => h.id === hlId);
    if (!hl) return;
    const mark = document.querySelector(`mark.eb-hl[data-hl-id="${hlId}"]`);
    if (!mark) return;
    const r = mark.getBoundingClientRect();
    let panel = document.getElementById("eb-note");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "eb-note";
      panel.className = "eb-note";
      panel.innerHTML = `
        <div class="eb-note__head">
          <span class="eb-note__quote"></span>
          <button class="eb-note__close" aria-label="Close">✕</button>
        </div>
        <textarea class="eb-note__ta" placeholder=""></textarea>
        <div class="eb-note__actions">
          <button class="eb-note__del">Delete</button>
          <button class="eb-note__save btn btn--gold btn--sm">Save</button>
        </div>
      `;
      document.body.appendChild(panel);
    }
    panel.dataset.hlId = hlId;
    panel.querySelector(".eb-note__quote").textContent = "“" + hl.text.slice(0, 80) + (hl.text.length > 80 ? "…" : "") + "”";
    const ta = panel.querySelector(".eb-note__ta");
    ta.value = hl.note || "";
    ta.placeholder = lang() === "sv" ? "Skriv din anteckning…" : "Write your note…";
    panel.querySelector(".eb-note__del").textContent = lang() === "sv" ? "Radera" : "Delete";
    panel.querySelector(".eb-note__save").textContent = lang() === "sv" ? "Spara" : "Save";
    panel.hidden = false;
    // Position near the highlight
    const w = 340;
    let top = r.bottom + window.scrollY + 8;
    let left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + window.scrollX));
    panel.style.top = top + "px";
    panel.style.left = left + "px";
    setTimeout(() => ta.focus(), 50);
  }

  function closeNote() {
    const p = document.getElementById("eb-note");
    if (p) p.hidden = true;
  }

  function saveNote() {
    const p = document.getElementById("eb-note");
    if (!p) return;
    const hlId = p.dataset.hlId;
    const chId = activeChapter();
    const hls = loadHighlights(chId);
    const hl = hls.find((h) => h.id === hlId);
    if (!hl) return;
    hl.note = p.querySelector(".eb-note__ta").value.trim();
    saveHighlights(chId, hls);
    if (window.smtEbookRender) window.smtEbookRender();
    else applyHighlights();
    closeNote();
    if (window.smtFx) window.smtFx.toast(
      lang() === "sv" ? "Anteckning sparad" : "Note saved",
      { duration: 1400 }
    );
  }

  function deleteHighlight() {
    const p = document.getElementById("eb-note");
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
    const host = document.getElementById("eb-notes-list");
    if (!host) return;
    const hls = loadHighlights(activeChapter());
    const sv = lang() === "sv";
    if (!hls.length) {
      host.innerHTML = `<p class="eb-notes-empty">${
        sv ? "Inga markeringar än. Välj text för att markera." : "No highlights yet. Select text to mark it."
      }</p>`;
      return;
    }
    host.innerHTML = hls.map((h) => `
      <div class="eb-notes-item ${h.note ? "has-note" : ""}" data-hl-id="${h.id}">
        <div class="eb-notes-item__text">${escapeHtml(h.text)}</div>
        ${h.note ? `<div class="eb-notes-item__note">${escapeHtml(h.note)}</div>` : ""}
        <div class="eb-notes-item__actions">
          <button data-act="edit">${sv ? "Redigera" : "Edit"}</button>
          <button data-act="goto">${sv ? "Hitta" : "Find"}</button>
          <button data-act="del">${sv ? "Ta bort" : "Remove"}</button>
        </div>
      </div>
    `).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ---------- listeners ---------- */

  document.addEventListener("mouseup", (e) => {
    if (!isOnEbook()) return;
    if (e.target.closest(".eb-pop, .eb-note")) return;
    setTimeout(showPopForSelection, 10);
  });
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { hidePop(); }
  });

  document.addEventListener("click", (e) => {
    // pop actions
    const popBtn = e.target.closest(".eb-pop__btn");
    if (popBtn) {
      const act = popBtn.dataset.act;
      if (act === "hl") createHighlightFromSelection(false);
      else if (act === "note") createHighlightFromSelection(true);
      return;
    }
    // clicking a highlight: open its note
    const mark = e.target.closest("mark.eb-hl");
    if (mark && isOnEbook()) {
      openNoteEditor(mark.dataset.hlId);
      return;
    }
    // close note panel
    if (e.target.closest(".eb-note__close")) { closeNote(); return; }
    if (e.target.closest(".eb-note__save")) { saveNote(); return; }
    if (e.target.closest(".eb-note__del")) { deleteHighlight(); return; }

    // notes list buttons
    const item = e.target.closest(".eb-notes-item");
    if (item) {
      const act = e.target.closest("button")?.dataset.act;
      const hlId = item.dataset.hlId;
      if (act === "edit") { openNoteEditor(hlId); }
      else if (act === "goto") {
        const mark = document.querySelector(`mark.eb-hl[data-hl-id="${hlId}"]`);
        if (mark) {
          mark.scrollIntoView({ behavior: "smooth", block: "center" });
          mark.classList.add("is-flash");
          setTimeout(() => mark.classList.remove("is-flash"), 1400);
        }
      } else if (act === "del") {
        const chId = activeChapter();
        const hls = loadHighlights(chId).filter((h) => h.id !== hlId);
        saveHighlights(chId, hls);
        if (window.smtEbookRender) window.smtEbookRender();
      }
      return;
    }

    // outside everything → hide pop
    if (!e.target.closest(".eb-pop")) hidePop();
  });

  // Public: called by ebook.js after rendering a chapter
  window.smtApplyEbookHighlights = function () {
    applyHighlights();
    renderNotesList();
  };

  // Re-render notes list when chapter changes
  window.addEventListener("hashchange", () => {
    if (isOnEbook()) renderNotesList();
  });
})();
