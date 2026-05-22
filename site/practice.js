/* Almost Swedish — Practice hub + mock exam
   - /practice           → chapter hub with per-chapter progress
   - /practice?c=N       → run a quiz for chapter N (handled by existing quiz)
   - /mock               → mock exam landing
   - /mock?run=1         → live mock exam (25Q, 30min timer, no per-Q feedback)
*/

(function () {
  'use strict';

  // ---------- helpers ----------

  function lang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }
  function tr(map) {
    return (map && (map[lang()] || map.en)) || '';
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(
      /[&<>"]/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
        })[c],
    );
  }
  function chapterLabel(question) {
    const chapterId = Number(question && question.chapterId);
    const meta = Array.isArray(window.SMT_CHAPTERS_META)
      ? window.SMT_CHAPTERS_META.find((chapter) => chapter.id === chapterId)
      : null;
    const title = meta && meta.title && (meta.title[lang()] || meta.title.en);
    if (title) return `${meta.emoji || ''} ${title}`.trim();
    return question && question.chapter ? question.chapter : `Ch ${chapterId || ''}`.trim();
  }
  const sourceCitationCopy = {
    en: { source: 'Source', page: 'p.' },
    sv: { source: 'Källa', page: 's.' },
    'zh-Hans': { source: '来源', page: '页' },
    'zh-Hant': { source: '來源', page: '頁' },
    ar: { source: 'المصدر', page: 'ص.' },
    ckb: { source: 'سەرچاوە', page: 'ل.' },
    fa: { source: 'منبع', page: 'ص.' },
    pl: { source: 'Źródło', page: 's.' },
    so: { source: 'Ilaha', page: 'b.' },
    ti: { source: 'ምንጪ', page: 'ገጽ' },
    tr: { source: 'Kaynak', page: 's.' },
    uk: { source: 'Джерело', page: 'с.' },
  };
  function sourceCitation(question) {
    const source = question && question.source;
    if (!source)
      return tr({
        sv: 'Källhänvisning saknas',
        en: 'Source citation unavailable',
        'zh-Hans': '缺少资料来源标注',
        'zh-Hant': '缺少資料來源標註',
        ar: 'لا تتوفر إشارة إلى المصدر',
        ckb: 'ئاماژە بە سەرچاوە بەردەست نییە',
        fa: 'ارجاع به منبع در دسترس نیست',
        pl: 'Brak źródła',
        so: 'Tixraac lama hayo',
        ti: 'ምንጪ የለን',
        tr: 'Kaynak gösterimi yok',
        uk: 'Джерело недоступне',
      });
    const title = source.title || 'Sverige i fokus';
    if (!source.chapter || !source.section || source.page === undefined || source.page === null) {
      return tr({
        sv: 'Källhänvisning saknas',
        en: 'Source citation unavailable',
        'zh-Hans': '缺少资料来源标注',
        'zh-Hant': '缺少資料來源標註',
        ar: 'لا تتوفر إشارة إلى المصدر',
        ckb: 'ئاماژە بە سەرچاوە بەردەست نییە',
        fa: 'ارجاع به منبع در دسترس نیست',
        pl: 'Brak źródła',
        so: 'Tixraac lama hayo',
        ti: 'ምንጪ የለን',
        tr: 'Kaynak gösterimi yok',
        uk: 'Джерело недоступне',
      });
    }
    const copy = sourceCitationCopy[lang()] || sourceCitationCopy.en;
    const currentLang = lang();
    const uhrCitation = `${copy.source}: ${title}, ${source.chapter}, ${source.section}, ${copy.page} ${source.page}`;
    const supplementalCitations = Array.isArray(source.supplementalSources)
      ? source.supplementalSources
          .filter((supplementalSource) => supplementalSource && supplementalSource.title)
          .map((supplementalSource) => {
            const published = supplementalSource.publishedDate
              ? currentLang === 'sv'
                ? `publicerad ${supplementalSource.publishedDate}`
                : `published ${supplementalSource.publishedDate}`
              : '';
            const retrieved = supplementalSource.retrievedDate
              ? currentLang === 'sv'
                ? `hämtad ${supplementalSource.retrievedDate}`
                : `retrieved ${supplementalSource.retrievedDate}`
              : '';
            return [
              `${copy.source}: ${supplementalSource.title}`,
              supplementalSource.publisher,
              published,
              retrieved,
              supplementalSource.url,
            ]
              .filter(Boolean)
              .join(', ');
          })
      : [];
    return [uhrCitation, ...supplementalCitations].join('; ');
  }
  function questionReviewDisclaimer() {
    return tr({
      sv: 'Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga.',
      en: 'Independent study practice, not a real exam or an official UHR question.',
      'zh-Hans': '独立练习，并非真正的考试，也不是官方 UHR 试题。',
      'zh-Hant': '獨立練習，並非真正的考試，也不是官方 UHR 試題。',
      ar: 'تدريب مستقل، وليس اختبارًا حقيقيًا ولا سؤالًا رسميًا من UHR.',
      ckb: 'مەشقی سەربەخۆیە، نەک تاقیکردنەوەیەکی ڕاستەقینە یان پرسیارێکی فەرمیی UHR.',
      fa: 'تمرین مستقل است، نه یک آزمون واقعی و نه یک سؤال رسمی UHR.',
      pl: 'Niezależne ćwiczenie, nie prawdziwy egzamin ani oficjalne pytanie UHR.',
      so: "Tababar madaxbannaan, ma aha imtixaan dhab ah ama su'aal rasmi ah oo UHR.",
      ti: 'ናጻ ልምምድ፣ ናይ ሓቂ ፈተና ወይ ወግዓዊ ሕቶ UHR ኣይኮነን።',
      tr: 'Bağımsız alıştırma; gerçek bir sınav veya resmî bir UHR sorusu değildir.',
      uk: 'Незалежне тренування, не справжній іспит і не офіційне питання UHR.',
    });
  }

  const mockBuddyCopy = {
    strong: {
      en: '{pct}%. Strong practice round.',
      sv: '{pct}%. Stark övningsrunda.',
      'zh-Hans': '{pct}%。本轮练习很扎实。',
      'zh-Hant': '{pct}%。本輪練習很扎實。',
      ar: '{pct}%. جولة تدريب قوية.',
      ckb: '{pct}%. خولێکی مەشقی بەهێز.',
      fa: '{pct}٪. دور تمرین قوی بود.',
      pl: '{pct}%. Mocna runda ćwiczeń.',
      so: '{pct}%. Wareeg tababar oo xooggan.',
      ti: '{pct}%. ጠንካራ ዙር ልምምድ።',
      tr: '{pct}%. Güçlü bir alıştırma turu.',
      uk: '{pct}%. Сильний тренувальний раунд.',
    },
    review: {
      en: 'Review the weak chapters, then try another practice round.',
      sv: 'Öva svaga kapitel och testa en ny övningsrunda.',
      'zh-Hans': '复习薄弱章节，然后再做一轮练习。',
      'zh-Hant': '複習薄弱章節，然後再做一輪練習。',
      ar: 'راجع الفصول الضعيفة، ثم جرّب جولة تدريب أخرى.',
      ckb: 'بەشە لاوازەکان دووبارە بخوێنەوە، پاشان خولێکی تری مەشق تاقی بکەرەوە.',
      fa: 'فصل‌های ضعیف‌تر را مرور کن، بعد یک دور تمرین دیگر انجام بده.',
      pl: 'Powtórz słabsze rozdziały, potem zrób kolejną rundę ćwiczeń.',
      so: 'Dib u eeg cutubyada daciifka ah, kadib samee wareeg tababar kale.',
      ti: 'ድኹማት ምዕራፋት ደጊምካ ተመልከት፣ ድሕሪኡ ካልእ ዙር ልምምድ ፈትን።',
      tr: 'Zayıf bölümleri gözden geçir, sonra bir alıştırma turu daha dene.',
      uk: 'Повтори слабші розділи, потім спробуй ще один тренувальний раунд.',
    },
  };

  function mockBuddyMessage(key, values = {}) {
    const copy = mockBuddyCopy[key] || mockBuddyCopy.review;
    const template = copy[lang()] || copy.en;
    return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  }

  const provenanceCopy = {
    uhr: {
      en: { label: 'UHR', description: "Based on UHR's study material Sverige i fokus." },
      sv: { label: 'UHR', description: 'Baserad på UHR:s studiematerial Sverige i fokus.' },
      'zh-Hans': { label: 'UHR', description: '基于 UHR 的学习材料《Sverige i fokus》。' },
      'zh-Hant': { label: 'UHR', description: '基於 UHR 的學習材料《Sverige i fokus》。' },
      ar: { label: 'UHR', description: 'مبني على مادة UHR الدراسية Sverige i fokus.' },
      ckb: {
        label: 'UHR',
        description: 'پشت بە ماددەی خوێندنی UHR بە ناوی Sverige i fokus دەبەستێت.',
      },
      fa: { label: 'UHR', description: 'بر پایه ماده آموزشی UHR با نام Sverige i fokus.' },
      pl: { label: 'UHR', description: 'Na podstawie materiału UHR Sverige i fokus.' },
      so: {
        label: 'UHR',
        description: 'Waxay ku salaysan tahay agabka waxbarasho ee UHR, Sverige i fokus.',
      },
      ti: { label: 'UHR', description: 'ኣብ ናይ UHR መጽናዕቲ ንብረት Sverige i fokus ዝተመርኮሰ።' },
      tr: { label: 'UHR', description: 'UHR’nin Sverige i fokus çalışma materyaline dayanır.' },
      uk: { label: 'UHR', description: 'На основі навчального матеріалу UHR Sverige i fokus.' },
    },
    derived: {
      en: {
        label: 'Supplementary',
        description: 'Variant of an app-authored, UHR-referenced practice question.',
      },
      sv: {
        label: 'Tillägg',
        description: 'Variant av en appskriven, UHR-hänvisad övningsfråga.',
      },
      'zh-Hans': { label: '补充', description: '由应用编写、带 UHR 引用的练习题变体。' },
      'zh-Hant': { label: '補充', description: '由應用程式撰寫、附 UHR 引用的練習題變體。' },
      ar: { label: 'تكميلي', description: 'صيغة من سؤال تدريبي كتبه التطبيق مع إحالة إلى UHR.' },
      ckb: {
        label: 'تەواوکەر',
        description: 'جۆرێک لە پرسیاری مەشقە کە ئەپەکە نووسیویەتی و ئاماژەی UHRی هەیە.',
      },
      fa: {
        label: 'تکمیلی',
        description: 'گونه‌ای از سؤال تمرینی نوشته‌شده در برنامه با ارجاع به UHR.',
      },
      pl: {
        label: 'Dodatkowe',
        description: 'Wariant pytania ćwiczeniowego napisanego w aplikacji z odwołaniem do UHR.',
      },
      so: {
        label: 'Dheeraad',
        description: "Nooc ka mid ah su'aal tababar oo app-ku qoray, oo leh tixraac UHR.",
      },
      ti: { label: 'ተወሳኺ', description: 'ብመተግበሪ ዝተጻሕፈ፣ ናብ UHR ዝምልከት ናይ ልምምድ ሕቶ ቅያር።' },
      tr: {
        label: 'Ek',
        description: 'UHR atıflı, uygulama tarafından yazılmış alıştırma sorusunun varyantı.',
      },
      uk: {
        label: 'Додаткове',
        description: 'Варіант тренувального питання, написаного в застосунку, з посиланням на UHR.',
      },
    },
    editorial: {
      en: { label: 'Editorial', description: 'Hand-written editorial context.' },
      sv: { label: 'Redaktionell', description: 'Redaktionellt skrivet sammanhang.' },
      'zh-Hans': { label: '编辑', description: '手写的编辑背景说明。' },
      'zh-Hant': { label: '編輯', description: '手寫的編輯背景說明。' },
      ar: { label: 'تحريري', description: 'سياق تحريري مكتوب يدويًا.' },
      ckb: {
        label: 'دەستنووسی دەستکاریکراو',
        description: 'دەقێکی ڕوونکردنەوەی دەستکاری بە دەست نووسراو.',
      },
      fa: { label: 'تحریریه', description: 'زمینه تحریریه‌ای که دستی نوشته شده است.' },
      pl: { label: 'Redakcyjne', description: 'Ręcznie napisany kontekst redakcyjny.' },
      so: { label: 'Tifaftir', description: 'Sharaxaad tifaftir oo gacanta lagu qoray.' },
      ti: { label: 'ኤዲቶርያል', description: 'ብኢድ ዝተጻሕፈ ኤዲቶርያላዊ ኩነታት።' },
      tr: { label: 'Editoryal', description: 'Elle yazılmış editoryal bağlam.' },
      uk: { label: 'Редакційне', description: 'Вручну написаний редакційний контекст.' },
    },
  };
  function questionProvenance(question) {
    const direct = question && question.questionProvenance;
    if (direct === 'uhr' || direct === 'derived' || direct === 'editorial') return direct;
    const tags = Array.isArray(question && question.tags) ? question.tags : [];
    if (tags.includes('editorial')) return 'editorial';
    if (tags.includes('published-variant')) return 'derived';
    return question && question.source ? 'uhr' : 'derived';
  }
  // ---- Question-source filter (user-controllable) ----------------------
  // Setting key: 'smt_question_sources'.
  //   'uhr'         → only questions with provenance === 'uhr' (official UHR
  //                   "Sverige i fokus" citations). ~169 questions.
  //   'all' (default) → entire bank (uhr + derived + editorial). ~858 questions.
  // Exposed as window.smtSetQuestionSources so settings.js can mutate it.
  function questionSourcesPref() {
    try {
      const v = localStorage.getItem('smt_question_sources');
      return v === 'uhr' ? 'uhr' : 'all';
    } catch {
      return 'all';
    }
  }
  function questionMatchesSourcePref(question) {
    return questionSourcesPref() === 'all' || questionProvenance(question) === 'uhr';
  }
  function questionHasLocale(question, locale = lang()) {
    if (locale === 'en' || locale === 'sv') return true;
    const hasText = (value) => typeof value === 'string' && value.trim() !== '';
    if (!hasText(question?.q?.[locale]) || !hasText(question?.why?.[locale])) return false;
    const opts = Array.isArray(question?.opts) ? question.opts : [];
    return opts.length > 0 && opts.every((option) => hasText(option?.[locale]));
  }
  function questionMatchesDisplayLocale(question) {
    return questionHasLocale(question, lang());
  }
  window.smtQuestionSourcesPref = questionSourcesPref;
  window.smtQuestionMatchesSourcePref = questionMatchesSourcePref;
  window.smtSetQuestionSources = function (mode) {
    const v = mode === 'uhr' ? 'uhr' : 'all';
    try {
      localStorage.setItem('smt_question_sources', v);
    } catch {}
    // Re-render current view so the filter takes effect immediately.
    if (typeof window.smtQuizRender === 'function') {
      try {
        window.smtQuizRender();
      } catch {}
    }
  };
  function provenanceBadge(question) {
    const provenance = questionProvenance(question);
    const copy = provenanceCopy[provenance][lang()] || provenanceCopy[provenance].en;
    const ariaPrefix = tr({
      sv: 'Källtyp',
      en: 'Provenance',
      'zh-Hans': '来源类型',
      'zh-Hant': '來源類型',
      ar: 'نوع المصدر',
      ckb: 'جۆری سەرچاوە',
      fa: 'نوع منبع',
      pl: 'Typ źródła',
      so: 'Nooca ilaha',
      ti: 'ዓይነት ምንጪ',
      tr: 'Kaynak türü',
      uk: 'Тип джерела',
    });
    const notePrefix = tr({
      sv: 'Källanteckning',
      en: 'Source note',
      'zh-Hans': '来源备注',
      'zh-Hant': '來源備註',
      ar: 'ملاحظة المصدر',
      ckb: 'تێبینیی سەرچاوە',
      fa: 'یادداشت منبع',
      pl: 'Notatka o źródle',
      so: 'Qoraal ilaha',
      ti: 'መዘክር ምንጪ',
      tr: 'Kaynak notu',
      uk: 'Примітка до джерела',
    });
    const label = escapeHtml(copy.label);
    const note = escapeHtml(`${ariaPrefix}: ${copy.label}. ${notePrefix}: ${copy.description}`);
    return `<span class="quiz__provenance quiz__provenance--${provenance}" role="text" aria-label="${note}" title="${note}">${label}</span>`;
  }
  function questionSourceRow(question, citationClassName = 'quiz__source') {
    return `
      <div class="quiz__source-row">
        ${provenanceBadge(question)}
        <p class="${citationClassName}">${escapeHtml(sourceCitation(question))}</p>
      </div>
    `;
  }
  function hashString(value) {
    let hash = 2166136261;
    const text = String(value ?? '');
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
    if (!question) return '';
    if (question.id) return question.id;
    if (question.q && (question.q.en || question.q.sv)) return question.q.en || question.q.sv;
    return JSON.stringify(question.q || question.opts || '');
  }
  function shouldShuffleOptions(question) {
    return (
      question &&
      question.type === 'single_choice' &&
      Array.isArray(question.opts) &&
      question.opts.length > 2
    );
  }
  function localDisplayOptions(question, sessionId) {
    const options = Array.isArray(question && question.opts) ? question.opts : [];
    const order = options.map((_, index) => index);
    if (shouldShuffleOptions(question)) {
      const seed = hashString(`${questionShuffleKey(question)}:${sessionId || 'default'}`);
      const random = seededRandom(seed);
      for (let index = order.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
      }
      if (order.every((originalIndex, displayIndex) => originalIndex === displayIndex)) {
        const offset = 1 + (seed % (order.length - 1));
        return order
          .slice(offset)
          .concat(order.slice(0, offset))
          .map((originalIndex, displayIndex) => ({
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
    if (typeof window.smtQuizDisplayOptions === 'function') {
      return window.smtQuizDisplayOptions(question, sessionId);
    }
    return localDisplayOptions(question, sessionId);
  }

  const STORAGE_COUNTER_MAX = 100000;
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
  function normalizeProgressEntry(entry) {
    if (!isPlainObject(entry)) return null;
    const answered = clampStorageCounter(entry.answered);
    const correct = Math.min(answered, clampStorageCounter(entry.correct));
    return { answered, correct };
  }
  function normalizeProgress(value) {
    if (!isPlainObject(value)) return {};
    return Object.keys(value).reduce((out, key) => {
      if (!/^ch\d+$/.test(key)) return out;
      const entry = normalizeProgressEntry(value[key]);
      if (entry) out[key] = entry;
      return out;
    }, {});
  }
  function normalizeMockHistoryEntry(entry) {
    if (!isPlainObject(entry) || !isFiniteNumber(entry.t) || !isFiniteNumber(entry.total)) {
      return null;
    }
    const t = clampInteger(entry.t, 0, Number.MAX_SAFE_INTEGER, 0);
    const total = clampStorageCounter(entry.total);
    const correct = Math.min(total, clampStorageCounter(entry.correct));
    const fallbackPct = total ? Math.round((correct / total) * 100) : 0;
    const pct = clampInteger(entry.pct, 0, 100, fallbackPct);
    const duration = clampInteger(entry.duration, 0, Number.MAX_SAFE_INTEGER, 0);
    return { t, total, correct, pct, duration };
  }
  function normalizeMockHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.map(normalizeMockHistoryEntry).filter(Boolean).slice(0, 8);
  }
  function normalizeChapterSelection(value) {
    if (value === 'all') return 'all';
    if (!Array.isArray(value)) return MOCK_DEFAULTS.chapters;
    const seen = new Set();
    return value.reduce((chapters, chapter) => {
      if (!isFiniteNumber(chapter)) return chapters;
      if (Math.floor(chapter) !== chapter) return chapters;
      const id = Math.floor(chapter);
      if (id < 1 || id > 99 || seen.has(id)) return chapters;
      seen.add(id);
      chapters.push(id);
      return chapters;
    }, []);
  }
  function normalizeMockCfg(value) {
    if (!isPlainObject(value)) return Object.assign({}, MOCK_DEFAULTS);
    return {
      count: clampInteger(value.count, 5, STORAGE_COUNTER_MAX, MOCK_DEFAULTS.count),
      minutes: clampInteger(value.minutes, 2, 90, MOCK_DEFAULTS.minutes),
      chapters: normalizeChapterSelection(value.chapters),
    };
  }

  function getProgress() {
    try {
      return normalizeProgress(JSON.parse(localStorage.getItem('smt_progress') || '{}'));
    } catch {
      return {};
    }
  }
  function saveProgress(p) {
    try {
      localStorage.setItem('smt_progress', JSON.stringify(normalizeProgress(p)));
    } catch {}
  }

  // For external code (the quiz) to call after each answer
  window.smtRecordAnswer = function (chapterId, correct) {
    const numericChapterId = parseInt(chapterId, 10);
    if (!isFinite(numericChapterId) || numericChapterId < 1) return;
    const p = getProgress();
    const k = 'ch' + numericChapterId;
    p[k] = normalizeProgressEntry(p[k]) || { answered: 0, correct: 0 };
    p[k].answered = clampStorageCounter(p[k].answered + 1);
    if (correct === true)
      p[k].correct = Math.min(p[k].answered, clampStorageCounter(p[k].correct + 1));
    saveProgress(p);
  };

  // Mock exam history
  function getMockHistory() {
    try {
      return normalizeMockHistory(JSON.parse(localStorage.getItem('smt_mocks') || '[]'));
    } catch {
      return [];
    }
  }
  function pushMock(entry) {
    const h = getMockHistory();
    const normalized = normalizeMockHistoryEntry(entry);
    if (!normalized) return;
    h.unshift(normalized);
    try {
      localStorage.setItem('smt_mocks', JSON.stringify(h.slice(0, 8)));
    } catch {}
  }

  function questionBankReady() {
    return typeof window.smtQuestionBankIsReady === 'function'
      ? window.smtQuestionBankIsReady()
      : Array.isArray(window.SMT_QUESTIONS);
  }

  function routeStatusCopy(kind) {
    if (kind === 'error') {
      return tr({
        sv: 'Frågorna kunde inte laddas. Uppdatera sidan och försök igen.',
        en: 'Questions could not be loaded. Refresh the page and try again.',
        'zh-Hans': '题库无法加载。请刷新页面后重试。',
        'zh-Hant': '題庫無法載入。請重新整理頁面後再試。',
        ar: 'تعذر تحميل الأسئلة. حدّث الصفحة وحاول مرة أخرى.',
        ckb: 'پرسیارەکان بار نەبوون. پەڕەکە نوێ بکەرەوە و دووبارە هەوڵ بدە.',
        fa: 'پرسش‌ها بارگیری نشدند. صفحه را تازه‌سازی و دوباره تلاش کنید.',
        pl: 'Nie udało się załadować pytań. Odśwież stronę i spróbuj ponownie.',
        so: "Su'aalaha lama rarin. Cusbooneysii bogga oo mar kale isku day.",
        ti: 'ሕቶታት ክጽዓና ኣይከኣላን። ገጹ ኣሐድስ እሞ እንደገና ፈትን።',
        tr: 'Sorular yüklenemedi. Sayfayı yenileyip tekrar dene.',
        uk: 'Не вдалося завантажити запитання. Оновіть сторінку й спробуйте ще раз.',
      });
    }
    return tr({
      sv: 'Laddar frågor...',
      en: 'Loading questions...',
      'zh-Hans': '正在加载题库...',
      'zh-Hant': '正在載入題庫...',
      ar: 'جارٍ تحميل الأسئلة...',
      ckb: 'پرسیارەکان دادەگیرێن...',
      fa: 'در حال بارگذاری پرسش‌ها...',
      pl: 'Ładowanie pytań...',
      so: "Su'aalaha ayaa la rarayaa...",
      ti: 'ሕቶታት ይጽዓና ኣለዋ...',
      tr: 'Sorular yükleniyor...',
      uk: 'Завантаження запитань...',
    });
  }

  function renderRouteStatus(targetId, kind) {
    const stage = document.getElementById(targetId);
    if (!stage) return;
    stage.innerHTML = `<div class="quiz__card"><h2 class="quiz__q">${escapeHtml(
      routeStatusCopy(kind),
    )}</h2></div>`;
  }

  function withQuestionBank(targetId, callback) {
    if (questionBankReady() || typeof window.smtEnsureQuestionBank !== 'function') {
      callback();
      return;
    }
    renderRouteStatus(targetId, 'loading');
    window.smtEnsureQuestionBank().then(callback, () => renderRouteStatus(targetId, 'error'));
  }

  // ---------- chapter hub ----------

  function chapterQuestionCount(id) {
    return (window.SMT_QUESTIONS || []).filter((q) => q.chapterId === id).length;
  }

  function renderPracticeHub() {
    const stage = document.getElementById('quiz-stage');
    if (!stage) return;
    const progress = getProgress();
    const meta = window.SMT_CHAPTERS_META || [];

    const totalQ = (window.SMT_QUESTIONS || []).length;
    const totalAnswered = Object.values(progress).reduce((s, p) => s + (p.answered || 0), 0);
    const totalCorrect = Object.values(progress).reduce((s, p) => s + (p.correct || 0), 0);
    const overallPct = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const cards = meta
      .map((c) => {
        const p = progress['ch' + c.id] || { answered: 0, correct: 0 };
        const total = chapterQuestionCount(c.id);
        const pct = total ? Math.min(100, Math.round((p.answered / total) * 100)) : 0;
        const accuracy = p.answered ? Math.round((p.correct / p.answered) * 100) : null;
        return `
        <a class="hub__card" href="#/practice?c=${c.id}">
          <div class="hub__row">
            <span class="hub__emoji" aria-hidden="true">${c.emoji}</span>
            <span class="hub__num">CH ${String(c.id).padStart(2, '0')}</span>
            ${accuracy !== null ? `<span class="hub__acc">${accuracy}%</span>` : ''}
          </div>
          <h3 class="hub__title">${tr(c.title)}</h3>
          <div class="hub__bar"><i style="width:${pct}%"></i></div>
          <div class="hub__meta">
            <span>${p.answered}/${total} ${tr({ sv: 'besvarade', en: 'answered', 'zh-Hans': '已作答', 'zh-Hant': '已作答', ar: 'أُجيب عنها', ckb: 'وەڵامدراوە', fa: 'پاسخ‌داده‌شده', pl: 'udzielono odpowiedzi', so: 'la jawaabay', ti: 'ተመሊሱ', tr: 'yanıtlandı', uk: 'відповіли' })}</span>
            ${p.correct ? `<span>${p.correct} ${tr({ sv: 'rätt', en: 'correct', 'zh-Hans': '答对', 'zh-Hant': '答對', ar: 'صحيحة', ckb: 'ڕاست', fa: 'درست', pl: 'poprawnie', so: 'sax', ti: 'ቅኑዕ', tr: 'doğru', uk: 'правильно' })}</span>` : ''}
          </div>
        </a>
      `;
      })
      .join('');

    stage.innerHTML = `
      <div class="hub">
        <div class="hub__stats">
          <div>
            <span class="hub__statlabel">${tr({ sv: 'Totalt', en: 'Total', 'zh-Hans': '总计', 'zh-Hant': '總計', ar: 'الإجمالي', ckb: 'کۆی گشتی', fa: 'مجموع', pl: 'Łącznie', so: 'Wadarta', ti: 'ጠቕላላ', tr: 'Toplam', uk: 'Усього' })}</span>
            <b class="hub__statvalue">${totalAnswered}</b>
            <span class="hub__statof">/ ${totalQ}</span>
          </div>
          <div>
            <span class="hub__statlabel">${tr({ sv: 'Träffsäkerhet', en: 'Accuracy', 'zh-Hans': '准确率', 'zh-Hant': '準確率', ar: 'الدقة', ckb: 'وردی', fa: 'دقت', pl: 'Trafność', so: 'Saxnaanta', ti: 'ልክዕነት', tr: 'İsabet oranı', uk: 'Точність' })}</span>
            <b class="hub__statvalue">${overallPct}%</b>
          </div>
          <div>
            <span class="hub__statlabel">${tr({ sv: 'Snabb runda', en: 'Quick round', 'zh-Hans': '快速一轮', 'zh-Hant': '快速一輪', ar: 'جولة سريعة', ckb: 'خولی خێرا', fa: 'دور سریع', pl: 'Szybka runda', so: 'Wareeg degdeg ah', ti: 'ቅልጡፍ ዙር', tr: 'Hızlı tur', uk: 'Швидкий раунд' })}</span>
            <a class="hub__quickbtn" href="#/practice?c=mix">${tr({ sv: '10 slumpade', en: '10 random', 'zh-Hans': '随机 10 题', 'zh-Hant': '隨機 10 題', ar: '10 عشوائية', ckb: '١٠ هەڕەمەکی', fa: '۱۰ تصادفی', pl: '10 losowych', so: '10 random ah', ti: '10 ብrandom', tr: '10 rastgele', uk: '10 випадкових' })} →</a>
          </div>
          <div>
            <span class="hub__statlabel">${tr({ sv: 'Övningsprov', en: 'Timed practice', 'zh-Hans': '限时练习', 'zh-Hant': '限時練習', ar: 'تدريب موقوت', ckb: 'مەشقی کاتدار', fa: 'تمرین زمان‌دار', pl: 'Egzamin próbny na czas', so: 'Imtixaan tababar oo waqti leh', ti: 'ግዜ ዘለዎ ልምምድ ፈተና', tr: 'Süreli alıştırma sınavı', uk: 'Тренування на час' })}</span>
            <a class="hub__quickbtn hub__quickbtn--gold" href="#/mock">${tr({ sv: 'Starta', en: 'Start', 'zh-Hans': '开始', 'zh-Hant': '開始', ar: 'ابدأ', ckb: 'دەست پێبکە', fa: 'شروع', pl: 'Rozpocznij', so: 'Bilow', ti: 'ጀምር', tr: 'Başlat', uk: 'Почати' })} →</a>
          </div>
        </div>

        <h2 class="hub__h2">${tr({ sv: 'Välj kapitel', en: 'Pick a chapter', 'zh-Hans': '选择章节', 'zh-Hant': '選擇章節', ar: 'اختر فصلًا', ckb: 'بەشێک هەڵبژێرە', fa: 'یک فصل را انتخاب کنید', pl: 'Wybierz rozdział', so: 'Dooro cutub', ti: 'ምዕራፍ ምረጽ', tr: 'Bir bölüm seçin', uk: 'Виберіть розділ' })}</h2>
        <div class="hub__grid">${cards}</div>

        <p class="hub__hint">${tr({
          sv: 'Tips: Övning lagrar dina framsteg lokalt. Inget konto behövs.',
          en: 'Tip: progress is saved on this device. No account needed.',
          'zh-Hans': '提示：练习进度仅保存在本设备上，无需账户。',
          'zh-Hant': '提示：練習進度只會儲存在這台裝置上，無需帳戶。',
          ar: 'نصيحة: يُحفَظ تقدمك على هذا الجهاز. لا حاجة إلى حساب.',
          ckb: 'ئامۆژگاری: پێشکەوتنت لەسەر ئەم ئامێرە پاشەکەوت دەکرێت. پێویست بە هەژمار نییە.',
          fa: 'نکته: پیشرفت شما روی این دستگاه ذخیره می‌شود. به حساب کاربری نیازی نیست.',
          pl: 'Wskazówka: postępy są zapisywane na tym urządzeniu. Konto nie jest potrzebne.',
          so: 'Talo: horumarka waxaa lagu kaydiyaa qalabkan. Akoon looma baahna.',
          ti: 'ምኽሪ፦ ምዕባለ ኣብዚ መሳርሒ ይቕመጥ። ኣካውንት ኣየድልን።',
          tr: 'İpucu: ilerleme bu cihazda kaydedilir. Hesap gerekmez.',
          uk: 'Підказка: прогрес зберігається на цьому пристрої. Обліковий запис не потрібен.',
        })}</p>
      </div>
      ${window.smtAdSlotMarkup ? window.smtAdSlotMarkup('practice') : ''}
    `;
    if (window.smtMountAds) window.smtMountAds();
  }
  window.smtRenderPracticeHub = renderPracticeHub;

  // ---------- mock exam ----------

  const MOCK_DEFAULTS = { count: 25, minutes: 30, chapters: 'all' };
  function loadMockCfg() {
    try {
      return normalizeMockCfg(JSON.parse(localStorage.getItem('smt_mock_cfg') || '{}'));
    } catch {
      return Object.assign({}, MOCK_DEFAULTS);
    }
  }
  function saveMockCfg(cfg) {
    try {
      localStorage.setItem('smt_mock_cfg', JSON.stringify(normalizeMockCfg(cfg)));
    } catch {}
  }
  function isStaticMockUhrQuestion(question) {
    return questionProvenance(question) === 'uhr';
  }
  function mockQuestionPool() {
    const all = window.SMT_QUESTIONS || [];
    return all.filter(isStaticMockUhrQuestion).filter(questionMatchesDisplayLocale);
  }

  function pickMockQuestions() {
    const cfg = loadMockCfg();
    let all = mockQuestionPool();
    if (cfg.chapters && cfg.chapters !== 'all' && Array.isArray(cfg.chapters)) {
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

  const mockDotStateCopy = {
    current: {
      sv: 'aktuell',
      en: 'current',
      'zh-Hans': '当前题',
      'zh-Hant': '目前題',
      ar: 'السؤال الحالي',
      ckb: 'ئێستا',
      fa: 'فعلی',
      pl: 'bieżące',
      so: 'hadda',
      ti: 'ሕጂ ዘሎ',
      tr: 'geçerli',
      uk: 'поточне',
    },
    answered: {
      sv: 'besvarad',
      en: 'answered',
      'zh-Hans': '已回答',
      'zh-Hant': '已回答',
      ar: 'تمت الإجابة',
      ckb: 'وەڵامدراوە',
      fa: 'پاسخ داده شده',
      pl: 'z odpowiedzią',
      so: 'waa laga jawaabay',
      ti: 'ተመሊሱ',
      tr: 'yanıtlandı',
      uk: 'відповідь надано',
    },
    unanswered: {
      sv: 'obesvarad',
      en: 'unanswered',
      'zh-Hans': '未回答',
      'zh-Hant': '未回答',
      ar: 'لم تتم الإجابة',
      ckb: 'وەڵام نەدراوەتەوە',
      fa: 'بی‌پاسخ',
      pl: 'bez odpowiedzi',
      so: 'lama jawaabin',
      ti: 'ዘይተመለሰ',
      tr: 'yanıtlanmadı',
      uk: 'без відповіді',
    },
  };

  function mockDotAccessibilityLabel(index, total, state) {
    const questionNumber = index + 1;
    const position = tr({
      sv: `Fråga ${questionNumber} av ${total}`,
      en: `Question ${questionNumber} of ${total}`,
      'zh-Hans': `第 ${questionNumber} 题，共 ${total} 题`,
      'zh-Hant': `第 ${questionNumber} 題，共 ${total} 題`,
      ar: `السؤال ${questionNumber} من ${total}`,
      ckb: `پرسیاری ${questionNumber} لە ${total}`,
      fa: `سؤال ${questionNumber} از ${total}`,
      pl: `Pytanie ${questionNumber} z ${total}`,
      so: `Su'aasha ${questionNumber} ee ${total}`,
      ti: `ሕቶ ${questionNumber} ካብ ${total}`,
      tr: `Soru ${questionNumber} / ${total}`,
      uk: `Питання ${questionNumber} з ${total}`,
    });
    return `${position}, ${tr(mockDotStateCopy[state] || mockDotStateCopy.unanswered)}`;
  }

  function isOnMock() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    return hash.startsWith('/mock');
  }
  function mockIsRunning() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    return /[?&]run=1/.test(hash);
  }

  function mockBoot() {
    if (!isOnMock()) return;
    const stage = document.getElementById('mock-stage');
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
    const stage = document.getElementById('mock-stage');
    const history = getMockHistory();
    const cfg = loadMockCfg();
    const meta = window.SMT_CHAPTERS_META || [];
    const allChapters = meta.map((c) => c.id);
    const selectedChapters =
      cfg.chapters === 'all' || !cfg.chapters ? allChapters : cfg.chapters.map(Number);

    const maxQ = Math.min(
      60,
      mockQuestionPool().filter((q) => {
        if (cfg.chapters === 'all' || !cfg.chapters) return true;
        return selectedChapters.includes(q.chapterId);
      }).length,
    );

    const chapterChips = meta
      .map((c) => {
        const on = selectedChapters.includes(c.id);
        const emoji = escapeHtml(c.emoji || '');
        const title = escapeHtml((c.title && (c.title[lang()] || c.title.en)) || '');
        return `<button class="mock-chip ${on ? 'is-on' : ''}" data-chip="${c.id}">
        <span class="mock-chip__emoji">${emoji}</span>
        <span class="mock-chip__num">CH ${String(c.id).padStart(2, '0')}</span>
        <span class="mock-chip__t">${title}</span>
      </button>`;
      })
      .join('');

    const histHtml = history.length
      ? `
      <div class="mock-history">
        <h3>${tr({ sv: 'Tidigare försök', en: 'Past attempts', 'zh-Hans': '历史记录', 'zh-Hant': '歷史紀錄', ar: 'المحاولات السابقة', ckb: 'هەوڵە پێشووەکان', fa: 'تلاش‌های پیشین', pl: 'Poprzednie próby', so: 'Isku dayadii hore', ti: 'ናይ ቅድሚ ሕጂ ፈተናታት', tr: 'Önceki denemeler', uk: 'Попередні спроби' })}</h3>
        <ul>
          ${history
            .map(
              (m) => `
            <li>
              <span class="mock-history__date">${new Date(m.t).toLocaleDateString(lang())}</span>
              <span class="mock-history__score">${m.correct}/${m.total}</span>
              <span class="mock-history__pct">${m.pct}%</span>
              <span class="mock-history__verdict">${tr({ sv: 'Övningsrunda', en: 'Practice round', 'zh-Hans': '练习一轮', 'zh-Hant': '練習一輪', ar: 'جولة تدريب', ckb: 'خولی مەشق', fa: 'دور تمرین', pl: 'Runda ćwiczeniowa', so: 'Wareegga tababarka', ti: 'ዙር ልምምድ', tr: 'Alıştırma turu', uk: 'Тренувальний раунд' })}</span>
            </li>`,
            )
            .join('')}
        </ul>
      </div>`
      : '';

    stage.innerHTML = `
      <div class="mock-landing">
        <div class="mock-landing__inner">
          <span class="eyebrow">${tr({ sv: 'Tidsatt övning', en: 'Timed practice', 'zh-Hans': '限时练习', 'zh-Hant': '限時練習', ar: 'تدريب موقوت', ckb: 'مەشقی کاتدار', fa: 'تمرین زمان‌دار', pl: 'Ćwiczenie na czas', so: 'Tababar waqti leh', ti: 'ግዜ ዘለዎ ልምምድ', tr: 'Süreli alıştırma', uk: 'Тренування на час' })}</span>
          <h1 class="practice__title">
            <span>${tr({ sv: 'Bygg ditt övningsprov.', en: 'Build your practice round.', 'zh-Hans': '自定义你的练习。', 'zh-Hant': '自訂你的練習。', ar: 'كوّن جولة تدريبك.', ckb: 'خولی مەشقی خۆت دروست بکە.', fa: 'دور تمرین خود را بسازید.', pl: 'Zbuduj swoją rundę ćwiczeniową.', so: 'Dhis wareeggaaga tababarka.', ti: 'ዙር ልምምድካ ስራሕ።', tr: 'Alıştırma turunu oluşturun.', uk: 'Створіть свій тренувальний раунд.' })}</span>
          </h1>
          <p class="mock-landing__lede">${tr({
            sv: 'Välj antal frågor, tid och vilka kapitel du vill testas på. Vi blandar och slumpar resten.',
            en: "Pick the question count, timer, and which chapters to include. We'll shuffle the rest.",
            'zh-Hans': '选择题目数量、时间，以及想要测验的章节。其余部分由我们打乱并随机抽取。',
            'zh-Hant': '選擇題目數量、時間，以及想要測驗的章節。其餘部分由我們打亂並隨機抽取。',
            ar: 'اختر عدد الأسئلة والمؤقّت والفصول التي تريد تضمينها. سنخلط البقية ونرتّبها عشوائيًا.',
            ckb: 'ژمارەی پرسیارەکان، کاتژمێر و ئەو بەشانەی دەتەوێت لەخۆیان بگرن هەڵبژێرە. ئێمە ئەوانی تر تێکەڵ و هەڕەمەکی دەکەین.',
            fa: 'تعداد سؤال‌ها، زمان‌سنج و فصل‌هایی را که می‌خواهید گنجانده شوند انتخاب کنید. ما بقیه را به‌هم می‌زنیم و تصادفی می‌چینیم.',
            pl: 'Wybierz liczbę pytań, czas i rozdziały, z których chcesz być sprawdzany. Resztę wymieszamy i wylosujemy.',
            so: "Dooro tirada su'aalaha, waqtiga iyo cutubyada aad rabto in lagugu imtixaamo. Inta kale waannu isku qaspaynaa oo random ka dhignaa.",
            ti: 'ቍጽሪ ሕቶታት፣ ግዜን ኣየኖት ምዕራፋት ክትፍተን ከም እትደሊን ምረጽ። ነቲ ዝተረፈ ንሕና ነሕውሶን ብrandom ንመርጾን።',
            tr: 'Soru sayısını, süreyi ve hangi bölümlerden sınanmak istediğinizi seçin. Gerisini biz karıştırıp rastgele seçeriz.',
            uk: 'Виберіть кількість питань, час і розділи, з яких хочете перевіритися. Решту ми перемішаємо й виберемо випадково.',
          })}</p>

          <div class="mock-cfg">
            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${tr({ sv: 'Frågor', en: 'Questions', 'zh-Hans': '题目', 'zh-Hant': '題目', ar: 'الأسئلة', ckb: 'پرسیارەکان', fa: 'سؤال‌ها', pl: 'Pytania', so: "Su'aalaha", ti: 'ሕቶታት', tr: 'Sorular', uk: 'Питання' })}</span>
                <output id="cfg-count-out">${cfg.count}</output>
              </label>
              <input type="range" id="cfg-count" min="5" max="${maxQ}" step="1" value="${Math.min(cfg.count, maxQ)}" />
              <div class="mock-cfg__hint">${tr({ sv: 'Max', en: 'Max', 'zh-Hans': '最多', 'zh-Hant': '最多', ar: 'الحد الأقصى', ckb: 'زۆرترین', fa: 'بیشینه', pl: 'Maks.', so: 'Ugu badnaan', ti: 'ዝለዓለ', tr: 'Maks.', uk: 'Макс.' })} ${maxQ}</div>
            </div>

            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${tr({ sv: 'Tid', en: 'Time', 'zh-Hans': '时间', 'zh-Hant': '時間', ar: 'الوقت', ckb: 'کات', fa: 'زمان', pl: 'Czas', so: 'Waqtiga', ti: 'ግዜ', tr: 'Süre', uk: 'Час' })}</span>
                <output id="cfg-min-out">${cfg.minutes} ${tr({ sv: 'min', en: 'min', 'zh-Hans': '分钟', 'zh-Hant': '分鐘', ar: 'دقيقة', ckb: 'خولەک', fa: 'دقیقه', pl: 'min', so: 'daq', ti: 'ደቒቓ', tr: 'dk', uk: 'хв' })}</output>
              </label>
              <input type="range" id="cfg-min" min="2" max="90" step="1" value="${cfg.minutes}" />
              <div class="mock-cfg__hint">${tr({ sv: 'Välj din övningstid', en: 'Choose your practice time', 'zh-Hans': '选择你的练习时间', 'zh-Hant': '選擇你的練習時間', ar: 'اختر مدة تدريبك', ckb: 'کاتی مەشقی خۆت هەڵبژێرە', fa: 'زمان تمرین خود را انتخاب کنید', pl: 'Wybierz swój czas ćwiczenia', so: 'Dooro waqtiga tababarkaaga', ti: 'ግዜ ልምምድካ ምረጽ', tr: 'Alıştırma sürenizi seçin', uk: 'Виберіть час тренування' })}</div>
            </div>

            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${tr({ sv: 'Kapitel', en: 'Chapters', 'zh-Hans': '章节', 'zh-Hant': '章節', ar: 'الفصول', ckb: 'بەشەکان', fa: 'فصل‌ها', pl: 'Rozdziały', so: 'Cutubyada', ti: 'ምዕራፋት', tr: 'Bölümler', uk: 'Розділи' })}</span>
                <span class="mock-cfg__select-actions">
                  <button class="mock-cfg__link" id="cfg-all">${tr({ sv: 'Alla', en: 'All', 'zh-Hans': '全选', 'zh-Hant': '全選', ar: 'الكل', ckb: 'هەموو', fa: 'همه', pl: 'Wszystkie', so: 'Dhammaan', ti: 'ኩሉ', tr: 'Tümü', uk: 'Усі' })}</button>
                  <button class="mock-cfg__link" id="cfg-none">${tr({ sv: 'Inga', en: 'None', 'zh-Hans': '全不选', 'zh-Hant': '全不選', ar: 'لا شيء', ckb: 'هیچ', fa: 'هیچ‌کدام', pl: 'Żadne', so: 'Midna', ti: 'ዋላ ሓደ', tr: 'Hiçbiri', uk: 'Жодного' })}</button>
                </span>
              </label>
              <div class="mock-chapters">${chapterChips}</div>
            </div>

            <div class="mock-cfg__meta">
              <span><b>${tr({ sv: 'Övningspoäng', en: 'Result', 'zh-Hans': '练习成绩', 'zh-Hant': '練習成績', ar: 'النتيجة', ckb: 'ئەنجام', fa: 'نتیجه', pl: 'Wynik ćwiczenia', so: 'Natiijada tababarka', ti: 'ውጽኢት ልምምድ', tr: 'Alıştırma puanı', uk: 'Результат тренування' })}</b> ${tr({ sv: '% rätt', en: 'percent correct', 'zh-Hans': '% 正确', 'zh-Hant': '% 正確', ar: '٪ صحيحة', ckb: '٪ ڕاست', fa: '٪ درست', pl: '% poprawnych', so: '% sax ah', ti: '% ቅኑዕ', tr: '% doğru', uk: '% правильних' })}</span>
              <span><b>${tr({ sv: 'Ingen återkoppling', en: 'Practice timer only', 'zh-Hans': '无反馈', 'zh-Hant': '無回饋', ar: 'مؤقّت تدريب فقط', ckb: 'تەنها کاتژمێری مەشق', fa: 'فقط زمان‌سنج تمرین', pl: 'Brak informacji zwrotnej', so: 'Jawaab celin ma jirto', ti: 'ዝኾነ ግብረ መልሲ የለን', tr: 'Geri bildirim yok', uk: "Без зворотного зв'язку" })}</b> ${tr({ sv: 'förrän inlämnat', en: 'not official exam timing', 'zh-Hans': '提交前不显示', 'zh-Hant': '提交前不顯示', ar: 'ليس توقيت اختبار رسمي', ckb: 'کاتبەندیی تاقیکردنەوەی فەرمی نییە', fa: 'زمان‌بندی آزمون رسمی نیست', pl: 'do momentu oddania', so: 'ilaa la gudbiyo', ti: 'ክሳብ ዝቐርብ', tr: 'teslim edilene kadar', uk: 'доки не здано' })}</span>
              <span><b>${tr({ sv: 'Lokalt sparat', en: 'Saved locally', 'zh-Hans': '已保存在本地', 'zh-Hant': '已儲存在本地', ar: 'محفوظ محليًا', ckb: 'بە شێوەی ناوخۆیی پاشەکەوت کراوە', fa: 'ذخیره‌شده به‌صورت محلی', pl: 'Zapisano lokalnie', so: 'Maxalli ahaan loo kaydiyay', ti: 'ኣብ መሳርሒ ተቐሚጡ', tr: 'Cihaza kaydedildi', uk: 'Збережено локально' })}</b></span>
            </div>
          </div>

          <div class="mock-landing__cta">
            <a class="btn btn--gold" href="#/mock?run=1" id="cfg-start">${tr({ sv: 'Starta övningsprov', en: 'Start timed practice', 'zh-Hans': '开始限时练习', 'zh-Hant': '開始限時練習', ar: 'ابدأ التدريب الموقوت', ckb: 'دەست بە مەشقی کاتدار بکە', fa: 'شروع تمرین زمان‌دار', pl: 'Rozpocznij egzamin próbny na czas', so: 'Bilow imtixaanka tababarka ee waqtiga leh', ti: 'ግዜ ዘለዎ ልምምድ ፈተና ጀምር', tr: 'Süreli alıştırma sınavını başlat', uk: 'Почати тренування на час' })} →</a>
            <a class="btn btn--ghost" href="#/practice">${tr({ sv: 'Öva först', en: 'Practice first', 'zh-Hans': '先练习', 'zh-Hant': '先練習', ar: 'تدرّب أولًا', ckb: 'سەرەتا مەشق بکە', fa: 'ابتدا تمرین کنید', pl: 'Najpierw poćwicz', so: 'Marka hore tababar', ti: 'ቅድም ልምምድ ግበር', tr: 'Önce alıştırma yap', uk: 'Спершу потренуйтеся' })}</a>
            <button class="mock-cfg__link" id="cfg-reset">${tr({ sv: 'Återställ', en: 'Reset to defaults', 'zh-Hans': '恢复默认', 'zh-Hant': '回復預設', ar: 'إعادة إلى الإعدادات الافتراضية', ckb: 'گەڕاندنەوە بۆ ڕێکخستنە بنەڕەتییەکان', fa: 'بازنشانی به مقادیر پیش‌فرض', pl: 'Przywróć domyślne', so: 'Dib ugu celi qiyamka caadiga ah', ti: 'ናብ ነባሪ ምለስ', tr: 'Varsayılanlara sıfırla', uk: 'Скинути до типових' })}</button>
          </div>

          ${histHtml}
        </div>
      </div>
    `;

    // wire config controls
    const out1 = document.getElementById('cfg-count-out');
    const out2 = document.getElementById('cfg-min-out');
    const startBtn = document.getElementById('cfg-start');

    function refreshCounts() {
      const cfgNow = loadMockCfg();
      const sel =
        cfgNow.chapters === 'all' || !cfgNow.chapters ? allChapters : cfgNow.chapters.map(Number);
      const available = mockQuestionPool().filter((q) => sel.includes(q.chapterId)).length;
      const slider = document.getElementById('cfg-count');
      if (!slider) return;
      slider.max = String(Math.max(5, available));
      if (parseInt(slider.value, 10) > available) slider.value = String(available);
      out1.textContent = slider.value;
      const hint = slider.closest('.mock-cfg__row').querySelector('.mock-cfg__hint');
      if (hint)
        hint.textContent =
          tr({
            sv: 'Max ',
            en: 'Max ',
            'zh-Hans': '最长 ',
            'zh-Hant': '最長 ',
            ar: 'الحد الأقصى ',
            ckb: 'زۆرترین ',
            fa: 'بیشینه ',
            pl: 'Maks. ',
            so: 'Ugu badnaan ',
            ti: 'ዝለዓለ ',
            tr: 'Maks. ',
            uk: 'Макс. ',
          }) + available;
      if (startBtn) {
        startBtn.classList.toggle('is-disabled', available < 5);
      }
    }

    document.getElementById('cfg-count').addEventListener('input', (e) => {
      out1.textContent = e.target.value;
      const cur = loadMockCfg();
      saveMockCfg(Object.assign(cur, { count: parseInt(e.target.value, 10) }));
    });
    document.getElementById('cfg-min').addEventListener('input', (e) => {
      out2.textContent =
        e.target.value +
        tr({
          sv: ' min',
          en: ' min',
          'zh-Hans': ' 分钟',
          'zh-Hant': ' 分鐘',
          ar: ' دقيقة',
          ckb: ' خولەک',
          fa: ' دقیقه',
          pl: ' min',
          so: ' daq',
          ti: ' ደቒቓ',
          tr: ' dk',
          uk: ' хв',
        });
      const cur = loadMockCfg();
      saveMockCfg(Object.assign(cur, { minutes: parseInt(e.target.value, 10) }));
    });
    stage.querySelectorAll('.mock-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-on');
        const ons = Array.from(stage.querySelectorAll('.mock-chip.is-on')).map((c) =>
          parseInt(c.dataset.chip, 10),
        );
        const cur = loadMockCfg();
        cur.chapters = ons.length === allChapters.length ? 'all' : ons;
        saveMockCfg(cur);
        refreshCounts();
      });
    });
    document.getElementById('cfg-all').addEventListener('click', () => {
      stage.querySelectorAll('.mock-chip').forEach((c) => c.classList.add('is-on'));
      const cur = loadMockCfg();
      cur.chapters = 'all';
      saveMockCfg(cur);
      refreshCounts();
    });
    document.getElementById('cfg-none').addEventListener('click', () => {
      stage.querySelectorAll('.mock-chip').forEach((c) => c.classList.remove('is-on'));
      const cur = loadMockCfg();
      cur.chapters = [];
      saveMockCfg(cur);
      refreshCounts();
    });
    document.getElementById('cfg-reset').addEventListener('click', () => {
      saveMockCfg(Object.assign({}, MOCK_DEFAULTS));
      renderMockLanding();
    });
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        if (startBtn.classList.contains('is-disabled')) e.preventDefault();
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
    if (MOCK.submitted) {
      clearInterval(MOCK.timerId);
      return;
    }
    const left = Math.max(0, MOCK.endsAt - Date.now());
    const el = document.getElementById('mock-timer');
    if (el) {
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      el.classList.toggle('is-low', left < 5 * 60 * 1000);
    }
    if (left <= 0) submitMock();
  }

  function renderMockExam() {
    const stage = document.getElementById('mock-stage');
    if (!stage || !MOCK.questions.length) return;

    if (MOCK.submitted) {
      renderMockResult();
      return;
    }

    const i = MOCK.i;
    const q = MOCK.questions[i];
    const n = MOCK.questions.length;
    const chosen = MOCK.answers[i];

    const dots = MOCK.questions
      .map((_, k) => {
        const state = k === i ? 'current' : MOCK.answers[k] !== null ? 'answered' : 'unanswered';
        const cls = state === 'current' ? 'is-on' : state === 'answered' ? 'is-done' : '';
        const label = escapeHtml(mockDotAccessibilityLabel(k, n, state));
        const current = state === 'current' ? ' aria-current="step"' : '';
        return `<button class="mock-dot ${cls}" data-go="${k}" aria-label="${label}"${current}>${k + 1}</button>`;
      })
      .join('');

    const opts = displayOptions(q, `mock:${MOCK.startedAt || 'preview'}:${i}`)
      .map(({ option: o, originalIndex, displayIndex }) => {
        const cls = chosen === originalIndex ? 'is-chosen' : '';
        return `
        <button class="mock-opt ${cls}" data-pick="${originalIndex}">
          <span class="key">${String.fromCharCode(65 + displayIndex)}</span>
          <span>${escapeHtml(o[lang()] || o.en)}</span>
        </button>
      `;
      })
      .join('');

    const answered = MOCK.answers.filter((a) => a !== null).length;

    stage.innerHTML = `
      <div class="mock-shell">
        <header class="mock-bar">
          <div class="mock-bar__title">
            <span class="eyebrow">${tr({ sv: 'Tidsatt övning', en: 'Timed practice', 'zh-Hans': '限时练习', 'zh-Hant': '限時練習', ar: 'تدريب موقوت', ckb: 'مەشقی کاتدار', fa: 'تمرین زمان‌دار', pl: 'Ćwiczenie na czas', so: 'Tababar waqti leh', ti: 'ግዜ ዘለዎ ልምምድ', tr: 'Süreli alıştırma', uk: 'Тренування на час' })}</span>
            <span class="mock-bar__counter">${i + 1} / ${n}</span>
          </div>
          <div class="mock-bar__timer">
            <span class="mock-bar__timerlabel">${tr({ sv: 'Återstår', en: 'Time left', 'zh-Hans': '剩余', 'zh-Hant': '剩餘', ar: 'الوقت المتبقي', ckb: 'کاتی ماوە', fa: 'زمان باقی‌مانده', pl: 'Pozostało', so: 'Hadhay', ti: 'ዝተረፈ', tr: 'Kalan süre', uk: 'Залишилося' })}</span>
            <span class="mock-timer" id="mock-timer">--:--</span>
          </div>
          <button class="btn btn--ghost btn--sm" id="mock-submit">${tr({ sv: 'Lämna in', en: 'Submit', 'zh-Hans': '交卷', 'zh-Hant': '交卷', ar: 'إرسال', ckb: 'ناردن', fa: 'ثبت', pl: 'Oddaj', so: 'Gudbi', ti: 'ኣረክብ', tr: 'Gönder', uk: 'Здати' })}</button>
        </header>

        <div class="mock-grid" aria-label="${tr({ sv: 'Frågenavigering', en: 'Question navigation', 'zh-Hans': '题目导航', 'zh-Hant': '題目導覽', ar: 'التنقّل بين الأسئلة', ckb: 'گەشتکردن لە پرسیارەکاندا', fa: 'پیمایش سؤال‌ها', pl: 'Nawigacja po pytaniach', so: "Hagista su'aalaha", ti: 'ምልጋብ ሕቶታት', tr: 'Soru gezinmesi', uk: 'Навігація по питаннях' })}">${dots}</div>

        <p class="quiz__disclaimer">${escapeHtml(questionReviewDisclaimer())}</p>
        <div class="mock-card">
          <div class="quiz__crumb">${escapeHtml(chapterLabel(q))}</div>
          <h2 class="quiz__q">${escapeHtml(q.q[lang()] || q.q.en)}</h2>
          ${questionSourceRow(q)}
          <div class="quiz__opts">${opts}</div>
        </div>

        <div class="mock-actions">
          <button class="btn btn--ghost" id="mock-prev" ${i === 0 ? 'disabled' : ''}>← ${tr({ sv: 'Föregående', en: 'Previous', 'zh-Hans': '上一题', 'zh-Hant': '上一題', ar: 'السابق', ckb: 'پێشتر', fa: 'قبلی', pl: 'Poprzednie', so: 'Hore', ti: 'ዝሓለፈ', tr: 'Önceki', uk: 'Попереднє' })}</button>
          <span class="mock-actions__progress">${answered} / ${n} ${tr({ sv: 'besvarade', en: 'answered', 'zh-Hans': '已作答', 'zh-Hant': '已作答', ar: 'أُجيب عنها', ckb: 'وەڵامدراوە', fa: 'پاسخ‌داده‌شده', pl: 'udzielono odpowiedzi', so: 'la jawaabay', ti: 'ተመሊሱ', tr: 'yanıtlandı', uk: 'відповіли' })}</span>
          <button class="btn btn--gold" id="mock-next" ${i === n - 1 ? 'disabled' : ''}>${tr({ sv: 'Nästa', en: 'Next', 'zh-Hans': '下一题', 'zh-Hant': '下一題', ar: 'التالي', ckb: 'دواتر', fa: 'بعدی', pl: 'Następne', so: 'Xiga', ti: 'ዝቕጽል', tr: 'Sonraki', uk: 'Наступне' })} →</button>
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
    const correct = MOCK.questions.reduce(
      (s, q, i) => s + (MOCK.answers[i] === q.answer ? 1 : 0),
      0,
    );
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

  function mockSubmitConfirmMessage(unanswered) {
    if (unanswered) {
      return tr({
        sv: `Du har ${unanswered} obesvarade frågor. Lämna in ändå?`,
        en: `${unanswered} questions are still unanswered. Submit anyway?`,
        'zh-Hans': `还有 ${unanswered} 道题未作答。仍要交卷吗？`,
        'zh-Hant': `還有 ${unanswered} 題未作答。仍要交卷嗎？`,
        ar: `لا تزال هناك ${unanswered} أسئلة بلا إجابة. هل تريد الإرسال رغم ذلك؟`,
        ckb: `${unanswered} پرسیار هێشتا وەڵام نەدراونەتەوە. هەر بنێردرێت؟`,
        fa: `${unanswered} سؤال هنوز بی‌پاسخ مانده است. با این حال ثبت شود؟`,
        pl: `${unanswered} pytań nadal jest bez odpowiedzi. Oddać mimo to?`,
        so: `${unanswered} su'aalood wali lama jawaabin. Ma gudbinaysaa haddana?`,
        ti: `${unanswered} ሕቶታት ገና ኣይተመለሱን። ከምኡ እናሃለወ ይቐርብ?`,
        tr: `${unanswered} soru hâlâ yanıtlanmadı. Yine de gönderilsin mi?`,
        uk: `${unanswered} питань ще без відповіді. Усе одно здати?`,
      });
    }
    return tr({
      sv: 'Lämna in?',
      en: 'Submit?',
      'zh-Hans': '确认交卷？',
      'zh-Hant': '確認交卷？',
      ar: 'إرسال؟',
      ckb: 'بنێردرێت؟',
      fa: 'ثبت شود؟',
      pl: 'Oddać?',
      so: 'Ma gudbinaysaa?',
      ti: 'ይቐርብ?',
      tr: 'Gönderilsin mi?',
      uk: 'Здати?',
    });
  }

  function renderMockResult() {
    const stage = document.getElementById('mock-stage');
    if (!stage) return;
    const total = MOCK.questions.length;
    const correct = MOCK.questions.reduce(
      (s, q, i) => s + (MOCK.answers[i] === q.answer ? 1 : 0),
      0,
    );
    const pct = Math.round((correct / total) * 100);
    const strongPracticeScore = pct >= 80;

    // by chapter
    const byCh = {};
    MOCK.questions.forEach((q, i) => {
      const c = q.chapterId;
      byCh[c] = byCh[c] || { total: 0, correct: 0 };
      byCh[c].total++;
      if (MOCK.answers[i] === q.answer) byCh[c].correct++;
    });

    const chapterRows = Object.entries(byCh)
      .sort((a, b) => +a[0] - +b[0])
      .map(([id, s]) => {
        const meta = (window.SMT_CHAPTERS_META || []).find((m) => m.id === +id);
        const cpct = Math.round((s.correct / s.total) * 100);
        return `
        <li>
          <span class="result-ch__num">CH ${String(id).padStart(2, '0')}</span>
          <span class="result-ch__title">${meta ? tr(meta.title) : ''}</span>
          <span class="result-ch__score">${s.correct}/${s.total}</span>
          <span class="result-ch__bar"><i style="width:${cpct}%"></i></span>
        </li>
      `;
      })
      .join('');
    const reviewRows = MOCK.questions
      .map((q, i) => {
        const picked = MOCK.answers[i];
        const isCorrect = picked === q.answer;
        const selectedText =
          picked === null
            ? tr({
                sv: 'Inte besvarad',
                en: 'Not answered',
                'zh-Hans': '未作答',
                'zh-Hant': '未作答',
                ar: 'غير مُجاب عنها',
                ckb: 'وەڵام نەدراوە',
                fa: 'پاسخ‌داده‌نشده',
                pl: 'Bez odpowiedzi',
                so: 'Lama jawaabin',
                ti: 'ኣይተመለሰን',
                tr: 'Yanıtlanmadı',
                uk: 'Без відповіді',
              })
            : tr(q.opts[picked]);
        const correctText = tr(q.opts[q.answer]);
        return `
        <details class="mock-review__item ${isCorrect ? 'is-correct' : 'is-wrong'}">
          <summary>
            <span>${tr({ sv: 'Fråga', en: 'Question', 'zh-Hans': '题目', 'zh-Hant': '題目', ar: 'سؤال', ckb: 'پرسیار', fa: 'سؤال', pl: 'Pytanie', so: "Su'aal", ti: 'ሕቶ', tr: 'Soru', uk: 'Питання' })} ${i + 1}</span>
            <b>${isCorrect ? tr({ sv: 'Rätt', en: 'Correct', 'zh-Hans': '答对', 'zh-Hant': '答對', ar: 'صحيحة', ckb: 'ڕاست', fa: 'درست', pl: 'Poprawnie', so: 'Sax', ti: 'ቅኑዕ', tr: 'Doğru', uk: 'Правильно' }) : tr({ sv: 'Fel', en: 'Needs review', 'zh-Hans': '答错', 'zh-Hant': '答錯', ar: 'بحاجة إلى مراجعة', ckb: 'پێویستی بە پێداچوونەوە هەیە', fa: 'نیازمند مرور', pl: 'Błędnie', so: 'Khalad', ti: 'ጌጋ', tr: 'Yanlış', uk: 'Неправильно' })}</b>
          </summary>
          <div class="mock-review__body">
            <p class="mock-review__q">${escapeHtml(tr(q.q))}</p>
            <dl>
              <div>
                <dt>${tr({ sv: 'Ditt svar', en: 'Your answer', 'zh-Hans': '你的答案', 'zh-Hant': '你的答案', ar: 'إجابتك', ckb: 'وەڵامەکەت', fa: 'پاسخ شما', pl: 'Twoja odpowiedź', so: 'Jawaabtaada', ti: 'መልስኻ', tr: 'Cevabınız', uk: 'Ваша відповідь' })}</dt>
                <dd>${escapeHtml(selectedText)}</dd>
              </div>
              <div>
                <dt>${tr({ sv: 'Rätt svar', en: 'Correct answer', 'zh-Hans': '正确答案', 'zh-Hant': '正確答案', ar: 'الإجابة الصحيحة', ckb: 'وەڵامی ڕاست', fa: 'پاسخ درست', pl: 'Prawidłowa odpowiedź', so: 'Jawaabta saxda ah', ti: 'ቅኑዕ መልሲ', tr: 'Doğru cevap', uk: 'Правильна відповідь' })}</dt>
                <dd>${escapeHtml(correctText)}</dd>
              </div>
            </dl>
            <p class="mock-review__why">${escapeHtml(tr(q.why))}</p>
            ${questionSourceRow(q, 'mock-review__source')}
          </div>
        </details>
      `;
      })
      .join('');

    stage.innerHTML = `
      <div class="mock-result ${strongPracticeScore ? 'is-strong' : 'needs-study'}">
        <span class="eyebrow">${tr({ sv: 'Resultat', en: 'Result', 'zh-Hans': '练习成绩', 'zh-Hant': '練習成績', ar: 'النتيجة', ckb: 'ئەنجام', fa: 'نتیجه', pl: 'Wynik ćwiczenia', so: 'Natiijada tababarka', ti: 'ውጽኢት ልምምድ', tr: 'Alıştırma puanı', uk: 'Результат тренування' })}</span>
        <p class="quiz__score">
          <span id="mock-score-num">0</span><em>/</em>${total}
        </p>
        <h2 class="mock-result__verdict">${tr({ sv: 'Övningspass klart.', en: 'Practice round complete.', 'zh-Hans': '本轮练习已完成。', 'zh-Hant': '本輪練習已完成。', ar: 'اكتملت جولة التدريب.', ckb: 'خولی مەشق تەواو بوو.', fa: 'دور تمرین کامل شد.', pl: 'Ćwiczenie ukończone.', so: 'Wareegga tababarka waa dhammaaday.', ti: 'ዙር ልምምድ ተወዲኡ።', tr: 'Alıştırma turu tamamlandı.', uk: 'Тренувальний раунд завершено.' })}</h2>
        <p class="mock-result__pct">${pct}% — ${correct}/${total} ${tr({ sv: 'rätt', en: 'correct', 'zh-Hans': '答对', 'zh-Hant': '答對', ar: 'صحيحة', ckb: 'ڕاست', fa: 'درست', pl: 'poprawnie', so: 'sax', ti: 'ቅኑዕ', tr: 'doğru', uk: 'правильно' })}</p>

        <ul class="result-chapters">${chapterRows}</ul>
        ${window.smtAdSlotMarkup ? window.smtAdSlotMarkup('practice') : ''}
        <section class="mock-review" aria-label="${tr({ sv: 'Frågegenomgång', en: 'Question review', 'zh-Hans': '题目回顾', 'zh-Hant': '題目回顧', ar: 'مراجعة الأسئلة', ckb: 'پێداچوونەوەی پرسیارەکان', fa: 'مرور سؤال‌ها', pl: 'Przegląd pytań', so: "Dib u eegista su'aalaha", ti: 'ምርመራ ሕቶታት', tr: 'Soru incelemesi', uk: 'Огляд питань' })}">
          <h3>${tr({ sv: 'Frågegenomgång', en: 'Question review', 'zh-Hans': '题目回顾', 'zh-Hant': '題目回顧', ar: 'مراجعة الأسئلة', ckb: 'پێداچوونەوەی پرسیارەکان', fa: 'مرور سؤال‌ها', pl: 'Przegląd pytań', so: "Dib u eegista su'aalaha", ti: 'ምርመራ ሕቶታት', tr: 'Soru incelemesi', uk: 'Огляд питань' })}</h3>
          <p class="mock-review__disclaimer">${escapeHtml(questionReviewDisclaimer())}</p>
          ${reviewRows}
        </section>

        <div class="quiz__cta">
          <a class="btn btn--ghost" href="#/mock?run=1">${tr({ sv: 'Försök igen', en: 'Try again', 'zh-Hans': '再试一次', 'zh-Hant': '再試一次', ar: 'حاول مرة أخرى', ckb: 'جارێکی تر هەوڵ بدە', fa: 'دوباره تلاش کنید', pl: 'Spróbuj ponownie', so: 'Mar kale isku day', ti: 'እንደገና ፈትን', tr: 'Tekrar deneyin', uk: 'Спробувати ще раз' })} ↻</a>
          <a class="btn btn--gold" href="#/practice">${tr({ sv: 'Studera mer', en: 'Study more', 'zh-Hans': '继续学习', 'zh-Hant': '繼續學習', ar: 'ادرس أكثر', ckb: 'زیاتر بخوێنە', fa: 'بیشتر مطالعه کنید', pl: 'Ucz się dalej', so: 'Wax badan baro', ti: 'ዝያዳ ተማሃር', tr: 'Daha fazla çalış', uk: 'Вчитися далі' })} →</a>
        </div>
      </div>
    `;

    if (window.smtMountAds) window.smtMountAds();

    if (window.smtFx) {
      window.smtFx.countUp(document.getElementById('mock-score-num'), 0, correct, 1100);
      if (strongPracticeScore) {
        setTimeout(() => window.smtFx.rain({ colors: window.smtFx.PALETTES.big, count: 90 }), 300);
        if (window.smtBuddyCelebrate) window.smtBuddyCelebrate(mockBuddyMessage('strong', { pct }));
      } else if (window.smtBuddyConsole) {
        window.smtBuddyConsole(mockBuddyMessage('review'));
      }
    }
  }

  // ---------- routing hooks ----------

  function activePracticeChapter() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    const m = hash.match(/[?&]c=([^&]+)/);
    return m ? m[1] : null;
  }
  function isOnPractice() {
    return (location.hash || '#/').replace(/^#/, '').split('?')[0] === '/practice';
  }

  // tell the existing quiz which questions to use, then let it render
  window.smtPracticeFilterFor = function () {
    const c = activePracticeChapter();
    if (!c) return null;
    if (c === 'mix') {
      // random 10 from any chapter, respecting source preference
      const all = (window.SMT_QUESTIONS || [])
        .filter(questionMatchesSourcePref)
        .filter(questionMatchesDisplayLocale);
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all.slice(0, 10);
    }
    const chId = parseInt(c, 10);
    if (isNaN(chId)) return null;
    return (window.SMT_QUESTIONS || [])
      .filter((q) => q.chapterId === chId)
      .filter(questionMatchesSourcePref)
      .filter(questionMatchesDisplayLocale);
  };

  // re-render hub when we return to /practice without ?c=
  function onRoute() {
    if (isOnPractice() && !activePracticeChapter()) {
      withQuestionBank('quiz-stage', renderPracticeHub);
    }
    if (isOnMock()) {
      withQuestionBank('mock-stage', mockBoot);
    }
  }

  function rerenderForLanguageChange() {
    if (isOnPractice()) {
      if (activePracticeChapter()) {
        if (typeof window.smtQuizRender === 'function') window.smtQuizRender();
      } else {
        withQuestionBank('quiz-stage', renderPracticeHub);
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
      withQuestionBank('mock-stage', mockBoot);
    }
  }

  document.addEventListener('click', (e) => {
    const pick = e.target.closest('#mock-stage .mock-opt');
    if (pick) {
      MOCK.answers[MOCK.i] = parseInt(pick.dataset.pick, 10);
      renderMockExam();
      return;
    }
    const go = e.target.closest('#mock-stage .mock-dot');
    if (go) {
      MOCK.i = parseInt(go.dataset.go, 10);
      renderMockExam();
      return;
    }
    if (e.target.closest('#mock-prev')) {
      MOCK.i = Math.max(0, MOCK.i - 1);
      renderMockExam();
      return;
    }
    if (e.target.closest('#mock-next')) {
      MOCK.i = Math.min(MOCK.questions.length - 1, MOCK.i + 1);
      renderMockExam();
      return;
    }
    if (e.target.closest('#mock-submit')) {
      const unanswered = MOCK.answers.filter((a) => a === null).length;
      const msg = mockSubmitConfirmMessage(unanswered);
      if (confirm(msg)) submitMock();
      return;
    }
  });

  window.addEventListener('hashchange', onRoute);
  window.addEventListener('DOMContentLoaded', onRoute);
  window.addEventListener('smt:questionbankready', onRoute);
  window.addEventListener('smt:languagechange', rerenderForLanguageChange);

  // Re-render hub when language changes
  document.addEventListener('click', (e) => {
    if (
      e.target.closest('.lang button[data-lang]') ||
      e.target.closest('.lang-menu button[data-lang]') ||
      e.target.closest('[data-set="language"], select[data-set="language"]')
    ) {
      setTimeout(() => {
        if (isOnPractice() && !activePracticeChapter()) {
          withQuestionBank('quiz-stage', renderPracticeHub);
        }
      }, 60);
    }
  });
})();
