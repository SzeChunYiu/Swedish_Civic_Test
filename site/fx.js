/* Sveriges Medborgartest — Effects (confetti, shake, toast, count-up)
   No dependencies. Drop into any click handler.
*/

(function () {
  "use strict";

  // ---------- CONFETTI ----------
  // tiny coloured rectangles that fall + spin from (x,y). Self-cleaning.

  const PALETTES = {
    flag:   ["#006aa7", "#fecc00", "#ffffff"],
    win:    ["#1e874b", "#fecc00", "#006aa7", "#ffffff"],
    streak: ["#fecc00", "#ffb700", "#ffffff", "#006aa7"],
    big:    ["#006aa7", "#fecc00", "#bc1f2a", "#1e874b", "#ffffff", "#0b1f33"],
  };

  function burst(x, y, opts = {}) {
    const colors = opts.colors || PALETTES.flag;
    const count = opts.count || 28;
    const spread = opts.spread || 140;
    const layer = ensureLayer();
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("i");
      piece.className = "smt-confetti";
      const size = 4 + Math.random() * 7;
      piece.style.cssText = `
        position: absolute;
        left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size * 0.5}px;
        background: ${colors[i % colors.length]};
        border-radius: 1px;
        will-change: transform, opacity;
        pointer-events: none;
        transform: translate(-50%, -50%);
      `;
      layer.appendChild(piece);

      const angle = (Math.random() * Math.PI * 2);
      const speed = spread * (0.4 + Math.random() * 0.6);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed - spread * 0.3;
      const rot = (Math.random() - 0.5) * 720;
      const dur = 700 + Math.random() * 700;

      piece.animate(
        [
          { transform: `translate(-50%, -50%) rotate(0deg)`, opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy + 240}px)) rotate(${rot * 1.4}deg)`, opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(.2,.7,.3,1)" }
      ).onfinish = () => piece.remove();
    }
  }

  function rain(opts = {}) {
    // full-screen confetti from top
    const colors = opts.colors || PALETTES.big;
    const count = opts.count || 90;
    const layer = ensureLayer();
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("i");
      piece.className = "smt-confetti";
      const size = 6 + Math.random() * 8;
      const startX = Math.random() * w;
      piece.style.cssText = `
        position: absolute; left: ${startX}px; top: -20px;
        width: ${size}px; height: ${size * 0.5}px;
        background: ${colors[i % colors.length]};
        border-radius: 1px; will-change: transform, opacity; pointer-events: none;
      `;
      layer.appendChild(piece);
      const driftX = (Math.random() - 0.5) * 200;
      const rot = (Math.random() - 0.5) * 1080;
      const dur = 2400 + Math.random() * 2400;
      const delay = Math.random() * 1200;
      piece.animate(
        [
          { transform: `translate(0,0) rotate(0)`, opacity: 1 },
          { transform: `translate(${driftX}px, ${h + 80}px) rotate(${rot}deg)`, opacity: 1, offset: 0.85 },
          { transform: `translate(${driftX}px, ${h + 80}px) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: dur, delay, easing: "cubic-bezier(.3,.6,.4,1)" }
      ).onfinish = () => piece.remove();
    }
  }

  function ensureLayer() {
    let l = document.getElementById("smt-fx-layer");
    if (!l) {
      l = document.createElement("div");
      l.id = "smt-fx-layer";
      l.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:95;overflow:hidden";
      document.body.appendChild(l);
    }
    return l;
  }

  // ---------- SHAKE (element) ----------

  function shakeEl(el) {
    if (!el) return;
    el.classList.remove("smt-shake");
    void el.offsetWidth; // restart anim
    el.classList.add("smt-shake");
    setTimeout(() => el.classList.remove("smt-shake"), 500);
  }

  // ---------- FLOATING "+1" ----------

  function floatPlus(x, y, text = "+1", color = "#1e874b") {
    const layer = ensureLayer();
    const el = document.createElement("span");
    el.textContent = text;
    el.style.cssText = `
      position: absolute; left: ${x}px; top: ${y}px;
      transform: translate(-50%, -50%);
      font-family: "Bricolage Grotesque", system-ui, sans-serif;
      font-weight: 700; font-size: 24px;
      color: ${color};
      pointer-events: none;
      text-shadow: 0 1px 0 rgba(255,255,255,.8);
    `;
    layer.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%, -50%) scale(.6)", opacity: 0 },
        { transform: "translate(-50%, -70%) scale(1.2)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -160%) scale(1)", opacity: 0 },
      ],
      { duration: 1100, easing: "cubic-bezier(.2,.8,.3,1)" }
    ).onfinish = () => el.remove();
  }

  // ---------- TOAST (top, transient) ----------

  function toast(msg, opts = {}) {
    let host = document.getElementById("smt-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "smt-toast-host";
      host.style.cssText = "position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:96;pointer-events:none;display:flex;flex-direction:column;gap:8px;align-items:center";
      document.body.appendChild(host);
    }
    const t = document.createElement("div");
    t.className = "smt-toast" + (opts.flavor ? " smt-toast--" + opts.flavor : "");
    t.innerHTML = msg;
    host.appendChild(t);
    const dur = opts.duration ?? 2400;
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(-6px)";
      setTimeout(() => t.remove(), 250);
    }, dur);
  }

  // ---------- COUNT UP ----------

  function countUp(el, from, to, duration = 800) {
    if (!el) return;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- PUBLIC API ----------

  window.smtFx = { burst, rain, shakeEl, floatPlus, toast, countUp, PALETTES };
})();
