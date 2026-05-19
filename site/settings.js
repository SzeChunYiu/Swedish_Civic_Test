/* Almost Swedish — Settings modal
   - Theme (light/dark/auto)
   - Color palette (5 Swedish-named presets)
   - Buddy picker (10 buddies)
   - Language (EN/SV)
   - Text size (small/regular/large)
   - Reduce motion
   - Hero flag-cross toggle
   - Reset cookie/ad consent
   All settings persist via localStorage.
*/

(function () {
  "use strict";

  // -------- PALETTES --------
  // Same accent system as the tweaks panel, exposed user-facing.

  const PALETTES = {
    flag: {
      vars: { "--blue":"#006aa7","--blue-deep":"#003a5c","--blue-ink":"#00253c","--gold":"#fecc00","--gold-deep":"#d9a900","--gold-soft":"#fff3cf" },
    },
    midsommar: {
      vars: { "--blue":"#3e7c52","--blue-deep":"#22442b","--blue-ink":"#1d3324","--gold":"#f4c542","--gold-deep":"#c79a18","--gold-soft":"#fdf2c4" },
    },
    falu: {
      vars: { "--blue":"#8c1a2b","--blue-deep":"#5b0e1c","--blue-ink":"#2a0b11","--gold":"#e9b94a","--gold-deep":"#b88a19","--gold-soft":"#fbe7b7" },
    },
    skargard: {
      vars: { "--blue":"#2f4a5c","--blue-deep":"#1b2e3b","--blue-ink":"#10212c","--gold":"#ffd166","--gold-deep":"#d39e2c","--gold-soft":"#ffeec1" },
    },
    norrsken: {
      vars: { "--blue":"#2b6a86","--blue-deep":"#173a4e","--blue-ink":"#0e1726","--gold":"#9be7c4","--gold-deep":"#46c294","--gold-soft":"#dff7eb" },
    },
  };

  function ls(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : v; } catch { return fallback; }
  }
  function lsSet(key, v) { try { localStorage.setItem(key, v); } catch {} }

  // -------- APPLY HELPERS --------

  function applyTheme(t) {
    let resolved = t;
    if (t === "auto") {
      resolved = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", t);
    lsSet("smt_theme", t);
  }
  function applyPalette(p) {
    const pal = PALETTES[p] || PALETTES.flag;
    Object.entries(pal.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    lsSet("smt_palette", p);
  }
  function applyTextSize(s) {
    document.documentElement.style.fontSize = (16 * (parseInt(s, 10) / 100)) + "px";
    lsSet("smt_textsize", s);
  }
  function applyMotion(on) {
    document.documentElement.setAttribute("data-motion", on ? "reduce" : "");
    lsSet("smt_motion", on ? "reduce" : "");
  }
  function applyAurora(on) {
    document.documentElement.setAttribute("data-aurora", on ? "on" : "off");
    lsSet("smt_aurora", on ? "on" : "off");
  }
  function applyFlagcross(on) {
    const el = document.querySelector(".hero__cross");
    if (el) el.style.display = on ? "" : "none";
    lsSet("smt_flagcross", on ? "1" : "0");
  }
  function applyBuddyVisible(on) {
    if (on) { if (window.smtBuddyShow) window.smtBuddyShow(); }
    else    { if (window.smtBuddyHide) window.smtBuddyHide(); }
  }

  // -------- MODAL OPEN/CLOSE --------

  function open() {
    const m = document.getElementById("settings-modal");
    if (!m) return;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    syncControls();
    renderBuddyPicker();
  }
  function close() {
    const m = document.getElementById("settings-modal");
    if (!m) return;
    m.hidden = true;
    document.body.style.overflow = "";
  }

  // -------- SYNC CONTROL STATE --------

  function setSegment(group, value) {
    document.querySelectorAll(`[data-set="${group}"] button`).forEach((b) => {
      b.classList.toggle("is-on", b.dataset.val === String(value));
    });
  }
  function setPalette(value) {
    document.querySelectorAll(".set-palette").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.val === value);
    });
  }
  function setCheckbox(group, on) {
    const el = document.querySelector(`input[type=checkbox][data-set="${group}"]`);
    if (el) el.checked = !!on;
  }
  function syncControls() {
    setSegment("theme",     ls("smt_theme", "auto"));
    setPalette(ls("smt_palette", "flag"));
    setSegment("language",  ls("smt_lang", "en"));
    setSegment("textsize",  ls("smt_textsize", "100"));
    setCheckbox("motion",   ls("smt_motion", "") === "reduce");
    setCheckbox("aurora",   ls("smt_aurora", "on") !== "off");
    setCheckbox("flagcross", ls("smt_flagcross", "1") === "1");
    setCheckbox("buddyshow", ls("smt_buddy_hidden", "") !== "1");
  }

  // -------- BUDDY PICKER --------

  function renderBuddyPicker() {
    const host = document.getElementById("buddy-picker");
    if (!host || !window.smtBuddyList) return;
    const buddies = window.smtBuddyList();
    const cur = ls("smt_buddy", "dala");
    const lang = ls("smt_lang", "en");
    host.innerHTML = buddies.map((b) => `
      <button class="buddy-card ${b.id === cur ? "is-on" : ""}" data-buddy="${b.id}" title="${b.name}">
        <span class="buddy-card__svg">${b.svg}</span>
        <span class="buddy-card__name">${b.name}</span>
        <span class="buddy-card__sub">${b.subtitle[lang] || b.subtitle.en}</span>
      </button>
    `).join("");
  }

  // -------- WIRE EVENTS --------

  document.addEventListener("click", (e) => {
    if (e.target.closest("#settings-open")) { open(); return; }
    if (e.target.closest('#settings-modal [data-close="settings"]')) { close(); return; }

    const seg = e.target.closest('[data-set] button[data-val]:not(.set-palette)');
    if (seg) {
      const group = seg.parentElement.dataset.set;
      const v = seg.dataset.val;
      if (group === "theme") applyTheme(v);
      else if (group === "language") {
        if (window.smtSetLanguage) window.smtSetLanguage(v);
        else if (window.applyLang) window.applyLang(v);
        else { lsSet("smt_lang", v); location.reload(); }
      }
      else if (group === "textsize") applyTextSize(v);
      setSegment(group, v);
      return;
    }

    const pal = e.target.closest(".set-palette");
    if (pal) {
      applyPalette(pal.dataset.val);
      setPalette(pal.dataset.val);
      return;
    }

    const buddy = e.target.closest(".buddy-card");
    if (buddy) {
      const id = buddy.dataset.buddy;
      if (window.smtSetBuddy) window.smtSetBuddy(id);
      lsSet("smt_buddy", id);
      document.querySelectorAll(".buddy-card").forEach((c) => c.classList.toggle("is-on", c.dataset.buddy === id));
      return;
    }

    if (e.target.closest("#reset-consent")) {
      try {
        localStorage.removeItem("smt_consent");
        sessionStorage.removeItem("smt_anchor_closed");
      } catch {}
      close();
      const c = document.getElementById("consent");
      if (c) c.hidden = false;
      if (window.smtRefreshAds) window.smtRefreshAds();
      return;
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches('input[type=checkbox][data-set]')) {
      const group = e.target.dataset.set;
      const on = e.target.checked;
      if (group === "motion") applyMotion(on);
      else if (group === "aurora") applyAurora(on);
      else if (group === "flagcross") applyFlagcross(on);
      else if (group === "buddyshow") applyBuddyVisible(on);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.getElementById("settings-modal");
      if (m && !m.hidden) close();
    }
  });

  // -------- BOOT (restore saved settings) --------

  window.addEventListener("DOMContentLoaded", () => {
    applyTheme(ls("smt_theme", "auto"));
    applyPalette(ls("smt_palette", "flag"));
    applyTextSize(ls("smt_textsize", "100"));
    applyMotion(ls("smt_motion", "") === "reduce");
    applyAurora(ls("smt_aurora", "on") !== "off");
    applyFlagcross(ls("smt_flagcross", "1") === "1");

    // listen for system theme change when on auto
    matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
      if (ls("smt_theme", "auto") === "auto") applyTheme("auto");
    });
  });

  // expose for tweaks panel + others
  window.smtApplyPalette = applyPalette;
  window.smtApplyTheme = applyTheme;
})();
