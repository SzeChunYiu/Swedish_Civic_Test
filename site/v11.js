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

  function clamp01(v) {
    return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
  }

  function localDateKey(date) {
    const d = date || new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
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

  const STORAGE_COUNTER_MAX = 100000;
  const STORAGE_DAY_LIST_MAX = 366;
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }
  function isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }
  function clampInteger(value, min, max, fallback) {
    if (!isFiniteNumber(value)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(value)));
  }
  function clampStorageCounter(value) {
    return clampInteger(value, 0, STORAGE_COUNTER_MAX, 0);
  }
  function isDateKey(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T00:00:00Z');
    return isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }
  function normalizeDateList(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.reduce(function (days, day) {
      if (!isDateKey(day) || seen.has(day) || days.length >= STORAGE_DAY_LIST_MAX) return days;
      seen.add(day);
      days.push(day);
      return days;
    }, []);
  }
  function normalizeProgressEntry(entry) {
    if (!isPlainObject(entry)) return null;
    const answered = clampStorageCounter(entry.answered);
    const correct = Math.min(answered, clampStorageCounter(entry.correct));
    return { answered: answered, correct: correct };
  }
  function normalizeProgress(value) {
    if (!isPlainObject(value)) return {};
    return Object.keys(value).reduce(function (out, key) {
      if (!/^ch\d+$/.test(key)) return out;
      const entry = normalizeProgressEntry(value[key]);
      if (entry) out[key] = entry;
      return out;
    }, {});
  }
  function normalizeMockEntry(entry) {
    if (!isPlainObject(entry) || !isFiniteNumber(entry.t) || !isFiniteNumber(entry.total)) {
      return null;
    }
    const t = clampInteger(entry.t, 0, Number.MAX_SAFE_INTEGER, 0);
    const total = clampStorageCounter(entry.total);
    const correct = Math.min(total, clampStorageCounter(entry.correct));
    const fallbackPct = total ? Math.round((correct / total) * 100) : 0;
    const pct = clampInteger(entry.pct, 0, 100, fallbackPct);
    const duration = clampInteger(entry.duration, 0, Number.MAX_SAFE_INTEGER, 0);
    return { t: t, total: total, correct: correct, pct: pct, duration: duration };
  }
  function normalizeMocks(value) {
    if (!Array.isArray(value)) return [];
    return value.map(normalizeMockEntry).filter(Boolean).slice(0, 8);
  }
  function normalizeStreak(value) {
    if (!isPlainObject(value)) return null;
    return {
      days: clampStorageCounter(value.days),
      lastDate: isDateKey(value.lastDate) ? value.lastDate : '',
      activeDays: normalizeDateList(value.activeDays),
      answeredThisWeek: clampStorageCounter(value.answeredThisWeek),
    };
  }
  function defaultFreeze() {
    return {
      available: 1,
      lastEarnedWeek: localDateKey(mondayOfWeek(new Date())),
      lifetimeSpent: 0,
      rescuedDays: [],
    };
  }
  function normalizeFreeze(value) {
    const defaults = defaultFreeze();
    if (!isPlainObject(value)) return defaults;
    return {
      available: clampInteger(value.available, 0, 4, defaults.available),
      lastEarnedWeek: isDateKey(value.lastEarnedWeek)
        ? value.lastEarnedWeek
        : defaults.lastEarnedWeek,
      lifetimeSpent: clampStorageCounter(value.lifetimeSpent),
      rescuedDays: normalizeDateList(value.rescuedDays),
    };
  }

  function getProgress() {
    try {
      return normalizeProgress(JSON.parse(localStorage.getItem('smt_progress') || '{}'));
    } catch {
      return {};
    }
  }

  function getMocks() {
    try {
      return normalizeMocks(JSON.parse(localStorage.getItem('smt_mocks') || '[]'));
    } catch {
      return [];
    }
  }

  function getStreak() {
    try {
      return normalizeStreak(JSON.parse(localStorage.getItem('smt_streak') || 'null'));
    } catch {
      return null;
    }
  }

  function getFreeze() {
    try {
      return normalizeFreeze(JSON.parse(localStorage.getItem('smt_freeze') || 'null'));
    } catch {
      return defaultFreeze();
    }
  }

  function saveFreeze(f) {
    try {
      localStorage.setItem('smt_freeze', JSON.stringify(normalizeFreeze(f)));
    } catch {}
  }

  /* ----------------------------------------------- streak with freeze */

  function computeStreakWithFreeze() {
    const now = new Date();
    const today = localDateKey(now);
    const saved = getStreak();
    const activeDaySet = new Set();

    if (saved && Array.isArray(saved.activeDays)) {
      saved.activeDays.forEach(function (d) {
        activeDaySet.add(d);
      });
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
          lastEarnedWeek: currentWeekKey,
        });
        saveFreeze(freeze);
      }
    }

    (freeze.rescuedDays || []).forEach(function (d) {
      activeDaySet.add(d);
    });

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
        rescuedDays: (freeze.rescuedDays || []).concat(rescuedThisRun),
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
    const recency =
      streak && streak.lastDate
        ? clamp01(
            1 - Math.abs(new Date() - new Date(streak.lastDate + 'T00:00:00')) / (14 * 86400000),
          )
        : 0;

    const recentMocks = mocks.slice(0, 3);
    const mockAvg =
      recentMocks.length === 0
        ? 0
        : clamp01(
            recentMocks.reduce(function (s, m) {
              return s + (m.pct || 0);
            }, 0) /
              (recentMocks.length * 100),
          );

    const hasMocks = mocks.length > 0;
    const w = hasMocks
      ? { accuracy: 0.35, coverage: 0.25, recency: 0.1, mock: 0.3 }
      : { accuracy: 0.55, coverage: 0.3, recency: 0.15, mock: 0 };

    const score = Math.round(
      clamp01(
        accuracy * w.accuracy + coverage * w.coverage + recency * w.recency + mockAvg * w.mock,
      ) * 100,
    );

    const verdict =
      score < 50
        ? 'not_ready_yet'
        : score < 70
          ? 'getting_there'
          : score < 85
            ? 'almost_ready'
            : 'strong_preparation';

    return {
      score: score,
      verdict: verdict,
      isSparse: totalAnswered < 30,
      components: {
        accuracy: accuracy,
        coverage: coverage,
        recency: recency,
        mockAverage: mockAvg,
      },
    };
  }

  /* ----------------------------------------------- weekly recap */

  function computeWeeklyRecap() {
    const progress = getProgress();
    const mocks = getMocks();
    const now = new Date();
    const weekStartT = mondayOfWeek(now).getTime();
    const weekEndT = weekStartT + 7 * 86400000;

    let totalA = 0,
      correctA = 0;
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
    const bestMock =
      mocksThisWeek.length > 0
        ? mocksThisWeek.reduce(function (b, m) {
            return m.pct > b ? m.pct : b;
          }, 0)
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

    return chapters
      .map(function (ch) {
        const key = 'ch' + ch.id;
        const data = progress[key] || { answered: 0, correct: 0 };
        const accuracy = data.answered === 0 ? null : data.correct / data.answered;
        const coverage = ch.questionCount > 0 ? Math.min(1, data.answered / ch.questionCount) : 0;
        const isSparse = data.answered < 5;
        const eff = accuracy === null ? 0.5 : isSparse ? 0.5 : accuracy;
        return {
          id: ch.id,
          title: ch.title || 'Chapter ' + ch.id,
          accuracy: accuracy,
          answers: data.answered,
          weaknessScore: 0.7 * (1 - eff) + 0.3 * (1 - coverage),
          isSparse: isSparse,
        };
      })
      .sort(function (a, b) {
        return b.weaknessScore - a.weaknessScore;
      })
      .slice(0, n);
  }

  /* ----------------------------------------------- UI rendering */

  const VERDICT_COPY = {
    not_ready_yet: {
      en: 'Keep practicing',
      sv: 'Fortsätt öva',
      'zh-Hans': '继续练习',
      'zh-Hant': '繼續練習',
      ar: 'واصل التدرّب',
      ckb: 'بەردەوام بە لە مەشق',
      fa: 'به تمرین ادامه بده',
      pl: 'Ćwicz dalej',
      so: 'Sii wad tababarka',
      ti: 'ቀጽል ምልምማድ',
      tr: 'Pratiğe devam et',
      uk: 'Продовжуйте практику',
    },
    getting_there: {
      en: 'Progress is building',
      sv: 'Framstegen växer',
      'zh-Hans': '进步正在积累',
      'zh-Hant': '進步正在累積',
      ar: 'التقدّم يتراكم',
      ckb: 'پێشکەوتن دروست دەبێت',
      fa: 'پیشرفت در حال شکل‌گیری است',
      pl: 'Postępy rosną',
      so: 'Horumarku waa kobcayaa',
      ti: 'ምዕባለ እናተወሰኸ',
      tr: 'İlerleme artıyor',
      uk: 'Прогрес зростає',
    },
    almost_ready: {
      en: 'Practice looks steady',
      sv: 'Övningen ser stabil ut',
      'zh-Hans': '练习状态稳定',
      'zh-Hant': '練習狀態穩定',
      ar: 'التدرّب يبدو ثابتًا',
      ckb: 'مەشق جێگیر دیارە',
      fa: 'تمرین پایدار به نظر می‌رسد',
      pl: 'Ćwiczenia wyglądają stabilnie',
      so: 'Tababarku wuxuu u muuqdaa mid degan',
      ti: 'ምልምማድ ቅሱን ይመስል',
      tr: 'Pratik istikrarlı görünüyor',
      uk: 'Практика виглядає стабільною',
    },
    strong_preparation: {
      en: 'Strong practice base',
      sv: 'Stark övningsgrund',
      'zh-Hans': '练习基础扎实',
      'zh-Hant': '練習基礎扎實',
      ar: 'أساس تدرّب قوي',
      ckb: 'بناغەیەکی بەهێزی مەشق',
      fa: 'پایه‌ی تمرینی قوی',
      pl: 'Mocna baza ćwiczeń',
      so: 'Saldhig tababar oo xoog leh',
      ti: 'ድልዱል መሰረት ምልምማድ',
      tr: 'Güçlü pratik temeli',
      uk: 'Міцна база практики',
    },
  };
  const VERDICT_COLOR = {
    not_ready_yet: '#e05b2e',
    getting_there: '#d4930a',
    almost_ready: '#2e86c1',
    strong_preparation: '#1aae39',
  };

  function lang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }
  function pct(v) {
    return Math.round(v * 100) + '%';
  }
  // Locale lookup for dashboard strings. Falls back to English for any missing
  // locale so newly added locales never render blank.
  function dtr(map) {
    return map[lang()] || map.en;
  }

  const GATE_COPY = {
    title: {
      en: 'Sign in to unlock your dashboard',
      sv: 'Logga in för att låsa upp din panel',
      'zh-Hans': '登录以解锁你的学习面板',
      'zh-Hant': '登入以解鎖你的學習面板',
      ar: 'سجّل الدخول لفتح لوحة المعلومات',
      ckb: 'بچۆ ژوورەوە بۆ کردنەوەی داشبۆردەکەت',
      fa: 'برای باز کردن داشبورد وارد شو',
      pl: 'Zaloguj się, aby odblokować panel',
      so: 'Soo gal si aad u furto dashboard-kaaga',
      ti: 'ዳሽቦርድካ ንምኽፋት እቶ',
      tr: 'Panonu açmak için giriş yap',
      uk: 'Увійдіть, щоб відкрити панель',
    },
    body: {
      en: 'Track your readiness, streaks, weak chapters, and progress — synced across all your devices.',
      sv: 'Följ din beredskap, sviter, svaga kapitel och framsteg — synkat på alla dina enheter.',
      'zh-Hans': '跟踪你的备考状态、连续天数、薄弱章节和学习进度——在所有设备间同步。',
      'zh-Hant': '追蹤你的備考狀態、連續天數、薄弱章節和學習進度——在所有裝置間同步。',
      ar: 'تابع جاهزيتك وسلاسلك والفصول الضعيفة وتقدّمك — متزامنة عبر كل أجهزتك.',
      ckb: 'ئامادەیی، زنجیرە ڕۆژەکان، بەشە لاوازەکان و پێشکەوتنت بەدوادابچە — لەنێوان هەموو ئامێرەکانت هاوکات.',
      fa: 'آمادگی، روزهای پیاپی، فصل‌های ضعیف و پیشرفتت را دنبال کن — همگام در همه دستگاه‌هایت.',
      pl: 'Śledź swoją gotowość, passy, słabe rozdziały i postępy — zsynchronizowane na wszystkich urządzeniach.',
      so: 'La soco diyaargarowgaaga, taxanaha, cutubyada daciifka ah iyo horumarkaaga — laga sinkiriyo dhammaan qalabkaaga.',
      ti: 'ድሉውነትካ፣ ተኸታታሊ መዓልትታት፣ ድኹማት ምዕራፋትን ምዕባለኻን ተኸታተል — ኣብ ኩሎም መሳርሕታትካ ይሳነ።',
      tr: 'Hazırlığını, serilerini, zayıf bölümlerini ve ilerlemeni takip et — tüm cihazlarında senkronize.',
      uk: 'Відстежуйте свою готовність, серії, слабкі розділи та прогрес — синхронізовано на всіх пристроях.',
    },
    cta: {
      en: 'Sign in',
      sv: 'Logga in',
      'zh-Hans': '登录',
      'zh-Hant': '登入',
      ar: 'تسجيل الدخول',
      ckb: 'چوونەژوورەوە',
      fa: 'ورود',
      pl: 'Zaloguj się',
      so: 'Soo gal',
      ti: 'እቶ',
      tr: 'Giriş yap',
      uk: 'Увійти',
    },
  };

  function buildLockOverlay() {
    const l = lang();
    const lock = document.createElement('div');
    lock.className = 'v11-lock';
    const inner = document.createElement('div');
    inner.className = 'v11-lock__inner';
    const badge = document.createElement('div');
    badge.className = 'v11-lock__badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = '🔒';
    const title = document.createElement('h3');
    title.className = 'v11-lock__title';
    title.textContent = GATE_COPY.title[l] || GATE_COPY.title.en;
    const body = document.createElement('p');
    body.className = 'v11-lock__body';
    body.textContent = GATE_COPY.body[l] || GATE_COPY.body.en;
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'btn btn--gold v11-lock__cta';
    cta.textContent = GATE_COPY.cta[l] || GATE_COPY.cta.en;
    cta.addEventListener('click', function () {
      if (typeof window.smtOpenSignin === 'function') window.smtOpenSignin();
    });
    inner.appendChild(badge);
    inner.appendChild(title);
    inner.appendChild(body);
    inner.appendChild(cta);
    lock.appendChild(inner);
    return lock;
  }

  function buildLockedDashboardShell() {
    const grid = document.createElement('div');
    grid.className = 'v11-grid';

    [
      {
        className: 'v11-card v11-card--readiness',
        label: {
          sv: 'Lokal övningssignal',
          en: 'Local practice signal',
          'zh-Hans': '本机练习信号',
          'zh-Hant': '本機練習信號',
          ar: 'إشارة التدرّب المحلية',
          ckb: 'سیگناڵی مەشقی ناوخۆیی',
          fa: 'سیگنال تمرین محلی',
          pl: 'Lokalny sygnał ćwiczeń',
          so: 'Calaamadda tababarka maxalliga ah',
          ti: 'ናይ ከባቢ ምልክት ምልምማድ',
          tr: 'Yerel pratik sinyali',
          uk: 'Локальний сигнал практики',
        },
        value: { sv: 'Låst', en: 'Locked' },
      },
      {
        className: 'v11-card',
        label: { sv: 'Veckosammanfattning', en: 'Weekly recap' },
        value: { sv: 'Logga in för att visa', en: 'Sign in to view' },
      },
      {
        className: 'v11-card v11-card--weak',
        label: { sv: 'Öva mer på', en: 'Needs work' },
        value: { sv: 'Dolda tills du loggar in', en: 'Hidden until you sign in' },
      },
    ].forEach(function (item) {
      const card = document.createElement('div');
      card.className = item.className;
      const label = document.createElement('span');
      label.className = 'v11-label';
      label.textContent = dtr(item.label);
      const value = document.createElement('strong');
      value.className = 'v11-locked-placeholder';
      value.textContent = dtr(item.value);
      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
    });

    return grid;
  }

  function renderDashboard() {
    const el = document.getElementById('v11-dashboard');
    if (!el) return;

    // Localize the "Your progress" eyebrow that lives in index.html. Run this on
    // every render path (including the active-quiz, signed-out, and no-progress
    // early returns below) so the eyebrow is always in the active locale.
    const eb = document.querySelector('#v11-dashboard-wrap .eyebrow');
    if (eb)
      eb.textContent = dtr({
        sv: 'Dina framsteg',
        en: 'Your progress',
        'zh-Hans': '你的学习进度',
        'zh-Hant': '你的學習進度',
        ar: 'تقدّمك',
        ckb: 'پێشکەوتنت',
        fa: 'پیشرفت تو',
        pl: 'Twoje postępy',
        so: 'Horumarkaaga',
        ti: 'ምዕባለኻ',
        tr: 'İlerlemen',
        uk: 'Ваш прогрес',
      });

    // The dashboard is a login-gated, cross-device feature. It must NOT appear
    // during an active practice/quiz session (hash carries c= or ch=) — only on
    // the practice hub. When signed out we still show the dashboard "shape"
    // with a sign-in prompt, so users discover the feature.
    const h = (typeof location !== 'undefined' && location.hash) || '';
    const inActiveQuiz = /[?&](c|ch)=/.test(h);
    if (inActiveQuiz) {
      el.style.display = 'none';
      el.classList.remove('v11-dashboard--locked');
      return;
    }
    const signedIn = (function () {
      try {
        const configured = Boolean(window.SMT_SUPABASE_URL && window.SMT_SUPABASE_ANON_KEY);
        const accountId = localStorage.getItem('smt_account_id') || '';
        return (
          localStorage.getItem('smt_signed_in') === '1' &&
          (!configured || accountId !== 'local-demo')
        );
      } catch {
        return false;
      }
    })();

    // Always show the dashboard on the practice hub: a signed-in user sees their
    // panel (even at zero — it fills in as they practise); a signed-out user sees
    // the blurred shape behind the sign-in overlay. (Previously it vanished right
    // after sign-in when the new account had no local progress yet.)
    el.style.display = '';

    if (!signedIn) {
      el.textContent = '';
      const lockedGrid = buildLockedDashboardShell();
      lockedGrid.setAttribute('aria-hidden', 'true');
      el.appendChild(lockedGrid);
      el.classList.add('v11-dashboard--locked');
      el.appendChild(buildLockOverlay());
      return;
    }

    const readiness = computeReadiness();
    const recap = computeWeeklyRecap();
    const streakResult = computeStreakWithFreeze();
    const streakDays = streakResult.streakDays;
    const freeze = streakResult.freeze;
    const rescuedThisRun = streakResult.rescuedThisRun;
    const weak = computeWeakChapters(3);

    const verdictLabel = dtr(VERDICT_COPY[readiness.verdict] || VERDICT_COPY.not_ready_yet);
    const verdictColor = VERDICT_COLOR[readiness.verdict];
    const circumference = 2 * Math.PI * 34;
    const dashLen = Math.round((readiness.score / 100) * circumference);

    // Build grid using safe DOM construction
    el.textContent = '';

    const grid = document.createElement('div');
    grid.className = 'v11-grid';

    // --- Readiness card ---
    const readinessCard = document.createElement('div');
    readinessCard.className = 'v11-card v11-card--readiness';

    const rlabel = document.createElement('span');
    rlabel.className = 'v11-label';
    rlabel.textContent = dtr({
      sv: 'Lokal övningssignal',
      en: 'Local practice signal',
      'zh-Hans': '本机练习信号',
      'zh-Hant': '本機練習信號',
      ar: 'إشارة التدرّب المحلية',
      ckb: 'سیگناڵی مەشقی ناوخۆیی',
      fa: 'سیگنال تمرین محلی',
      pl: 'Lokalny sygnał ćwiczeń',
      so: 'Calaamadda tababarka maxalliga ah',
      ti: 'ናይ ከባቢ ምልክት ምልምማድ',
      tr: 'Yerel pratik sinyali',
      uk: 'Локальний сигнал практики',
    });
    readinessCard.appendChild(rlabel);

    const ringWrap = document.createElement('div');
    ringWrap.className = 'v11-score-ring';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 80 80');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '80');
    const track = document.createElementNS(svgNS, 'circle');
    track.setAttribute('cx', '40');
    track.setAttribute('cy', '40');
    track.setAttribute('r', '34');
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', '#e8e8e8');
    track.setAttribute('stroke-width', '8');
    const fill = document.createElementNS(svgNS, 'circle');
    fill.setAttribute('cx', '40');
    fill.setAttribute('cy', '40');
    fill.setAttribute('r', '34');
    fill.setAttribute('fill', 'none');
    fill.setAttribute('stroke', verdictColor);
    fill.setAttribute('stroke-width', '8');
    fill.setAttribute('stroke-dasharray', dashLen + ' ' + Math.round(circumference));
    fill.setAttribute('stroke-linecap', 'round');
    fill.setAttribute('transform', 'rotate(-90 40 40)');
    svg.appendChild(track);
    svg.appendChild(fill);
    const inner = document.createElement('div');
    inner.className = 'v11-score-inner';
    const scoreStrong = document.createElement('strong');
    scoreStrong.textContent = readiness.score;
    const scoreSmall = document.createElement('small');
    scoreSmall.textContent = '/100';
    inner.appendChild(scoreStrong);
    inner.appendChild(scoreSmall);
    ringWrap.appendChild(svg);
    ringWrap.appendChild(inner);
    readinessCard.appendChild(ringWrap);

    const verdictEl = document.createElement('span');
    verdictEl.className = 'v11-verdict';
    verdictEl.style.color = verdictColor;
    verdictEl.textContent = verdictLabel;
    readinessCard.appendChild(verdictEl);

    if (readiness.isSparse) {
      const sparse = document.createElement('span');
      sparse.className = 'v11-sparse';
      sparse.textContent = dtr({
        sv: 'Svara på fler frågor för en stabilare lokal signal',
        en: 'Answer more questions for a steadier local signal',
        'zh-Hans': '多回答一些问题，让本机信号更稳定',
        'zh-Hant': '多回答一些問題，讓本機信號更穩定',
        ar: 'أجب عن المزيد من الأسئلة للحصول على إشارة محلية أكثر ثباتًا',
        ckb: 'وەڵامی پرسیاری زیاتر بدەرەوە بۆ سیگناڵێکی ناوخۆیی جێگیرتر',
        fa: 'برای سیگنال محلی پایدارتر، به سؤالات بیشتری پاسخ بده',
        pl: 'Odpowiedz na więcej pytań, aby lokalny sygnał był stabilniejszy',
        so: 'Ka jawaab su’aalo dheeraad ah si calaamadda maxalliga ah u sii xasilo',
        ti: 'ንዝያዳ ቅሱን ናይ ከባቢ ምልክት ብዙሕ ሕቶታት ምለስ',
        tr: 'Daha kararlı bir yerel sinyal için daha fazla soru yanıtla',
        uk: 'Дайте відповіді на більше запитань для стабільнішого локального сигналу',
      });
      readinessCard.appendChild(sparse);
    }

    const caveat = document.createElement('p');
    caveat.className = 'v11-sparse';
    caveat.textContent = dtr({
      sv: 'Bygger bara på övningar och övningsprov på den här enheten, inte en officiell prognos.',
      en: 'Based only on practice and mock attempts on this device, not an official result forecast.',
      'zh-Hans': '仅基于本设备上的练习和模拟测验，并非官方成绩预测。',
      'zh-Hant': '僅基於本裝置上的練習和模擬測驗，並非官方成績預測。',
      ar: 'يستند فقط إلى التدرّب والاختبارات التجريبية على هذا الجهاز، وليس توقّعًا رسميًا للنتيجة.',
      ckb: 'تەنها لەسەر مەشق و تاقیکردنەوەی نمونەیی لەسەر ئەم ئامێرە بنیات نراوە، پێشبینییەکی فەرمی ئەنجام نییە.',
      fa: 'فقط بر اساس تمرین و آزمون‌های آزمایشی روی این دستگاه است، نه پیش‌بینی رسمی نتیجه.',
      pl: 'Oparte wyłącznie na ćwiczeniach i próbnych testach na tym urządzeniu, nie jest oficjalną prognozą wyniku.',
      so: 'Waxay ku saleysan tahay kaliya tababarka iyo imtixaannada tijaabada ah ee qalabkan, maaha saadaal rasmi ah oo natiijo.',
      ti: 'ኣብዚ መሳርሒ ኣብ ዝግበር ምልምማድን ፈተነ ፈተናታትን ጥራይ ዝተመስረተ እዩ፣ ወግዓዊ ትንበያ ውጽኢት ኣይኮነን።',
      tr: 'Yalnızca bu cihazdaki pratiğe ve deneme sınavlarına dayanır, resmi bir sonuç tahmini değildir.',
      uk: 'Базується лише на практиці та пробних спробах на цьому пристрої, це не офіційний прогноз результату.',
    });
    readinessCard.appendChild(caveat);

    const comps = document.createElement('div');
    comps.className = 'v11-components';
    [
      [
        dtr({
          sv: 'Rätt',
          en: 'Practice accuracy',
          'zh-Hans': '练习正确率',
          'zh-Hant': '練習正確率',
          ar: 'دقة التدرّب',
          ckb: 'وردیی مەشق',
          fa: 'دقت تمرین',
          pl: 'Dokładność ćwiczeń',
          so: 'Saxnaanta tababarka',
          ti: 'ልክዕነት ምልምማድ',
          tr: 'Pratik doğruluğu',
          uk: 'Точність практики',
        }),
        readiness.components.accuracy,
      ],
      [
        dtr({
          sv: 'Kapiteltäckning',
          en: 'Chapter coverage',
          'zh-Hans': '章节覆盖率',
          'zh-Hant': '章節覆蓋率',
          ar: 'تغطية الفصول',
          ckb: 'بەرفراوانی بەشەکان',
          fa: 'پوشش فصل‌ها',
          pl: 'Pokrycie rozdziałów',
          so: 'Daboolka cutubyada',
          ti: 'ሽፋን ምዕራፋት',
          tr: 'Bölüm kapsamı',
          uk: 'Охоплення розділів',
        }),
        readiness.components.coverage,
      ],
      readiness.components.mockAverage > 0
        ? [
            dtr({
              sv: 'Övningsprov',
              en: 'Mock average',
              'zh-Hans': '模拟测验平均分',
              'zh-Hant': '模擬測驗平均分',
              ar: 'متوسط الاختبارات التجريبية',
              ckb: 'تێکڕای تاقیکردنەوەی نمونەیی',
              fa: 'میانگین آزمون آزمایشی',
              pl: 'Średnia z próbnych',
              so: 'Celceliska imtixaanka tijaabada',
              ti: 'ማእከላይ ፈተነ ፈተና',
              tr: 'Deneme ortalaması',
              uk: 'Середнє пробних',
            }),
            readiness.components.mockAverage,
          ]
        : null,
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
    slabel.textContent = dtr({
      sv: 'Svit',
      en: 'Streak',
      'zh-Hans': '连续天数',
      'zh-Hant': '連續天數',
      ar: 'السلسلة',
      ckb: 'زنجیرە',
      fa: 'روزهای پیاپی',
      pl: 'Passa',
      so: 'Taxane',
      ti: 'ተኸታታሊ',
      tr: 'Seri',
      uk: 'Серія',
    });
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
      banner.textContent = dtr({
        sv: function (n) {
          return 'Sviten är räddad — ' + n + ' svitskydd kvar';
        },
        en: function (n) {
          return 'Streak protected — ' + n + ' freeze' + (n !== 1 ? 's' : '') + ' left';
        },
        'zh-Hans': function (n) {
          return '连续天数已保护——剩余 ' + n + ' 次冻结';
        },
        'zh-Hant': function (n) {
          return '連續天數已保護——剩餘 ' + n + ' 次凍結';
        },
        ar: function (n) {
          return 'تمّت حماية السلسلة — تبقّى ' + n + ' تجميد';
        },
        ckb: function (n) {
          return 'زنجیرەکە پارێزرا — ' + n + ' بەستن ماوە';
        },
        fa: function (n) {
          return 'روزهای پیاپی حفظ شد — ' + n + ' فریز باقی مانده';
        },
        pl: function (n) {
          return 'Passa ochroniona — pozostało zamrożeń: ' + n;
        },
        so: function (n) {
          return 'Taxanaha waa la ilaaliyay — ' + n + ' barafayn ayaa hadhay';
        },
        ti: function (n) {
          return 'ተኸታታሊ ተዓቒቡ — ' + n + ' መርጊእ ተሪፉ';
        },
        tr: function (n) {
          return 'Seri korundu — ' + n + ' dondurma kaldı';
        },
        uk: function (n) {
          return 'Серію збережено — залишилось заморожень: ' + n;
        },
      })(freeze.available);
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
    freezeLabel.textContent = dtr({
      sv: 'Svitskydd',
      en: 'Freezes',
      'zh-Hans': '冻结',
      'zh-Hant': '凍結',
      ar: 'تجميدات',
      ckb: 'بەستنەکان',
      fa: 'فریزها',
      pl: 'Zamrożenia',
      so: 'Barafaynta',
      ti: 'መርጊኣት',
      tr: 'Dondurmalar',
      uk: 'Заморожень',
    });
    freezeBar.appendChild(freezeLabel);
    streakCard.appendChild(freezeBar);
    grid.appendChild(streakCard);

    // --- Weekly recap card ---
    const recapCard = document.createElement('div');
    recapCard.className = 'v11-card v11-card--recap';
    const rclabel = document.createElement('span');
    rclabel.className = 'v11-label';
    rclabel.textContent = dtr({
      sv: 'Denna vecka',
      en: 'This week',
      'zh-Hans': '本周',
      'zh-Hant': '本週',
      ar: 'هذا الأسبوع',
      ckb: 'ئەم هەفتەیە',
      fa: 'این هفته',
      pl: 'W tym tygodniu',
      so: 'Toddobaadkan',
      ti: 'እዛ ሰሙን',
      tr: 'Bu hafta',
      uk: 'Цього тижня',
    });
    recapCard.appendChild(rclabel);
    const statsRow = document.createElement('div');
    statsRow.className = 'v11-recap-stats';
    [
      [
        recap.questionsAnswered,
        dtr({
          sv: 'Svar',
          en: 'Answers',
          'zh-Hans': '回答',
          'zh-Hant': '回答',
          ar: 'إجابات',
          ckb: 'وەڵامەکان',
          fa: 'پاسخ‌ها',
          pl: 'Odpowiedzi',
          so: 'Jawaabo',
          ti: 'መልስታት',
          tr: 'Yanıtlar',
          uk: 'Відповіді',
        }),
      ],
      [
        recap.chaptersTouched,
        dtr({
          sv: 'Kapitel',
          en: 'Chapters',
          'zh-Hans': '章节',
          'zh-Hant': '章節',
          ar: 'فصول',
          ckb: 'بەشەکان',
          fa: 'فصل‌ها',
          pl: 'Rozdziały',
          so: 'Cutubyo',
          ti: 'ምዕራፋት',
          tr: 'Bölümler',
          uk: 'Розділи',
        }),
      ],
      recap.bestMockScore !== null
        ? [
            recap.bestMockScore + '%',
            dtr({
              sv: 'Bästa prov',
              en: 'Best mock',
              'zh-Hans': '最佳模拟',
              'zh-Hant': '最佳模擬',
              ar: 'أفضل اختبار',
              ckb: 'باشترین تاقیکردنەوە',
              fa: 'بهترین آزمون',
              pl: 'Najlepszy próbny',
              so: 'Imtixaanka ugu fiican',
              ti: 'ዝበለጸ ፈተና',
              tr: 'En iyi deneme',
              uk: 'Найкращий пробний',
            }),
          ]
        : null,
      recap.unresolvedMistakes > 0
        ? [
            recap.unresolvedMistakes,
            dtr({
              sv: 'Misstag',
              en: 'Mistakes',
              'zh-Hans': '错误',
              'zh-Hant': '錯誤',
              ar: 'أخطاء',
              ckb: 'هەڵەکان',
              fa: 'اشتباهات',
              pl: 'Błędy',
              so: 'Khaladaad',
              ti: 'ጌጋታት',
              tr: 'Hatalar',
              uk: 'Помилки',
            }),
            true,
          ]
        : null,
    ].forEach(function (item) {
      if (!item) return;
      const stat = document.createElement('div');
      stat.className = 'v11-stat' + (item[2] ? ' v11-stat--warn' : '');
      const strong = document.createElement('strong');
      strong.textContent = item[0];
      const small = document.createElement('small');
      small.textContent = item[1];
      stat.appendChild(strong);
      stat.appendChild(small);
      statsRow.appendChild(stat);
    });
    recapCard.appendChild(statsRow);
    grid.appendChild(recapCard);

    // --- Weak chapters card ---
    const weakCard = document.createElement('div');
    weakCard.className = 'v11-card v11-card--weak';
    const wlabel = document.createElement('span');
    wlabel.className = 'v11-label';
    wlabel.textContent = dtr({
      sv: 'Öva mer på',
      en: 'Needs work',
      'zh-Hans': '需加强',
      'zh-Hant': '需加強',
      ar: 'يحتاج إلى عمل',
      ckb: 'پێویستی بە کارکردنە',
      fa: 'نیاز به تمرین',
      pl: 'Do poprawy',
      so: 'Waxay u baahan tahay shaqo',
      ti: 'ዝያዳ ምልምማድ የድሊ',
      tr: 'Çalışman gerek',
      uk: 'Потребує роботи',
    });
    weakCard.appendChild(wlabel);
    const weakList = document.createElement('div');
    weakList.className = 'v11-weak-list';
    weak.forEach(function (ch) {
      const row = document.createElement('div');
      row.className = 'v11-weak-item';
      const title = document.createElement('span');
      title.className = 'v11-weak-title';
      title.textContent =
        ch.title && typeof ch.title === 'object'
          ? ch.title[lang()] || ch.title.en || 'Chapter ' + ch.id
          : ch.title;
      const acc = document.createElement('span');
      acc.className = 'v11-weak-acc';
      if (ch.accuracy !== null && ch.accuracy < 0.6) acc.style.color = '#e05b2e';
      else acc.style.color = '#888';
      acc.textContent = ch.isSparse
        ? dtr({
            sv: 'Ej testad',
            en: 'Not tried',
            'zh-Hans': '未尝试',
            'zh-Hant': '未嘗試',
            ar: 'لم تُجرَّب',
            ckb: 'تاقی نەکراوەتەوە',
            fa: 'امتحان نشده',
            pl: 'Niesprawdzone',
            so: 'Lama tijaabin',
            ti: 'ኣይተፈተነን',
            tr: 'Denenmedi',
            uk: 'Не пройдено',
          })
        : Math.round(ch.accuracy * 100) + '%';
      const link = document.createElement('a');
      link.className = 'v11-weak-link';
      link.href = '#/practice?c=' + encodeURIComponent(ch.id);
      link.textContent = dtr({
        sv: 'Öva →',
        en: 'Practice →',
        'zh-Hans': '练习 →',
        'zh-Hant': '練習 →',
        ar: 'تدرّب →',
        ckb: 'مەشق →',
        fa: 'تمرین →',
        pl: 'Ćwicz →',
        so: 'Tababar →',
        ti: 'ምልምማድ →',
        tr: 'Pratik →',
        uk: 'Практика →',
      });
      row.appendChild(title);
      row.appendChild(acc);
      row.appendChild(link);
      weakList.appendChild(row);
    });
    weakCard.appendChild(weakList);
    grid.appendChild(weakCard);

    el.appendChild(grid);

    el.classList.remove('v11-dashboard--locked');
  }

  /* ----------------------------------------------- hook into app lifecycle */

  function isDashboardRoute() {
    const h = location.hash || '#/';
    // Dashboard now has its own login-walled page.
    return h.startsWith('#/dashboard');
  }

  function dashboardQuestionBankReady() {
    return typeof window.smtQuestionBankIsReady === 'function'
      ? window.smtQuestionBankIsReady()
      : Boolean(window.SMT_QUESTIONS && window.SMT_CHAPTERS_META);
  }

  function renderDashboardStatus(kind) {
    const el = document.getElementById('v11-dashboard');
    if (!el) return;
    el.style.display = 'block';
    const message =
      kind === 'error'
        ? dtr({
            sv: 'Dashboard-data kunde inte laddas. Uppdatera sidan och försök igen.',
            en: 'Dashboard data could not be loaded. Refresh the page and try again.',
          })
        : dtr({ sv: 'Laddar dashboard...', en: 'Loading dashboard...' });
    el.innerHTML = `<div class="v11-card"><p>${esc(message)}</p></div>`;
  }

  function renderDashboardWhenReady() {
    if (!isDashboardRoute()) return;
    if (dashboardQuestionBankReady()) {
      requestAnimationFrame(renderDashboard);
      return;
    }
    if (typeof window.smtEnsureQuestionBank !== 'function') return;
    renderDashboardStatus('loading');
    window.smtEnsureQuestionBank().then(
      () => {
        if (isDashboardRoute()) requestAnimationFrame(renderDashboard);
      },
      () => renderDashboardStatus('error'),
    );
  }

  function onRouteChange() {
    renderDashboardWhenReady();
  }

  window.addEventListener('hashchange', onRouteChange);
  window.addEventListener('smt:answer', renderDashboardWhenReady);
  // Re-render when the user signs in/out (dashboard is login-gated).
  window.addEventListener('smt:authchange', renderDashboardWhenReady);
  // Re-render so all dashboard strings (and the eyebrow) follow the active locale.
  window.addEventListener('smt:languagechange', renderDashboardWhenReady);
  window.addEventListener('smt:questionbankready', renderDashboardWhenReady);

  const _orig = window.smtRecordAnswer;
  window.smtRecordAnswer = function (chapterId, correct) {
    if (_orig) _orig(chapterId, correct);
    window.dispatchEvent(new Event('smt:answer'));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDashboardWhenReady);
  } else {
    renderDashboardWhenReady();
  }
})();
