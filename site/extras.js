/* Almost Swedish — Extras
   - Reveal-on-scroll for chapter list
   - Easter eggs: fika, abba, snö, vasa, ikea, skål, lagom, brand-tap, "?" cheatsheet, triple-click facts
   - Smooth in-page anchor scroll
*/

(function () {
  "use strict";

  function reducedMotionEnabled() {
    const fx = window.smtFx;
    if (fx && typeof fx.prefersReducedMotion === "function") return fx.prefersReducedMotion();
    try {
      const root = document.documentElement;
      return (
        (root && root.getAttribute && root.getAttribute("data-motion") === "reduce") ||
        localStorage.getItem("smt_motion") === "reduce" ||
        (typeof matchMedia === "function" &&
          matchMedia("(prefers-reduced-motion: reduce)").matches)
      );
    } catch {
      return false;
    }
  }

  function clearStandaloneMotionEffects() {
    ["smt-snow", "smt-vasa"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  window.addEventListener("smt:motionchange", (event) => {
    if (event.detail && event.detail.reduced) clearStandaloneMotionEffects();
  });

  // ---------- Reveal chapter rows on scroll ----------

  function setupReveal() {
    const items = document.querySelectorAll(".list-quiet li");
    if (reducedMotionEnabled() || !items.length || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = Array.from(items).indexOf(e.target);
          setTimeout(() => e.target.classList.add("is-in"), Math.min(idx * 40, 240));
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
    items.forEach((el) => io.observe(el));
  }

  // ---------- Lang helper ----------
  function lang() { try { return localStorage.getItem("smt_lang") || "en"; } catch { return "en"; } }
  function isTyping() {
    const a = document.activeElement;
    return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
  }

  // ---------- Type-a-word easter eggs ----------

  const WORDS = {
    fika: fikaEgg,
    abba: abbaEgg,
    "snö": snowEgg,
    snow: snowEgg,
    vasa: vasaEgg,
    ikea: ikeaEgg,
    "skål": skalEgg,
    skol: skalEgg,
    lagom: lagomEgg,
  };
  const MAX_LEN = 5; // longest trigger length
  let buf = "";
  document.addEventListener("keydown", (e) => {
    if (isTyping()) return;
    // "?" cheatsheet
    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      toggleCheatsheet();
      return;
    }
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-MAX_LEN);
    for (const w in WORDS) {
      if (buf.endsWith(w)) {
        WORDS[w]();
        buf = "";
        return;
      }
    }
  });

  // ---------- Individual eggs ----------

  function fikaEgg() {
    const fx = window.smtFx;
    if (fx) {
      const cx = innerWidth * 0.5, cy = innerHeight * 0.3;
      fx.burst(cx, cy, { colors: ["#8a5a2b", "#5a3416", "#fff", "#fecc00"], count: 30 });
      fx.toast("☕ Fika break.", { duration: 2200 });
    }
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate("Fika break? Always allowed.", "Fika? Alltid tillåtet.");
  }

  function abbaEgg() {
    // disco rainbow confetti from center top
    const fx = window.smtFx;
    if (fx) {
      const cols = ["#ff3d8c", "#ff8c1a", "#fecc00", "#3eda9a", "#3aa7ff", "#b46cf4", "#fff"];
      if (!reducedMotionEnabled()) {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            fx.burst(innerWidth * (.2 + Math.random()*.6), 80 + Math.random()*100,
              { colors: cols, count: 40, spread: 240 });
          }, i * 220);
        }
      }
      fx.toast("💃 Take a chance on me.", { flavor: "win", duration: 2800 });
    }
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "Mamma mia, here we go again.", "Mamma mia, här går vi igen."
    );
  }

  function snowEgg() {
    if (reducedMotionEnabled()) {
      if (window.smtFx) window.smtFx.toast("❄ Snow.", { duration: 2200 });
      if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
        "Vinter is here. Sip something hot.", "Vinter är här. Drick något varmt."
      );
      return;
    }
    if (document.getElementById("smt-snow")) return; // already running
    const layer = document.createElement("div");
    layer.id = "smt-snow";
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:94;overflow:hidden";
    document.body.appendChild(layer);
    const flakes = ["❄", "❅", "❆", "·", "*"];
    const N = 60;
    for (let i = 0; i < N; i++) {
      const f = document.createElement("span");
      f.textContent = flakes[Math.floor(Math.random()*flakes.length)];
      const size = 10 + Math.random()*16;
      const x = Math.random() * innerWidth;
      const dx = (Math.random() - 0.5) * 160;
      const dur = 5500 + Math.random()*4500;
      const delay = Math.random() * 4000;
      f.style.cssText = `
        position:absolute; left:${x}px; top:-30px;
        color: rgba(255,255,255,${0.55 + Math.random()*0.35});
        font-size:${size}px;
        text-shadow: 0 1px 2px rgba(0,80,160,.4);
        will-change: transform, opacity;
      `;
      layer.appendChild(f);
      f.animate(
        [
          { transform: "translate(0,0) rotate(0)", opacity: 0 },
          { transform: `translate(${dx*.3}px,${innerHeight*.3}px) rotate(80deg)`, opacity: 1, offset: .2 },
          { transform: `translate(${dx}px,${innerHeight+40}px) rotate(360deg)`, opacity: 0 },
        ],
        { duration: dur, delay, easing: "cubic-bezier(.3,.4,.5,1)" }
      ).onfinish = () => f.remove();
    }
    if (window.smtFx) window.smtFx.toast("❄ Snow.", { duration: 2200 });
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "Vinter is here. Sip something hot.", "Vinter är här. Drick något varmt."
    );
    setTimeout(() => layer.remove(), 11000);
  }

  function vasaEgg() {
    if (reducedMotionEnabled()) {
      if (window.smtFx) window.smtFx.toast("⛵ Vasa, on its way.", { duration: 2200 });
      if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
        "It sank in 1628. Don't get attached.",
        "Det sjönk 1628. Knyt inte an för mycket."
      );
      return;
    }
    if (document.getElementById("smt-vasa")) return;
    const ship = document.createElement("div");
    ship.id = "smt-vasa";
    ship.innerHTML = `
      <svg viewBox="0 0 220 140" width="180" height="115" aria-hidden="true">
        <line x1="60" y1="20" x2="60" y2="80" stroke="#3a2510" stroke-width="3"/>
        <line x1="120" y1="14" x2="120" y2="80" stroke="#3a2510" stroke-width="3"/>
        <path d="M60 20L90 60L60 60Z" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
        <path d="M120 14L160 60L120 60Z" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
        <path d="M60 20L34 60L60 60Z" fill="#f3ebd6" stroke="#0b1f33" stroke-width="1"/>
        <rect x="100" y="28" width="22" height="18" fill="#006aa7"/>
        <line x1="108" y1="28" x2="108" y2="46" stroke="#fecc00" stroke-width="1.5"/>
        <line x1="100" y1="36" x2="122" y2="36" stroke="#fecc00" stroke-width="1.5"/>
        <path d="M14 80L206 80L188 110L32 110Z" fill="#6b4520" stroke="#0b1f33" stroke-width="1"/>
        <line x1="30" y1="95" x2="190" y2="95" stroke="#4a3018" stroke-width="1"/>
        <g fill="#0b1f33"><circle cx="50" cy="98" r="2"/><circle cx="80" cy="98" r="2"/><circle cx="110" cy="98" r="2"/><circle cx="140" cy="98" r="2"/><circle cx="170" cy="98" r="2"/></g>
      </svg>
    `;
    ship.style.cssText = `
      position: fixed;
      left: -200px; bottom: 18px;
      z-index: 93; pointer-events: none;
      transform-origin: 50% 100%;
      filter: drop-shadow(0 6px 8px rgba(0,30,60,.25));
    `;
    document.body.appendChild(ship);
    // sail across, then sink
    ship.animate(
      [
        { transform: "translate(0,0) rotate(0)" },
        { transform: `translate(${innerWidth*.7}px, 0) rotate(0)`, offset: .7 },
        { transform: `translate(${innerWidth*.7}px, 60px) rotate(-25deg)`, offset: .9 },
        { transform: `translate(${innerWidth*.72}px, 200px) rotate(-50deg)`, opacity: 0 },
      ],
      { duration: 14000, easing: "cubic-bezier(.42,.05,.7,1)" }
    ).onfinish = () => ship.remove();
    if (window.smtFx) window.smtFx.toast("⛵ Vasa, on its way.", { duration: 2200 });
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "It sank in 1628. Don't get attached.",
      "Det sjönk 1628. Knyt inte an för mycket."
    );
  }

  function ikeaEgg() {
    if (window.smtFx) {
      window.smtFx.toast("📦 Some assembly required.", { duration: 2400 });
    }
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "Step 1: do not lose the small allen key. Step 2: there is no step 2.",
      "Steg 1: tappa inte bort den lilla insexnyckeln. Steg 2: det finns inget steg 2."
    );
  }

  function skalEgg() {
    if (window.smtFx) {
      const cx = innerWidth * 0.5, cy = innerHeight * 0.3;
      window.smtFx.burst(cx, cy, { colors: ["#fecc00", "#fff", "#fff3cf"], count: 24 });
      window.smtFx.toast("🥂 Skål!", { duration: 1800 });
    }
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "Eyes up. Glass up. Sip. Eyes again. That's the protocol.",
      "Ögonkontakt. Höj glaset. Klunk. Ögonkontakt igen. Så går det till."
    );
  }

  function lagomEgg() {
    if (window.smtFx) window.smtFx.toast("👌 Lagom.", { duration: 1800 });
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "Not too much. Not too little. Just right.",
      "Inte för mycket. Inte för lite. Precis lagom."
    );
  }

  // ---------- Click brand logo 5× → flag flutter ----------

  let brandClicks = 0; let brandClickTimer = null;
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".brand, .footer__brand")) return;
    brandClicks++;
    clearTimeout(brandClickTimer);
    brandClickTimer = setTimeout(() => { brandClicks = 0; }, 1500);
    if (brandClicks >= 5) {
      brandClicks = 0;
      flagFlutter();
    }
  });
  function flagFlutter() {
    if (reducedMotionEnabled()) {
      if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
        "Sweden mode. Hej hej.", "Sverige-läge. Hej hej."
      );
      return;
    }
    const flag = document.createElement("div");
    flag.style.cssText = `
      position: fixed; top: 40%; left: 50%;
      width: 240px; height: 150px;
      transform: translate(-50%, -50%);
      z-index: 96; pointer-events: none;
      background: #006aa7;
      box-shadow: 0 30px 80px -20px rgba(0,30,60,.45);
    `;
    flag.innerHTML = `
      <div style="position:absolute;top:0;bottom:0;left:88px;width:28px;background:#fecc00"></div>
      <div style="position:absolute;left:0;right:0;top:55px;height:28px;background:#fecc00"></div>
    `;
    document.body.appendChild(flag);
    flag.animate(
      [
        { transform: "translate(-50%, -50%) scale(.3) rotate(-12deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1, offset: .25 },
        { transform: "translate(-50%, -50%) scale(1.04) rotate(2deg) skewX(-3deg)", offset: .55 },
        { transform: "translate(-50%, -50%) scale(1.02) rotate(-1deg) skewX(2deg)", offset: .85 },
        { transform: "translate(-50%, -50%) scale(.95) rotate(0deg)", opacity: 0 },
      ],
      { duration: 2200, easing: "cubic-bezier(.3,.7,.4,1)" }
    ).onfinish = () => flag.remove();
    if (window.smtFx) window.smtFx.rain({ colors: ["#006aa7", "#fecc00"], count: 80 });
    if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
      "Sweden mode. Hej hej.", "Sverige-läge. Hej hej."
    );
  }

  // ---------- Konami → flag rain (kept from before) ----------

  const SEQ = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
  let kbuf = [];
  document.addEventListener("keydown", (e) => {
    if (isTyping()) return;
    kbuf.push(e.key.toLowerCase());
    if (kbuf.length > SEQ.length) kbuf.shift();
    if (kbuf.join(",") === SEQ.join(",")) {
      if (window.smtFx && !reducedMotionEnabled()) {
        window.smtFx.rain({ colors: ["#006aa7", "#fecc00"], count: 160 });
      }
      if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
        "Sweden mode activated.", "Sverige-läge aktiverat."
      );
      kbuf = [];
    }
  });

  // ---------- Triple-click → random Sweden fact ----------

  let clicks = 0; let clickTimer = null;
  document.addEventListener("click", (e) => {
    // skip clicks on real interactive elements
    if (e.target.closest("a, button, input, label, summary, .qopt, .quiz__opt, .nav, .modal, .dala-buddy")) return;
    clicks++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clicks = 0; }, 600);
    if (clicks >= 3) {
      clicks = 0;
      const facts = [
        ["Spotify, Skype, Minecraft, and Klarna were all started in Sweden.",
         "Spotify, Skype, Minecraft och Klarna startade alla i Sverige."],
        ["Sweden has been at peace since 1814.", "Sverige har varit i fred sedan 1814."],
        ["Sweden recycles ~99% of household waste.", "Sverige återvinner ~99% av hushållsavfallet."],
        ["~96,000 lakes. 200,000 islands.", "~96 000 sjöar. 200 000 öar."],
        ["IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.", "IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd."],
        ["480 days of paid parental leave per child.", "480 dagar betald föräldraledighet per barn."],
        ["Volvo invented the three-point seatbelt and gave the patent away.",
         "Volvo uppfann trepunktsbältet och gav bort patentet."],
      ];
      const f = facts[Math.floor(Math.random()*facts.length)];
      if (window.smtFx) window.smtFx.toast("💡 " + f[lang() === "sv" ? 1 : 0], { duration: 4200 });
    }
  });

  // ---------- "?" — easter eggs cheatsheet ----------

  function toggleCheatsheet() {
    let el = document.getElementById("smt-cheats");
    if (el) { el.remove(); return; }
    el = document.createElement("div");
    el.id = "smt-cheats";
    el.innerHTML = `
      <div class="cheats__panel">
        <button class="cheats__close" data-a11y-label="a11y.close">✕</button>
        <h3>Hidden things</h3>
        <ul>
          <li><kbd>fika</kbd> — coffee break</li>
          <li><kbd>abba</kbd> — disco</li>
          <li><kbd>snö</kbd> or <kbd>snow</kbd> — winter</li>
          <li><kbd>vasa</kbd> — a ship sails by</li>
          <li><kbd>ikea</kbd> — some assembly required</li>
          <li><kbd>skål</kbd> — cheers</li>
          <li><kbd>lagom</kbd> — just right</li>
          <li><b>5×</b> click brand logo — flag</li>
          <li><b>3×</b> click anywhere quiet — Sweden fact</li>
          <li><kbd>↑↑↓↓←→←→ b a</kbd> — Sweden mode</li>
          <li><kbd>?</kbd> — toggle this</li>
        </ul>
        <p class="cheats__foot">Hej hej.</p>
      </div>
    `;
    el.style.cssText =
      "position:fixed;inset:0;z-index:101;display:grid;place-items:center;background:rgba(11,31,51,.55);backdrop-filter:blur(4px)" +
      (reducedMotionEnabled() ? "" : ";animation:smt-cheats-in .18s ease-out");
    document.body.appendChild(el);
    if (window.smtUpdateStaticControlLabels) window.smtUpdateStaticControlLabels();
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest(".cheats__close")) el.remove();
    });
  }

  // ---------- Smooth in-page anchors ----------

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute("href");
    if (h.length <= 1) return;
    if (h.startsWith("#/")) return;
    const target = document.querySelector(h);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: reducedMotionEnabled() ? "auto" : "smooth",
      block: "start",
    });
  });

  window.addEventListener("DOMContentLoaded", setupReveal);
})();
