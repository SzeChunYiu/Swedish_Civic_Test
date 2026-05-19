/* Almost Swedish — Practice hub + mock exam
   - /practice           → chapter hub with per-chapter progress
   - /practice?c=N       → run a quiz for chapter N (handled by existing quiz)
   - /mock               → mock exam landing
   - /mock?run=1         → live mock exam (25Q, 30min timer, no per-Q feedback)
*/

(function () {
  "use strict";

  // ---------- helpers ----------

  function lang() { try { return localStorage.getItem("smt_lang") || "en"; } catch { return "en"; } }
  function tr(map) { return (map && (map[lang()] || map.en)) || ""; }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[c]));
  }
  function sourceCitation(question) {
    const sv = lang() === "sv";
    const source = question && question.source;
    if (!source) return sv ? "Källhänvisning saknas" : "Source citation unavailable";
    const title = source.title || "Sverige i fokus";
    if (!source.chapter || !source.section || source.page === undefined || source.page === null) {
      return sv ? "Källhänvisning saknas" : "Source citation unavailable";
    }
    return sv
      ? `Källa: ${title}, ${source.chapter}, ${source.section}, s. ${source.page}`
      : `Source: ${title}, ${source.chapter}, ${source.section}, p. ${source.page}`;
  }
  function questionReviewDisclaimer() {
    return lang() === "sv"
      ? "Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga."
      : "Independent study practice, not a real exam or an official UHR question.";
  }
  function hashString(value) {
    let hash = 2166136261;
    const text = String(value ?? "");
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function seededRandom(seed) {
    let state = seed >>> 0;
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function questionShuffleKey(question) {
    if (!question) return "";
    if (question.id) return question.id;
    if (question.q && (question.q.en || question.q.sv)) return question.q.en || question.q.sv;
    return JSON.stringify(question.q || question.opts || "");
  }
  function shouldShuffleOptions(question) {
    return (
      question &&
      question.type === "single_choice" &&
      Array.isArray(question.opts) &&
      question.opts.length > 2
    );
  }
  function localDisplayOptions(question, sessionId) {
    const options = Array.isArray(question && question.opts) ? question.opts : [];
    const order = options.map((_, index) => index);
    if (shouldShuffleOptions(question)) {
      const seed = hashString(`${questionShuffleKey(question)}:${sessionId || "default"}`);
      const random = seededRandom(seed);
      for (let index = order.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
      }
      if (order.every((originalIndex, displayIndex) => originalIndex === displayIndex)) {
        const offset = 1 + (seed % (order.length - 1));
        return order.slice(offset).concat(order.slice(0, offset)).map((originalIndex, displayIndex) => ({
          displayIndex,
          originalIndex,
          option: options[originalIndex],
        }));
      }
    }
    return order.map((originalIndex, displayIndex) => ({
      displayIndex,
      originalIndex,
      option: options[originalIndex],
    }));
  }
  function displayOptions(question, sessionId) {
    if (typeof window.smtQuizDisplayOptions === "function") {
      return window.smtQuizDisplayOptions(question, sessionId);
    }
    return localDisplayOptions(question, sessionId);
  }

  function getProgress() {
    try { return JSON.parse(localStorage.getItem("smt_progress") || "{}"); } catch { return {}; }
  }
  function saveProgress(p) { try { localStorage.setItem("smt_progress", JSON.stringify(p)); } catch {} }

  // For external code (the quiz) to call after each answer
  window.smtRecordAnswer = function (chapterId, correct) {
    const p = getProgress();
    const k = "ch" + chapterId;
    p[k] = p[k] || { answered: 0, correct: 0 };
    p[k].answered++;
    if (correct) p[k].correct++;
    saveProgress(p);
  };

  // Mock exam history
  function getMockHistory() {
    try { return JSON.parse(localStorage.getItem("smt_mocks") || "[]"); } catch { return []; }
  }
  function pushMock(entry) {
    const h = getMockHistory();
    h.unshift(entry);
    try { localStorage.setItem("smt_mocks", JSON.stringify(h.slice(0, 8))); } catch {}
  }

  // ---------- chapter hub ----------

  function chapterQuestionCount(id) {
    return (window.SMT_QUESTIONS || []).filter((q) => q.chapterId === id).length;
  }

  function renderPracticeHub() {
    const stage = document.getElementById("quiz-stage");
    if (!stage) return;
    const progress = getProgress();
    const meta = window.SMT_CHAPTERS_META || [];

    const totalQ = (window.SMT_QUESTIONS || []).length;
    const totalAnswered = Object.values(progress).reduce((s, p) => s + (p.answered || 0), 0);
    const totalCorrect  = Object.values(progress).reduce((s, p) => s + (p.correct  || 0), 0);
    const overallPct = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const cards = meta.map((c) => {
      const p = progress["ch" + c.id] || { answered: 0, correct: 0 };
      const total = chapterQuestionCount(c.id);
      const pct = total ? Math.min(100, Math.round((p.answered / total) * 100)) : 0;
      const accuracy = p.answered ? Math.round((p.correct / p.answered) * 100) : null;
      return `
        <a class="hub__card" href="#/practice?c=${c.id}">
          <div class="hub__row">
            <span class="hub__emoji" aria-hidden="true">${c.emoji}</span>
            <span class="hub__num">CH ${String(c.id).padStart(2, "0")}</span>
            ${accuracy !== null ? `<span class="hub__acc">${accuracy}%</span>` : ""}
          </div>
          <h3 class="hub__title">${tr(c.title)}</h3>
          <div class="hub__bar"><i style="width:${pct}%"></i></div>
          <div class="hub__meta">
            <span>${p.answered}/${total} ${lang() === "sv" ? "besvarade" : "answered"}</span>
            ${p.correct ? `<span>${p.correct} ${lang() === "sv" ? "rätt" : "correct"}</span>` : ""}
          </div>
        </a>
      `;
    }).join("");

    const sv = lang() === "sv";
    stage.innerHTML = `
      <div class="hub">
        <div class="hub__stats">
          <div>
            <span class="hub__statlabel">${sv ? "Totalt" : "Total"}</span>
            <b class="hub__statvalue">${totalAnswered}</b>
            <span class="hub__statof">/ ${totalQ}</span>
          </div>
          <div>
            <span class="hub__statlabel">${sv ? "Träffsäkerhet" : "Accuracy"}</span>
            <b class="hub__statvalue">${overallPct}%</b>
          </div>
          <div>
            <span class="hub__statlabel">${sv ? "Snabb runda" : "Quick round"}</span>
            <a class="hub__quickbtn" href="#/practice?c=mix">${sv ? "10 slumpade" : "10 random"} →</a>
          </div>
          <div>
            <span class="hub__statlabel">${sv ? "Skarp tentamen" : "Mock exam"}</span>
            <a class="hub__quickbtn hub__quickbtn--gold" href="#/mock">${sv ? "Starta" : "Start"} →</a>
          </div>
        </div>

        <h2 class="hub__h2">${sv ? "Välj kapitel" : "Pick a chapter"}</h2>
        <div class="hub__grid">${cards}</div>

        <p class="hub__hint">${sv
          ? "Tips: Övning lagrar dina framsteg lokalt. Inget konto behövs."
          : "Tip: progress is saved on this device. No account needed."
        }</p>
      </div>
    `;
  }
  window.smtRenderPracticeHub = renderPracticeHub;

  // ---------- mock exam ----------

  const MOCK_DEFAULTS = { count: 25, minutes: 30, chapters: "all" };
  function loadMockCfg() {
    try { return Object.assign({}, MOCK_DEFAULTS, JSON.parse(localStorage.getItem("smt_mock_cfg") || "{}")); }
    catch { return Object.assign({}, MOCK_DEFAULTS); }
  }
  function saveMockCfg(cfg) {
    try { localStorage.setItem("smt_mock_cfg", JSON.stringify(cfg)); } catch {}
  }

  function pickMockQuestions() {
    const cfg = loadMockCfg();
    let all = (window.SMT_QUESTIONS || []).slice();
    if (cfg.chapters && cfg.chapters !== "all" && Array.isArray(cfg.chapters)) {
      const set = new Set(cfg.chapters.map(Number));
      all = all.filter((q) => set.has(q.chapterId));
    }
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, Math.min(cfg.count, all.length));
  }

  const MOCK = {
    questions: [],
    answers: [],
    i: 0,
    startedAt: 0,
    endsAt: 0,
    timerId: null,
    submitted: false,
  };

  function isOnMock() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    return hash.startsWith("/mock");
  }
  function mockIsRunning() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    return /[?&]run=1/.test(hash);
  }

  function mockBoot() {
    if (!isOnMock()) return;
    const stage = document.getElementById("mock-stage");
    if (!stage) return;
    if (!mockIsRunning()) {
      renderMockLanding();
      return;
    }
    // running
    if (!MOCK.questions.length || MOCK.submitted) startMock();
    else renderMockExam();
  }

  function renderMockLanding() {
    const stage = document.getElementById("mock-stage");
    const sv = lang() === "sv";
    const history = getMockHistory();
    const cfg = loadMockCfg();
    const meta = window.SMT_CHAPTERS_META || [];
    const allChapters = meta.map((c) => c.id);
    const selectedChapters = (cfg.chapters === "all" || !cfg.chapters) ? allChapters : cfg.chapters.map(Number);

    const maxQ = Math.min(60, (window.SMT_QUESTIONS || []).filter((q) => {
      if (cfg.chapters === "all" || !cfg.chapters) return true;
      return selectedChapters.includes(q.chapterId);
    }).length);

    const chapterChips = meta.map((c) => {
      const on = selectedChapters.includes(c.id);
      return `<button class="mock-chip ${on ? "is-on" : ""}" data-chip="${c.id}">
        <span class="mock-chip__emoji">${c.emoji}</span>
        <span class="mock-chip__num">CH ${String(c.id).padStart(2, "0")}</span>
        <span class="mock-chip__t">${(c.title[lang()] || c.title.en)}</span>
      </button>`;
    }).join("");

    const histHtml = history.length ? `
      <div class="mock-history">
        <h3>${sv ? "Tidigare försök" : "Past attempts"}</h3>
        <ul>
          ${history.map((m) => `
            <li>
              <span class="mock-history__date">${new Date(m.t).toLocaleDateString(lang())}</span>
              <span class="mock-history__score">${m.correct}/${m.total}</span>
              <span class="mock-history__pct ${m.pct >= 75 ? "pass" : "fail"}">${m.pct}%</span>
              <span class="mock-history__verdict">${m.pct >= 75 ? (sv ? "Godkänt" : "Pass") : (sv ? "Underkänt" : "Fail")}</span>
            </li>`).join("")}
        </ul>
      </div>` : "";

    stage.innerHTML = `
      <div class="mock-landing">
        <div class="mock-landing__inner">
          <span class="eyebrow">${sv ? "Skarp tentamen" : "Mock exam"}</span>
          <h1 class="practice__title">
            <span>${sv ? "Bygg din tentamen." : "Build your exam."}</span>
          </h1>
          <p class="mock-landing__lede">${sv
            ? "Välj antal frågor, tid och vilka kapitel du vill testas på. Vi blandar och slumpar resten."
            : "Pick the question count, timer, and which chapters to include. We'll shuffle the rest."}</p>

          <div class="mock-cfg">
            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${sv ? "Frågor" : "Questions"}</span>
                <output id="cfg-count-out">${cfg.count}</output>
              </label>
              <input type="range" id="cfg-count" min="5" max="${maxQ}" step="1" value="${Math.min(cfg.count, maxQ)}" />
              <div class="mock-cfg__hint">${sv ? "Max" : "Max"} ${maxQ}</div>
            </div>

            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${sv ? "Tid" : "Time"}</span>
                <output id="cfg-min-out">${cfg.minutes} ${sv ? "min" : "min"}</output>
              </label>
              <input type="range" id="cfg-min" min="2" max="90" step="1" value="${cfg.minutes}" />
              <div class="mock-cfg__hint">${sv ? "Riktigt provet är 60 min" : "Real exam is 60 min"}</div>
            </div>

            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${sv ? "Kapitel" : "Chapters"}</span>
                <span class="mock-cfg__select-actions">
                  <button class="mock-cfg__link" id="cfg-all">${sv ? "Alla" : "All"}</button>
                  <button class="mock-cfg__link" id="cfg-none">${sv ? "Inga" : "None"}</button>
                </span>
              </label>
              <div class="mock-chapters">${chapterChips}</div>
            </div>

            <div class="mock-cfg__meta">
              <span><b>${sv ? "Godkänt" : "Pass"}</b> 75%</span>
              <span><b>${sv ? "Ingen återkoppling" : "No feedback"}</b> ${sv ? "förrän inlämnat" : "until submit"}</span>
              <span><b>${sv ? "Lokalt sparat" : "Saved locally"}</b></span>
            </div>
          </div>

          <div class="mock-landing__cta">
            <a class="btn btn--gold" href="#/mock?run=1" id="cfg-start">${sv ? "Starta tentamen" : "Start exam"} →</a>
            <a class="btn btn--ghost" href="#/practice">${sv ? "Öva först" : "Practice first"}</a>
            <button class="mock-cfg__link" id="cfg-reset">${sv ? "Återställ" : "Reset to defaults"}</button>
          </div>

          ${histHtml}
        </div>
      </div>
    `;

    // wire config controls
    const out1 = document.getElementById("cfg-count-out");
    const out2 = document.getElementById("cfg-min-out");
    const startBtn = document.getElementById("cfg-start");

    function refreshCounts() {
      const cfgNow = loadMockCfg();
      const sel = (cfgNow.chapters === "all" || !cfgNow.chapters) ? allChapters : cfgNow.chapters.map(Number);
      const available = (window.SMT_QUESTIONS || []).filter((q) => sel.includes(q.chapterId)).length;
      const slider = document.getElementById("cfg-count");
      if (!slider) return;
      slider.max = String(Math.max(5, available));
      if (parseInt(slider.value, 10) > available) slider.value = String(available);
      out1.textContent = slider.value;
      const hint = slider.closest(".mock-cfg__row").querySelector(".mock-cfg__hint");
      if (hint) hint.textContent = (sv ? "Max " : "Max ") + available;
      if (startBtn) {
        startBtn.classList.toggle("is-disabled", available < 5);
      }
    }

    document.getElementById("cfg-count").addEventListener("input", (e) => {
      out1.textContent = e.target.value;
      const cur = loadMockCfg();
      saveMockCfg(Object.assign(cur, { count: parseInt(e.target.value, 10) }));
    });
    document.getElementById("cfg-min").addEventListener("input", (e) => {
      out2.textContent = e.target.value + (sv ? " min" : " min");
      const cur = loadMockCfg();
      saveMockCfg(Object.assign(cur, { minutes: parseInt(e.target.value, 10) }));
    });
    stage.querySelectorAll(".mock-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("is-on");
        const ons = Array.from(stage.querySelectorAll(".mock-chip.is-on")).map((c) => parseInt(c.dataset.chip, 10));
        const cur = loadMockCfg();
        cur.chapters = ons.length === allChapters.length ? "all" : ons;
        saveMockCfg(cur);
        refreshCounts();
      });
    });
    document.getElementById("cfg-all").addEventListener("click", () => {
      stage.querySelectorAll(".mock-chip").forEach((c) => c.classList.add("is-on"));
      const cur = loadMockCfg(); cur.chapters = "all"; saveMockCfg(cur); refreshCounts();
    });
    document.getElementById("cfg-none").addEventListener("click", () => {
      stage.querySelectorAll(".mock-chip").forEach((c) => c.classList.remove("is-on"));
      const cur = loadMockCfg(); cur.chapters = []; saveMockCfg(cur); refreshCounts();
    });
    document.getElementById("cfg-reset").addEventListener("click", () => {
      saveMockCfg(Object.assign({}, MOCK_DEFAULTS));
      renderMockLanding();
    });
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        if (startBtn.classList.contains("is-disabled")) e.preventDefault();
      });
    }
    refreshCounts();
  }

  function startMock() {
    const cfg = loadMockCfg();
    MOCK.questions = pickMockQuestions();
    MOCK.answers = new Array(MOCK.questions.length).fill(null);
    MOCK.i = 0;
    MOCK.startedAt = Date.now();
    MOCK.endsAt = MOCK.startedAt + cfg.minutes * 60 * 1000;
    MOCK.submitted = false;
    clearInterval(MOCK.timerId);
    MOCK.timerId = setInterval(tickMockTimer, 1000);
    renderMockExam();
  }

  function tickMockTimer() {
    if (MOCK.submitted) { clearInterval(MOCK.timerId); return; }
    const left = Math.max(0, MOCK.endsAt - Date.now());
    const el = document.getElementById("mock-timer");
    if (el) {
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      el.textContent = `${m}:${s.toString().padStart(2, "0")}`;
      el.classList.toggle("is-low", left < 5 * 60 * 1000);
    }
    if (left <= 0) submitMock();
  }

  function renderMockExam() {
    const stage = document.getElementById("mock-stage");
    if (!stage || !MOCK.questions.length) return;
    const sv = lang() === "sv";

    if (MOCK.submitted) { renderMockResult(); return; }

    const i = MOCK.i;
    const q = MOCK.questions[i];
    const n = MOCK.questions.length;
    const chosen = MOCK.answers[i];

    const dots = MOCK.questions.map((_, k) => {
      const cls = k === i ? "is-on" : (MOCK.answers[k] !== null ? "is-done" : "");
      return `<button class="mock-dot ${cls}" data-go="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`;
    }).join("");

    const opts = displayOptions(q, `mock:${MOCK.startedAt || "preview"}:${i}`).map(({ option: o, originalIndex, displayIndex }) => {
      const cls = chosen === originalIndex ? "is-chosen" : "";
      return `
        <button class="mock-opt ${cls}" data-pick="${originalIndex}">
          <span class="key">${String.fromCharCode(65 + displayIndex)}</span>
          <span>${o[lang()] || o.en}</span>
        </button>
      `;
    }).join("");

    const answered = MOCK.answers.filter((a) => a !== null).length;

    stage.innerHTML = `
      <div class="mock-shell">
        <header class="mock-bar">
          <div class="mock-bar__title">
            <span class="eyebrow">${sv ? "Skarp tentamen" : "Mock exam"}</span>
            <span class="mock-bar__counter">${i + 1} / ${n}</span>
          </div>
          <div class="mock-bar__timer">
            <span class="mock-bar__timerlabel">${sv ? "Återstår" : "Time left"}</span>
            <span class="mock-timer" id="mock-timer">--:--</span>
          </div>
          <button class="btn btn--ghost btn--sm" id="mock-submit">${sv ? "Lämna in" : "Submit"}</button>
        </header>

        <div class="mock-grid" aria-label="${sv ? "Frågenavigering" : "Question navigation"}">${dots}</div>

        <div class="mock-card">
          <div class="quiz__crumb">Ch ${q.chapterId}</div>
          <h2 class="quiz__q">${q.q[lang()] || q.q.en}</h2>
          <p class="quiz__source">${escapeHtml(sourceCitation(q))}</p>
          <p class="quiz__disclaimer">${escapeHtml(questionReviewDisclaimer())}</p>
          <div class="quiz__opts">${opts}</div>
        </div>

        <div class="mock-actions">
          <button class="btn btn--ghost" id="mock-prev" ${i === 0 ? "disabled" : ""}>← ${sv ? "Föregående" : "Previous"}</button>
          <span class="mock-actions__progress">${answered} / ${n} ${sv ? "besvarade" : "answered"}</span>
          <button class="btn btn--gold" id="mock-next" ${i === n - 1 ? "disabled" : ""}>${sv ? "Nästa" : "Next"} →</button>
        </div>
      </div>
    `;
    tickMockTimer();
  }

  function submitMock() {
    if (MOCK.submitted) return;
    MOCK.submitted = true;
    clearInterval(MOCK.timerId);
    const total = MOCK.questions.length;
    const correct = MOCK.questions.reduce((s, q, i) => s + (MOCK.answers[i] === q.answer ? 1 : 0), 0);
    const pct = Math.round((correct / total) * 100);
    pushMock({ t: Date.now(), total, correct, pct, duration: Date.now() - MOCK.startedAt });
    // also fold into chapter progress
    MOCK.questions.forEach((q, i) => {
      if (MOCK.answers[i] !== null) {
        window.smtRecordAnswer(q.chapterId, MOCK.answers[i] === q.answer);
      }
    });
    renderMockResult();
  }

  function renderMockResult() {
    const stage = document.getElementById("mock-stage");
    if (!stage) return;
    const sv = lang() === "sv";
    const total = MOCK.questions.length;
    const correct = MOCK.questions.reduce((s, q, i) => s + (MOCK.answers[i] === q.answer ? 1 : 0), 0);
    const pct = Math.round((correct / total) * 100);
    const pass = pct >= 75;

    // by chapter
    const byCh = {};
    MOCK.questions.forEach((q, i) => {
      const c = q.chapterId;
      byCh[c] = byCh[c] || { total: 0, correct: 0 };
      byCh[c].total++;
      if (MOCK.answers[i] === q.answer) byCh[c].correct++;
    });

    const chapterRows = Object.entries(byCh).sort((a, b) => +a[0] - +b[0]).map(([id, s]) => {
      const meta = (window.SMT_CHAPTERS_META || []).find((m) => m.id === +id);
      const cpct = Math.round((s.correct / s.total) * 100);
      return `
        <li>
          <span class="result-ch__num">CH ${String(id).padStart(2, "0")}</span>
          <span class="result-ch__title">${meta ? tr(meta.title) : ""}</span>
          <span class="result-ch__score">${s.correct}/${s.total}</span>
          <span class="result-ch__bar"><i style="width:${cpct}%"></i></span>
        </li>
      `;
    }).join("");
    const reviewRows = MOCK.questions.map((q, i) => {
      const picked = MOCK.answers[i];
      const isCorrect = picked === q.answer;
      const selectedText = picked === null
        ? (sv ? "Inte besvarad" : "Not answered")
        : tr(q.opts[picked]);
      const correctText = tr(q.opts[q.answer]);
      return `
        <details class="mock-review__item ${isCorrect ? "is-correct" : "is-wrong"}">
          <summary>
            <span>${sv ? "Fråga" : "Question"} ${i + 1}</span>
            <b>${isCorrect ? (sv ? "Rätt" : "Correct") : (sv ? "Fel" : "Needs review")}</b>
          </summary>
          <div class="mock-review__body">
            <p class="mock-review__q">${escapeHtml(tr(q.q))}</p>
            <dl>
              <div>
                <dt>${sv ? "Ditt svar" : "Your answer"}</dt>
                <dd>${escapeHtml(selectedText)}</dd>
              </div>
              <div>
                <dt>${sv ? "Rätt svar" : "Correct answer"}</dt>
                <dd>${escapeHtml(correctText)}</dd>
              </div>
            </dl>
            <p class="mock-review__why">${escapeHtml(tr(q.why))}</p>
            <p class="mock-review__source">${escapeHtml(sourceCitation(q))}</p>
            <p class="mock-review__disclaimer">${escapeHtml(questionReviewDisclaimer())}</p>
          </div>
        </details>
      `;
    }).join("");

    stage.innerHTML = `
      <div class="mock-result ${pass ? "is-pass" : "is-fail"}">
        <span class="eyebrow">${sv ? "Resultat" : "Result"}</span>
        <p class="quiz__score">
          <span id="mock-score-num">0</span><em>/</em>${total}
        </p>
        <h2 class="mock-result__verdict">${pass ? (sv ? "Godkänt." : "You passed.") : (sv ? "Underkänt." : "Not yet.")}</h2>
        <p class="mock-result__pct">${pct}% — ${sv ? "godkänt-gräns" : "passing line"} 75%</p>

        <ul class="result-chapters">${chapterRows}</ul>
        <section class="mock-review" aria-label="${sv ? "Frågegenomgång" : "Question review"}">
          <h3>${sv ? "Frågegenomgång" : "Question review"}</h3>
          ${reviewRows}
        </section>

        <div class="quiz__cta">
          <a class="btn btn--ghost" href="#/mock?run=1">${sv ? "Försök igen" : "Try again"} ↻</a>
          <a class="btn btn--gold" href="#/practice">${sv ? "Studera mer" : "Study more"} →</a>
        </div>
      </div>
    `;

    if (window.smtFx) {
      window.smtFx.countUp(document.getElementById("mock-score-num"), 0, correct, 1100);
      if (pass) {
        setTimeout(() => window.smtFx.rain({ colors: window.smtFx.PALETTES.big, count: 90 }), 300);
        if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(
          `${pct}%. Lysande.`, `${pct}%. Lysande.`
        );
      } else if (window.smtBuddyConsole) {
        window.smtBuddyConsole(
          "75% next time. Drill the weak chapters first.",
          "75% nästa gång. Öva svaga kapitel först."
        );
      }
    }
  }

  // ---------- routing hooks ----------

  function activePracticeChapter() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const m = hash.match(/[?&]c=([^&]+)/);
    return m ? m[1] : null;
  }
  function isOnPractice() {
    return (location.hash || "#/").replace(/^#/, "").split("?")[0] === "/practice";
  }

  // tell the existing quiz which questions to use, then let it render
  window.smtPracticeFilterFor = function () {
    const c = activePracticeChapter();
    if (!c) return null;
    if (c === "mix") {
      // random 10 from any chapter
      const all = (window.SMT_QUESTIONS || []).slice();
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all.slice(0, 10);
    }
    const chId = parseInt(c, 10);
    if (isNaN(chId)) return null;
    return (window.SMT_QUESTIONS || []).filter((q) => q.chapterId === chId);
  };

  // re-render hub when we return to /practice without ?c=
  function onRoute() {
    if (isOnPractice() && !activePracticeChapter()) {
      renderPracticeHub();
    }
    if (isOnMock()) {
      mockBoot();
    }
  }

  function rerenderForLanguageChange() {
    if (isOnPractice()) {
      if (activePracticeChapter()) {
        if (typeof window.smtQuizRender === "function") window.smtQuizRender();
      } else {
        renderPracticeHub();
      }
    }
    if (!isOnMock()) return;
    if (!mockIsRunning()) {
      renderMockLanding();
    } else if (MOCK.submitted) {
      renderMockResult();
    } else if (MOCK.questions.length) {
      renderMockExam();
    } else {
      mockBoot();
    }
  }

  document.addEventListener("click", (e) => {
    const pick = e.target.closest("#mock-stage .mock-opt");
    if (pick) {
      MOCK.answers[MOCK.i] = parseInt(pick.dataset.pick, 10);
      renderMockExam();
      return;
    }
    const go = e.target.closest("#mock-stage .mock-dot");
    if (go) { MOCK.i = parseInt(go.dataset.go, 10); renderMockExam(); return; }
    if (e.target.closest("#mock-prev")) { MOCK.i = Math.max(0, MOCK.i - 1); renderMockExam(); return; }
    if (e.target.closest("#mock-next")) { MOCK.i = Math.min(MOCK.questions.length - 1, MOCK.i + 1); renderMockExam(); return; }
    if (e.target.closest("#mock-submit")) {
      const unanswered = MOCK.answers.filter((a) => a === null).length;
      const sv = lang() === "sv";
      const msg = unanswered
        ? (sv
            ? `Du har ${unanswered} obesvarade frågor. Lämna in ändå?`
            : `You have ${unanswered} unanswered questions. Submit anyway?`)
        : (sv ? "Lämna in?" : "Submit?");
      if (confirm(msg)) submitMock();
      return;
    }
  });

  window.addEventListener("hashchange", onRoute);
  window.addEventListener("DOMContentLoaded", onRoute);
  window.addEventListener("smt:languagechange", rerenderForLanguageChange);

  // Re-render hub when language changes
  document.addEventListener("click", (e) => {
    if (e.target.closest(".lang button[data-lang]") || e.target.closest(".lang-menu button[data-lang]") || e.target.closest('[data-set="language"], select[data-set="language"]')) {
      setTimeout(() => { if (isOnPractice() && !activePracticeChapter()) renderPracticeHub(); }, 60);
    }
  });
})();
