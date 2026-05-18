/* ===========================================================
   Site-wide JS: language toggle + palette presets.
   No build step. Plain ES.
   =========================================================== */

(function () {
  const LS_LANG = "sct_lang";
  const LS_PALETTE = "sct_palette";

  const PALETTES = {
    classic: {
      name: { en: "Classic flag", sv: "Klassisk flagga" },
      vars: {
        "--blue": "#006aa7",
        "--blue-deep": "#003a5c",
        "--blue-soft": "#d6e5f0",
        "--gold": "#fecc00",
        "--gold-deep": "#c89500",
        "--gold-soft": "#fff4c2",
        "--canvas": "#f6f3ec",
        "--paper": "#fbf9f3",
        "--ink": "#0d1f33",
      },
    },
    nordic: {
      name: { en: "Nordic deep", sv: "Nordiskt djup" },
      vars: {
        "--blue": "#1f4e7a",
        "--blue-deep": "#0e2a45",
        "--blue-soft": "#cfdce8",
        "--gold": "#e8b94a",
        "--gold-deep": "#a37e1f",
        "--gold-soft": "#f7ead0",
        "--canvas": "#efeae1",
        "--paper": "#f7f3ea",
        "--ink": "#101b2c",
      },
    },
    midsommar: {
      name: { en: "Midsommar bright", sv: "Midsommar" },
      vars: {
        "--blue": "#1d80b8",
        "--blue-deep": "#0a4972",
        "--blue-soft": "#d8ecf5",
        "--gold": "#ffd23f",
        "--gold-deep": "#d4a300",
        "--gold-soft": "#fff3b8",
        "--canvas": "#f3f7f4",
        "--paper": "#ffffff",
        "--ink": "#0c2330",
      },
    },
    lagom: {
      name: { en: "Lagom muted", sv: "Lagom dämpat" },
      vars: {
        "--blue": "#3d5b75",
        "--blue-deep": "#22344a",
        "--blue-soft": "#dde4ec",
        "--gold": "#c9a23c",
        "--gold-deep": "#8e7220",
        "--gold-soft": "#f0e3c0",
        "--canvas": "#ece8de",
        "--paper": "#f5f1e6",
        "--ink": "#1c2632",
      },
    },
  };

  function applyPalette(key) {
    const p = PALETTES[key] || PALETTES.classic;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(p.vars)) root.style.setProperty(k, v);
    try { localStorage.setItem(LS_PALETTE, key); } catch {}
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "sv") lang = "en";
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(LS_LANG, lang); } catch {}

    // toggle [data-en] / [data-sv] attribute swap on translated text nodes
    document.querySelectorAll("[data-en][data-sv]").forEach((el) => {
      const newText = el.getAttribute("data-" + lang);
      if (newText != null) el.textContent = newText;
    });

    // toggle button state
    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
    });
  }

  function getStoredLang() {
    try {
      const saved = localStorage.getItem(LS_LANG);
      if (saved === "en" || saved === "sv") return saved;
    } catch {}
    // detect Swedish browsers
    const nav = (navigator.language || "en").toLowerCase();
    return nav.startsWith("sv") ? "sv" : "en";
  }

  function getStoredPalette() {
    try {
      const saved = localStorage.getItem(LS_PALETTE);
      if (saved && PALETTES[saved]) return saved;
    } catch {}
    return "classic";
  }

  // Apply ASAP (before DOMContentLoaded if possible) to avoid FOUC
  applyPalette(getStoredPalette());

  function init() {
    setLang(getStoredLang());

    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });

    // palette swatches (only present on landing)
    document.querySelectorAll("[data-palette-set]").forEach((el) => {
      el.addEventListener("click", () => {
        applyPalette(el.dataset.paletteSet);
        document.querySelectorAll("[data-palette-set]").forEach((e) =>
          e.classList.toggle("is-active", e.dataset.paletteSet === el.dataset.paletteSet)
        );
      });
      if (el.dataset.paletteSet === getStoredPalette()) el.classList.add("is-active");
    });

    // sample question interactivity
    const answers = document.querySelectorAll(".answer");
    const feedback = document.querySelector(".feedback");
    answers.forEach((a) => {
      a.addEventListener("click", () => {
        const correct = a.dataset.correct === "true";
        answers.forEach((b) => {
          if (b === a) b.classList.add(correct ? "correct" : "wrong");
          else if (b.dataset.correct === "true") b.classList.add("correct");
          else b.classList.add("wrong");
        });
        if (feedback) feedback.classList.add("is-on");
      });
    });

    // reveal / reset
    const resetBtn = document.querySelector("[data-sample-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        answers.forEach((b) => b.classList.remove("correct", "wrong"));
        if (feedback) feedback.classList.remove("is-on");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose for tweaks panel
  window.__sctPalettes = PALETTES;
  window.__sctApplyPalette = applyPalette;
  window.__sctSetLang = setLang;
})();
