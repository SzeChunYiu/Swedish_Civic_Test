/* Almost Swedish — v1.1 dashboard features
 *
 * Ports readiness score, weekly recap, streak-with-freeze, and weak
 * chapters into the static site using the existing localStorage schema:
 *   smt_progress : { "ch<id>": { answered, correct } }
 *   smt_mocks    : [{ t, total, correct, pct, duration }, …]
 *   smt_streak   : { days, lastDate, activeDays, answeredThisWeek }
 *   smt_freeze   : { available, lastEarnedWeek, lifetimeSpent, rescuedDays[] }
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ utils */

  function clamp01(v) { return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }

  function localDateKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function mondayOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  function prevDayKey(key) {
    const d = new Date(key + 'T00:00:00Z');
    return localDateKey(new Date(d.getTime() - 86400000));
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------- storage helpers */

  function getProgress() {
    try { return JSON.parse(localStorage.getItem('smt_progress') || '{}'); } catch { return {}; }
  }

  function getMocks() {
    try { return JSON.parse(localStorage.getItem('smt_mocks') || '[]'); } catch { return []; }
  }

  function getStreak() {
    try { return JSON.parse(localStorage.getItem('smt_streak') || 'null'); } catch { return null; }
  }

  function getFreeze() {
    try {
      return JSON.parse(localStorage.getItem('smt_freeze') || 'null') || {
        available: 1, lastEarnedWeek: localDateKey(mondayOfWeek(new Date())),
        lifetimeSpent: 0, rescuedDays: []
      };
    } catch {
      return { available: 1, lastEarnedWeek: localDateKey(mondayOfWeek(new Date())), lifetimeSpent: 0, rescuedDays: [] };
    }
  }

  function saveFreeze(f) {
    try { localStorage.setItem('smt_freeze', JSON.stringify(f)); } catch {}
  }

  /* ----------------------------------------------- streak with freeze */

  function computeStreakWithFreeze() {
    const now = new Date();
    const today = localDateKey(now);
    const saved = getStreak();
    const activeDaySet = new Set();

    if (saved && Array.isArray(saved.activeDays)) {
      saved.activeDays.forEach(function (d) { activeDaySet.add(d); });
    }

    let freeze = getFreeze();
    const currentWeekKey = localDateKey(mondayOfWeek(now));

    // Refill: 1 freeze per week, cap 4.
    if (freeze.lastEarnedWeek !== currentWeekKey) {
      const lastMs = new Date(freeze.lastEarnedWeek + 'T00:00:00Z').getTime();
      const weeksElapsed = Math.floor((mondayOfWeek(now).getTime() - lastMs) / (7 * 86400000));
      const earned = Math.min(weeksElapsed, 4 - freeze.available);
      if (earned > 0) {
        freeze = Object.assign({}, freeze, {
          available: freeze.available + earned,
          lastEarnedWeek: currentWeekKey
        });
        saveFreeze(freeze);
      }
    }

    (freeze.rescuedDays || []).forEach(function (d) { activeDaySet.add(d); });

    let cursor = activeDaySet.has(today) ? today : prevDayKey(today);
    let streakDays = 0;
    let available = freeze.available;
    const rescuedThisRun = [];

    for (let i = 0; i < 365; i++) {
      if (activeDaySet.has(cursor)) {
        streakDays++;
        cursor = prevDayKey(cursor);
        continue;
      }
      if (available <= 0) break;
      const prev = prevDayKey(cursor);
      if (!activeDaySet.has(prev)) break;
      available--;
      rescuedThisRun.push(cursor);
      streakDays++;
      cursor = prev;
    }

    if (rescuedThisRun.length > 0) {
      freeze = Object.assign({}, freeze, {
        available: available,
        lifetimeSpent: freeze.lifetimeSpent + rescuedThisRun.length,
        rescuedDays: (freeze.rescuedDays || []).concat(rescuedThisRun)
      });
      saveFreeze(freeze);
    }

    return { streakDays: streakDays, freeze: freeze, rescuedThisRun: rescuedThisRun };
  }

  /* ----------------------------------------------- readiness score */

  function computeReadiness() {
    const progress = getProgress();
    const mocks = getMocks();
    const chapters = window.SMT_CHAPTERS_META || [];

    let totalAnswered = 0;
    let totalCorrect = 0;
    Object.keys(progress).forEach(function (key) {
      const ch = progress[key];
      totalAnswered += ch.answered || 0;
      totalCorrect += ch.correct || 0;
    });

    const accuracy = totalAnswered === 0 ? 0 : clamp01(totalCorrect / totalAnswered);
    const chaptersWithAnswers = Object.keys(progress).filter(function (k) {
      return (progress[k].answered || 0) > 0;
    }).length;
    const coverage = chapters.length === 0 ? 0 : clamp01(chaptersWithAnswers / chapters.length);

    const streak = getStreak();
    const today = localDateKey(new Date());
    const recency = (streak && streak.lastDate)
      ? clamp01(1 - Math.abs(new Date() - new Date(streak.lastDate + 'T00:00:00')) / (14 * 86400000))
      : 0;

    const recentMocks = mocks.slice(0, 3);
    const mockAvg = recentMocks.length === 0 ? 0 :
      clamp01(recentMocks.reduce(function (s, m) { return s + (m.pct || 0); }, 0) / (recentMocks.length * 100));

    const hasMocks = mocks.length > 0;
    const w = hasMocks
      ? { accuracy: 0.35, coverage: 0.25, recency: 0.1, mock: 0.3 }
      : { accuracy: 0.55, coverage: 0.3, recency: 0.15, mock: 0 };

    const score = Math.round(clamp01(
      accuracy * w.accuracy + coverage * w.coverage + recency * w.recency + mockAvg * w.mock
    ) * 100);

    const verdict =
      score < 50 ? 'not_ready_yet' :
      score < 70 ? 'getting_there' :
      score < 85 ? 'almost_ready' : 'strong_preparation';

    return {
      score: score,
      verdict: verdict,
      isSparse: totalAnswered < 30,
      components: { accuracy: accuracy, coverage: coverage, recency: recency, mockAverage: mockAvg }
    };
  }

  /* ----------------------------------------------- weekly recap */

  function computeWeeklyRecap() {
    const progress = getProgress();
    const mocks = getMocks();
    const now = new Date();
    const weekStartT = mondayOfWeek(now).getTime();
    const weekEndT = weekStartT + 7 * 86400000;

    let totalA = 0, correctA = 0;
    Object.values(progress).forEach(function (ch) {
      totalA += ch.answered || 0;
      correctA += ch.correct || 0;
    });

    const chaptersTouched = Object.keys(progress).filter(function (k) {
      return (progress[k].answered || 0) > 0;
    }).length;

    const mocksThisWeek = mocks.filter(function (m) {
      return m.t && m.t >= weekStartT && m.t < weekEndT;
    });
    const bestMock = mocksThisWeek.length > 0
      ? mocksThisWeek.reduce(function (b, m) { return m.pct > b ? m.pct : b; }, 0)
      : null;

    const unresolvedMistakes = Object.values(progress).filter(function (ch) {
      return ch.answered > 0 && ch.correct < ch.answered;
    }).length;

    return {
      questionsAnswered: totalA,
      accuracy: totalA === 0 ? null : correctA / totalA,
      chaptersTouched: chaptersTouched,
      mockExamsTaken: mocksThisWeek.length,
      bestMockScore: bestMock,
      unresolvedMistakes: unresolvedMistakes,
    };
  }

  /* ----------------------------------------------- weak chapters */

  function computeWeakChapters(n) {
    n = n || 3;
    const progress = getProgress();
    const chapters = window.SMT_CHAPTERS_META || [];

    return chapters.map(function (ch) {
      const key = 'ch' + ch.id;
      const data = progress[key] || { answered: 0, correct: 0 };
      const accuracy = data.answered === 0 ? null : data.correct / data.answered;
      const coverage = ch.questionCount > 0 ? Math.min(1, data.answered / ch.questionCount) : 0;
      const isSparse = data.answered < 5;
      const eff = accuracy === null ? 0.5 : isSparse ? 0.5 : accuracy;
      return {
        id: ch.id,
        title: ch.title || ('Chapter ' + ch.id),
        accuracy: accuracy,
        answers: data.answered,
        weaknessScore: 0.7 * (1 - eff) + 0.3 * (1 - coverage),
        isSparse: isSparse
      };
    })
    .sort(function (a, b) { return b.weaknessScore - a.weaknessScore; })
    .slice(0, n);
  }

  /* ----------------------------------------------- UI rendering */

  const VERDICT_COPY = {
    en: { not_ready_yet: 'Keep going', getting_there: 'Getting there', almost_ready: 'Almost ready', strong_preparation: 'Strong prep' },
    sv: { not_ready_yet: 'Fortsätt öva', getting_there: 'På god väg', almost_ready: 'Nästan redo', strong_preparation: 'Stark förberedelse' }
  };
  const VERDICT_COLOR = {
    not_ready_yet: '#e05b2e', getting_there: '#d4930a', almost_ready: '#2e86c1', strong_preparation: '#1aae39'
  };

  function lang() { try { return localStorage.getItem('smt_lang') || 'en'; } catch { return 'en'; } }
  function pct(v) { return Math.round(v * 100) + '%'; }

  function renderDashboard() {
    const el = document.getElementById('v11-dashboard');
    if (!el) return;

    const progress = getProgress();
    const hasAnyProgress = Object.values(progress).some(function (ch) { return (ch.answered || 0) > 0; });

    if (!hasAnyProgress) { el.style.display = 'none'; return; }
    el.style.display = '';

    const l = lang();
    const readiness = computeReadiness();
    const recap = computeWeeklyRecap();
    const streakResult = computeStreakWithFreeze();
    const streakDays = streakResult.streakDays;
    const freeze = streakResult.freeze;
    const rescuedThisRun = streakResult.rescuedThisRun;
    const weak = computeWeakChapters(3);

    const verdictLabel = (VERDICT_COPY[l] || VERDICT_COPY.en)[readiness.verdict];
    const verdictColor = VERDICT_COLOR[readiness.verdict];
    const circumference = 2 * Math.PI * 34;
    const dashLen = Math.round(readiness.score / 100 * circumference);

    // Build grid using safe DOM construction
    el.textContent = '';

    const grid = document.createElement('div');
    grid.className = 'v11-grid';

    // --- Readiness card ---
    const readinessCard = document.createElement('div');
    readinessCard.className = 'v11-card v11-card--readiness';

    const rlabel = document.createElement('span');
    rlabel.className = 'v11-label';
    rlabel.textContent = l === 'sv' ? 'Din beredskap' : 'Readiness';
    readinessCard.appendChild(rlabel);

    const ringWrap = document.createElement('div');
    ringWrap.className = 'v11-score-ring';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 80 80');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '80');
    const track = document.createElementNS(svgNS, 'circle');
    track.setAttribute('cx', '40'); track.setAttribute('cy', '40'); track.setAttribute('r', '34');
    track.setAttribute('fill', 'none'); track.setAttribute('stroke', '#e8e8e8'); track.setAttribute('stroke-width', '8');
    const fill = document.createElementNS(svgNS, 'circle');
    fill.setAttribute('cx', '40'); fill.setAttribute('cy', '40'); fill.setAttribute('r', '34');
    fill.setAttribute('fill', 'none'); fill.setAttribute('stroke', verdictColor); fill.setAttribute('stroke-width', '8');
    fill.setAttribute('stroke-dasharray', dashLen + ' ' + Math.round(circumference));
    fill.setAttribute('stroke-linecap', 'round'); fill.setAttribute('transform', 'rotate(-90 40 40)');
    svg.appendChild(track); svg.appendChild(fill);
    const inner = document.createElement('div');
    inner.className = 'v11-score-inner';
    const scoreStrong = document.createElement('strong');
    scoreStrong.textContent = readiness.score;
    const scoreSmall = document.createElement('small');
    scoreSmall.textContent = '/100';
    inner.appendChild(scoreStrong); inner.appendChild(scoreSmall);
    ringWrap.appendChild(svg); ringWrap.appendChild(inner);
    readinessCard.appendChild(ringWrap);

    const verdictEl = document.createElement('span');
    verdictEl.className = 'v11-verdict';
    verdictEl.style.color = verdictColor;
    verdictEl.textContent = verdictLabel;
    readinessCard.appendChild(verdictEl);

    if (readiness.isSparse) {
      const sparse = document.createElement('span');
      sparse.className = 'v11-sparse';
      sparse.textContent = l === 'sv' ? 'Mer data behövs' : 'Keep going — more data needed';
      readinessCard.appendChild(sparse);
    }

    const comps = document.createElement('div');
    comps.className = 'v11-components';
    [[l === 'sv' ? 'Nogg.' : 'Acc.', readiness.components.accuracy],
     [l === 'sv' ? 'Täckn.' : 'Cov.', readiness.components.coverage],
     readiness.components.mockAverage > 0 ? ['Mock', readiness.components.mockAverage] : null
    ].forEach(function (item) {
      if (!item) return;
      const s = document.createElement('span');
      s.textContent = item[0] + ' ' + pct(item[1]);
      comps.appendChild(s);
    });
    readinessCard.appendChild(comps);
    grid.appendChild(readinessCard);

    // --- Streak card ---
    const streakCard = document.createElement('div');
    streakCard.className = 'v11-card v11-card--streak';
    const slabel = document.createElement('span');
    slabel.className = 'v11-label';
    slabel.textContent = l === 'sv' ? 'Streak' : 'Streak';
    streakCard.appendChild(slabel);
    const streakNum = document.createElement('div');
    streakNum.className = 'v11-streak-num';
    streakNum.textContent = streakDays;
    const streakUnit = document.createElement('span');
    streakUnit.className = 'v11-streak-unit';
    streakUnit.textContent = 'd';
    streakNum.appendChild(streakUnit);
    streakCard.appendChild(streakNum);
    if (rescuedThisRun.length > 0) {
      const banner = document.createElement('p');
      banner.className = 'v11-freeze-banner';
      banner.textContent = l === 'sv'
        ? ('Strecket räddades — ' + freeze.available + ' frysar kvar')
        : ('Streak protected — ' + freeze.available + ' freeze' + (freeze.available !== 1 ? 's' : '') + ' left');
      streakCard.appendChild(banner);
    }
    const freezeBar = document.createElement('div');
    freezeBar.className = 'v11-freeze-bar';
    for (let i = 0; i < 4; i++) {
      const pip = document.createElement('div');
      pip.className = 'v11-freeze-pip' + (i < freeze.available ? ' v11-freeze-pip--on' : '');
      freezeBar.appendChild(pip);
    }
    const freezeLabel = document.createElement('span');
    freezeLabel.className = 'v11-freeze-label';
    freezeLabel.textContent = l === 'sv' ? 'Frysar' : 'Freezes';
    freezeBar.appendChild(freezeLabel);
    streakCard.appendChild(freezeBar);
    grid.appendChild(streakCard);

    // --- Weekly recap card ---
    const recapCard = document.createElement('div');
    recapCard.className = 'v11-card v11-card--recap';
    const rclabel = document.createElement('span');
    rclabel.className = 'v11-label';
    rclabel.textContent = l === 'sv' ? 'Denna vecka' : 'This week';
    recapCard.appendChild(rclabel);
    const statsRow = document.createElement('div');
    statsRow.className = 'v11-recap-stats';
    [
      [recap.questionsAnswered, l === 'sv' ? 'Svar' : 'Answers'],
      [recap.chaptersTouched, l === 'sv' ? 'Kapitel' : 'Chapters'],
      recap.bestMockScore !== null ? [recap.bestMockScore + '%', l === 'sv' ? 'Bästa prov' : 'Best mock'] : null,
      recap.unresolvedMistakes > 0 ? [recap.unresolvedMistakes, l === 'sv' ? 'Misstag' : 'Mistakes', true] : null
    ].forEach(function (item) {
      if (!item) return;
      const stat = document.createElement('div');
      stat.className = 'v11-stat' + (item[2] ? ' v11-stat--warn' : '');
      const strong = document.createElement('strong');
      strong.textContent = item[0];
      const small = document.createElement('small');
      small.textContent = item[1];
      stat.appendChild(strong); stat.appendChild(small);
      statsRow.appendChild(stat);
    });
    recapCard.appendChild(statsRow);
    grid.appendChild(recapCard);

    // --- Weak chapters card ---
    const weakCard = document.createElement('div');
    weakCard.className = 'v11-card v11-card--weak';
    const wlabel = document.createElement('span');
    wlabel.className = 'v11-label';
    wlabel.textContent = l === 'sv' ? 'Öva mer på' : 'Needs work';
    weakCard.appendChild(wlabel);
    const weakList = document.createElement('div');
    weakList.className = 'v11-weak-list';
    weak.forEach(function (ch) {
      const row = document.createElement('div');
      row.className = 'v11-weak-item';
      const title = document.createElement('span');
      title.className = 'v11-weak-title';
      title.textContent = ch.title;
      const acc = document.createElement('span');
      acc.className = 'v11-weak-acc';
      if (ch.accuracy !== null && ch.accuracy < 0.6) acc.style.color = '#e05b2e';
      else acc.style.color = '#888';
      acc.textContent = ch.isSparse
        ? (l === 'sv' ? 'Ej testad' : 'Not tried')
        : Math.round(ch.accuracy * 100) + '%';
      const link = document.createElement('a');
      link.className = 'v11-weak-link';
      link.href = '#/practice?ch=' + encodeURIComponent(ch.id);
      link.textContent = l === 'sv' ? 'Öva →' : 'Practice →';
      row.appendChild(title); row.appendChild(acc); row.appendChild(link);
      weakList.appendChild(row);
    });
    weakCard.appendChild(weakList);
    grid.appendChild(weakCard);

    el.appendChild(grid);
  }

  /* ----------------------------------------------- hook into app lifecycle */

  function onRouteChange() {
    const h = location.hash;
    if (h === '' || h === '#/' || h === '#') requestAnimationFrame(renderDashboard);
  }

  window.addEventListener('hashchange', onRouteChange);
  window.addEventListener('smt:answer', renderDashboard);

  const _orig = window.smtRecordAnswer;
  window.smtRecordAnswer = function (chapterId, correct) {
    if (_orig) _orig(chapterId, correct);
    window.dispatchEvent(new Event('smt:answer'));
  };

  function tryInit() {
    if (window.SMT_QUESTIONS && window.SMT_CHAPTERS_META) {
      renderDashboard();
    } else {
      setTimeout(tryInit, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

})();
