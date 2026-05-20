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
  function sourceCitation(question) {
    const sv = lang() === 'sv';
    const source = question && question.source;
    if (!source) return tr({ sv: 'Källhänvisning saknas', en: 'Source citation unavailable', 'zh-Hans': '缺少资料来源标注', 'zh-Hant': '缺少資料來源標註', ar: 'لا تتوفر إشارة إلى المصدر', ckb: 'ئاماژە بە سەرچاوە بەردەست نییە', fa: 'ارجاع به منبع در دسترس نیست', pl: 'Brak źródła', so: 'Tixraac lama hayo', ti: 'ምንጪ የለን', tr: 'Kaynak gösterimi yok', uk: 'Джерело недоступне' });
    const title = source.title || 'Sverige i fokus';
    if (!source.chapter || !source.section || source.page === undefined || source.page === null) {
      return tr({ sv: 'Källhänvisning saknas', en: 'Source citation unavailable', 'zh-Hans': '缺少资料来源标注', 'zh-Hant': '缺少資料來源標註', ar: 'لا تتوفر إشارة إلى المصدر', ckb: 'ئاماژە بە سەرچاوە بەردەست نییە', fa: 'ارجاع به منبع در دسترس نیست', pl: 'Brak źródła', so: 'Tixraac lama hayo', ti: 'ምንጪ የለን', tr: 'Kaynak gösterimi yok', uk: 'Джерело недоступне' });
    }
    return sv
      ? `Källa: ${title}, ${source.chapter}, ${source.section}, s. ${source.page}`
      : `Source: ${title}, ${source.chapter}, ${source.section}, p. ${source.page}`;
  }
  function questionReviewDisclaimer() {
    return tr({ sv: 'Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga.', en: 'Independent study practice, not a real exam or an official UHR question.', 'zh-Hans': '独立练习，并非真正的考试，也不是官方 UHR 试题。', 'zh-Hant': '獨立練習，並非真正的考試，也不是官方 UHR 試題。', ar: 'تدريب مستقل، وليس اختبارًا حقيقيًا ولا سؤالًا رسميًا من UHR.', ckb: 'مەشقی سەربەخۆیە، نەک تاقیکردنەوەیەکی ڕاستەقینە یان پرسیارێکی فەرمیی UHR.', fa: 'تمرین مستقل است، نه یک آزمون واقعی و نه یک سؤال رسمی UHR.', pl: 'Niezależne ćwiczenie, nie prawdziwy egzamin ani oficjalne pytanie UHR.', so: 'Tababar madaxbannaan, ma aha imtixaan dhab ah ama su\'aal rasmi ah oo UHR.', ti: 'ናጻ ልምምድ፣ ናይ ሓቂ ፈተና ወይ ወግዓዊ ሕቶ UHR ኣይኮነን።', tr: 'Bağımsız alıştırma; gerçek bir sınav veya resmî bir UHR sorusu değildir.', uk: 'Незалежне тренування, не справжній іспит і не офіційне питання UHR.' });
  }
  const provenanceCopy = {
    uhr: {
      en: { label: 'UHR', description: "Based on UHR's study material Sverige i fokus." },
      sv: { label: 'UHR', description: 'Baserad på UHR:s studiematerial Sverige i fokus.' },
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
    },
    editorial: {
      en: { label: 'Editorial', description: 'Hand-written editorial context.' },
      sv: { label: 'Redaktionell', description: 'Redaktionellt skrivet sammanhang.' },
    },
  };
  function questionProvenance(question) {
    const direct = question && question.questionProvenance;
    if (direct === 'uhr' || direct === 'derived' || direct === 'editorial') return direct;
    const tags = Array.isArray(question && question.tags) ? question.tags : [];
    if (tags.includes('editorial')) return 'editorial';
    if (tags.includes('published-variant')) return 'derived';
    return 'uhr';
  }
  function provenanceBadge(question) {
    const sv = lang() === 'sv';
    const provenance = questionProvenance(question);
    const copy = provenanceCopy[provenance][sv ? 'sv' : 'en'] || provenanceCopy[provenance].en;
    const ariaPrefix = tr({ sv: 'Källtyp', en: 'Provenance', 'zh-Hans': '来源类型', 'zh-Hant': '來源類型', ar: 'نوع المصدر', ckb: 'جۆری سەرچاوە', fa: 'نوع منبع', pl: 'Typ źródła', so: 'Nooca ilaha', ti: 'ዓይነት ምንጪ', tr: 'Kaynak türü', uk: 'Тип джерела' });
    const notePrefix = tr({ sv: 'Källanteckning', en: 'Source note', 'zh-Hans': '来源备注', 'zh-Hant': '來源備註', ar: 'ملاحظة المصدر', ckb: 'تێبینیی سەرچاوە', fa: 'یادداشت منبع', pl: 'Notatka o źródle', so: 'Qoraal ilaha', ti: 'መዘክር ምንጪ', tr: 'Kaynak notu', uk: 'Примітка до джерела' });
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

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem('smt_progress') || '{}');
    } catch {
      return {};
    }
  }
  function saveProgress(p) {
    try {
      localStorage.setItem('smt_progress', JSON.stringify(p));
    } catch {}
  }

  // For external code (the quiz) to call after each answer
  window.smtRecordAnswer = function (chapterId, correct) {
    const p = getProgress();
    const k = 'ch' + chapterId;
    p[k] = p[k] || { answered: 0, correct: 0 };
    p[k].answered++;
    if (correct) p[k].correct++;
    saveProgress(p);
  };

  // Mock exam history
  function getMockHistory() {
    try {
      return JSON.parse(localStorage.getItem('smt_mocks') || '[]');
    } catch {
      return [];
    }
  }
  function pushMock(entry) {
    const h = getMockHistory();
    h.unshift(entry);
    try {
      localStorage.setItem('smt_mocks', JSON.stringify(h.slice(0, 8)));
    } catch {}
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

        <p class="hub__hint">${
          tr({ sv: 'Tips: Övning lagrar dina framsteg lokalt. Inget konto behövs.', en: 'Tip: progress is saved on this device. No account needed.', 'zh-Hans': '提示：练习进度仅保存在本设备上，无需账户。', 'zh-Hant': '提示：練習進度只會儲存在這台裝置上，無需帳戶。', ar: 'نصيحة: يُحفَظ تقدمك على هذا الجهاز. لا حاجة إلى حساب.', ckb: 'ئامۆژگاری: پێشکەوتنت لەسەر ئەم ئامێرە پاشەکەوت دەکرێت. پێویست بە هەژمار نییە.', fa: 'نکته: پیشرفت شما روی این دستگاه ذخیره می‌شود. به حساب کاربری نیازی نیست.', pl: 'Wskazówka: postępy są zapisywane na tym urządzeniu. Konto nie jest potrzebne.', so: 'Talo: horumarka waxaa lagu kaydiyaa qalabkan. Akoon looma baahna.', ti: 'ምኽሪ፦ ምዕባለ ኣብዚ መሳርሒ ይቕመጥ። ኣካውንት ኣየድልን።', tr: 'İpucu: ilerleme bu cihazda kaydedilir. Hesap gerekmez.', uk: 'Підказка: прогрес зберігається на цьому пристрої. Обліковий запис не потрібен.' })
        }</p>
      </div>
    `;
  }
  window.smtRenderPracticeHub = renderPracticeHub;

  // ---------- mock exam ----------

  const MOCK_DEFAULTS = { count: 25, minutes: 30, chapters: 'all' };
  function loadMockCfg() {
    try {
      return Object.assign(
        {},
        MOCK_DEFAULTS,
        JSON.parse(localStorage.getItem('smt_mock_cfg') || '{}'),
      );
    } catch {
      return Object.assign({}, MOCK_DEFAULTS);
    }
  }
  function saveMockCfg(cfg) {
    try {
      localStorage.setItem('smt_mock_cfg', JSON.stringify(cfg));
    } catch {}
  }
  function isStaticMockUhrQuestion(question) {
    return questionProvenance(question) === 'uhr';
  }
  function mockQuestionPool() {
    return (window.SMT_QUESTIONS || []).filter(isStaticMockUhrQuestion);
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
        return `<button class="mock-chip ${on ? 'is-on' : ''}" data-chip="${c.id}">
        <span class="mock-chip__emoji">${c.emoji}</span>
        <span class="mock-chip__num">CH ${String(c.id).padStart(2, '0')}</span>
        <span class="mock-chip__t">${c.title[lang()] || c.title.en}</span>
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
          <span class="eyebrow">${tr({ sv: 'Övningsprov', en: 'Mock exam', 'zh-Hans': '模拟考试', 'zh-Hant': '模擬考試', ar: 'اختبار تجريبي', ckb: 'تاقیکردنەوەی ئەزموونی', fa: 'آزمون آزمایشی', pl: 'Egzamin próbny', so: 'Imtixaan tijaabo ah', ti: 'ናይ ልምምድ ፈተና', tr: 'Deneme sınavı', uk: 'Пробний іспит' })}</span>
          <h1 class="practice__title">
            <span>${tr({ sv: 'Bygg ditt övningsprov.', en: 'Build your practice round.', 'zh-Hans': '自定义你的练习。', 'zh-Hant': '自訂你的練習。', ar: 'كوّن جولة تدريبك.', ckb: 'خولی مەشقی خۆت دروست بکە.', fa: 'دور تمرین خود را بسازید.', pl: 'Zbuduj swoją rundę ćwiczeniową.', so: 'Dhis wareeggaaga tababarka.', ti: 'ዙር ልምምድካ ስራሕ።', tr: 'Alıştırma turunu oluşturun.', uk: 'Створіть свій тренувальний раунд.' })}</span>
          </h1>
          <p class="mock-landing__lede">${
            tr({ sv: 'Välj antal frågor, tid och vilka kapitel du vill testas på. Vi blandar och slumpar resten.', en: 'Pick the question count, timer, and which chapters to include. We\'ll shuffle the rest.', 'zh-Hans': '选择题目数量、时间，以及想要测验的章节。其余部分由我们打乱并随机抽取。', 'zh-Hant': '選擇題目數量、時間，以及想要測驗的章節。其餘部分由我們打亂並隨機抽取。', ar: 'اختر عدد الأسئلة والمؤقّت والفصول التي تريد تضمينها. سنخلط البقية ونرتّبها عشوائيًا.', ckb: 'ژمارەی پرسیارەکان، کاتژمێر و ئەو بەشانەی دەتەوێت لەخۆیان بگرن هەڵبژێرە. ئێمە ئەوانی تر تێکەڵ و هەڕەمەکی دەکەین.', fa: 'تعداد سؤال‌ها، زمان‌سنج و فصل‌هایی را که می‌خواهید گنجانده شوند انتخاب کنید. ما بقیه را به‌هم می‌زنیم و تصادفی می‌چینیم.', pl: 'Wybierz liczbę pytań, czas i rozdziały, z których chcesz być sprawdzany. Resztę wymieszamy i wylosujemy.', so: 'Dooro tirada su\'aalaha, waqtiga iyo cutubyada aad rabto in lagugu imtixaamo. Inta kale waannu isku qaspaynaa oo random ka dhignaa.', ti: 'ቍጽሪ ሕቶታት፣ ግዜን ኣየኖት ምዕራፋት ክትፍተን ከም እትደሊን ምረጽ። ነቲ ዝተረፈ ንሕና ነሕውሶን ብrandom ንመርጾን።', tr: 'Soru sayısını, süreyi ve hangi bölümlerden sınanmak istediğinizi seçin. Gerisini biz karıştırıp rastgele seçeriz.', uk: 'Виберіть кількість питань, час і розділи, з яких хочете перевіритися. Решту ми перемішаємо й виберемо випадково.' })
          }</p>

          <div class="mock-cfg">
            <div class="mock-cfg__row">
              <label class="mock-cfg__label">
                <span>${tr({ sv: 'Frågor', en: 'Questions', 'zh-Hans': '题目', 'zh-Hant': '題目', ar: 'الأسئلة', ckb: 'پرسیارەکان', fa: 'سؤال‌ها', pl: 'Pytania', so: 'Su\'aalaha', ti: 'ሕቶታት', tr: 'Sorular', uk: 'Питання' })}</span>
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
              <span><b>${tr({ sv: 'Ingen återkoppling', en: 'Practice timer only', 'zh-Hans': '无反馈', 'zh-Hant': '無回饋', ar: 'مؤقّت تدريب فقط', ckb: 'تەنها کاتژمێری مەشق', fa: 'فقط زمان‌سنج تمرین', pl: 'Brak informacji zwrotnej', so: 'Jawaab celin ma jirto', ti: 'ዝኾነ ግብረ መልሲ የለን', tr: 'Geri bildirim yok', uk: 'Без зворотного зв\'язку' })}</b> ${tr({ sv: 'förrän inlämnat', en: 'not official exam timing', 'zh-Hans': '提交前不显示', 'zh-Hant': '提交前不顯示', ar: 'ليس توقيت اختبار رسمي', ckb: 'کاتبەندیی تاقیکردنەوەی فەرمی نییە', fa: 'زمان‌بندی آزمون رسمی نیست', pl: 'do momentu oddania', so: 'ilaa la gudbiyo', ti: 'ክሳብ ዝቐርብ', tr: 'teslim edilene kadar', uk: 'доки не здано' })}</span>
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
      if (hint) hint.textContent = (tr({ sv: 'Max ', en: 'Max ', 'zh-Hans': '最长 ', 'zh-Hant': '最長 ', ar: 'الحد الأقصى ', ckb: 'زۆرترین ', fa: 'بیشینه ', pl: 'Maks. ', so: 'Ugu badnaan ', ti: 'ዝለዓለ ', tr: 'Maks. ', uk: 'Макс. ' })) + available;
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
      out2.textContent = e.target.value + (tr({ sv: ' min', en: ' min', 'zh-Hans': ' 分钟', 'zh-Hant': ' 分鐘', ar: ' دقيقة', ckb: ' خولەک', fa: ' دقیقه', pl: ' min', so: ' daq', ti: ' ደቒቓ', tr: ' dk', uk: ' хв' }));
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
        const cls = k === i ? 'is-on' : MOCK.answers[k] !== null ? 'is-done' : '';
        return `<button class="mock-dot ${cls}" data-go="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`;
      })
      .join('');

    const opts = displayOptions(q, `mock:${MOCK.startedAt || 'preview'}:${i}`)
      .map(({ option: o, originalIndex, displayIndex }) => {
        const cls = chosen === originalIndex ? 'is-chosen' : '';
        return `
        <button class="mock-opt ${cls}" data-pick="${originalIndex}">
          <span class="key">${String.fromCharCode(65 + displayIndex)}</span>
          <span>${o[lang()] || o.en}</span>
        </button>
      `;
      })
      .join('');

    const answered = MOCK.answers.filter((a) => a !== null).length;

    stage.innerHTML = `
      <div class="mock-shell">
        <header class="mock-bar">
          <div class="mock-bar__title">
            <span class="eyebrow">${tr({ sv: 'Övningsprov', en: 'Mock exam', 'zh-Hans': '模拟考试', 'zh-Hant': '模擬考試', ar: 'اختبار تجريبي', ckb: 'تاقیکردنەوەی ئەزموونی', fa: 'آزمون آزمایشی', pl: 'Egzamin próbny', so: 'Imtixaan tijaabo ah', ti: 'ናይ ልምምድ ፈተና', tr: 'Deneme sınavı', uk: 'Пробний іспит' })}</span>
            <span class="mock-bar__counter">${i + 1} / ${n}</span>
          </div>
          <div class="mock-bar__timer">
            <span class="mock-bar__timerlabel">${tr({ sv: 'Återstår', en: 'Time left', 'zh-Hans': '剩余', 'zh-Hant': '剩餘', ar: 'الوقت المتبقي', ckb: 'کاتی ماوە', fa: 'زمان باقی‌مانده', pl: 'Pozostało', so: 'Hadhay', ti: 'ዝተረፈ', tr: 'Kalan süre', uk: 'Залишилося' })}</span>
            <span class="mock-timer" id="mock-timer">--:--</span>
          </div>
          <button class="btn btn--ghost btn--sm" id="mock-submit">${tr({ sv: 'Lämna in', en: 'Submit', 'zh-Hans': '交卷', 'zh-Hant': '交卷', ar: 'إرسال', ckb: 'ناردن', fa: 'ثبت', pl: 'Oddaj', so: 'Gudbi', ti: 'ኣረክብ', tr: 'Gönder', uk: 'Здати' })}</button>
        </header>

        <div class="mock-grid" aria-label="${tr({ sv: 'Frågenavigering', en: 'Question navigation', 'zh-Hans': '题目导航', 'zh-Hant': '題目導覽', ar: 'التنقّل بين الأسئلة', ckb: 'گەشتکردن لە پرسیارەکاندا', fa: 'پیمایش سؤال‌ها', pl: 'Nawigacja po pytaniach', so: 'Hagista su\'aalaha', ti: 'ምልጋብ ሕቶታት', tr: 'Soru gezinmesi', uk: 'Навігація по питаннях' })}">${dots}</div>

        <div class="mock-card">
          <div class="quiz__crumb">Ch ${q.chapterId}</div>
          <h2 class="quiz__q">${q.q[lang()] || q.q.en}</h2>
          ${questionSourceRow(q)}
          <p class="quiz__disclaimer">${escapeHtml(questionReviewDisclaimer())}</p>
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
          picked === null ? (tr({ sv: 'Inte besvarad', en: 'Not answered', 'zh-Hans': '未作答', 'zh-Hant': '未作答', ar: 'غير مُجاب عنها', ckb: 'وەڵام نەدراوە', fa: 'پاسخ‌داده‌نشده', pl: 'Bez odpowiedzi', so: 'Lama jawaabin', ti: 'ኣይተመለሰን', tr: 'Yanıtlanmadı', uk: 'Без відповіді' })) : tr(q.opts[picked]);
        const correctText = tr(q.opts[q.answer]);
        return `
        <details class="mock-review__item ${isCorrect ? 'is-correct' : 'is-wrong'}">
          <summary>
            <span>${tr({ sv: 'Fråga', en: 'Question', 'zh-Hans': '题目', 'zh-Hant': '題目', ar: 'سؤال', ckb: 'پرسیار', fa: 'سؤال', pl: 'Pytanie', so: 'Su\'aal', ti: 'ሕቶ', tr: 'Soru', uk: 'Питання' })} ${i + 1}</span>
            <b>${isCorrect ? (tr({ sv: 'Rätt', en: 'Correct', 'zh-Hans': '答对', 'zh-Hant': '答對', ar: 'صحيحة', ckb: 'ڕاست', fa: 'درست', pl: 'Poprawnie', so: 'Sax', ti: 'ቅኑዕ', tr: 'Doğru', uk: 'Правильно' })) : tr({ sv: 'Fel', en: 'Needs review', 'zh-Hans': '答错', 'zh-Hant': '答錯', ar: 'بحاجة إلى مراجعة', ckb: 'پێویستی بە پێداچوونەوە هەیە', fa: 'نیازمند مرور', pl: 'Błędnie', so: 'Khalad', ti: 'ጌጋ', tr: 'Yanlış', uk: 'Неправильно' })}</b>
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
            <p class="mock-review__disclaimer">${escapeHtml(questionReviewDisclaimer())}</p>
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
        <h2 class="mock-result__verdict">${tr({ sv: 'Övningen är klar.', en: 'Practice round complete.', 'zh-Hans': '本轮练习已完成。', 'zh-Hant': '本輪練習已完成。', ar: 'اكتملت جولة التدريب.', ckb: 'خولی مەشق تەواو بوو.', fa: 'دور تمرین کامل شد.', pl: 'Ćwiczenie ukończone.', so: 'Wareegga tababarka waa dhammaaday.', ti: 'ዙር ልምምድ ተወዲኡ።', tr: 'Alıştırma turu tamamlandı.', uk: 'Тренувальний раунд завершено.' })}</h2>
        <p class="mock-result__pct">${pct}% — ${correct}/${total} ${tr({ sv: 'rätt', en: 'correct', 'zh-Hans': '答对', 'zh-Hant': '答對', ar: 'صحيحة', ckb: 'ڕاست', fa: 'درست', pl: 'poprawnie', so: 'sax', ti: 'ቅኑዕ', tr: 'doğru', uk: 'правильно' })}</p>

        <ul class="result-chapters">${chapterRows}</ul>
        <section class="mock-review" aria-label="${tr({ sv: 'Frågegenomgång', en: 'Question review', 'zh-Hans': '题目回顾', 'zh-Hant': '題目回顧', ar: 'مراجعة الأسئلة', ckb: 'پێداچوونەوەی پرسیارەکان', fa: 'مرور سؤال‌ها', pl: 'Przegląd pytań', so: 'Dib u eegista su\'aalaha', ti: 'ምርመራ ሕቶታት', tr: 'Soru incelemesi', uk: 'Огляд питань' })}">
          <h3>${tr({ sv: 'Frågegenomgång', en: 'Question review', 'zh-Hans': '题目回顾', 'zh-Hant': '題目回顧', ar: 'مراجعة الأسئلة', ckb: 'پێداچوونەوەی پرسیارەکان', fa: 'مرور سؤال‌ها', pl: 'Przegląd pytań', so: 'Dib u eegista su\'aalaha', ti: 'ምርመራ ሕቶታት', tr: 'Soru incelemesi', uk: 'Огляд питань' })}</h3>
          ${reviewRows}
        </section>

        <div class="quiz__cta">
          <a class="btn btn--ghost" href="#/mock?run=1">${tr({ sv: 'Försök igen', en: 'Try again', 'zh-Hans': '再试一次', 'zh-Hant': '再試一次', ar: 'حاول مرة أخرى', ckb: 'جارێکی تر هەوڵ بدە', fa: 'دوباره تلاش کنید', pl: 'Spróbuj ponownie', so: 'Mar kale isku day', ti: 'እንደገና ፈትን', tr: 'Tekrar deneyin', uk: 'Спробувати ще раз' })} ↻</a>
          <a class="btn btn--gold" href="#/practice">${tr({ sv: 'Studera mer', en: 'Study more', 'zh-Hans': '继续学习', 'zh-Hant': '繼續學習', ar: 'ادرس أكثر', ckb: 'زیاتر بخوێنە', fa: 'بیشتر مطالعه کنید', pl: 'Ucz się dalej', so: 'Wax badan baro', ti: 'ዝያዳ ተማሃር', tr: 'Daha fazla çalış', uk: 'Вчитися далі' })} →</a>
        </div>
      </div>
    `;

    if (window.smtFx) {
      window.smtFx.countUp(document.getElementById('mock-score-num'), 0, correct, 1100);
      if (strongPracticeScore) {
        setTimeout(() => window.smtFx.rain({ colors: window.smtFx.PALETTES.big, count: 90 }), 300);
        if (window.smtBuddyCelebrate)
          window.smtBuddyCelebrate(
            `${pct}%. Strong practice round.`,
            `${pct}%. Stark övningsrunda.`,
          );
      } else if (window.smtBuddyConsole) {
        window.smtBuddyConsole(
          'Review the weak chapters, then try another practice round.',
          'Öva svaga kapitel och testa en ny övningsrunda.',
        );
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
        if (typeof window.smtQuizRender === 'function') window.smtQuizRender();
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
      const sv = lang() === 'sv';
      const msg = unanswered
        ? sv
          ? `Du har ${unanswered} obesvarade frågor. Lämna in ändå?`
          : `You have ${unanswered} unanswered questions. Submit anyway?`
        : tr({ sv: 'Lämna in?', en: 'Submit?', 'zh-Hans': '确认交卷？', 'zh-Hant': '確認交卷？', ar: 'إرسال؟', ckb: 'بنێردرێت؟', fa: 'ثبت شود؟', pl: 'Oddać?', so: 'Ma gudbinaysaa?', ti: 'ይቐርብ?', tr: 'Gönderilsin mi?', uk: 'Здати?' });
      if (confirm(msg)) submitMock();
      return;
    }
  });

  window.addEventListener('hashchange', onRoute);
  window.addEventListener('DOMContentLoaded', onRoute);
  window.addEventListener('smt:languagechange', rerenderForLanguageChange);

  // Re-render hub when language changes
  document.addEventListener('click', (e) => {
    if (
      e.target.closest('.lang button[data-lang]') ||
      e.target.closest('.lang-menu button[data-lang]') ||
      e.target.closest('[data-set="language"], select[data-set="language"]')
    ) {
      setTimeout(() => {
        if (isOnPractice() && !activePracticeChapter()) renderPracticeHub();
      }, 60);
    }
  });
})();
