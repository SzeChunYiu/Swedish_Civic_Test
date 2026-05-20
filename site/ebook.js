/* Almost Swedish — Ebook reader
   Intro + 13 study chapters with EN reader text and SV study briefs.
   Hash: #/ebook?c=intro|1|2|...|13
*/

(function () {
  'use strict';

  const EBOOK_FACTBOX_SOURCE_NOTES = Object.freeze({
    uhrStudyMaterial: {
      label: 'UHR public study material',
      url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
      retrievedDate: '2026-05-19',
    },
    scbLandUse: {
      label: 'SCB land and water area statistics',
      url: 'https://www.scb.se/mi0803-en',
      retrievedDate: '2026-05-19',
    },
    riksbankHistory: {
      label: 'Riksbank historical timeline',
      url: 'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
      retrievedDate: '2026-05-19',
    },
    governmentNato: {
      label: 'Government Offices NATO membership notice',
      url: 'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
      retrievedDate: '2026-05-19',
    },
    editorialCommentary: {
      label: 'Editorial commentary',
      retrievedDate: '2026-05-19',
    },
  });

  const OFFICIAL_TEST_SOURCE_NOTES = Object.freeze([
    {
      label: 'UHR: Om medborgarskapsprovet',
      url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
      retrievedDate: '2026-05-19',
      claimEn:
        'first civic-knowledge sitting will be held on 15 August 2026 in Stockholm; free of charge; generous time; UHR has not yet published the exact time and place',
      claimSv:
        'första samhällskunskapsprovet inom medborgarskapsprovet hålls den 15 augusti 2026 i Stockholm; kostnadsfritt; generöst med tid; Praktiska detaljer väntar hos UHR',
    },
    {
      label: 'UHR: Frågor och svar',
      url: 'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
      retrievedDate: '2026-05-19',
      claimEn: 'Seats are limited',
      claimSv: 'Antalet platser är begränsat',
    },
    {
      label: 'UHR: Anmälan',
      url: 'https://www.uhr.se/medborgarskapsprovet/anmalan/',
      retrievedDate: '2026-05-19',
      claimEn: 'only people who receive a letter from Migrationsverket can sign up',
      claimSv: 'anmälan kräver brev från Migrationsverket',
    },
    {
      label: 'UHR: Utbildningsmaterial',
      url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
      retrievedDate: '2026-05-19',
      claimEn: 'UHR study material is the current preparation baseline',
      claimSv: 'UHR:s utbildningsmaterial är nuvarande grund för förberedelser',
    },
  ]);

  function sourceLink(note) {
    if (!note.url) return `${note.label} (${note.retrievedDate})`;
    return `<a href="${note.url}">${note.label}</a> (${note.retrievedDate})`;
  }

  function officialTestSourceLinks() {
    return OFFICIAL_TEST_SOURCE_NOTES.map(
      (source) => `<a href="${source.url}">${source.label}</a>`,
    ).join(' · ');
  }

  function ebookSourceNote(lang, sourceKeys) {
    const notes = sourceKeys.map((key) => EBOOK_FACTBOX_SOURCE_NOTES[key]).filter(Boolean);
    const label = tr({
      sv: 'Källor hämtade',
      en: 'Sources accessed',
      'zh-Hans': '已获取来源',
      'zh-Hant': '已取得來源',
      ar: 'المصادر التي تمّ الوصول إليها',
      ckb: 'سەرچاوەکانی دەستگەیشتوو',
      fa: 'منابع مشاهده‌شده',
      pl: 'Pobrane źródła',
      so: 'Ilaha la helay',
      ti: 'ዝተረኽቡ ምንጪታት',
      tr: 'Erişilen kaynaklar',
      uk: 'Отримані джерела',
    });
    return `<p class="ebook__source-note">${label}: ${notes.map(sourceLink).join(' · ')}</p>`;
  }

  function ebookFactBox(lang, heading, facts, sourceKeys) {
    if (!Array.isArray(sourceKeys) || sourceKeys.length === 0) {
      throw new Error('ebookFactBox requires explicit sourceKeys');
    }
    const resolvedHeading =
      heading ||
      tr({
        sv: 'Fakta att repetera',
        en: 'Facts to review',
        'zh-Hans': '需复习的知识点',
        'zh-Hant': '需複習的知識點',
        ar: 'حقائق للمراجعة',
        ckb: 'ڕاستییەکان بۆ پێداچوونەوە',
        fa: 'نکته‌هایی برای مرور',
        pl: 'Fakty do powtórzenia',
        so: 'Xaqiiqooyinka dib loo eegayo',
        ti: 'ዝድገሙ ሓቅታት',
        tr: 'Tekrar edilecek bilgiler',
        uk: 'Факти для повторення',
      });
    return `
      <div class="ebook__factbox">
        <h4>${resolvedHeading}</h4>
        <p>${facts}</p>
        ${ebookSourceNote(lang, sourceKeys)}
      </div>
    `;
  }

  function getEbookChapterSourceKeys(chapterId) {
    const externalByChapter = {
      intro: [],
      1: ['governmentNato'],
      7: ['scbLandUse'],
      10: ['riksbankHistory'],
      11: ['governmentNato'],
      12: ['governmentNato'],
    };
    return ['uhrStudyMaterial', ...(externalByChapter[chapterId] || []), 'editorialCommentary'];
  }

  function labelForSourceKey(key, lang) {
    const note = EBOOK_FACTBOX_SOURCE_NOTES[key];
    if (!note) return key;
    if (key === 'uhrStudyMaterial') return 'UHR';
    if (key === 'editorialCommentary')
      return tr({
        sv: 'Redaktionellt',
        en: 'Editorial',
        'zh-Hans': '编辑说明',
        'zh-Hant': '編輯說明',
        ar: 'تعليق تحريري',
        ckb: 'لێدوانی دەستکاری',
        fa: 'یادداشت تحریریه',
        pl: 'Komentarz redakcyjny',
        so: 'Faallo tifaftireed',
        ti: 'ርእይቶ ኣዳላዊ',
        tr: 'Editoryal',
        uk: 'Редакційний коментар',
      });
    return note.label.replace(/\s+(statistics|timeline|notice)$/i, '');
  }

  function chooseEbookFootnoteKey(chapterSourceKeys, index) {
    const external = chapterSourceKeys.filter(
      (key) => key !== 'uhrStudyMaterial' && key !== 'editorialCommentary',
    );
    if (index === 0 && external.length > 0) return external[0];
    if (index % 3 === 2) return 'editorialCommentary';
    return 'uhrStudyMaterial';
  }

  function renderEbookProvenanceBadge(lang, sourceCounts) {
    const summary = Object.entries(sourceCounts)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${labelForSourceKey(key, lang)} (${count})`)
      .join(' · ');
    if (lang === 'sv') {
      return `<p class="ebook__provenance-badge" aria-label="Källor: ${summary}."><span>Källor:</span> ${summary}</p>`;
    }
    return `<p class="ebook__provenance-badge" aria-label="Sources: ${summary}."><span>Sources:</span> ${summary}</p>`;
  }

  function renderEbookFootnoteList(lang, footnotes) {
    if (footnotes.length === 0) return '';
    const heading = tr({
      sv: 'Källnoter för kapitlet',
      en: 'Chapter source notes',
      'zh-Hans': '章节来源说明',
      'zh-Hant': '章節來源說明',
      ar: 'ملاحظات مصادر الفصل',
      ckb: 'تێبینییەکانی سەرچاوەی بەش',
      fa: 'یادداشت‌های منبع فصل',
      pl: 'Przypisy źródłowe rozdziału',
      so: 'Qoraallada ilaha cutubka',
      ti: 'ምንጪ ሓበሬታታት ምዕራፍ',
      tr: 'Bölüm kaynak notları',
      uk: 'Джерельні примітки розділу',
    });
    return `
      <section class="ebook__footnotes" aria-label="${heading}">
        <h2>${heading}</h2>
        <ol class="ebook__footnote-list">
          ${footnotes
            .map(
              (footnote) =>
                `<li id="ebook-fn-${footnote.id}" data-source-key="${footnote.sourceKey}"><a href="#ebook-fnref-${footnote.id}" aria-label="${tr({ sv: 'Tillbaka till texten', en: 'Back to text', 'zh-Hans': '返回正文', 'zh-Hant': '返回正文', ar: 'العودة إلى النص', ckb: 'گەڕانەوە بۆ دەق', fa: 'بازگشت به متن', pl: 'Powrót do tekstu', so: 'Ku noqo qoraalka', ti: 'ናብ ጽሑፍ ተመለስ', tr: 'Metne dön', uk: 'Повернутися до тексту' })}">↩</a> ${sourceLink(EBOOK_FACTBOX_SOURCE_NOTES[footnote.sourceKey])}</li>`,
            )
            .join('')}
        </ol>
      </section>
    `;
  }

  function addEbookSectionFootnotes(lang, chapterId, html) {
    const chapterSourceKeys = getEbookChapterSourceKeys(chapterId);
    const sourceCounts = Object.fromEntries(chapterSourceKeys.map((key) => [key, 0]));
    const footnotes = [];
    let proseIndex = 0;
    const withRefs = html.replace(/<(p|li)\b[^>]*>[\s\S]*?<\/\1>/g, (match, tag) => {
      if (/ebook__source-note/.test(match) || /ebook__footnote-ref/.test(match)) {
        return match;
      }
      const sourceKey = chooseEbookFootnoteKey(chapterSourceKeys, proseIndex);
      const id = `${chapterId}-${proseIndex + 1}`;
      proseIndex += 1;
      sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0) + 1;
      footnotes.push({ id, sourceKey });
      return match.replace(
        new RegExp(`</${tag}>$`),
        `<sup id="ebook-fnref-${id}" class="ebook__footnote-ref"><a href="#ebook-fn-${id}" aria-label="${tr({ sv: 'Källnot', en: 'Source note', 'zh-Hans': '来源注释', 'zh-Hant': '來源註釋', ar: 'ملاحظة مصدر', ckb: 'تێبینی سەرچاوە', fa: 'یادداشت منبع', pl: 'Przypis źródłowy', so: 'Qoraal il', ti: 'ምንጪ ሓበሬታ', tr: 'Kaynak notu', uk: 'Джерельна примітка' })} ${footnotes.length}">${footnotes.length}</a></sup></${tag}>`,
      );
    });
    return {
      html: withRefs,
      sourceCounts,
      footnotesHtml: renderEbookFootnoteList(lang, footnotes),
    };
  }

  function svStudyBrief(points, facts, practiceHint, sourceKeys, afterPracticeHtml = '') {
    if (Array.isArray(practiceHint) && sourceKeys === undefined) {
      sourceKeys = practiceHint;
      practiceHint = '';
    }
    const items = points.map((point) => `<li>${point}</li>`).join('');
    return `
      <h2>Det viktigaste</h2>
      <ul>${items}</ul>
      <h2>Plugga smart</h2>
      <p>${practiceHint || 'Läs punkterna långsamt, öppna sedan övningen för samma kapitel och låt fel svar visa vad du ska läsa om.'}</p>
      ${afterPracticeHtml}
      ${ebookFactBox('sv', 'Fakta att repetera', facts, sourceKeys)}
    `;
  }

  const CHAPTERS = {
    intro: {
      kicker: {
        en: 'How to read this book',
        sv: 'Hur man läser den här boken',
        'zh-Hans': '如何阅读本书',
        'zh-Hant': '如何閱讀本書',
        ar: 'كيف تقرأ هذا الكتاب',
        ckb: 'چۆن ئەم کتێبە بخوێنیتەوە',
        fa: 'چگونه این کتاب را بخوانید',
        pl: 'Jak czytać tę książkę',
        so: 'Sida loo akhriyo buugan',
        ti: 'ነዚ መጽሓፍ ብኸመይ ከም እተንብቦ',
        tr: 'Bu kitap nasıl okunur',
        uk: 'Як читати цю книжку',
      },
      title: {
        en: 'Slow down.',
        sv: 'Sakta in.',
        'zh-Hans': '慢慢来。',
        'zh-Hant': '慢慢來。',
        ar: 'تمهّل.',
        ckb: 'هێواش بکەوە.',
        fa: 'آهسته پیش بروید.',
        pl: 'Zwolnij.',
        so: 'Iska deji.',
        ti: 'ቀስ በል።',
        tr: 'Yavaşlayın.',
        uk: 'Не поспішайте.',
      },
      title_em: {
        en: "We've got coffee.",
        sv: 'Vi har kaffe.',
        'zh-Hans': '咖啡我们备好了。',
        'zh-Hant': '咖啡我們備好了。',
        ar: 'لدينا قهوة.',
        ckb: 'قاوەمان هەیە.',
        fa: 'ما قهوه داریم.',
        pl: 'Mamy kawę.',
        so: 'Qaxwo baannu haynaa.',
        ti: 'ቡን ኣሎና።',
        tr: 'Kahvemiz var.',
        uk: 'У нас є кава.',
      },
      lede: {
        en: "This is a companion, not a textbook. Read a chapter, take a quiz, take a fika. The order doesn't matter — but if you finish in order you get a feel for how Sweden's pieces fit together.",
        sv: 'Det här är ett sällskap, inte en lärobok. Läs ett kapitel, gör en övning, ta en fika. Ordningen spelar mindre roll — men i ordning får du en känsla för hur Sveriges delar passar ihop.',
        'zh-Hans':
          '这是一本陪读手册，而不是教科书。读一章、做一次测验、来一次 fika（瑞典式咖啡歇）。顺序无所谓——但如果你按顺序读完，你会更能体会到瑞典各个部分是如何拼合在一起的。',
        'zh-Hant':
          '這是一本陪讀手冊，而不是教科書。讀一章、做一次測驗、來一次 fika（瑞典式咖啡歇）。順序無所謂——但如果你按順序讀完，你會更能體會到瑞典各個部分是如何拼合在一起的。',
        ar: 'هذا رفيقٌ، لا كتاب مدرسي. اقرأ فصلًا، وأجرِ اختبارًا قصيرًا، وخذ fika (استراحة قهوة). الترتيب لا يهمّ — لكن إن أنهيته بالترتيب فستتكوّن لديك حسّ بكيفية تلاؤم أجزاء السويد معًا.',
        ckb: 'ئەمە هاوڕێیەکە، نەک کتێبێکی خوێندن. بەشێک بخوێنەوە، تاقیکردنەوەیەکی کورت بکە، و fikaیەک (پشووی قاوە) ببە. ڕیزبەندییەکە گرنگ نییە — بەڵام ئەگەر بە ڕیز تەواوی بکەیت، هەستێکت بۆ ئەوەی پارچەکانی سوید چۆن بەیەکەوە دەگونجێن دروست دەبێت.',
        fa: 'این یک همراه است، نه یک کتاب درسی. یک فصل بخوانید، یک آزمون کوتاه بدهید، و یک fika (استراحت با قهوه) داشته باشید. ترتیب اهمیتی ندارد — اما اگر به‌ترتیب تمام کنید، حسی از چگونگی کنار هم نشستن بخش‌های سوئد پیدا می‌کنید.',
        pl: 'To towarzysz, nie podręcznik. Przeczytaj rozdział, zrób quiz, zrób sobie fikę (fika — przerwa na kawę). Kolejność nie ma znaczenia — ale jeśli skończysz po kolei, wyczujesz, jak elementy Szwecji łączą się w całość.',
        so: 'Kani waa wehel, ma aha buug-waxbarasho. Akhri cutub, qaado imtixaan, qaado fika (nasasho qaxwo). Habka kuma xiqo — laakiin haddii aad si kala dambeysa u dhammayso waxaad dareemi doontaa sida qaybaha Iswiidhan u wada habboon yihiin.',
        ti: 'እዚ ብጻይ እዩ፣ መጽሓፍ ትምህርቲ ኣይኮነን። ምዕራፍ ኣንብብ፣ ፈተና ውሰድ፣ fika (ናይ ቡን ዕረፍቲ) ግበር። ቅደም ተኸተል ኣገዳሲ ኣይኮነን — ግን ብቕደም ተኸተል እንተ ወዲእካ፣ ክፍልታት ሽወደን ብኸመይ ብሓባር ከም ዝሰማምዑ ትስምዖ።',
        tr: "Bu bir ders kitabı değil, bir yol arkadaşıdır. Bir bölüm okuyun, bir test çözün, bir fika (kahve molası) yapın. Sıra önemli değil — ama sırayla bitirirseniz İsveç'in parçalarının nasıl bir araya geldiğini sezersiniz.",
        uk: 'Це супутник, а не підручник. Прочитайте розділ, пройдіть тест, влаштуйте fika (перерву на каву). Порядок не має значення — але якщо завершите по порядку, відчуєте, як частини Швеції складаються докупи.',
      },
      body: {
        en: `
          <h2>What this book is</h2>
          <p>A plain-language reader for Sweden's citizenship test (medborgarskapsprovet). It turns public study material into calm, unofficial practice reading for adults building Swedish civic vocabulary and context from scratch.</p>
          <h2>What it's <em>not</em></h2>
          <p>Not the official material. Not a legal document. Not a substitute for UHR's public study material. Use the <a href="#/sources">Sources page</a> for question-bank citations, and check UHR's material when a fact matters.</p>
          <h2>How to use it</h2>
          <ul>
            <li>Each chapter is ~10 minutes to read.</li>
            <li>End-of-chapter <em>facts to remember</em> are review anchors for civic-study topics.</li>
            <li>Use the <a href="#/practice">Practice</a> tab to drill the same material with feedback.</li>
            <li>If you forget something, that's normal. The practice quiz brings it back.</li>
          </ul>
          <blockquote><p>You don't need to remember everything. You need to remember the right things. That's what we're here for.</p></blockquote>
          <div class="ebook__factbox"><h4>Tip</h4><p>Read on your phone in 10-minute windows. Short, repeated sessions make it easier to notice what needs review before you open the practice questions.</p></div>
        `,
        sv: `
          <h2>Vad den här boken är</h2>
          <p>En lugn genomgång av svensk samhällskunskap inför medborgarskapsprovet. Den är skriven för vuxna som vill förstå sammanhangen, inte bara memorera lösryckta ord.</p>
          <h2>Vad den <em>inte</em> är</h2>
          <p>Inte officiellt material. Inte juridisk rådgivning. Inte ett substitut för källorna. Använd alltid <a href="#/sources">källsidan</a> och UHR:s material när du vill kontrollera en uppgift.</p>
          <h2>Så använder du den</h2>
          <ul>
            <li>Läs ett kapitel i taget, helst i tio minuters pass.</li>
            <li>Öppna sedan <a href="#/practice">Öva</a> och träna på samma område.</li>
            <li>Markera meningar du vill komma tillbaka till och skriv korta anteckningar.</li>
            <li>Avsluta veckan med ett <a href="#/mock">övningsprov</a> så att tidskänslan sitter.</li>
          </ul>
          <blockquote><p>Du behöver inte kunna allt på en gång. Du behöver veta vad som är värt att repetera.</p></blockquote>
          <div class="ebook__factbox"><h4>Tips</h4><p>Växla mellan svenska och engelska om ett begrepp känns tungt. Provet kräver svenska, men förståelsen kan byggas på båda språken.</p></div>
        `,
        'zh-Hans': `<h2>这本书是什么</h2>
          <p>这是一本面向瑞典公民身份考试（medborgarskapsprovet）的平实读物。它把公开的学习材料，转化为平和、非官方的练习读物，供那些从零开始构建瑞典公民知识词汇与背景的成年人使用。</p>
          <h2>它<em>不是</em>什么</h2>
          <p>它不是官方材料。不是法律文件。也不能替代 UHR（瑞典高等教育委员会）的公开学习材料。题库引用请查看<a href="#/sources">来源页面</a>，当某个事实很重要时，请核对 UHR 的材料。</p>
          <h2>如何使用它</h2>
          <ul>
            <li>每一章大约需要 10 分钟阅读。</li>
            <li>章末的<em>需记住的事实</em>是公民学习主题的复习锚点。</li>
            <li>使用<a href="#/practice">练习</a>标签页，可以带着反馈反复操练相同的内容。</li>
            <li>如果你忘了某些东西，那很正常。练习测验会帮你把它找回来。</li>
          </ul>
          <blockquote><p>你不需要记住所有东西。你需要记住对的东西。这正是我们存在的意义。</p></blockquote>
          <div class="ebook__factbox"><h4>提示</h4><p>用手机在 10 分钟的零碎时段里阅读。短而反复的学习，会让你在打开练习题之前更容易察觉到哪些内容需要复习。</p></div>`,
        'zh-Hant': `<h2>這本書是什麼</h2>
          <p>這是一本面向瑞典公民身分考試（medborgarskapsprovet）的平實讀物。它把公開的學習材料，轉化為平和、非官方的練習讀物，供那些從零開始建立瑞典公民知識詞彙與背景的成年人使用。</p>
          <h2>它<em>不是</em>什麼</h2>
          <p>它不是官方材料。不是法律文件。也不能替代 UHR（瑞典高等教育委員會）的公開學習材料。題庫引用請查看<a href="#/sources">來源頁面</a>，當某個事實很重要時，請核對 UHR 的材料。</p>
          <h2>如何使用它</h2>
          <ul>
            <li>每一章大約需要 10 分鐘閱讀。</li>
            <li>章末的<em>需記住的事實</em>是公民學習主題的複習錨點。</li>
            <li>使用<a href="#/practice">練習</a>標籤頁，可以帶著回饋反覆操練相同的內容。</li>
            <li>如果你忘了某些東西，那很正常。練習測驗會幫你把它找回來。</li>
          </ul>
          <blockquote><p>你不需要記住所有東西。你需要記住對的東西。這正是我們存在的意義。</p></blockquote>
          <div class="ebook__factbox"><h4>提示</h4><p>用手機在 10 分鐘的零碎時段裡閱讀。短而反覆的學習，會讓你在打開練習題之前更容易察覺到哪些內容需要複習。</p></div>`,
        ar: `<h2>ما هذا الكتاب</h2>
          <p>قارئٌ بلغة مبسّطة لاختبار الجنسية السويدية (medborgarskapsprovet). يحوّل المواد الدراسية العامة إلى قراءة تدريبية هادئة وغير رسمية للبالغين الذين يبنون مفرداتهم وسياقهم المدني السويدي من الصفر.</p>
          <h2>ما <em>ليس</em> هو</h2>
          <p>ليس المادة الرسمية. وليس وثيقة قانونية. وليس بديلًا عن المواد الدراسية العامة الصادرة عن UHR. استخدم <a href="#/sources">صفحة المصادر</a> للاطلاع على مراجع بنك الأسئلة، وراجع مواد UHR حين تكون الحقيقة مهمة.</p>
          <h2>كيف تستخدمه</h2>
          <ul>
            <li>قراءة كل فصل تستغرق نحو 10 دقائق.</li>
            <li><em>الحقائق التي يجب تذكّرها</em> في نهاية كل فصل هي مرتكزات للمراجعة لمواضيع الدراسة المدنية.</li>
            <li>استخدم تبويب <a href="#/practice">التدريب</a> للتمرّن على المادة نفسها مع تلقّي ملاحظات.</li>
            <li>إن نسيت شيئًا، فهذا طبيعي. اختبار التدريب يعيده إليك.</li>
          </ul>
          <blockquote><p>لست بحاجة إلى تذكّر كل شيء. أنت بحاجة إلى تذكّر الأشياء الصحيحة. ولهذا نحن هنا.</p></blockquote>
          <div class="ebook__factbox"><h4>نصيحة</h4><p>اقرأ على هاتفك في نوافذ من 10 دقائق. الجلسات القصيرة المتكرّرة تجعل من الأسهل أن تلاحظ ما يحتاج إلى مراجعة قبل أن تفتح أسئلة التدريب.</p></div>`,
        ckb: `<h2>ئەم کتێبە چییە</h2>
          <p>دەقێکی خوێندنەوەی زمانساکار بۆ تاقیکردنەوەی هاووڵاتیبوونی سوید (medborgarskapsprovet). کەرەستەی خوێندنی گشتی دەگۆڕێت بۆ خوێندنەوەیەکی مەشقیی هێمن و نافەرمی بۆ گەورەسالان کە وشەسازی و ناوەڕۆکی شارستانیی سویدی لە سفرەوە دروست دەکەن.</p>
          <h2>چی <em>نییە</em></h2>
          <p>کەرەستەی فەرمی نییە. بەڵگەنامەی یاسایی نییە. جێگرەوەی کەرەستەی خوێندنی گشتیی UHR نییە. بۆ ئاماژەکانی بانکی پرسیار <a href="#/sources">پەڕەی سەرچاوەکان</a> بەکاربهێنە، و کاتێک ڕاستییەک گرنگە کەرەستەی UHR بپشکنە.</p>
          <h2>چۆن بەکاری بهێنیت</h2>
          <ul>
            <li>خوێندنەوەی هەر بەشێک نزیکەی 10 خولەک دەخایەنێت.</li>
            <li><em>ڕاستییەکان بۆ لەبیرکردن</em> لە کۆتایی هەر بەشێکدا ئامرازی پێداچوونەوەن بۆ بابەتەکانی خوێندنی شارستانی.</li>
            <li>بۆ مەشقکردن لەسەر هەمان کەرەستە لەگەڵ وەڵامدانەوە، خشتەی <a href="#/practice">مەشق</a> بەکاربهێنە.</li>
            <li>ئەگەر شتێک لەبیر بکەیت، ئەوە ئاساییە. تاقیکردنەوەی مەشق دەیگەڕێنێتەوە.</li>
          </ul>
          <blockquote><p>پێویست نییە هەموو شتێک لەبیر بکەیت. پێویستە شتە ڕاستەکان لەبیر بکەیت. ئێمە لەبەر ئەوە لێرەین.</p></blockquote>
          <div class="ebook__factbox"><h4>ئامۆژگاری</h4><p>لەسەر مۆبایلەکەت لە ماوەی 10 خولەکیدا بیخوێنەوە. دانیشتنی کورت و دووبارە وادەکات ئاسانتر تێبگەیت کە پێش کردنەوەی پرسیارەکانی مەشق چی پێویستی بە پێداچوونەوە هەیە.</p></div>`,
        fa: `<h2>این کتاب چیست</h2>
          <p>یک متن خواندنی به زبان ساده برای آزمون شهروندی سوئد (medborgarskapsprovet). مواد آموزشی عمومی را به مطالعهٔ تمرینیِ آرام و غیررسمی برای بزرگ‌سالانی بدل می‌کند که واژگان و زمینهٔ مدنی سوئد را از صفر می‌سازند.</p>
          <h2>چه <em>نیست</em></h2>
          <p>مادهٔ رسمی نیست. سند حقوقی نیست. جایگزین مواد آموزشی عمومی UHR نیست. برای ارجاعات بانک سؤال از <a href="#/sources">صفحهٔ منابع</a> استفاده کنید، و هنگامی که یک واقعیت اهمیت دارد، مواد UHR را بررسی کنید.</p>
          <h2>چگونه از آن استفاده کنید</h2>
          <ul>
            <li>خواندن هر فصل حدود 10 دقیقه طول می‌کشد.</li>
            <li><em>نکته‌هایی برای به‌خاطر سپردن</em> در پایان هر فصل، لنگرهای مرور برای موضوعات مطالعهٔ مدنی هستند.</li>
            <li>برای تمرین همان مطالب همراه با بازخورد، از زبانهٔ <a href="#/practice">تمرین</a> استفاده کنید.</li>
            <li>اگر چیزی را فراموش کنید، طبیعی است. آزمون تمرینی آن را بازمی‌گرداند.</li>
          </ul>
          <blockquote><p>لازم نیست همه‌چیز را به خاطر بسپارید. باید چیزهای درست را به خاطر بسپارید. ما برای همین اینجاییم.</p></blockquote>
          <div class="ebook__factbox"><h4>نکته</h4><p>روی گوشی خود در بازه‌های 10 دقیقه‌ای بخوانید. جلسه‌های کوتاه و مکرر باعث می‌شود راحت‌تر متوجه شوید پیش از باز کردن سؤال‌های تمرین چه چیزی نیاز به مرور دارد.</p></div>`,
        pl: `<h2>Czym jest ta książka</h2>
          <p>Przystępny czytnik do szwedzkiego testu na obywatelstwo (medborgarskapsprovet — egzamin na obywatelstwo). Zamienia publiczne materiały do nauki w spokojną, nieoficjalną lekturę ćwiczeniową dla dorosłych, którzy budują szwedzkie słownictwo i kontekst obywatelski od podstaw.</p>
          <h2>Czym <em>nie jest</em></h2>
          <p>To nie jest materiał oficjalny. To nie dokument prawny. To nie zastępstwo publicznych materiałów do nauki od UHR. Skorzystaj ze <a href="#/sources">strony Źródła</a>, by znaleźć odniesienia do bazy pytań, i sprawdź materiały UHR, gdy fakt ma znaczenie.</p>
          <h2>Jak z niej korzystać</h2>
          <ul>
            <li>Każdy rozdział czyta się około 10 minut.</li>
            <li>Zamieszczone na końcu rozdziału <em>fakty do zapamiętania</em> są punktami odniesienia do powtórki tematów obywatelskich.</li>
            <li>Skorzystaj z zakładki <a href="#/practice">Ćwiczenie</a>, by przerobić ten sam materiał z informacją zwrotną.</li>
            <li>Jeśli czegoś zapomnisz, to normalne. Quiz ćwiczeniowy przywróci to do pamięci.</li>
          </ul>
          <blockquote><p>Nie musisz pamiętać wszystkiego. Musisz pamiętać właściwe rzeczy. Po to tu jesteśmy.</p></blockquote>
          <div class="ebook__factbox"><h4>Wskazówka</h4><p>Czytaj na telefonie w 10-minutowych okienkach. Krótkie, powtarzane sesje ułatwiają zauważenie, co wymaga powtórki, zanim otworzysz pytania ćwiczeniowe.</p></div>`,
        so: `<h2>Buugani waa maxay</h2>
          <p>Akhriste luqad fudud ah oo loogu talagalay imtixaanka muwaadinimada Iswiidhan (medborgarskapsprovet — imtixaanka muwaadinimada). Wuxuu agabka waxbarasho ee dadweynaha u beddelaa akhris tababar oo deggan, oo aan rasmi ahayn, oo loogu talagalay dadka waaweyn ee ka dhisaya erey-bixinta iyo macnaha bulshada Iswiidhan ee marka hore.</p>
          <h2>Waxa aanu <em>ahayn</em></h2>
          <p>Ma aha agabka rasmiga ah. Ma aha dukumenti sharci. Ma aha bedel agabka waxbarasho ee dadweynaha ee UHR. U isticmaal <a href="#/sources">bogga Ilaha</a> tixraacyada bangiga su'aalaha, oo hubi agabka UHR marka xaqiiqo ay muhiim tahay.</p>
          <h2>Sida loo isticmaalo</h2>
          <ul>
            <li>Cutub kasta wuxuu qaataa qiyaastii 10 daqiiqo in la akhriyo.</li>
            <li>Dhamaadka cutubka ee <em>xaqiiqooyinka la xasuusto</em> waa bartaska dib-u-eegista ee mowduucyada waxbarashada bulshada.</li>
            <li>Isticmaal tabka <a href="#/practice">Tababarka</a> si aad u celcelisid isla agabkaas oo leh jawaab-celin.</li>
            <li>Haddii aad wax ilowdo, taasi waa caadi. Imtixaanka tababarku wuu soo celiyaa.</li>
          </ul>
          <blockquote><p>Uma baahnid inaad wax walba xasuusato. Waxaad u baahan tahay inaad xasuusato waxyaabaha saxda ah. Taasi waa waxa aannu halkan u joognaa.</p></blockquote>
          <div class="ebook__factbox"><h4>Talo</h4><p>Ku akhri telefoonkaaga muddooyin 10 daqiiqo ah. Fadhiyo gaagaaban oo soo noqnoqda ayaa fududeeya in la ogaado waxa u baahan dib-u-eegis ka hor inta aadan furin su'aalaha tababarka.</p></div>`,
        ti: `<h2>እዚ መጽሓፍ እንታይ እዩ</h2>
          <p>ንፈተና ዜግነት ሽወደን (medborgarskapsprovet — ፈተና ዜግነት) ብቐሊል ቋንቋ ዝቐረበ መንበቢ። ንህዝባዊ ናይ ትምህርቲ ጽሑፋት ናብ ህዱእ፣ ዘይወግዓዊ ናይ ልምምድ ንባብ ይቕይሮ፣ ንዓበይቲ ሰባት ሽወደናዊ ሲቪካዊ መዝገበ-ቃላትን ኣገባብን ካብ መሰረት ንዝሃንጹ።</p>
          <h2>እንታይ <em>ከም ዘይኮነ</em></h2>
          <p>እቲ ወግዓዊ ጽሑፍ ኣይኮነን። ሕጋዊ ሰነድ ኣይኮነን። ንህዝባዊ ናይ ትምህርቲ ጽሑፍ UHR ምትካእ ኣይኮነን። ንመወከሲታት ባንክ ሕቶ <a href="#/sources">ገጽ ምንጪታት</a> ተጠቐም፣ ሓቂ ኣገዳሲ ኣብ ዝኾነሉ ድማ ንጽሑፍ UHR ኣረጋግጽ።</p>
          <h2>ብኸመይ ከም እትጥቀመሉ</h2>
          <ul>
            <li>ነፍሲ ወከፍ ምዕራፍ ንምንባብ ኣስታት 10 ደቓይቕ ይወስድ።</li>
            <li>ኣብ መወዳእታ ምዕራፍ ዘሎ <em>ዝዝከሩ ሓቅታት</em> ንሲቪካዊ ኣርእስትታት ናይ ምድጋም መልሕቓት እዮም።</li>
            <li>ነቲ ተመሳሳሊ ጽሑፍ ብግብረ መልሲ ንምልምማድ ነቲ <a href="#/practice">ልምምድ</a> ታብ ተጠቐም።</li>
            <li>ገለ ነገር እንተ ረሲዕካ፣ ንቡር እዩ። እቲ ናይ ልምምድ ፈተና ይመልሶ።</li>
          </ul>
          <blockquote><p>ኩሉ ክትዝክር ኣየድልየካን። እቲ ቅኑዕ ነገራት ክትዝክር የድልየካ። ንሕና ድማ ስለዚ ኢና ኣብዚ ዘሎና።</p></blockquote>
          <div class="ebook__factbox"><h4>ምኽሪ</h4><p>ኣብ ተሌፎንካ ብ10-ደቓይቕ መስኮታት ኣንብብ። ሓጸርቲ፣ ዝድገሙ ክፍለ ግዜታት ነቲ ናይ ልምምድ ሕቶታት ቅድሚ ምኽፋትካ እንታይ ምድጋም ከም ዘድልዮ ንምልላይ የቕልሉ።</p></div>`,
        tr: `<h2>Bu kitap nedir</h2>
          <p>İsveç vatandaşlık sınavı (medborgarskapsprovet — vatandaşlık sınavı) için sade dilde bir okuma kitabı. Kamuya açık çalışma materyallerini, sıfırdan İsveç yurttaşlık kelime dağarcığı ve bağlamı oluşturan yetişkinler için sakin, gayriresmî bir alıştırma okumasına dönüştürür.</p>
          <h2>Ne <em>değildir</em></h2>
          <p>Resmî materyal değildir. Hukuki bir belge değildir. UHR'nin kamuya açık çalışma materyalinin yerini tutmaz. Soru bankası kaynakları için <a href="#/sources">Kaynaklar sayfasını</a> kullanın ve bir bilgi önemliyse UHR'nin materyalini kontrol edin.</p>
          <h2>Nasıl kullanılır</h2>
          <ul>
            <li>Her bölümü okumak yaklaşık 10 dakika sürer.</li>
            <li>Bölüm sonundaki <em>hatırlanacak bilgiler</em>, yurttaşlık çalışma konuları için tekrar çapalarıdır.</li>
            <li>Aynı materyali geri bildirimle çalışmak için <a href="#/practice">Alıştırma</a> sekmesini kullanın.</li>
            <li>Bir şeyi unutursanız bu normaldir. Alıştırma testi onu geri getirir.</li>
          </ul>
          <blockquote><p>Her şeyi hatırlamanız gerekmez. Doğru şeyleri hatırlamanız gerekir. Biz bunun için buradayız.</p></blockquote>
          <div class="ebook__factbox"><h4>İpucu</h4><p>Telefonunuzda 10 dakikalık aralıklarla okuyun. Kısa, tekrarlanan oturumlar, alıştırma sorularını açmadan önce neyin tekrar gerektirdiğini fark etmeyi kolaylaştırır.</p></div>`,
        uk: `<h2>Чим є ця книжка</h2>
          <p>Читанка простою мовою для шведського тесту на громадянство (medborgarskapsprovet — іспит на громадянство). Вона перетворює публічні навчальні матеріали на спокійне, неофіційне тренувальне читання для дорослих, які з нуля будують шведський громадянський словник і контекст.</p>
          <h2>Чим вона <em>не є</em></h2>
          <p>Це не офіційний матеріал. Не юридичний документ. Не заміна публічних навчальних матеріалів UHR. Скористайтеся <a href="#/sources">сторінкою Джерела</a> для посилань на банк питань і перевіряйте матеріали UHR, коли факт має значення.</p>
          <h2>Як нею користуватися</h2>
          <ul>
            <li>Кожен розділ читається приблизно 10 хвилин.</li>
            <li>Розміщені наприкінці розділу <em>факти для запам'ятовування</em> — це опорні точки для повторення громадянських тем.</li>
            <li>Скористайтеся вкладкою <a href="#/practice">Тренування</a>, щоб опрацювати той самий матеріал зі зворотним зв'язком.</li>
            <li>Якщо ви щось забуваєте — це нормально. Тренувальний тест це повертає.</li>
          </ul>
          <blockquote><p>Вам не потрібно пам'ятати все. Вам потрібно пам'ятати правильні речі. Саме для цього ми тут.</p></blockquote>
          <div class="ebook__factbox"><h4>Підказка</h4><p>Читайте з телефона у 10-хвилинні проміжки. Короткі, повторювані сесії полегшують помічати, що потребує повторення, перш ніж відкриєте тренувальні питання.</p></div>`,
      },
    },

    1: {
      kicker: {
        en: 'Chapter 01 · History',
        sv: 'Kapitel 01 · Historia',
        'zh-Hans': '第 01 章 · 历史',
        'zh-Hant': '第 01 章 · 歷史',
        ar: 'الفصل 01 · التاريخ',
        ckb: 'بەشی 01 · مێژوو',
        fa: 'فصل 01 · تاریخ',
        pl: 'Rozdział 01 · Historia',
        so: 'Cutubka 01 · Taariikh',
        ti: 'ምዕራፍ 01 · ታሪኽ',
        tr: 'Bölüm 01 · Tarih',
        uk: 'Розділ 01 · Історія',
      },
      title: {
        en: 'A very short',
        sv: 'En kort historia',
        'zh-Hans': '一部极简的',
        'zh-Hant': '一部極簡的',
        ar: 'تاريخ موجز جدًا',
        ckb: 'مێژوویەکی زۆر کورت',
        fa: 'تاریخی بسیار کوتاه',
        pl: 'Bardzo krótka',
        so: 'Aad u gaaban',
        ti: 'ኣዝዩ ሓጺር',
        tr: 'Çok kısa',
        uk: 'Дуже коротка',
      },
      title_em: {
        en: 'history of Sweden.',
        sv: 'om Sverige.',
        'zh-Hans': '瑞典史。',
        'zh-Hant': '瑞典史。',
        ar: 'للسويد.',
        ckb: 'لە سوید.',
        fa: 'از سوئد.',
        pl: 'historia Szwecji.',
        so: 'taariikhda Iswiidhan.',
        ti: 'ታሪኽ ሽወደን።',
        tr: 'İsveç tarihi.',
        uk: 'історія Швеції.',
      },
      lede: {
        en: 'From Vikings to NATO in under 4,000 words. The dynasties are skippable. The patterns are not.',
        sv: 'Från vikingar till NATO på under 4 000 ord. Dynastierna kan du hoppa över. Mönstren kan du inte.',
        'zh-Hans':
          '用不到 4,000 字，从维京人讲到 NATO（北约）。王朝世系可以略过，但其中的规律不能。',
        'zh-Hant':
          '用不到 4,000 字，從維京人講到 NATO（北約）。王朝世系可以略過，但其中的規律不能。',
        ar: 'من الفايكنغ إلى NATO في أقل من 4,000 كلمة. السلالات الحاكمة يمكن تجاوزها. الأنماط لا يمكن.',
        ckb: 'لە ڤایکینگەکانەوە بۆ NATO لە کەمتر لە 4,000 وشەدا. بنەماڵە پاشایەتییەکان دەکرێت تێپەڕێنرێن، بەڵام شێوازەکان نا.',
        fa: 'از وایکینگ‌ها تا NATO در کمتر از 4,000 واژه. سلسله‌های پادشاهی را می‌توان نادیده گرفت، اما الگوها را نه.',
        pl: 'Od wikingów do NATO w mniej niż 4000 słów. Dynastie można pominąć. Wzorców już nie.',
        so: 'Laga soo bilaabo Vikingyada ilaa NATO ka yar 4,000 oo eray. Boqortooyooyinka waa la boodi karaa. Qaababka lama boodi karo.',
        ti: 'ካብ ቫይኪንግ ክሳብ NATO ብትሕቲ 4,000 ቃላት። ስርወ-መንግስታት ክትዘሎም ይከኣል። ነቶም ኣገባባት ግን ኣይከኣልን።',
        tr: "Vikinglerden NATO'ya 4.000 kelimeden az. Hanedanları atlayabilirsiniz. Örüntüleri atlayamazsınız.",
        uk: 'Від вікінгів до NATO менш ніж за 4000 слів. Династії можна пропустити. Закономірності — ні.',
      },
      body: {
        en: `
          <h2>Vikings (793 – ~1066)</h2>
          <p>The image of horned helmets is a 19th-century opera invention. The reality is more interesting: Norse-speaking traders, farmers, raiders, and explorers. Swedes mostly went east — down rivers into present-day Russia and Ukraine — to trade silver, slaves, and amber for goods from Byzantium.</p>
          <p>The era ends gradually as Sweden Christianises (King Olof Skötkonung, baptised c. 1000) and consolidates under monarchic rule.</p>
          <h2>Union of Kalmar (1397 – 1523)</h2>
          <p>Denmark, Norway, and Sweden join under a single monarch, mostly because the Hanseatic League's stranglehold on Baltic trade scared everyone into cooperation. It mostly didn't work, mostly because of Denmark.</p>
          <h2>Gustav Vasa &amp; the modern state (1523)</h2>
          <p>After the Stockholm Bloodbath (1520, very on-brand for the period), Gustav Eriksson Vasa takes the throne, breaks with the Catholic church, and establishes a hereditary monarchy. June 6 — his election day — becomes Sweden's national day, though only formally in 2005.</p>
          <h2>The Great Power Era (1611 – 1721)</h2>
          <p>For a century, Sweden is a European superpower. The empire stretches across Finland, the Baltics, and parts of northern Germany. Gustav II Adolf dies famously on a battlefield; Karl XII dies famously by sniper; the empire ends, famously, broke.</p>
          <h2>1809: a constitution, and Finland lost</h2>
          <p>Sweden loses Finland to Russia. Out of the wreckage comes the <em>Instrument of Government</em> — a constitutional framework that, in heavily revised form, still applies today. Sweden has been at peace ever since.</p>
          <h2>Folkhemmet (1932 – 1976)</h2>
          <p>The Social Democrats run the country for 44 unbroken years and build the <em>folkhem</em> — the "people's home", a welfare-state model with universal healthcare, education, and pensions, funded by progressive taxation. This is the Sweden most foreigners imagine.</p>
          <h2>Modern era</h2>
          <ul>
            <li>1995 — joins the European Union.</li>
            <li>2003 — votes against adopting the euro.</li>
            <li>2024 — joins NATO, ending more than 200 years of military non-alignment.</li>
          </ul>
          ${ebookFactBox('en', 'Facts to review', 'National day: June 6 · Joined EU: 1995 · Joined NATO: 2024 · Long peace period: commonly described as continuous since 1814.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        sv: svStudyBrief(
          [
            'Sveriges historia handlar om hur ett äldre kungarike blev en modern demokrati med riksdag, grundlagar och offentlig välfärd.',
            'Nationaldagen den 6 juni kopplas till Gustav Vasas val till kung 1523 och till 1809 års regeringsform.',
            'Under 1900-talet byggdes folkhemmet ut med skola, vård, pensioner och socialförsäkringar finansierade med skatter.',
            'I modern tid är EU-medlemskapet 1995, euroomröstningen 2003 och NATO-medlemskapet 2024 centrala hållpunkter.',
          ],
          'Nationaldag: 6 juni · EU: 1995 · Euroomröstning: 2003 · NATO: 2024.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>维京时代（793 – 约 1066）</h2>
          <p>戴角头盔的形象其实是 19 世纪歌剧的杜撰。真实情况更有意思：那是一群说古诺尔斯语的商人、农民、劫掠者和探险者。瑞典人大多向东而行——沿河流深入今天的俄罗斯和乌克兰——用白银、奴隶和琥珀去换取来自拜占庭的货物。</p>
          <p>随着瑞典基督教化（国王 Olof Skötkonung 约在公元 1000 年受洗）并在君主统治下逐渐统一，这个时代慢慢走向终结。</p>
          <h2>卡尔马联盟（Kalmarunionen，1397 – 1523）</h2>
          <p>丹麦、挪威和瑞典在同一位君主之下结成联盟，主要是因为汉萨同盟对波罗的海贸易的垄断让各国都心生畏惧，从而被迫合作。它大体上没能成功，而原因大体上出在丹麦身上。</p>
          <h2>Gustav Vasa（古斯塔夫·瓦萨） &amp; 现代国家（1523）</h2>
          <p>在斯德哥尔摩惨案（1520，这在那个年代相当典型）之后，Gustav Eriksson Vasa 登上王位，与天主教会决裂，并建立了世袭君主制。6 月 6 日——他当选的日子——后来成为瑞典的国庆日，不过直到 2005 年才正式确立。</p>
          <h2>大国时代（1611 – 1721）</h2>
          <p>在长达一个世纪的时间里，瑞典是欧洲的超级强国。帝国版图横跨芬兰、波罗的海地区以及德国北部的部分地区。Gustav II Adolf 著名地战死沙场；Karl XII 著名地被狙击手射杀；而这个帝国，也著名地以破产收场。</p>
          <h2>1809 年：一部宪法，以及芬兰的失去</h2>
          <p>瑞典把芬兰割让给了俄罗斯。从这场残局中诞生了 <em>《政府组织法》（regeringsformen）</em>——一套宪法框架，经过大幅修订后至今仍然适用。瑞典从那以后一直保持和平。</p>
          <h2>Folkhemmet（人民之家，1932 – 1976）</h2>
          <p>社会民主党连续执政 44 年，并建立起 <em>folkhem（人民之家）</em>——这是一种福利国家模式，由累进税制提供资金，涵盖全民医疗、教育和养老金。这正是大多数外国人想象中的瑞典。</p>
          <h2>现代</h2>
          <ul>
            <li>1995 年——加入欧洲联盟（EU）。</li>
            <li>2003 年——公投反对采用欧元。</li>
            <li>2024 年——加入 NATO，结束了 200 多年的军事不结盟立场。</li>
          </ul>
          ${ebookFactBox('zh-Hans', null, '国庆日：6 月 6 日 · 加入 EU：1995 · 加入 NATO：2024 · 长期和平：通常被描述为自 1814 年起从未中断。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        'zh-Hant': `<h2>維京時代（793 – 約 1066）</h2>
          <p>戴角頭盔的形象其實是 19 世紀歌劇的杜撰。真實情況更有意思：那是一群說古諾爾斯語的商人、農民、劫掠者和探險者。瑞典人大多向東而行——沿河流深入今天的俄羅斯和烏克蘭——用白銀、奴隸和琥珀去換取來自拜占庭的貨物。</p>
          <p>隨著瑞典基督教化（國王 Olof Skötkonung 約在公元 1000 年受洗）並在君主統治下逐漸統一，這個時代慢慢走向終結。</p>
          <h2>卡爾馬聯盟（Kalmarunionen，1397 – 1523）</h2>
          <p>丹麥、挪威和瑞典在同一位君主之下結成聯盟，主要是因為漢薩同盟對波羅的海貿易的壟斷讓各國都心生畏懼，從而被迫合作。它大體上沒能成功，而原因大體上出在丹麥身上。</p>
          <h2>Gustav Vasa（古斯塔夫·瓦薩） &amp; 現代國家（1523）</h2>
          <p>在斯德哥爾摩慘案（1520，這在那個年代相當典型）之後，Gustav Eriksson Vasa 登上王位，與天主教會決裂，並建立了世襲君主制。6 月 6 日——他當選的日子——後來成為瑞典的國慶日，不過直到 2005 年才正式確立。</p>
          <h2>大國時代（1611 – 1721）</h2>
          <p>在長達一個世紀的時間裡，瑞典是歐洲的超級強國。帝國版圖橫跨芬蘭、波羅的海地區以及德國北部的部分地區。Gustav II Adolf 著名地戰死沙場；Karl XII 著名地被狙擊手射殺；而這個帝國，也著名地以破產收場。</p>
          <h2>1809 年：一部憲法，以及芬蘭的失去</h2>
          <p>瑞典把芬蘭割讓給了俄羅斯。從這場殘局中誕生了 <em>《政府組織法》（regeringsformen）</em>——一套憲法框架，經過大幅修訂後至今仍然適用。瑞典從那以後一直保持和平。</p>
          <h2>Folkhemmet（人民之家，1932 – 1976）</h2>
          <p>社會民主黨連續執政 44 年，並建立起 <em>folkhem（人民之家）</em>——這是一種福利國家模式，由累進稅制提供資金，涵蓋全民醫療、教育和養老金。這正是大多數外國人想像中的瑞典。</p>
          <h2>現代</h2>
          <ul>
            <li>1995 年——加入歐洲聯盟（EU）。</li>
            <li>2003 年——公投反對採用歐元。</li>
            <li>2024 年——加入 NATO，結束了 200 多年的軍事不結盟立場。</li>
          </ul>
          ${ebookFactBox('zh-Hant', null, '國慶日：6 月 6 日 · 加入 EU：1995 · 加入 NATO：2024 · 長期和平：通常被描述為自 1814 年起從未中斷。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ar: `<h2>الفايكنغ (793 – ~1066)</h2>
          <p>صورة الخوذات ذات القرون هي اختراع أوبرالي من القرن التاسع عشر. الواقع أكثر إثارة للاهتمام: تجار ومزارعون وغزاة ومستكشفون يتحدثون اللغة النوردية القديمة. توجّه السويديون في الغالب شرقًا — عبر الأنهار إلى ما يُعرف اليوم بروسيا وأوكرانيا — لمقايضة الفضة والعبيد والكهرمان ببضائع من بيزنطة.</p>
          <p>تنتهي الحقبة تدريجيًا مع تنصّر السويد (الملك Olof Skötkonung، عُمّد نحو عام 1000) وتوحّدها تحت الحكم الملكي.</p>
          <h2>اتحاد كالمار (1397 – 1523)</h2>
          <p>تنضمّ الدنمارك والنرويج والسويد تحت ملكٍ واحد، أساسًا لأن قبضة الرابطة الهانزية الخانقة على تجارة بحر البلطيق دفعت الجميع إلى التعاون خوفًا. ولم ينجح الأمر في الغالب، بسبب الدنمارك أساسًا.</p>
          <h2>Gustav Vasa &amp; الدولة الحديثة (1523)</h2>
          <p>بعد مذبحة ستوكهولم (1520، وهي مذبحة تنسجم تمامًا مع روح تلك الحقبة)، يتولّى Gustav Eriksson Vasa العرش، ويقطع مع الكنيسة الكاثوليكية، ويؤسّس ملكية وراثية. ويصبح 6 يونيو — يوم انتخابه — اليوم الوطني للسويد، وإن كان ذلك رسميًا فقط منذ عام 2005.</p>
          <h2>عصر القوة العظمى (1611 – 1721)</h2>
          <p>لقرنٍ من الزمن، كانت السويد قوة أوروبية عظمى. امتدّت الإمبراطورية عبر فنلندا ودول البلطيق وأجزاء من شمال ألمانيا. مات Gustav II Adolf في ساحة المعركة على نحوٍ مشهور؛ ومات Karl XII برصاص قنّاص على نحوٍ مشهور؛ وانتهت الإمبراطورية، على نحوٍ مشهور أيضًا، مفلسة.</p>
          <h2>1809: دستور، وفقدان فنلندا</h2>
          <p>تخسر السويد فنلندا لصالح روسيا. ومن بين الركام يخرج <em>صك الحكم (Instrument of Government)</em> — إطار دستوري لا يزال ساريًا حتى اليوم بصيغة معدّلة بشدّة. وقد ظلّت السويد في سلام منذ ذلك الحين.</p>
          <h2>Folkhemmet (بيت الشعب) (1932 – 1976)</h2>
          <p>يحكم الديمقراطيون الاجتماعيون البلاد طوال 44 عامًا متواصلة ويبنون <em>folkhem</em> — "بيت الشعب"، نموذج دولة الرفاه القائم على الرعاية الصحية والتعليم والمعاشات الشاملة، المموّل بضرائب تصاعدية. هذه هي السويد التي يتخيّلها معظم الأجانب.</p>
          <h2>العصر الحديث</h2>
          <ul>
            <li>1995 — الانضمام إلى الاتحاد الأوروبي.</li>
            <li>2003 — التصويت ضد اعتماد اليورو.</li>
            <li>2024 — الانضمام إلى NATO، منهيةً أكثر من 200 عام من عدم الانحياز العسكري.</li>
          </ul>
          ${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · الانضمام إلى EU: 1995 · الانضمام إلى NATO: 2024 · فترة السلام الطويلة: تُوصَف عادةً بأنها متواصلة منذ 1814.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ckb: `<h2>ڤایکینگەکان (793 – ~1066)</h2>
          <p>وێنەی کڵاوە قۆچدارەکان داهێنانێکی ئۆپێرایی سەدەی نۆزدەهەمە. ڕاستییەکە سەرنجڕاکێشترە: بازرگان، جوتیار، تاڵانکەر و گەڕیدەی نۆرسیزمان. سویدییەکان زۆربەی کات بەرەو ڕۆژهەڵات دەچوون — بە ڕووبارەکاندا بۆ ناو ئەوەی ئەمڕۆ پێی دەوترێت ڕووسیا و ئۆکرانیا — بۆ ئاڵوگۆڕی زیو، کۆیلە و کاهرەبا بە کاڵای بیزەنتی.</p>
          <p>ئەم سەردەمە بە تەدریجی کۆتایی دێت لەگەڵ مەسیحیبوونی سوید (پاشا Olof Skötkonung، نزیکەی ساڵی 1000 لە ئاو هەڵکێشرا) و یەکگرتنی لەژێر فەرمانڕەواییی پاشایەتیدا.</p>
          <h2>یەکێتیی کالمار (1397 – 1523)</h2>
          <p>دانمارک، نەرویج و سوید لەژێر یەک پاشادا کۆدەبنەوە، زۆرتر لەبەر ئەوەی دەستڕۆیشتنی خنکێنەری یەکێتیی هانزی بەسەر بازرگانیی دەریای بالتیک هەمووانی لە ترسدا بۆ هاوکاری پاڵنا. زۆرتر سەرکەوتوو نەبوو، زۆرتریش لەبەر دانمارک.</p>
          <h2>Gustav Vasa &amp; دەوڵەتی مۆدێرن (1523)</h2>
          <p>دوای کۆمەڵکوژیی ستۆکهۆڵم (1520، کە تەواو دەگونجێت لەگەڵ ڕۆحی ئەو سەردەمە)، Gustav Eriksson Vasa دەبێتە خاوەنی تەخت، پەیوەندی لەگەڵ کڵێسای کاسۆلیک دەپچڕێنێت، و پاشایەتییەکی میراتگری دادەمەزرێنێت. 6ی ژوئن — ڕۆژی هەڵبژاردنی — دەبێتە ڕۆژی نیشتمانیی سوید، هەرچەندە تەنها لە ساڵی 2005ەوە بە شێوەی فەرمی.</p>
          <h2>سەردەمی هێزە گەورەکە (1611 – 1721)</h2>
          <p>بۆ ماوەی سەدەیەک، سوید هێزێکی گەورەی ئەورووپییە. ئیمپراتۆرییەکە بەسەر فینلەند، وڵاتانی بالتیک و بەشێک لە باکووری ئەڵمانیادا بڵاو دەبێتەوە. Gustav II Adolf بە شێوەیەکی ناودار لە مەیدانی جەنگدا دەمرێت؛ Karl XII بە شێوەیەکی ناودار بە گوللەی تەکتیراندازێک دەکوژرێت؛ و ئیمپراتۆرییەکە، دیسان بە شێوەیەکی ناودار، بە مۆفلیسی کۆتایی دێت.</p>
          <h2>1809: دەستوورێک، و لەدەستدانی فینلەند</h2>
          <p>سوید فینلەند بە ڕووسیا دەدۆڕێنێت. لەناو ئەو کاولکارییەوە <em>بەڵگەنامەی فەرمانڕەوایی (Instrument of Government)</em> دەردەکەوێت — چوارچێوەیەکی دەستووری کە بە شێوەیەکی زۆر چاکسازیکراو هێشتا تا ئەمڕۆش جێبەجێ دەکرێت. سوید لەو کاتەوە لە ئاشتیدا بووە.</p>
          <h2>Folkhemmet (ماڵی گەل) (1932 – 1976)</h2>
          <p>سۆسیال دیموکراتەکان بۆ ماوەی 44 ساڵی بەردەوام وڵات بەڕێوە دەبەن و <em>folkhem</em> بنیات دەنێن — "ماڵی گەل"، نموونەی دەوڵەتی خۆشگوزەرانی لەگەڵ خزمەتگوزاریی تەندروستی، خوێندن و خانەنشینیی گشتگیر، کە بە باجی پلەبەندی دابین دەکرێت. ئەمە ئەو سویدەیە کە زۆربەی بیانییەکان وێنای دەکەن.</p>
          <h2>سەردەمی مۆدێرن</h2>
          <ul>
            <li>1995 — چوونە ناو یەکێتیی ئەورووپا.</li>
            <li>2003 — دەنگدانی نەرێنی بۆ پەسەندکردنی یۆرۆ.</li>
            <li>2024 — چوونە ناو NATO، کۆتایی هێنان بە زیاتر لە 200 ساڵ نابەستراویی سەربازی.</li>
          </ul>
          ${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: 6ی ژوئن · چوونە ناو EU: 1995 · چوونە ناو NATO: 2024 · ماوەی ئاشتیی درێژ: زۆرتر وەک بەردەوام لە 1814ەوە باس دەکرێت.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        fa: `<h2>وایکینگ‌ها (793 – ~1066)</h2>
          <p>تصویر کلاهخودهای شاخ‌دار ساختهٔ یک اپرای قرن نوزدهمی است. واقعیت جالب‌تر است: بازرگانان، کشاورزان، مهاجمان و کاشفانی که به زبان نورس کهن سخن می‌گفتند. سوئدی‌ها بیشتر به سمت شرق می‌رفتند — از مسیر رودخانه‌ها به روسیه و اوکراین امروزی — تا نقره، برده و کهربا را با کالاهای بیزانس مبادله کنند.</p>
          <p>این دوران به‌تدریج با مسیحی‌شدن سوئد (پادشاه Olof Skötkonung که حدود سال 1000 غسل تعمید یافت) و یکپارچه‌شدن زیر حکومت پادشاهی به پایان می‌رسد.</p>
          <h2>اتحادیهٔ کالمار (1397 – 1523)</h2>
          <p>دانمارک، نروژ و سوئد زیر یک پادشاه گرد هم می‌آیند، عمدتاً به این دلیل که سلطهٔ خفه‌کنندهٔ اتحادیهٔ هانزی بر تجارت دریای بالتیک همه را از سر ترس به همکاری واداشت. این اتحاد بیشتر ناکام ماند، آن هم بیشتر به‌خاطر دانمارک.</p>
          <h2>Gustav Vasa &amp; دولت مدرن (1523)</h2>
          <p>پس از کشتار استکهلم (1520، کاملاً در خور آن دوران)، Gustav Eriksson Vasa تخت پادشاهی را به دست می‌گیرد، با کلیسای کاتولیک قطع رابطه می‌کند و پادشاهی موروثی برپا می‌سازد. 6 ژوئن — روز انتخاب او — به روز ملی سوئد بدل می‌شود، هرچند تنها از سال 2005 به‌طور رسمی.</p>
          <h2>دوران ابرقدرتی (1611 – 1721)</h2>
          <p>برای یک سده، سوئد یک ابرقدرت اروپایی است. این امپراتوری در سراسر فنلاند، کشورهای بالتیک و بخش‌هایی از شمال آلمان گسترده می‌شود. Gustav II Adolf به‌گونه‌ای مشهور در میدان نبرد می‌میرد؛ Karl XII به‌گونه‌ای مشهور با گلولهٔ تک‌تیرانداز کشته می‌شود؛ و امپراتوری، باز هم به‌گونه‌ای مشهور، ورشکسته پایان می‌یابد.</p>
          <h2>1809: یک قانون اساسی، و از دست رفتن فنلاند</h2>
          <p>سوئد فنلاند را به روسیه می‌بازد. از دل این ویرانی <em>سند حکومت (Instrument of Government)</em> پدید می‌آید — چارچوبی قانون‌اساسی که با اصلاحات گسترده هنوز هم امروز پابرجاست. سوئد از آن زمان تاکنون در صلح بوده است.</p>
          <h2>Folkhemmet (خانهٔ مردم) (1932 – 1976)</h2>
          <p>سوسیال‌دموکرات‌ها 44 سال پیاپی کشور را اداره می‌کنند و <em>folkhem</em> را می‌سازند — "خانهٔ مردم"، الگوی دولت رفاه با خدمات بهداشتی، آموزش و بازنشستگی همگانی که با مالیات تصاعدی تأمین مالی می‌شود. این همان سوئدی است که بیشتر خارجی‌ها تصور می‌کنند.</p>
          <h2>دوران مدرن</h2>
          <ul>
            <li>1995 — پیوستن به اتحادیهٔ اروپا.</li>
            <li>2003 — رأی منفی به پذیرش یورو.</li>
            <li>2024 — پیوستن به NATO و پایان‌دادن به بیش از 200 سال عدم تعهد نظامی.</li>
          </ul>
          ${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · پیوستن به EU: 1995 · پیوستن به NATO: 2024 · دورهٔ صلح طولانی: معمولاً پیوسته از 1814 توصیف می‌شود.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        pl: `<h2>Wikingowie (793 – ~1066)</h2>
          <p>Obraz hełmów z rogami to wynalazek dziewiętnastowiecznej opery. Rzeczywistość jest ciekawsza: mówiący po nordyjsku kupcy, rolnicy, najeźdźcy i odkrywcy. Szwedzi ruszali głównie na wschód — w dół rzek, na tereny dzisiejszej Rosji i Ukrainy — by wymieniać srebro, niewolników i bursztyn na towary z Bizancjum.</p>
          <p>Epoka kończy się stopniowo, gdy Szwecja przyjmuje chrześcijaństwo (król Olof Skötkonung, ochrzczony ok. 1000) i konsoliduje się pod władzą monarchiczną.</p>
          <h2>Unia kalmarska (1397 – 1523)</h2>
          <p>Dania, Norwegia i Szwecja jednoczą się pod jednym monarchą, głównie dlatego, że dominacja Hanzy (Hanseatic League) nad handlem bałtyckim przestraszyła wszystkich na tyle, by podjąć współpracę. W większości się to nie udało, głównie z powodu Danii.</p>
          <h2>Gustav Vasa &amp; nowoczesne państwo (1523)</h2>
          <p>Po krwawej łaźni sztokholmskiej (Stockholm Bloodbath) (1520, bardzo w stylu epoki) Gustav Eriksson Vasa obejmuje tron, zrywa z Kościołem katolickim i ustanawia monarchię dziedziczną. 6 czerwca — dzień jego wyboru — staje się szwedzkim świętem narodowym, choć formalnie dopiero w 2005.</p>
          <h2>Epoka mocarstwowa (1611 – 1721)</h2>
          <p>Przez stulecie Szwecja jest europejskim supermocarstwem. Imperium rozciąga się przez Finlandię, kraje bałtyckie i część północnych Niemiec. Gustav II Adolf ginie, jak wiadomo, na polu bitwy; Karol XII ginie, jak wiadomo, od strzału snajpera; imperium kończy się, jak wiadomo, w bankructwie.</p>
          <h2>1809: konstytucja i utracona Finlandia</h2>
          <p>Szwecja traci Finlandię na rzecz Rosji. Z tych zgliszcz powstaje <em>Akt o formie rządu</em> — ramy konstytucyjne, które w mocno zmienionej postaci obowiązują do dziś. Szwecja od tego czasu pozostaje w pokoju.</p>
          <h2>Folkhemmet (1932 – 1976)</h2>
          <p>Socjaldemokraci rządzą krajem przez 44 nieprzerwane lata i budują <em>folkhem</em> — „dom ludowy”, model państwa opiekuńczego z powszechną opieką zdrowotną, edukacją i emeryturami, finansowany z progresywnego opodatkowania. To właśnie tę Szwecję wyobraża sobie większość obcokrajowców.</p>
          <h2>Epoka nowoczesna</h2>
          <ul>
            <li>1995 — przystąpienie do Unii Europejskiej.</li>
            <li>2003 — głosowanie przeciw przyjęciu euro.</li>
            <li>2024 — przystąpienie do NATO, kończące ponad 200 lat braku przynależności wojskowej.</li>
          </ul>
          ${ebookFactBox('pl', null, 'Święto narodowe: 6 czerwca · Przystąpienie do EU: 1995 · Przystąpienie do NATO: 2024 · Długi okres pokoju: zwykle opisywany jako nieprzerwany od 1814.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        so: `<h2>Vikingyada (793 – ~1066)</h2>
          <p>Sawirka koofiyadaha geesaha leh waa alaab opera oo qarniga 19-aad la hindisay. Xaqiiqdu way ka xiiso badan tahay: ganacsato, beeraley, weerarleyaal iyo sahamiyayaal ku hadlay luqadda Norse. Iswiidhishku inta badan waxay u kaceen bari — wabiyada hoosta iyo Ruushka iyo Ukrayn ee maanta — si ay lacagta qalin, addoommada iyo cambarka ugu baddalaan badeecadaha Byzantium.</p>
          <p>Xilligu si tartiib ah ayuu u dhammaadaa markii Iswiidhan Masiixiyad noqotay (Boqor Olof Skötkonung, waxaa la baabtiisay qiyaastii 1000) oo ay isku ururtay xukunka boqortooyada.</p>
          <h2>Midowga Kalmar (1397 – 1523)</h2>
          <p>Danmark, Norway iyo Iswiidhan waxay isku biireen hal boqor, inta badan sababtoo ah cadaadiska Ururka Hanseatic (Hanseatic League) ee ganacsiga Baltic ayaa qof walba ku cabsiiyay iskaashi. Inta badan ma shaqayn, inta badan Danmark dartood.</p>
          <h2>Gustav Vasa &amp; dawladda casriga ah (1523)</h2>
          <p>Ka dib Dhiig-daadinta Stockholm (Stockholm Bloodbath) (1520, oo aad ugu habboon xilligaas), Gustav Eriksson Vasa wuxuu qaatay carshiga, wuxuu ka go'ay kaniisadda Kaatooligga, wuxuuna dhisay boqortooyo dhaxal ah. 6 Juun — maalintii la doortay — waxay noqotay maalinta qaranka Iswiidhan, inkastoo si rasmi ah oo keliya 2005.</p>
          <h2>Xilligii Awoodda Weyn (1611 – 1721)</h2>
          <p>Muddo qarni ah, Iswiidhan waa quwad weyn oo reer Yurub ah. Boqortooyadu waxay ku fidday Finland, dalalka Baltic, iyo qaybo ka mid ah waqooyiga Jarmalka. Gustav II Adolf wuxuu si caan ah ugu dhintay goob dagaal; Karl XII wuxuu si caan ah ugu dhintay rasaas qarsoodi ah; boqortooyaduna waxay si caan ah ku dhammaatay musalafnimo.</p>
          <h2>1809: dastuur, iyo Finland oo lumay</h2>
          <p>Iswiidhan waxay Finland u lumisay Ruushka. Burburkaas waxaa ka soo baxay <em>Qoraalka Dawladnimada</em> — qaab dastuuri ah oo, qaab aad loo dib u eegay, ilaa maanta khuseeya. Iswiidhan tan iyo markaas way nabad ku jirtay.</p>
          <h2>Folkhemmet (1932 – 1976)</h2>
          <p>Dimoqraadiyiinta Bulshada waxay dalka maamuleen 44 sano oo aan kala go'in waxayna dhiseen <em>folkhem</em> — "guriga dadweynaha", oo ah qaab dawlad daryeel oo leh daryeel caafimaad guud, waxbarasho iyo hawlgab, oo lagu maalgeliyo canshuur horumarsan. Tani waa Iswiidhanka ay shisheeyaha intooda badani maleeyaan.</p>
          <h2>Xilliga casriga ah</h2>
          <ul>
            <li>1995 — waxay ku biirtay Midowga Yurub.</li>
            <li>2003 — waxay u codaysay ka soo horjeedka qaadashada euro.</li>
            <li>2024 — waxay ku biirtay NATO, taas oo soo afjartay in ka badan 200 sano oo aan militari isbahaysi lahayn.</li>
          </ul>
          ${ebookFactBox('so', null, 'Maalinta qaranka: 6 Juun · Ku biiristii EU: 1995 · Ku biiristii NATO: 2024 · Muddo nabadeed dheer: badanaa lagu tilmaamo mid joogto ah tan iyo 1814.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ti: `<h2>ቫይኪንግ (793 – ~1066)</h2>
          <p>እቲ ቀርኒ ዘለዎ ቆብዕ ስእሊ ናይ 19 ክፍለ ዘመን ኦፐራ ፈጠራ እዩ። እቲ ሓቂ ግን ዝያዳ ዝስሕብ እዩ፦ ብኖርስ ቋንቋ ዝዛረቡ ነጋዶ፣ ሓረስቶት፣ ወረርትን መርመርትን። ሽወደናውያን መብዛሕትኦም ናብ ምብራቕ ይኸዱ ነበሩ — ብወሓይዝ ናብ ሎሚ ሩስያን ዩክሬንን — ብሩር፣ ባሮትን ኣምበርን ብኣቕሑ ቢዛንቲየም ንምልውዋጥ።</p>
          <p>እቲ ዘመን ሽወደን ናብ ክርስትና ምስ ኣተወት (ንጉስ Olof Skötkonung፣ ኣስታት 1000 ተጠሚቑ) ኣብ ትሕቲ ንጉሳዊ ምሕደራ ምስ ተወሃሃደት ቀስ ብቐስ ይውዳእ።</p>
          <h2>ሕብረት ካልማር (1397 – 1523)</h2>
          <p>ዴንማርክ፣ ኖርወይን ሽወደንን ኣብ ትሕቲ ሓደ ንጉስ ይሕበራ፣ መብዛሕትኡ ግዜ እቲ ናይ ሃንሰ ሊግ (Hanseatic League) ኣብ ንግዲ ባልቲክ ዝነበሮ ምሕናቕ ንኹሎም ኣፍሪሁ ናብ ምትሕብባር ስለ ዝደፍኦም። መብዛሕትኡ ግዜ ኣይሰርሐን፣ መብዛሕትኡ ግዜ ብሰንኪ ዴንማርክ።</p>
          <h2>Gustav Vasa &amp; ዘመናዊ መንግስቲ (1523)</h2>
          <p>ድሕሪ ናይ ስቶክሆልም ደም ምፍሳስ (Stockholm Bloodbath) (1520፣ ነቲ ዘመን ኣዝዩ ዝሰማማዕ)፣ Gustav Eriksson Vasa ዝፋን ይሕዝ፣ ምስ ካቶሊካዊት ቤተ ክርስቲያን ይፍለ፣ ውርሻዊ ንግስና ድማ የቕውም። 6 ሰነ — መዓልቲ ምርጫኡ — ሃገራዊ መዓልቲ ሽወደን ይኸውን፣ ብወግዒ ግን ኣብ 2005 ጥራይ።</p>
          <h2>ዘመነ ዓብዪ ሓይሊ (1611 – 1721)</h2>
          <p>ንሓደ ክፍለ ዘመን፣ ሽወደን ኤውሮጳዊት ዓባይ ሓይሊ እያ። እቲ ግዝኣት ኣብ ፊንላንድ፣ ባልቲክን ክፍልታት ሰሜን ጀርመንን ይዝርጋሕ። Gustav II Adolf ከም ዝፍለጥ ኣብ ሜዳ ኲናት ይመውት፣ Karl XII ከም ዝፍለጥ ብተኳሲ ይመውት፣ እቲ ግዝኣት ድማ ከም ዝፍለጥ ብክስራ ይውዳእ።</p>
          <h2>1809፦ ቅዋምን ዝጠፍአት ፊንላንድን</h2>
          <p>ሽወደን ንፊንላንድ ናብ ሩስያ ተጥፍኣ። ካብቲ ዕንወት <em>ሰነድ ምሕደራ መንግስቲ</em> ይወጽእ — ብብዙሕ ዝተመሓየሸ መልክዕ፣ ክሳብ ሎሚ ዝሰርሕ ቅዋማዊ ቅርጻ። ሽወደን ካብኡ ንደሓር ኣብ ሰላም ጸኒሓ።</p>
          <h2>Folkhemmet (1932 – 1976)</h2>
          <p>ሶሻል ደሞክራትስ ንሃገር 44 ዘይተቛረጸ ዓመታት ይመርሕዋ <em>folkhem</em> ድማ ይሃንጹ — „ቤት ህዝቢ”፣ ብደረጃ ዝዓቢ ቀረጽ ዝምወል፣ ሓፈሻዊ ክንክን ጥዕና፣ ትምህርትን ጥሮታን ዘለዎ ኣገባብ መንግስቲ ድሕነት። እዚ እዩ እቲ መብዛሕትኦም ወጻእተኛታት ዝሓስብዎ ሽወደን።</p>
          <h2>ዘመናዊ ዘበን</h2>
          <ul>
            <li>1995 — ናብ ኤውሮጳዊ ሕብረት ኣተወት።</li>
            <li>2003 — ኣንጻር ምቕባል euro ድምጺ ሃበት።</li>
            <li>2024 — ናብ NATO ኣተወት፣ ካብ 200 ዓመት ንላዕሊ ዝጸንሐ ወተሃደራዊ ዘይምሕባር ኣብቂዓ።</li>
          </ul>
          ${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ፦ 6 ሰነ · ናብ EU ምእታው፦ 1995 · ናብ NATO ምእታው፦ 2024 · ነዊሕ ናይ ሰላም እዋን፦ መብዛሕትኡ ግዜ ካብ 1814 ጀሚሩ ከም ቀጻሊ ይግለጽ።', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        tr: `<h2>Vikingler (793 – ~1066)</h2>
          <p>Boynuzlu miğfer imgesi 19. yüzyıla ait bir opera icadıdır. Gerçek daha ilginç: Nors dili konuşan tüccarlar, çiftçiler, akıncılar ve kâşifler. İsveçliler çoğunlukla doğuya gitti — nehirlerden aşağı, bugünkü Rusya ve Ukrayna'ya — gümüş, köle ve kehribarı Bizans mallarıyla takas etmek için.</p>
          <p>Dönem, İsveç Hristiyanlaştıkça (Kral Olof Skötkonung, yaklaşık 1000'de vaftiz edildi) ve monarşik yönetim altında birleştikçe yavaş yavaş sona erer.</p>
          <h2>Kalmar Birliği (1397 – 1523)</h2>
          <p>Danimarka, Norveç ve İsveç tek bir hükümdar altında birleşir; çoğunlukla Hansa Birliği'nin (Hanseatic League) Baltık ticaretindeki boğucu egemenliği herkesi iş birliğine korkutarak ittiği için. Çoğunlukla işe yaramadı, çoğunlukla da Danimarka yüzünden.</p>
          <h2>Gustav Vasa &amp; modern devlet (1523)</h2>
          <p>Stockholm Kan Banyosu'ndan (Stockholm Bloodbath) (1520, döneme çok yakışan bir olay) sonra Gustav Eriksson Vasa tahta çıkar, Katolik kilisesiyle bağını koparır ve kalıtsal bir monarşi kurar. 6 Haziran — onun seçildiği gün — İsveç'in ulusal günü olur, ancak resmî olarak ancak 2005'te.</p>
          <h2>Büyük Güç Dönemi (1611 – 1721)</h2>
          <p>Bir yüzyıl boyunca İsveç bir Avrupa süper gücüdür. İmparatorluk Finlandiya, Baltık ülkeleri ve kuzey Almanya'nın bazı bölgelerine yayılır. Gustav II Adolf, herkesçe bilindiği gibi bir savaş alanında ölür; Karl XII, herkesçe bilindiği gibi bir keskin nişancı tarafından ölür; imparatorluk da, herkesçe bilindiği gibi, iflas etmiş halde son bulur.</p>
          <h2>1809: bir anayasa ve kaybedilen Finlandiya</h2>
          <p>İsveç, Finlandiya'yı Rusya'ya kaptırır. Bu enkazdan <em>Yönetim Belgesi</em> doğar — ağır biçimde gözden geçirilmiş haliyle bugün hâlâ geçerli olan bir anayasal çerçeve. İsveç o zamandan beri barış içindedir.</p>
          <h2>Folkhemmet (1932 – 1976)</h2>
          <p>Sosyal Demokratlar ülkeyi 44 yıl kesintisiz yönetir ve <em>folkhem</em>'i — "halkın evi"ni — kurar: ilerici vergilendirmeyle finanse edilen, herkese açık sağlık, eğitim ve emeklilik içeren bir refah devleti modeli. Çoğu yabancının hayal ettiği İsveç budur.</p>
          <h2>Modern dönem</h2>
          <ul>
            <li>1995 — Avrupa Birliği'ne katılır.</li>
            <li>2003 — euroyu benimsemeye karşı oy verir.</li>
            <li>2024 — 200 yılı aşkın askeri tarafsızlığı sona erdirerek NATO'ya katılır.</li>
          </ul>
          ${ebookFactBox('tr', null, "Ulusal gün: 6 Haziran · EU'ya katılım: 1995 · NATO'ya katılım: 2024 · Uzun barış dönemi: genellikle 1814'ten beri kesintisiz olarak tanımlanır.", ['uhrStudyMaterial', 'governmentNato'])}
        `,
        uk: `<h2>Вікінги (793 – ~1066)</h2>
          <p>Образ рогатих шоломів — це винахід опери XIX століття. Реальність цікавіша: торговці, фермери, нападники та дослідники, що розмовляли давньоскандинавською. Шведи здебільшого рушали на схід — униз річками, на терени сучасних Росії та України — щоб обмінювати срібло, рабів і бурштин на товари з Візантії.</p>
          <p>Епоха завершується поступово, коли Швеція християнізується (король Olof Skötkonung, охрещений бл. 1000) та консолідується під монархічним правлінням.</p>
          <h2>Кальмарська унія (1397 – 1523)</h2>
          <p>Данія, Норвегія та Швеція об'єднуються під одним монархом, здебільшого тому, що мертва хватка Ганзи (Hanseatic League) над балтійською торгівлею налякала всіх настільки, що ті почали співпрацювати. Здебільшого це не спрацювало, здебільшого через Данію.</p>
          <h2>Gustav Vasa &amp; сучасна держава (1523)</h2>
          <p>Після Стокгольмської кривавої лазні (Stockholm Bloodbath) (1520, дуже в дусі тієї доби) Gustav Eriksson Vasa посідає трон, розриває з католицькою церквою та встановлює спадкову монархію. 6 червня — день його обрання — стає національним святом Швеції, хоча формально лише у 2005.</p>
          <h2>Доба великодержавності (1611 – 1721)</h2>
          <p>Упродовж століття Швеція є європейською наддержавою. Імперія простягається через Фінляндію, Балтію та частину північної Німеччини. Gustav II Adolf, як відомо, гине на полі бою; Karl XII, як відомо, гине від кулі снайпера; імперія, як відомо, закінчується банкрутством.</p>
          <h2>1809: конституція та втрачена Фінляндія</h2>
          <p>Швеція втрачає Фінляндію на користь Росії. З цих руїн постає <em>Акт про форму правління</em> — конституційні рамки, які у суттєво переглянутому вигляді діють і досі. Відтоді Швеція перебуває в мирі.</p>
          <h2>Folkhemmet (1932 – 1976)</h2>
          <p>Соціал-демократи керують країною 44 роки поспіль і будують <em>folkhem</em> — „народний дім”, модель держави загального добробуту з універсальною охороною здоров'я, освітою та пенсіями, що фінансується за рахунок прогресивного оподаткування. Саме таку Швецію уявляє більшість іноземців.</p>
          <h2>Сучасна доба</h2>
          <ul>
            <li>1995 — вступає до Європейського Союзу.</li>
            <li>2003 — голосує проти запровадження євро.</li>
            <li>2024 — вступає до NATO, завершуючи понад 200 років військового нейтралітету.</li>
          </ul>
          ${ebookFactBox('uk', null, 'Національне свято: 6 червня · Вступ до EU: 1995 · Вступ до NATO: 2024 · Тривалий період миру: зазвичай описується як безперервний від 1814.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
      },
    },

    2: {
      kicker: {
        en: 'Chapter 02 · Government',
        sv: 'Kapitel 02 · Statsskick',
        'zh-Hans': '第 02 章 · 政府',
        'zh-Hant': '第 02 章 · 政府',
        ar: 'الفصل 02 · الحكم',
        ckb: 'بەشی 02 · فەرمانڕەوایی',
        fa: 'فصل 02 · حکومت',
        pl: 'Rozdział 02 · Władza',
        so: 'Cutubka 02 · Dawladnimo',
        ti: 'ምዕራፍ 02 · ምሕደራ',
        tr: 'Bölüm 02 · Yönetim',
        uk: 'Розділ 02 · Влада',
      },
      title: {
        en: 'How Sweden',
        sv: 'Hur Sverige',
        'zh-Hans': '瑞典',
        'zh-Hant': '瑞典',
        ar: 'كيف تُحكَم',
        ckb: 'سوید چۆن',
        fa: 'سوئد چگونه',
        pl: 'Jak rządzona jest',
        so: 'Sida Iswiidhan',
        ti: 'ሽወደን ብኸመይ',
        tr: 'İsveç nasıl',
        uk: 'Як управляється',
      },
      title_em: {
        en: 'is governed.',
        sv: 'styrs.',
        'zh-Hans': '如何治理。',
        'zh-Hant': '如何治理。',
        ar: 'السويد.',
        ckb: 'بەڕێوە دەبردرێت.',
        fa: 'اداره می‌شود.',
        pl: 'Szwecja.',
        so: 'loo maamulo.',
        ti: 'ከም እትመሓደር።',
        tr: 'yönetilir.',
        uk: 'Швеція.',
      },
      lede: {
        en: "A king who can't decide, a Riksdag that does, and 290 municipalities you'll mostly only meet at the recycling station.",
        sv: 'En kung som inte bestämmer, en riksdag som gör det, och 290 kommuner du oftast bara träffar vid återvinningen.',
        'zh-Hans':
          '一位无权决断的国王、一个真正做决定的 Riksdag（议会），以及 290 个你大概只会在回收站碰到的 kommun（市镇）。',
        'zh-Hant':
          '一位無權決斷的國王、一個真正做決定的 Riksdag（議會），以及 290 個你大概只會在回收站碰到的 kommun（市鎮）。',
        ar: 'ملكٌ لا يستطيع أن يقرّر، و Riksdag (البرلمان) يقرّر، و290 بلدية لن تلتقي بها في الغالب إلا عند محطة إعادة التدوير.',
        ckb: 'پاشایەک کە ناتوانێت بڕیار بدات، Riksdagـێک (پەرلەمان) کە بڕیار دەدات، و 290 شارەوانی کە زۆرتر تەنها لە وێستگەی پیتاندنەوەدا دەیانبینیت.',
        fa: 'پادشاهی که نمی‌تواند تصمیم بگیرد، یک Riksdag (پارلمان) که تصمیم می‌گیرد، و 290 کمون که بیشتر فقط در ایستگاه بازیافت با آن‌ها سروکار خواهید داشت.',
        pl: 'Król, który nie może decydować, Riksdag (parlament), który decyduje, oraz 290 gmin (kommuner), które spotkasz głównie przy stacji recyklingu.',
        so: "Boqor aan go'aan qaadan karin, Riksdag (baarlamaan) oo qaada, iyo 290 degmo (kommuner) oo aad badanaa kula kulmi doonto saldhigga dib-u-warshadaynta.",
        ti: 'ክውስን ዘይክእል ንጉስ፣ ዝውስን Riksdag (ባይቶ)፣ ከምኡ’ውን መብዛሕትኡ ግዜ ኣብ መደበር ዳግመ-ምጥቃም ጥራይ እትረኽቦም 290 kommun (ምምሕዳር ከተማ)።',
        tr: 'Karar veremeyen bir kral, karar veren bir Riksdag (parlamento) ve çoğunlukla yalnızca geri dönüşüm istasyonunda karşılaşacağınız 290 belediye (kommuner).',
        uk: 'Король, який не може вирішувати, Riksdag (парламент), який вирішує, та 290 муніципалітетів (kommuner), які ви здебільшого зустрінете лише на станції переробки.',
      },
      body: {
        en: `
          <h2>Three levels of government</h2>
          <p>Sweden is a <em>constitutional monarchy</em> and <em>parliamentary democracy</em>. Power runs at three levels:</p>
          <ul>
            <li><b>National</b> — the Riksdag (parliament), regering (government), and the king (ceremonial).</li>
            <li><b>Regional</b> — 21 regions, mainly responsible for healthcare and public transport.</li>
            <li><b>Local</b> — 290 municipalities (<em>kommuner</em>), responsible for schools, social services, water, and garbage.</li>
          </ul>
          <h2>The Riksdag</h2>
          <p>349 seats. Elected every four years (general election, second Sunday in September). A 4% threshold keeps tiny parties out. The Riksdag legislates, controls the budget, and confirms the prime minister.</p>
          <h2>The government</h2>
          <p>Led by the <em>statsminister</em> (prime minister). Includes ~22 ministers heading their respective ministries. Cannot pass laws on its own — laws need the Riksdag.</p>
          <h2>The king</h2>
          <p>Carl XVI Gustaf has been king since 1973. His role is entirely ceremonial: opens the Riksdag, hosts state visits, hands out Nobel Prizes. He cannot veto laws or pick the PM.</p>
          <h2>Watchdogs</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — the Chancellor of Justice, the government's lawyer.</li>
            <li><b>JO</b> (Justitieombudsmannen) — the Parliamentary Ombudsman, checks public agencies.</li>
            <li><b>The courts</b> — independent, with the Supreme Court (Högsta domstolen) at the top.</li>
          </ul>
          <h2>Voting</h2>
          <p>You vote in three separate elections on the same day: Riksdag, region, and kommun. You also vote in EU elections every five years. Swedish citizens vote in all four; permanent residents vote in regional and municipal elections after three years.</p>
          ${ebookFactBox('en', 'Facts to review', 'Riksdag size: 349 · Threshold: 4% · Election interval: 4 years · Number of regions: 21 · Number of municipalities: 290.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Sverige är både en konstitutionell monarki och en parlamentarisk demokrati: kungen har ceremoniella uppgifter, medan riksdag och regering fattar politiska beslut.',
            'Riksdagen har 349 ledamöter, beslutar om lagar och statsbudget och kontrollerar regeringen.',
            'Regionerna ansvarar främst för hälso- och sjukvård och kollektivtrafik. Kommunerna ansvarar bland annat för skola, socialtjänst, vatten och avfall.',
            'Allmänna val hålls vart fjärde år. Svenska medborgare röstar till riksdagen, regionen och kommunen.',
          ],
          'Riksdag: 349 ledamöter · Val: vart fjärde år · Regioner: 21 · Kommuner: 290.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>三级政府</h2>
          <p>瑞典是一个 <em>君主立宪制国家</em>，也是一个 <em>议会民主制国家</em>。权力在三个层级上运作：</p>
          <ul>
            <li><b>全国层级</b>——Riksdag（议会）、regering（政府）和国王（礼仪性角色）。</li>
            <li><b>区域层级</b>——21 个 region（大区），主要负责医疗和公共交通。</li>
            <li><b>地方层级</b>——290 个 kommun（<em>市镇</em>），负责学校、社会服务、供水和垃圾处理。</li>
          </ul>
          <h2>Riksdag（议会）</h2>
          <p>共 349 个席位。每四年选举一次（大选，9 月的第二个星期日）。4% 的门槛把小党挡在门外。Riksdag 负责立法、掌控预算，并确认首相人选。</p>
          <h2>政府</h2>
          <p>由 <em>statsminister（首相）</em> 领导。包含约 22 位大臣，各自执掌相应的部门。政府本身无法通过法律——法律需要经过 Riksdag。</p>
          <h2>国王</h2>
          <p>Carl XVI Gustaf 自 1973 年起担任国王。他的角色完全是礼仪性的：为 Riksdag 开议、接待国事访问、颁发诺贝尔奖。他不能否决法律，也不能挑选首相。</p>
          <h2>监督机构</h2>
          <ul>
            <li><b>JK</b>（Justitiekanslern，司法总监）——政府的法律顾问。</li>
            <li><b>JO</b>（Justitieombudsmannen，议会监察专员）——负责监督政府机关。</li>
            <li><b>法院</b>——独立运作，以 Högsta domstolen（最高法院）居于顶端。</li>
          </ul>
          <h2>投票</h2>
          <p>你会在同一天参加三场各自独立的选举：Riksdag、region 和 kommun。此外，你每五年还会参加一次 EU（欧盟）选举。瑞典公民这四种选举都能参加；永久居民在居住满三年后，可以参加区域和市镇选举。</p>
          ${ebookFactBox('zh-Hans', null, 'Riksdag 席位数：349 · 门槛：4% · 选举间隔：4 年 · region 数量：21 · kommun 数量：290。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>三級政府</h2>
          <p>瑞典是一個 <em>君主立憲制國家</em>，也是一個 <em>議會民主制國家</em>。權力在三個層級上運作：</p>
          <ul>
            <li><b>全國層級</b>——Riksdag（議會）、regering（政府）和國王（禮儀性角色）。</li>
            <li><b>區域層級</b>——21 個 region（大區），主要負責醫療和公共交通。</li>
            <li><b>地方層級</b>——290 個 kommun（<em>市鎮</em>），負責學校、社會服務、供水和垃圾處理。</li>
          </ul>
          <h2>Riksdag（議會）</h2>
          <p>共 349 個席位。每四年選舉一次（大選，9 月的第二個星期日）。4% 的門檻把小黨擋在門外。Riksdag 負責立法、掌控預算，並確認首相人選。</p>
          <h2>政府</h2>
          <p>由 <em>statsminister（首相）</em> 領導。包含約 22 位大臣，各自執掌相應的部門。政府本身無法通過法律——法律需要經過 Riksdag。</p>
          <h2>國王</h2>
          <p>Carl XVI Gustaf 自 1973 年起擔任國王。他的角色完全是禮儀性的：為 Riksdag 開議、接待國事訪問、頒發諾貝爾獎。他不能否決法律，也不能挑選首相。</p>
          <h2>監督機構</h2>
          <ul>
            <li><b>JK</b>（Justitiekanslern，司法總監）——政府的法律顧問。</li>
            <li><b>JO</b>（Justitieombudsmannen，議會監察專員）——負責監督政府機關。</li>
            <li><b>法院</b>——獨立運作，以 Högsta domstolen（最高法院）居於頂端。</li>
          </ul>
          <h2>投票</h2>
          <p>你會在同一天參加三場各自獨立的選舉：Riksdag、region 和 kommun。此外，你每五年還會參加一次 EU（歐盟）選舉。瑞典公民這四種選舉都能參加；永久居民在居住滿三年後，可以參加區域和市鎮選舉。</p>
          ${ebookFactBox('zh-Hant', null, 'Riksdag 席位數：349 · 門檻：4% · 選舉間隔：4 年 · region 數量：21 · kommun 數量：290。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>ثلاثة مستويات للحكم</h2>
          <p>السويد <em>ملكية دستورية</em> و<em>ديمقراطية برلمانية</em>. وتجري السلطة على ثلاثة مستويات:</p>
          <ul>
            <li><b>الوطني</b> — Riksdag (البرلمان)، وregering (الحكومة)، والملك (دور تشريفي).</li>
            <li><b>الإقليمي</b> — 21 إقليمًا (region)، مسؤولة أساسًا عن الرعاية الصحية والنقل العام.</li>
            <li><b>المحلي</b> — 290 بلدية (<em>kommuner</em>)، مسؤولة عن المدارس والخدمات الاجتماعية والمياه والنفايات.</li>
          </ul>
          <h2>الـ Riksdag</h2>
          <p>349 مقعدًا. يُنتخَب كل أربع سنوات (انتخابات عامة، الأحد الثاني من سبتمبر). وتمنع عتبة 4% الأحزاب الصغيرة جدًا من الدخول. يشرّع Riksdag القوانين، ويتحكّم في الميزانية، ويقرّ رئيس الوزراء.</p>
          <h2>الحكومة</h2>
          <p>يقودها <em>statsminister</em> (رئيس الوزراء). وتضمّ نحو 22 وزيرًا يرأسون وزاراتهم المختلفة. ولا تستطيع سنّ القوانين بمفردها — فالقوانين تحتاج إلى Riksdag.</p>
          <h2>الملك</h2>
          <p>Carl XVI Gustaf ملكٌ منذ 1973. ودوره تشريفي بالكامل: يفتتح Riksdag، ويستضيف الزيارات الرسمية، ويسلّم جوائز نوبل. ولا يستطيع نقض القوانين أو اختيار رئيس الوزراء.</p>
          <h2>الجهات الرقابية</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — مستشار العدل، محامي الحكومة.</li>
            <li><b>JO</b> (Justitieombudsmannen) — أمين المظالم البرلماني، يراقب الهيئات العامة.</li>
            <li><b>المحاكم</b> — مستقلة، وعلى رأسها المحكمة العليا (Högsta domstolen).</li>
          </ul>
          <h2>التصويت</h2>
          <p>تصوّت في ثلاثة انتخابات منفصلة في اليوم نفسه: Riksdag، والإقليم (region)، والبلدية (kommun). كما تصوّت في انتخابات EU كل خمس سنوات. ويصوّت المواطنون السويديون في الأربعة جميعًا؛ أما المقيمون الدائمون فيصوّتون في الانتخابات الإقليمية والبلدية بعد ثلاث سنوات.</p>
          ${ebookFactBox('ar', null, 'حجم Riksdag: 349 · العتبة: 4% · فترة الانتخابات: 4 سنوات · عدد الأقاليم: 21 · عدد البلديات: 290.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>سێ ئاستی فەرمانڕەوایی</h2>
          <p>سوید <em>پاشایەتییەکی دەستوورییە</em> و <em>دیموکراسییەکی پەرلەمانی</em>یە. هێز لە سێ ئاستدا کاردەکات:</p>
          <ul>
            <li><b>نیشتمانی</b> — Riksdag (پەرلەمان)، regering (حکومەت) و پاشا (ڕێوڕەسمی).</li>
            <li><b>هەرێمی</b> — 21 هەرێم (region)، کە زۆرتر بەرپرسی خزمەتگوزاریی تەندروستی و گواستنەوەی گشتین.</li>
            <li><b>ناوخۆیی</b> — 290 شارەوانی (<em>kommuner</em>)، کە بەرپرسی قوتابخانە، خزمەتگوزاریی کۆمەڵایەتی، ئاو و خۆڵن.</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 کورسی. هەر چوار ساڵ جارێک هەڵدەبژێردرێت (هەڵبژاردنی گشتی، دووەم یەکشەممەی سێپتەمبەر). سنووری 4% ڕێگە بە پارتە زۆر بچووکەکان نادات بچنە ژوورەوە. Riksdag یاسا دادەنێت، بودجە کۆنترۆڵ دەکات، و سەرۆک‌وەزیران پەسەند دەکات.</p>
          <h2>حکومەت</h2>
          <p>بە سەرۆکایەتیی <em>statsminister</em> (سەرۆک‌وەزیران). نزیکەی 22 وەزیری تێدایە کە هەریەکەیان وەزارەتی خۆیان بەڕێوە دەبەن. ناتوانێت بە تەنها یاسا دەربکات — یاساکان پێویستیان بە Riksdag هەیە.</p>
          <h2>پاشا</h2>
          <p>Carl XVI Gustaf لە ساڵی 1973ەوە پاشایە. ڕۆڵی تەواو ڕێوڕەسمییە: Riksdag دەکاتەوە، میوانداریی سەردانە فەرمییەکان دەکات، و خەڵاتەکانی نۆبڵ دەبەخشێت. ناتوانێت ڤیتۆی یاساکان بکات یان سەرۆک‌وەزیران هەڵبژێرێت.</p>
          <h2>دەزگا چاودێرییەکان</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — ڕاوێژکاری دادپەروەری، پارێزەری حکومەت.</li>
            <li><b>JO</b> (Justitieombudsmannen) — سەرپەرشتیاری پەرلەمانی، چاودێریی دەزگا گشتییەکان دەکات.</li>
            <li><b>دادگاکان</b> — سەربەخۆن، لەگەڵ دادگای باڵا (Högsta domstolen) لە سەرەوەیان.</li>
          </ul>
          <h2>دەنگدان</h2>
          <p>لە یەک ڕۆژدا لە سێ هەڵبژاردنی جیاوازدا دەنگ دەدەیت: Riksdag، هەرێم (region) و شارەوانی (kommun). هەروەها هەر پێنج ساڵ جارێک لە هەڵبژاردنی EUدا دەنگ دەدەیت. هاووڵاتیانی سویدی لە هەر چوارەکەدا دەنگ دەدەن؛ نیشتەجێ هەمیشەییەکان دوای سێ ساڵ لە هەڵبژاردنی هەرێمی و شارەوانیدا دەنگ دەدەن.</p>
          ${ebookFactBox('ckb', null, 'قەبارەی Riksdag: 349 · سنوور: 4% · ماوەی هەڵبژاردن: 4 ساڵ · ژمارەی هەرێمەکان: 21 · ژمارەی شارەوانییەکان: 290.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>سه سطح حکومت</h2>
          <p>سوئد یک <em>پادشاهی مشروطه</em> و <em>دموکراسی پارلمانی</em> است. قدرت در سه سطح جریان دارد:</p>
          <ul>
            <li><b>ملی</b> — Riksdag (پارلمان)، regering (دولت) و پادشاه (تشریفاتی).</li>
            <li><b>منطقه‌ای</b> — 21 منطقه (region) که عمدتاً مسئول خدمات بهداشتی و حمل‌ونقل عمومی هستند.</li>
            <li><b>محلی</b> — 290 کمون (<em>kommuner</em>) که مسئول مدرسه‌ها، خدمات اجتماعی، آب و زباله هستند.</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 کرسی. هر چهار سال انتخاب می‌شود (انتخابات سراسری، یکشنبهٔ دوم سپتامبر). آستانهٔ 4% احزاب بسیار کوچک را بیرون نگه می‌دارد. Riksdag قانون‌گذاری می‌کند، بودجه را کنترل می‌کند و نخست‌وزیر را تأیید می‌کند.</p>
          <h2>دولت</h2>
          <p>به رهبری <em>statsminister</em> (نخست‌وزیر). شامل حدود 22 وزیر است که هر یک وزارتخانهٔ خود را اداره می‌کنند. به‌تنهایی نمی‌تواند قانون تصویب کند — قوانین به Riksdag نیاز دارند.</p>
          <h2>پادشاه</h2>
          <p>Carl XVI Gustaf از سال 1973 پادشاه است. نقش او کاملاً تشریفاتی است: Riksdag را افتتاح می‌کند، میزبان دیدارهای رسمی است و جوایز نوبل را اهدا می‌کند. او نمی‌تواند قوانین را وتو کند یا نخست‌وزیر را برگزیند.</p>
          <h2>نهادهای نظارتی</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — صدراعظم دادگستری، حقوق‌دان دولت.</li>
            <li><b>JO</b> (Justitieombudsmannen) — بازرس پارلمانی که نهادهای عمومی را بررسی می‌کند.</li>
            <li><b>دادگاه‌ها</b> — مستقل، با دیوان عالی کشور (Högsta domstolen) در رأس آن.</li>
          </ul>
          <h2>رأی‌گیری</h2>
          <p>شما در یک روز در سه انتخابات جداگانه رأی می‌دهید: Riksdag، منطقه (region) و کمون (kommun). همچنین هر پنج سال در انتخابات EU رأی می‌دهید. شهروندان سوئدی در هر چهار انتخابات رأی می‌دهند؛ مقیمان دائم پس از سه سال در انتخابات منطقه‌ای و کمونی رأی می‌دهند.</p>
          ${ebookFactBox('fa', null, 'اندازهٔ Riksdag: 349 · آستانه: 4% · فاصلهٔ انتخابات: 4 سال · تعداد مناطق: 21 · تعداد کمون‌ها: 290.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Trzy poziomy władzy</h2>
          <p>Szwecja jest <em>monarchią konstytucyjną</em> i <em>demokracją parlamentarną</em>. Władza działa na trzech poziomach:</p>
          <ul>
            <li><b>Krajowy</b> — Riksdag (parlament), regering (rząd) i król (ceremonialny).</li>
            <li><b>Regionalny</b> — 21 regionów, odpowiedzialnych głównie za opiekę zdrowotną i transport publiczny.</li>
            <li><b>Lokalny</b> — 290 gmin (<em>kommuner</em>), odpowiedzialnych za szkoły, opiekę społeczną, wodę i śmieci.</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 mandatów. Wybierany co cztery lata (wybory powszechne, druga niedziela września). Próg 4% utrzymuje małe partie poza parlamentem. Riksdag stanowi prawo, kontroluje budżet i zatwierdza premiera.</p>
          <h2>Rząd</h2>
          <p>Kierowany przez <em>statsminister</em> (premier). Obejmuje ok. 22 ministrów stojących na czele swoich ministerstw. Nie może samodzielnie uchwalać ustaw — ustawy wymagają Riksdagu.</p>
          <h2>Król</h2>
          <p>Carl XVI Gustaf jest królem od 1973. Jego rola jest całkowicie ceremonialna: otwiera Riksdag, przyjmuje wizyty państwowe, wręcza Nagrody Nobla. Nie może zawetować ustaw ani wybrać premiera.</p>
          <h2>Organy nadzoru</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — Kanclerz Sprawiedliwości, prawnik rządu.</li>
            <li><b>JO</b> (Justitieombudsmannen) — Rzecznik Parlamentarny, kontroluje urzędy publiczne.</li>
            <li><b>Sądy</b> — niezależne, z Sądem Najwyższym (Högsta domstolen) na szczycie.</li>
          </ul>
          <h2>Głosowanie</h2>
          <p>Głosujesz w trzech odrębnych wyborach tego samego dnia: Riksdag, region i kommun. Głosujesz też w wyborach do EU co pięć lat. Obywatele szwedzcy głosują we wszystkich czterech; stali rezydenci głosują w wyborach regionalnych i gminnych po trzech latach.</p>
          ${ebookFactBox('pl', null, 'Liczebność Riksdagu: 349 · Próg: 4% · Częstotliwość wyborów: 4 lata · Liczba regionów: 21 · Liczba gmin: 290.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Saddex heer oo dawladnimo</h2>
          <p>Iswiidhan waa <em>boqortooyo dastuuri ah</em> iyo <em>dimoqraadiyad baarlamaani ah</em>. Awooddu waxay ka shaqaysaa saddex heer:</p>
          <ul>
            <li><b>Heer qaran</b> — Riksdag (baarlamaan), regering (dawlad) iyo boqorka (xafladeed).</li>
            <li><b>Heer gobol</b> — 21 region (gobol), oo inta badan mas'uul ka ah daryeelka caafimaadka iyo gaadiidka dadweynaha.</li>
            <li><b>Heer maxalli ah</b> — 290 degmo (<em>kommuner</em>), oo mas'uul ka ah iskuullada, adeegyada bulshada, biyaha iyo qashinka.</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 kursi. Waxaa la doortaa afartii sanaba mar (doorasho guud, Axadda labaad ee Sebtembar). Xadka 4% wuxuu xisbiyada yaryar dibadda ka ilaaliyaa. Riksdag wuxuu sameeyaa sharciyada, wuxuu kantaroolaa miisaaniyadda, wuxuuna ansixiyaa ra'iisul wasaaraha.</p>
          <h2>Dawladda</h2>
          <p>Waxaa hoggaamiya <em>statsminister</em> (ra'iisul wasaare). Waxay ka kooban tahay qiyaastii 22 wasiir oo madax ka ah wasaaradahooda. Iskeed kuma soo saari karto sharciyo — sharciyadu waxay u baahan yihiin Riksdag.</p>
          <h2>Boqorka</h2>
          <p>Carl XVI Gustaf wuxuu boqor ahaa tan iyo 1973. Doorkiisu gabi ahaanba waa xafladeed: wuxuu furaa Riksdag, wuxuu marti geliyaa booqashooyinka dawladeed, wuxuu guddoonsiiyaa Abaalmarinnada Nobel. Ma diidi karo sharciyo mana dooran karo ra'iisul wasaaraha.</p>
          <h2>Hay'adaha kormeerka</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — Wakiilka Caddaaladda, qareenka dawladda.</li>
            <li><b>JO</b> (Justitieombudsmannen) — Wakiilka Baarlamaanka (Ombudsman), wuxuu hubiyaa hay'adaha dadweynaha.</li>
            <li><b>Maxkamadaha</b> — madax-bannaan, oo Maxkamadda Sare (Högsta domstolen) ay ugu sarrayso.</li>
          </ul>
          <h2>Codbixinta</h2>
          <p>Waxaad ka codaysaa saddex doorasho oo kala duwan maalin isku mid ah: Riksdag, region iyo kommun. Waxaad sidoo kale ka codaysaa doorashooyinka EU shantii sanaba mar. Muwaadiniinta Iswiidhan waxay ka codeeyaan dhammaan afarta; dadka deganaanshaha joogtada ah waxay ka codeeyaan doorashooyinka gobolka iyo degmada saddex sano ka dib.</p>
          ${ebookFactBox('so', null, 'Cabbirka Riksdag: 349 · Xadka: 4% · Muddada doorashada: 4 sano · Tirada region: 21 · Tirada degmooyinka: 290.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ሰለስተ ደረጃታት ምሕደራ</h2>
          <p>ሽወደን <em>ቅዋማዊ ንግስና</em>ን <em>ፓርላሜንታዊ ደሞክራሲ</em>ን እያ። ስልጣን ኣብ ሰለስተ ደረጃ ይሰርሕ፦</p>
          <ul>
            <li><b>ሃገራዊ</b> — Riksdag (ባይቶ)፣ regering (መንግስቲ)ን ንጉስ (ስነ-ስርዓታዊ)ን።</li>
            <li><b>ዞባዊ</b> — 21 region (ዞባ)፣ ብቐንዱ ንክንክን ጥዕናን ህዝባዊ መጓዓዝያን ሓላፍነት ዘለዎም።</li>
            <li><b>ከባብያዊ</b> — 290 kommun (<em>kommuner</em>)፣ ንኣብያተ ትምህርቲ፣ ማሕበራዊ ኣገልግሎት፣ ማይን ጓሓፍን ሓላፍነት ዘለዎም።</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 መናብር። ኣብ ነፍሲ ወከፍ ኣርባዕተ ዓመት ይምረጽ (ሓፈሻዊ ምርጫ፣ ካልኣይ ሰንበት መስከረም)። 4% ደረት ንናኣሽቱ ሰልፍታት ኣብ ደገ የትርፎም። Riksdag ሕግታት የውጽእ፣ ባጀት ይቆጻጸር፣ ቀዳማይ ሚኒስተር ድማ የጽድቕ።</p>
          <h2>መንግስቲ</h2>
          <p>ብ<em>statsminister</em> (ቀዳማይ ሚኒስተር) ይምራሕ። ኣስታት 22 ሚኒስተራት ነናይ ሚኒስትሪታቶም ዝመርሑ የጠቓልል። ባዕሉ ሕግታት ከውጽእ ኣይክእልን — ሕግታት ንRiksdag የድልዮም።</p>
          <h2>ንጉስ</h2>
          <p>Carl XVI Gustaf ካብ 1973 ጀሚሩ ንጉስ እዩ። ተራኡ ምሉእ ብምሉእ ስነ-ስርዓታዊ እዩ፦ ንRiksdag ይኸፍት፣ ንመንግስታዊ ምብጻሓት የአንግድ፣ ሽልማት ኖበል ይዕድል። ሕግታት ክነጽግ ወይ ቀዳማይ ሚኒስተር ክመርጽ ኣይክእልን።</p>
          <h2>ተቆጻጸርቲ ኣካላት</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — ናይ ፍትሒ ቻንስለር፣ ጠበቓ መንግስቲ።</li>
            <li><b>JO</b> (Justitieombudsmannen) — ናይ ባይቶ ኦምቡድስማን፣ ንህዝባዊ ትካላት ይቆጻጸር።</li>
            <li><b>ኣብያተ ፍርዲ</b> — ናጻ፣ ኣብ ላዕሊ ጠቕላይ ቤት ፍርዲ (Högsta domstolen) ዘለዎ።</li>
          </ul>
          <h2>ምድማጽ</h2>
          <p>ኣብ ሓደ መዓልቲ ኣብ ሰለስተ በበይኖም ምርጫታት ትመርጽ፦ Riksdag፣ region ከምኡ’ውን kommun። ከምኡ’ውን ኣብ ነፍሲ ወከፍ ሓሙሽተ ዓመት ኣብ ምርጫታት EU ትመርጽ። ዜጋታት ሽወደን ኣብ ኩሉ ኣርባዕተ ይመርጹ፣ ቀወምቲ ነበርቲ ድሕሪ ሰለስተ ዓመት ኣብ ዞባውን ምምሕዳር ከተማን ምርጫታት ይመርጹ።</p>
          ${ebookFactBox('ti', null, 'ዓቐን Riksdag፦ 349 · ደረት፦ 4% · ግዜ ምርጫ፦ 4 ዓመት · ቍጽሪ region፦ 21 · ቍጽሪ kommun፦ 290።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Üç yönetim düzeyi</h2>
          <p>İsveç bir <em>anayasal monarşi</em> ve <em>parlamenter demokrasi</em>dir. Erk üç düzeyde işler:</p>
          <ul>
            <li><b>Ulusal</b> — Riksdag (parlamento), regering (hükümet) ve kral (törensel).</li>
            <li><b>Bölgesel</b> — başlıca sağlık hizmetleri ve toplu taşımadan sorumlu 21 region (bölge).</li>
            <li><b>Yerel</b> — okullar, sosyal hizmetler, su ve çöpten sorumlu 290 belediye (<em>kommuner</em>).</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 sandalye. Dört yılda bir seçilir (genel seçim, Eylül'ün ikinci Pazarı). %4'lük baraj küçük partileri dışarıda tutar. Riksdag yasa yapar, bütçeyi denetler ve başbakanı onaylar.</p>
          <h2>Hükümet</h2>
          <p><em>statsminister</em> (başbakan) tarafından yönetilir. İlgili bakanlıklara başkanlık eden yaklaşık 22 bakanı içerir. Tek başına yasa çıkaramaz — yasalar Riksdag'ı gerektirir.</p>
          <h2>Kral</h2>
          <p>Carl XVI Gustaf 1973'ten beri kraldır. Rolü tamamen törenseldir: Riksdag'ı açar, devlet ziyaretlerine ev sahipliği yapar, Nobel Ödüllerini takdim eder. Yasaları veto edemez veya başbakanı seçemez.</p>
          <h2>Denetim organları</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — Adalet Şansölyesi, hükümetin avukatı.</li>
            <li><b>JO</b> (Justitieombudsmannen) — Parlamento Ombudsmanı, kamu kurumlarını denetler.</li>
            <li><b>Mahkemeler</b> — bağımsız, en tepede Yüksek Mahkeme (Högsta domstolen) ile.</li>
          </ul>
          <h2>Oy verme</h2>
          <p>Aynı gün üç ayrı seçimde oy verirsiniz: Riksdag, region ve kommun. Ayrıca beş yılda bir EU seçimlerinde oy verirsiniz. İsveç vatandaşları dördünde de oy verir; daimi oturum sahipleri üç yıl sonra bölge ve belediye seçimlerinde oy verir.</p>
          ${ebookFactBox('tr', null, 'Riksdag büyüklüğü: 349 · Baraj: %4 · Seçim aralığı: 4 yıl · region sayısı: 21 · belediye sayısı: 290.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Три рівні влади</h2>
          <p>Швеція є <em>конституційною монархією</em> та <em>парламентською демократією</em>. Влада діє на трьох рівнях:</p>
          <ul>
            <li><b>Загальнодержавний</b> — Riksdag (парламент), regering (уряд) і король (церемоніальний).</li>
            <li><b>Регіональний</b> — 21 region (регіон), що відповідають переважно за охорону здоров'я та громадський транспорт.</li>
            <li><b>Місцевий</b> — 290 муніципалітетів (<em>kommuner</em>), що відповідають за школи, соціальні служби, воду та сміття.</li>
          </ul>
          <h2>Riksdag</h2>
          <p>349 місць. Обирається кожні чотири роки (загальні вибори, друга неділя вересня). Поріг у 4% не пускає до парламенту дрібні партії. Riksdag ухвалює закони, контролює бюджет і затверджує прем'єр-міністра.</p>
          <h2>Уряд</h2>
          <p>Очолюється <em>statsminister</em> (прем'єр-міністр). Включає близько 22 міністрів, що очолюють свої міністерства. Не може ухвалювати закони самостійно — закони потребують Riksdag.</p>
          <h2>Король</h2>
          <p>Carl XVI Gustaf є королем від 1973. Його роль цілком церемоніальна: відкриває Riksdag, приймає державні візити, вручає Нобелівські премії. Не може накладати вето на закони чи обирати прем'єр-міністра.</p>
          <h2>Наглядові органи</h2>
          <ul>
            <li><b>JK</b> (Justitiekanslern) — Канцлер юстиції, юрист уряду.</li>
            <li><b>JO</b> (Justitieombudsmannen) — Парламентський омбудсмен, перевіряє державні органи.</li>
            <li><b>Суди</b> — незалежні, з Верховним судом (Högsta domstolen) на чолі.</li>
          </ul>
          <h2>Голосування</h2>
          <p>Ви голосуєте на трьох окремих виборах одного дня: Riksdag, region і kommun. Також ви голосуєте на виборах до EU кожні п'ять років. Громадяни Швеції голосують на всіх чотирьох; постійні мешканці голосують на регіональних і муніципальних виборах через три роки.</p>
          ${ebookFactBox('uk', null, 'Розмір Riksdag: 349 · Поріг: 4% · Інтервал виборів: 4 роки · Кількість region: 21 · Кількість муніципалітетів: 290.', ['uhrStudyMaterial'])}
        `,
      },
    },

    3: {
      kicker: {
        en: 'Chapter 03 · Rights',
        sv: 'Kapitel 03 · Rättigheter',
        'zh-Hans': '第 03 章 · 权利',
        'zh-Hant': '第 03 章 · 權利',
        ar: 'الفصل 03 · الحقوق',
        ckb: 'بەشی 03 · مافەکان',
        fa: 'فصل 03 · حقوق',
        pl: 'Rozdział 03 · Prawa',
        so: 'Cutubka 03 · Xuquuq',
        ti: 'ምዕራፍ 03 · መሰላት',
        tr: 'Bölüm 03 · Haklar',
        uk: 'Розділ 03 · Права',
      },
      title: {
        en: 'Four basic laws,',
        sv: 'Fyra grundlagar,',
        'zh-Hans': '四部基本法，',
        'zh-Hant': '四部基本法，',
        ar: 'أربعة قوانين أساسية،',
        ckb: 'چوار یاسای بنەڕەتی،',
        fa: 'چهار قانون اساسی،',
        pl: 'Cztery ustawy zasadnicze,',
        so: 'Afar sharci oo aasaasi ah,',
        ti: 'ኣርባዕተ መሰረታውያን ሕግታት፣',
        tr: 'Dört temel yasa,',
        uk: 'Чотири основні закони,',
      },
      title_em: {
        en: 'one long list of rights.',
        sv: 'en lång lista av rättigheter.',
        'zh-Hans': '一长串权利。',
        'zh-Hant': '一長串權利。',
        ar: 'وقائمة طويلة من الحقوق.',
        ckb: 'یەک لیستی درێژی مافەکان.',
        fa: 'یک فهرست بلند از حقوق.',
        pl: 'jedna długa lista praw.',
        so: 'hal liis dheer oo xuquuq ah.',
        ti: 'ሓደ ነዊሕ ዝርዝር መሰላት።',
        tr: 'uzun bir haklar listesi.',
        uk: 'один довгий перелік прав.',
      },
      lede: {
        en: "Sweden's constitution is split across four laws. The Press Act is the oldest in the world. The rest is almost as interesting.",
        sv: 'Sveriges författning står i fyra grundlagar. Tryckfrihetsförordningen är världens äldsta. Resten är nästan lika kul.',
        'zh-Hans':
          '瑞典的宪法分散在四部法律之中。其中的《出版自由法》是全世界最古老的。其余几部也几乎同样有意思。',
        'zh-Hant':
          '瑞典的憲法分散在四部法律之中。其中的《出版自由法》是全世界最古老的。其餘幾部也幾乎同樣有意思。',
        ar: 'دستور السويد موزّع على أربعة قوانين. وقانون حرية الصحافة هو الأقدم في العالم. والباقي مثيرٌ للاهتمام تقريبًا بالقدر نفسه.',
        ckb: 'دەستووری سوید بەسەر چوار یاسادا دابەش کراوە. یاسای ئازادیی چاپەمەنی کۆنترینە لە جیهاندا. ئەوانی تریش تەقریبەن بە هەمان ڕادە سەرنجڕاکێشن.',
        fa: 'قانون اساسی سوئد میان چهار قانون تقسیم شده است. قانون آزادی مطبوعات کهن‌ترین در جهان است. بقیه نیز تقریباً به همان اندازه جالب‌اند.',
        pl: 'Konstytucja Szwecji jest rozdzielona na cztery ustawy. Ustawa o wolności druku jest najstarsza na świecie. Reszta jest niemal równie ciekawa.',
        so: "Dastuurka Iswiidhan waxaa loo qaybiyaa afar sharci. Sharciga Xorriyadda Saxaafadda waa kan ugu da'da weyn adduunka. Inta kale ku dhowaad sidoo kale way xiiso badan tahay.",
        ti: 'ቅዋም ሽወደን ኣብ ኣርባዕተ ሕግታት ተኸፋፊሉ ኣሎ። ሕጊ ናጽነት ፕረስ ኣብ ዓለም እቲ ዝነበረ እዩ። እቲ ዝተረፈ ድማ ከባቢ ከምኡ ዝስሕብ እዩ።',
        tr: "İsveç'in anayasası dört yasaya bölünmüştür. Basın Özgürlüğü Yasası dünyanın en eskisidir. Gerisi neredeyse onun kadar ilginçtir.",
        uk: 'Конституція Швеції поділена на чотири закони. Акт про свободу преси — найдавніший у світі. Решта майже така ж цікава.',
      },
      body: {
        en: `
          <h2>The four basic laws (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — Instrument of Government. The big one. Defines the structure of the state and the rights of citizens.</li>
            <li><b>Successionsordningen</b> — Act of Succession. Who inherits the throne. (Since 1980, the oldest child, regardless of gender.)</li>
            <li><b>Tryckfrihetsförordningen</b> — Freedom of the Press Act. Sweden's, and the world's, oldest. Originally enacted in 1766.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — Fundamental Law on Freedom of Expression. Extends press freedom to radio, TV, film, and the internet.</li>
          </ol>
          <h2>Core rights</h2>
          <ul>
            <li>Freedom of expression, assembly, demonstration, and association.</li>
            <li>Freedom of religion (and freedom from it).</li>
            <li>Protection against discrimination on grounds of sex, gender identity, ethnicity, religion, disability, sexual orientation, and age.</li>
            <li>Protection of personal integrity (the right to privacy).</li>
            <li>The right to access public documents — the <em>principle of public access</em> is unusually strong in Sweden.</li>
          </ul>
          <h2>The principle of public access (offentlighetsprincipen)</h2>
          <p>Almost any document held by a public authority is, by default, public. Anyone can ask to see it, including journalists, foreign citizens, and your nosy neighbour. Exceptions exist (national security, personal data), but the default is openness — globally rare.</p>
          <h2>What it means in daily life</h2>
          <p>Your employer can't ask about your religion. Your landlord can't refuse you for your ethnicity. You can criticise the government on television, in writing, online — even meanly — without legal consequence. (Defamation, threats, and incitement remain crimes.)</p>
          ${ebookFactBox('en', 'Facts to review', 'Number of basic laws: 4 · Oldest: Tryckfrihetsförordningen (1766) · Inheritance rule: oldest child regardless of gender (since 1980).', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Sverige har fyra grundlagar: regeringsformen, successionsordningen, tryckfrihetsförordningen och yttrandefrihetsgrundlagen.',
            'Grundlagarna skyddar bland annat yttrandefrihet, religionsfrihet, föreningsfrihet och rätten att demonstrera.',
            'Offentlighetsprincipen betyder att många handlingar hos myndigheter är offentliga, om de inte omfattas av sekretess.',
            'Rättigheter hör ihop med ansvar: hot, hets mot folkgrupp, förtal och diskriminering kan fortfarande vara förbjudet.',
          ],
          'Grundlagar: 4 · Tryckfrihetsförordningen: 1766 · Offentlighetsprincipen: insyn i myndigheter.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>四部基本法（grundlagarna）</h2>
          <ol>
            <li><b>Regeringsformen</b>——《政府组织法》。最重要的一部。它规定了国家的结构和公民的权利。</li>
            <li><b>Successionsordningen</b>——《王位继承法》。规定由谁继承王位。（自 1980 年起，由最年长的子女继承，不论性别。）</li>
            <li><b>Tryckfrihetsförordningen</b>——《出版自由法》。瑞典的，也是全世界最古老的一部，最初于 1766 年颁布。</li>
            <li><b>Yttrandefrihetsgrundlagen</b>——《言论自由基本法》。把出版自由扩展到广播、电视、电影和互联网。</li>
          </ol>
          <h2>核心权利</h2>
          <ul>
            <li>言论、集会、示威和结社的自由。</li>
            <li>宗教自由（以及不信教的自由）。</li>
            <li>不因性别、性别认同、族裔、宗教、残障、性取向和年龄而受到歧视的保护。</li>
            <li>对个人完整性的保护（即隐私权）。</li>
            <li>查阅公共文件的权利——<em>公开原则</em> 在瑞典异常强大。</li>
          </ul>
          <h2>公开原则（offentlighetsprincipen）</h2>
          <p>几乎任何由政府机关持有的文件，默认都是公开的。任何人都可以要求查阅，包括记者、外国公民，乃至你那位爱打听的邻居。例外当然存在（国家安全、个人数据），但默认是公开——这在全球范围内都很罕见。</p>
          <h2>它在日常生活中意味着什么</h2>
          <p>你的雇主不能询问你的宗教信仰。你的房东不能因为你的族裔而拒绝你。你可以在电视上、在文字里、在网络上批评政府——哪怕言辞刻薄——也不会承担法律后果。（诽谤、威胁和煽动仍然属于犯罪。）</p>
          ${ebookFactBox('zh-Hans', null, '基本法数量：4 · 最古老的：Tryckfrihetsförordningen（1766） · 继承规则：由最年长的子女继承，不论性别（自 1980 年起）。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>四部基本法（grundlagarna）</h2>
          <ol>
            <li><b>Regeringsformen</b>——《政府組織法》。最重要的一部。它規定了國家的結構和公民的權利。</li>
            <li><b>Successionsordningen</b>——《王位繼承法》。規定由誰繼承王位。（自 1980 年起，由最年長的子女繼承，不論性別。）</li>
            <li><b>Tryckfrihetsförordningen</b>——《出版自由法》。瑞典的，也是全世界最古老的一部，最初於 1766 年頒布。</li>
            <li><b>Yttrandefrihetsgrundlagen</b>——《言論自由基本法》。把出版自由擴展到廣播、電視、電影和網際網路。</li>
          </ol>
          <h2>核心權利</h2>
          <ul>
            <li>言論、集會、示威和結社的自由。</li>
            <li>宗教自由（以及不信教的自由）。</li>
            <li>不因性別、性別認同、族裔、宗教、殘障、性取向和年齡而受到歧視的保護。</li>
            <li>對個人完整性的保護（即隱私權）。</li>
            <li>查閱公共文件的權利——<em>公開原則</em> 在瑞典異常強大。</li>
          </ul>
          <h2>公開原則（offentlighetsprincipen）</h2>
          <p>幾乎任何由政府機關持有的文件，預設都是公開的。任何人都可以要求查閱，包括記者、外國公民，乃至你那位愛打聽的鄰居。例外當然存在（國家安全、個人資料），但預設是公開——這在全球範圍內都很罕見。</p>
          <h2>它在日常生活中意味著什麼</h2>
          <p>你的僱主不能詢問你的宗教信仰。你的房東不能因為你的族裔而拒絕你。你可以在電視上、在文字裡、在網路上批評政府——哪怕言辭刻薄——也不會承擔法律後果。（誹謗、威脅和煽動仍然屬於犯罪。）</p>
          ${ebookFactBox('zh-Hant', null, '基本法數量：4 · 最古老的：Tryckfrihetsförordningen（1766） · 繼承規則：由最年長的子女繼承，不論性別（自 1980 年起）。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>القوانين الأساسية الأربعة (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — صك الحكم. القانون الأكبر. يحدّد بنية الدولة وحقوق المواطنين.</li>
            <li><b>Successionsordningen</b> — قانون وراثة العرش. من يرث العرش. (منذ 1980، الابن الأكبر بصرف النظر عن الجنس.)</li>
            <li><b>Tryckfrihetsförordningen</b> — قانون حرية الصحافة. الأقدم في السويد، وفي العالم. سُنّ أصلًا عام 1766.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — القانون الأساسي لحرية التعبير. يوسّع حرية الصحافة لتشمل الراديو والتلفزيون والسينما والإنترنت.</li>
          </ol>
          <h2>الحقوق الأساسية</h2>
          <ul>
            <li>حرية التعبير والتجمّع والتظاهر وتكوين الجمعيات.</li>
            <li>حرية الدين (والتحرّر منه).</li>
            <li>الحماية من التمييز على أساس الجنس والهوية الجندرية والأصل العرقي والدين والإعاقة والميل الجنسي والعمر.</li>
            <li>حماية السلامة الشخصية (الحق في الخصوصية).</li>
            <li>الحق في الاطلاع على الوثائق العامة — <em>مبدأ العلانية</em> قوي على نحوٍ غير معتاد في السويد.</li>
          </ul>
          <h2>مبدأ العلانية (offentlighetsprincipen)</h2>
          <p>أيُّ وثيقة تقريبًا بحوزة هيئة عامة تكون، بشكل افتراضي، علنية. يمكن لأيِّ شخص أن يطلب الاطلاع عليها، بمن في ذلك الصحفيون والمواطنون الأجانب وجارك الفضولي. هناك استثناءات (الأمن القومي والبيانات الشخصية)، لكن الأصل هو الانفتاح — وهو أمرٌ نادر عالميًا.</p>
          <h2>ماذا يعني ذلك في الحياة اليومية</h2>
          <p>لا يستطيع ربّ عملك أن يسألك عن دينك. ولا يستطيع مالك مسكنك أن يرفضك بسبب أصلك العرقي. ويمكنك انتقاد الحكومة على التلفزيون، وكتابةً، وعلى الإنترنت — حتى بقسوة — دون عواقب قانونية. (يبقى التشهير والتهديد والتحريض جرائم.)</p>
          ${ebookFactBox('ar', null, 'عدد القوانين الأساسية: 4 · الأقدم: Tryckfrihetsförordningen (1766) · قاعدة الوراثة: الابن الأكبر بصرف النظر عن الجنس (منذ 1980).', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>چوار یاسا بنەڕەتییەکە (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — بەڵگەنامەی فەرمانڕەوایی. یاسا گەورەکە. پێکهاتەی دەوڵەت و مافەکانی هاووڵاتیان دیاری دەکات.</li>
            <li><b>Successionsordningen</b> — یاسای میراتگرتنی تەخت. ئەوەی کێ تەخت بە میرات دەبات. (لە ساڵی 1980ەوە، گەورەترین منداڵ، بەبێ ڕەچاوکردنی ڕەگەز.)</li>
            <li><b>Tryckfrihetsförordningen</b> — یاسای ئازادیی چاپەمەنی. کۆنترینی سوید و جیهان. لە بنەڕەتدا لە ساڵی 1766 دانرا.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — یاسای بنەڕەتیی ئازادیی دەربڕین. ئازادیی چاپەمەنی بۆ ڕادیۆ، تەلەفزیۆن، فیلم و ئینتەرنێت بەرفراوان دەکات.</li>
          </ol>
          <h2>مافە بنەڕەتییەکان</h2>
          <ul>
            <li>ئازادیی دەربڕین، کۆبوونەوە، خۆپیشاندان و ڕێکخستن.</li>
            <li>ئازادیی ئاین (و ئازادی لێی).</li>
            <li>پاراستن لە جیاکاری لەسەر بنەمای ڕەگەز، ناسنامەی ڕەگەزی، نەتەوایەتی، ئاین، کەمئەندامی، ئاراستەی سێکسی و تەمەن.</li>
            <li>پاراستنی پاکیی کەسی (مافی تایبەتمەندی).</li>
            <li>مافی دەستگەیشتن بە بەڵگەنامە گشتییەکان — <em>بنەمای ئاشکرابوون</em> لە سویددا بە شێوەیەکی نائاسایی بەهێزە.</li>
          </ul>
          <h2>بنەمای ئاشکرابوون (offentlighetsprincipen)</h2>
          <p>تەقریبەن هەر بەڵگەنامەیەک کە لەلای دەسەڵاتێکی گشتی بێت، بە شێوەی بنەڕەتی گشتییە. هەر کەسێک دەتوانێت داوای بینینی بکات، لەوانە ڕۆژنامەنووسان، هاووڵاتیانی بیانی و دراوسێ سەرکوتڵەکەت. لێبووردن هەن (ئاسایشی نیشتمانی، داتای کەسی)، بەڵام بنەڕەتەکە کرانەوەیە — کە لە ئاستی جیهانیدا دەگمەنە.</p>
          <h2>لە ژیانی ڕۆژانەدا چی دەگەیەنێت</h2>
          <p>کارفەرماکەت ناتوانێت پرسیار لە ئاینەکەت بکات. خاوەن‌ماڵەکەت ناتوانێت لەبەر نەتەوایەتییەکەت ڕەتت بکاتەوە. دەتوانیت لە تەلەفزیۆن، بە نووسین و لە ئۆنلاین ڕەخنە لە حکومەت بگریت — تەنانەت بە توندیش — بەبێ ئەنجامی یاسایی. (بوختان، هەڕەشە و هاندان هێشتا تاوانن.)</p>
          ${ebookFactBox('ckb', null, 'ژمارەی یاسا بنەڕەتییەکان: 4 · کۆنترین: Tryckfrihetsförordningen (1766) · ڕێسای میراتگرتن: گەورەترین منداڵ بەبێ ڕەچاوکردنی ڕەگەز (لە 1980ەوە).', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>چهار قانون اساسی (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — سند حکومت. قانون بزرگ. ساختار دولت و حقوق شهروندان را تعریف می‌کند.</li>
            <li><b>Successionsordningen</b> — قانون جانشینی. اینکه چه کسی تخت را به ارث می‌برد. (از سال 1980، فرزند بزرگ‌تر، صرف‌نظر از جنسیت.)</li>
            <li><b>Tryckfrihetsförordningen</b> — قانون آزادی مطبوعات. کهن‌ترین قانون سوئد و جهان. در اصل در سال 1766 تصویب شد.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — قانون اساسی آزادی بیان. آزادی مطبوعات را به رادیو، تلویزیون، فیلم و اینترنت گسترش می‌دهد.</li>
          </ol>
          <h2>حقوق بنیادین</h2>
          <ul>
            <li>آزادی بیان، اجتماع، تظاهرات و تشکیل انجمن.</li>
            <li>آزادی دین (و آزادی از آن).</li>
            <li>حمایت در برابر تبعیض بر پایهٔ جنس، هویت جنسیتی، قومیت، دین، معلولیت، گرایش جنسی و سن.</li>
            <li>حمایت از تمامیت شخصی (حق حریم خصوصی).</li>
            <li>حق دسترسی به اسناد عمومی — <em>اصل دسترسی همگانی</em> در سوئد به‌طور غیرمعمولی قوی است.</li>
          </ul>
          <h2>اصل دسترسی همگانی (offentlighetsprincipen)</h2>
          <p>تقریباً هر سندی که در اختیار یک نهاد عمومی باشد، به‌طور پیش‌فرض عمومی است. هر کسی می‌تواند درخواست دیدن آن را بدهد، از جمله روزنامه‌نگاران، شهروندان خارجی و همسایهٔ فضول شما. استثناهایی وجود دارد (امنیت ملی، داده‌های شخصی)، اما پیش‌فرض، گشودگی است — چیزی که در سطح جهانی نادر است.</p>
          <h2>این در زندگی روزمره چه معنایی دارد</h2>
          <p>کارفرمای شما نمی‌تواند دربارهٔ دین شما بپرسد. صاحب‌خانهٔ شما نمی‌تواند به‌خاطر قومیت شما را رد کند. می‌توانید دولت را در تلویزیون، به‌صورت نوشتاری و آنلاین نقد کنید — حتی تند — بدون پیامد قانونی. (هتک حرمت، تهدید و تحریک همچنان جرم‌اند.)</p>
          ${ebookFactBox('fa', null, 'تعداد قوانین اساسی: 4 · کهن‌ترین: Tryckfrihetsförordningen (1766) · قاعدهٔ وراثت: فرزند بزرگ‌تر صرف‌نظر از جنسیت (از 1980).', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Cztery ustawy zasadnicze (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — Akt o formie rządu. Ten najważniejszy. Określa strukturę państwa i prawa obywateli.</li>
            <li><b>Successionsordningen</b> — Akt o sukcesji. Kto dziedziczy tron. (Od 1980 — najstarsze dziecko, niezależnie od płci.)</li>
            <li><b>Tryckfrihetsförordningen</b> — Akt o wolności druku. Najstarszy w Szwecji i na świecie. Pierwotnie uchwalony w 1766.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — Ustawa zasadnicza o wolności wypowiedzi. Rozszerza wolność druku na radio, telewizję, film i internet.</li>
          </ol>
          <h2>Prawa podstawowe</h2>
          <ul>
            <li>Wolność wypowiedzi, zgromadzeń, demonstracji i zrzeszania się.</li>
            <li>Wolność religii (i wolność od niej).</li>
            <li>Ochrona przed dyskryminacją ze względu na płeć, tożsamość płciową, pochodzenie etniczne, religię, niepełnosprawność, orientację seksualną i wiek.</li>
            <li>Ochrona integralności osobistej (prawo do prywatności).</li>
            <li>Prawo dostępu do dokumentów publicznych — <em>zasada jawności</em> jest w Szwecji wyjątkowo silna.</li>
          </ul>
          <h2>Zasada jawności (offentlighetsprincipen)</h2>
          <p>Niemal każdy dokument w posiadaniu urzędu publicznego jest domyślnie jawny. Każdy może poprosić o jego wgląd, w tym dziennikarze, cudzoziemcy i twój wścibski sąsiad. Istnieją wyjątki (bezpieczeństwo narodowe, dane osobowe), ale domyślna jest otwartość — rzadkość w skali świata.</p>
          <h2>Co to oznacza w codziennym życiu</h2>
          <p>Twój pracodawca nie może pytać o twoją religię. Twój wynajmujący nie może odmówić ci ze względu na pochodzenie etniczne. Możesz krytykować rząd w telewizji, na piśmie, w internecie — nawet złośliwie — bez konsekwencji prawnych. (Zniesławienie, groźby i podżeganie pozostają przestępstwami.)</p>
          ${ebookFactBox('pl', null, 'Liczba ustaw zasadniczych: 4 · Najstarsza: Tryckfrihetsförordningen (1766) · Zasada dziedziczenia: najstarsze dziecko niezależnie od płci (od 1980).', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Afarta sharci ee aasaasiga ah (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — Qoraalka Dawladnimada. Kan weyn. Wuxuu qeexaa qaab-dhismeedka dawladda iyo xuquuqda muwaadiniinta.</li>
            <li><b>Successionsordningen</b> — Sharciga Dhaxalka. Cidda dhaxasha carshiga. (Tan iyo 1980, ilmaha ugu weyn, iyadoon jinsi loo eegin.)</li>
            <li><b>Tryckfrihetsförordningen</b> — Sharciga Xorriyadda Saxaafadda. Kan Iswiidhan, iyo adduunka, ugu da'da weyn. Markii hore waxaa la dejiyay 1766.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — Sharciga Aasaasiga ah ee Xorriyadda Hadalka. Wuxuu xorriyadda saxaafadda u fidiyaa raadiyaha, TV-ga, filimka iyo internetka.</li>
          </ol>
          <h2>Xuquuqaha aasaasiga ah</h2>
          <ul>
            <li>Xorriyadda hadalka, isu-imaatinka, banaanbaxa iyo ururinta.</li>
            <li>Xorriyadda diinta (iyo xorriyadda ka madax-bannaanaanshaha diinta).</li>
            <li>Ka ilaalinta takoorida ku salaysan jinsiga, aqoonsiga jinsiga, qowmiyadda, diinta, naafanimada, jihada galmada iyo da'da.</li>
            <li>Ilaalinta madax-bannaanida shakhsiyeed (xaqa asturnaanta).</li>
            <li>Xaqa helitaanka dukumentiyada dadweynaha — <em>mabda'a furfurnaanta</em> ayaa Iswiidhan si aan caadi ahayn ugu xoog badan.</li>
          </ul>
          <h2>Mabda'a furfurnaanta (offentlighetsprincipen)</h2>
          <p>Ku dhowaad dukumenti kasta oo ay haysato hay'ad dawladeed, sida caadiga ah, waa mid dadweyne. Qof kastaa wuxuu codsan karaa inuu arko, oo ay ku jiraan saxafiyiinta, muwaadiniinta shisheeye, iyo deriskaaga xog-doonka ah. Waxaa jira ka reebban (amniga qaranka, xogta shakhsiga ah), laakiin sida caadiga ah waa furfurnaan — adduun ahaan dhif.</p>
          <h2>Maxay ka dhigan tahay nolosha maalinlaha ah</h2>
          <p>Loo-shaqeeyahaagu kaama weydiin karo diintaada. Mulkiilaha gurigu kuuma diidi karo qowmiyadaada awgeed. Waxaad dhaleecayn kartaa dawladda telefishinka, qoraal ahaan, internetka — xataa si xun — adigoon cawaaqib sharci ah la kulmin. (Sumcad-dilka, hanjabaadda iyo kicinta way sii ahaanayaan dembiyo.)</p>
          ${ebookFactBox('so', null, "Tirada sharciyada aasaasiga ah: 4 · Kan ugu da'da weyn: Tryckfrihetsförordningen (1766) · Xeerka dhaxalka: ilmaha ugu weyn iyadoon jinsi loo eegin (tan iyo 1980).", ['uhrStudyMaterial'])}
        `,
        ti: `<h2>እተን ኣርባዕተ መሰረታውያን ሕግታት (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — ሰነድ ምሕደራ መንግስቲ። እቲ ዓብዪ። ቅርጻ መንግስትን መሰላት ዜጋታትን ይገልጽ።</li>
            <li><b>Successionsordningen</b> — ሕጊ ውርሻ ዝፋን። ንዝፋን መን ከም ዝወርሶ። (ካብ 1980 ጀሚሩ፣ ብዘይ ኣፈላላይ ጾታ እቲ ዓብዪ ውሉድ።)</li>
            <li><b>Tryckfrihetsförordningen</b> — ሕጊ ናጽነት ፕረስ። ናይ ሽወደንን ናይ ዓለምን ዝነበረ። መጀመርታ ኣብ 1766 ጸዲቑ።</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — መሰረታዊ ሕጊ ናጽነት ሓሳብ ምግላጽ። ንናጽነት ፕረስ ናብ ራድዮ፣ ተለቪዥን፣ ፊልምን ኢንተርነትን የስፍሖ።</li>
          </ol>
          <h2>ቀንዲ መሰላት</h2>
          <ul>
            <li>ናጽነት ሓሳብ ምግላጽ፣ ምትእኽኻብ፣ ሰላማዊ ሰልፍን ምትሕብባርን።</li>
            <li>ናጽነት ሃይማኖት (ከምኡ’ውን ካብኡ ናጻ ናይ ምዃን ናጽነት)።</li>
            <li>ኣብ ጾታ፣ ጾታዊ መንነት፣ ዓሌት፣ ሃይማኖት፣ ስንክልና፣ ጾታዊ ዝንባለን ዕድመን ተመርኲሱ ኣንጻር ኣድልዎ ምክልኻል።</li>
            <li>ምክልኻል ውልቃዊ ሓድነት (መሰል ብሕትውና)።</li>
            <li>ናብ ህዝባዊ ሰነዳት ናይ ምብጻሕ መሰል — እቲ <em>መትከል ግሉጽነት</em> ኣብ ሽወደን ብዘይልሙድ ጽኑዕ እዩ።</li>
          </ul>
          <h2>መትከል ግሉጽነት (offentlighetsprincipen)</h2>
          <p>ብህዝባዊ ትካል ዝተታሕዘ ዳርጋ ዝኾነ ይኹን ሰነድ፣ ብነባሪ ኣገባብ ህዝባዊ እዩ። ዝኾነ ሰብ ክርእዮ ክሓትት ይኽእል፣ ጋዜጠኛታት፣ ወጻእተኛታት ዜጋታትን እቲ ህንጡይ ጎረቤትካን ሓዊስካ። ምልክታት ኣለዉ (ሃገራዊ ጸጥታ፣ ውልቃዊ ሓበሬታ)፣ እቲ ነባሪ ግን ግሉጽነት እዩ — ኣብ ዓለም ሳሕቲ።</p>
          <h2>ኣብ ዕለታዊ ህይወት እንታይ ማለት እዩ</h2>
          <p>ወሃብ ስራሕካ ብዛዕባ ሃይማኖትካ ክሓተካ ኣይክእልን። ኣካራዪ ገዛኻ ብሰንኪ ዓሌትካ ክነጽገካ ኣይክእልን። ንመንግስቲ ኣብ ተለቪዥን፣ ብጽሑፍ፣ ኣብ ኢንተርነት — ዋላ ብኸፊእ — ብዘይ ሕጋዊ መዘዝ ክትነቅፍ ትኽእል። (ጸለመ፣ ምፍርራህን ምልዕዓልን ገበናት ኮይኖም ይቕጽሉ።)</p>
          ${ebookFactBox('ti', null, 'ቍጽሪ መሰረታውያን ሕግታት፦ 4 · እቲ ዝነበረ፦ Tryckfrihetsförordningen (1766) · ሕጊ ውርሻ፦ ብዘይ ኣፈላላይ ጾታ እቲ ዓብዪ ውሉድ (ካብ 1980)።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Dört temel yasa (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — Yönetim Belgesi. En önemlisi. Devletin yapısını ve yurttaşların haklarını tanımlar.</li>
            <li><b>Successionsordningen</b> — Veraset Yasası. Tahtı kimin devralacağı. (1980'den beri, cinsiyetten bağımsız olarak en büyük çocuk.)</li>
            <li><b>Tryckfrihetsförordningen</b> — Basın Özgürlüğü Yasası. İsveç'in ve dünyanın en eskisi. İlk olarak 1766'da yürürlüğe girdi.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — İfade Özgürlüğü Temel Yasası. Basın özgürlüğünü radyo, TV, film ve internete genişletir.</li>
          </ol>
          <h2>Temel haklar</h2>
          <ul>
            <li>İfade, toplanma, gösteri ve örgütlenme özgürlüğü.</li>
            <li>Din özgürlüğü (ve dinden bağımsız olma özgürlüğü).</li>
            <li>Cinsiyet, cinsiyet kimliği, etnik köken, din, engellilik, cinsel yönelim ve yaş temelinde ayrımcılığa karşı korunma.</li>
            <li>Kişisel bütünlüğün korunması (mahremiyet hakkı).</li>
            <li>Kamu belgelerine erişim hakkı — <em>aleniyet ilkesi</em> İsveç'te alışılmadık ölçüde güçlüdür.</li>
          </ul>
          <h2>Aleniyet ilkesi (offentlighetsprincipen)</h2>
          <p>Bir kamu kurumunun elindeki hemen her belge, varsayılan olarak aleni (kamuya açık)dır. Gazeteciler, yabancı yurttaşlar ve meraklı komşunuz dahil herkes onu görmek isteyebilir. İstisnalar vardır (ulusal güvenlik, kişisel veriler), ancak varsayılan açıklıktır — küresel olarak nadirdir.</p>
          <h2>Günlük hayatta ne anlama gelir</h2>
          <p>İşvereniniz dininizi soramaz. Ev sahibiniz etnik kökeniniz nedeniyle sizi reddedemez. Hükümeti televizyonda, yazılı olarak, çevrimiçi — hatta kırıcı biçimde — yasal sonuç olmadan eleştirebilirsiniz. (Hakaret, tehdit ve kışkırtma suç olmayı sürdürür.)</p>
          ${ebookFactBox('tr', null, "Temel yasa sayısı: 4 · En eskisi: Tryckfrihetsförordningen (1766) · Veraset kuralı: cinsiyetten bağımsız en büyük çocuk (1980'den beri).", ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Чотири основні закони (grundlagarna)</h2>
          <ol>
            <li><b>Regeringsformen</b> — Акт про форму правління. Найголовніший. Визначає структуру держави та права громадян.</li>
            <li><b>Successionsordningen</b> — Акт про престолонаступництво. Хто успадковує трон. (Від 1980 — найстарша дитина, незалежно від статі.)</li>
            <li><b>Tryckfrihetsförordningen</b> — Акт про свободу преси. Найдавніший у Швеції та у світі. Первісно ухвалений у 1766.</li>
            <li><b>Yttrandefrihetsgrundlagen</b> — Основний закон про свободу вираження поглядів. Поширює свободу преси на радіо, ТБ, кіно та інтернет.</li>
          </ol>
          <h2>Основні права</h2>
          <ul>
            <li>Свобода вираження поглядів, зібрань, демонстрацій та об'єднань.</li>
            <li>Свобода віросповідання (і свобода від нього).</li>
            <li>Захист від дискримінації за ознаками статі, гендерної ідентичності, етнічного походження, релігії, інвалідності, сексуальної орієнтації та віку.</li>
            <li>Захист особистої недоторканності (право на приватність).</li>
            <li>Право доступу до публічних документів — <em>принцип публічності</em> у Швеції надзвичайно сильний.</li>
          </ul>
          <h2>Принцип публічності (offentlighetsprincipen)</h2>
          <p>Майже будь-який документ, що зберігається в державному органі, за замовчуванням є публічним. Будь-хто може попросити його переглянути, зокрема журналісти, іноземні громадяни та ваш допитливий сусід. Винятки існують (національна безпека, персональні дані), але за замовчуванням панує відкритість — рідкісна у світі.</p>
          <h2>Що це означає в повсякденному житті</h2>
          <p>Ваш роботодавець не може питати про вашу релігію. Ваш орендодавець не може відмовити вам через ваше етнічне походження. Ви можете критикувати уряд по телебаченню, письмово, онлайн — навіть ущипливо — без правових наслідків. (Наклеп, погрози та підбурювання залишаються злочинами.)</p>
          ${ebookFactBox('uk', null, 'Кількість основних законів: 4 · Найдавніший: Tryckfrihetsförordningen (1766) · Правило успадкування: найстарша дитина незалежно від статі (від 1980).', ['uhrStudyMaterial'])}
        `,
      },
    },

    4: {
      kicker: {
        en: 'Chapter 04 · Work & taxes',
        sv: 'Kapitel 04 · Arbete & skatt',
        'zh-Hans': '第 04 章 · 工作与税收',
        'zh-Hant': '第 04 章 · 工作與稅收',
        ar: 'الفصل 04 · العمل والضرائب',
        ckb: 'بەشی 04 · کار و باج',
        fa: 'فصل 04 · کار و مالیات',
        pl: 'Rozdział 04 · Praca i podatki',
        so: 'Cutubka 04 · Shaqo & canshuuro',
        ti: 'ምዕራፍ 04 · ስራሕን ቀረጽን',
        tr: 'Bölüm 04 · İş ve vergiler',
        uk: 'Розділ 04 · Праця та податки',
      },
      title: {
        en: 'Work,',
        sv: 'Arbete,',
        'zh-Hans': '工作、',
        'zh-Hant': '工作、',
        ar: 'العمل،',
        ckb: 'کار،',
        fa: 'کار،',
        pl: 'Praca,',
        so: 'Shaqo,',
        ti: 'ስራሕ፣',
        tr: 'İş,',
        uk: 'Праця,',
      },
      title_em: {
        en: 'taxes, and the welfare state.',
        sv: 'skatt och välfärdsstaten.',
        'zh-Hans': '税收，以及福利国家。',
        'zh-Hant': '稅收，以及福利國家。',
        ar: 'والضرائب، ودولة الرفاه.',
        ckb: 'باج و دەوڵەتی خۆشگوزەرانی.',
        fa: 'مالیات و دولت رفاه.',
        pl: 'podatki i państwo opiekuńcze.',
        so: 'canshuuro, iyo dawladda daryeelka.',
        ti: 'ቀረጽን መንግስቲ ድሕነትን።',
        tr: 'vergiler ve refah devleti.',
        uk: 'податки та держава загального добробуту.',
      },
      lede: {
        en: "Sweden takes a lot of your salary and gives most of it back. The trick is knowing what it's paying for.",
        sv: 'Sverige tar mycket av din lön och ger tillbaka det mesta. Knepet är att veta vad det går till.',
        'zh-Hans':
          '瑞典从你的薪水里拿走很多，又把其中大部分还给你。诀窍在于弄清楚这些钱到底买了什么。',
        'zh-Hant':
          '瑞典從你的薪水裡拿走很多，又把其中大部分還給你。訣竅在於弄清楚這些錢到底買了什麼。',
        ar: 'تأخذ السويد جزءًا كبيرًا من راتبك وتعيد معظمه. والحيلة هي أن تعرف ما الذي يُدفَع مقابله.',
        ckb: 'سوید بەشێکی زۆر لە موچەکەت دەبات و زۆربەی دەگەڕێنێتەوە. فێڵەکە ئەوەیە بزانیت لە بەرامبەر چیدا دەدرێت.',
        fa: 'سوئد بخش زیادی از حقوق شما را می‌گیرد و بیشتر آن را بازمی‌گرداند. ترفند کار این است که بدانید بابت چه چیزی پرداخت می‌شود.',
        pl: 'Szwecja zabiera dużą część twojej pensji i większość oddaje. Sztuką jest wiedzieć, za co płaci.',
        so: 'Iswiidhan waxay qaadataa qayb badan oo mushaharkaaga ah inteeda badanna way ku celisaa. Farsamadu waa inaad ogaato waxa ay bixinaysaa.',
        ti: 'ሽወደን ካብ ደሞዝካ ብዙሕ ትወስድ መብዛሕትኡ ድማ ትመልሶ። እቲ ብልሓት እንታይ ይኽፈለሉ ከም ዘሎ ምፍላጥ እዩ።',
        tr: 'İsveç maaşınızın büyük bölümünü alır ve çoğunu geri verir. İşin püf noktası, neyin karşılığını ödediğinizi bilmektir.',
        uk: 'Швеція забирає значну частину вашої зарплати й більшість повертає. Хитрість у тому, щоб знати, за що вона платить.',
      },
      body: {
        en: `
          <h2>The labour market</h2>
          <p>Salaries and conditions in Sweden are mostly set by <em>collective agreements</em> (kollektivavtal) — negotiated between unions and employer organisations. There is no legal minimum wage, but the agreed minimum in any given sector is usually well above the cost of living.</p>
          <p>Membership in a union is voluntary. About 65% of workers belong to one. Joining usually includes unemployment insurance (<em>a-kassa</em>).</p>
          <h2>Taxes</h2>
          <p>Taxes fund the welfare state. Most people pay roughly 30% of their salary in municipal income tax. People earning above the state-tax threshold (~613 900 SEK in 2024) pay an additional 20% on the income above that line. Capital gains are taxed at 30%. VAT (<em>moms</em>) is 25% on most goods, 12% on food, 6% on books and culture.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — the Swedish Tax Agency — is also the population registry. Your <em>personnummer</em> (personal number) ties you to taxes, healthcare, schools, and your address. Move? Tell them within a week.</p>
          <h2>The welfare state</h2>
          <p>For your taxes you get: tax-funded healthcare (with small fees), schools and university (free for citizens and permanent residents), parental leave (480 days per child, split between parents), unemployment benefit (via your a-kassa), sickness benefit, and a basic state pension.</p>
          ${ebookFactBox('en', 'Facts to review', 'VAT default: 25% · VAT food: 12% · Parental leave: 480 days · No legal minimum wage · Collective agreements set sector minimums.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Arbetsmarknaden bygger mycket på kollektivavtal mellan fackförbund och arbetsgivare. Där regleras ofta lön, arbetstid och villkor.',
            'Skatter finansierar gemensam välfärd som skola, vård, omsorg, pensioner och socialförsäkringar.',
            'Skatteverket hanterar skatt och folkbokföring. Personnummer och folkbokföringsadress används i många vardagliga kontakter.',
            'Privatekonomi i Sverige handlar ofta om lön efter skatt, räkningar, försäkringar, sparande och att betala i tid.',
          ],
          'Kollektivavtal · Kommunalskatt · Skatteverket · Välfärd finansieras gemensamt.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>劳动力市场</h2>
          <p>在瑞典，薪资和工作条件大多由 <em>集体协议</em>（kollektivavtal）确定——这是工会与雇主组织之间谈判的结果。法律上没有最低工资，但在任何特定行业里，约定的最低工资通常都远高于生活成本。</p>
          <p>加入工会是自愿的。大约 65% 的劳动者属于某个工会。入会通常还包含失业保险（<em>a-kassa</em>）。</p>
          <h2>税收</h2>
          <p>税收为福利国家提供资金。大多数人要把薪水中大约 30% 缴纳为市镇所得税。收入超过国税起征点（2024 年约为 613 900 SEK）的人，要就超过这条线的收入额外缴纳 20%。资本利得按 30% 征税。增值税（<em>moms</em>）对大多数商品为 25%，食品为 12%，书籍和文化产品为 6%。</p>
          <h2>Skatteverket（瑞典税务局）</h2>
          <p>Skatteverket——瑞典税务局——同时也是人口登记机构。你的 <em>personnummer</em>（个人编号）把你与税收、医疗、学校以及你的住址绑定在一起。搬家了？要在一周之内告诉他们。</p>
          <h2>福利国家</h2>
          <p>用你缴的税，你能得到：由税收提供资金的医疗（只收取少量费用）、学校和大学（对公民和永久居民免费）、育儿假（每个孩子 480 天，在父母之间分配）、失业津贴（通过你的 a-kassa 领取）、疾病津贴，以及一份基本的国家养老金。</p>
          ${ebookFactBox('zh-Hans', null, '增值税标准税率：25% · 增值税食品税率：12% · 育儿假：480 天 · 没有法定最低工资 · 集体协议确定各行业最低工资。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>勞動市場</h2>
          <p>在瑞典，薪資和工作條件大多由 <em>集體協議</em>（kollektivavtal）確定——這是工會與雇主組織之間談判的結果。法律上沒有最低工資，但在任何特定行業裡，約定的最低工資通常都遠高於生活成本。</p>
          <p>加入工會是自願的。大約 65% 的勞動者屬於某個工會。入會通常還包含失業保險（<em>a-kassa</em>）。</p>
          <h2>稅收</h2>
          <p>稅收為福利國家提供資金。大多數人要把薪水中大約 30% 繳納為市鎮所得稅。收入超過國稅起徵點（2024 年約為 613 900 SEK）的人，要就超過這條線的收入額外繳納 20%。資本利得按 30% 課稅。增值稅（<em>moms</em>）對大多數商品為 25%，食品為 12%，書籍和文化產品為 6%。</p>
          <h2>Skatteverket（瑞典稅務局）</h2>
          <p>Skatteverket——瑞典稅務局——同時也是人口登記機構。你的 <em>personnummer</em>（個人編號）把你與稅收、醫療、學校以及你的住址綁定在一起。搬家了？要在一週之內告訴他們。</p>
          <h2>福利國家</h2>
          <p>用你繳的稅，你能得到：由稅收提供資金的醫療（只收取少量費用）、學校和大學（對公民和永久居民免費）、育兒假（每個孩子 480 天，在父母之間分配）、失業津貼（透過你的 a-kassa 領取）、疾病津貼，以及一份基本的國家養老金。</p>
          ${ebookFactBox('zh-Hant', null, '增值稅標準稅率：25% · 增值稅食品稅率：12% · 育兒假：480 天 · 沒有法定最低工資 · 集體協議確定各行業最低工資。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>سوق العمل</h2>
          <p>تُحدَّد الأجور وشروط العمل في السويد في الغالب عبر <em>الاتفاقات الجماعية</em> (kollektivavtal) — التي يتمّ التفاوض عليها بين النقابات ومنظمات أصحاب العمل. لا يوجد حدّ أدنى قانوني للأجور، لكن الحدّ الأدنى المتفَّق عليه في أيِّ قطاع عادةً ما يكون أعلى بكثير من تكلفة المعيشة.</p>
          <p>العضوية في نقابة طوعية. ينتمي نحو 65% من العمّال إلى نقابة. والانضمام يشمل عادةً تأمين البطالة (<em>a-kassa</em>).</p>
          <h2>الضرائب</h2>
          <p>تموّل الضرائب دولة الرفاه. يدفع معظم الناس نحو 30% من راتبهم كضريبة دخل بلدية. ومن يكسبون فوق عتبة ضريبة الدولة (~613 900 SEK في 2024) يدفعون 20% إضافية على الدخل الذي يتجاوز ذلك الحد. وتُفرَض ضريبة 30% على أرباح رأس المال. وضريبة القيمة المضافة (<em>moms</em>) هي 25% على معظم السلع، و12% على الطعام، و6% على الكتب والثقافة.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — مصلحة الضرائب السويدية — هي أيضًا سجلّ السكان. يربطك <em>personnummer</em> (الرقم الشخصي) بالضرائب والرعاية الصحية والمدارس وعنوانك. هل انتقلت؟ أبلغهم خلال أسبوع.</p>
          <h2>دولة الرفاه</h2>
          <p>مقابل ضرائبك تحصل على: رعاية صحية ممولة بالضرائب (برسوم بسيطة)، ومدارس وجامعة (مجانية للمواطنين والمقيمين الدائمين)، وإجازة والدية (480 يومًا لكل طفل، تُقسَّم بين الوالدين)، وإعانة بطالة (عبر a-kassa الخاص بك)، وإعانة مرضية، ومعاش دولة أساسي.</p>
          ${ebookFactBox('ar', null, 'ضريبة القيمة المضافة الافتراضية: 25% · ضريبة القيمة المضافة على الطعام: 12% · الإجازة الوالدية: 480 يومًا · لا حدّ أدنى قانوني للأجور · الاتفاقات الجماعية تحدّد الحدود الدنيا للقطاعات.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>بازاڕی کار</h2>
          <p>موچە و مەرجەکانی کار لە سویددا زۆرتر بە <em>ڕێککەوتنی هاوبەش</em> (kollektivavtal) دیاری دەکرێن — کە لەنێوان سەندیکاکان و ڕێکخراوەکانی کارفەرمایاندا گفتوگۆیان لەسەر دەکرێت. هیچ کەمترین موچەیەکی یاسایی نییە، بەڵام کەمترینی ڕێککەوتووی هەر کەرتێک زۆرجار زۆر لە تێچووی ژیان بەرزترە.</p>
          <p>ئەندامێتی لە سەندیکا ئارەزوومەندانەیە. نزیکەی 65% کرێکاران ئەندامی سەندیکایەکن. چوونە ناوی زۆرجار بیمەی بێکاری (<em>a-kassa</em>) لەخۆ دەگرێت.</p>
          <h2>باجەکان</h2>
          <p>باجەکان دەوڵەتی خۆشگوزەرانی دابین دەکەن. زۆربەی خەڵک نزیکەی 30%ی موچەکەیان وەک باجی داهاتی شارەوانی دەدەن. ئەو کەسانەی سەرووی سنووری باجی دەوڵەتی (~613 900 SEK لە 2024) دەستکەوتیان هەیە، 20%ی زیاتر لەسەر ئەو داهاتەی سەرووی ئەو هێڵە دەدەن. قازانجی سەرمایە بە ڕێژەی 30% باجی لێ دەدرێت. باجی بەهای زیادکراو (<em>moms</em>) بۆ زۆربەی کاڵاکان 25%ە، بۆ خواردن 12%، و بۆ کتێب و کەلتوور 6%.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — دامودەزگای باجی سوید — هەروەها تۆماری دانیشتووانیشە. <em>personnummer</em> (ژمارەی کەسی) تۆ بە باج، خزمەتگوزاریی تەندروستی، قوتابخانە و ناونیشانەکەتەوە دەبەستێتەوە. گواستیتەوە؟ لە ماوەی هەفتەیەکدا پێیان ڕابگەیەنە.</p>
          <h2>دەوڵەتی خۆشگوزەرانی</h2>
          <p>لە بەرامبەر باجەکانتدا ئەمانە وەردەگریت: خزمەتگوزاریی تەندروستیی باجدابین‌کراو (لەگەڵ کرێی بچووک)، قوتابخانە و زانکۆ (بێبەرامبەر بۆ هاووڵاتیان و نیشتەجێ هەمیشەییەکان)، مۆڵەتی دایک‌وباوکی (480 ڕۆژ بۆ هەر منداڵێک، دابەشکراو لەنێوان دایک و باوکدا)، یارمەتیی بێکاری (لە ڕێگەی a-kassaکەتەوە)، یارمەتیی نەخۆشی، و خانەنشینییەکی بنەڕەتیی دەوڵەتی.</p>
          ${ebookFactBox('ckb', null, 'ڕێژەی بنەڕەتیی moms: 25% · momsی خواردن: 12% · مۆڵەتی دایک‌وباوکی: 480 ڕۆژ · هیچ کەمترین موچەیەکی یاسایی نییە · ڕێککەوتنی هاوبەش کەمترینی کەرتەکان دیاری دەکات.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>بازار کار</h2>
          <p>دستمزدها و شرایط کار در سوئد بیشتر با <em>توافق‌های جمعی</em> (kollektivavtal) تعیین می‌شود — که میان اتحادیه‌ها و سازمان‌های کارفرمایان مذاکره می‌شود. حداقل دستمزد قانونی وجود ندارد، اما حداقل توافق‌شده در هر بخش معمولاً به‌مراتب بالاتر از هزینهٔ زندگی است.</p>
          <p>عضویت در اتحادیه داوطلبانه است. حدود 65% کارگران عضو یک اتحادیه‌اند. پیوستن معمولاً شامل بیمهٔ بیکاری (<em>a-kassa</em>) می‌شود.</p>
          <h2>مالیات</h2>
          <p>مالیات‌ها دولت رفاه را تأمین مالی می‌کنند. بیشتر مردم حدود 30% از حقوق خود را به‌عنوان مالیات بر درآمد کمونی می‌پردازند. کسانی که بالاتر از آستانهٔ مالیات دولتی (~613 900 SEK در 2024) درآمد دارند، 20% اضافی بر درآمد بالاتر از آن خط می‌پردازند. سود سرمایه با نرخ 30% مشمول مالیات است. مالیات بر ارزش افزوده (<em>moms</em>) برای بیشتر کالاها 25%، برای مواد غذایی 12% و برای کتاب و فرهنگ 6% است.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — ادارهٔ مالیات سوئد — همچنین ثبت احوال جمعیت است. <em>personnummer</em> (شمارهٔ شخصی) شما را به مالیات، خدمات بهداشتی، مدرسه‌ها و نشانی شما پیوند می‌دهد. جابه‌جا شدید؟ ظرف یک هفته به آن‌ها اطلاع دهید.</p>
          <h2>دولت رفاه</h2>
          <p>در ازای مالیات‌هایتان دریافت می‌کنید: خدمات بهداشتی تأمین‌شده با مالیات (با هزینه‌های اندک)، مدرسه و دانشگاه (رایگان برای شهروندان و مقیمان دائم)، مرخصی والدین (480 روز برای هر کودک، تقسیم‌شده میان والدین)، مزایای بیکاری (از طریق a-kassa شما)، مزایای بیماری و یک بازنشستگی پایهٔ دولتی.</p>
          ${ebookFactBox('fa', null, 'نرخ پیش‌فرض moms: 25% · moms مواد غذایی: 12% · مرخصی والدین: 480 روز · بدون حداقل دستمزد قانونی · توافق‌های جمعی حداقل‌های بخشی را تعیین می‌کنند.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Rynek pracy</h2>
          <p>Płace i warunki pracy w Szwecji są w większości ustalane przez <em>układy zbiorowe</em> (kollektivavtal) — negocjowane między związkami zawodowymi a organizacjami pracodawców. Nie ma ustawowej płacy minimalnej, ale uzgodnione minimum w danym sektorze jest zwykle znacznie powyżej kosztów utrzymania.</p>
          <p>Członkostwo w związku zawodowym jest dobrowolne. Należy do niego około 65% pracowników. Przystąpienie zwykle obejmuje ubezpieczenie na wypadek bezrobocia (<em>a-kassa</em>).</p>
          <h2>Podatki</h2>
          <p>Podatki finansują państwo opiekuńcze. Większość ludzi płaci mniej więcej 30% pensji w gminnym podatku dochodowym. Osoby zarabiające powyżej progu podatku państwowego (~613 900 SEK w 2024) płacą dodatkowe 20% od dochodu powyżej tej granicy. Zyski kapitałowe są opodatkowane stawką 30%. VAT (<em>moms</em>) wynosi 25% na większość towarów, 12% na żywność, 6% na książki i kulturę.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — szwedzki urząd skarbowy — jest też rejestrem ludności. Twój <em>personnummer</em> (numer osobisty) wiąże cię z podatkami, opieką zdrowotną, szkołami i twoim adresem. Przeprowadzka? Zgłoś im to w ciągu tygodnia.</p>
          <h2>Państwo opiekuńcze</h2>
          <p>Za swoje podatki otrzymujesz: opiekę zdrowotną finansowaną z podatków (z niewielkimi opłatami), szkoły i uniwersytet (bezpłatne dla obywateli i stałych rezydentów), urlop rodzicielski (480 dni na dziecko, dzielony między rodziców), zasiłek dla bezrobotnych (przez twoją a-kassa), zasiłek chorobowy i podstawową emeryturę państwową.</p>
          ${ebookFactBox('pl', null, 'VAT podstawowy: 25% · VAT żywność: 12% · Urlop rodzicielski: 480 dni · Brak ustawowej płacy minimalnej · Układy zbiorowe ustalają minima sektorowe.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Suuqa shaqada</h2>
          <p>Mushaharrada iyo shuruudaha shaqada ee Iswiidhan inta badan waxaa go'aamiya <em>heshiisyo wadareed</em> (kollektivavtal) — kuwaas oo laga gorgortamo ururrada shaqaalaha iyo ururrada loo-shaqeeyayaasha. Ma jiro mushahar ugu yar oo sharci ah, laakiin xadka ugu yar ee la isku raaco qayb kasta wuxuu badanaa aad uga sarreeyaa kharashka nolosha.</p>
          <p>Xubinnimada ururka shaqaaluhu waa ikhtiyaari. Qiyaastii 65% shaqaaluhu mid bay ka tirsan yihiin. Ku biiristu badanaa waxay ku jirtaa caymis shaqala'aaneed (<em>a-kassa</em>).</p>
          <h2>Canshuuraha</h2>
          <p>Canshuuruhu waxay maalgeliyaan dawladda daryeelka. Dadka intooda badan waxay bixiyaan ku dhawaad 30% mushaharkooda oo ah canshuurta dakhliga degmada. Dadka ka soo galsada xadka canshuurta dawladda (~613 900 SEK 2024) waxay bixiyaan 20% dheeraad ah oo ku saabsan dakhliga ka sarreeya xariiqdaas. Faa'iidada raasamaalku waxaa lagu canshuuraa 30%. VAT-ka (<em>moms</em>) waa 25% badeecadaha intooda badan, 12% cuntada, 6% buugaagta iyo dhaqanka.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — Hay'adda Canshuuraha Iswiidhan — sidoo kale waa diiwaanka dadweynaha. <em>personnummer</em>-kaaga (lambar shakhsi) wuxuu kugu xiraa canshuuraha, daryeelka caafimaadka, iskuullada iyo cinwaankaaga. Ma guurtay? Toddobaad gudihiis u sheeg.</p>
          <h2>Dawladda daryeelka</h2>
          <p>Canshuurahaaga waxaad ku heshaa: daryeel caafimaad oo canshuur lagu maalgeliyo (oo leh khidmado yaryar), iskuullo iyo jaamacad (oo bilaash u ah muwaadiniinta iyo dadka deganaanshaha joogtada ah), fasax waalidnimo (480 maalmood ilmo kasta, oo la kala qaybsado waalidiinta), gunno shaqala'aaneed (iyada oo loo marayo a-kassa-daada), gunno jirro iyo hawlgab dawladeed oo aasaasi ah.</p>
          ${ebookFactBox('so', null, "VAT caadi: 25% · VAT cunto: 12% · Fasax waalidnimo: 480 maalmood · Ma jiro mushahar ugu yar oo sharci ah · Heshiisyada wadareed ayaa go'aamiya xadka ugu yar ee qaybaha.", ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ዕዳጋ ስራሕ</h2>
          <p>ኣብ ሽወደን ደሞዝን ኩነታትን መብዛሕትኡ ግዜ ብ<em>ሓባራዊ ስምምዓት</em> (kollektivavtal) ይውሰን — ኣብ መንጎ ሰራሕተኛታት ማሕበራትን ትካላት ወሃብቲ ስራሕን ዝድራደር። ሕጋዊ ዝተሓተ ደሞዝ የለን፣ ኣብ ዝኾነ ጽላት ዝተሰማምዑሉ ዝተሓተ ግን መብዛሕትኡ ግዜ ካብ ወጻኢ መነባብሮ ኣዝዩ ላዕሊ እዩ።</p>
          <p>ኣባልነት ሰራሕተኛታት ማሕበር ብፍታው እዩ። ኣስታት 65% ሰራሕተኛታት ኣባል እዮም። ምእታው መብዛሕትኡ ግዜ መድሕን ስእነት ስራሕ (<em>a-kassa</em>) የጠቓልል።</p>
          <h2>ቀረጽ</h2>
          <p>ቀረጽ ንመንግስቲ ድሕነት ይምውል። መብዛሕትኦም ሰባት ኣስታት 30% ደሞዞም ከም ቀረጽ እቶት kommun ይኸፍሉ። ካብ ደረት ቀረጽ መንግስቲ (ኣብ 2024 ኣስታት 613 900 SEK) ንላዕሊ ዝረኽቡ ሰባት፣ ካብቲ መስመር ንላዕሊ ኣብ ዘሎ እቶት ተወሳኺ 20% ይኸፍሉ። ካብ ካፒታል ዝርከብ መኽሰብ ብ30% ይቕረጽ። VAT (<em>moms</em>) ኣብ መብዛሕትኡ ኣቕሑ 25%፣ ኣብ ምግቢ 12%፣ ኣብ መጻሕፍትን ባህልን 6% እዩ።</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — ቤት ጽሕፈት ቀረጽ ሽወደን — መዝገብ ህዝቢ እውን እዩ። <em>personnummer</em>ካ (ውልቃዊ ቍጽሪ) ምስ ቀረጽ፣ ክንክን ጥዕና፣ ኣብያተ ትምህርትን ኣድራሻኻን የተኣሳስረካ። ግዒዝካ? ኣብ ውሽጢ ሰሙን ንገሮም።</p>
          <h2>መንግስቲ ድሕነት</h2>
          <p>ብቐረጽካ እዚ ትረክብ፦ ብቐረጽ ዝምወል ክንክን ጥዕና (ብናኣሽቱ ክፍሊት)፣ ኣብያተ ትምህርትን ዩኒቨርሲቲን (ንዜጋታትን ቀወምቲ ነበርትን ብናጻ)፣ ናይ ወለዲ ዕረፍቲ (480 መዓልታት ኣብ ሓደ ቆልዓ፣ ኣብ መንጎ ወለዲ ዝመቓራሕ)፣ ጥቕማጥቕሚ ስእነት ስራሕ (ብመንገዲ a-kassaካ)፣ ጥቕማጥቕሚ ሕማምን መሰረታዊ ጥሮታ መንግስትን።</p>
          ${ebookFactBox('ti', null, 'ነባሪ VAT፦ 25% · VAT ምግቢ፦ 12% · ናይ ወለዲ ዕረፍቲ፦ 480 መዓልታት · ሕጋዊ ዝተሓተ ደሞዝ የለን · ሓባራዊ ስምምዓት ዝተሓተ ናይ ጽላት ይውስኑ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>İş gücü piyasası</h2>
          <p>İsveç'te maaşlar ve koşullar çoğunlukla <em>toplu sözleşmeler</em> (kollektivavtal) ile belirlenir — sendikalar ile işveren örgütleri arasında müzakere edilir. Yasal bir asgari ücret yoktur, ancak herhangi bir sektörde üzerinde anlaşılan asgari tutar genellikle geçim maliyetinin epey üzerindedir.</p>
          <p>Sendika üyeliği gönüllüdür. Çalışanların yaklaşık %65'i bir sendikaya üyedir. Üye olmak genellikle işsizlik sigortasını (<em>a-kassa</em>) içerir.</p>
          <h2>Vergiler</h2>
          <p>Vergiler refah devletini finanse eder. Çoğu kişi maaşının kabaca %30'unu belediye gelir vergisi olarak öder. Devlet vergisi eşiğinin (2024'te yaklaşık 613 900 SEK) üzerinde kazananlar, o sınırın üzerindeki gelir için ek olarak %20 öder. Sermaye kazançları %30 oranında vergilendirilir. KDV (<em>moms</em>) çoğu mal için %25, gıda için %12, kitap ve kültür için %6'dır.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — İsveç Vergi Dairesi — aynı zamanda nüfus kütüğüdür. <em>personnummer</em>'iniz (kişisel numara) sizi vergilere, sağlık hizmetlerine, okullara ve adresinize bağlar. Taşındınız mı? Bir hafta içinde onlara bildirin.</p>
          <h2>Refah devleti</h2>
          <p>Vergilerinizin karşılığında şunları alırsınız: vergiyle finanse edilen sağlık hizmetleri (küçük ücretlerle), okullar ve üniversite (vatandaşlar ve daimi oturum sahipleri için ücretsiz), ebeveyn izni (çocuk başına 480 gün, ebeveynler arasında paylaşılır), işsizlik ödeneği (a-kassa'nız aracılığıyla), hastalık ödeneği ve temel bir devlet emekliliği.</p>
          ${ebookFactBox('tr', null, 'Varsayılan KDV: %25 · Gıda KDV: %12 · Ebeveyn izni: 480 gün · Yasal asgari ücret yok · Toplu sözleşmeler sektör asgarilerini belirler.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Ринок праці</h2>
          <p>Зарплати та умови у Швеції здебільшого встановлюються <em>колективними договорами</em> (kollektivavtal) — узгодженими між профспілками та організаціями роботодавців. Законодавчо встановленої мінімальної зарплати немає, але узгоджений мінімум у будь-якому секторі зазвичай значно вищий за прожитковий мінімум.</p>
          <p>Членство у профспілці добровільне. До неї належить близько 65% працівників. Вступ зазвичай включає страхування на випадок безробіття (<em>a-kassa</em>).</p>
          <h2>Податки</h2>
          <p>Податки фінансують державу загального добробуту. Більшість людей сплачують приблизно 30% зарплати у вигляді муніципального податку на доходи. Особи, що заробляють понад поріг державного податку (~613 900 SEK у 2024), сплачують додаткові 20% з доходу понад цю межу. Приріст капіталу оподатковується за ставкою 30%. ПДВ (<em>moms</em>) становить 25% на більшість товарів, 12% на продукти харчування, 6% на книжки та культуру.</p>
          <h2>Skatteverket</h2>
          <p>Skatteverket — Шведська податкова агенція — є також реєстром населення. Ваш <em>personnummer</em> (особистий номер) пов'язує вас із податками, охороною здоров'я, школами та вашою адресою. Переїхали? Повідомте їм упродовж тижня.</p>
          <h2>Держава загального добробуту</h2>
          <p>За свої податки ви отримуєте: охорону здоров'я, що фінансується з податків (з невеликими зборами), школи та університет (безкоштовні для громадян і постійних мешканців), батьківську відпустку (480 днів на дитину, розподілену між батьками), допомогу з безробіття (через вашу a-kassa), допомогу у зв'язку з хворобою та базову державну пенсію.</p>
          ${ebookFactBox('uk', null, 'Базовий ПДВ: 25% · ПДВ на продукти: 12% · Батьківська відпустка: 480 днів · Немає законодавчої мінімальної зарплати · Колективні договори встановлюють секторальні мінімуми.', ['uhrStudyMaterial'])}
        `,
      },
    },

    5: {
      kicker: {
        en: 'Chapter 05 · Equality',
        sv: 'Kapitel 05 · Jämställdhet',
        'zh-Hans': '第 05 章 · 平等',
        'zh-Hant': '第 05 章 · 平等',
        ar: 'الفصل 05 · المساواة',
        ckb: 'بەشی 05 · یەکسانی',
        fa: 'فصل 05 · برابری',
        pl: 'Rozdział 05 · Równość',
        so: 'Cutubka 05 · Sinnaan',
        ti: 'ምዕራፍ 05 · ማዕርነት',
        tr: 'Bölüm 05 · Eşitlik',
        uk: 'Розділ 05 · Рівність',
      },
      title: {
        en: 'Equality',
        sv: 'Jämställdhet',
        'zh-Hans': '平等',
        'zh-Hant': '平等',
        ar: 'المساواة',
        ckb: 'یەکسانی',
        fa: 'برابری',
        pl: 'Równość',
        so: 'Sinnaanta',
        ti: 'ማዕርነትን',
        tr: 'Eşitlik',
        uk: 'Рівність',
      },
      title_em: {
        en: 'and the modern household.',
        sv: 'och det moderna hemmet.',
        'zh-Hans': '与现代家庭。',
        'zh-Hant': '與現代家庭。',
        ar: 'والأسرة الحديثة.',
        ckb: 'و خێزانی هاوچەرخ.',
        fa: 'و خانوار مدرن.',
        pl: 'i nowoczesne gospodarstwo domowe.',
        so: 'iyo qoyska casriga ah.',
        ti: 'ዘመናዊ ስድራ ቤትን።',
        tr: 've modern hane.',
        uk: 'та сучасне домогосподарство.',
      },
      lede: {
        en: 'Sweden is a quiet feminist project. The laws are clearer than the dinner-table conversations, but both are worth knowing.',
        sv: 'Sverige är ett tyst feministiskt projekt. Lagarna är tydligare än middagsbordssamtalen — men båda är värda att kunna.',
        'zh-Hans': '瑞典是一项静悄悄的女性主义事业。法律比餐桌上的对话更清晰，但两者都值得了解。',
        'zh-Hant': '瑞典是一項靜悄悄的女性主義事業。法律比餐桌上的對話更清晰，但兩者都值得了解。',
        ar: 'السويد مشروع نسوي هادئ. القوانين أوضح من الأحاديث على مائدة العشاء، لكن كليهما يستحق المعرفة.',
        ckb: 'سوید پڕۆژەیەکی فێمینیستی بێدەنگە. یاساکان ڕوونترن لە گفتوگۆکانی سەر مێزی نانی ئێوارە، بەڵام هەردووکیان شایانی زانینن.',
        fa: 'سوئد یک پروژهٔ فمینیستی آرام است. قوانین روشن‌تر از گفت‌وگوهای سر میز شام‌اند، اما هر دو ارزش دانستن دارند.',
        pl: 'Szwecja to cichy projekt feministyczny. Przepisy są jaśniejsze niż rozmowy przy stole, ale warto znać jedne i drugie.',
        so: 'Iswiidhan waa mashruuc feminist ah oo aamusan. Sharciyadu way ka cad yihiin wadahadallada miiska cuntada, laakiin labadaba way mudan yihiin in la ogaado.',
        ti: 'ሽወደን ህዱእ ናይ ሴትነት ፕሮጀክት እያ። እቶም ሕግታት ካብቲ ኣብ ጣውላ ምግቢ ዝግበር ዕላላት ዝያዳ ንጹራት እዮም፣ ክልቲኦም ግን ምፍላጦም ይጠቅም።',
        tr: 'İsveç sessiz bir feminist projedir. Yasalar, akşam yemeği sohbetlerinden daha açıktır, ama her ikisini de bilmeye değer.',
        uk: 'Швеція — це тихий феміністичний проєкт. Закони зрозуміліші за розмови за обіднім столом, але варто знати і те, і інше.',
      },
      body: {
        en: `
          <h2>Equal in law</h2>
          <p>The Discrimination Act (<em>diskrimineringslagen</em>, 2008) protects against discrimination on seven grounds: sex, gender identity or expression, ethnicity, religion or belief, disability, sexual orientation, and age. It applies in work, education, healthcare, housing, and public services.</p>
          <h2>Same-sex marriage and rainbow families</h2>
          <p>Same-sex marriage has been legal since 2009. Same-sex couples may adopt and access fertility treatment on equal terms. Transgender people may change their legal gender without medical requirements.</p>
          <h2>Parental leave</h2>
          <p>480 days per child, of which 90 are reserved for each parent (the "pappamånader") and cannot be transferred. The aim: both parents stay home. A child's first birthday in Sweden is usually celebrated by two slightly-tired adults, not one.</p>
          <h2>Household responsibilities</h2>
          <p>Cooking, cleaning, childcare, and household admin are not gendered tasks in Sweden — at least not officially. Surveys show this is the country with the most equal time spent on housework. (Statistics, like teenagers, lie a little.)</p>
          <h2>Women and work</h2>
          <p>Women's labour-force participation is among the world's highest (~80%). The gender pay gap is real (~10–12%) but shrinking. Maternal mortality is among the world's lowest.</p>
          ${ebookFactBox('en', 'Facts to review', 'Same-sex marriage: 2009 · Discrimination grounds: 7 · Parental leave: 480 days · Reserved per parent: 90 days each.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Jämställdhet betyder att kvinnor och män ska ha samma rättigheter, skyldigheter och möjligheter.',
            'Diskrimineringslagen skyddar mot diskriminering i till exempel arbetsliv, utbildning, vård och samhällsservice.',
            'Sverige erkänner samkönade äktenskap och familjer med olika sammansättning.',
            'Föräldraförsäkringen är byggd för att båda föräldrarna ska kunna ta ansvar för barn och arbete.',
          ],
          'Diskrimineringslagen · Samkönade äktenskap: 2009 · Föräldraledighet: 480 dagar per barn.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>法律上的平等</h2>
          <p>《反歧视法》（<em>diskrimineringslagen</em>，2008）针对七种事由提供反歧视保护：性别、性别认同或表达、族裔、宗教或信仰、残障、性取向和年龄。它适用于工作、教育、医疗、住房和公共服务等领域。</p>
          <h2>同性婚姻与彩虹家庭</h2>
          <p>同性婚姻自 2009 年起合法。同性伴侣可以在平等的条件下收养子女并接受生育治疗。跨性别者无需满足任何医疗条件即可更改其法律性别。</p>
          <h2>育儿假</h2>
          <p>每个孩子 480 天，其中各保留 90 天给父母双方（即所谓的 pappamånader（爸爸月）），且不可转让。其用意在于：让父母双方都待在家里。在瑞典，孩子的第一个生日通常是由两位略显疲惫的成年人一起庆祝的，而不是只有一位。</p>
          <h2>家务责任</h2>
          <p>在瑞典，做饭、打扫、照顾孩子和处理家庭事务并不是带有性别色彩的任务——至少在官方层面不是。调查显示，这是花在家务上的时间最为平等的国家。（统计数据，就像青少年一样，会撒一点小谎。）</p>
          <h2>女性与工作</h2>
          <p>女性的劳动力参与率位居世界前列（约 80%）。性别薪酬差距确实存在（约 10–12%），但正在缩小。孕产妇死亡率位居世界最低之列。</p>
          ${ebookFactBox('zh-Hans', null, '同性婚姻：2009 · 反歧视事由：7 · 育儿假：480 天 · 各方保留：每人 90 天。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>法律上的平等</h2>
          <p>《反歧視法》（<em>diskrimineringslagen</em>，2008）針對七種事由提供反歧視保護：性別、性別認同或表達、族裔、宗教或信仰、殘障、性取向和年齡。它適用於工作、教育、醫療、住房和公共服務等領域。</p>
          <h2>同性婚姻與彩虹家庭</h2>
          <p>同性婚姻自 2009 年起合法。同性伴侶可以在平等的條件下收養子女並接受生育治療。跨性別者無需滿足任何醫療條件即可更改其法律性別。</p>
          <h2>育兒假</h2>
          <p>每個孩子 480 天，其中各保留 90 天給父母雙方（即所謂的 pappamånader（爸爸月）），且不可轉讓。其用意在於：讓父母雙方都待在家裡。在瑞典，孩子的第一個生日通常是由兩位略顯疲憊的成年人一起慶祝的，而不是只有一位。</p>
          <h2>家務責任</h2>
          <p>在瑞典，做飯、打掃、照顧孩子和處理家庭事務並不是帶有性別色彩的任務——至少在官方層面不是。調查顯示，這是花在家務上的時間最為平等的國家。（統計數據，就像青少年一樣，會撒一點小謊。）</p>
          <h2>女性與工作</h2>
          <p>女性的勞動力參與率位居世界前列（約 80%）。性別薪酬差距確實存在（約 10–12%），但正在縮小。孕產婦死亡率位居世界最低之列。</p>
          ${ebookFactBox('zh-Hant', null, '同性婚姻：2009 · 反歧視事由：7 · 育兒假：480 天 · 各方保留：每人 90 天。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>متساوون أمام القانون</h2>
          <p>قانون مكافحة التمييز (<em>diskrimineringslagen</em>، 2008) يحمي من التمييز على سبعة أسس: الجنس، والهوية أو التعبير الجندري، والعرق، والدين أو المعتقد، والإعاقة، والميل الجنسي، والعمر. وهو يسري في العمل والتعليم والرعاية الصحية والسكن والخدمات العامة.</p>
          <h2>زواج المثليين والعائلات المتنوعة</h2>
          <p>زواج المثليين قانوني منذ 2009. ويجوز للأزواج من نفس الجنس التبنّي والحصول على علاج الخصوبة بشروط متساوية. ويجوز للأشخاص المتحولين جنسيًا تغيير جنسهم القانوني دون متطلبات طبية.</p>
          <h2>إجازة الوالدين</h2>
          <p>480 يومًا لكل طفل، منها 90 محجوزة لكل والد ("أشهر الأب"، <em>pappamånader</em>) ولا يمكن نقلها. الهدف: أن يبقى كلا الوالدين في البيت. عيد الميلاد الأول لطفل في السويد عادةً يحتفل به بالغان متعبان قليلًا، لا واحد فقط.</p>
          <h2>مسؤوليات المنزل</h2>
          <p>الطبخ والتنظيف ورعاية الأطفال وإدارة شؤون البيت ليست مهامًا مرتبطة بالجنس في السويد — على الأقل ليس رسميًا. تُظهر الاستطلاعات أن هذا هو البلد الأكثر تساويًا في الوقت المنفَق على الأعمال المنزلية. (الإحصاءات، مثل المراهقين، تكذب قليلًا.)</p>
          <h2>المرأة والعمل</h2>
          <p>مشاركة النساء في القوى العاملة من بين الأعلى في العالم (~80%). الفجوة في الأجور بين الجنسين حقيقية (~10–12%) لكنها تتقلص. ووفيات الأمهات من بين الأدنى في العالم.</p>
          ${ebookFactBox('ar', null, 'زواج المثليين: 2009 · أسس التمييز: 7 · إجازة الوالدين: 480 يومًا · المحجوز لكل والد: 90 يومًا لكل منهما.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>یەکسان لەبەردەم یاسادا</h2>
          <p>یاسای دژە جیاوازی (<em>diskrimineringslagen</em>، 2008) پاراستن دەکات لە جیاوازی لەسەر حەوت بنەما: ڕەگەز، ناسنامە یان دەربڕینی ڕەگەزی، نەتەوەیی، ئایین یان باوەڕ، کەمئەندامی، ئاراستەی سێکسی، و تەمەن. لە کار، پەروەردە، چاودێری تەندروستی، نیشتەجێبوون، و خزمەتگوزاری گشتیدا جێبەجێ دەکرێت.</p>
          <h2>هاوسەرگیری هاوڕەگەز و خێزانە جۆراوجۆرەکان</h2>
          <p>هاوسەرگیری هاوڕەگەز لە ساڵی 2009 ـەوە یاساییە. جووتە هاوڕەگەزەکان دەتوانن منداڵ بگرنە خۆ و بە مەرجی یەکسان دەستیان بگات بە چارەسەری زاوزێ. کەسانی ترانس دەتوانن ڕەگەزی یاساییان بگۆڕن بەبێ پێداویستی پزیشکی.</p>
          <h2>مۆڵەتی دایک و باوک</h2>
          <p>480 ڕۆژ بۆ هەر منداڵێک، کە 90 ڕۆژیان بۆ هەر دایک یان باوکێک تەرخان کراوە ("مانگەکانی باوک"، <em>pappamånader</em>) و ناگوازرێنەوە. ئامانج: هەردوو دایک و باوک لە ماڵەوە بمێننەوە. یەکەمین ساڵیادی لەدایکبوونی منداڵێک لە سویددا بەزۆری لەلایەن دوو گەورەی کەمێک ماندووەوە ئاهەنگی بۆ دەگێڕدرێت، نەک یەکێک.</p>
          <h2>بەرپرسیارێتییەکانی ماڵ</h2>
          <p>چێشتلێنان، پاککردنەوە، چاودێری منداڵ، و کارگێڕی ماڵ لە سویددا ئەرکی ڕەگەزی نین — لانیکەم بەفەرمی نا. ڕاپرسییەکان دەریدەخەن کە ئەمە یەکسانترین وڵاتە لە ڕووی کاتی تەرخانکراو بۆ کاری ماڵەوە. (ئامار، وەک هەرزەکاران، کەمێک درۆ دەکات.)</p>
          <h2>ژنان و کار</h2>
          <p>بەشداری ژنان لە هێزی کاردا لە بەرزترینەکانی جیهانە (~80%). جیاوازی موچەی ڕەگەزی ڕاستەقینەیە (~10–12%) بەڵام کەم دەبێتەوە. مردنی دایکان لە کەمترینەکانی جیهانە.</p>
          ${ebookFactBox('ckb', null, 'هاوسەرگیری هاوڕەگەز: 2009 · بنەماکانی جیاوازی: 7 · مۆڵەتی دایک و باوک: 480 ڕۆژ · تەرخانکراو بۆ هەر دایک یان باوکێک: 90 ڕۆژ بۆ هەریەکەیان.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>برابر در برابر قانون</h2>
          <p>قانون مبارزه با تبعیض (<em>diskrimineringslagen</em>، 2008) از تبعیض بر هفت پایه محافظت می‌کند: جنسیت، هویت یا بیان جنسیتی، قومیت، دین یا باور، معلولیت، گرایش جنسی، و سن. این قانون در کار، آموزش، بهداشت، مسکن، و خدمات عمومی اعمال می‌شود.</p>
          <h2>ازدواج هم‌جنس و خانواده‌های رنگین‌کمانی</h2>
          <p>ازدواج هم‌جنس از سال 2009 قانونی است. زوج‌های هم‌جنس می‌توانند فرزندخواندگی بپذیرند و با شرایط برابر به درمان ناباروری دسترسی داشته باشند. افراد تراجنسیتی می‌توانند جنسیت قانونی خود را بدون الزامات پزشکی تغییر دهند.</p>
          <h2>مرخصی والدین</h2>
          <p>480 روز برای هر کودک، که 90 روز آن برای هر والد رزرو شده است ("ماه‌های پدر"، <em>pappamånader</em>) و قابل انتقال نیست. هدف: هر دو والد در خانه بمانند. نخستین تولد یک کودک در سوئد معمولاً توسط دو بزرگسالِ کمی خسته جشن گرفته می‌شود، نه یکی.</p>
          <h2>مسئولیت‌های خانه</h2>
          <p>آشپزی، نظافت، نگهداری از کودک، و امور خانه در سوئد وظایفی جنسیتی نیستند — دست‌کم نه رسماً. نظرسنجی‌ها نشان می‌دهند این کشور برابرترین کشور از نظر زمان صرف‌شده برای کارهای خانه است. (آمار، مانند نوجوانان، کمی دروغ می‌گوید.)</p>
          <h2>زنان و کار</h2>
          <p>مشارکت زنان در نیروی کار از بالاترین‌ها در جهان است (~80%). شکاف دستمزد جنسیتی واقعی است (~10–12%) اما در حال کاهش است. مرگ‌ومیر مادران از کمترین‌ها در جهان است.</p>
          ${ebookFactBox('fa', null, 'ازدواج هم‌جنس: 2009 · پایه‌های تبعیض: 7 · مرخصی والدین: 480 روز · رزرو برای هر والد: 90 روز برای هرکدام.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Równi wobec prawa</h2>
          <p>Ustawa o zakazie dyskryminacji (<em>diskrimineringslagen</em>, 2008) chroni przed dyskryminacją z siedmiu powodów: płci, tożsamości lub ekspresji płciowej, pochodzenia etnicznego, religii lub przekonań, niepełnosprawności, orientacji seksualnej i wieku. Obowiązuje w pracy, edukacji, opiece zdrowotnej, mieszkalnictwie i usługach publicznych.</p>
          <h2>Małżeństwa osób tej samej płci i tęczowe rodziny</h2>
          <p>Małżeństwa osób tej samej płci są legalne od 2009. Pary jednopłciowe mogą adoptować i korzystać z leczenia niepłodności na równych zasadach. Osoby transpłciowe mogą zmienić płeć prawną bez wymogów medycznych.</p>
          <h2>Urlop rodzicielski</h2>
          <p>480 dni na dziecko, z czego 90 jest zarezerwowanych dla każdego z rodziców (tzw. „pappamånader” — miesiące ojcowskie) i nie można ich przenieść. Cel: oboje rodzice zostają w domu. Pierwsze urodziny dziecka w Szwecji świętuje zwykle dwoje lekko zmęczonych dorosłych, a nie jedno.</p>
          <h2>Obowiązki domowe</h2>
          <p>Gotowanie, sprzątanie, opieka nad dziećmi i sprawy administracyjne domu nie są w Szwecji zadaniami przypisanymi płci — przynajmniej nie oficjalnie. Badania pokazują, że to kraj o najbardziej równym podziale czasu na prace domowe. (Statystyki, jak nastolatki, trochę kłamią.)</p>
          <h2>Kobiety a praca</h2>
          <p>Aktywność zawodowa kobiet należy do najwyższych na świecie (~80%). Luka płacowa między płciami jest realna (~10–12%), ale maleje. Śmiertelność okołoporodowa należy do najniższych na świecie.</p>
          ${ebookFactBox('pl', null, 'Małżeństwa osób tej samej płci: 2009 · Powody dyskryminacji: 7 · Urlop rodzicielski: 480 dni · Zarezerwowane na rodzica: po 90 dni.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Sharci ahaan loo siman yahay</h2>
          <p>Sharciga Takoorida (<em>diskrimineringslagen</em>, 2008) wuxuu ka ilaaliyaa takoorida toddoba sababood: jinsiga, aqoonsiga ama muujinta jinsiga, qowmiyadda, diinta ama caqiidada, naafanimada, jihada galmada iyo da'da. Wuxuu khuseeyaa shaqada, waxbarashada, daryeelka caafimaadka, guriyaynta iyo adeegyada dadweynaha.</p>
          <h2>Guurka isku-jinsiga ah iyo qoysaska qaansoroobaadka</h2>
          <p>Guurka isku-jinsiga ah waa sharci tan iyo 2009. Lammaanaha isku-jinsiga ahi waxay korsan karaan oo heli karaan daawaynta bacrinta shuruudo siman. Dadka dheddiga-labka beddelay (transgender) waxay beddeli karaan jinsigooda sharci iyaga oo aan u baahnayn shuruudo caafimaad.</p>
          <h2>Fasaxa waalidnimada</h2>
          <p>480 maalmood ilmo kasta, kuwaas oo 90 loo dhigay waalid kasta (kuwa la yiraahdo "pappamånader" — bilaha aabbanimada) lamana wareejin karo. Ujeeddadu: labada waalid guriga ha joogeen. Sannad-guuradii ugu horreysay ee ilmo Iswiidhan badanaa waxaa u dabaaldega laba qof oo waxoogaa daallan, ee aan ahayn mid keliya.</p>
          <h2>Mas'uuliyadaha guriga</h2>
          <p>Karinta, nadiifinta, daryeelka carruurta iyo maamulka guriga ma aha hawlo jinsi ku saleysan Iswiidhan — ugu yaraan si rasmi ah. Sahannada waxay muujinayaan inay tahay dalka ugu siman waqtiga lagu qaato shaqada guriga. (Tirakoobyadu, sida dhallinyarada, waxoogaa bay been sheegaan.)</p>
          <h2>Haweenka iyo shaqada</h2>
          <p>Ka qaybgalka haweenka ee xoogga shaqaale wuxuu ka mid yahay kuwa ugu sarreeya adduunka (~80%). Farqiga mushaharka u dhexeeya jinsiyadu waa dhab (~10–12%) laakiin wuu yaraanayaa. Dhimashada hooyada wuxuu ka mid yahay kuwa ugu hooseeya adduunka.</p>
          ${ebookFactBox('so', null, 'Guurka isku-jinsiga ah: 2009 · Sababaha takoorida: 7 · Fasaxa waalidnimada: 480 maalmood · Loo dhigay waalid kasta: 90 maalmood mid kasta.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ኣብ ሕጊ ማዕረ</h2>
          <p>ሕጊ ኣንጻር ኣድልዎ (<em>diskrimineringslagen</em>, 2008) ኣብ ሸውዓተ መሰረታት ኣንጻር ኣድልዎ ይከላኸል፦ ጾታ፣ ጾታዊ መንነት ወይ ኣገላልጻ፣ ዓሌት፣ ሃይማኖት ወይ እምነት፣ ስንክልና፣ ጾታዊ ዝንባለን ዕድመን። ኣብ ስራሕ፣ ትምህርቲ፣ ክንክን ጥዕና፣ መንበሪ ኣባይትን ህዝባዊ ኣገልግሎታትን ይሰርሕ።</p>
          <h2>ሓደ ጾታ ሓዳርን ቀስተ ደመና ስድራቤታትን</h2>
          <p>ሓደ ጾታ ሓዳር ካብ 2009 ጀሚሩ ሕጋዊ እዩ። ሓደ ጾታ ጽምዲ ብማዕረ ኩነታት ክጥየሙን ናይ ጥንሲ ሕክምና ክረኽቡን ይኽእሉ። ጾታኦም ዝቐየሩ ሰባት (transgender) ብዘይ ሕክምናዊ ቅድመ ኩነት ሕጋዊ ጾታኦም ክቕይሩ ይኽእሉ።</p>
          <h2>ናይ ወለዲ ዕረፍቲ</h2>
          <p>480 መዓልታት ኣብ ሓደ ቆልዓ፣ ካብኦም 90 ንነፍሲ ወከፍ ወላዲ ዝተሓዙ (እቶም „pappamånader” — ኣቦታዊ ኣዋርሕ) ክመሓላለፉ ኣይክእሉን። ዕላማ፦ ክልቲኦም ወለዲ ኣብ ገዛ ይጽንሑ። ናይ ቆልዓ ቀዳማይ ዓመት ልደት ኣብ ሽወደን መብዛሕትኡ ግዜ ብክልተ ቁሩብ ዝደኸሙ ዓበይቲ ይብዓል፣ ብሓደ ዘይኮነ።</p>
          <h2>ናይ ገዛ ሓላፍነታት</h2>
          <p>ምብሳል፣ ምጽራይ፣ ክንክን ቆልዑን ምሕደራ ገዛን ኣብ ሽወደን ብጾታ ዝተመቕለ ዕዮታት ኣይኮኑን — እንተወሓደ ብወግዒ ኣይኮኑን። መጽናዕትታት ከም ዘርእይዎ እዚ እታ ኣብ ስራሕ ገዛ ዝውዕል ግዜ ኣዝዩ ማዕረ ዝኾነላ ሃገር እያ። (ስታቲስቲክስ፣ ከም ኣባጽሕ፣ ቁሩብ ይሕሱ።)</p>
          <h2>ኣንስትን ስራሕን</h2>
          <p>ተሳትፎ ኣንስቲ ኣብ ሓይሊ ዕዮ ካብ ናይ ዓለም እቲ ዝለዓለ እዩ (~80%)። እቲ ብጾታ ዝፍለ ናይ ደሞዝ ፍልልይ ሓቂ እዩ (~10–12%) ግን እናጎደለ ይኸይድ ኣሎ። ሞት ኣዴታት ካብ ናይ ዓለም እቲ ዝተሓተ እዩ።</p>
          ${ebookFactBox('ti', null, 'ሓደ ጾታ ሓዳር፦ 2009 · መሰረታት ኣድልዎ፦ 7 · ናይ ወለዲ ዕረፍቲ፦ 480 መዓልታት · ንነፍሲ ወከፍ ወላዲ ዝተሓዘ፦ 90 መዓልታት ነፍሲ ወከፍ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Yasa önünde eşit</h2>
          <p>Ayrımcılık Yasası (<em>diskrimineringslagen</em>, 2008) yedi temelde ayrımcılığa karşı korur: cinsiyet, cinsiyet kimliği veya ifadesi, etnik köken, din veya inanç, engellilik, cinsel yönelim ve yaş. İş, eğitim, sağlık hizmetleri, konut ve kamu hizmetlerinde geçerlidir.</p>
          <h2>Eşcinsel evlilik ve gökkuşağı aileler</h2>
          <p>Eşcinsel evlilik 2009'dan beri yasaldır. Eşcinsel çiftler eşit koşullarda evlat edinebilir ve doğurganlık tedavisine erişebilir. Transgender bireyler tıbbi gereklilik olmadan yasal cinsiyetlerini değiştirebilir.</p>
          <h2>Ebeveyn izni</h2>
          <p>Çocuk başına 480 gün; bunların 90'ı her ebeveyn için ayrılmıştır ("pappamånader" — baba ayları) ve devredilemez. Amaç: her iki ebeveyn de evde kalsın. İsveç'te bir çocuğun ilk doğum günü genellikle bir değil, hafifçe yorgun iki yetişkin tarafından kutlanır.</p>
          <h2>Ev sorumlulukları</h2>
          <p>Yemek pişirme, temizlik, çocuk bakımı ve ev idaresi İsveç'te cinsiyete dayalı görevler değildir — en azından resmî olarak. Anketler, bunun ev işlerine harcanan zamanın en eşit olduğu ülke olduğunu gösteriyor. (İstatistikler, tıpkı ergenler gibi, biraz yalan söyler.)</p>
          <h2>Kadınlar ve çalışma</h2>
          <p>Kadınların iş gücüne katılımı dünyanın en yükseklerinden biridir (~%80). Cinsiyetler arası ücret farkı gerçektir (~%10–12) ama küçülüyor. Anne ölümleri dünyanın en düşüklerinden biridir.</p>
          ${ebookFactBox('tr', null, "Eşcinsel evlilik: 2009 · Ayrımcılık temelleri: 7 · Ebeveyn izni: 480 gün · Ebeveyn başına ayrılan: 90'ar gün.", ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Рівні перед законом</h2>
          <p>Закон про заборону дискримінації (<em>diskrimineringslagen</em>, 2008) захищає від дискримінації за сімома ознаками: статі, гендерної ідентичності чи вираження, етнічного походження, релігії чи переконань, інвалідності, сексуальної орієнтації та віку. Він діє у праці, освіті, охороні здоров'я, житлі та публічних послугах.</p>
          <h2>Одностатеві шлюби та райдужні родини</h2>
          <p>Одностатеві шлюби легальні від 2009. Одностатеві пари можуть усиновлювати та отримувати лікування безпліддя на рівних умовах. Трансгендерні люди можуть змінити свою юридичну стать без медичних вимог.</p>
          <h2>Батьківська відпустка</h2>
          <p>480 днів на дитину, з яких 90 зарезервовано для кожного з батьків (так звані „pappamånader” — батьківські місяці) і не можуть бути передані. Мета: обоє батьків залишаються вдома. Перший день народження дитини у Швеції зазвичай святкують двоє трохи втомлених дорослих, а не один.</p>
          <h2>Домашні обов'язки</h2>
          <p>Готування, прибирання, догляд за дітьми та домашня адміністрація у Швеції не є гендерно закріпленими завданнями — принаймні не офіційно. Опитування показують, що це країна з найрівнішим розподілом часу на домашню роботу. (Статистика, як підлітки, трохи бреше.)</p>
          <h2>Жінки та праця</h2>
          <p>Участь жінок у робочій силі — серед найвищих у світі (~80%). Гендерний розрив в оплаті праці реальний (~10–12%), але скорочується. Материнська смертність — серед найнижчих у світі.</p>
          ${ebookFactBox('uk', null, 'Одностатеві шлюби: 2009 · Ознаки дискримінації: 7 · Батьківська відпустка: 480 днів · Зарезервовано на кожного з батьків: по 90 днів.', ['uhrStudyMaterial'])}
        `,
      },
    },

    6: {
      kicker: {
        en: 'Chapter 06 · Society',
        sv: 'Kapitel 06 · Samhälle',
        'zh-Hans': '第 06 章 · 社会',
        'zh-Hant': '第 06 章 · 社會',
        ar: 'الفصل 06 · المجتمع',
        ckb: 'بەشی 06 · کۆمەڵگا',
        fa: 'فصل 06 · جامعه',
        pl: 'Rozdział 06 · Społeczeństwo',
        so: 'Cutubka 06 · Bulsho',
        ti: 'ምዕራፍ 06 · ሕብረተሰብ',
        tr: 'Bölüm 06 · Toplum',
        uk: 'Розділ 06 · Суспільство',
      },
      title: {
        en: 'Society, school,',
        sv: 'Samhälle, skola',
        'zh-Hans': '社会、学校，',
        'zh-Hant': '社會、學校，',
        ar: 'المجتمع والمدرسة',
        ckb: 'کۆمەڵگا، قوتابخانە،',
        fa: 'جامعه، مدرسه،',
        pl: 'Społeczeństwo, szkoła',
        so: 'Bulshada, iskuulka',
        ti: 'ሕብረተሰብ፣ ቤት ትምህርቲ',
        tr: 'Toplum, okul',
        uk: 'Суспільство, школа',
      },
      title_em: {
        en: 'and healthcare.',
        sv: 'och vård.',
        'zh-Hans': '以及医疗。',
        'zh-Hant': '以及醫療。',
        ar: 'والرعاية الصحية.',
        ckb: 'و چاودێری تەندروستی.',
        fa: 'و بهداشت و درمان.',
        pl: 'i opieka zdrowotna.',
        so: 'iyo daryeelka caafimaadka.',
        ti: 'ክንክን ጥዕናን።',
        tr: 've sağlık hizmetleri.',
        uk: "та охорона здоров'я.",
      },
      lede: {
        en: 'Sweden runs the boring parts of life — school, healthcare, eldercare — through the public sector, and is largely on first-name terms with its bureaucrats.',
        sv: 'Sverige sköter livets tråkiga delar — skola, vård, äldreomsorg — i offentlig regi, och är på förnamn med byråkraterna.',
        'zh-Hans':
          '瑞典把生活中那些枯燥的部分——学校、医疗、养老——都交由公共部门来运作，而且和它的公务员们大多以名相称、关系融洽。',
        'zh-Hant':
          '瑞典把生活中那些枯燥的部分——學校、醫療、養老——都交由公共部門來運作，而且和它的公務員們大多以名相稱、關係融洽。',
        ar: 'تدير السويد الأجزاء المملّة من الحياة — المدرسة والرعاية الصحية ورعاية المسنّين — عبر القطاع العام، وهي على علاقة ودّية باسم الشخص الأول مع موظفيها البيروقراطيين إلى حد كبير.',
        ckb: 'سوید بەشە بێزارکەرەکانی ژیان — قوتابخانە، چاودێری تەندروستی، چاودێری بەساڵاچووان — لە ڕێگەی کەرتی گشتییەوە بەڕێوە دەبات، و زۆربەی کات بە ناوی یەکەمەوە لەگەڵ کارمەندە بیرۆکراتەکانیدا قسە دەکات.',
        fa: 'سوئد بخش‌های کسالت‌بار زندگی را — مدرسه، بهداشت، مراقبت از سالمندان — از طریق بخش عمومی اداره می‌کند و تا حد زیادی با کارمندان دیوان‌سالار خود به نام کوچک خطاب می‌شود.',
        pl: 'Szwecja prowadzi nudne części życia — szkołę, opiekę zdrowotną, opiekę nad seniorami — przez sektor publiczny i w dużej mierze jest ze swoimi urzędnikami na „ty”.',
        so: 'Iswiidhan waxay qaybaha caajiska ah ee nolosha — iskuulka, daryeelka caafimaadka, daryeelka waayeelka — ku maamushaa qaybta dawliga ah, badanaana magaca ayey ku wadaa la sarkaalkeeda.',
        ti: 'ሽወደን ነቶም ኣሰልችዉ ክፋላት ህይወት — ቤት ትምህርቲ፣ ክንክን ጥዕና፣ ክንክን ኣረጋውያን — ብህዝባዊ ጽላት ተካይዶም፣ ምስ ቢሮክራትታታ ድማ መብዛሕትኡ ግዜ ብስም ትዘራረብ።',
        tr: 'İsveç hayatın sıkıcı kısımlarını — okul, sağlık, yaşlı bakımı — kamu sektörü aracılığıyla yürütür ve bürokratlarıyla büyük ölçüde samimi (ismiyle hitap eden) bir ilişki içindedir.',
        uk: "Швеція веде нудні частини життя — школу, охорону здоров'я, догляд за літніми — через державний сектор і здебільшого спілкується зі своїми чиновниками на ім'я.",
      },
      body: {
        en: `
          <h2>School</h2>
          <p>Compulsory school (<em>grundskolan</em>) is ten years, from age 6 (förskoleklass) through 9th grade. After that, three years of upper secondary (<em>gymnasium</em>) — academic or vocational tracks, both free. University is also free for citizens, EU/EEA residents, and people with a Swedish residence permit.</p>
          <p>The Education Act guarantees equal access regardless of background, gender, or where you live. Private and "free" schools (<em>friskolor</em>) exist but cannot charge tuition.</p>
          <h2>Healthcare</h2>
          <p>Healthcare is mostly tax-funded and runs at the regional level (21 regions). You pay a small fee (typically 100–400 SEK) per visit to a doctor, and prescription drugs and hospital fees are capped per year (the <em>högkostnadsskydd</em>). Children's healthcare is free.</p>
          <p>1177 is the national health hotline and website. Routine care goes through your <em>vårdcentral</em>; emergencies through <em>akutmottagning</em>; mental and dental care exist but with different fee rules.</p>
          <h2>Eldercare</h2>
          <p>The municipality runs eldercare — home help (<em>hemtjänst</em>), special accommodation, and emergency alarms. The principle is the right to live independently for as long as possible; the practice is uneven by municipality.</p>
          <h2>Social services</h2>
          <p>Socialtjänsten supports anyone unable to support themselves — financial assistance (försörjningsstöd), child welfare, addiction support, family help. They also have legal obligations to intervene where a child is at risk.</p>
          ${ebookFactBox('en', 'Facts to review', 'Compulsory school: 10 years (förskoleklass + grades 1–9) · Health hotline: 1177 · Number of regions: 21 · University tuition: free for residents.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Skolan ska ge barn kunskaper och likvärdiga möjligheter. Grundskolan omfattar förskoleklass och årskurs 1-9.',
            'Regionerna ansvarar för hälso- och sjukvård. 1177 används för sjukvårdsrådgivning och kontakt med vården.',
            'Kommunerna ansvarar för äldreomsorg, socialtjänst och många vardagliga välfärdstjänster.',
            'Socialtjänsten kan ge stöd när någon behöver skydd, råd, ekonomisk hjälp eller omsorg.',
          ],
          'Grundskola: 10 år · 1177 · Regioner ansvarar för vård · Kommuner ansvarar för omsorg och socialtjänst.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>学校</h2>
          <p>义务教育学校（<em>grundskolan，基础学校</em>）为期十年，从 6 岁的 förskoleklass（学前班）一直到九年级。之后是三年的高中（<em>gymnasium</em>）——分学术方向或职业方向，两者都免费。对公民、EU/EEA（欧盟/欧洲经济区）居民以及持有瑞典居留许可的人来说，大学也是免费的。</p>
          <p>《教育法》保障人人享有平等的入学机会，无论其出身、性别或居住地为何。私立学校和所谓的“自由学校”（<em>friskolor</em>）也存在，但不得收取学费。</p>
          <h2>医疗</h2>
          <p>医疗大多由税收提供资金，并在区域层级（21 个 region）运作。你每次看医生要支付一笔小额费用（通常为 100–400 SEK），而处方药和住院费用每年都有封顶（即 <em>högkostnadsskydd（高额费用保护上限）</em>）。儿童医疗免费。</p>
          <p>1177 是全国性的医疗热线和网站。日常就医通过你的 <em>vårdcentral（社区医疗中心）</em>；急症则通过 <em>akutmottagning（急诊）</em>；心理和牙科医疗也有，但适用不同的收费规则。</p>
          <h2>养老</h2>
          <p>养老由 kommun（市镇）负责——包括居家照护（<em>hemtjänst</em>）、特殊住宿和紧急呼叫警报。其原则是让人尽可能长久地独立生活；而实际情况则因 kommun 而异，参差不齐。</p>
          <h2>社会服务</h2>
          <p>Socialtjänsten（社会服务局）为任何无法自食其力的人提供支持——经济援助（försörjningsstöd）、儿童福利、成瘾问题支持以及家庭帮助。在儿童面临风险的情况下，他们还负有依法介入的义务。</p>
          ${ebookFactBox('zh-Hans', null, '义务教育：10 年（förskoleklass + 1–9 年级） · 医疗热线：1177 · region 数量：21 · 大学学费：对居民免费。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>學校</h2>
          <p>義務教育學校（<em>grundskolan，基礎學校</em>）為期十年，從 6 歲的 förskoleklass（學前班）一直到九年級。之後是三年的高中（<em>gymnasium</em>）——分學術方向或職業方向，兩者都免費。對公民、EU/EEA（歐盟／歐洲經濟區）居民以及持有瑞典居留許可的人來說，大學也是免費的。</p>
          <p>《教育法》保障人人享有平等的入學機會，無論其出身、性別或居住地為何。私立學校和所謂的「自由學校」（<em>friskolor</em>）也存在，但不得收取學費。</p>
          <h2>醫療</h2>
          <p>醫療大多由稅收提供資金，並在區域層級（21 個 region）運作。你每次看醫生要支付一筆小額費用（通常為 100–400 SEK），而處方藥和住院費用每年都有封頂（即 <em>högkostnadsskydd（高額費用保護上限）</em>）。兒童醫療免費。</p>
          <p>1177 是全國性的醫療熱線和網站。日常就醫透過你的 <em>vårdcentral（社區醫療中心）</em>；急症則透過 <em>akutmottagning（急診）</em>；心理和牙科醫療也有，但適用不同的收費規則。</p>
          <h2>養老</h2>
          <p>養老由 kommun（市鎮）負責——包括居家照護（<em>hemtjänst</em>）、特殊住宿和緊急呼叫警報。其原則是讓人盡可能長久地獨立生活；而實際情況則因 kommun 而異，參差不齊。</p>
          <h2>社會服務</h2>
          <p>Socialtjänsten（社會服務局）為任何無法自食其力的人提供支持——經濟援助（försörjningsstöd）、兒童福利、成癮問題支持以及家庭幫助。在兒童面臨風險的情況下，他們還負有依法介入的義務。</p>
          ${ebookFactBox('zh-Hant', null, '義務教育：10 年（förskoleklass + 1–9 年級） · 醫療熱線：1177 · region 數量：21 · 大學學費：對居民免費。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>المدرسة</h2>
          <p>المدرسة الإلزامية (<em>grundskolan</em>) عشر سنوات، من سن 6 (الصف التحضيري، förskoleklass) حتى الصف التاسع. بعد ذلك ثلاث سنوات من المرحلة الثانوية العليا (<em>gymnasium</em>) — مساران أكاديمي أو مهني، وكلاهما مجاني. والجامعة مجانية أيضًا للمواطنين، ولمقيمي الاتحاد الأوروبي/المنطقة الاقتصادية الأوروبية، ولمن لديهم تصريح إقامة سويدي.</p>
          <p>قانون التعليم يضمن المساواة في الوصول بغضّ النظر عن الخلفية أو الجنس أو مكان السكن. توجد مدارس خاصة و"حرة" (<em>friskolor</em>) لكنها لا تستطيع فرض رسوم دراسية.</p>
          <h2>الرعاية الصحية</h2>
          <p>الرعاية الصحية ممولة في الغالب من الضرائب وتُدار على المستوى الإقليمي (21 إقليمًا). تدفع رسمًا صغيرًا (عادةً 100–400 كرونة) لكل زيارة طبيب، وأدوية الوصفات ورسوم المستشفى مسقوفة سنويًا (الحماية من التكاليف العالية، <em>högkostnadsskydd</em>). ورعاية الأطفال الصحية مجانية.</p>
          <p>1177 هو الخط الساخن والموقع الصحي الوطني. الرعاية الاعتيادية تمر عبر مركزك الصحي (<em>vårdcentral</em>)؛ والطوارئ عبر قسم الطوارئ (<em>akutmottagning</em>)؛ والرعاية النفسية والأسنان موجودة لكن بقواعد رسوم مختلفة.</p>
          <h2>رعاية المسنّين</h2>
          <p>تدير البلدية رعاية المسنّين — المساعدة المنزلية (<em>hemtjänst</em>)، والسكن الخاص، وأجهزة إنذار الطوارئ. المبدأ هو الحق في العيش باستقلالية لأطول فترة ممكنة؛ والتطبيق متفاوت بحسب البلدية.</p>
          <h2>الخدمات الاجتماعية</h2>
          <p>الخدمات الاجتماعية (Socialtjänsten) تدعم كل من لا يستطيع إعالة نفسه — المساعدة المالية (الدعم المعيشي، försörjningsstöd)، ورعاية الطفل، ودعم الإدمان، ومساعدة الأسرة. ولها أيضًا التزامات قانونية بالتدخل حيث يكون الطفل في خطر.</p>
          ${ebookFactBox('ar', null, 'المدرسة الإلزامية: 10 سنوات (förskoleklass + الصفوف 1–9) · الخط الساخن الصحي: 1177 · عدد الأقاليم: 21 · رسوم الجامعة: مجانية للمقيمين.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>قوتابخانە</h2>
          <p>قوتابخانەی ناچاری (<em>grundskolan</em>) دە ساڵە، لە تەمەنی 6 ـەوە (پۆلی پێش‌قوتابخانە، förskoleklass) تا پۆلی نۆیەم. دوای ئەوە، سێ ساڵ خوێندنی ئامادەیی (<em>gymnasium</em>) — ڕێڕەوی ئەکادیمی یان پیشەیی، هەردووکیان بەخۆڕاییە. زانکۆش بەخۆڕاییە بۆ هاوڵاتییان، دانیشتووانی یەکێتیی ئەوروپا/ناوچەی ئابووریی ئەوروپا، و ئەوانەی مۆڵەتی نیشتەجێبوونی سویدیان هەیە.</p>
          <p>یاسای پەروەردە دەستڕاگەیشتنی یەکسان دەستەبەر دەکات بەبێ گوێدانە ڕەچەڵەک، ڕەگەز، یان شوێنی نیشتەجێبوون. قوتابخانەی تایبەت و "ئازاد" (<em>friskolor</em>) هەن بەڵام ناتوانن کرێی خوێندن وەربگرن.</p>
          <h2>چاودێری تەندروستی</h2>
          <p>چاودێری تەندروستی بەزۆری لە باجەوە تەرخان دەکرێت و لە ئاستی هەرێمیدا بەڕێوە دەچێت (21 هەرێم). بۆ هەر سەردانێکی پزیشک کرێیەکی بچووک دەدەیت (بەزۆری 100–400 کرۆن)، و دەرمانی ڕەچەتە و کرێی نەخۆشخانە بە ساڵانە سنووردارن (پاراستن لە تێچووی بەرز، <em>högkostnadsskydd</em>). چاودێری تەندروستی منداڵان بەخۆڕاییە.</p>
          <p>1177 هێڵی تەلەفۆن و ماڵپەڕی نیشتمانیی تەندروستییە. چاودێری ئاسایی لە ڕێگەی ناوەندی تەندروستیتەوە (<em>vårdcentral</em>) دەبێت؛ کەیسە بەپەلەکان لە ڕێگەی بەشی فریاکەوتنەوە (<em>akutmottagning</em>)؛ چاودێری دەروونی و ددان هەن بەڵام بە یاسای کرێی جیاواز.</p>
          <h2>چاودێری بەساڵاچووان</h2>
          <p>شارەوانی چاودێری بەساڵاچووان بەڕێوە دەبات — یارمەتیی ماڵەوە (<em>hemtjänst</em>)، نیشتەجێبوونی تایبەت، و ئامێرەکانی ئاگادارکردنەوەی فریاکەوتن. بنەماکە مافی ژیانی سەربەخۆیە بۆ درێژترین ماوەی گونجاو؛ بەڵام لە کردەوەدا لە شارەوانییەکەوە بۆ ئەوی تر جیاوازە.</p>
          <h2>خزمەتگوزاری کۆمەڵایەتی</h2>
          <p>خزمەتگوزاری کۆمەڵایەتی (Socialtjänsten) پشتگیریی هەر کەسێک دەکات کە ناتوانێت خۆی بەخێو بکات — یارمەتیی دارایی (پشتگیریی بژێوی، försörjningsstöd)، خۆشگوزەرانیی منداڵ، پشتگیریی لادان لە مادە هۆشبەرەکان، یارمەتیی خێزان. هەروەها ئەرکی یاساییان هەیە بۆ دەستێوەردان لەو شوێنانەی منداڵێک لە مەترسیدایە.</p>
          ${ebookFactBox('ckb', null, 'قوتابخانەی ناچاری: 10 ساڵ (förskoleklass + پۆلەکانی 1–9) · هێڵی تەندروستی: 1177 · ژمارەی هەرێمەکان: 21 · کرێی زانکۆ: بەخۆڕایی بۆ دانیشتووان.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>مدرسه</h2>
          <p>مدرسهٔ اجباری (<em>grundskolan</em>) ده سال است، از سن 6 (کلاس پیش‌دبستانی، förskoleklass) تا کلاس نهم. پس از آن، سه سال دبیرستان (<em>gymnasium</em>) — مسیر دانشگاهی یا فنی‌وحرفه‌ای، هر دو رایگان. دانشگاه نیز برای شهروندان، ساکنان اتحادیهٔ اروپا/منطقهٔ اقتصادی اروپا، و دارندگان اجازهٔ اقامت سوئدی رایگان است.</p>
          <p>قانون آموزش دسترسی برابر را صرف‌نظر از پیشینه، جنسیت، یا محل زندگی تضمین می‌کند. مدارس خصوصی و "آزاد" (<em>friskolor</em>) وجود دارند اما نمی‌توانند شهریه دریافت کنند.</p>
          <h2>بهداشت و درمان</h2>
          <p>بهداشت و درمان عمدتاً از مالیات تأمین می‌شود و در سطح منطقه‌ای اداره می‌شود (21 منطقه). برای هر مراجعه به پزشک هزینهٔ کمی می‌پردازید (معمولاً 100–400 کرون)، و داروهای نسخه‌ای و هزینه‌های بیمارستان سالانه سقف دارند (محافظت در برابر هزینهٔ بالا، <em>högkostnadsskydd</em>). مراقبت بهداشتی کودکان رایگان است.</p>
          <p>1177 خط تلفن و وب‌سایت ملی سلامت است. مراقبت‌های معمول از طریق مرکز درمانی شما (<em>vårdcentral</em>) انجام می‌شود؛ موارد اورژانسی از طریق بخش اورژانس (<em>akutmottagning</em>)؛ مراقبت روانی و دندان‌پزشکی وجود دارد اما با قواعد هزینهٔ متفاوت.</p>
          <h2>مراقبت از سالمندان</h2>
          <p>شهرداری مراقبت از سالمندان را اداره می‌کند — کمک خانگی (<em>hemtjänst</em>)، اقامتگاه‌های ویژه، و دستگاه‌های هشدار اضطراری. اصل، حق زندگی مستقل تا حد امکان است؛ اما در عمل از شهرداری تا شهرداری ناهموار است.</p>
          <h2>خدمات اجتماعی</h2>
          <p>خدمات اجتماعی (Socialtjänsten) از هر کسی که قادر به تأمین معاش خود نیست حمایت می‌کند — کمک مالی (کمک‌هزینهٔ معیشت، försörjningsstöd)، رفاه کودک، حمایت در برابر اعتیاد، کمک به خانواده. آن‌ها همچنین تعهدات قانونی برای مداخله در جایی که کودکی در خطر است دارند.</p>
          ${ebookFactBox('fa', null, 'مدرسهٔ اجباری: 10 سال (förskoleklass + کلاس‌های 1–9) · خط تلفن سلامت: 1177 · تعداد مناطق: 21 · شهریهٔ دانشگاه: رایگان برای ساکنان.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Szkoła</h2>
          <p>Szkoła obowiązkowa (<em>grundskolan</em>) trwa dziesięć lat, od 6. roku życia (förskoleklass — klasa zerowa) do 9. klasy. Potem trzy lata szkoły średniej II stopnia (<em>gymnasium</em>) — w trybie ogólnokształcącym lub zawodowym, oba bezpłatne. Uniwersytet jest również bezpłatny dla obywateli, rezydentów EU/EEA oraz osób z szwedzkim zezwoleniem na pobyt.</p>
          <p>Ustawa oświatowa gwarantuje równy dostęp niezależnie od pochodzenia, płci czy miejsca zamieszkania. Szkoły prywatne i „wolne” (<em>friskolor</em>) istnieją, ale nie mogą pobierać czesnego.</p>
          <h2>Opieka zdrowotna</h2>
          <p>Opieka zdrowotna jest w większości finansowana z podatków i działa na poziomie regionalnym (21 regionów). Płacisz niewielką opłatę (zwykle 100–400 SEK) za wizytę u lekarza, a koszty leków na receptę i opłaty szpitalne mają roczny limit (<em>högkostnadsskydd</em> — ochrona przed wysokimi kosztami). Opieka zdrowotna dla dzieci jest bezpłatna.</p>
          <p>1177 to krajowa infolinia i strona zdrowotna. Rutynowa opieka odbywa się przez twój <em>vårdcentral</em> (przychodnia); nagłe przypadki przez <em>akutmottagning</em> (oddział ratunkowy); opieka psychiatryczna i stomatologiczna istnieje, ale z innymi zasadami opłat.</p>
          <h2>Opieka nad seniorami</h2>
          <p>Opiekę nad seniorami prowadzi gmina — pomoc domowa (<em>hemtjänst</em>), mieszkania specjalne i alarmy awaryjne. Zasadą jest prawo do samodzielnego życia tak długo, jak to możliwe; praktyka bywa nierówna w zależności od gminy.</p>
          <h2>Usługi społeczne</h2>
          <p>Socialtjänsten (służby społeczne) wspierają każdego, kto nie jest w stanie się utrzymać — pomoc finansowa (försörjningsstöd), opieka nad dziećmi, wsparcie w uzależnieniach, pomoc rodzinom. Mają też prawny obowiązek interweniować, gdy dziecku grozi niebezpieczeństwo.</p>
          ${ebookFactBox('pl', null, 'Szkoła obowiązkowa: 10 lat (förskoleklass + klasy 1–9) · Infolinia zdrowotna: 1177 · Liczba regionów: 21 · Czesne na uniwersytecie: bezpłatne dla rezydentów.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Iskuulka</h2>
          <p>Iskuulka qasabka ah (<em>grundskolan</em>) waa toban sano, laga bilaabo da'da 6 (förskoleklass — fasalka ka horreeya dugsiga) ilaa fasalka 9-aad. Intaa ka dib, saddex sano oo dugsi sare ah (<em>gymnasium</em>) — waddooyin tacliimeed ama xirfadeed, labadaba waa bilaash. Jaamacaddu sidoo kale waa bilaash muwaadiniinta, dadka deggan EU/EEA, iyo dadka haysta sharciga deganaanshaha Iswiidhan.</p>
          <p>Sharciga Waxbarashada wuxuu dammaanad qaadayaa helitaan siman iyadoon loo eegin asalka, jinsiga ama meesha aad deggan tahay. Iskuullada gaarka loo leeyahay iyo kuwa "xorta ah" (<em>friskolor</em>) way jiraan laakiin lacag waxbarasho ma qaadan karaan.</p>
          <h2>Daryeelka caafimaadka</h2>
          <p>Daryeelka caafimaadku inta badan waxaa lagu maalgeliyaa canshuur wuxuuna ka shaqeeyaa heer gobol (21 region). Waxaad bixisaa khidmad yar (caadi ahaan 100–400 SEK) booqasho kasta oo dhakhtar, daawooyinka rijeetada iyo khidmadaha isbitaalka ayaa sannad walba xad leh (<em>högkostnadsskydd</em> — ka ilaalinta kharashka sare). Daryeelka caafimaadka carruurtu waa bilaash.</p>
          <p>1177 waa khadka caafimaadka qaranka iyo websaydhka. Daryeelka caadiga ah wuxuu maraa <em>vårdcentral</em>-kaaga (xarunta caafimaadka); xaaladaha degdega ah waxay maraan <em>akutmottagning</em> (qaybta gargaarka degdega ah); daryeelka maskaxda iyo ilkaha way jiraan laakiin xeerar khidmad oo kala duwan.</p>
          <h2>Daryeelka waayeelka</h2>
          <p>Degmadu waxay maamushaa daryeelka waayeelka — caawimaadda guriga (<em>hemtjänst</em>), hoy gaar ah, iyo digniin degdeg ah. Mabda'u waa xaqa lagu noolaado si madax-bannaan inta ugu badan ee suurtagal ah; dhaqankuna wuu kala duwan yahay degmo ahaan.</p>
          <h2>Adeegyada bulshada</h2>
          <p>Socialtjänsten (adeegyada bulshada) waxay taageeraan qof kasta oo aan is-masruufi karin — caawimaad maaliyadeed (försörjningsstöd), daryeelka carruurta, taageerada balwadda, caawimaadda qoyska. Waxay sidoo kale leeyihiin waajibaad sharci ah inay farageliyaan halka ilmo khatar ku jiro.</p>
          ${ebookFactBox('so', null, 'Iskuulka qasabka ah: 10 sano (förskoleklass + fasallada 1–9) · Khadka caafimaadka: 1177 · Tirada region: 21 · Lacagta jaamacadda: bilaash dadka deggan.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ቤት ትምህርቲ</h2>
          <p>ግዴታዊ ቤት ትምህርቲ (<em>grundskolan</em>) ዓሰርተ ዓመት እዩ፣ ካብ 6 ዓመት (förskoleklass — ቅድመ ትምህርቲ ክፍሊ) ክሳብ 9 ክፍሊ። ድሕሪኡ፣ ሰለስተ ዓመት ላዕለዋይ ካልኣይ ደረጃ (<em>gymnasium</em>) — ኣካዳሚያዊ ወይ ሞያዊ መንገድታት፣ ክልቲኦም ብናጻ። ዩኒቨርሲቲ እውን ንዜጋታት፣ ነበርቲ EU/EEA ከምኡ’ውን ሽወደናዊ መንበሪ ፍቓድ ንዘለዎም ሰባት ብናጻ እዩ።</p>
          <p>ሕጊ ትምህርቲ ብዘይ ኣፈላላይ ድሕረ ባይታ፣ ጾታ ወይ መንበሪ ቦታ ማዕረ ተበጻሕነት የረጋግጽ። ብሕታውያንን „ናጻ” ኣብያተ ትምህርትን (<em>friskolor</em>) ኣለዉ ግን ክፍሊት ትምህርቲ ክወስዱ ኣይክእሉን።</p>
          <h2>ክንክን ጥዕና</h2>
          <p>ክንክን ጥዕና መብዛሕትኡ ብቐረጽ ይምወል ኣብ ዞባዊ ደረጃ ድማ ይሰርሕ (21 region)። ኣብ ነፍሲ ወከፍ ናብ ሓኪም ምብጻሕ ንእሽቶ ክፍሊት (ብልሙድ 100–400 SEK) ትኸፍል፣ ብትእዛዝ ሓኪም ዝውሰዱ መድሃኒታትን ናይ ሆስፒታል ክፍሊትን ኣብ ዓመት ደረት ኣለዎም (<em>högkostnadsskydd</em> — ካብ ላዕለዋይ ወጻኢ ምክልኻል)። ክንክን ጥዕና ቆልዑ ብናጻ እዩ።</p>
          <p>1177 ሃገራዊ ናይ ጥዕና መስመርን መርበብ ሓበሬታን እዩ። ልሙድ ክንክን ብመንገዲ <em>vårdcentral</em>ካ (ማእከል ክንክን) ይኸይድ፣ ህጹጽ ኩነታት ብመንገዲ <em>akutmottagning</em> (ክፍሊ ህጹጽ ረድኤት)፣ ናይ ኣእምሮን ስኒን ክንክን ኣለዉ ግን ብዝተፈላለየ ሕግታት ክፍሊት።</p>
          <h2>ክንክን ኣረጋውያን</h2>
          <p>እቲ kommun ንክንክን ኣረጋውያን የካይዶ — ናይ ገዛ ሓገዝ (<em>hemtjänst</em>)፣ ፍሉይ መንበሪ፣ ህጹጽ ኣላርማት። እቲ መትከል ክሳብ ዝከኣል ብናጻ ናይ ምንባር መሰል እዩ፣ እቲ ግብራዊ ኣፈጻጽማ ግን ብkommun ይፈላለ።</p>
          <h2>ማሕበራዊ ኣገልግሎታት</h2>
          <p>Socialtjänsten (ማሕበራዊ ኣገልግሎታት) ንርእሱ ክናብ ዘይክእል ዝኾነ ሰብ ይድግፉ — ገንዘባዊ ሓገዝ (försörjningsstöd)፣ ድሕነት ቆልዑ፣ ደገፍ ወልፊ፣ ናይ ስድራ ሓገዝ። ቆልዓ ኣብ ሓደጋ ኣብ ዘለወሉ ጣልቃ ናይ ምእታው ሕጋዊ ግዴታታት እውን ኣለዎም።</p>
          ${ebookFactBox('ti', null, 'ግዴታዊ ቤት ትምህርቲ፦ 10 ዓመት (förskoleklass + ክፍሊ 1–9) · ናይ ጥዕና መስመር፦ 1177 · ቍጽሪ region፦ 21 · ናይ ዩኒቨርሲቲ ክፍሊት፦ ንነበርቲ ብናጻ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Okul</h2>
          <p>Zorunlu okul (<em>grundskolan</em>) on yıldır; 6 yaşından (förskoleklass — okul öncesi sınıf) 9. sınıfa kadar. Ardından üç yıllık lise (<em>gymnasium</em>) — akademik veya mesleki kollar, ikisi de ücretsiz. Üniversite de vatandaşlar, EU/EEA sakinleri ve İsveç oturum izni olan kişiler için ücretsizdir.</p>
          <p>Eğitim Yasası, geçmiş, cinsiyet veya yaşadığınız yer ne olursa olsun eşit erişimi güvence altına alır. Özel ve "serbest" okullar (<em>friskolor</em>) vardır ama harç alamaz.</p>
          <h2>Sağlık hizmetleri</h2>
          <p>Sağlık hizmetleri çoğunlukla vergiyle finanse edilir ve bölgesel düzeyde işler (21 region). Bir doktor ziyareti başına küçük bir ücret (genellikle 100–400 SEK) ödersiniz; reçeteli ilaçlar ve hastane ücretleri yıllık olarak sınırlandırılmıştır (<em>högkostnadsskydd</em> — yüksek maliyete karşı koruma). Çocuk sağlığı hizmetleri ücretsizdir.</p>
          <p>1177 ulusal sağlık hattı ve web sitesidir. Rutin bakım <em>vårdcentral</em>'ınız (sağlık merkezi) aracılığıyla; acil durumlar <em>akutmottagning</em> (acil servis) aracılığıyla yürür; ruh sağlığı ve diş bakımı vardır ama farklı ücret kurallarıyla.</p>
          <h2>Yaşlı bakımı</h2>
          <p>Yaşlı bakımını belediye yürütür — evde yardım (<em>hemtjänst</em>), özel konaklama ve acil alarmlar. İlke, mümkün olduğunca uzun süre bağımsız yaşama hakkıdır; uygulama belediyeye göre değişkendir.</p>
          <h2>Sosyal hizmetler</h2>
          <p>Socialtjänsten (sosyal hizmetler) geçimini sağlayamayan herkesi destekler — mali yardım (försörjningsstöd), çocuk refahı, bağımlılık desteği, aile yardımı. Bir çocuğun risk altında olduğu durumlarda müdahale etme yasal yükümlülükleri de vardır.</p>
          ${ebookFactBox('tr', null, 'Zorunlu okul: 10 yıl (förskoleklass + 1–9. sınıflar) · Sağlık hattı: 1177 · region sayısı: 21 · Üniversite harcı: sakinler için ücretsiz.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Школа</h2>
          <p>Обов'язкова школа (<em>grundskolan</em>) триває десять років, від 6 років (förskoleklass — підготовчий клас) до 9 класу. Після цього три роки старшої середньої школи (<em>gymnasium</em>) — академічний або професійний напрям, обидва безкоштовні. Університет також безкоштовний для громадян, мешканців EU/EEA та осіб зі шведським дозволом на проживання.</p>
          <p>Закон про освіту гарантує рівний доступ незалежно від походження, статі чи місця проживання. Приватні та „вільні” школи (<em>friskolor</em>) існують, але не можуть стягувати плату за навчання.</p>
          <h2>Охорона здоров'я</h2>
          <p>Охорона здоров'я переважно фінансується з податків і діє на регіональному рівні (21 region). Ви платите невеликий збір (зазвичай 100–400 SEK) за візит до лікаря, а вартість рецептурних ліків і лікарняні збори мають річний ліміт (<em>högkostnadsskydd</em> — захист від високих витрат). Охорона здоров'я для дітей безкоштовна.</p>
          <p>1177 — це національна гаряча лінія та вебсайт охорони здоров'я. Планова допомога йде через ваш <em>vårdcentral</em> (медичний центр); невідкладні випадки — через <em>akutmottagning</em> (відділення невідкладної допомоги); психіатрична та стоматологічна допомога існує, але з іншими правилами оплати.</p>
          <h2>Догляд за літніми</h2>
          <p>Догляд за літніми веде муніципалітет — домашня допомога (<em>hemtjänst</em>), спеціальне житло та екстрені сигналізації. Принцип — право жити самостійно якомога довше; на практиці це нерівномірно залежно від муніципалітету.</p>
          <h2>Соціальні служби</h2>
          <p>Socialtjänsten (соціальні служби) підтримують кожного, хто не може себе утримувати — фінансова допомога (försörjningsstöd), захист дітей, підтримка при залежностях, допомога родинам. Вони також мають юридичні обов'язки втручатися, коли дитина в небезпеці.</p>
          ${ebookFactBox('uk', null, "Обов'язкова школа: 10 років (förskoleklass + класи 1–9) · Гаряча лінія здоров'я: 1177 · Кількість region: 21 · Плата за університет: безкоштовно для мешканців.", ['uhrStudyMaterial'])}
        `,
      },
    },

    7: {
      kicker: {
        en: 'Chapter 07 · Nature',
        sv: 'Kapitel 07 · Natur',
        'zh-Hans': '第 07 章 · 自然',
        'zh-Hant': '第 07 章 · 自然',
        ar: 'الفصل 07 · الطبيعة',
        ckb: 'بەشی 07 · سروشت',
        fa: 'فصل 07 · طبیعت',
        pl: 'Rozdział 07 · Przyroda',
        so: 'Cutubka 07 · Dabeecad',
        ti: 'ምዕራፍ 07 · ተፈጥሮ',
        tr: 'Bölüm 07 · Doğa',
        uk: 'Розділ 07 · Природа',
      },
      title: {
        en: 'Nature, climate,',
        sv: 'Natur, klimat',
        'zh-Hans': '自然、气候，',
        'zh-Hant': '自然、氣候，',
        ar: 'الطبيعة والمناخ',
        ckb: 'سروشت، کەشوهەوا،',
        fa: 'طبیعت، اقلیم،',
        pl: 'Przyroda, klimat',
        so: 'Dabeecadda, cimilada',
        ti: 'ተፈጥሮ፣ ክሊማ',
        tr: 'Doğa, iklim',
        uk: 'Природа, клімат',
      },
      title_em: {
        en: 'and allemansrätten.',
        sv: 'och allemansrätten.',
        'zh-Hans': '以及 allemansrätten。',
        'zh-Hant': '以及 allemansrätten。',
        ar: 'وحق الوصول العام (allemansrätten).',
        ckb: 'و مافی دەستڕاگەیشتنی گشتی (allemansrätten).',
        fa: 'و حق دسترسی همگانی (allemansrätten).',
        pl: 'i allemansrätten.',
        so: 'iyo allemansrätten.',
        ti: 'ከምኡ’ውን allemansrätten።',
        tr: 've allemansrätten.',
        uk: 'та allemansrätten.',
      },
      lede: {
        en: "Sweden is mostly forest, and the forest is mostly open to you. The rule is simple: don't disturb, don't destroy.",
        sv: 'Sverige är mest skog, och skogen är mest öppen för dig. Regeln är enkel: stör inte, förstör inte.',
        'zh-Hans': '瑞典大部分是森林，而森林大部分向你敞开。规则很简单：不打扰，不破坏。',
        'zh-Hant': '瑞典大部分是森林，而森林大部分向你敞開。規則很簡單：不打擾，不破壞。',
        ar: 'السويد معظمها غابات، والغابة معظمها مفتوحة لك. القاعدة بسيطة: لا تُزعِج، ولا تُدمِّر.',
        ckb: 'سوید زۆربەی دارستانە، و دارستانیش زۆربەی بۆ تۆ کراوەیە. ڕێسا سادەیە: مەبە مایەی ئاژاوە، تێکمەدە.',
        fa: 'سوئد بیشتر جنگل است، و جنگل بیشتر برای شما باز است. قاعده ساده است: مزاحم نشو، تخریب نکن.',
        pl: 'Szwecja to głównie las, a las jest w większości otwarty dla ciebie. Zasada jest prosta: nie zakłócaj, nie niszcz.',
        so: 'Iswiidhan inta badan waa kayn, kayntuna inta badan way kuu furan tahay. Qaaciddadu waa fudud tahay: ha carqaladayn, ha burburin.',
        ti: 'ሽወደን መብዛሕትኣ ጫካ እያ፣ እቲ ጫካ ድማ መብዛሕትኡ ንዓኻ ክፉት እዩ። እቲ ሕጊ ቀሊል እዩ፦ ኣይተረብሽ፣ ኣይተበላሹ።',
        tr: 'İsveç çoğunlukla ormandır ve orman büyük ölçüde size açıktır. Kural basit: rahatsız etme, tahrip etme.',
        uk: 'Швеція — це переважно ліс, і ліс здебільшого відкритий для вас. Правило просте: не турбуй, не руйнуй.',
      },
      body: {
        en: `
          <h2>The right of public access (allemansrätten)</h2>
          <p>Almost any land in Sweden — forest, field, shore — is open to walking, picking berries, swimming, foraging, camping (one night), and quiet enjoyment. It is a custom, not a written law, but it is taken seriously.</p>
          <p>The catch: <em>"Inte störa, inte förstöra"</em> — do not disturb, do not destroy. You may not enter private gardens or pitch a tent in someone's view. You may not light fires when there's a fire ban. You may not take downed wood for sale, or pick protected species.</p>
          <h2>Geography</h2>
          <p>Sweden is the fifth-largest country in Europe. Its geography mixes forest, lakes, mountains, agricultural land, and a long coastline. The longest river is Klarälven–Göta älv (about 720 km). The largest lake is Vänern.</p>
          <h2>Climate and seasons</h2>
          <p>Four full seasons, dramatic in the north. Winter is dark; summer has midnight sun above the Arctic Circle. Climate change is making winters warmer and summers wetter; the government has committed to net-zero emissions by 2045.</p>
          <h2>Recycling and the everyday environment</h2>
          <p>Sweden recycles obsessively. Glass, metal, paper, plastic, food waste, batteries, and electronics all go to dedicated bins, often at the local <em>återvinningscentral</em>. Bottle and can returns (<em>pant</em>) come back as a small cash refund.</p>
          ${ebookFactBox('en', 'Facts to review', 'Allemansrätten — the right of public access · Net-zero target year: 2045 · Largest lake: Vänern · Landscape themes: forests, lakes, mountains, and a long coastline.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        sv: svStudyBrief(
          [
            'Allemansrätten gör det möjligt att röra sig i naturen, plocka bär och svamp och vistas ute med hänsyn.',
            'Huvudregeln är enkel: inte störa och inte förstöra. Du får inte skada mark, djur, växter eller gå in på privat tomt.',
            'Sverige har stora skogar, många sjöar, fjäll i norr och lång kust. Klimatet varierar mycket mellan norr och söder.',
            'Miljöarbete märks i vardagen genom återvinning, pant, naturvård och mål för minskade utsläpp.',
          ],
          'Allemansrätten · Inte störa, inte förstöra · Vänern är största sjön · Miljömål och återvinning.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>公众通行权（allemansrätten）</h2>
          <p>瑞典几乎任何土地——森林、田野、海岸——都向人们开放，可以行走、采摘浆果、游泳、觅食、露营（一晚）以及静静地享受自然。它是一种习俗，而非成文法律，但人们对它非常认真。</p>
          <p>但有一个前提：<em>“Inte störa, inte förstöra”（不打扰，不破坏）</em>——不打扰，不破坏。你不可以进入私人花园，也不可以在别人的视野范围内搭帐篷。在禁火期间不可以生火。不可以把倒下的木材拿去出售，也不可以采摘受保护的物种。</p>
          <h2>地理</h2>
          <p>瑞典是欧洲第五大国家。它的地理融合了森林、湖泊、山脉、农业用地和漫长的海岸线。最长的河流是 Klarälven–Göta älv（约 720 公里）。最大的湖泊是 Vänern。</p>
          <h2>气候与季节</h2>
          <p>四季分明，在北部尤为戏剧化。冬季黑暗漫长；夏季在北极圈以北则有午夜阳光。气候变化正让冬季变得更暖、夏季变得更湿；政府已承诺在 2045 年前实现净零排放。</p>
          <h2>回收与日常环境</h2>
          <p>瑞典近乎执着地进行回收。玻璃、金属、纸张、塑料、厨余、电池和电子产品都要投入专门的回收箱，通常是在当地的 <em>återvinningscentral（回收中心）</em>。瓶罐回收（<em>pant</em>，回收押金）则会以一笔小额现金退还的形式返还给你。</p>
          ${ebookFactBox('zh-Hans', null, 'allemansrätten——公众通行权 · 净零目标年份：2045 · 最大湖泊：Vänern · 地貌主题：森林、湖泊、山脉和漫长的海岸线。', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        'zh-Hant': `<h2>公眾通行權（allemansrätten）</h2>
          <p>瑞典幾乎任何土地——森林、田野、海岸——都向人們開放，可以行走、採摘漿果、游泳、覓食、露營（一晚）以及靜靜地享受自然。它是一種習俗，而非成文法律，但人們對它非常認真。</p>
          <p>但有一個前提：<em>「Inte störa, inte förstöra」（不打擾，不破壞）</em>——不打擾，不破壞。你不可以進入私人花園，也不可以在別人的視野範圍內搭帳篷。在禁火期間不可以生火。不可以把倒下的木材拿去出售，也不可以採摘受保護的物種。</p>
          <h2>地理</h2>
          <p>瑞典是歐洲第五大國家。它的地理融合了森林、湖泊、山脈、農業用地和漫長的海岸線。最長的河流是 Klarälven–Göta älv（約 720 公里）。最大的湖泊是 Vänern。</p>
          <h2>氣候與季節</h2>
          <p>四季分明，在北部尤為戲劇化。冬季黑暗漫長；夏季在北極圈以北則有午夜陽光。氣候變遷正讓冬季變得更暖、夏季變得更濕；政府已承諾在 2045 年前實現淨零排放。</p>
          <h2>回收與日常環境</h2>
          <p>瑞典近乎執著地進行回收。玻璃、金屬、紙張、塑膠、廚餘、電池和電子產品都要投入專門的回收箱，通常是在當地的 <em>återvinningscentral（回收中心）</em>。瓶罐回收（<em>pant</em>，回收押金）則會以一筆小額現金退還的形式返還給你。</p>
          ${ebookFactBox('zh-Hant', null, 'allemansrätten——公眾通行權 · 淨零目標年份：2045 · 最大湖泊：Vänern · 地貌主題：森林、湖泊、山脈和漫長的海岸線。', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ar: `<h2>حق الوصول العام (allemansrätten)</h2>
          <p>تقريبًا أي أرض في السويد — غابة، حقل، شاطئ — مفتوحة للمشي وقطف التوت والسباحة والبحث عن الطعام البري والتخييم (ليلة واحدة) والاستمتاع الهادئ. إنه عُرف، وليس قانونًا مكتوبًا، لكنه يؤخذ على محمل الجدّ.</p>
          <p>الشرط: <em>"Inte störa, inte förstöra"</em> — لا تُزعِج، ولا تُدمِّر. لا يجوز لك دخول الحدائق الخاصة أو نصب خيمة في مرأى أحدهم. ولا يجوز إشعال النار حين يكون هناك حظر على إشعال النار. ولا يجوز أخذ الخشب المتساقط للبيع، أو قطف الأنواع المحمية.</p>
          <h2>الجغرافيا</h2>
          <p>السويد خامس أكبر بلد في أوروبا. تمزج جغرافيتها بين الغابات والبحيرات والجبال والأراضي الزراعية وساحل طويل. أطول نهر هو Klarälven–Göta älv (نحو 720 كم). وأكبر بحيرة هي Vänern.</p>
          <h2>المناخ والفصول</h2>
          <p>أربعة فصول كاملة، حادّة في الشمال. الشتاء مظلم؛ والصيف فيه شمس منتصف الليل فوق الدائرة القطبية الشمالية. تغيّر المناخ يجعل الشتاء أدفأ والصيف أكثر مطرًا؛ وقد التزمت الحكومة بصفر انبعاثات صافية بحلول 2045.</p>
          <h2>إعادة التدوير والبيئة اليومية</h2>
          <p>تعيد السويد التدوير بهوس. الزجاج والمعدن والورق والبلاستيك ونفايات الطعام والبطاريات والإلكترونيات كلها تذهب إلى حاويات مخصصة، غالبًا في مركز إعادة التدوير المحلي (<em>återvinningscentral</em>). وإرجاع الزجاجات والعلب (الوديعة، <em>pant</em>) يعود كاسترداد نقدي صغير.</p>
          ${ebookFactBox('ar', null, 'Allemansrätten — حق الوصول العام · سنة هدف صفر الانبعاثات الصافية: 2045 · أكبر بحيرة: Vänern · موضوعات المشهد الطبيعي: الغابات والبحيرات والجبال وساحل طويل.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ckb: `<h2>مافی دەستڕاگەیشتنی گشتی (allemansrätten)</h2>
          <p>بەنزیکەیی هەر زەوییەک لە سویددا — دارستان، کێڵگە، کەناری دەریا — کراوەیە بۆ پیاسەکردن، لێکردنەوەی توو، مەلەکردن، گەڕان بەدوای خۆراکی سروشتیدا، چادر هەڵدان (یەک شەو)، و چێژوەرگرتنی بێدەنگ. ئەمە نەریتە، نەک یاسایەکی نووسراو، بەڵام بەجدی وەردەگیرێت.</p>
          <p>مەرجەکە: <em>"Inte störa, inte förstöra"</em> — مەبە مایەی ئاژاوە، تێکمەدە. ناتوانیت بچیتە ناو باخچە تایبەتەکان یان چادر هەڵبدەیت لە بەرچاوی کەسێکدا. ناتوانیت ئاگر بکەیتەوە کاتێک قەدەغەی ئاگر هەیە. ناتوانیت دارە کەوتووەکان بۆ فرۆشتن ببەیت، یان جۆرە پارێزراوەکان لێبکەیتەوە.</p>
          <h2>جوگرافیا</h2>
          <p>سوید پێنجەمین وڵاتی گەورەی ئەوروپایە. جوگرافیاکەی دارستان، دەریاچە، چیا، زەویی کشتوکاڵی، و کەنارێکی درێژ تێکەڵ دەکات. درێژترین ڕووبار Klarälven–Göta älv ـە (نزیکەی 720 کیلۆمەتر). گەورەترین دەریاچە Vänern ـە.</p>
          <h2>کەشوهەوا و وەرزەکان</h2>
          <p>چوار وەرزی تەواو، لە باکوور دراماتیک. زستان تاریکە؛ هاوین خۆری نیوەشەوی هەیە لە سەرووی بازنەی جەمسەری باکوورەوە. گۆڕانی کەشوهەوا زستانەکان گەرمتر و هاوینەکان باراناویتر دەکات؛ حکومەت پابەند بووە بە سفری دەردانی پاک تا 2045.</p>
          <h2>پیتاندنەوە و ژینگەی ڕۆژانە</h2>
          <p>سوید بە شێوەیەکی وەسواسی پیتاندنەوە دەکات. شووشە، کانزا، کاغەز، پلاستیک، پاشماوەی خواردن، پاتری، و ئەلیکترۆنیات هەموو دەچنە ناو سەتڵی تەرخانکراو، زۆرجار لە ناوەندی پیتاندنەوەی ناوخۆیی (<em>återvinningscentral</em>). گەڕاندنەوەی بوتڵ و قوتوو (سپاردە، <em>pant</em>) وەک گەڕاندنەوەی پارەیەکی بچووک دەگەڕێتەوە.</p>
          ${ebookFactBox('ckb', null, 'Allemansrätten — مافی دەستڕاگەیشتنی گشتی · ساڵی ئامانجی سفری دەردانی پاک: 2045 · گەورەترین دەریاچە: Vänern · بابەتەکانی دیمەنی سروشتی: دارستان، دەریاچە، چیا، و کەنارێکی درێژ.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        fa: `<h2>حق دسترسی همگانی (allemansrätten)</h2>
          <p>تقریباً هر زمینی در سوئد — جنگل، دشت، ساحل — برای پیاده‌روی، چیدن توت، شنا، خوراک‌جویی، چادر زدن (یک شب)، و لذت آرام باز است. این یک عرف است، نه قانون مکتوب، اما جدی گرفته می‌شود.</p>
          <p>شرطش: <em>"Inte störa, inte förstöra"</em> — مزاحم نشو، تخریب نکن. نمی‌توانید وارد باغ‌های خصوصی شوید یا در منظرهٔ کسی چادر بزنید. نمی‌توانید هنگام ممنوعیت آتش، آتش روشن کنید. نمی‌توانید چوب افتاده را برای فروش بردارید، یا گونه‌های حفاظت‌شده را بچینید.</p>
          <h2>جغرافیا</h2>
          <p>سوئد پنجمین کشور بزرگ اروپاست. جغرافیای آن جنگل، دریاچه، کوه، زمین کشاورزی، و خط ساحلی بلند را درمی‌آمیزد. طولانی‌ترین رود Klarälven–Göta älv است (حدود 720 کیلومتر). بزرگ‌ترین دریاچه Vänern است.</p>
          <h2>اقلیم و فصل‌ها</h2>
          <p>چهار فصل کامل، در شمال دراماتیک. زمستان تاریک است؛ تابستان بالای مدار قطبی شمالگان خورشید نیمه‌شب دارد. تغییر اقلیم زمستان‌ها را گرم‌تر و تابستان‌ها را بارانی‌تر می‌کند؛ دولت متعهد به انتشار صفر خالص تا 2045 شده است.</p>
          <h2>بازیافت و محیط زیست روزمره</h2>
          <p>سوئد وسواس‌گونه بازیافت می‌کند. شیشه، فلز، کاغذ، پلاستیک، پسماند غذا، باتری، و لوازم الکترونیکی همگی به سطل‌های اختصاصی می‌روند، اغلب در مرکز بازیافت محلی (<em>återvinningscentral</em>). بازگرداندن بطری و قوطی (ودیعه، <em>pant</em>) به‌صورت بازپرداخت نقدی کوچک برمی‌گردد.</p>
          ${ebookFactBox('fa', null, 'Allemansrätten — حق دسترسی همگانی · سال هدف انتشار صفر خالص: 2045 · بزرگ‌ترین دریاچه: Vänern · مضامین چشم‌انداز: جنگل‌ها، دریاچه‌ها، کوه‌ها، و خط ساحلی بلند.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        pl: `<h2>Prawo do swobodnego dostępu do przyrody (allemansrätten)</h2>
          <p>Niemal każdy teren w Szwecji — las, pole, brzeg — jest otwarty do spacerów, zbierania jagód, kąpieli, zbieractwa, biwakowania (jedna noc) i cichego wypoczynku. To zwyczaj, a nie spisane prawo, ale traktuje się go poważnie.</p>
          <p>Haczyk: <em>„Inte störa, inte förstöra”</em> — nie zakłócaj, nie niszcz. Nie wolno wchodzić do prywatnych ogrodów ani rozbijać namiotu komuś na widoku. Nie wolno rozpalać ognia, gdy obowiązuje zakaz palenia ognisk. Nie wolno zabierać powalonego drewna na sprzedaż ani zbierać gatunków chronionych.</p>
          <h2>Geografia</h2>
          <p>Szwecja jest piątym co do wielkości krajem Europy. Jej geografia łączy lasy, jeziora, góry, tereny rolnicze i długą linię brzegową. Najdłuższa rzeka to Klarälven–Göta älv (około 720 km). Największe jezioro to Vänern.</p>
          <h2>Klimat i pory roku</h2>
          <p>Cztery pełne pory roku, dramatyczne na północy. Zima jest ciemna; latem za kołem podbiegunowym świeci słońce o północy. Zmiana klimatu sprawia, że zimy są cieplejsze, a lata bardziej deszczowe; rząd zobowiązał się do zerowej emisji netto do 2045.</p>
          <h2>Recykling i codzienne środowisko</h2>
          <p>Szwecja recyklinguje obsesyjnie. Szkło, metal, papier, plastik, odpady spożywcze, baterie i elektronika trafiają do osobnych pojemników, często w lokalnym <em>återvinningscentral</em> (punkcie recyklingu). Zwroty butelek i puszek (<em>pant</em> — kaucja) wracają jako niewielki zwrot gotówki.</p>
          ${ebookFactBox('pl', null, 'Allemansrätten — prawo do swobodnego dostępu do przyrody · Rok docelowy zerowej emisji netto: 2045 · Największe jezioro: Vänern · Motywy krajobrazu: lasy, jeziora, góry i długa linia brzegowa.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        so: `<h2>Xaqa helitaanka dadweynaha (allemansrätten)</h2>
          <p>Ku dhowaad dhul kasta oo Iswiidhan ah — kayn, beer, xeeb — wuu u furan yahay socod, gunaynta beriiska, dabaasha, soo-uruurinta, degsiimo (hal habeen), iyo raaxo aamusan. Waa caado, ee maaha sharci qoraal ah, laakiin si dhab ah ayaa loo qaataa.</p>
          <p>Qabashada: <em>"Inte störa, inte förstöra"</em> — ha carqaladayn, ha burburin. Geli kartid beero gaar ah ama teendho dhig kartid meel qof ka muuqato. Dab shidi kartid marka mamnuucista dabku jirto. Qaadan kartid alwaax dhacay si aad u iibiso ama gurin kartid noocyo la ilaaliyo.</p>
          <h2>Juqraafiga</h2>
          <p>Iswiidhan waa dalka shanaad ee ugu weyn Yurub. Juqraafigeedu wuxuu isku daraa kaynta, harooyinka, buuraha, dhulka beeraha, iyo xeeb dheer. Wabiga ugu dheer waa Klarälven–Göta älv (qiyaastii 720 km). Harada ugu weyn waa Vänern.</p>
          <h2>Cimilada iyo xilliyada</h2>
          <p>Afar xilli oo dhammaystiran, kuwaas oo waqooyiga aad uga muuqda. Jiilaalku waa madow; xagaaga waxaa jira qorrax habeenkii oo ka sarreysa Wareegga Arctic. Isbeddelka cimiladu wuxuu jiilaalka ka dhigayaa mid diirran, xagaagana mid roob badan; dawladdu waxay ballan-qaaday hawo-saar net-eber 2045.</p>
          <h2>Dib-u-warshadaynta iyo deegaanka maalinlaha ah</h2>
          <p>Iswiidhan si aad ah ayey wax dib ugu warshadaysaa. Dhalada, biraha, warqadda, balaastiga, qashinka cuntada, batariyada iyo qalabka elektarooniga ah dhammaantood waxay galaan weel gaar ah, badanaa kan maxalliga ah ee <em>återvinningscentral</em> (xarunta dib-u-warshadaynta). Soo-celinta dhalooyinka iyo daasadaha (<em>pant</em> — lacag-dhig) waxay ku soo noqdaan celin lacag yar.</p>
          ${ebookFactBox('so', null, 'Allemansrätten — xaqa helitaanka dadweynaha · Sannadka bartilmaameedka net-eber: 2045 · Harada ugu weyn: Vänern · Mawduucyada muuqaalka dhulka: kaynta, harooyinka, buuraha, iyo xeeb dheer.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ti: `<h2>ህዝባዊ ናይ ምብጻሕ መሰል (allemansrätten)</h2>
          <p>ኣብ ሽወደን ዳርጋ ዝኾነ ይኹን መሬት — ጫካ፣ ግራት፣ ገምገም ባሕሪ — ንምኻድ፣ ቤሪ ንምልቃም፣ ንምሕንባስ፣ ካብ ተፈጥሮ ንምእካብ፣ ንምስፋር (ሓደ ለይቲ)ን ህዱእ ምዝንጋዕን ክፉት እዩ። ልምዲ እዩ፣ ጽሑፍ ሕጊ ኣይኮነን፣ ግን ብቑምነት ይውሰድ።</p>
          <p>እቲ ቅድመ ኩነት፦ <em>„Inte störa, inte förstöra”</em> — ኣይተረብሽ፣ ኣይተበላሹ። ናብ ብሕታዊ ጀርዲን ክትኣቱ ወይ ኣብ ናይ ሰብ ቅርዓት ድንኳን ክትተኽል ኣይፍቀደካን። ናይ ሓዊ ክልከላ ኣብ ዘለወሉ ሓዊ ክተንድድ ኣይፍቀደካን። ንዝወደቐ ዕንጨይቲ ንምሻጥ ክትወስድ ወይ ዝተሓለዉ ዓሌታት ክትልቅም ኣይፍቀደካን።</p>
          <h2>ጂኦግራፊ</h2>
          <p>ሽወደን ኣብ ኤውሮጳ ብስፍሓታ መበል ሓሙሸይቲ ዓባይ ሃገር እያ። ጂኦግራፊኣ ጫካታት፣ ቀላያት፣ ኣኽራን፣ ሕርሻዊ መሬትን ነዊሕ ገምገም ባሕርን የጣምር። እቲ ዝነውሐ ሩባ Klarälven–Göta älv እዩ (ኣስታት 720 km)። እቲ ዝዓበየ ቀላይ Vänern እዩ።</p>
          <h2>ክሊማን ወቕትታትን</h2>
          <p>ኣርባዕተ ምሉኣት ወቕትታት፣ ኣብ ሰሜን ኣዝዮም ዘደንቑ። ክረምቲ ጸልማት እዩ፣ ኣብ ሓጋይ ኣብ ልዕሊ ኣርክቲክ ሰርክል ናይ ፍርቂ ለይቲ ጸሓይ ኣሎ። ለውጢ ኩነታት ኣየር ንክረምቲ ዝሞቐ፣ ንሓጋይ ድማ ዝያዳ ዝናብ ዘለዎ ይገብሮ ኣሎ፣ መንግስቲ ክሳብ 2045 ናብ ኔት-ዜሮ ልቕታ ንምብጻሕ ቃል ኣትዩ።</p>
          <h2>ዳግመ-ምጥቃምን ዕለታዊ ኣከባብን</h2>
          <p>ሽወደን ብኣዝዩ ዝለዓለ ደረጃ ዳግመ-ምጥቃም ትገብር። ቢለር፣ ብረት፣ ወረቐት፣ ፕላስቲክ፣ ጓሓፍ ምግቢ፣ ባትሪታትን ኤለክትሮኒካዊ ኣቕሑን ኩሎም ናብ ፍሉያት ኮፋታት ይኸዱ፣ መብዛሕትኡ ግዜ ኣብቲ ከባብያዊ <em>återvinningscentral</em> (ማእከል ዳግመ-ምጥቃም)። ናይ ጥርሙዝን ታኒካን መመለሲ (<em>pant</em> — ተመላሲ ገንዘብ) ከም ንእሽቶ ናይ ጥረ ገንዘብ ምምላስ ይምለስ።</p>
          ${ebookFactBox('ti', null, 'Allemansrätten — ህዝባዊ ናይ ምብጻሕ መሰል · ዓመተ ሸቶ ኔት-ዜሮ፦ 2045 · እቲ ዝዓበየ ቀላይ፦ Vänern · ኣርእስትታት መልክዕ መሬት፦ ጫካታት፣ ቀላያት፣ ኣኽራንን ነዊሕ ገምገም ባሕርን።', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        tr: `<h2>Kamuya açık erişim hakkı (allemansrätten)</h2>
          <p>İsveç'teki hemen her arazi — orman, tarla, kıyı — yürüyüşe, böğürtlen toplamaya, yüzmeye, doğadan toplamaya, kamp yapmaya (bir gece) ve sessiz keyfe açıktır. Bu yazılı bir yasa değil, bir gelenektir ama ciddiye alınır.</p>
          <p>İşin püf noktası: <em>"Inte störa, inte förstöra"</em> — rahatsız etme, tahrip etme. Özel bahçelere giremez veya birinin manzarasına çadır kuramazsınız. Ateş yasağı varken ateş yakamazsınız. Devrik odunu satmak için alamaz veya korunan türleri toplayamazsınız.</p>
          <h2>Coğrafya</h2>
          <p>İsveç, Avrupa'nın beşinci büyük ülkesidir. Coğrafyası ormanları, gölleri, dağları, tarım arazilerini ve uzun bir kıyı şeridini bir araya getirir. En uzun nehir Klarälven–Göta älv'dir (yaklaşık 720 km). En büyük göl Vänern'dir.</p>
          <h2>İklim ve mevsimler</h2>
          <p>Dört tam mevsim, kuzeyde çarpıcı. Kış karanlıktır; yazın Kuzey Kutup Dairesi'nin üzerinde gece yarısı güneşi olur. İklim değişikliği kışları daha ılık, yazları daha yağışlı yapıyor; hükümet 2045'e kadar net sıfır emisyon taahhüdünde bulundu.</p>
          <h2>Geri dönüşüm ve günlük çevre</h2>
          <p>İsveç takıntılı biçimde geri dönüştürür. Cam, metal, kâğıt, plastik, gıda atığı, piller ve elektronik eşyaların hepsi, çoğu zaman yereldeki <em>återvinningscentral</em>'da (geri dönüşüm merkezi) ayrı kutulara gider. Şişe ve kutu iadeleri (<em>pant</em> — depozito) küçük bir nakit iade olarak geri döner.</p>
          ${ebookFactBox('tr', null, 'Allemansrätten — kamuya açık erişim hakkı · Net sıfır hedef yılı: 2045 · En büyük göl: Vänern · Manzara temaları: ormanlar, göller, dağlar ve uzun bir kıyı şeridi.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        uk: `<h2>Право вільного доступу до природи (allemansrätten)</h2>
          <p>Майже будь-яка земля у Швеції — ліс, поле, берег — відкрита для прогулянок, збирання ягід, купання, збиральництва, ночівлі в наметі (одна ніч) та тихого відпочинку. Це звичай, а не писаний закон, але до нього ставляться серйозно.</p>
          <p>Заковика: <em>„Inte störa, inte förstöra”</em> — не турбуй, не руйнуй. Не можна заходити в приватні сади чи ставити намет комусь на видноті. Не можна розпалювати вогонь під час заборони на вогнища. Не можна забирати повалену деревину на продаж чи збирати охоронювані види.</p>
          <h2>Географія</h2>
          <p>Швеція — п'ята за величиною країна Європи. Її географія поєднує ліси, озера, гори, сільськогосподарські землі та довгу берегову лінію. Найдовша річка — Klarälven–Göta älv (близько 720 км). Найбільше озеро — Vänern.</p>
          <h2>Клімат і пори року</h2>
          <p>Чотири повноцінні пори року, драматичні на півночі. Зима темна; влітку за Полярним колом світить опівнічне сонце. Зміна клімату робить зими теплішими, а літо вологішим; уряд узяв зобов'язання досягти нульових чистих викидів до 2045.</p>
          <h2>Переробка та повсякденне довкілля</h2>
          <p>Швеція переробляє відходи одержимо. Скло, метал, папір, пластик, харчові відходи, батарейки та електроніка йдуть в окремі контейнери, часто в місцевому <em>återvinningscentral</em> (пункт переробки). Повернення пляшок і банок (<em>pant</em> — заставна плата) повертається як невелике грошове відшкодування.</p>
          ${ebookFactBox('uk', null, 'Allemansrätten — право вільного доступу до природи · Цільовий рік нульових чистих викидів: 2045 · Найбільше озеро: Vänern · Теми ландшафту: ліси, озера, гори та довга берегова лінія.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
      },
    },

    8: {
      kicker: {
        en: 'Chapter 08 · Culture',
        sv: 'Kapitel 08 · Kultur',
        'zh-Hans': '第 08 章 · 文化',
        'zh-Hant': '第 08 章 · 文化',
        ar: 'الفصل 08 · الثقافة',
        ckb: 'بەشی 08 · کلتوور',
        fa: 'فصل 08 · فرهنگ',
        pl: 'Rozdział 08 · Kultura',
        so: 'Cutubka 08 · Dhaqan',
        ti: 'ምዕራፍ 08 · ባህሊ',
        tr: 'Bölüm 08 · Kültür',
        uk: 'Розділ 08 · Культура',
      },
      title: {
        en: 'Culture, traditions,',
        sv: 'Kultur, traditioner',
        'zh-Hans': '文化、传统，',
        'zh-Hant': '文化、傳統，',
        ar: 'الثقافة والتقاليد',
        ckb: 'کلتوور، نەریتەکان،',
        fa: 'فرهنگ، سنت‌ها،',
        pl: 'Kultura, tradycje',
        so: 'Dhaqanka, caadooyinka',
        ti: 'ባህሊ፣ ባህልታት',
        tr: 'Kültür, gelenekler',
        uk: 'Культура, традиції',
      },
      title_em: {
        en: 'and the Swedish calendar.',
        sv: 'och svenska kalendern.',
        'zh-Hans': '以及瑞典的历法。',
        'zh-Hant': '以及瑞典的曆法。',
        ar: 'والتقويم السويدي.',
        ckb: 'و ساڵنامەی سویدی.',
        fa: 'و تقویم سوئدی.',
        pl: 'i szwedzki kalendarz.',
        so: 'iyo jadwalka Iswiidhan.',
        ti: 'ከምኡ’ውን ሽወደናዊ ዓውደ-ኣዋርሕ።',
        tr: 've İsveç takvimi.',
        uk: 'та шведський календар.',
      },
      lede: {
        en: "If you don't know when midsummer is, you'll get a polite explanation. If you don't know what fika is, you'll get one whether you want it or not.",
        sv: 'Vet du inte när midsommar är får du en artig förklaring. Vet du inte vad fika är får du en — vare sig du vill eller inte.',
        'zh-Hans':
          '如果你不知道仲夏节是什么时候，你会得到一番礼貌的解释。如果你不知道 fika 是什么，那么不管你想不想，你都会被请去体验一次。',
        'zh-Hant':
          '如果你不知道仲夏節是什麼時候，你會得到一番禮貌的解釋。如果你不知道 fika 是什麼，那麼不管你想不想，你都會被請去體驗一次。',
        ar: 'إن لم تكن تعرف متى منتصف الصيف، فستحصل على شرح مهذّب. وإن لم تكن تعرف ما هي القهوة الاجتماعية (fika)، فستحصل على واحدة سواء أردت أم لم ترد.',
        ckb: 'ئەگەر نەزانیت نیوەی هاوین کەیە، ڕوونکردنەوەیەکی بەڕێزانەت دەستدەکەوێت. ئەگەر نەزانیت فیکا (fika) چییە، یەکێکت دەستدەکەوێت جا بتەوێت یان نا.',
        fa: 'اگر ندانید نیمهٔ تابستان کِی است، توضیحی مؤدبانه دریافت می‌کنید. اگر ندانید فیکا (fika) چیست، چه بخواهید چه نخواهید یکی نصیبتان می‌شود.',
        pl: 'Jeśli nie wiesz, kiedy jest midsommar, dostaniesz uprzejme wyjaśnienie. Jeśli nie wiesz, czym jest fika, dostaniesz ją, czy chcesz, czy nie.',
        so: 'Haddii aanad ogayn goorta midsommar uu yahay, waxaad heli doontaa sharraxaad edeb leh. Haddii aanad ogayn waxa fika yahay, waad heli doontaa mid haddaad rabto iyo haddii kaleba.',
        ti: 'midsommar መዓስ ምዃኑ እንተ ዘይፈሊጥካ፣ ኣኽብሮታዊ መብርሂ ክትረክብ ኢኻ። fika እንታይ ምዃኑ እንተ ዘይፈሊጥካ፣ ትደልዮ ኣይትደልዮ ሓደ ክትረክብ ኢኻ።',
        tr: "Midsommar'ın ne zaman olduğunu bilmiyorsanız, kibar bir açıklama alırsınız. Fika'nın ne olduğunu bilmiyorsanız, isteseniz de istemeseniz de bir tane alırsınız.",
        uk: 'Якщо ви не знаєте, коли midsommar, ви отримаєте ввічливе пояснення. Якщо ви не знаєте, що таке fika, ви отримаєте її, хочете того чи ні.',
      },
      body: {
        en: `
          <h2>The big four</h2>
          <ul>
            <li><b>Midsommar</b> — third Friday in June. Maypole, herring, schnapps, dancing like frogs. The actual day-off Sweden looks forward to all year.</li>
            <li><b>Påsk (Easter)</b> — eggs and feather decorations, kids dressed as Easter witches (<em>påskkärringar</em>) trading drawings for candy.</li>
            <li><b>Lucia (13 December)</b> — children in white robes, candles, the song "Sankta Lucia". Lights against the dark.</li>
            <li><b>Jul (Christmas Eve)</b> — the meal is on the 24th, not the 25th. Donald Duck cartoons on TV at 3pm, every year. Don't ask.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika is not a coffee break — it is a social institution. Coffee or tea, usually with a sweet bun (kanelbulle, kardemummabulle). Often twice a day at work. Refusing fika is socially possible but emotionally unwise.</p>
          <h2>National day</h2>
          <p>June 6 — Sveriges nationaldag — marks Gustav Vasa's election in 1523 and the constitutional revision of 1809. A public holiday only since 2005, and still settling into the role.</p>
          <h2>New traditions</h2>
          <p>Sweden has long absorbed new traditions through migration: Eid al-Fitr (Muslim), Nouruz (Persian New Year), Newroz (Kurdish New Year, also 21 March), Diwali, and others. These are increasingly part of public life — celebrated in schools, workplaces, and city squares.</p>
          ${ebookFactBox('en', 'Facts to review', 'National day: June 6 · Midsommar: third Friday in June · Lucia: December 13 · Christmas Eve (not Day) is the main celebration.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Traditioner förändras över tid, men de hjälper människor att känna igen året och skapa gemenskap.',
            'Midsommar, jul, påsk, nyår, lucia, första maj, nationaldagen och alla helgons dag är vanliga provnära exempel.',
            'Fika är en vardaglig social vana: kaffe eller te, något litet att äta och tid att prata.',
            'Nya traditioner från människor som flyttat till Sverige är också en del av dagens samhälle.',
          ],
          'Nationaldag: 6 juni · Midsommar: tredje fredagen i juni · Lucia: 13 december · Jul firas främst 24 december.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>四大节日</h2>
          <ul>
            <li><b>Midsommar（仲夏节）</b>——6 月的第三个星期五。五月柱、鲱鱼、烈酒，还有像青蛙一样的舞蹈。这是瑞典人盼了一整年的真正假日。</li>
            <li><b>Påsk（复活节）</b>——彩蛋和羽毛装饰，孩子们打扮成复活节女巫（<em>påskkärringar</em>），用画作去换糖果。</li>
            <li><b>Lucia（露西亚节，12 月 13 日）</b>——孩子们身穿白袍、手持蜡烛，唱着《Sankta Lucia》。这是抵御黑暗的光。</li>
            <li><b>Jul（圣诞夜）</b>——正餐是在 24 日，而不是 25 日。每年下午 3 点电视上都会播放唐老鸭动画片。别问为什么。</li>
          </ul>
          <h2>Fika（瑞典式咖啡歇）</h2>
          <p>fika 不是一次咖啡休息——它是一种社交制度。咖啡或茶，通常配上一个甜面包（kanelbulle 肉桂卷、kardemummabulle 豆蔻卷）。在工作中往往一天两次。拒绝 fika 在社交上是可行的，但在情感上并不明智。</p>
          <h2>国庆日</h2>
          <p>6 月 6 日——Sveriges nationaldag（瑞典国庆日）——纪念 Gustav Vasa（古斯塔夫·瓦萨）在 1523 年的当选，以及 1809 年的宪法修订。它直到 2005 年才成为公共假日，至今仍在慢慢适应这个角色。</p>
          <h2>新的传统</h2>
          <p>长期以来，瑞典通过移民不断吸纳新的传统：Eid al-Fitr（开斋节，穆斯林）、Nouruz（波斯新年）、Newroz（库尔德新年，也在 3 月 21 日）、Diwali（排灯节）等等。这些节日正日益成为公共生活的一部分——在学校、职场和城市广场上被人们庆祝。</p>
          ${ebookFactBox('zh-Hans', null, '国庆日：6 月 6 日 · Midsommar：6 月的第三个星期五 · Lucia：12 月 13 日 · 主要庆祝的是圣诞夜（而非圣诞日）。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>四大節日</h2>
          <ul>
            <li><b>Midsommar（仲夏節）</b>——6 月的第三個星期五。五月柱、鯡魚、烈酒，還有像青蛙一樣的舞蹈。這是瑞典人盼了一整年的真正假日。</li>
            <li><b>Påsk（復活節）</b>——彩蛋和羽毛裝飾，孩子們打扮成復活節女巫（<em>påskkärringar</em>），用畫作去換糖果。</li>
            <li><b>Lucia（露西亞節，12 月 13 日）</b>——孩子們身穿白袍、手持蠟燭，唱著《Sankta Lucia》。這是抵禦黑暗的光。</li>
            <li><b>Jul（聖誕夜）</b>——正餐是在 24 日，而不是 25 日。每年下午 3 點電視上都會播放唐老鴨動畫片。別問為什麼。</li>
          </ul>
          <h2>Fika（瑞典式咖啡歇）</h2>
          <p>fika 不是一次咖啡休息——它是一種社交制度。咖啡或茶，通常配上一個甜麵包（kanelbulle 肉桂卷、kardemummabulle 豆蔻卷）。在工作中往往一天兩次。拒絕 fika 在社交上是可行的，但在情感上並不明智。</p>
          <h2>國慶日</h2>
          <p>6 月 6 日——Sveriges nationaldag（瑞典國慶日）——紀念 Gustav Vasa（古斯塔夫·瓦薩）在 1523 年的當選，以及 1809 年的憲法修訂。它直到 2005 年才成為公共假日，至今仍在慢慢適應這個角色。</p>
          <h2>新的傳統</h2>
          <p>長期以來，瑞典透過移民不斷吸納新的傳統：Eid al-Fitr（開齋節，穆斯林）、Nouruz（波斯新年）、Newroz（庫爾德新年，也在 3 月 21 日）、Diwali（排燈節）等等。這些節日正日益成為公共生活的一部分——在學校、職場和城市廣場上被人們慶祝。</p>
          ${ebookFactBox('zh-Hant', null, '國慶日：6 月 6 日 · Midsommar：6 月的第三個星期五 · Lucia：12 月 13 日 · 主要慶祝的是聖誕夜（而非聖誕日）。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>الأربعة الكبار</h2>
          <ul>
                      <li><b>Midsommar</b> (منتصف الصيف) — ثالث جمعة في يونيو. عمود مايو، رنجة، شنابس، رقص كالضفادع. اليوم الفعلي للعطلة الذي تتطلّع إليه السويد طوال العام.</li>
                      <li><b>Påsk</b> (عيد الفصح) — البيض وزينة الريش، وأطفال يتنكّرون كساحرات الفصح (<em>påskkärringar</em>) يبادلون الرسومات بالحلوى.</li>
                      <li><b>Lucia</b> (13 ديسمبر) — أطفال بأرواب بيضاء، شموع، أغنية "Sankta Lucia". أضواء في وجه الظلام.</li>
                      <li><b>Jul</b> (عشية عيد الميلاد) — الوجبة في الرابع والعشرين، لا الخامس والعشرين. أفلام Donald Duck الكرتونية على التلفاز الساعة 3 عصرًا، كل عام. لا تسأل.</li>
                    </ul>
          <h2>Fika (القهوة الاجتماعية)</h2>
          <p>الـ fika ليست استراحة قهوة — إنها مؤسسة اجتماعية. قهوة أو شاي، عادةً مع كعكة حلوة (kanelbulle، kardemummabulle). غالبًا مرتين في اليوم في العمل. رفض الـ fika ممكن اجتماعيًا لكنه غير حكيم عاطفيًا.</p>
          <h2>اليوم الوطني</h2>
          <p>6 يونيو — اليوم الوطني للسويد (Sveriges nationaldag) — يحيي ذكرى انتخاب Gustav Vasa في 1523 والمراجعة الدستورية لعام 1809. عطلة رسمية فقط منذ 2005، وما زالت تستقرّ في دورها.</p>
          <h2>تقاليد جديدة</h2>
          <p>استوعبت السويد منذ زمن طويل تقاليد جديدة عبر الهجرة: Eid al-Fitr (عيد الفطر، إسلامي)، Nouruz (رأس السنة الفارسية)، Newroz (رأس السنة الكردية، أيضًا 21 مارس)، Diwali (ديوالي)، وغيرها. وهي على نحو متزايد جزء من الحياة العامة — يُحتفل بها في المدارس وأماكن العمل وساحات المدن.</p>
          ${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · Midsommar: ثالث جمعة في يونيو · Lucia: 13 ديسمبر · عشية عيد الميلاد (لا يومه) هي الاحتفال الرئيسي.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>چوار گەورەکە</h2>
          <ul>
                      <li><b>Midsommar</b> (نیوەی هاوین) — سێیەم هەینی مانگی حوزەیران. کۆڵەکەی ئایار، ماسی هیرینگ، شنابس، سەمای وەک بۆق. ئەو ڕۆژە پشووە ڕاستەقینەیەی کە سوید بەدرێژایی ساڵ چاوەڕێی دەکات.</li>
                      <li><b>Påsk</b> (جەژنی پاک) — هێلکە و ڕازاندنەوەی پەڕ، منداڵانێک وەک جادووگەرانی جەژنی پاک (<em>påskkärringar</em>) جل دەپۆشن و وێنەکێشان بە شیرینی دەگۆڕنەوە.</li>
                      <li><b>Lucia</b> (13 کانوونی یەکەم) — منداڵان بە کراسی سپی، مۆم، گۆرانیی "Sankta Lucia". ڕووناکی بەرامبەر تاریکی.</li>
                      <li><b>Jul</b> (شەوی کریسمس) — ژەمەکە لە بیست‌و‌چوارەمە، نەک بیست‌و‌پێنجەم. کارتۆنەکانی Donald Duck لە تەلەفزیۆن کاتژمێر 3 ی پاش‌نیوەڕۆ، هەموو ساڵێک. مەپرسە.</li>
                    </ul>
          <h2>Fika (پشووی قاوەی کۆمەڵایەتی)</h2>
          <p>فیکا (fika) پشووی قاوە نییە — دامەزراوەیەکی کۆمەڵایەتییە. قاوە یان چا، بەزۆری لەگەڵ کولێرەیەکی شیرین (kanelbulle، kardemummabulle). زۆرجار دووجار لە ڕۆژدا لە کاردا. ڕەتکردنەوەی فیکا لە ڕووی کۆمەڵایەتییەوە دەکرێت بەڵام لە ڕووی هەستەوە دانا نییە.</p>
          <h2>ڕۆژی نیشتمانی</h2>
          <p>6 ی حوزەیران — ڕۆژی نیشتمانیی سوید (Sveriges nationaldag) — یادی هەڵبژاردنی Gustav Vasa لە 1523 و پێداچوونەوەی دەستووری 1809 دەکاتەوە. تەنها لە 2005 ـەوە بووە بە پشووی فەرمی، و هێشتا لە جێگیربوون لە ڕۆڵەکەیدایە.</p>
          <h2>نەریتە نوێیەکان</h2>
          <p>سوید لەمێژە نەریتە نوێیەکانی لە ڕێگەی کۆچەوە هەڵمژیوە: Eid al-Fitr (جەژنی ڕەمەزان، ئیسلامی)، Nouruz (سەری ساڵی فارسی)، Newroz (نەورۆز، سەری ساڵی کوردی، هەروەها 21 ی ئازار)، Diwali (دیوالی)، و هیتر. ئەمانە بەشێوەیەکی زیادبوو بەشێکن لە ژیانی گشتی — لە قوتابخانە، شوێنی کار، و گۆڕەپانەکانی شار ئاهەنگیان بۆ دەگێڕدرێت.</p>
          ${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: 6 ی حوزەیران · Midsommar: سێیەم هەینی مانگی حوزەیران · Lucia: 13 ی کانوونی یەکەم · شەوی کریسمس (نەک ڕۆژەکەی) ئاهەنگە سەرەکییەکەیە.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>چهار بزرگ</h2>
          <ul>
                      <li><b>Midsommar</b> (نیمهٔ تابستان) — سومین جمعهٔ ژوئن. ستون ماه مه، شاه‌ماهی، شنپس، رقص مانند قورباغه‌ها. روز تعطیلی واقعی که سوئد تمام سال در انتظارش است.</li>
                      <li><b>Påsk</b> (عید پاک) — تخم‌مرغ و تزیینات پر، بچه‌هایی که مانند جادوگران عید پاک (<em>påskkärringar</em>) لباس می‌پوشند و نقاشی‌ها را با آب‌نبات معاوضه می‌کنند.</li>
                      <li><b>Lucia</b> (13 دسامبر) — کودکان در ردای سفید، شمع‌ها، آهنگ "Sankta Lucia". نورها در برابر تاریکی.</li>
                      <li><b>Jul</b> (شب کریسمس) — وعدهٔ غذا در بیست‌وچهارم است، نه بیست‌وپنجم. کارتون‌های Donald Duck در تلویزیون ساعت 3 بعدازظهر، هر سال. نپرسید.</li>
                    </ul>
          <h2>Fika (وقفهٔ اجتماعی قهوه)</h2>
          <p>فیکا (fika) یک استراحت قهوه نیست — یک نهاد اجتماعی است. قهوه یا چای، معمولاً با نان شیرین (kanelbulle، kardemummabulle). اغلب دو بار در روز سر کار. رد کردن فیکا از نظر اجتماعی ممکن است اما از نظر عاطفی نابخردانه است.</p>
          <h2>روز ملی</h2>
          <p>6 ژوئن — روز ملی سوئد (Sveriges nationaldag) — یادبود انتخاب Gustav Vasa در 1523 و بازنگری قانون اساسی 1809 است. تنها از 2005 تعطیلی رسمی شده، و هنوز در حال جا افتادن در نقش خود است.</p>
          <h2>سنت‌های جدید</h2>
          <p>سوئد مدت‌هاست سنت‌های جدید را از طریق مهاجرت جذب کرده است: Eid al-Fitr (عید فطر، اسلامی)، Nouruz (نوروز، سال نوی ایرانی)، Newroz (سال نوی کردی، نیز 21 مارس)، Diwali (دیوالی)، و دیگران. این‌ها به‌طور فزاینده بخشی از زندگی عمومی‌اند — در مدارس، محل‌های کار، و میدان‌های شهر جشن گرفته می‌شوند.</p>
          ${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · Midsommar: سومین جمعهٔ ژوئن · Lucia: 13 دسامبر · شب کریسمس (نه روزش) جشن اصلی است.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Wielka czwórka</h2>
          <ul>
            <li><b>Midsommar</b> — trzeci piątek czerwca. Słup majowy, śledź, schnaps, taniec jak żaby. Prawdziwy dzień wolny, na który Szwecja czeka cały rok.</li>
            <li><b>Påsk (Wielkanoc)</b> — jajka i ozdoby z piór, dzieci przebrane za wielkanocne czarownice (<em>påskkärringar</em>) wymieniające rysunki na cukierki.</li>
            <li><b>Lucia (13 grudnia)</b> — dzieci w białych szatach, świece, pieśń „Sankta Lucia”. Światła przeciwko ciemności.</li>
            <li><b>Jul (Wigilia)</b> — posiłek jest 24., a nie 25. Kreskówki z Kaczorem Donaldem w telewizji o 15:00, co roku. Nie pytaj.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika to nie przerwa na kawę — to instytucja społeczna. Kawa lub herbata, zwykle ze słodką bułką (kanelbulle, kardemummabulle). Często dwa razy dziennie w pracy. Odmowa fiki jest społecznie możliwa, ale emocjonalnie nierozsądna.</p>
          <h2>Święto narodowe</h2>
          <p>6 czerwca — Sveriges nationaldag (szwedzkie święto narodowe) — upamiętnia wybór Gustava Vasy w 1523 oraz nowelizację konstytucji z 1809. Dniem wolnym od pracy dopiero od 2005 i wciąż wchodzi w swoją rolę.</p>
          <h2>Nowe tradycje</h2>
          <p>Szwecja od dawna przyswaja nowe tradycje poprzez migrację: Eid al-Fitr (muzułmański), Nouruz (perski Nowy Rok), Newroz (kurdyjski Nowy Rok, również 21 marca), Diwali i inne. Coraz bardziej stają się one częścią życia publicznego — obchodzone w szkołach, miejscach pracy i na miejskich placach.</p>
          ${ebookFactBox('pl', null, 'Święto narodowe: 6 czerwca · Midsommar: trzeci piątek czerwca · Lucia: 13 grudnia · Wigilia (a nie Boże Narodzenie) jest głównym świętem.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Afarta waaweyn</h2>
          <ul>
            <li><b>Midsommar</b> — Jimcaha saddexaad ee Juun. Tiir Maajo, kalluunka herring, schnapps, qoob-ka-cayaar rahyada u eg. Maalinta fasaxa dhabta ah ee Iswiidhan sannadka oo dhan filinayso.</li>
            <li><b>Påsk (Iistarka)</b> — ukumo iyo qurxin baalal ah, carruur u labbisan saaxiraadka Iistarka (<em>påskkärringar</em>) oo sawirro ku beddanaya nacnac.</li>
            <li><b>Lucia (13 Diseembar)</b> — carruur khamiisyo cad qaba, shumacyo, heesta "Sankta Lucia". Iftiin ka dhanka ah mugdiga.</li>
            <li><b>Jul (Habeenka Kirismaska)</b> — cuntada waxaa la cunaa 24-ka, ma aha 25-ka. Majaajiladaha Donald Duck ee TV-ga 3-da galabnimo, sannad walba. Ha weydiin.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika maaha nasasho qaxwo — waa hay'ad bulsho. Qaxwo ama shaah, badanaa rooti macaan la socda (kanelbulle, kardemummabulle). Badanaa laba jeer maalintii shaqada. Diidmada fika bulsho ahaan waa suurtagal laakiin shucuur ahaan ma caqli badna.</p>
          <h2>Maalinta qaranka</h2>
          <p>6 Juun — Sveriges nationaldag (maalinta qaranka Iswiidhan) — waxay xusaysaa doorashadii Gustav Vasa ee 1523 iyo dib-u-eegistii dastuurka ee 1809. Waxay fasax dawladeed ahayd kaliya tan iyo 2005, weligeedna doorkeeda ku dhex degaysa.</p>
          <h2>Caadooyin cusub</h2>
          <p>Iswiidhan muddo dheer ayey caadooyin cusub ku soo dhowaysay socdaalka: Ciidul-Fidri / Eid al-Fitr (Muslim), Nouruz (Sannadka Cusub ee Faaris), Newroz (Sannadka Cusub ee Kurdiga, sidoo kale 21 Maarso), Diwali, iyo kuwo kale. Tani waxay si isa soo taraysa qayb ka noqonaysaa nolosha dadweynaha — waxaa lagu dabaaldegaa iskuullada, goobaha shaqada, iyo fagaarayaasha magaalada.</p>
          ${ebookFactBox('so', null, 'Maalinta qaranka: 6 Juun · Midsommar: Jimcaha saddexaad ee Juun · Lucia: 13 Diseembar · Habeenka Kirismaska (ee aan ahayn maalinta) ayaa ah dabaaldegga ugu weyn.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>እቶም ዓበይቲ ኣርባዕተ</h2>
          <ul>
            <li><b>Midsommar</b> — ሳልሳይ ዓርቢ ሰነ። ናይ ጉንቦት ዓንዲ፣ ሄሪንግ ዓሳ፣ schnapps፣ ከም እንቍርዓብ ምስዕሳዕ። እታ ሽወደን ምሉእ ዓመት እትጽበያ ናይ ሓቂ ናይ ዕረፍቲ መዓልቲ።</li>
            <li><b>Påsk (ፋሲካ)</b> — እንቋቝሖን ብላባ ዝተሰርሐ ምጽብባቕን፣ ከም ጠንቋሊ ፋሲካ (<em>påskkärringar</em>) ዝተኸድኑ ቆልዑ ስእልታት ብከረመላ ይልውጡ።</li>
            <li><b>Lucia (13 ታሕሳስ)</b> — ጻዕዳ ክዳን ዝለበሱ ቆልዑ፣ ሽምዓታት፣ „Sankta Lucia” ዝብል ደርፊ። ኣንጻር ጸልማት ብርሃናት።</li>
            <li><b>Jul (ድሮ ልደት)</b> — እቲ ምግቢ ኣብ 24፣ ኣብ 25 ኣይኮነን። ናይ Donald Duck ካርቱን ኣብ ተለቪዥን ሰዓት 3 ድሕሪ ቐትሪ፣ ኩሉ ዓመት። ኣይትሕተት።</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika ናይ ቡን ዕረፍቲ ኣይኮነን — ማሕበራዊ ትካል እዩ። ቡን ወይ ሻሂ፣ መብዛሕትኡ ግዜ ምስ ጥዑም ባኒ (kanelbulle, kardemummabulle)። ኣብ ስራሕ መብዛሕትኡ ግዜ መዓልቲ ክልተ ሳዕ። ንfika ምንጻግ ማሕበራዊ ብዝኾነ ይከኣል እዩ ግን ስምዒታዊ ብዝኾነ ጥበብ ኣይኮነን።</p>
          <h2>ሃገራዊ መዓልቲ</h2>
          <p>6 ሰነ — Sveriges nationaldag (ሃገራዊ መዓልቲ ሽወደን) — ንምርጫ Gustav Vasa ኣብ 1523 ከምኡ’ውን ንምሕያሽ ቅዋም ናይ 1809 የዘክር። ካብ 2005 ጀሚሩ ጥራይ ህዝባዊ ናይ ዕረፍቲ መዓልቲ ኮይኑ፣ ክሳብ ሕጂ ኣብ ተራኡ እናተለማመደ ኣሎ።</p>
          <h2>ሓደስቲ ባህልታት</h2>
          <p>ሽወደን ብመንገዲ ስደት ንነዊሕ ግዜ ሓደስቲ ባህልታት ክትቅበል ጸኒሓ፦ ዒድ ኣል-ፊጥር / Eid al-Fitr (ምስልምና)፣ Nouruz (ፋርሳዊ ሓድሽ ዓመት)፣ Newroz (ኩርዳዊ ሓድሽ ዓመት፣ ንሱ እውን 21 መጋቢት)፣ Diwali፣ ካልኦትን። እዚኦም እናወሰኹ ክፋል ህዝባዊ ህይወት ይኾኑ ኣለዉ — ኣብ ኣብያተ ትምህርቲ፣ ቦታታት ስራሕን ኣደባባያት ከተማን ይብዓሉ።</p>
          ${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ፦ 6 ሰነ · Midsommar፦ ሳልሳይ ዓርቢ ሰነ · Lucia፦ 13 ታሕሳስ · ድሮ ልደት (መዓልቲ ልደት ዘይኮነ) እቲ ቀንዲ በዓል እዩ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Büyük dörtlü</h2>
          <ul>
            <li><b>Midsommar</b> — Haziran'ın üçüncü Cuması. Mayıs direği, ringa balığı, schnapps, kurbağa gibi dans. İsveç'in tüm yıl boyunca dört gözle beklediği o asıl tatil günü.</li>
            <li><b>Påsk (Paskalya)</b> — yumurtalar ve tüy süsler, Paskalya cadıları (<em>påskkärringar</em>) kılığına giren çocuklar çizimleri şekerle takas eder.</li>
            <li><b>Lucia (13 Aralık)</b> — beyaz cüppeli çocuklar, mumlar, "Sankta Lucia" şarkısı. Karanlığa karşı ışıklar.</li>
            <li><b>Jul (Noel Arifesi)</b> — yemek 25'inde değil, 24'ünde yenir. Her yıl saat 15.00'te televizyonda Donald Duck çizgi filmleri. Sorma.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika bir kahve molası değildir — bir toplumsal kurumdur. Kahve veya çay, genellikle tatlı bir çörekle (kanelbulle, kardemummabulle). İş yerinde çoğu zaman günde iki kez. Fika'yı reddetmek toplumsal olarak mümkündür ama duygusal olarak akıllıca değildir.</p>
          <h2>Ulusal gün</h2>
          <p>6 Haziran — Sveriges nationaldag (İsveç ulusal günü) — Gustav Vasa'nın 1523'teki seçilişini ve 1809'daki anayasa değişikliğini anar. Ancak 2005'ten beri resmî tatildir ve hâlâ rolüne yerleşmektedir.</p>
          <h2>Yeni gelenekler</h2>
          <p>İsveç uzun süredir göç yoluyla yeni gelenekleri benimsemektedir: Ramazan Bayramı / Eid al-Fitr (Müslüman), Nevruz / Nouruz (Fars Yeni Yılı), Newroz (Kürt Yeni Yılı, yine 21 Mart), Diwali ve diğerleri. Bunlar giderek kamusal yaşamın bir parçası oluyor — okullarda, iş yerlerinde ve kent meydanlarında kutlanıyor.</p>
          ${ebookFactBox('tr', null, "Ulusal gün: 6 Haziran · Midsommar: Haziran'ın üçüncü Cuması · Lucia: 13 Aralık · Asıl kutlama Noel Günü değil, Noel Arifesidir.", ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Велика четвірка</h2>
          <ul>
            <li><b>Midsommar</b> — третя п'ятниця червня. Травневе дерево, оселедець, шнапс, танці „як жабки”. Той самий вихідний, на який Швеція чекає цілий рік.</li>
            <li><b>Påsk (Великдень)</b> — яйця та прикраси з пір'я, діти, вбрані великодніми відьмами (<em>påskkärringar</em>), що міняють малюнки на цукерки.</li>
            <li><b>Lucia (13 грудня)</b> — діти в білих шатах, свічки, пісня „Sankta Lucia”. Світло проти темряви.</li>
            <li><b>Jul (Святвечір)</b> — святкова трапеза 24-го, а не 25-го. Мультфільми про Дональда Дака по телевізору о 15:00, щороку. Не питайте.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika — це не перерва на каву, це соціальний інститут. Кава або чай, зазвичай із солодкою булочкою (kanelbulle, kardemummabulle). Часто двічі на день на роботі. Відмовитися від fika соціально можливо, але емоційно нерозумно.</p>
          <h2>Національне свято</h2>
          <p>6 червня — Sveriges nationaldag (шведське національне свято) — відзначає обрання Gustav Vasa у 1523 та конституційний перегляд 1809. Вихідним днем лише від 2005, і досі звикає до своєї ролі.</p>
          <h2>Нові традиції</h2>
          <p>Швеція давно вбирає нові традиції через міграцію: Eid al-Fitr (мусульманський), Nouruz (перський Новий рік), Newroz (курдський Новий рік, також 21 березня), Diwali та інші. Вони дедалі більше стають частиною публічного життя — їх святкують у школах, на робочих місцях і на міських площах.</p>
          ${ebookFactBox('uk', null, "Національне свято: 6 червня · Midsommar: третя п'ятниця червня · Lucia: 13 грудня · Святвечір (а не сам Різдвяний день) є головним святкуванням.", ['uhrStudyMaterial'])}
        `,
      },
    },

    9: {
      kicker: {
        en: 'Chapter 09 · Money',
        sv: 'Kapitel 09 · Pengar',
        'zh-Hans': '第 09 章 · 金钱',
        'zh-Hant': '第 09 章 · 金錢',
        ar: 'الفصل 09 · المال',
        ckb: 'بەشی 09 · پارە',
        fa: 'فصل 09 · پول',
        pl: 'Rozdział 09 · Pieniądze',
        so: 'Cutubka 09 · Lacag',
        ti: 'ምዕራፍ 09 · ገንዘብ',
        tr: 'Bölüm 09 · Para',
        uk: 'Розділ 09 · Гроші',
      },
      title: {
        en: 'Money,',
        sv: 'Pengar,',
        'zh-Hans': '金钱、',
        'zh-Hant': '金錢、',
        ar: 'المال،',
        ckb: 'پارە،',
        fa: 'پول،',
        pl: 'Pieniądze,',
        so: 'Lacagta,',
        ti: 'ገንዘብ፣',
        tr: 'Para,',
        uk: 'Гроші,',
      },
      title_em: {
        en: 'banks, and BankID.',
        sv: 'banker och BankID.',
        'zh-Hans': '银行，以及 BankID。',
        'zh-Hant': '銀行，以及 BankID。',
        ar: 'والبنوك، وBankID.',
        ckb: 'بانکەکان، و BankID.',
        fa: 'بانک‌ها، و BankID.',
        pl: 'banki i BankID.',
        so: 'bangiyada, iyo BankID.',
        ti: 'ባንክታትን BankIDን።',
        tr: 'bankalar ve BankID.',
        uk: 'банки та BankID.',
      },
      lede: {
        en: 'Sweden is one of the least cash-dependent countries on earth. Almost every transaction now passes through one little app.',
        sv: 'Sverige är ett av världens minst kontantberoende länder. Nästan varje transaktion går genom en liten app.',
        'zh-Hans':
          '瑞典是地球上最不依赖现金的国家之一。如今几乎每一笔交易都要经过一个小小的应用程序。',
        'zh-Hant':
          '瑞典是地球上最不依賴現金的國家之一。如今幾乎每一筆交易都要經過一個小小的應用程式。',
        ar: 'السويد من أقل بلدان الأرض اعتمادًا على النقد. تمر تقريبًا كل معاملة الآن عبر تطبيق صغير واحد.',
        ckb: 'سوید یەکێکە لە کەمترین وڵاتانی سەر زەوی کە پشت بە پارەی کاش دەبەستن. ئێستا بەنزیکەیی هەموو مامەڵەیەک بەناو یەک ئەپڵیکەیشنی بچووکدا تێدەپەڕێت.',
        fa: 'سوئد یکی از کم‌وابسته‌ترین کشورها به پول نقد روی زمین است. اکنون تقریباً هر تراکنش از یک اپلیکیشن کوچک عبور می‌کند.',
        pl: 'Szwecja to jeden z najmniej zależnych od gotówki krajów na świecie. Niemal każda transakcja przechodzi teraz przez jedną małą aplikację.',
        so: 'Iswiidhan waa mid ka mid ah dalalka ugu yar ee lacag caddaan ah ku tiirsan adduunka. Ku dhowaad dhaqdhaqaaq kasta oo lacageed hadda wuxuu maraa hal app yar.',
        ti: 'ሽወደን ኣብ ዓለም ካብቶም ብጥረ ገንዘብ ኣዝዮም ዘይምርኮሱ ሃገራት ሓንቲ እያ። ዳርጋ ኩሉ ግብይት ሕጂ ብሓንቲ ንእሽቶ app ይሓልፍ።',
        tr: 'İsveç, dünyada nakde en az bağımlı ülkelerden biridir. Artık neredeyse her işlem küçük bir uygulamadan geçiyor.',
        uk: 'Швеція — одна з найменш залежних від готівки країн на Землі. Майже кожна транзакція тепер проходить через один маленький застосунок.',
      },
      body: {
        en: `
          <h2>The Swedish krona (SEK)</h2>
          <p>Sweden voted against adopting the euro in 2003 and uses the krona (kr). The Riksbank — Sweden's central bank, founded in 1668 — sets monetary policy and prints the cash that almost nobody uses.</p>
          <h2>Cards and apps</h2>
          <p>Cash is rare. Most shops accept only card. Person-to-person payment runs through <em>Swish</em> — a mobile payment app built jointly by the banks. You enter a phone number, the amount, a note, and tap.</p>
          <h2>BankID</h2>
          <p>BankID is Sweden's national digital identity. It's a private system (built by the banks), but is treated as legal proof of identity for tax filing, signing leases, voting in elections, opening accounts, and almost any government service. Getting a BankID is one of the first practical steps a new resident takes.</p>
          <h2>Banks and accounts</h2>
          <p>To open a Swedish bank account you typically need a personnummer or coordination number, an ID, and proof of residence. Major banks: Swedbank, Handelsbanken, SEB, Nordea. Online-only options include Avanza and Nordnet.</p>
          <h2>Pension</h2>
          <p>Three layers: state pension (allmän pension), occupational pension via your employer (tjänstepension), and any private savings. The state pension covers the basics; the rest matters more than people expect.</p>
          ${ebookFactBox('en', 'Facts to review', 'Currency: Swedish krona (SEK) · Riksbank founded: 1668 · Voted against euro: 2003 · Payment app: Swish · Digital ID: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        sv: svStudyBrief(
          [
            'Sverige använder svenska kronor, SEK. Sverige röstade nej till euron i folkomröstningen 2003.',
            'Riksbanken är Sveriges centralbank och ansvarar för penningpolitiken.',
            'BankID och Swish är vanliga i vardagen, men de är bankanknutna tjänster och inte samma sak som medborgarskap.',
            'Pensionen består ofta av allmän pension, tjänstepension och eventuellt privat sparande.',
          ],
          'Valuta: svensk krona · Euroomröstning: 2003 · Riksbanken · Swish · BankID.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>瑞典克朗（krona，SEK）</h2>
          <p>瑞典在 2003 年公投反对采用欧元，使用克朗（kr）。Riksbanken（瑞典中央银行）——成立于 1668 年——负责制定货币政策，并印制那几乎无人使用的现金。</p>
          <h2>银行卡与应用程序</h2>
          <p>现金很少见。大多数商店只接受刷卡。个人之间的付款则通过 <em>Swish</em>——一款由各家银行共同打造的移动支付应用。你输入一个电话号码、金额和一条备注，然后轻轻一点即可。</p>
          <h2>BankID</h2>
          <p>BankID 是瑞典的国家级数字身份。它是一个私营系统（由各家银行建立），但在报税、签订租约、参加选举投票、开立账户以及几乎任何政府服务中，都被视为合法的身份证明。办理 BankID 是新居民最先采取的实际步骤之一。</p>
          <h2>银行与账户</h2>
          <p>要开立一个瑞典银行账户，你通常需要一个 personnummer（个人编号）或协调号码、一份身份证件，以及居住证明。主要银行有：Swedbank、Handelsbanken、SEB、Nordea。仅限线上的选择则包括 Avanza 和 Nordnet。</p>
          <h2>养老金</h2>
          <p>分为三层：国家养老金（allmän pension）、通过雇主缴纳的职业养老金（tjänstepension），以及任何个人储蓄。国家养老金涵盖基本需求；而其余部分的重要性，往往超出人们的预期。</p>
          ${ebookFactBox('zh-Hans', null, '货币：瑞典克朗（SEK） · Riksbanken 成立：1668 · 公投反对欧元：2003 · 支付应用：Swish · 数字身份：BankID。', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        'zh-Hant': `<h2>瑞典克朗（krona，SEK）</h2>
          <p>瑞典在 2003 年公投反對採用歐元，使用克朗（kr）。Riksbanken（瑞典中央銀行）——成立於 1668 年——負責制定貨幣政策，並印製那幾乎無人使用的現金。</p>
          <h2>銀行卡與應用程式</h2>
          <p>現金很少見。大多數商店只接受刷卡。個人之間的付款則透過 <em>Swish</em>——一款由各家銀行共同打造的行動支付應用。你輸入一個電話號碼、金額和一條備註，然後輕輕一點即可。</p>
          <h2>BankID</h2>
          <p>BankID 是瑞典的國家級數位身分。它是一個私營系統（由各家銀行建立），但在報稅、簽訂租約、參加選舉投票、開立帳戶以及幾乎任何政府服務中，都被視為合法的身分證明。辦理 BankID 是新居民最先採取的實際步驟之一。</p>
          <h2>銀行與帳戶</h2>
          <p>要開立一個瑞典銀行帳戶，你通常需要一個 personnummer（個人編號）或協調號碼、一份身分證件，以及居住證明。主要銀行有：Swedbank、Handelsbanken、SEB、Nordea。僅限線上的選擇則包括 Avanza 和 Nordnet。</p>
          <h2>養老金</h2>
          <p>分為三層：國家養老金（allmän pension）、透過雇主繳納的職業養老金（tjänstepension），以及任何個人儲蓄。國家養老金涵蓋基本需求；而其餘部分的重要性，往往超出人們的預期。</p>
          ${ebookFactBox('zh-Hant', null, '貨幣：瑞典克朗（SEK） · Riksbanken 成立：1668 · 公投反對歐元：2003 · 支付應用：Swish · 數位身分：BankID。', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ar: `<h2>الكرونة السويدية (SEK)</h2>
          <p>صوّتت السويد ضد تبنّي اليورو في 2003 وتستخدم الكرونة (kr). البنك المركزي السويدي (Riksbank) — المؤسَّس عام 1668 — يضع السياسة النقدية ويطبع النقد الذي لا يستخدمه أحد تقريبًا.</p>
          <h2>البطاقات والتطبيقات</h2>
          <p>النقد نادر. معظم المتاجر تقبل البطاقة فقط. الدفع من شخص إلى شخص يمرّ عبر <em>Swish</em> — تطبيق دفع عبر الهاتف بناه البنوك معًا. تُدخل رقم هاتف، والمبلغ، وملاحظة، وتنقر.</p>
          <h2>BankID</h2>
          <p>BankID هو الهوية الرقمية الوطنية للسويد. إنه نظام خاص (بناه البنوك)، لكنه يُعامَل كإثبات قانوني للهوية في تقديم الضرائب، وتوقيع عقود الإيجار، والتصويت في الانتخابات، وفتح الحسابات، وتقريبًا أي خدمة حكومية. الحصول على BankID هو إحدى أولى الخطوات العملية التي يتخذها المقيم الجديد.</p>
          <h2>البنوك والحسابات</h2>
          <p>لفتح حساب مصرفي سويدي تحتاج عادةً إلى رقم شخصي (personnummer) أو رقم تنسيق، وهوية، وإثبات إقامة. البنوك الكبرى: Swedbank، Handelsbanken، SEB، Nordea. وتشمل الخيارات الإلكترونية فقط Avanza وNordnet.</p>
          <h2>المعاش التقاعدي</h2>
          <p>ثلاث طبقات: معاش الدولة (allmän pension)، والمعاش المهني عبر صاحب عملك (tjänstepension)، وأي مدخرات خاصة. معاش الدولة يغطي الأساسيات؛ والبقية تهمّ أكثر مما يتوقع الناس.</p>
          ${ebookFactBox('ar', null, 'العملة: الكرونة السويدية (SEK) · تأسيس Riksbank: 1668 · صوّتت ضد اليورو: 2003 · تطبيق الدفع: Swish · الهوية الرقمية: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ckb: `<h2>کرۆنی سویدی (SEK)</h2>
          <p>سوید لە 2003 دەنگی نا دا بە پەسەندکردنی یۆرۆ و کرۆن (kr) بەکاردێنێت. بانکی ناوەندیی سوید (Riksbank) — کە لە 1668 دامەزراوە — سیاسەتی دراوی دیاری دەکات و ئەو پارەیە چاپ دەکات کە بەنزیکەیی کەس بەکاری ناهێنێت.</p>
          <h2>کارت و ئەپڵیکەیشنەکان</h2>
          <p>پارەی کاش دەگمەنە. زۆربەی فرۆشگاکان تەنها کارت قبووڵ دەکەن. پارەدانی کەس‌بۆ‌کەس بەناو <em>Swish</em> ـدا دەبێت — ئەپڵیکەیشنێکی پارەدانی مۆبایل کە بانکەکان بەهاوبەشی دروستیان کردووە. ژمارەی تەلەفۆن، بڕەکە، و تێبینییەک دەنووسیت و دەیلێیت.</p>
          <h2>BankID</h2>
          <p>BankID ناسنامەی دیجیتاڵی نیشتمانیی سویدە. سیستەمێکی تایبەتە (لەلایەن بانکەکانەوە دروستکراوە)، بەڵام وەک بەڵگەی یاساییی ناسنامە مامەڵەی لەگەڵدا دەکرێت بۆ پێشکەشکردنی باج، واژووکردنی گرێبەستی کرێ، دەنگدان لە هەڵبژاردنەکان، کردنەوەی هەژمار، و بەنزیکەیی هەر خزمەتگوزارییەکی حکومی. وەرگرتنی BankID یەکێکە لە یەکەم هەنگاوە کردارییەکانی دانیشتووویەکی نوێ.</p>
          <h2>بانکەکان و هەژمارەکان</h2>
          <p>بۆ کردنەوەی هەژمارێکی بانکیی سویدی بەزۆری پێویستت بە ژمارەی کەسی (personnummer) یان ژمارەی هاوئاهەنگی، ناسنامەیەک، و بەڵگەی نیشتەجێبوون هەیە. بانکە سەرەکییەکان: Swedbank، Handelsbanken، SEB، Nordea. هەڵبژاردنە تەنها‌سەرهێڵەکان Avanza و Nordnet لەخۆ دەگرن.</p>
          <h2>خانەنشینی</h2>
          <p>سێ چین: خانەنشینیی دەوڵەت (allmän pension)، خانەنشینیی پیشەیی لە ڕێگەی کارفەرماکەتەوە (tjänstepension)، و هەر پاشەکەوتێکی تایبەت. خانەنشینیی دەوڵەت بنەڕەتییەکان دادەپۆشێت؛ ئەوەی ماوەش زیاتر گرنگە لەوەی خەڵک چاوەڕێی دەکەن.</p>
          ${ebookFactBox('ckb', null, 'دراو: کرۆنی سویدی (SEK) · دامەزراندنی Riksbank: 1668 · دەنگی نا بە یۆرۆ: 2003 · ئەپڵیکەیشنی پارەدان: Swish · ناسنامەی دیجیتاڵی: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        fa: `<h2>کرون سوئد (SEK)</h2>
          <p>سوئد در 2003 به پذیرش یورو رأی منفی داد و از کرون (kr) استفاده می‌کند. بانک مرکزی سوئد (Riksbank) — تأسیس‌شده در 1668 — سیاست پولی را تعیین می‌کند و پولی را چاپ می‌کند که تقریباً هیچ‌کس از آن استفاده نمی‌کند.</p>
          <h2>کارت‌ها و اپلیکیشن‌ها</h2>
          <p>پول نقد کمیاب است. بیشتر فروشگاه‌ها فقط کارت می‌پذیرند. پرداخت فرد‌به‌فرد از طریق <em>Swish</em> انجام می‌شود — یک اپلیکیشن پرداخت موبایلی که بانک‌ها مشترکاً ساخته‌اند. شمارهٔ تلفن، مبلغ، و یک یادداشت وارد می‌کنید و ضربه می‌زنید.</p>
          <h2>BankID</h2>
          <p>BankID هویت دیجیتال ملی سوئد است. یک سامانهٔ خصوصی است (ساختهٔ بانک‌ها)، اما به‌عنوان مدرک قانونی هویت برای اظهارنامهٔ مالیاتی، امضای قرارداد اجاره، رأی دادن در انتخابات، باز کردن حساب، و تقریباً هر خدمت دولتی پذیرفته می‌شود. گرفتن BankID یکی از نخستین گام‌های عملی است که یک ساکن جدید برمی‌دارد.</p>
          <h2>بانک‌ها و حساب‌ها</h2>
          <p>برای باز کردن حساب بانکی سوئدی معمولاً به یک شمارهٔ شخصی (personnummer) یا شمارهٔ هماهنگی، یک کارت شناسایی، و مدرک سکونت نیاز دارید. بانک‌های بزرگ: Swedbank، Handelsbanken، SEB، Nordea. گزینه‌های صرفاً آنلاین شامل Avanza و Nordnet می‌شوند.</p>
          <h2>بازنشستگی</h2>
          <p>سه لایه: مستمری دولتی (allmän pension)، مستمری شغلی از طریق کارفرما (tjänstepension)، و هر پس‌انداز خصوصی. مستمری دولتی نیازهای پایه را پوشش می‌دهد؛ بقیه بیش از آنچه مردم انتظار دارند اهمیت دارد.</p>
          ${ebookFactBox('fa', null, 'ارز: کرون سوئد (SEK) · تأسیس Riksbank: 1668 · رأی منفی به یورو: 2003 · اپلیکیشن پرداخت: Swish · هویت دیجیتال: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        pl: `<h2>Korona szwedzka (SEK)</h2>
          <p>Szwecja w 2003 zagłosowała przeciw przyjęciu euro i używa korony (kr). Riksbank — bank centralny Szwecji, założony w 1668 — ustala politykę pieniężną i drukuje gotówkę, której prawie nikt nie używa.</p>
          <h2>Karty i aplikacje</h2>
          <p>Gotówka jest rzadkością. Większość sklepów przyjmuje tylko kartę. Płatności między osobami przechodzą przez <em>Swish</em> — aplikację płatności mobilnych zbudowaną wspólnie przez banki. Podajesz numer telefonu, kwotę, notatkę i stukasz.</p>
          <h2>BankID</h2>
          <p>BankID to szwedzka krajowa tożsamość cyfrowa. To system prywatny (zbudowany przez banki), ale traktowany jako prawny dowód tożsamości przy rozliczeniach podatkowych, podpisywaniu umów najmu, głosowaniu w wyborach, otwieraniu kont i niemal każdej usłudze publicznej. Uzyskanie BankID to jeden z pierwszych praktycznych kroków nowego rezydenta.</p>
          <h2>Banki i konta</h2>
          <p>Aby otworzyć szwedzkie konto bankowe, zwykle potrzebujesz personnummer lub numeru koordynacyjnego, dokumentu tożsamości i potwierdzenia zamieszkania. Główne banki: Swedbank, Handelsbanken, SEB, Nordea. Opcje wyłącznie internetowe to m.in. Avanza i Nordnet.</p>
          <h2>Emerytura</h2>
          <p>Trzy warstwy: emerytura państwowa (allmän pension), emerytura zakładowa przez pracodawcę (tjänstepension) oraz wszelkie oszczędności prywatne. Emerytura państwowa pokrywa podstawy; reszta liczy się bardziej, niż ludzie się spodziewają.</p>
          ${ebookFactBox('pl', null, 'Waluta: korona szwedzka (SEK) · Riksbank założony: 1668 · Głosowanie przeciw euro: 2003 · Aplikacja płatnicza: Swish · Tożsamość cyfrowa: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        so: `<h2>Kronada Iswiidhan (SEK)</h2>
          <p>Iswiidhan waxay 2003 u codaysay ka soo horjeedka qaadashada euro waxayna isticmaashaa krona (kr). Riksbank — bankiga dhexe ee Iswiidhan, oo la aasaasay 1668 — wuxuu dejiyaa siyaasadda lacagta, wuxuuna daabacaa lacagta caddaanka ah oo ku dhowaad cidna isticmaaleyn.</p>
          <h2>Kaararka iyo app-yada</h2>
          <p>Lacagta caddaanku waa naadir. Dukaamada intooda badan waxay aqbalaan kaliya kaadhka. Lacag-bixinta qof-ilaa-qof waxay maraa <em>Swish</em> — app lacag-bixin moobiil ah oo ay bangiyadu si wadajir ah u dhiseen. Waxaad gelisaa lambar telefoon, qadarka, qoraal, oo taabataa.</p>
          <h2>BankID</h2>
          <p>BankID waa aqoonsiga dijitaalka ah ee qaranka Iswiidhan. Waa nidaam gaar loo leeyahay (oo ay dhiseen bangiyadu), laakiin waxaa loo aqoonsadaa caddayn sharci ah oo aqoonsi ah marka la gudbinayo canshuurta, la saxeexayo heshiisyada kirada, lagu codaynayo doorashooyinka, la furayo accounts, iyo ku dhowaad adeeg kasta oo dawladeed. Helitaanka BankID waa mid ka mid ah tallaabooyinka ugu horreeya ee wax ku ool ah ee uu qaado degane cusub.</p>
          <h2>Bangiyada iyo accounts-ka</h2>
          <p>Si aad u furato account bangi oo Iswiidhan ah, badanaa waxaad u baahan tahay personnummer ama lambar isku-dubbaridka, aqoonsi, iyo caddayn deganaansho. Bangiyada waaweyn: Swedbank, Handelsbanken, SEB, Nordea. Doorashooyinka kaliya online-ka ah waxaa ka mid ah Avanza iyo Nordnet.</p>
          <h2>Hawlgabka</h2>
          <p>Saddex lakab: hawlgabka dawladda (allmän pension), hawlgabka shaqada ee loo marayo loo-shaqeeyahaaga (tjänstepension), iyo wax kayd gaar ah oo kasta. Hawlgabka dawladdu wuxuu daboolaa aasaasiga; inta kale way ka muhiimsan tahay sida dadku filayaan.</p>
          ${ebookFactBox('so', null, 'Lacagta: krona Iswiidhan (SEK) · Riksbank la aasaasay: 1668 · U codeeyay ka soo horjeedka euro: 2003 · App lacag-bixin: Swish · Aqoonsi dijitaal ah: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ti: `<h2>ሽወደናዊ ክሮና (SEK)</h2>
          <p>ሽወደን ኣብ 2003 ኣንጻር ምቕባል euro ድምጺ ሃበት krona (kr) ድማ ትጥቀም። Riksbank — ኣብ 1668 ዝተመስረተ ማእከላይ ባንክ ሽወደን — ናይ ገንዘብ ፖሊሲ ይውስን፣ ነቲ ዳርጋ ዋላ ሓደ ዘይጥቀመሉ ጥረ ገንዘብ ድማ ይሓትም።</p>
          <h2>ካርድታትን app-ታትን</h2>
          <p>ጥረ ገንዘብ ሳሕቲ እዩ። መብዛሕተን ድኳናት ካርድ ጥራይ እየን ዝቕበላ። ካብ ሰብ ናብ ሰብ ክፍሊት ብመንገዲ <em>Swish</em> ይኸይድ — ብባንክታት ብሓባር ዝተሰርሐ ናይ ሞባይል ክፍሊት app። ቍጽሪ ተሌፎን፣ መጠን፣ መዘክር ተእቱ ትትንክፍ።</p>
          <h2>BankID</h2>
          <p>BankID ሽወደናዊ ሃገራዊ ዲጂታላዊ መንነት እዩ። ብሕታዊ ስርዓት እዩ (ብባንክታት ዝተሰርሐ)፣ ግን ንቐረጽ ምቕራብ፣ ናይ ክራይ ውዕል ምፍራም፣ ኣብ ምርጫታት ምድማጽ፣ accounts ምኽፋት ከምኡ’ውን ዳርጋ ዝኾነ ይኹን መንግስታዊ ኣገልግሎት ከም ሕጋዊ መረጋገጺ መንነት ይውሰድ። BankID ምርካብ ካብ ናይ ሓደ ሓድሽ ነባሪ ቀዳሞት ግብራዊ ስጉምትታት ሓደ እዩ።</p>
          <h2>ባንክታትን accountsን</h2>
          <p>ሽወደናዊ ናይ ባንክ account ንምኽፋት፣ መብዛሕትኡ ግዜ personnummer ወይ ናይ ምውህሃድ ቍጽሪ፣ መንነት መረጋገጺን መረጋገጺ መንበሪን የድልየካ። ዓበይቲ ባንክታት፦ Swedbank, Handelsbanken, SEB, Nordea። ኦንላይን ጥራይ ዝኾኑ ኣማራጺታት Avanza ከምኡ’ውን Nordnet የጠቓልሉ።</p>
          <h2>ጥሮታ</h2>
          <p>ሰለስተ ደረጃታት፦ መንግስታዊ ጥሮታ (allmän pension)፣ ብመንገዲ ወሃብ ስራሕካ ዝርከብ ሞያዊ ጥሮታ (tjänstepension)፣ ከምኡ’ውን ዝኾነ ብሕታዊ ቍጠባ። መንግስታዊ ጥሮታ ነቲ መሰረታዊ ይሽፍን፣ እቲ ዝተረፈ ካብቲ ሰባት ዝጽበይዎ ንላዕሊ ኣገዳሲ እዩ።</p>
          ${ebookFactBox('ti', null, 'ባጤራ፦ ሽወደናዊ krona (SEK) · Riksbank ዝተመስረተ፦ 1668 · ኣንጻር euro ድምጺ ምሃብ፦ 2003 · ናይ ክፍሊት app፦ Swish · ዲጂታላዊ መንነት፦ BankID።', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        tr: `<h2>İsveç kronu (SEK)</h2>
          <p>İsveç 2003'te euroyu benimsemeye karşı oy verdi ve kronu (kr) kullanır. Riksbank — 1668'de kurulan İsveç merkez bankası — para politikasını belirler ve neredeyse hiç kimsenin kullanmadığı nakdi basar.</p>
          <h2>Kartlar ve uygulamalar</h2>
          <p>Nakit nadirdir. Çoğu mağaza yalnızca kart kabul eder. Kişiden kişiye ödeme <em>Swish</em> üzerinden yürür — bankaların ortaklaşa geliştirdiği bir mobil ödeme uygulaması. Bir telefon numarası, tutar, bir not girer ve dokunursunuz.</p>
          <h2>BankID</h2>
          <p>BankID, İsveç'in ulusal dijital kimliğidir. Özel bir sistemdir (bankalarca geliştirilmiştir) ama vergi beyanı, kira sözleşmesi imzalama, seçimlerde oy verme, hesap açma ve neredeyse her kamu hizmeti için yasal kimlik kanıtı olarak kabul edilir. Bir BankID edinmek, yeni bir sakinin attığı ilk pratik adımlardan biridir.</p>
          <h2>Bankalar ve hesaplar</h2>
          <p>Bir İsveç banka hesabı açmak için genellikle bir personnummer ya da koordinasyon numarası, bir kimlik ve ikamet belgesi gerekir. Başlıca bankalar: Swedbank, Handelsbanken, SEB, Nordea. Yalnızca çevrimiçi seçenekler arasında Avanza ve Nordnet bulunur.</p>
          <h2>Emeklilik</h2>
          <p>Üç katman: devlet emekliliği (allmän pension), işvereniniz aracılığıyla mesleki emeklilik (tjänstepension) ve varsa özel tasarruflar. Devlet emekliliği temel ihtiyaçları karşılar; gerisi insanların beklediğinden daha çok önemlidir.</p>
          ${ebookFactBox('tr', null, 'Para birimi: İsveç kronu (SEK) · Riksbank kuruluşu: 1668 · Euroya karşı oy: 2003 · Ödeme uygulaması: Swish · Dijital kimlik: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        uk: `<h2>Шведська крона (SEK)</h2>
          <p>Швеція у 2003 проголосувала проти запровадження євро і використовує крону (kr). Riksbank — центральний банк Швеції, заснований у 1668 — визначає монетарну політику й друкує готівку, якою майже ніхто не користується.</p>
          <h2>Картки та застосунки</h2>
          <p>Готівка трапляється рідко. Більшість магазинів приймають лише картку. Платежі між особами йдуть через <em>Swish</em> — застосунок мобільних платежів, створений банками спільно. Ви вводите номер телефону, суму, примітку й торкаєтеся екрана.</p>
          <h2>BankID</h2>
          <p>BankID — це шведська національна цифрова ідентичність. Це приватна система (створена банками), але вона вважається юридичним підтвердженням особи для подання податкових декларацій, підписання договорів оренди, голосування на виборах, відкриття рахунків і майже будь-якої державної послуги. Отримання BankID — один із перших практичних кроків нового мешканця.</p>
          <h2>Банки та рахунки</h2>
          <p>Щоб відкрити шведський банківський рахунок, зазвичай потрібні personnummer або координаційний номер, документ, що посвідчує особу, та підтвердження проживання. Великі банки: Swedbank, Handelsbanken, SEB, Nordea. Серед суто онлайн-варіантів — Avanza та Nordnet.</p>
          <h2>Пенсія</h2>
          <p>Три рівні: державна пенсія (allmän pension), професійна пенсія через роботодавця (tjänstepension) та будь-які приватні заощадження. Державна пенсія покриває базові потреби; решта важить більше, ніж люди очікують.</p>
          ${ebookFactBox('uk', null, 'Валюта: шведська крона (SEK) · Riksbank засновано: 1668 · Голосування проти євро: 2003 · Платіжний застосунок: Swish · Цифрова ідентичність: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
      },
    },

    10: {
      kicker: {
        en: 'Chapter 10 · EU & world',
        sv: 'Kapitel 10 · EU & världen',
        'zh-Hans': '第10章 · 欧盟与世界',
        'zh-Hant': '第10章 · 歐盟與世界',
        ar: 'الفصل 10 · الاتحاد الأوروبي والعالم',
        ckb: 'بەشی 10 · یەکێتیی ئەوروپا و جیهان',
        fa: 'فصل 10 · اتحادیه اروپا و جهان',
        pl: 'Rozdział 10 · UE i świat',
        so: 'Cutubka 10 · Midowga Yurub iyo adduunka',
        ti: 'ምዕራፍ 10 · ኤውሮጳዊ ሕብረትን ዓለምን',
        tr: 'Bölüm 10 · AB ve dünya',
        uk: 'Розділ 10 · ЄС і світ',
      },
      title: {
        en: 'Sweden,',
        sv: 'Sverige,',
        'zh-Hans': '瑞典、',
        'zh-Hant': '瑞典、',
        ar: 'السويد،',
        ckb: 'سوید،',
        fa: 'سوئد،',
        pl: 'Szwecja,',
        so: 'Iswidhan,',
        ti: 'ሽወደን፡',
        tr: 'İsveç,',
        uk: 'Швеція,',
      },
      title_em: {
        en: 'the EU, and the world.',
        sv: 'EU och världen.',
        'zh-Hans': '欧盟与世界。',
        'zh-Hant': '歐盟與世界。',
        ar: 'والاتحاد الأوروبي، والعالم.',
        ckb: 'یەکێتیی ئەوروپا، و جیهان.',
        fa: 'اتحادیه اروپا، و جهان.',
        pl: 'Unia Europejska i świat.',
        so: 'Midowga Yurub, iyo adduunka.',
        ti: 'ኤውሮጳዊ ሕብረትን ዓለምን።',
        tr: 'AB ve dünya.',
        uk: 'Європейський Союз і світ.',
      },
      lede: {
        en: 'Sweden spent two centuries avoiding war and one decade rapidly joining alliances. The pattern is the same — be useful, stay out of trouble.',
        sv: 'Sverige tillbringade två sekel med att undvika krig och ett årtionde med att snabbt gå med i allianser. Mönstret är detsamma — gör nytta, undvik bråk.',
        'zh-Hans':
          '瑞典花了两个世纪避免战争，又用十年时间迅速加入各种联盟。模式始终一致——做个有用的人，远离麻烦。',
        'zh-Hant':
          '瑞典花了兩個世紀避免戰爭，又用十年時間迅速加入各種聯盟。模式始終一致——做個有用的人，遠離麻煩。',
        ar: 'أمضت السويد قرنين من الزمن تتجنب الحرب وعقدًا واحدًا تنضم فيه بسرعة إلى التحالفات. النمط واحد — كن مفيدًا وابقَ بعيدًا عن المتاعب.',
        ckb: 'سوید دوو سەدە لە جەنگ دوور کەوتەوە و لە یەک دەیەدا بە خێرایی پەیوەست بوو بە هاوپەیمانییەکانەوە. هەمان شێوازە — بەسوود بە و لە کێشە دوور بمێنەوە.',
        fa: 'سوئد دو قرن از جنگ دوری کرد و در یک دهه به‌سرعت به پیمان‌ها پیوست. الگو همان است — مفید باش و از دردسر دور بمان.',
        pl: 'Szwecja przez dwa stulecia unikała wojny, a w ciągu jednej dekady szybko przystąpiła do sojuszy. Wzorzec jest ten sam — być użytecznym, trzymać się z dala od kłopotów.',
        so: 'Iswidhan laba qarni ayay dagaal ka fogaatay, hal toban sanona si dhakhso ah ayay ugu biirtay isbahaysiyo. Qaabku waa isku mid — wax tar, dhibaatadana ka fogow.',
        ti: 'ሽወደን ንኽልተ ዘመን ካብ ውግእ ርሒቓ፡ ኣብ ሓደ ዓሰርተ ዓመት ድማ ብቕልጡፍ ናብ ሕብረታት ተጸምቢራ። እቲ ኣገባብ ሓደ እዩ — ጠቓሚ ኩን፡ ካብ ጸገም ድማ ርሓቕ።',
        tr: 'İsveç iki yüzyıl boyunca savaştan kaçındı ve bir on yıl içinde hızla ittifaklara katıldı. Örüntü aynı — yararlı ol, beladan uzak dur.',
        uk: 'Швеція два століття уникала війни, а за одне десятиліття швидко приєдналася до союзів. Закономірність та сама — бути корисним, триматися подалі від неприємностей.',
      },
      body: {
        en: `
          <h2>The European Union</h2>
          <p>Sweden joined the EU on 1 January 1995 after a referendum in 1994 (52% yes, 47% no). It uses the krona, not the euro. It has 21 seats in the European Parliament. EU law has precedence over Swedish law in areas the EU has competence over — trade, agriculture, fisheries, environment, free movement.</p>
          <h2>Schengen</h2>
          <p>Sweden is part of the Schengen Area — open internal borders with most of the EU, plus Norway, Iceland, Switzerland, and Liechtenstein. You can travel without passport checks; you may still be asked for ID.</p>
          <h2>NATO</h2>
          <p>Sweden was militarily non-aligned for over 200 years, neutral through both World Wars and the Cold War. After Russia's invasion of Ukraine, Sweden applied to join NATO in May 2022 and formally joined on 7 March 2024.</p>
          <h2>The United Nations and aid</h2>
          <p>Sweden joined the UN in 1946. It has a long record of international assistance and peace diplomacy. Dag Hammarskjöld, UN Secretary-General 1953–1961, was Swedish.</p>
          <h2>Defence</h2>
          <p>Conscription (<em>värnplikt</em>) was reactivated in 2017 and applies to both men and women born 1999 onwards. Not everyone is called up — selection is based on tests and motivation. Service is typically 9–12 months.</p>
          ${ebookFactBox('en', 'Facts to review', 'Joined EU: 1995 · Voted against euro: 2003 · Joined NATO: 2024 · UN member since: 1946 · Conscription reactivated: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        sv: svStudyBrief(
          [
            'Sverige är medlem i EU sedan 1995 och deltar i europeiskt samarbete om bland annat handel, miljö och fri rörlighet.',
            'Sverige använder fortfarande kronan efter folkomröstningen om euron 2003.',
            'Sverige blev medlem i NATO 2024 efter en lång period av militär alliansfrihet.',
            'Sverige är också medlem i FN och deltar i internationellt samarbete, bistånd och säkerhetspolitik.',
          ],
          'EU: 1995 · Euroomröstning: 2003 · NATO: 2024 · FN-medlem: 1946.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>欧盟（EU）</h2>
          <p>瑞典在1994年公投后（52%赞成，47%反对），于1995年1月1日加入欧盟。它使用克朗（krona，瑞典货币），而非欧元。它在欧洲议会拥有21个席位。在欧盟有权限的领域——贸易、农业、渔业、环境、自由流动——欧盟法律优先于瑞典法律。</p>
          <h2>申根（Schengen）</h2>
          <p>瑞典是申根区的一部分——与多数欧盟成员国，以及挪威、冰岛、瑞士和列支敦士登之间开放内部边界。你可以免护照检查通行；但仍可能被要求出示身份证件。</p>
          <h2>北约（NATO，北大西洋公约组织）</h2>
          <p>瑞典在军事上保持不结盟超过200年，在两次世界大战和冷战期间均保持中立。在俄罗斯入侵乌克兰之后，瑞典于2022年5月申请加入北约，并于2024年3月7日正式加入。</p>
          <h2>联合国与援助</h2>
          <p>瑞典于1946年加入联合国（UN）。它在国际援助与和平外交方面有着长期记录。1953–1961年担任联合国秘书长的达格·哈马舍尔德（Dag Hammarskjöld）就是瑞典人。</p>
          <h2>国防</h2>
          <p>义务兵役（<em>värnplikt</em>，征兵制）于2017年重新启用，适用于1999年及以后出生的男性和女性。并非所有人都会被征召——选拔依据测试与意愿。服役期通常为9–12个月。</p>
          ${ebookFactBox('zh-Hans', null, '加入欧盟：1995 · 公投反对欧元：2003 · 加入北约：2024 · 联合国成员起始年：1946 · 义务兵役重新启用：2017。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        'zh-Hant': `<h2>歐盟（EU）</h2>
          <p>瑞典在1994年公投後（52%贊成，47%反對），於1995年1月1日加入歐盟。它使用克朗（krona，瑞典貨幣），而非歐元。它在歐洲議會擁有21個席位。在歐盟有權限的領域——貿易、農業、漁業、環境、自由流動——歐盟法律優先於瑞典法律。</p>
          <h2>申根（Schengen）</h2>
          <p>瑞典是申根區的一部分——與多數歐盟成員國，以及挪威、冰島、瑞士和列支敦斯登之間開放內部邊界。你可以免護照檢查通行；但仍可能被要求出示身分證件。</p>
          <h2>北約（NATO，北大西洋公約組織）</h2>
          <p>瑞典在軍事上保持不結盟超過200年，在兩次世界大戰和冷戰期間均保持中立。在俄羅斯入侵烏克蘭之後，瑞典於2022年5月申請加入北約，並於2024年3月7日正式加入。</p>
          <h2>聯合國與援助</h2>
          <p>瑞典於1946年加入聯合國（UN）。它在國際援助與和平外交方面有著長期記錄。1953–1961年擔任聯合國秘書長的達格·哈馬舍爾德（Dag Hammarskjöld）就是瑞典人。</p>
          <h2>國防</h2>
          <p>義務兵役（<em>värnplikt</em>，徵兵制）於2017年重新啟用，適用於1999年及以後出生的男性和女性。並非所有人都會被徵召——選拔依據測試與意願。服役期通常為9–12個月。</p>
          ${ebookFactBox('zh-Hant', null, '加入歐盟：1995 · 公投反對歐元：2003 · 加入北約：2024 · 聯合國成員起始年：1946 · 義務兵役重新啟用：2017。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ar: `<h2>الاتحاد الأوروبي (EU)</h2>
          <p>انضمت السويد إلى EU في 1 يناير 1995 بعد استفتاء عام 1994 (52% نعم، 47% لا). تستخدم الكرونا (krona)، وليس اليورو (euro). لها 21 مقعدًا في البرلمان الأوروبي. لقانون الاتحاد الأوروبي الأسبقية على القانون السويدي في المجالات التي يملك الاتحاد صلاحيات فيها — التجارة، والزراعة، ومصايد الأسماك، والبيئة، وحرية التنقل.</p>
          <h2>Schengen (منطقة شنغن)</h2>
          <p>السويد جزء من منطقة Schengen — حدود داخلية مفتوحة مع معظم دول EU، إضافة إلى النرويج، وآيسلندا، وسويسرا، وليختنشتاين. يمكنك السفر دون فحوصات جواز السفر؛ لكن قد يُطلب منك إثبات الهوية.</p>
          <h2>NATO (حلف الناتو)</h2>
          <p>كانت السويد غير منحازة عسكريًا لأكثر من 200 عام، محايدة طوال الحربين العالميتين والحرب الباردة. بعد غزو روسيا لأوكرانيا، تقدمت السويد بطلب الانضمام إلى NATO في مايو 2022 وانضمت رسميًا في 7 مارس 2024.</p>
          <h2>الأمم المتحدة (UN) والمساعدات</h2>
          <p>انضمت السويد إلى UN عام 1946. ولها سجل طويل في المساعدة الدولية ودبلوماسية السلام. كان داغ همرشولد (Dag Hammarskjöld)، الأمين العام للأمم المتحدة 1953–1961، سويديًا.</p>
          <h2>الدفاع</h2>
          <p>أُعيد تفعيل <em>التجنيد الإلزامي</em> (värnplikt) عام 2017 وينطبق على الرجال والنساء المولودين عام 1999 فصاعدًا. لا يُستدعى الجميع — يقوم الاختيار على الاختبارات والدافعية. تستمر الخدمة عادةً 9–12 شهرًا.</p>
          ${ebookFactBox('ar', null, 'الانضمام إلى EU: 1995 · التصويت ضد اليورو: 2003 · الانضمام إلى NATO: 2024 · عضو في UN منذ: 1946 · إعادة تفعيل التجنيد الإلزامي: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ckb: `<h2>یەکێتیی ئەوروپا (EU)</h2>
          <p>سوید لە 1 ی ژانیوەری 1995 دوای ڕیفراندۆمی ساڵی 1994 (52% بەڵێ، 47% نا) پەیوەست بوو بە EU ـەوە. کرۆنا (krona) بەکاردێنێت، نەک یۆرۆ (euro). 21 کورسیی هەیە لە پەرلەمانی ئەوروپا. یاسای یەکێتیی ئەوروپا پێشینەی هەیە بەسەر یاسای سویدیدا لەو بوارانەی یەکێتییەکە دەسەڵاتی تێیاندا هەیە — بازرگانی، کشتوکاڵ، ماسیگرتن، ژینگە و ئازادیی جووڵە.</p>
          <h2>Schengen (ناوچەی شەنگن)</h2>
          <p>سوید بەشێکە لە ناوچەی Schengen — سنووری ناوخۆیی کراوە لەگەڵ زۆربەی ووڵاتانی EU، لەگەڵ نەرویج، ئایسلەند، سویسرا و لیختنشتاین. دەتوانیت بێ پشکنینی پاسپۆرت گەشت بکەیت؛ بەڵام لەوانەیە هێشتا داوای ناسنامەت لێ بکرێت.</p>
          <h2>NATO (هاوپەیمانیی ناتۆ)</h2>
          <p>سوید زیاتر لە 200 ساڵ لە ڕووی سەربازییەوە لاڕێ نەبوو، لە هەردوو جەنگی جیهانی و جەنگی سارددا بێلایەن بوو. دوای هێرشی ڕووسیا بۆ سەر ئۆکرانیا، سوید لە ئایاری 2022 داوای پەیوەستبوونی کرد بە NATO ـەوە و لە 7 ی ئازاری 2024 بە فەرمی پەیوەست بوو.</p>
          <h2>نەتەوە یەکگرتووەکان (UN) و یارمەتی</h2>
          <p>سوید لە ساڵی 1946 پەیوەست بوو بە UN ـەوە. ڕیکۆردێکی درێژی هەیە لە یارمەتیی نێودەوڵەتی و دیپلۆماسیی ئاشتی. داگ هامەرشۆلد (Dag Hammarskjöld)، سکرتێری گشتیی نەتەوە یەکگرتووەکان 1953–1961، سویدی بوو.</p>
          <h2>بەرگری</h2>
          <p><em>خزمەتی سەربازیی ناچاری</em> (värnplikt) لە ساڵی 2017 دووبارە چالاک کرایەوە و بۆ پیاو و ژنانی لەدایکبووی 1999 بەدواوە جێبەجێ دەبێت. هەموو کەس بانگ ناکرێت — هەڵبژاردن لەسەر بنەمای تاقیکردنەوە و ئارەزوومەندییە. خزمەتەکە بەزۆری 9–12 مانگ دەخایەنێت.</p>
          ${ebookFactBox('ckb', null, 'پەیوەستبوون بە EU: 1995 · دەنگدان دژی یۆرۆ: 2003 · پەیوەستبوون بە NATO: 2024 · ئەندامی UN لە: 1946 · دووبارە چالاککردنی خزمەتی سەربازیی ناچاری: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        fa: `<h2>اتحادیه اروپا (EU)</h2>
          <p>سوئد در 1 ژانویه 1995 پس از همه‌پرسی سال 1994 (52% آری، 47% نه) به EU پیوست. از کرون (krona) استفاده می‌کند، نه یورو (euro). در پارلمان اروپا 21 کرسی دارد. در زمینه‌هایی که اتحادیه در آن‌ها صلاحیت دارد — تجارت، کشاورزی، شیلات، محیط‌زیست و آزادی تردد — قانون اتحادیه اروپا بر قانون سوئد اولویت دارد.</p>
          <h2>Schengen (حوزه شنگن)</h2>
          <p>سوئد بخشی از حوزه Schengen است — مرزهای داخلی باز با بیشتر کشورهای EU، به‌علاوه نروژ، ایسلند، سوئیس و لیختن‌اشتاین. می‌توانید بدون بازرسی گذرنامه سفر کنید؛ اما ممکن است همچنان از شما کارت شناسایی خواسته شود.</p>
          <h2>NATO (پیمان ناتو)</h2>
          <p>سوئد بیش از 200 سال از نظر نظامی بی‌طرف بود، در هر دو جنگ جهانی و جنگ سرد بی‌طرف ماند. پس از حمله روسیه به اوکراین، سوئد در مه 2022 برای پیوستن به NATO درخواست داد و در 7 مارس 2024 رسماً عضو شد.</p>
          <h2>سازمان ملل متحد (UN) و کمک‌رسانی</h2>
          <p>سوئد در سال 1946 به UN پیوست. سابقه‌ای طولانی در کمک بین‌المللی و دیپلماسی صلح دارد. داگ همرشولد (Dag Hammarskjöld)، دبیرکل سازمان ملل در سال‌های 1953–1961، سوئدی بود.</p>
          <h2>دفاع</h2>
          <p><em>خدمت سربازی اجباری</em> (värnplikt) در سال 2017 دوباره فعال شد و شامل زنان و مردان متولد 1999 به بعد می‌شود. همه فراخوانده نمی‌شوند — گزینش بر پایه آزمون‌ها و انگیزه است. خدمت معمولاً 9–12 ماه طول می‌کشد.</p>
          ${ebookFactBox('fa', null, 'پیوستن به EU: 1995 · رأی منفی به یورو: 2003 · پیوستن به NATO: 2024 · عضو UN از: 1946 · فعال‌سازی مجدد سربازی اجباری: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        pl: `<h2>Unia Europejska</h2>
          <p>Szwecja przystąpiła do UE 1 stycznia 1995 roku po referendum w 1994 roku (52% za, 47% przeciw). Używa <em>korony</em> (krona), a nie euro. Ma 21 mandatów w Parlamencie Europejskim. Prawo UE ma pierwszeństwo przed prawem szwedzkim w obszarach, w których UE ma kompetencje — handel, rolnictwo, rybołówstwo, środowisko, swobodny przepływ.</p>
          <h2>Schengen</h2>
          <p>Szwecja należy do strefy Schengen — otwarte granice wewnętrzne z większością UE oraz Norwegią, Islandią, Szwajcarią i Liechtensteinem. Możesz podróżować bez kontroli paszportowej; nadal możesz zostać poproszony o dokument tożsamości.</p>
          <h2>NATO</h2>
          <p>Szwecja była militarnie niezaangażowana przez ponad 200 lat, neutralna podczas obu wojen światowych i zimnej wojny. Po inwazji Rosji na Ukrainę Szwecja złożyła wniosek o przystąpienie do NATO w maju 2022 roku i formalnie przystąpiła 7 marca 2024 roku.</p>
          <h2>Organizacja Narodów Zjednoczonych i pomoc</h2>
          <p>Szwecja przystąpiła do ONZ w 1946 roku. Ma długą historię pomocy międzynarodowej i dyplomacji pokojowej. Dag Hammarskjöld, Sekretarz Generalny ONZ w latach 1953–1961, był Szwedem.</p>
          <h2>Obrona</h2>
          <p>Pobór do wojska (<em>obowiązek służby wojskowej</em> (värnplikt)) został przywrócony w 2017 roku i dotyczy zarówno mężczyzn, jak i kobiet urodzonych od 1999 roku. Nie wszyscy są powoływani — wybór opiera się na testach i motywacji. Służba trwa zazwyczaj 9–12 miesięcy.</p>
          ${ebookFactBox('pl', null, 'Przystąpienie do UE: 1995 · Głosowanie przeciw euro: 2003 · Przystąpienie do NATO: 2024 · Członek ONZ od: 1946 · Przywrócenie poboru: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        so: `<h2>Midowga Yurub</h2>
          <p>Iswidhan waxay ku biirtay Midowga Yurub (EU) 1 Janaayo 1995 ka dib aftida 1994 (52% haa, 47% maya). Waxay isticmaashaa <em>kuroon</em> (krona), maaha yuuroo. Waxay leedahay 21 kursi oo ku jira Baarlamaanka Yurub. Sharciga Midowga Yurub wuxuu ka horreeyaa sharciga Iswidhan meelaha Midowga uu awood u leeyahay — ganacsi, beeraha, kalluumaysiga, deegaanka, dhaqdhaqaaqa xorta ah.</p>
          <h2>Schengen</h2>
          <p>Iswidhan waa qayb ka mid ah Aagga Schengen — xuduud gudaha ah oo furan oo ay la wadaagto inta badan Midowga Yurub, iyo sidoo kale Noorweey, Islaand, Swiiserlaand iyo Lixteshtaayn. Waxaad u safri kartaa baasaboor hubin la'aan; weli waxaa lagaa weydiin karaa aqoonsi.</p>
          <h2>NATO</h2>
          <p>Iswidhan in ka badan 200 oo sano si milatari ah uma aysan biirin isbahaysi (NATO waa isbahaysiga gaashaandhigga galbeedka), waxayna dhexdhexaad ahayd labadii Dagaal ee Adduunka iyo Dagaalkii Qaboobaa. Ka dib markii Ruushku ku soo duulay Ukraine, Iswidhan waxay codsatay inay ku biirto NATO bishii Maajo 2022, waxayna si rasmi ah u biirtay 7 Maarso 2024.</p>
          <h2>Qaramada Midoobay iyo gargaarka</h2>
          <p>Iswidhan waxay ku biirtay Qaramada Midoobay (UN) 1946. Waxay leedahay taariikh dheer oo gargaar caalami ah iyo diblomaasiyad nabadeed. Dag Hammarskjöld, oo ahaa Xoghayaha Guud ee Qaramada Midoobay 1953–1961, wuxuu ahaa Iswidhan.</p>
          <h2>Difaaca</h2>
          <p>Ciidan-qaadista (<em>waajibka adeegga milatari</em> (värnplikt)) waxaa dib loo soo nooleeyay 2017, waxayna khusaysaa rag iyo dumarba ee dhashay 1999 iyo wixii ka dambeeyay. Qof walba lama wacayo — xulashada waxay ku salaysan tahay imtixaanno iyo dhiirrigelin. Adeegga inta badan waa 9–12 bilood.</p>
          ${ebookFactBox('so', null, 'Ku biiritaanka EU: 1995 · Cod ka soo horjeeda yuuroo: 2003 · Ku biiritaanka NATO: 2024 · Xubin ka ah UN ilaa: 1946 · Dib u soo nooleynta ciidan-qaadista: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ti: `<h2>ኤውሮጳዊ ሕብረት</h2>
          <p>ሽወደን ድሕሪ ናይ 1994 ህዝበ-ውሳነ (52% እወ፡ 47% ኣይፋል) ኣብ 1 ጥሪ 1995 ናብ ኤውሮጳዊ ሕብረት (EU) ተጸምቢራ። ኤውሮ ዘይኮነ <em>ክሮና</em> (krona) ትጥቀም። ኣብ ኤውሮጳዊ ባይቶ 21 መንበር ኣለዋ። ሕጊ ኤውሮጳዊ ሕብረት ኣብቲ ሕብረት ስልጣን ዘለዎ ጽላታት — ንግዲ፡ ሕርሻ፡ ምግፋፍ ዓሳ፡ ኣከባቢ፡ ናጻ ምንቅስቓስ — ካብ ሕጊ ሽወደን ቀዳምነት ኣለዎ።</p>
          <h2>ሸንገን</h2>
          <p>ሽወደን ኣካል ናይ ዞባ ሸንገን እያ — ምስ መብዛሕትኡ ኤውሮጳዊ ሕብረት፡ ከምኡ'ውን ምስ ኖርወይ፡ ኣይስላንድ፡ ስዊዘርላንድን ሊክተንስታይንን ክፉት ውሽጣዊ ዶብ። ብዘይ ምርመራ ፓስፖርት ክትጓዓዝ ትኽእል፣ ኮይኑ ግን ናይ መንነት ወረቐት ክሕተት ይከኣል እዩ።</p>
          <h2>NATO</h2>
          <p>ሽወደን ካብ 200 ዓመት ንላዕሊ ብወተሃደራዊ መዳይ ኣብ ዋላ ሓደ ሕብረት ዘይተጸምበረት፡ ኣብ ክልቲኡ ኲናት ዓለምን ኣብ ዝሑል ኲናትን ገለልተኛ ኔራ። ድሕሪ ወራር ሩስያ ኣብ ዩክሬን፡ ሽወደን ኣብ ግንቦት 2022 ናብ NATO (ምዕራባዊ ወተሃደራዊ ሕብረት) ንምጽንባር ኣመልኪታ ኣብ 7 መጋቢት 2024 ብወግዒ ተጸምቢራ።</p>
          <h2>ውድብ ሕቡራት ሃገራትን ሓገዝን</h2>
          <p>ሽወደን ኣብ 1946 ናብ ውድብ ሕቡራት ሃገራት (UN) ተጸምቢራ። ነዊሕ ታሪኽ ዓለምለኻዊ ሓገዝን ሰላማዊ ዲፕሎማስን ኣለዋ። ዳግ ሃመርሾልድ፡ ካብ 1953–1961 ዋና ጸሓፊ ውድብ ሕቡራት ሃገራት፡ ሽወደናዊ ነበረ።</p>
          <h2>ምክልኻል</h2>
          <p>ግዴታ ወተሃደራዊ ኣገልግሎት (<em>ግዴታ ወተሃደራዊ ኣገልግሎት</em> (värnplikt)) ኣብ 2017 እንደገና ተበጊሱ፡ ንኽልቲኦም ካብ 1999 ንደሓር ዝተወልዱ ሰብኡትን ኣንስትን ይምልከት። ኩሉ ሰብ ኣይጽዋዕን — እቲ ምርጫ ኣብ ፈተናታትን ድሌትን ይምርኮስ። እቲ ኣገልግሎት መብዛሕትኡ ግዜ 9–12 ኣዋርሕ እዩ።</p>
          ${ebookFactBox('ti', null, 'ናብ ኤውሮጳዊ ሕብረት ምጽንባር: 1995 · ኣንጻር ኤውሮ ድምጺ: 2003 · ናብ NATO ምጽንባር: 2024 · ኣባል ውድብ ሕቡራት ሃገራት ካብ: 1946 · ግዴታ ወተሃደራዊ ኣገልግሎት እንደገና ምብጋስ: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        tr: `<h2>Avrupa Birliği</h2>
          <p>İsveç, 1994 yılındaki bir referandumun ardından (yüzde 52 evet, yüzde 47 hayır) 1 Ocak 1995'te AB'ye katıldı. Avro değil, <em>kron</em> (krona) kullanır. Avrupa Parlamentosu'nda 21 sandalyesi vardır. AB hukuku, AB'nin yetkili olduğu alanlarda — ticaret, tarım, balıkçılık, çevre, serbest dolaşım — İsveç hukukuna göre önceliklidir.</p>
          <h2>Schengen</h2>
          <p>İsveç, Schengen Bölgesi'nin bir parçasıdır — AB'nin çoğuyla ve ayrıca Norveç, İzlanda, İsviçre ve Lihtenştayn ile açık iç sınırlar. Pasaport kontrolü olmadan seyahat edebilirsiniz; yine de kimlik sorulabilir.</p>
          <h2>NATO</h2>
          <p>İsveç 200 yıldan fazla bir süre askeri açıdan ittifaksızdı, her iki Dünya Savaşı'nda ve Soğuk Savaş boyunca tarafsızdı. Rusya'nın Ukrayna'yı işgalinin ardından İsveç, Mayıs 2022'de NATO'ya katılmak için başvurdu ve 7 Mart 2024'te resmen katıldı.</p>
          <h2>Birleşmiş Milletler ve yardım</h2>
          <p>İsveç, 1946'da BM'ye katıldı. Uzun bir uluslararası yardım ve barış diplomasisi geçmişine sahiptir. 1953–1961 yılları arasında BM Genel Sekreteri olan Dag Hammarskjöld İsveçliydi.</p>
          <h2>Savunma</h2>
          <p>Zorunlu askerlik (<em>askerlik yükümlülüğü</em> (värnplikt)) 2017'de yeniden yürürlüğe girdi ve 1999 ve sonrasında doğan hem erkekleri hem de kadınları kapsar. Herkes çağrılmaz — seçim testlere ve motivasyona dayanır. Hizmet genellikle 9–12 aydır.</p>
          ${ebookFactBox('tr', null, "AB'ye katılım: 1995 · Avroya karşı oy: 2003 · NATO'ya katılım: 2024 · BM üyeliği: 1946 · Zorunlu askerliğin yeniden yürürlüğe girmesi: 2017.", ['uhrStudyMaterial', 'governmentNato'])}
        `,
        uk: `<h2>Європейський Союз</h2>
          <p>Швеція приєдналася до ЄС 1 січня 1995 року після референдуму 1994 року (52% за, 47% проти). Вона використовує <em>крону</em> (krona), а не євро. Має 21 місце в Європейському парламенті. Право ЄС має перевагу над шведським правом у сферах, де ЄС має компетенцію — торгівля, сільське господарство, рибальство, довкілля, вільне пересування.</p>
          <h2>Шенген</h2>
          <p>Швеція входить до Шенгенської зони — відкриті внутрішні кордони з більшістю країн ЄС, а також Норвегією, Ісландією, Швейцарією та Ліхтенштейном. Ви можете подорожувати без паспортного контролю; вас усе ж можуть попросити пред'явити документ, що посвідчує особу.</p>
          <h2>НАТО</h2>
          <p>Швеція понад 200 років залишалася військово позаблоковою, нейтральною під час обох світових воєн і холодної війни. Після вторгнення Росії в Україну Швеція подала заявку на вступ до НАТО в травні 2022 року та офіційно приєдналася 7 березня 2024 року.</p>
          <h2>Організація Об'єднаних Націй і допомога</h2>
          <p>Швеція вступила до ООН у 1946 році. Вона має давню історію міжнародної допомоги та мирної дипломатії. Даг Гаммаршельд, Генеральний секретар ООН у 1953–1961 роках, був шведом.</p>
          <h2>Оборона</h2>
          <p>Військовий призов (<em>військовий обов'язок</em> (värnplikt)) було відновлено у 2017 році, і він стосується як чоловіків, так і жінок, народжених із 1999 року. Призивають не всіх — відбір ґрунтується на тестах і мотивації. Служба зазвичай триває 9–12 місяців.</p>
          ${ebookFactBox('uk', null, 'Вступ до ЄС: 1995 · Голосування проти євро: 2003 · Вступ до НАТО: 2024 · Член ООН з: 1946 · Відновлення призову: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
      },
    },

    11: {
      kicker: {
        en: 'Chapter 11 · Migration',
        sv: 'Kapitel 11 · Migration',
        'zh-Hans': '第11章 · 移民',
        'zh-Hant': '第11章 · 移民',
        ar: 'الفصل 11 · الهجرة',
        ckb: 'بەشی 11 · کۆچ',
        fa: 'فصل 11 · مهاجرت',
        pl: 'Rozdział 11 · Migracja',
        so: 'Cutubka 11 · Socdaalka',
        ti: 'ምዕራፍ 11 · ስደት',
        tr: 'Bölüm 11 · Göç',
        uk: 'Розділ 11 · Міграція',
      },
      title: {
        en: 'Migration, residence,',
        sv: 'Migration, uppehåll',
        'zh-Hans': '移民、居留，',
        'zh-Hant': '移民、居留，',
        ar: 'الهجرة، والإقامة،',
        ckb: 'کۆچ، نیشتەجێبوون،',
        fa: 'مهاجرت، اقامت،',
        pl: 'Migracja, pobyt',
        so: 'Socdaalka, deganaanshaha',
        ti: 'ስደት፡ መንበሪ፡',
        tr: 'Göç, ikamet',
        uk: 'Міграція, проживання',
      },
      title_em: {
        en: 'and citizenship.',
        sv: 'och medborgarskap.',
        'zh-Hans': '与公民身份。',
        'zh-Hant': '與公民身分。',
        ar: 'والمواطنة.',
        ckb: 'و هاوڵاتیبوون.',
        fa: 'و شهروندی.',
        pl: 'i obywatelstwo.',
        so: 'iyo dhalashada.',
        ti: 'ዜግነትን።',
        tr: 've vatandaşlık.',
        uk: 'і громадянство.',
      },
      lede: {
        en: 'Becoming a Swedish citizen is a process more than an event. The paperwork is long, but the rules are unusually clear.',
        sv: 'Att bli svensk medborgare är mer en process än ett ögonblick. Pappersarbetet är långt, men reglerna är ovanligt tydliga.',
        'zh-Hans': '成为瑞典公民更像是一个过程，而非一个瞬间。文书手续繁多，但规则却出奇地清晰。',
        'zh-Hant': '成為瑞典公民更像是一個過程，而非一個瞬間。文書手續繁多，但規則卻出奇地清晰。',
        ar: 'أن تصبح مواطنًا سويديًا عمليةٌ أكثر منه حدثًا. الأوراق طويلة، لكن القواعد واضحة بشكل غير معتاد.',
        ckb: 'بوون بە هاوڵاتیی سویدی زیاتر پرۆسەیەکە تا ڕووداوێک. کاغەزبازییەکە درێژە، بەڵام یاساکان بە شێوەیەکی نائاسایی ڕوونن.',
        fa: 'شهروند سوئد شدن بیش از آنکه یک رویداد باشد، یک فرایند است. کاغذبازی طولانی است، اما قوانین به‌طور غیرعادی روشن‌اند.',
        pl: 'Zostanie obywatelem Szwecji to bardziej proces niż wydarzenie. Formalności są długie, ale zasady są wyjątkowo jasne.',
        so: 'In aad noqoto muwaadin Iswidhan waa hannaan ka badan dhacdo. Warqadaha way dheer yihiin, laakiin xeerarku waa kuwo si aan caadi ahayn u cad.',
        ti: 'ዜጋ ሽወደን ምዃን ካብ ፍጻመ ንላዕሊ መስርሕ እዩ። እቲ ወረቓቕቲ ነዊሕ እዩ፡ እቶም ሕግታት ግን ብዘይተለመደ መንገዲ ንጹራት እዮም።',
        tr: 'İsveç vatandaşı olmak bir olaydan çok bir süreçtir. Evrak işleri uzundur, ancak kurallar alışılmadık derecede açıktır.',
        uk: 'Стати громадянином Швеції — це радше процес, ніж подія. Паперова робота довга, але правила надзвичайно зрозумілі.',
      },
      body: {
        en: `
          <h2>Who is who</h2>
          <ul>
            <li><b>Migrationsverket</b> — the Migration Agency. Decides residence permits, asylum, family reunification, work permits, and citizenship.</li>
            <li><b>Skatteverket</b> — gives you your personnummer once you have a residence permit and are registered as living in Sweden.</li>
            <li><b>Polisen</b> — handles passports and some ID matters.</li>
          </ul>
          <h2>Routes to permanent residence</h2>
          <p>You can come to Sweden as: a worker (with a job offer above a minimum wage), a student, a researcher, a family member of a resident, an EU citizen exercising freedom of movement, or an asylum seeker. After a period of legal residence — typically four to five years — you may apply for permanent residence (<em>permanent uppehållstillstånd</em>) or, for EU citizens, permanent right of residence.</p>
          <h2>Becoming Swedish</h2>
          <p>To apply for Swedish citizenship by naturalisation, you generally need to:</p>
          <ul>
            <li>Be at least 18 years old (children are usually included with a parent's application).</li>
            <li>Have a permanent residence permit, right of residence, or right of permanent residence.</li>
            <li>Have lived in Sweden for a qualifying period — typically five years (shorter for stateless persons, refugees, and Nordic citizens).</li>
            <li>Have led an orderly life — no significant criminal record.</li>
            <li>(From 2026) Pass the medborgarskapsprov — the citizenship test on civic knowledge and Swedish — and meet a Swedish-language requirement.</li>
          </ul>
          <h2>Dual citizenship</h2>
          <p>Sweden has accepted dual citizenship since 2001. You do not lose your original citizenship by becoming Swedish (subject to your origin country's rules).</p>
          ${ebookFactBox('en', 'Current citizenship notes', 'New citizenship rules apply from 6 June 2026. UHR says the first civic-knowledge sitting is 15 August 2026 in Stockholm. Standard residence requirement: 5 years · Dual citizenship: allowed (since 2001) · Decision authority: Migrationsverket.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Migrationsverket handlägger många frågor om uppehållstillstånd, asyl, familjeanknytning, arbetstillstånd och medborgarskap.',
            'Skatteverket folkbokför personer som bor i Sverige och hanterar personnummer.',
            'Medborgarskap kräver normalt stadigvarande anknytning till Sverige, skötsamhet och att övriga krav är uppfyllda.',
            'Dubbelt medborgarskap är tillåtet enligt svensk rätt, men andra länders regler kan påverka.',
          ],
          'Migrationsverket · Skatteverket · Permanent uppehållstillstånd/rätt · Dubbelt medborgarskap tillåts sedan 2001.',
          'Kontrollera alltid aktuella krav hos Migrationsverket och UHR. Regler kan ändras, och den här boken är bara ett studiehjälpmedel.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>谁是谁</h2>
          <ul>
            <li><b>Migrationsverket</b>（移民局）——负责裁定居留许可、庇护、家庭团聚、工作许可和公民身份。</li>
            <li><b>Skatteverket</b>（税务局）——在你取得居留许可并登记为在瑞典居住后，向你发放个人身份号码（personnummer）。</li>
            <li><b>Polisen</b>（警察局）——负责护照及部分身份证件事务。</li>
          </ul>
          <h2>取得永久居留的途径</h2>
          <p>你可以通过以下身份来到瑞典：劳工（持有工资高于最低标准的工作邀约）、学生、研究人员、居民的家庭成员、行使自由流动权的欧盟公民，或寻求庇护者。在合法居留一段时间后——通常为四到五年——你可以申请永久居留许可（<em>permanent uppehållstillstånd</em>），欧盟公民则可申请永久居留权。</p>
          <h2>成为瑞典人</h2>
          <p>要通过入籍申请瑞典公民身份，你通常需要：</p>
          <ul>
            <li>年满18岁（儿童通常随父母的申请一并纳入）。</li>
            <li>持有永久居留许可、居留权或永久居留权。</li>
            <li>在瑞典居住满规定期限——通常为五年（无国籍者、难民和北欧国家公民期限较短）。</li>
            <li>生活有序——没有重大犯罪记录。</li>
            <li>（自2026年起）通过公民身份考试（medborgarskapsprov，关于公民知识与瑞典语的考试），并满足瑞典语语言要求。</li>
          </ul>
          <h2>双重国籍</h2>
          <p>瑞典自2001年起接受双重国籍。成为瑞典公民并不会使你失去原有国籍（视你原籍国的规定而定）。</p>
          ${ebookFactBox('zh-Hans', null, '新的公民身份规则自2026年6月6日起适用。UHR（瑞典大学与高校理事会）表示，首场公民知识考试于2026年8月15日在斯德哥尔摩举行。标准居留年限要求：5年 · 双重国籍：允许（自2001年起） · 决定机关：Migrationsverket。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>誰是誰</h2>
          <ul>
            <li><b>Migrationsverket</b>（移民局）——負責裁定居留許可、庇護、家庭團聚、工作許可和公民身分。</li>
            <li><b>Skatteverket</b>（稅務局）——在你取得居留許可並登記為在瑞典居住後，向你發放個人身分號碼（personnummer）。</li>
            <li><b>Polisen</b>（警察局）——負責護照及部分身分證件事務。</li>
          </ul>
          <h2>取得永久居留的途徑</h2>
          <p>你可以透過以下身分來到瑞典：勞工（持有工資高於最低標準的工作邀約）、學生、研究人員、居民的家庭成員、行使自由流動權的歐盟公民，或尋求庇護者。在合法居留一段時間後——通常為四到五年——你可以申請永久居留許可（<em>permanent uppehållstillstånd</em>），歐盟公民則可申請永久居留權。</p>
          <h2>成為瑞典人</h2>
          <p>要透過入籍申請瑞典公民身分，你通常需要：</p>
          <ul>
            <li>年滿18歲（兒童通常隨父母的申請一併納入）。</li>
            <li>持有永久居留許可、居留權或永久居留權。</li>
            <li>在瑞典居住滿規定期限——通常為五年（無國籍者、難民和北歐國家公民期限較短）。</li>
            <li>生活有序——沒有重大犯罪記錄。</li>
            <li>（自2026年起）通過公民身分考試（medborgarskapsprov，關於公民知識與瑞典語的考試），並滿足瑞典語語言要求。</li>
          </ul>
          <h2>雙重國籍</h2>
          <p>瑞典自2001年起接受雙重國籍。成為瑞典公民並不會使你失去原有國籍（視你原籍國的規定而定）。</p>
          ${ebookFactBox('zh-Hant', null, '新的公民身分規則自2026年6月6日起適用。UHR（瑞典大學與高校理事會）表示，首場公民知識考試於2026年8月15日在斯德哥爾摩舉行。標準居留年限要求：5年 · 雙重國籍：允許（自2001年起） · 決定機關：Migrationsverket。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>من هو من</h2>
          <ul>
            <li><b>Migrationsverket</b> (وكالة الهجرة) — وكالة الهجرة. تبتّ في تصاريح الإقامة، واللجوء، ولمّ شمل الأسرة، وتصاريح العمل، والمواطنة.</li>
            <li><b>Skatteverket</b> (مصلحة الضرائب) — يمنحك رقمك الشخصي (personnummer) بمجرد حصولك على تصريح إقامة وتسجيلك مقيمًا في السويد.</li>
            <li><b>Polisen</b> (الشرطة) — تتولى جوازات السفر وبعض مسائل الهوية.</li>
          </ul>
          <h2>مسارات الإقامة الدائمة</h2>
          <p>يمكنك القدوم إلى السويد بصفتك: عاملًا (بعرض عمل يفوق حدًا أدنى للأجر)، أو طالبًا، أو باحثًا، أو فردًا من أسرة مقيم، أو مواطنًا في EU (الاتحاد الأوروبي) يمارس حرية التنقل، أو طالب لجوء. بعد فترة من الإقامة القانونية — عادةً أربع إلى خمس سنوات — يمكنك التقدم بطلب إقامة دائمة <em>تصريح الإقامة الدائمة</em> (permanent uppehållstillstånd)، أو، بالنسبة لمواطني EU، حق الإقامة الدائمة.</p>
          <h2>أن تصبح سويديًا</h2>
          <p>للتقدم بطلب الجنسية السويدية عن طريق التجنّس، تحتاج عمومًا إلى:</p>
          <ul>
            <li>أن تكون 18 عامًا على الأقل (يُدرج الأطفال عادةً ضمن طلب أحد الوالدين).</li>
            <li>أن يكون لديك تصريح إقامة دائمة، أو حق إقامة، أو حق إقامة دائمة.</li>
            <li>أن تكون قد عشت في السويد مدةً مؤهِّلة — عادةً خمس سنوات (أقصر للأشخاص عديمي الجنسية، واللاجئين، ومواطني دول الشمال).</li>
            <li>أن تكون قد عشت حياة منظمة — دون سجل جنائي ذي شأن.</li>
            <li>(اعتبارًا من 2026) أن تجتاز medborgarskapsprov (اختبار المواطنة) — اختبار المواطنة في المعرفة المدنية واللغة السويدية — وأن تستوفي متطلب اللغة السويدية.</li>
          </ul>
          <h2>الجنسية المزدوجة</h2>
          <p>تقبل السويد الجنسية المزدوجة منذ عام 2001. لا تفقد جنسيتك الأصلية بأن تصبح سويديًا (رهنًا بقواعد بلد المنشأ).</p>
          ${ebookFactBox('ar', null, 'تُطبَّق قواعد المواطنة الجديدة اعتبارًا من 6 يونيو 2026. يقول UHR (مجلس القبول الجامعي) إن أول جلسة لاختبار المعرفة المدنية ستكون في 15 أغسطس 2026 في ستوكهولم. متطلب الإقامة المعياري: 5 سنوات · الجنسية المزدوجة: مسموحة (منذ 2001) · جهة القرار: Migrationsverket.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>کێ کێیە</h2>
          <ul>
            <li><b>Migrationsverket</b> (ئاژانسی کۆچ) — ئاژانسی کۆچ. بڕیار دەدات لەسەر مۆڵەتی نیشتەجێبوون، پەنابەری، یەکخستنەوەی خێزان، مۆڵەتی کار، و هاوڵاتیبوون.</li>
            <li><b>Skatteverket</b> (ئاژانسی باج) — هەرکە مۆڵەتی نیشتەجێبوونت هەبوو و وەک نیشتەجێی سوید تۆمار کرایت، ژمارەی کەسیت (personnummer) پێدەدات.</li>
            <li><b>Polisen</b> (پۆلیس) — مامەڵە لەگەڵ پاسپۆرت و هەندێک کاروباری ناسنامە دەکات.</li>
          </ul>
          <h2>ڕێگاکانی نیشتەجێبوونی هەمیشەیی</h2>
          <p>دەتوانیت بەم شێوازانە بێیتە سوید: کرێکار (بە پێشکەشکردنی کارێک سەرووی حەددی نزمی کرێ)، خوێندکار، توێژەر، ئەندامی خێزانی نیشتەجێیەک، هاوڵاتیی EU (یەکێتیی ئەوروپا) کە ئازادیی جووڵە بەکاردێنێت، یان داواکاری پەنابەری. دوای ماوەیەک نیشتەجێبوونی یاسایی — بەزۆری چوار بۆ پێنج ساڵ — دەتوانیت داوای نیشتەجێبوونی هەمیشەیی بکەیت <em>مۆڵەتی نیشتەجێبوونی هەمیشەیی</em> (permanent uppehållstillstånd)، یان، بۆ هاوڵاتیانی EU، مافی نیشتەجێبوونی هەمیشەیی.</p>
          <h2>بوون بە سویدی</h2>
          <p>بۆ داواکردنی هاوڵاتیی سویدی لە ڕێگەی ڕەگەزنامەوەرگرتنەوە، بەگشتی پێویستە:</p>
          <ul>
            <li>لانیکەم 18 ساڵان بیت (منداڵان بەزۆری لەگەڵ داواکاریی یەکێک لە دایک و باوک دەخرێنە ناو).</li>
            <li>مۆڵەتی نیشتەجێبوونی هەمیشەیی، مافی نیشتەجێبوون، یان مافی نیشتەجێبوونی هەمیشەییت هەبێت.</li>
            <li>ماوەیەکی پێویست لە سوید ژیابیت — بەزۆری پێنج ساڵ (بۆ کەسانی بێ‌ڕەگەزنامە، پەنابەران و هاوڵاتیانی ووڵاتانی نۆردیک کورتترە).</li>
            <li>ژیانێکی ڕێکوپێکت هەبووبێت — بەبێ تۆمارێکی تاوانیی گرنگ.</li>
            <li>(لە 2026 بەدواوە) لە medborgarskapsprov (تاقیکردنەوەی هاوڵاتیبوون) سەرکەوتوو بیت — تاقیکردنەوەی هاوڵاتیبوون لەسەر زانیاریی شارستانی و زمانی سویدی — و مەرجی زمانی سویدی بهێنیتە دی.</li>
          </ul>
          <h2>هاوڵاتیی دووانە</h2>
          <p>سوید لە ساڵی 2001 ـەوە هاوڵاتیی دووانەی پەسەند کردووە. بە سویدیبوون، هاوڵاتیی ڕەسەنی خۆت لەدەست نادەیت (بەپێی یاساکانی ووڵاتی ڕەسەنت).</p>
          ${ebookFactBox('ckb', null, 'یاسا نوێیەکانی هاوڵاتیبوون لە 6 ی حوزەیرانی 2026 ـەوە جێبەجێ دەبن. UHR (ئەنجوومەنی وەرگرتنی زانکۆیی) دەڵێت یەکەم دانیشتنی تاقیکردنەوەی زانیاریی شارستانی لە 15 ی ئابی 2026 لە ستۆکهۆڵم دەبێت. مەرجی نیشتەجێبوونی ستانداردی: 5 ساڵ · هاوڵاتیی دووانە: ڕێگەپێدراو (لە 2001 ـەوە) · دەسەڵاتی بڕیاردان: Migrationsverket.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>چه کسی چه‌کاره است</h2>
          <ul>
            <li><b>Migrationsverket</b> (اداره مهاجرت) — اداره مهاجرت. درباره مجوزهای اقامت، پناهندگی، پیوند خانواده، مجوزهای کار و شهروندی تصمیم می‌گیرد.</li>
            <li><b>Skatteverket</b> (اداره مالیات) — به‌محض اینکه مجوز اقامت بگیرید و به‌عنوان ساکن سوئد ثبت شوید، شماره شخصی (personnummer) شما را صادر می‌کند.</li>
            <li><b>Polisen</b> (پلیس) — رسیدگی به گذرنامه‌ها و برخی امور هویتی.</li>
          </ul>
          <h2>مسیرهای اقامت دائم</h2>
          <p>می‌توانید به این صورت‌ها به سوئد بیایید: کارگر (با پیشنهاد کاری بالاتر از حداقل دستمزد)، دانشجو، پژوهشگر، عضو خانواده یک مقیم، شهروند EU (اتحادیه اروپا) که از آزادی تردد استفاده می‌کند، یا پناه‌جو. پس از مدتی اقامت قانونی — معمولاً چهار تا پنج سال — می‌توانید برای اقامت دائم <em>مجوز اقامت دائم</em> (permanent uppehållstillstånd) درخواست دهید، یا برای شهروندان EU، حق اقامت دائم.</p>
          <h2>سوئدی شدن</h2>
          <p>برای درخواست شهروندی سوئد از راه تابعیت‌پذیری، عموماً باید:</p>
          <ul>
            <li>دست‌کم 18 سال داشته باشید (کودکان معمولاً همراه با درخواست یکی از والدین لحاظ می‌شوند).</li>
            <li>مجوز اقامت دائم، حق اقامت، یا حق اقامت دائم داشته باشید.</li>
            <li>مدت واجد شرایطی در سوئد زندگی کرده باشید — معمولاً پنج سال (برای افراد بی‌تابعیت، پناهندگان و شهروندان کشورهای اسکاندیناوی کوتاه‌تر).</li>
            <li>زندگی منظمی داشته باشید — بدون سابقه کیفری قابل‌توجه.</li>
            <li>(از 2026) در medborgarskapsprov (آزمون شهروندی) — آزمون شهروندی درباره دانش مدنی و زبان سوئدی — قبول شوید و الزام زبان سوئدی را برآورده کنید.</li>
          </ul>
          <h2>شهروندی دوگانه</h2>
          <p>سوئد از سال 2001 شهروندی دوگانه را پذیرفته است. با سوئدی شدن، شهروندی اصلی خود را از دست نمی‌دهید (بسته به قوانین کشور مبدأ شما).</p>
          ${ebookFactBox('fa', null, 'قوانین جدید شهروندی از 6 ژوئن 2026 اعمال می‌شود. UHR (شورای پذیرش دانشگاهی) می‌گوید نخستین جلسه آزمون دانش مدنی در 15 اوت 2026 در استکهلم برگزار می‌شود. الزام اقامت استاندارد: 5 سال · شهروندی دوگانه: مجاز (از 2001) · مرجع تصمیم‌گیری: Migrationsverket.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Kto jest kim</h2>
          <ul>
            <li><b>Migrationsverket</b> — Urząd ds. Migracji (Migrationsverket). Decyduje o zezwoleniach na pobyt, azylu, łączeniu rodzin, pozwoleniach na pracę i obywatelstwie.</li>
            <li><b>Skatteverket</b> — Urząd Skarbowy (Skatteverket) nadaje numer personalny (personnummer), gdy masz zezwolenie na pobyt i jesteś zarejestrowany jako mieszkaniec Szwecji.</li>
            <li><b>Polisen</b> — Policja (Polisen) zajmuje się paszportami i niektórymi sprawami dotyczącymi dokumentów tożsamości.</li>
          </ul>
          <h2>Drogi do pobytu stałego</h2>
          <p>Do Szwecji możesz przyjechać jako: pracownik (z ofertą pracy powyżej płacy minimalnej), student, naukowiec, członek rodziny mieszkańca, obywatel UE korzystający ze swobody przepływu lub osoba ubiegająca się o azyl. Po okresie legalnego pobytu — zwykle od czterech do pięciu lat — możesz ubiegać się o pobyt stały (<em>zezwolenie na pobyt stały</em> (permanent uppehållstillstånd)) lub, w przypadku obywateli UE, o prawo stałego pobytu.</p>
          <h2>Stawanie się Szwedem</h2>
          <p>Aby ubiegać się o obywatelstwo szwedzkie w drodze naturalizacji, zazwyczaj musisz:</p>
          <ul>
            <li>Mieć co najmniej 18 lat (dzieci są zwykle uwzględniane we wniosku rodzica).</li>
            <li>Mieć zezwolenie na pobyt stały, prawo pobytu lub prawo stałego pobytu.</li>
            <li>Mieszkać w Szwecji przez wymagany okres — zwykle pięć lat (krócej w przypadku bezpaństwowców, uchodźców i obywateli krajów nordyckich).</li>
            <li>Prowadzić uporządkowane życie — bez poważnej karalności.</li>
            <li>(Od 2026) Zdać <em>egzamin obywatelski</em> (medborgarskapsprovet) — test wiedzy obywatelskiej i języka szwedzkiego — oraz spełnić wymóg znajomości języka szwedzkiego.</li>
          </ul>
          <h2>Podwójne obywatelstwo</h2>
          <p>Szwecja akceptuje podwójne obywatelstwo od 2001 roku. Nie tracisz swojego pierwotnego obywatelstwa, stając się Szwedem (z zastrzeżeniem przepisów twojego kraju pochodzenia).</p>
          ${ebookFactBox('pl', null, 'Nowe przepisy dotyczące obywatelstwa obowiązują od 6 czerwca 2026 roku. UHR podaje, że pierwszy egzamin z wiedzy obywatelskiej odbędzie się 15 sierpnia 2026 roku w Sztokholmie. Standardowy wymóg pobytu: 5 lat · Podwójne obywatelstwo: dozwolone (od 2001) · Organ decyzyjny: Migrationsverket.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Yaa yahay yaa</h2>
          <ul>
            <li><b>Migrationsverket</b> — Hay'adda Socdaalka (Migrationsverket). Waxay go'aamisaa oggolaanshaha deganaanshaha, magangalyada, midaynta qoyska, oggolaanshaha shaqada, iyo dhalashada.</li>
            <li><b>Skatteverket</b> — Hay'adda Canshuuraha (Skatteverket) waxay ku siisaa lambarkaaga shakhsi ahaaneed (personnummer) marka aad haysato oggolaanshe deganaansho oo aad u diiwaangashan tahay inaad ku nooshahay Iswidhan.</li>
            <li><b>Polisen</b> — Booliska (Polisen) waxay maaraysaa baasaboorrada iyo arrimaha qaar ee aqoonsiga.</li>
          </ul>
          <h2>Waddooyinka loo maro deganaanshaha rasmiga ah</h2>
          <p>Waxaad u iman kartaa Iswidhan: shaqaale (oo haysta dalbasho shaqo oo ka sarreeya mushaharka ugu yar), arday, cilmi-baadhe, xubin qoyska ah oo deggan, muwaadin Midowga Yurub oo isticmaalaya xorriyadda dhaqdhaqaaqa, ama qof magangalyo doon ah. Ka dib muddo deganaansho sharci ah — caadi ahaan afar ilaa shan sano — waxaad codsan kartaa deganaansho rasmi ah (<em>oggolaanshaha deganaanshaha joogtada ah</em> (permanent uppehållstillstånd)) ama, muwaadiniinta Midowga Yurub, xaqa deganaanshaha joogtada ah.</p>
          <h2>Noqoshada qof Iswidhan ah</h2>
          <p>Si aad u codsato dhalashada Iswidhan iyada oo loo marayo dabiicinta, guud ahaan waxaad u baahan tahay inaad:</p>
          <ul>
            <li>Ugu yaraan 18 sano jir tahay (caruurta caadi ahaan waxaa lagu daraa codsiga waalidka).</li>
            <li>Haysato oggolaanshe deganaansho joogto ah, xaq deganaansho, ama xaq deganaansho joogto ah.</li>
            <li>Ku noolaato Iswidhan muddo u qalanta — caadi ahaan shan sano (way ka gaaban tahay dadka aan dhalasho lahayn, qaxootiga, iyo muwaadiniinta Nordic).</li>
            <li>Nolol habaysan u noolaato — diiwaan dembi oo weyn la'aan.</li>
            <li>(Laga bilaabo 2026) Gudo <em>imtixaanka dhalashada</em> (medborgarskapsprovet) — imtixaanka aqoonta muwaadinnimada iyo afka Iswidhish — oona buuxiso shuruudda luqadda Iswidhish.</li>
          </ul>
          <h2>Dhalashada labanlaabka ah</h2>
          <p>Iswidhan waxay aqbashay dhalashada labanlaabka ah ilaa 2001. Lumin maysid dhalashadaada asalka ah markaad noqoto Iswidhan (iyada oo ku xiran xeerarka dalkaaga aad ka soo jeedo).</p>
          ${ebookFactBox('so', null, "Xeerarka cusub ee dhalashada waxay dhaqaaqayaan 6 Juun 2026. UHR waxay sheegaysaa in fadhiga ugu horreeya ee aqoonta muwaadinnimada uu noqon doono 15 Ogosto 2026 magaalada Stockholm. Shuruudda deganaanshaha caadiga ah: 5 sano · Dhalashada labanlaabka ah: la oggol yahay (ilaa 2001) · Hay'adda go'aanka gaarta: Migrationsverket.", ['uhrStudyMaterial'])}
        `,
        ti: `<h2>መን እዩ መን</h2>
          <ul>
            <li><b>Migrationsverket</b> — ኤጀንሲ ስደት (Migrationsverket)። ብዛዕባ ፍቓድ መንበሪ፡ ዑቕባ፡ ምትእኽኻብ ስድራቤት፡ ፍቓድ ስራሕን ዜግነትን ይውስን።</li>
            <li><b>Skatteverket</b> — ኤጀንሲ ግብሪ (Skatteverket) ፍቓድ መንበሪ ምስ ዝህልወካን ኣብ ሽወደን ትነብር ምስ እትምዝገብን መለለዪ ቁጽሪ (personnummer) ይህበካ።</li>
            <li><b>Polisen</b> — ፖሊስ (Polisen) ፓስፖርትን ገለ ጉዳያት መንነትን የማሓድር።</li>
          </ul>
          <h2>መንገድታት ናብ ቀዋሚ መንበሪ</h2>
          <p>ናብ ሽወደን ከምዚ ዝስዕብ ኴንካ ክትመጽእ ትኽእል፦ ሰራሕተኛ (ካብ ዝተሓተ ደሞዝ ንላዕሊ ናይ ስራሕ ዕድል ዘለዎ)፡ ተማሃራይ፡ ተመራማራይ፡ ኣባል ስድራቤት ነባራይ፡ ናጻ ምንቅስቓስ ዝጥቀም ዜጋ ኤውሮጳዊ ሕብረት፡ ወይ ሓታቲ ዑቕባ። ድሕሪ ሕጋዊ መንበሪ ግዜ — መብዛሕትኡ ግዜ ካብ ኣርባዕተ ክሳብ ሓሙሽተ ዓመት — ቀዋሚ መንበሪ (<em>ቀዋሚ ፍቓድ መንበሪ</em> (permanent uppehållstillstånd)) ወይ፡ ንዜጋታት ኤውሮጳዊ ሕብረት፡ ቀዋሚ መሰል መንበሪ ከተመልክት ትኽእል።</p>
          <h2>ሽወደናዊ ምዃን</h2>
          <p>ብመስርሕ ዜግነት ናይ ሽወደን ዜግነት ንምምልካት፡ ብሓፈሻ ከምዚ ዝስዕብ ክትከውን የድሊ፦</p>
          <ul>
            <li>እንተወሓደ 18 ዓመት ክትከውን (ቆልዑ መብዛሕትኡ ግዜ ኣብ መመልከቲ ወላዲ ይካተቱ)።</li>
            <li>ቀዋሚ ፍቓድ መንበሪ፡ መሰል መንበሪ፡ ወይ ቀዋሚ መሰል መንበሪ ክህልወካ።</li>
            <li>ኣብ ሽወደን ብቑዕ ግዜ ክትነብር — መብዛሕትኡ ግዜ ሓሙሽተ ዓመት (ንሰብ ኣልቦ ዜግነት፡ ስደተኛታትን ዜጋታት ኖርዲክን ይሓጽር)።</li>
            <li>ስርዓታዊ ህይወት ክትመርሕ — ዓቢ ገበናዊ መዝገብ ዘይብልካ።</li>
            <li>(ካብ 2026 ጀሚሩ) <em>ፈተና ዜግነት</em> (medborgarskapsprovet) — ፈተና ሲቪካዊ ፍልጠትን ሽወደንኛን — ክትሓልፍን ናይ ሽወደን ቋንቋ መምዘኒ ከተማልእን።</li>
          </ul>
          <h2>ድርብ ዜግነት</h2>
          <p>ሽወደን ካብ 2001 ጀሚራ ድርብ ዜግነት ተቐቢላ። ሽወደናዊ ብምዃንካ ናይ መበቆል ዜግነትካ ኣይተጥፍእን (ብመሰረት ሕግታት ናይ መበቆል ሃገርካ)።</p>
          ${ebookFactBox('ti', null, 'ሓደስቲ ሕግታት ዜግነት ካብ 6 ሰነ 2026 ጀሚሮም ይትግበሩ። UHR እቲ ቀዳማይ ናይ ሲቪካዊ ፍልጠት ፈተና ኣብ 15 ነሓሰ 2026 ኣብ ስቶክሆልም ከም ዝካየድ ይገልጽ። ስሩዕ መምዘኒ መንበሪ: 5 ዓመት · ድርብ ዜግነት: ይፍቀድ (ካብ 2001) · ውሳነ ዝህብ ኣካል: Migrationsverket.', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Kim kimdir</h2>
          <ul>
            <li><b>Migrationsverket</b> — Göç Kurumu (Migrationsverket). İkamet izinleri, iltica, aile birleşimi, çalışma izinleri ve vatandaşlık konularında karar verir.</li>
            <li><b>Skatteverket</b> — Vergi Dairesi (Skatteverket), bir ikamet izniniz olduğunda ve İsveç'te yaşayan biri olarak kaydedildiğinizde size kimlik numaranızı (personnummer) verir.</li>
            <li><b>Polisen</b> — Polis (Polisen), pasaportları ve bazı kimlik konularını yürütür.</li>
          </ul>
          <h2>Daimi ikamete giden yollar</h2>
          <p>İsveç'e şu şekilde gelebilirsiniz: bir işçi (asgari ücretin üzerinde bir iş teklifiyle), bir öğrenci, bir araştırmacı, bir ikamet edenin aile üyesi, serbest dolaşım hakkını kullanan bir AB vatandaşı veya bir sığınmacı. Bir süre yasal ikametten sonra — genellikle dört ila beş yıl — daimi ikamet (<em>daimi ikamet izni</em> (permanent uppehållstillstånd)) için veya AB vatandaşları için daimi ikamet hakkı için başvurabilirsiniz.</p>
          <h2>İsveçli olmak</h2>
          <p>Vatandaşlığa kabul yoluyla İsveç vatandaşlığına başvurmak için genellikle şunlara ihtiyacınız vardır:</p>
          <ul>
            <li>En az 18 yaşında olmak (çocuklar genellikle bir ebeveynin başvurusuna dahil edilir).</li>
            <li>Daimi ikamet izni, ikamet hakkı veya daimi ikamet hakkına sahip olmak.</li>
            <li>İsveç'te belirli bir süre yaşamış olmak — genellikle beş yıl (vatansız kişiler, mülteciler ve İskandinav vatandaşları için daha kısa).</li>
            <li>Düzenli bir yaşam sürmek — önemli bir sabıka kaydı olmaması.</li>
            <li>(2026'dan itibaren) <em>Vatandaşlık sınavını</em> (medborgarskapsprovet) — yurttaşlık bilgisi ve İsveççe testi — geçmek ve bir İsveççe dil koşulunu karşılamak.</li>
          </ul>
          <h2>Çifte vatandaşlık</h2>
          <p>İsveç 2001'den beri çifte vatandaşlığı kabul ediyor. İsveçli olarak orijinal vatandaşlığınızı kaybetmezsiniz (köken ülkenizin kurallarına tabi olarak).</p>
          ${ebookFactBox('tr', null, "Yeni vatandaşlık kuralları 6 Haziran 2026'dan itibaren geçerlidir. UHR, ilk yurttaşlık bilgisi oturumunun 15 Ağustos 2026'da Stockholm'de yapılacağını söylüyor. Standart ikamet koşulu: 5 yıl · Çifte vatandaşlık: izinli (2001'den beri) · Karar mercii: Migrationsverket.", ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Хто є хто</h2>
          <ul>
            <li><b>Migrationsverket</b> — Міграційне агентство (Migrationsverket). Вирішує питання дозволів на проживання, притулку, возз'єднання сімей, дозволів на роботу та громадянства.</li>
            <li><b>Skatteverket</b> — Податкове агентство (Skatteverket) видає вам особистий номер (personnummer), щойно ви отримаєте дозвіл на проживання та зареєструєтеся як мешканець Швеції.</li>
            <li><b>Polisen</b> — Поліція (Polisen) займається паспортами та деякими питаннями документів, що посвідчують особу.</li>
          </ul>
          <h2>Шляхи до постійного проживання</h2>
          <p>Ви можете приїхати до Швеції як: працівник (із пропозицією роботи з оплатою вище мінімальної), студент, дослідник, член сім'ї резидента, громадянин ЄС, який користується свободою пересування, або шукач притулку. Після періоду законного проживання — зазвичай від чотирьох до п'яти років — ви можете подати заяву на постійне проживання (<em>постійний дозвіл на проживання</em> (permanent uppehållstillstånd)) або, для громадян ЄС, на право постійного проживання.</p>
          <h2>Як стати шведом</h2>
          <p>Щоб подати заяву на шведське громадянство шляхом натуралізації, вам зазвичай потрібно:</p>
          <ul>
            <li>Бути не молодшим за 18 років (діти зазвичай включаються до заяви одного з батьків).</li>
            <li>Мати дозвіл на постійне проживання, право проживання або право постійного проживання.</li>
            <li>Прожити у Швеції кваліфікаційний період — зазвичай п'ять років (менше для осіб без громадянства, біженців і громадян країн Північної Європи).</li>
            <li>Вести впорядкований спосіб життя — без серйозної судимості.</li>
            <li>(Із 2026 року) Скласти <em>іспит на громадянство</em> (medborgarskapsprovet) — тест на знання громадянознавства та шведської мови — і відповідати вимозі щодо знання шведської мови.</li>
          </ul>
          <h2>Подвійне громадянство</h2>
          <p>Швеція визнає подвійне громадянство з 2001 року. Ви не втрачаєте своє початкове громадянство, ставши шведом (за умови дотримання правил вашої країни походження).</p>
          ${ebookFactBox('uk', null, 'Нові правила громадянства діють із 6 червня 2026 року. UHR повідомляє, що перше складання іспиту з громадянознавства відбудеться 15 серпня 2026 року в Стокгольмі. Стандартна вимога щодо проживання: 5 років · Подвійне громадянство: дозволене (із 2001) · Орган, що приймає рішення: Migrationsverket.', ['uhrStudyMaterial'])}
        `,
      },
    },

    12: {
      kicker: {
        en: 'Chapter 12 · Mock exam',
        sv: 'Kapitel 12 · Övningsprov',
        'zh-Hans': '第12章 · 模拟考试',
        'zh-Hant': '第12章 · 模擬考試',
        ar: 'الفصل 12 · الامتحان التجريبي',
        ckb: 'بەشی 12 · تاقیکردنەوەی هەڵسەنگاندن',
        fa: 'فصل 12 · آزمون آزمایشی',
        pl: 'Rozdział 12 · Egzamin próbny',
        so: 'Cutubka 12 · Imtixaan tijaabo ah',
        ti: 'ምዕራፍ 12 · ናይ ምክያድ ፈተና',
        tr: 'Bölüm 12 · Deneme sınavı',
        uk: 'Розділ 12 · Пробний іспит',
      },
      title: {
        en: 'Mock exam',
        sv: 'Övningsprov',
        'zh-Hans': '模拟考试',
        'zh-Hant': '模擬考試',
        ar: 'الامتحان التجريبي',
        ckb: 'تاقیکردنەوەی هەڵسەنگاندن',
        fa: 'آزمون آزمایشی',
        pl: 'Egzamin próbny',
        so: 'Imtixaan tijaabo ah',
        ti: 'ናይ ምክያድ ፈተና',
        tr: 'Deneme sınavı',
        uk: 'Пробний іспит',
      },
      title_em: {
        en: 'and current test status.',
        sv: 'och aktuell provstatus.',
        'zh-Hans': '与当前考试状态。',
        'zh-Hant': '與當前考試狀態。',
        ar: 'وحالة الاختبار الحالية.',
        ckb: 'و دۆخی ئێستای تاقیکردنەوە.',
        fa: 'و وضعیت کنونی آزمون.',
        pl: 'i aktualny status testu.',
        so: 'iyo xaaladda imtixaanka ee hadda jirta.',
        ti: "ከምኡ'ውን ህሉው ኩነታት ፈተና።",
        tr: 've mevcut sınav durumu.',
        uk: 'та поточний статус тесту.',
      },
      lede: {
        en: 'Use the mock exam for practice, but keep the practical test details tied to UHR and Migrationsverket.',
        sv: 'Använd övningsprovet för övning, men håll praktiska provdetaljer knutna till UHR och Migrationsverket.',
        'zh-Hans': '用模拟考试来练习，但要把实际考试的细节以UHR和Migrationsverket为准。',
        'zh-Hant': '用模擬考試來練習，但要把實際考試的細節以UHR和Migrationsverket為準。',
        ar: 'استخدم الامتحان التجريبي للتدرّب، لكن أبقِ تفاصيل الاختبار العملية مرتبطة بـ UHR و Migrationsverket.',
        ckb: 'تاقیکردنەوەی هەڵسەنگاندن بۆ مەشق بەکاربهێنە، بەڵام وردەکارییە کردارییەکانی تاقیکردنەوە بە UHR و Migrationsverket ـەوە بەستراوە بهێڵەرەوە.',
        fa: 'از آزمون آزمایشی برای تمرین استفاده کنید، اما جزئیات عملی آزمون را به UHR و Migrationsverket وابسته نگه دارید.',
        pl: 'Korzystaj z egzaminu próbnego do ćwiczeń, ale szczegóły praktyczne testu trzymaj powiązane z UHR i Migrationsverket.',
        so: 'Imtixaanka tijaabada ah u isticmaal tababar, laakiin faahfaahinta wax-ku-oolka ah ee imtixaanka ku xidh UHR iyo Migrationsverket.',
        ti: 'ነቲ ናይ ምክያድ ፈተና ንልምምድ ተጠቐመሉ፡ ንተግባራዊ ዝርዝራት ፈተና ግን ምስ UHRን Migrationsverketን ኣታሓሒዝካ ሓዞ።',
        tr: "Deneme sınavını alıştırma için kullanın, ancak pratik sınav ayrıntılarını UHR ve Migrationsverket'e bağlı tutun.",
        uk: "Використовуйте пробний іспит для практики, але практичні деталі тесту тримайте прив'язаними до UHR і Migrationsverket.",
      },
      body: {
        en: `
          <h2>Current official status</h2>
          <p>UHR says the first civic-knowledge sitting will be held on 15 August 2026 in Stockholm. A Migrationsverket letter is required: only people who receive a letter from Migrationsverket can sign up.</p>
          <p>Seats are limited. The August sitting is free of charge, and UHR says participants will have generous time.</p>
          <h2>Practical details pending from UHR</h2>
          <p>UHR has not yet published the exact time and place. Use this app for unofficial practice, and use UHR and Migrationsverket for instructions that affect your own case.</p>
          <h2>How to study now</h2>
          <ol>
            <li>Read this ebook end-to-end at least once. Use the Practice tab to drill what you forget.</li>
            <li>For every fact you get wrong twice, write it on a card and stick it on the fridge. Embarrassment is a great teacher.</li>
            <li>Skim the official <em>Sverige i fokus</em> PDF (free download from UHR) the week before the test. Don't try to memorise it.</li>
            <li>Use the mock exam here as a rehearsal for mixed-topic recall, then revisit the chapters where you missed points.</li>
          </ol>
          <div class="ebook__factbox"><h4>Current source notes</h4><p>Sources accessed 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        sv: `
          <h2>Aktuell officiell status</h2>
          <p>Det första samhällskunskapsprovet inom medborgarskapsprovet hålls den 15 augusti 2026 i Stockholm. Anmälan kräver brev från Migrationsverket.</p>
          <p>Antalet platser är begränsat. Augustiprovet är kostnadsfritt, och UHR beskriver att deltagarna får generöst med tid.</p>
          <h2>Praktiska detaljer väntar hos UHR</h2>
          <p>UHR har ännu inte publicerat exakt tid och plats. Använd appen som inofficiell övning, och använd UHR och Migrationsverket för instruktioner som påverkar ditt eget ärende.</p>
          <h2>Plugga nu</h2>
          <ol>
            <li>Läs boken en gång från början till slut och öppna sedan Öva för det du glömmer.</li>
            <li>Skriv ner fakta du missar två gånger och repetera dem kort nästa dag.</li>
            <li>Använd UHR:s utbildningsmaterial som kontrollpunkt innan provet.</li>
            <li>Använd övningsprovet här för blandad repetition och gå tillbaka till kapitlen där du tappade poäng.</li>
          </ol>
          <div class="ebook__factbox"><h4>Aktuella källnoter</h4><p>Källor hämtade 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        'zh-Hans': `<h2>当前官方状态</h2>
          <p>UHR表示，首场公民知识考试将于2026年8月15日在斯德哥尔摩举行。需要一封Migrationsverket的信函：只有收到Migrationsverket来信的人才能报名。</p>
          <p>名额有限。8月这场考试免费，UHR表示参加者将有充裕的时间。</p>
          <h2>UHR尚待公布的实际细节</h2>
          <p>UHR尚未公布确切的时间和地点。请使用本应用进行非官方练习，并以UHR和Migrationsverket为准，获取影响你自身情况的指示。</p>
          <h2>现在如何备考</h2>
          <ol>
            <li>把这本电子书从头到尾至少读一遍。用「练习」标签页反复操练你容易忘记的内容。</li>
            <li>对于每个你答错两次的知识点，把它写在卡片上贴到冰箱上。难为情是最好的老师。</li>
            <li>在考试前一周快速浏览官方的《<em>Sverige i fokus</em>》PDF（可从UHR免费下载）。不要试图死记硬背。</li>
            <li>把这里的模拟考试当作混合主题回忆的演练，然后重新复习你失分的章节。</li>
          </ol>
          <div class="ebook__factbox"><h4>当前来源说明</h4><p>资料获取于2026-05-19：${officialTestSourceLinks()}</p></div>`,
        'zh-Hant': `<h2>當前官方狀態</h2>
          <p>UHR表示，首場公民知識考試將於2026年8月15日在斯德哥爾摩舉行。需要一封Migrationsverket的信函：只有收到Migrationsverket來信的人才能報名。</p>
          <p>名額有限。8月這場考試免費，UHR表示參加者將有充裕的時間。</p>
          <h2>UHR尚待公布的實際細節</h2>
          <p>UHR尚未公布確切的時間和地點。請使用本應用進行非官方練習，並以UHR和Migrationsverket為準，獲取影響你自身情況的指示。</p>
          <h2>現在如何備考</h2>
          <ol>
            <li>把這本電子書從頭到尾至少讀一遍。用「練習」標籤頁反覆操練你容易忘記的內容。</li>
            <li>對於每個你答錯兩次的知識點，把它寫在卡片上貼到冰箱上。難為情是最好的老師。</li>
            <li>在考試前一週快速瀏覽官方的《<em>Sverige i fokus</em>》PDF（可從UHR免費下載）。不要試圖死記硬背。</li>
            <li>把這裡的模擬考試當作混合主題回憶的演練，然後重新複習你失分的章節。</li>
          </ol>
          <div class="ebook__factbox"><h4>當前來源說明</h4><p>資料獲取於2026-05-19：${officialTestSourceLinks()}</p></div>`,
        ar: `<h2>الحالة الرسمية الحالية</h2>
          <p>يقول UHR (مجلس القبول الجامعي) إن أول جلسة لاختبار المعرفة المدنية ستُعقد في 15 أغسطس 2026 في ستوكهولم. يُشترط وجود خطاب من Migrationsverket (وكالة الهجرة): فقط من يتلقون خطابًا من Migrationsverket يمكنهم التسجيل.</p>
          <p>المقاعد محدودة. جلسة أغسطس مجانية، ويقول UHR إن المشاركين سيُمنحون وقتًا وافرًا.</p>
          <h2>تفاصيل عملية لم يصدرها UHR بعد</h2>
          <p>لم ينشر UHR بعد الوقت والمكان بالضبط. استخدم هذا التطبيق للتدرّب غير الرسمي، واستخدم UHR و Migrationsverket للحصول على التعليمات التي تخص حالتك الخاصة.</p>
          <h2>كيف تدرس الآن</h2>
          <ol>
            <li>اقرأ هذا الكتاب الإلكتروني من أوله إلى آخره مرة واحدة على الأقل. استخدم تبويب التدريب لتثبيت ما تنساه.</li>
            <li>كل معلومة تخطئ فيها مرتين، اكتبها على بطاقة وألصقها على الثلاجة. الإحراج معلّم رائع.</li>
            <li>تصفّح ملف <em>السويد في بؤرة التركيز</em> (Sverige i fokus) الرسمي (تنزيل مجاني من UHR) في الأسبوع السابق للاختبار. لا تحاول حفظه عن ظهر قلب.</li>
            <li>استخدم الامتحان التجريبي هنا كبروفة لاستدعاء مواضيع مختلطة، ثم عُد إلى الفصول التي فاتتك فيها نقاط.</li>
          </ol>
          <div class="ebook__factbox"><h4>ملاحظات المصادر الحالية</h4><p>تم الاطلاع على المصادر في 2026-05-19: ${officialTestSourceLinks()}</p></div>`,
        ckb: `<h2>دۆخی فەرمیی ئێستا</h2>
          <p>UHR (ئەنجوومەنی وەرگرتنی زانکۆیی) دەڵێت یەکەم دانیشتنی تاقیکردنەوەی زانیاریی شارستانی لە 15 ی ئابی 2026 لە ستۆکهۆڵم بەڕێوەدەچێت. نامەیەک لە Migrationsverket (ئاژانسی کۆچ) پێویستە: تەنها ئەو کەسانەی نامەیەک لە Migrationsverket وەردەگرن دەتوانن خۆیان تۆمار بکەن.</p>
          <p>کورسییەکان سنووردارن. دانیشتنی ئاب بەخۆڕاییە، و UHR دەڵێت بەشداربووان کاتێکی بەرفراوانیان پێدەدرێت.</p>
          <h2>وردەکارییە کردارییەکان کە هێشتا UHR بڵاوی نەکردوونەتەوە</h2>
          <p>UHR هێشتا کات و شوێنی ورد بڵاو نەکردووەتەوە. ئەم ئەپە بۆ مەشقی نافەرمی بەکاربهێنە، و UHR و Migrationsverket بۆ ئەو ڕێنماییانە بەکاربهێنە کە کاریگەرییان لەسەر کەیسی خۆت هەیە.</p>
          <h2>چۆن ئێستا بخوێنیت</h2>
          <ol>
            <li>ئەم ئەلیکترۆنیکیە کتێبە لانیکەم جارێک لە سەرەتاوە بۆ کۆتایی بخوێنەرەوە. تابی مەشق بەکاربهێنە بۆ جێگیرکردنی ئەوەی لەبیرت دەچێت.</li>
            <li>هەر زانیارییەک دووجار هەڵەی تێدا دەکەیت، لەسەر کارتێک بینووسە و بیلکێنە بە سەلاجەوە. شەرمەزاری مامۆستایەکی نایابە.</li>
            <li>هەفتەی پێش تاقیکردنەوە، فایلی فەرمیی <em>سوید لە چاودێریدا</em> (Sverige i fokus) (داگرتنی بەخۆڕایی لە UHR) سەرپێی بخوێنەرەوە. هەوڵ مەدە لەبەری بکەیت.</li>
            <li>تاقیکردنەوەی هەڵسەنگاندنی ئێرە وەک ڕاهێنانێک بۆ بیرهێنانەوەی بابەتی تێکەڵ بەکاربهێنە، پاشان بگەڕێرەوە بۆ ئەو بەشانەی خاڵت تێیاندا لەدەست داوە.</li>
          </ol>
          <div class="ebook__factbox"><h4>تێبینییەکانی سەرچاوەی ئێستا</h4><p>سەرچاوەکان لە 2026-05-19 سەردان کران: ${officialTestSourceLinks()}</p></div>`,
        fa: `<h2>وضعیت رسمی کنونی</h2>
          <p>UHR (شورای پذیرش دانشگاهی) می‌گوید نخستین جلسه آزمون دانش مدنی در 15 اوت 2026 در استکهلم برگزار خواهد شد. نامه‌ای از Migrationsverket (اداره مهاجرت) لازم است: تنها کسانی که از Migrationsverket نامه دریافت می‌کنند می‌توانند ثبت‌نام کنند.</p>
          <p>صندلی‌ها محدودند. جلسه اوت رایگان است، و UHR می‌گوید شرکت‌کنندگان وقت کافی خواهند داشت.</p>
          <h2>جزئیات عملی که هنوز از سوی UHR منتشر نشده</h2>
          <p>UHR هنوز زمان و مکان دقیق را منتشر نکرده است. از این برنامه برای تمرین غیررسمی استفاده کنید، و برای دستورالعمل‌هایی که بر پرونده خودتان اثر می‌گذارد به UHR و Migrationsverket مراجعه کنید.</p>
          <h2>چگونه اکنون مطالعه کنیم</h2>
          <ol>
            <li>این کتاب الکترونیکی را دست‌کم یک‌بار از ابتدا تا انتها بخوانید. از زبانه تمرین برای مرور آنچه فراموش می‌کنید استفاده کنید.</li>
            <li>هر واقعیتی را که دو بار اشتباه می‌کنید، روی کارتی بنویسید و به یخچال بچسبانید. خجالت معلم بزرگی است.</li>
            <li>هفته پیش از آزمون، فایل رسمی <em>سوئد در کانون توجه</em> (Sverige i fokus) را (دانلود رایگان از UHR) مرور کنید. سعی نکنید آن را حفظ کنید.</li>
            <li>از آزمون آزمایشی این‌جا به‌عنوان تمرینی برای یادآوری موضوعات ترکیبی استفاده کنید، سپس به فصل‌هایی که در آن‌ها امتیاز از دست داده‌اید برگردید.</li>
          </ol>
          <div class="ebook__factbox"><h4>ملاحظات منابع کنونی</h4><p>منابع در 2026-05-19 بازدید شدند: ${officialTestSourceLinks()}</p></div>`,
        pl: `<h2>Aktualny status oficjalny</h2>
          <p>UHR podaje, że pierwszy egzamin z wiedzy obywatelskiej odbędzie się 15 sierpnia 2026 roku w Sztokholmie. Wymagane jest pismo z Migrationsverket: zapisać się mogą tylko osoby, które otrzymają pismo od Migrationsverket.</p>
          <p>Liczba miejsc jest ograniczona. Sierpniowy egzamin jest bezpłatny, a UHR podaje, że uczestnicy będą mieli dużo czasu.</p>
          <h2>Szczegóły praktyczne oczekiwane od UHR</h2>
          <p>UHR nie opublikował jeszcze dokładnego czasu i miejsca. Korzystaj z tej aplikacji do nieoficjalnych ćwiczeń, a w sprawie instrukcji dotyczących twojej własnej sprawy korzystaj z UHR i Migrationsverket.</p>
          <h2>Jak się teraz uczyć</h2>
          <ol>
            <li>Przeczytaj ten e-book od początku do końca przynajmniej raz. Korzystaj z zakładki Ćwiczenia, aby przećwiczyć to, co zapominasz.</li>
            <li>Każdy fakt, który pomylisz dwa razy, zapisz na kartce i przyklej na lodówce. Zawstydzenie to świetny nauczyciel.</li>
            <li>Przejrzyj oficjalny PDF <em>Sverige i fokus</em> (bezpłatny do pobrania z UHR) w tygodniu przed testem. Nie próbuj uczyć się go na pamięć.</li>
            <li>Wykorzystaj tutejszy egzamin próbny jako próbę przypominania sobie zagadnień z różnych tematów, a następnie wróć do rozdziałów, w których straciłeś punkty.</li>
          </ol>
          <div class="ebook__factbox"><h4>Aktualne uwagi o źródłach</h4><p>Źródła dostępne 2026-05-19: ${officialTestSourceLinks()}</p></div>`,
        so: `<h2>Xaaladda rasmiga ah ee hadda</h2>
          <p>UHR waxay sheegaysaa in fadhiga ugu horreeya ee aqoonta muwaadinnimada uu noqon doono 15 Ogosto 2026 magaalada Stockholm. Waxaa loo baahan yahay warqad ka socota Migrationsverket: kaliya dadka hela warqad ka timid Migrationsverket ayaa is-diiwaangelin kara.</p>
          <p>Kuraasta way xaddidan yihiin. Fadhiga Ogosto waa lacag la'aan, UHR waxay sheegaysaa in ka qaybgalayaashu heli doonaan waqti badan.</p>
          <h2>Faahfaahinta wax-ku-oolka ah ee laga sugayo UHR</h2>
          <p>UHR weli ma daabacin waqtiga iyo goobta saxda ah. Barnaamijkan u isticmaal tababar aan rasmi ahayn, oona u isticmaal UHR iyo Migrationsverket tilmaamaha saameeya kiiskaaga gaarka ah.</p>
          <h2>Sida loo barto hadda</h2>
          <ol>
            <li>Akhri buug-elegtarooniggan bilow ilaa dhammaad ugu yaraan hal mar. Isticmaal tabka Tababarka si aad u celcelin u samayso waxa aad illowdo.</li>
            <li>Xaqiiqo kasta oo aad laba jeer khaldato, ku qor kaadh oona ku dheji qaboojiyaha. Ceebtu waa macallin fiican.</li>
            <li>Si dhakhso ah u eeg PDF-ka rasmiga ah ee <em>Sverige i fokus</em> (oo bilaash looga soo dejin karo UHR) toddobaadka ka horreeya imtixaanka. Ha isku dayin inaad xafiddo.</li>
            <li>Isticmaal imtixaanka tijaabada ah ee halkan sidii layli xusuus mawduucyo isku qasan, ka dibna dib u eeg cutubyada aad dhibcaha ka lumisay.</li>
          </ol>
          <div class="ebook__factbox"><h4>Xusuusyada ilaha hadda jira</h4><p>Ilaha la helay 2026-05-19: ${officialTestSourceLinks()}</p></div>`,
        ti: `<h2>ህሉው ወግዓዊ ኩነታት</h2>
          <p>UHR እቲ ቀዳማይ ናይ ሲቪካዊ ፍልጠት ፈተና ኣብ 15 ነሓሰ 2026 ኣብ ስቶክሆልም ከም ዝካየድ ይገልጽ። ካብ Migrationsverket ዝመጽእ ደብዳበ የድሊ፦ ካብ Migrationsverket ደብዳበ ዝተቐበሉ ሰባት ጥራይ እዮም ክምዝገቡ ዝኽእሉ።</p>
          <p>ቦታታት ውሱን እዩ። እቲ ናይ ነሓሰ ፈተና ብናጻ እዩ፡ UHR ድማ ተሳተፍቲ ብዙሕ ግዜ ከም ዝህልዎም ይገልጽ።</p>
          <h2>ካብ UHR ዝጽበዩ ተግባራዊ ዝርዝራት</h2>
          <p>UHR ነቲ ልክዕ ግዜን ቦታን ጌና ኣይዘርግሐን። ነዚ መተግበሪ ንዘይወግዓዊ ልምምድ ተጠቐመሉ፡ ንኩነታት ጉዳይካ ዝምልከት መምርሒታት ድማ ካብ UHRን Migrationsverketን ተጠቐም።</p>
          <h2>ሕጂ ብኸመይ ከም እትመሃር</h2>
          <ol>
            <li>ነዚ ኤለክትሮኒካዊ መጽሓፍ እንተወሓደ ሓደ ግዜ ካብ መጀመርታ ክሳብ መወዳእታ ኣንብቦ። ነቲ እትርስዖ ንምልምማድ ነቲ ናይ ልምምድ ታብ ተጠቐመሉ።</li>
            <li>ክልተ ግዜ ንዝተጋገኻዮ ነፍሲ ወከፍ ሓቂ ኣብ ካርድ ጽሓፎ ኣብ ፍሪጅ ድማ ለጥፎ። ሕፍረት ጽቡቕ መምህር እዩ።</li>
            <li>ቅድሚ ፈተና ኣብ ዘላ ሰሙን ነቲ ወግዓዊ <em>Sverige i fokus</em> PDF (ካብ UHR ብናጻ ዝረኽብ) ብኣጋር ኣንብቦ። ብቓል ክትሕዞ ኣይትፈትን።</li>
            <li>ነዚ ኣብዚ ዘሎ ናይ ምክያድ ፈተና ከም ናይ ዝተሓዋወሰ ኣርእስቲ ምዝካር ልምምድ ተጠቐመሉ፡ ብድሕሪኡ ነቶም ነጥቢ ዝሰኣንካሎም ምዕራፋት ተመለሰሎም።</li>
          </ol>
          <div class="ebook__factbox"><h4>ህሉዋት ናይ ምንጪ መዘኻኸሪታት</h4><p>ምንጭታት ዝተረኽቡ 2026-05-19: ${officialTestSourceLinks()}</p></div>`,
        tr: `<h2>Mevcut resmi durum</h2>
          <p>UHR, ilk yurttaşlık bilgisi oturumunun 15 Ağustos 2026'da Stockholm'de yapılacağını söylüyor. Bir Migrationsverket mektubu gereklidir: yalnızca Migrationsverket'ten mektup alan kişiler kaydolabilir.</p>
          <p>Yerler sınırlıdır. Ağustos oturumu ücretsizdir ve UHR, katılımcıların bol zamana sahip olacağını söylüyor.</p>
          <h2>UHR'den beklenen pratik ayrıntılar</h2>
          <p>UHR henüz tam zamanı ve yeri yayınlamadı. Resmi olmayan alıştırma için bu uygulamayı kullanın ve kendi durumunuzu etkileyen talimatlar için UHR ve Migrationsverket'i kullanın.</p>
          <h2>Şimdi nasıl çalışmalı</h2>
          <ol>
            <li>Bu e-kitabı en az bir kez baştan sona okuyun. Unuttuklarınızı pekiştirmek için Alıştırma sekmesini kullanın.</li>
            <li>İki kez yanlış yaptığınız her bilgi için bir kart yazın ve buzdolabına yapıştırın. Utanmak harika bir öğretmendir.</li>
            <li>Testten önceki hafta resmi <em>Sverige i fokus</em> PDF'sini (UHR'den ücretsiz indirme) göz gezdirin. Onu ezberlemeye çalışmayın.</li>
            <li>Buradaki deneme sınavını karışık konulu hatırlama provası olarak kullanın, ardından puan kaybettiğiniz bölümlere geri dönün.</li>
          </ol>
          <div class="ebook__factbox"><h4>Mevcut kaynak notları</h4><p>Kaynaklara erişim tarihi 2026-05-19: ${officialTestSourceLinks()}</p></div>`,
        uk: `<h2>Поточний офіційний статус</h2>
          <p>UHR повідомляє, що перше складання іспиту з громадянознавства відбудеться 15 серпня 2026 року в Стокгольмі. Потрібен лист від Migrationsverket: зареєструватися можуть лише особи, які отримають лист від Migrationsverket.</p>
          <p>Кількість місць обмежена. Серпневе складання безкоштовне, і UHR повідомляє, що учасники матимуть достатньо часу.</p>
          <h2>Практичні деталі, які очікуються від UHR</h2>
          <p>UHR ще не оприлюднив точний час і місце. Використовуйте цей застосунок для неофіційної практики, а щодо інструкцій, які стосуються вашої власної справи, звертайтеся до UHR і Migrationsverket.</p>
          <h2>Як вчитися зараз</h2>
          <ol>
            <li>Прочитайте цю електронну книгу від початку до кінця принаймні один раз. Використовуйте вкладку «Практика», щоб опрацьовувати те, що забуваєте.</li>
            <li>Кожен факт, у якому ви двічі помилилися, запишіть на картці та прикріпіть на холодильнику. Збентеження — чудовий учитель.</li>
            <li>Перегляньте офіційний PDF <em>Sverige i fokus</em> (безкоштовне завантаження з UHR) за тиждень до тесту. Не намагайтеся вивчити його напам'ять.</li>
            <li>Використовуйте тутешній пробний іспит як репетицію пригадування матеріалу з різних тем, а потім поверніться до розділів, де ви втратили бали.</li>
          </ol>
          <div class="ebook__factbox"><h4>Поточні примітки про джерела</h4><p>Джерела переглянуто 2026-05-19: ${officialTestSourceLinks()}</p></div>`,
      },
    },

    13: {
      kicker: {
        en: 'Chapter 13 · Traditions',
        sv: 'Kapitel 13 · Traditioner',
        'zh-Hans': '第13章 · 传统',
        'zh-Hant': '第13章 · 傳統',
        ar: 'الفصل 13 · التقاليد',
        ckb: 'بەشی 13 · نەریتەکان',
        fa: 'فصل 13 · سنت‌ها',
        pl: 'Rozdział 13 · Tradycje',
        so: 'Cutubka 13 · Caadooyinka',
        ti: 'ምዕራፍ 13 · ልምድታት',
        tr: 'Bölüm 13 · Gelenekler',
        uk: 'Розділ 13 · Традиції',
      },
      title: {
        en: 'Traditions,',
        sv: 'Traditioner,',
        'zh-Hans': '传统、',
        'zh-Hant': '傳統、',
        ar: 'التقاليد،',
        ckb: 'نەریتەکان،',
        fa: 'سنت‌ها،',
        pl: 'Tradycje,',
        so: 'Caadooyinka,',
        ti: 'ልምድታት፡',
        tr: 'Gelenekler,',
        uk: 'Традиції,',
      },
      title_em: {
        en: 'holidays, and change.',
        sv: 'högtider och förändring.',
        'zh-Hans': '节日与变迁。',
        'zh-Hant': '節日與變遷。',
        ar: 'والأعياد، والتغيير.',
        ckb: 'جەژنەکان، و گۆڕان.',
        fa: 'تعطیلات، و تغییر.',
        pl: 'święta i zmiana.',
        so: 'fasaxyada, iyo isbeddelka.',
        ti: 'በዓላትን ለውጥን።',
        tr: 'tatiller ve değişim.',
        uk: 'свята та зміни.',
      },
      lede: {
        en: 'Swedish traditions are not museum pieces. Some are old, some are borrowed, and most are just ways people mark the year together.',
        sv: 'Svenska traditioner är inte museiföremål. Vissa är gamla, vissa har kommit hit senare, och de flesta hjälper människor att känna igen året tillsammans.',
        'zh-Hans':
          '瑞典的传统并非陈列于博物馆中的展品。有些古老，有些是外来的，而大多数只是人们一起标记岁时的方式。',
        'zh-Hant':
          '瑞典的傳統並非陳列於博物館中的展品。有些古老，有些是外來的，而大多數只是人們一起標記歲時的方式。',
        ar: 'التقاليد السويدية ليست قطعًا متحفية. بعضها قديم، وبعضها مستعار، ومعظمها مجرد طرق يحتفي بها الناس بالعام معًا.',
        ckb: 'نەریتە سویدییەکان پارچەی مۆزەخانە نین. هەندێکیان کۆنن، هەندێکیان وەرگیراون، و زۆربەیان تەنها ڕێگان بۆ ئەوەی خەڵک پێکەوە ساڵ نیشانە بکەن.',
        fa: 'سنت‌های سوئدی اشیای موزه‌ای نیستند. برخی کهن‌اند، برخی وام‌گرفته‌شده، و بیشترشان فقط راه‌هایی‌اند که مردم با هم سال را جشن می‌گیرند.',
        pl: 'Szwedzkie tradycje nie są muzealnymi eksponatami. Niektóre są stare, niektóre zapożyczone, a większość to po prostu sposoby, w jakie ludzie wspólnie świętują rok.',
        so: 'Caadooyinka Iswidhan maaha walxo matxaf. Qaar way duug yihiin, qaar waa la amaahday, badidooduna waa kaliya siyaabo dadku ay si wadajir ah u xuseeyaan sannadka.',
        ti: 'ሽወደናዊ ልምድታት ናይ ቤተ-መዘክር ኣቕሑ ኣይኮኑን። ገሊኦም ኣረጊት እዮም፡ ገሊኦም ዝተለቅሑ እዮም፡ መብዛሕትኦም ድማ ሰባት ነታ ዓመት ብሓባር ዘኽብሩላ መንገድታት እዮም።',
        tr: 'İsveç gelenekleri müze eşyaları değildir. Bazıları eski, bazıları ödünç alınmış, çoğu ise sadece insanların yılı birlikte kutlama yollarıdır.',
        uk: 'Шведські традиції — не музейні експонати. Деякі давні, деякі запозичені, а більшість — це просто способи, якими люди разом відзначають рік.',
      },
      body: {
        en: `
          <h2>Traditions change</h2>
          <p>A tradition is a habit shared by a group: a holiday, a song, food, clothes, a ceremony, or a way to gather. Traditions can be old without being frozen. People move, families mix, and new customs become part of everyday Sweden.</p>
          <p>That is why this chapter is not a list of "real" and "not real" Swedishness. It is a calendar of common reference points: the holidays and rituals that appear in school, work, public life, and civic-study material.</p>
          <h2>National Day and civic ceremonies</h2>
          <p>Sweden's National Day is 6 June. It is connected to Gustav Vasa's election as king in 1523 and the 1809 Instrument of Government. Today flags are raised, speeches are held, and many municipalities welcome new Swedish citizens in ceremonies.</p>
          <h2>Spring and summer</h2>
          <ul>
            <li><b>Easter</b> falls in March or April and has Christian roots, though many people celebrate it as a family and spring holiday.</li>
            <li><b>Walpurgis Night</b>, 30 April, often means bonfires and songs welcoming spring.</li>
            <li><b>First of May</b> is International Workers' Day, marked by demonstrations and political speeches.</li>
            <li><b>Midsummer Eve</b> is always a Friday between 19 and 25 June, with outdoor gatherings, flower wreaths, a midsummer pole, herring, new potatoes, and strawberries.</li>
          </ul>
          <h2>Autumn and winter</h2>
          <ul>
            <li><b>All Saints' Day</b> is when many people light candles at graves to remember relatives and friends who have died.</li>
            <li><b>Advent</b> is the four Sundays before Christmas Day. Many homes use Advent candles, stars, or calendars.</li>
            <li><b>Lucia</b>, 13 December, is about light in the darkest part of the year, often with processions, candles, and singing.</li>
            <li><b>Christmas</b> has Christian roots and is also a major family holiday. In Sweden the main celebration is usually Christmas Eve, 24 December.</li>
            <li><b>New Year's Eve</b>, 31 December, is commonly celebrated with dinners, parties, and fireworks at midnight.</li>
          </ul>
          <h2>New traditions</h2>
          <p>Migration has added more visible traditions to Swedish public life. Eid al-Fitr, Nouruz, Newroz, Diwali, and other celebrations may appear in schools, workplaces, neighbourhoods, and city events. The important pattern is simple: traditions can travel and adapt.</p>
          ${ebookFactBox('en', 'Facts to review', 'National Day: June 6 · Walpurgis Night: April 30 · Midsummer Eve: Friday between June 19 and 25 · Lucia: December 13 · Christmas Eve: December 24.', ['uhrStudyMaterial', 'editorialCommentary'])}
        `,
        sv: svStudyBrief(
          [
            'Traditioner är vanor och högtider som människor delar. De kan vara gamla, nya, religiösa, sekulära, lokala eller komma från människor som flyttat till Sverige.',
            'Nationaldagen firas den 6 juni. Dagen kopplas till Gustav Vasa 1523 och 1809 års regeringsform, och många kommuner välkomnar nya medborgare.',
            'Året innehåller många återkommande högtider: påsk, valborg, första maj, midsommar, alla helgons dag, advent, lucia, jul och nyår.',
            'Många kristna högtider är också kultur- och familjehögtider för personer som inte ser sig som religiösa.',
            'Nya traditioner, till exempel id al-fitr, Nouruz och Newroz, visar att traditioner kan tas med, delas och förändras.',
          ],
          'Nationaldag: 6 juni · Valborg: 30 april · Midsommarafton: fredag 19-25 juni · Lucia: 13 december · Julafton: 24 december.',
          'Läs kapitlet tillsammans med övningen för traditioner och högtider. Datum, handlingar och vad högtiderna betyder är vanligare än detaljfrågor om exakt hur varje familj firar.',
          ['uhrStudyMaterial', 'editorialCommentary'],
        ),
        'zh-Hans': `<h2>传统会变迁</h2>
          <p>传统是一个群体共有的习惯：一个节日、一首歌、食物、服装、一种仪式，或一种聚会的方式。传统可以古老，却不必凝固不变。人们迁徙，家庭融合，新的习俗也成为日常瑞典生活的一部分。</p>
          <p>这正是为什么本章并不是一份关于「真正的」与「不真正的」瑞典特性的清单。它是一份常见参照点的日历：那些出现在学校、工作、公共生活和公民学习材料中的节日与仪式。</p>
          <h2>国庆日与公民仪式</h2>
          <p>瑞典的国庆日是6月6日。它与古斯塔夫·瓦萨（Gustav Vasa，瑞典国王）于1523年当选为国王以及1809年的《政府组织法》（Instrument of Government）相关。如今人们升旗、发表演讲，许多市镇会在仪式上欢迎新的瑞典公民。</p>
          <h2>春与夏</h2>
          <ul>
            <li><b>复活节</b>（Easter）落在3月或4月，源于基督教，不过许多人把它当作家庭与春季的节日来庆祝。</li>
            <li><b>瓦尔普吉斯之夜</b>（Walpurgis Night），4月30日，通常意味着篝火和迎接春天的歌声。</li>
            <li><b>五一</b>（First of May）是国际劳动节，以游行和政治演讲来标记。</li>
            <li><b>仲夏前夜</b>（Midsummer Eve）总是在6月19日至25日之间的一个星期五，人们在户外聚会，戴花环、立仲夏柱，享用鲱鱼、新土豆和草莓。</li>
          </ul>
          <h2>秋与冬</h2>
          <ul>
            <li><b>诸圣节</b>（All Saints' Day）是许多人在墓前点燃蜡烛、缅怀已故亲友的日子。</li>
            <li><b>将临期</b>（Advent）是圣诞节前的四个星期日。许多家庭会使用将临期蜡烛、星灯或日历。</li>
            <li><b>露西亚节</b>（Lucia），12月13日，是关于一年中最黑暗时节里的光的节日，常伴有游行、烛光和歌唱。</li>
            <li><b>圣诞节</b>源于基督教，同时也是一个重要的家庭节日。在瑞典，主要的庆祝通常是在平安夜（Christmas Eve），即12月24日。</li>
            <li><b>除夕</b>（New Year's Eve），12月31日，人们通常以晚宴、派对和午夜的烟花来庆祝。</li>
          </ul>
          <h2>新的传统</h2>
          <p>移民为瑞典公共生活增添了更多可见的传统。开斋节（Eid al-Fitr）、诺鲁孜节（Nouruz）、库尔德新年（Newroz）、排灯节（Diwali）以及其他庆典，可能出现在学校、职场、社区和城市活动中。其中重要的模式很简单：传统可以迁移并适应。</p>
          ${ebookFactBox('zh-Hans', null, '国庆日：6月6日 · 瓦尔普吉斯之夜：4月30日 · 仲夏前夜：6月19日至25日之间的星期五 · 露西亚节：12月13日 · 平安夜：12月24日。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>傳統會變遷</h2>
          <p>傳統是一個群體共有的習慣：一個節日、一首歌、食物、服裝、一種儀式，或一種聚會的方式。傳統可以古老，卻不必凝固不變。人們遷徙，家庭融合，新的習俗也成為日常瑞典生活的一部分。</p>
          <p>這正是為什麼本章並不是一份關於「真正的」與「不真正的」瑞典特性的清單。它是一份常見參照點的日曆：那些出現在學校、工作、公共生活和公民學習材料中的節日與儀式。</p>
          <h2>國慶日與公民儀式</h2>
          <p>瑞典的國慶日是6月6日。它與古斯塔夫·瓦薩（Gustav Vasa，瑞典國王）於1523年當選為國王以及1809年的《政府組織法》（Instrument of Government）相關。如今人們升旗、發表演講，許多市鎮會在儀式上歡迎新的瑞典公民。</p>
          <h2>春與夏</h2>
          <ul>
            <li><b>復活節</b>（Easter）落在3月或4月，源於基督教，不過許多人把它當作家庭與春季的節日來慶祝。</li>
            <li><b>瓦爾普吉斯之夜</b>（Walpurgis Night），4月30日，通常意味著篝火和迎接春天的歌聲。</li>
            <li><b>五一</b>（First of May）是國際勞動節，以遊行和政治演講來標記。</li>
            <li><b>仲夏前夜</b>（Midsummer Eve）總是在6月19日至25日之間的一個星期五，人們在戶外聚會，戴花環、立仲夏柱，享用鯡魚、新馬鈴薯和草莓。</li>
          </ul>
          <h2>秋與冬</h2>
          <ul>
            <li><b>諸聖節</b>（All Saints' Day）是許多人在墓前點燃蠟燭、緬懷已故親友的日子。</li>
            <li><b>將臨期</b>（Advent）是聖誕節前的四個星期日。許多家庭會使用將臨期蠟燭、星燈或日曆。</li>
            <li><b>露西亞節</b>（Lucia），12月13日，是關於一年中最黑暗時節裡的光的節日，常伴有遊行、燭光和歌唱。</li>
            <li><b>聖誕節</b>源於基督教，同時也是一個重要的家庭節日。在瑞典，主要的慶祝通常是在平安夜（Christmas Eve），即12月24日。</li>
            <li><b>除夕</b>（New Year's Eve），12月31日，人們通常以晚宴、派對和午夜的煙花來慶祝。</li>
          </ul>
          <h2>新的傳統</h2>
          <p>移民為瑞典公共生活增添了更多可見的傳統。開齋節（Eid al-Fitr）、諾魯孜節（Nouruz）、庫爾德新年（Newroz）、排燈節（Diwali）以及其他慶典，可能出現在學校、職場、社區和城市活動中。其中重要的模式很簡單：傳統可以遷移並適應。</p>
          ${ebookFactBox('zh-Hant', null, '國慶日：6月6日 · 瓦爾普吉斯之夜：4月30日 · 仲夏前夜：6月19日至25日之間的星期五 · 露西亞節：12月13日 · 平安夜：12月24日。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>التقاليد تتغير</h2>
          <p>التقليد عادة يتشاركها جماعة: عيد، أو أغنية، أو طعام، أو ملابس، أو طقس، أو طريقة للتجمّع. يمكن للتقاليد أن تكون قديمة دون أن تكون متجمدة. ينتقل الناس، وتختلط العائلات، وتصبح عادات جديدة جزءًا من السويد اليومية.</p>
          <p>لهذا السبب ليس هذا الفصل قائمة بما هو "حقيقي" و"غير حقيقي" من السويدية. إنه تقويم لنقاط مرجعية شائعة: الأعياد والطقوس التي تظهر في المدرسة، والعمل، والحياة العامة، ومواد الدراسة المدنية.</p>
          <h2>اليوم الوطني والمراسم المدنية</h2>
          <p>اليوم الوطني للسويد هو 6 يونيو. وهو مرتبط بانتخاب Gustav Vasa (غوستاف فاسا) ملكًا عام 1523 وصك الحكم لعام 1809. اليوم تُرفع الأعلام، وتُلقى الخطب، وترحّب بلديات كثيرة بالمواطنين السويديين الجدد في مراسم.</p>
          <h2>الربيع والصيف</h2>
          <ul>
            <li><b>عيد الفصح</b> يقع في مارس أو أبريل وله جذور مسيحية، رغم أن كثيرين يحتفلون به كعيد عائلي وربيعي.</li>
            <li><b>ليلة Walpurgis (فالبورغيس)</b>، 30 أبريل، تعني غالبًا نيران المحرقات والأغاني ترحيبًا بالربيع.</li>
            <li><b>الأول من مايو</b> هو اليوم العالمي للعمال، يُحتفى به بمظاهرات وخطب سياسية.</li>
            <li><b>عشية Midsummer (منتصف الصيف)</b> تكون دائمًا يوم جمعة بين 19 و25 يونيو، مع تجمعات في الهواء الطلق، وأكاليل من الزهور، وعمود منتصف الصيف، والرنجة، والبطاطس الجديدة، والفراولة.</li>
          </ul>
          <h2>الخريف والشتاء</h2>
          <ul>
            <li><b>عيد جميع القديسين</b> هو حين يُشعل كثيرون الشموع عند القبور لتذكّر الأقارب والأصدقاء الذين رحلوا.</li>
            <li><b>Advent (زمن المجيء)</b> هو الآحاد الأربعة السابقة ليوم عيد الميلاد. تستخدم بيوت كثيرة شموع Advent، أو النجوم، أو التقاويم.</li>
            <li><b>Lucia (لوسيا)</b>، 13 ديسمبر، تتعلق بالضوء في أحلك أيام السنة، غالبًا بمواكب، وشموع، وغناء.</li>
            <li><b>عيد الميلاد</b> له جذور مسيحية وهو أيضًا عيد عائلي كبير. في السويد يكون الاحتفال الرئيسي عادةً عشية عيد الميلاد، 24 ديسمبر.</li>
            <li><b>ليلة رأس السنة</b>، 31 ديسمبر، يُحتفى بها عادةً بالعشاء، والحفلات، والألعاب النارية عند منتصف الليل.</li>
          </ul>
          <h2>تقاليد جديدة</h2>
          <p>أضافت الهجرة تقاليد أكثر ظهورًا إلى الحياة العامة السويدية. قد تظهر عيد الفطر، ونوروز، ونوروز الكردي (Newroz)، وديوالي، واحتفالات أخرى في المدارس، وأماكن العمل، والأحياء، وفعاليات المدن. النمط المهم بسيط: التقاليد يمكنها أن تنتقل وتتكيف.</p>
          ${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · ليلة Walpurgis: 30 أبريل · عشية Midsummer: الجمعة بين 19 و25 يونيو · Lucia: 13 ديسمبر · عشية عيد الميلاد: 24 ديسمبر.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>نەریتەکان دەگۆڕێن</h2>
          <p>نەریت ئەو خووەیە کە کۆمەڵێک تێیدا هاوبەشن: جەژنێک، گۆرانییەک، خواردن، جل، ئاینێک، یان ڕێگایەک بۆ کۆبوونەوە. نەریتەکان دەتوانن کۆن بن بەبێ ئەوەی بەستوو بن. خەڵک دەجووڵێن، خێزانەکان تێکەڵ دەبن، و خووە نوێیەکان دەبنە بەشێک لە سویدی ڕۆژانە.</p>
          <p>لەبەر ئەوەیە ئەم بەشە لیستێک نییە لە "ڕاستەقینە" و "نا ڕاستەقینە"ی سویدیبوون. ساڵنامەیەکە لە خاڵە سەرچاوە باوەکان: ئەو جەژن و ئاینانەی لە قوتابخانە، کار، ژیانی گشتی، و ماددەی خوێندنی شارستانیدا دەردەکەون.</p>
          <h2>ڕۆژی نیشتمانی و مەراسیمە شارستانییەکان</h2>
          <p>ڕۆژی نیشتمانیی سوید 6 ی حوزەیرانە. پەیوەستە بە هەڵبژاردنی Gustav Vasa (گوستاڤ ڤاسا) وەک پاشا لە ساڵی 1523 و بەڵگەی حوکمڕانیی 1809. ئەمڕۆ ئاڵاکان بەرز دەکرێنەوە، وتارەکان دەخوێنرێنەوە، و زۆرێک لە شارەوانییەکان بەخێرهاتنی هاوڵاتیانی نوێی سویدی دەکەن لە مەراسیمەکاندا.</p>
          <h2>بەهار و هاوین</h2>
          <ul>
            <li><b>جەژنی هەستانەوە</b> لە مارس یان ئاپریل دەکەوێت و ڕەگی مەسیحیی هەیە، هەرچەندە زۆر کەس وەک جەژنێکی خێزانی و بەهاری ئاهەنگی بۆ دەگێڕن.</li>
            <li><b>شەوی Walpurgis (ڤالپورگیس)</b>، 30 ی ئاپریل، زۆرجار مانای ئاگری گەورە و گۆرانی بۆ بەخێرهاتنی بەهارە.</li>
            <li><b>یەکی مایس</b> ڕۆژی جیهانیی کرێکارانە، کە بە خۆپیشاندان و وتاری سیاسی نیشانە دەکرێت.</li>
            <li><b>شەوی Midsummer (ناوەڕاستی هاوین)</b> هەمیشە ڕۆژی هەینییەکە لە نێوان 19 و 25 ی حوزەیران، لەگەڵ کۆبوونەوەی دەرەوە، تاجی گوڵ، کۆڵەکەی ناوەڕاستی هاوین، ماسیی ڕەنگە، پەتاتەی نوێ، و فڕاولە.</li>
          </ul>
          <h2>پاییز و زستان</h2>
          <ul>
            <li><b>ڕۆژی هەموو پیرۆزان</b> ئەو کاتەیە کە زۆر کەس مۆم لەسەر گۆڕەکان دادەگیرسێنن بۆ بیرکردنەوەی ئەو خزم و هاوڕێیانەی کۆچیان کردووە.</li>
            <li><b>Advent (کاتی هاتن)</b> چوار یەکشەممەی پێش ڕۆژی کریسمسە. زۆر ماڵ مۆمی Advent، ئەستێرە، یان ساڵنامە بەکاردێنن.</li>
            <li><b>Lucia (لوسیا)</b>، 13 ی دیسەمبەر، دەربارەی ڕووناکییە لە تاریکترین بەشی ساڵدا، زۆرجار لەگەڵ ڕیزی ڕۆیشتن، مۆم، و گۆرانی.</li>
            <li><b>کریسمس</b> ڕەگی مەسیحیی هەیە و هەروەها جەژنێکی گەورەی خێزانییە. لە سویددا ئاهەنگی سەرەکی بەزۆری شەوی کریسمسە، 24 ی دیسەمبەر.</li>
            <li><b>شەوی ساڵی نوێ</b>، 31 ی دیسەمبەر، بەگشتی بە نانی ئێوارە، ئاهەنگ، و مووشەکبازی لە نیوەشەودا ئاهەنگی بۆ دەگێڕدرێت.</li>
          </ul>
          <h2>نەریتە نوێیەکان</h2>
          <p>کۆچ نەریتی بەرچاوتری زیادکردووە بۆ ژیانی گشتیی سوید. جەژنی ڕەمەزان (Eid al-Fitr)، نەورۆز، نەورۆزی کوردی (Newroz)، دیوالی، و ئاهەنگەکانی تر لەوانەیە لە قوتابخانە، شوێنی کار، گەڕەک، و چالاکییەکانی شار دەربکەون. شێوازە گرنگەکە سادەیە: نەریتەکان دەتوانن گەشت بکەن و خۆ بگونجێنن.</p>
          ${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: 6 ی حوزەیران · شەوی Walpurgis: 30 ی ئاپریل · شەوی Midsummer: هەینی لە نێوان 19 و 25 ی حوزەیران · Lucia: 13 ی دیسەمبەر · شەوی کریسمس: 24 ی دیسەمبەر.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>سنت‌ها تغییر می‌کنند</h2>
          <p>سنت عادتی است که گروهی در آن سهیم‌اند: یک تعطیلی، یک ترانه، غذا، لباس، یک آیین، یا راهی برای گرد هم آمدن. سنت‌ها می‌توانند کهن باشند بی‌آنکه منجمد بمانند. مردم جابه‌جا می‌شوند، خانواده‌ها درمی‌آمیزند، و آداب تازه بخشی از سوئد روزمره می‌شوند.</p>
          <p>به همین دلیل این فصل فهرستی از "اصیل" و "غیراصیل" بودنِ سوئدی نیست. تقویمی است از نقاط مرجع رایج: تعطیلات و آیین‌هایی که در مدرسه، کار، زندگی عمومی و مواد مطالعه مدنی پدیدار می‌شوند.</p>
          <h2>روز ملی و مراسم مدنی</h2>
          <p>روز ملی سوئد 6 ژوئن است. این روز به انتخاب Gustav Vasa (گوستاو واسا) به‌عنوان پادشاه در سال 1523 و سند حکومت 1809 پیوند دارد. امروزه پرچم‌ها برافراشته می‌شوند، سخنرانی‌ها برگزار می‌شوند، و بسیاری از شهرداری‌ها در مراسمی به شهروندان تازه سوئدی خوش‌آمد می‌گویند.</p>
          <h2>بهار و تابستان</h2>
          <ul>
            <li><b>عید پاک</b> در مارس یا آوریل می‌افتد و ریشه مسیحی دارد، هرچند بسیاری آن را به‌عنوان جشنی خانوادگی و بهاری برگزار می‌کنند.</li>
            <li><b>شب Walpurgis (والپورگیس)</b>، 30 آوریل، اغلب به معنای آتش‌افروزی و ترانه‌هایی برای خوش‌آمدگویی به بهار است.</li>
            <li><b>اول مه</b> روز جهانی کارگر است که با تظاهرات و سخنرانی‌های سیاسی نشانه‌گذاری می‌شود.</li>
            <li><b>شب Midsummer (نیمه تابستان)</b> همیشه جمعه‌ای میان 19 و 25 ژوئن است، با گردهمایی‌های بیرون از خانه، تاج‌های گل، تیر نیمه تابستان، شاه‌ماهی، سیب‌زمینی تازه و توت‌فرنگی.</li>
          </ul>
          <h2>پاییز و زمستان</h2>
          <ul>
            <li><b>روز همه قدیسان</b> زمانی است که بسیاری بر سر گورها شمع روشن می‌کنند تا یاد خویشان و دوستان درگذشته را گرامی بدارند.</li>
            <li><b>Advent (زمان آمدن)</b> چهار یکشنبه پیش از روز کریسمس است. بسیاری از خانه‌ها از شمع‌های Advent، ستاره‌ها یا تقویم‌ها استفاده می‌کنند.</li>
            <li><b>Lucia (لوسیا)</b>، 13 دسامبر، درباره نور در تاریک‌ترین بخش سال است، اغلب با دسته‌های راهپیمایی، شمع‌ها و آوازخوانی.</li>
            <li><b>کریسمس</b> ریشه مسیحی دارد و نیز جشنی بزرگ خانوادگی است. در سوئد جشن اصلی معمولاً شب کریسمس، 24 دسامبر، است.</li>
            <li><b>شب سال نو</b>، 31 دسامبر، معمولاً با شام‌ها، مهمانی‌ها و آتش‌بازی در نیمه‌شب جشن گرفته می‌شود.</li>
          </ul>
          <h2>سنت‌های تازه</h2>
          <p>مهاجرت سنت‌های آشکارتری به زندگی عمومی سوئد افزوده است. عید فطر، نوروز، نوروز کردی (Newroz)، دیوالی و جشن‌های دیگر ممکن است در مدارس، محل‌های کار، محله‌ها و رویدادهای شهری پدیدار شوند. الگوی مهم ساده است: سنت‌ها می‌توانند سفر کنند و سازگار شوند.</p>
          ${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · شب Walpurgis: 30 آوریل · شب Midsummer: جمعه میان 19 و 25 ژوئن · Lucia: 13 دسامبر · شب کریسمس: 24 دسامبر.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Tradycje się zmieniają</h2>
          <p>Tradycja to zwyczaj dzielony przez grupę: święto, pieśń, jedzenie, ubiór, ceremonia lub sposób gromadzenia się. Tradycje mogą być stare, nie będąc zamrożone. Ludzie się przeprowadzają, rodziny się mieszają, a nowe zwyczaje stają się częścią codziennej Szwecji.</p>
          <p>Dlatego ten rozdział nie jest listą "prawdziwej" i "nieprawdziwej" szwedzkości. To kalendarz wspólnych punktów odniesienia: świąt i rytuałów, które pojawiają się w szkole, pracy, życiu publicznym i materiałach do nauki obywatelskiej.</p>
          <h2>Święto Narodowe i ceremonie obywatelskie</h2>
          <p>Święto Narodowe Szwecji przypada 6 czerwca. Jest związane z wyborem Gustawa Wazy na króla w 1523 roku oraz z aktem o formie rządu z 1809 roku. Dziś wciągane są flagi, wygłaszane są przemówienia, a wiele gmin wita nowych obywateli Szwecji podczas ceremonii.</p>
          <h2>Wiosna i lato</h2>
          <ul>
            <li><b>Wielkanoc</b> przypada w marcu lub kwietniu i ma korzenie chrześcijańskie, choć wiele osób świętuje ją jako święto rodzinne i wiosenne.</li>
            <li><b>Noc Walpurgii</b> (Valborg), 30 kwietnia, często oznacza ogniska i pieśni witające wiosnę.</li>
            <li><b>Pierwszy maja</b> to Międzynarodowy Dzień Pracy, obchodzony demonstracjami i przemówieniami politycznymi.</li>
            <li><b>Wigilia Nocy Świętojańskiej</b> (Midsommar) to zawsze piątek między 19 a 25 czerwca, ze spotkaniami na świeżym powietrzu, wiankami z kwiatów, słupem majowym, śledziem, młodymi ziemniakami i truskawkami.</li>
          </ul>
          <h2>Jesień i zima</h2>
          <ul>
            <li><b>Dzień Wszystkich Świętych</b> to czas, gdy wiele osób zapala znicze na grobach, by wspomnieć zmarłych krewnych i przyjaciół.</li>
            <li><b>Adwent</b> to cztery niedziele przed Bożym Narodzeniem. Wiele domów używa świec adwentowych, gwiazd lub kalendarzy.</li>
            <li><b>Lucia</b>, 13 grudnia, dotyczy światła w najciemniejszej porze roku, często z procesjami, świecami i śpiewem.</li>
            <li><b>Boże Narodzenie</b> ma korzenie chrześcijańskie i jest też ważnym świętem rodzinnym. W Szwecji główne obchody to zwykle Wigilia, 24 grudnia.</li>
            <li><b>Sylwester</b>, 31 grudnia, jest powszechnie świętowany kolacjami, przyjęciami i fajerwerkami o północy.</li>
          </ul>
          <h2>Nowe tradycje</h2>
          <p>Migracja dodała więcej widocznych tradycji do szwedzkiego życia publicznego. Eid al-Fitr, Nouruz, Newroz, Diwali i inne uroczystości mogą pojawiać się w szkołach, miejscach pracy, dzielnicach i wydarzeniach miejskich. Ważny wzorzec jest prosty: tradycje mogą podróżować i się dostosowywać.</p>
          ${ebookFactBox('pl', null, 'Święto Narodowe: 6 czerwca · Noc Walpurgii: 30 kwietnia · Wigilia Nocy Świętojańskiej: piątek między 19 a 25 czerwca · Lucia: 13 grudnia · Wigilia Bożego Narodzenia: 24 grudnia.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Caadooyinku way isbeddelaan</h2>
          <p>Caado waa dhaqan ay koox wadaagaan: fasax, hees, cunto, dhar, xaflad, ama hab lagu kulmo. Caadooyinku way duug noqon karaan iyaga oo aan barafoobin. Dadku way guuraan, qoysasku way isku dhex galaan, caadooyin cusubna waxay noqdaan qayb ka mid ah Iswidhan maalinlaha ah.</p>
          <p>Taasi waa sababta cutubkani aanu u ahayn liis Iswidhan-nimo "run ah" iyo "run ahayn". Waa jadwal dhibcaha tixraaca guud ah: fasaxyada iyo cibaadooyinka ka muuqda dugsiga, shaqada, nolosha dadweynaha, iyo waxyaabaha lagu barto muwaadinnimada.</p>
          <h2>Maalinta Qaranka iyo xafladaha muwaadinnimada</h2>
          <p>Maalinta Qaranka ee Iswidhan waa 6 Juun. Waxay la xidhiidhaa doorashada Gustav Vasa boqor ahaan 1523 iyo Dukumentiga Dawladda ee 1809. Maanta calammada waa la taagaa, khudbadaha waa la jeediyaa, degmooyin badanna waxay ku soo dhaweeyaan muwaadiniinta cusub ee Iswidhan xafladaha.</p>
          <h2>Gu'ga iyo xagaaga</h2>
          <ul>
            <li><b>Iistar</b> waxay dhacdaa Maarso ama Abriil waxayna leedahay asal Masiixi ah, in kasta oo dad badani u dabaaldegaan fasax qoys iyo gu'.</li>
            <li><b>Habeenka Walpurgis</b> (Valborg), 30 Abriil, inta badan waxay ka dhigan tahay dabab iyo heeso lagu soo dhaweeyo gu'ga.</li>
            <li><b>Kowda Maajo</b> waa Maalinta Caalamiga ah ee Shaqaalaha, waxaa lagu xusaa banaanbaxyo iyo khudbado siyaasadeed.</li>
            <li><b>Habeenka Bartamaha Xagaaga</b> (Midsommar) had iyo jeer waa Jimce u dhexeeya 19 ilaa 25 Juun, oo leh kulammo bannaanka ah, taajaj ubaxeed, tiir bartamaha xagaaga, kalluun heering, baradho cusub, iyo strawberry.</li>
          </ul>
          <h2>Dayrta iyo jiilaalka</h2>
          <ul>
            <li><b>Maalinta Kuwa Quduuska ah oo dhan</b> waa marka dad badani shumacyo ku shidaan qabuuraha si ay u xusuustaan qaraabo iyo saaxiibbo dhintay.</li>
            <li><b>Advent</b> waa afarta Axad ee ka horreeya Maalinta Kirismaska. Guryo badan waxay isticmaalaan shumacyada Advent, xiddigaha, ama jadwallada.</li>
            <li><b>Lucia</b>, 13 Disembar, waxay ku saabsan tahay iftiinka xilliga ugu mugdiga badan sannadka, inta badan oo leh socod, shumacyo, iyo heesid.</li>
            <li><b>Kirismaska</b> wuxuu leeyahay asal Masiixi ah waana sidoo kale fasax qoys oo weyn. Iswidhan dabaaldegga ugu weyn caadi ahaan waa Habeenka Kirismaska, 24 Disembar.</li>
            <li><b>Habeenka Sannadcusubka</b>, 31 Disembar, badanaa waxaa lagu dabaaldegaa casho, xaflado, iyo nalalka dabka ee saqda dhexe.</li>
          </ul>
          <h2>Caadooyin cusub</h2>
          <p>Socdaalku wuxuu ku daray caadooyin badan oo muuqda nolosha dadweynaha Iswidhan. Eid al-Fitr, Nouruz, Newroz, Diwali, iyo dabaaldegyo kale waxay ka soo muuqan karaan dugsiyada, goobaha shaqada, xaafadaha, iyo dhacdooyinka magaalada. Qaabka muhiimka ah waa fudud yahay: caadooyinku way safri karaan oo la qabsan karaan.</p>
          ${ebookFactBox('so', null, 'Maalinta Qaranka: 6 Juun · Habeenka Walpurgis: 30 Abriil · Habeenka Bartamaha Xagaaga: Jimce u dhexeeya 19 iyo 25 Juun · Lucia: 13 Disembar · Habeenka Kirismaska: 24 Disembar.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ልምድታት ይቕየሩ</h2>
          <p>ልምዲ ብጉጅለ ዝካፈል ልምዲ እዩ፦ በዓል፡ ደርፊ፡ መግቢ፡ ክዳን፡ ስነ-ስርዓት፡ ወይ ናይ ምትእኽኻብ መንገዲ። ልምድታት ከይተረረ ኣረጊት ክኾኑ ይኽእሉ። ሰባት ይግዕዙ፡ ስድራቤታት ይተሓናፈጻ፡ ሓደስቲ ልምድታት ድማ ኣካል መዓልታዊ ሽወደን ይኾኑ።</p>
          <p>ስለዚ እዩ እዚ ምዕራፍ "ሓቀኛ"ን "ዘይሓቀኛ"ን ሽወደናውነት ዝርዝር ዘይኮነ። ናይ ሓባር መወከሲ ነጥብታት ዓውደ-ኣዋርሕ እዩ፦ ኣብ ቤት ትምህርቲ፡ ስራሕ፡ ህዝባዊ ህይወትን ናይ ሲቪካዊ መጽናዕቲ ጽሑፋትን ዝረኣዩ በዓላትን ስርዓታትን።</p>
          <h2>ሃገራዊ መዓልትን ሲቪካዊ ስነ-ስርዓታትን</h2>
          <p>ሃገራዊ መዓልቲ ሽወደን 6 ሰነ እዩ። ምስ ምርጫ ጉስታቭ ቫሳ ንጉስ ኮይኑ ኣብ 1523ን ምስ ናይ 1809 ሰነድ ምሕደራ መንግስትን ይተኣሳሰር። ሎሚ ባንዴራታት ይለዓላ፡ መደረታት ይካየድ፡ ብዙሓት ምምሕዳራት ድማ ሓደስቲ ዜጋታት ሽወደን ኣብ ስነ-ስርዓታት ይቕበሉ።</p>
          <h2>ጽድያን ክረምትን</h2>
          <ul>
            <li><b>ፋሲካ</b> ኣብ መጋቢት ወይ ሚያዝያ ይኸውን ክርስትያናዊ መሰረት ኣለዎ፡ ብዙሓት ሰባት ግን ከም ናይ ስድራቤትን ጽድያን በዓል የብዕልዎ።</li>
            <li><b>ለይቲ ቫልፑርግስ</b> (Valborg)፡ 30 ሚያዝያ፡ መብዛሕትኡ ግዜ ጽድያ ዝቕበሉ ሓዊን ደርፍታትን ማለት እዩ።</li>
            <li><b>ቀዳማይ ግንቦት</b> ኣህጉራዊ መዓልቲ ሰራሕተኛታት እዩ፡ ብሰልፍታትን ፖለቲካዊ መደረታትን ይኽበር።</li>
            <li><b>ድሮ ማእከል ክረምቲ</b> (Midsommar) ኩሉ ግዜ ኣብ መንጎ 19ን 25ን ሰነ ዘሎ ዓርቢ እዩ፡ ምስ ናይ ደገ ምትእኽኻባት፡ ናይ ዕምባባ ዘውድታት፡ ናይ ማእከል ክረምቲ ዓንዲ፡ ሄሪንግ ዓሳ፡ ሓደስቲ ድንሽን ፍራውለን።</li>
          </ul>
          <h2>ቀውዕን ክረምትን</h2>
          <ul>
            <li><b>መዓልቲ ኩሎም ቅዱሳን</b> ብዙሓት ሰባት ንዝሞቱ ኣዝማድን ፈተውትን ንምዝካር ኣብ መቓብር ሽምዓ ዘብርሁሉ ግዜ እዩ።</li>
            <li><b>ኣድቨንት</b> ቅድሚ ልደት ዘለዋ ኣርባዕተ ሰናብቲ እየን። ብዙሓት ኣባይቲ ናይ ኣድቨንት ሽምዓታት፡ ኮዋኽብቲ፡ ወይ ዓውደ-ኣዋርሕ ይጥቀሙ።</li>
            <li><b>ሉቸ</b> (Lucia)፡ 13 ታሕሳስ፡ ብዛዕባ ብርሃን ኣብታ ኣዝያ ጸልማት ዝኾነት ክፍለ-ግዜ ዓመት እዩ፡ መብዛሕትኡ ግዜ ምስ ሰልፍታት፡ ሽምዓታትን ዝማረን።</li>
            <li><b>ልደት</b> ክርስትያናዊ መሰረት ኣለዎ ከምኡ'ውን ዓቢ ናይ ስድራቤት በዓል እዩ። ኣብ ሽወደን እቲ ቀንዲ ኣከባብራ መብዛሕትኡ ግዜ ድሮ ልደት፡ 24 ታሕሳስ እዩ።</li>
            <li><b>ድሮ ሓዱሽ ዓመት</b>፡ 31 ታሕሳስ፡ ብተደጋጋሚ ብድራራት፡ ድግሳትን ኣብ ፍርቂ ለይቲ ብዝፍጸም ርሺ-ርሺን ይኽበር።</li>
          </ul>
          <h2>ሓደስቲ ልምድታት</h2>
          <p>ስደት ናብ ህዝባዊ ህይወት ሽወደን ዝያዳ ዝረኣዩ ልምድታት ወሲኹ። ኢድ ኣል-ፊጥር (Eid al-Fitr)፡ ኖውሩዝ (Nouruz)፡ ኔውሮዝ (Newroz)፡ ዲዋሊ (Diwali)ን ካልኦት ኣኽብሮታትን ኣብ ቤት ትምህርትታት፡ ቦታታት ስራሕ፡ ከባቢታትን ናይ ከተማ ፍጻመታትን ክረኣዩ ይኽእሉ። እቲ ኣገዳሲ ኣገባብ ቀሊል እዩ፦ ልምድታት ክጓዓዙን ክላመዱን ይኽእሉ።</p>
          ${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ: 6 ሰነ · ለይቲ ቫልፑርግስ: 30 ሚያዝያ · ድሮ ማእከል ክረምቲ: ኣብ መንጎ 19ን 25ን ሰነ ዘሎ ዓርቢ · ሉቸ: 13 ታሕሳስ · ድሮ ልደት: 24 ታሕሳስ.', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Gelenekler değişir</h2>
          <p>Gelenek, bir grup tarafından paylaşılan bir alışkanlıktır: bir tatil, bir şarkı, yiyecek, giysi, bir tören veya bir araya gelme biçimi. Gelenekler donmuş olmadan eski olabilir. İnsanlar taşınır, aileler karışır ve yeni gelenekler günlük İsveç'in bir parçası olur.</p>
          <p>Bu yüzden bu bölüm "gerçek" ve "gerçek olmayan" İsveçliliğin bir listesi değildir. Ortak referans noktalarının bir takvimidir: okulda, işte, kamusal yaşamda ve yurttaşlık çalışma materyalinde görünen tatiller ve ritüeller.</p>
          <h2>Ulusal Gün ve yurttaşlık törenleri</h2>
          <p>İsveç'in Ulusal Günü 6 Haziran'dır. Gustav Vasa'nın 1523'te kral seçilmesi ve 1809 Hükümet Belgesi ile bağlantılıdır. Bugün bayraklar göndere çekilir, konuşmalar yapılır ve birçok belediye yeni İsveç vatandaşlarını törenlerle karşılar.</p>
          <h2>İlkbahar ve yaz</h2>
          <ul>
            <li><b>Paskalya</b> Mart veya Nisan'a denk gelir ve Hristiyan kökenlidir, ancak birçok kişi onu bir aile ve ilkbahar tatili olarak kutlar.</li>
            <li><b>Walpurgis Gecesi</b> (Valborg), 30 Nisan, çoğu zaman ilkbaharı karşılayan şenlik ateşleri ve şarkılar anlamına gelir.</li>
            <li><b>Bir Mayıs</b> Uluslararası İşçi Günü'dür ve gösteriler ve siyasi konuşmalarla anılır.</li>
            <li><b>Yaz Ortası Arifesi</b> (Midsommar) her zaman 19 ile 25 Haziran arasında bir Cuma günüdür; açık hava buluşmaları, çiçek çelenkleri, bir yaz ortası direği, ringa balığı, taze patates ve çileklerle kutlanır.</li>
          </ul>
          <h2>Sonbahar ve kış</h2>
          <ul>
            <li><b>Azizler Günü</b>, birçok kişinin ölen akraba ve arkadaşlarını anmak için mezarlarda mum yaktığı gündür.</li>
            <li><b>Advent</b>, Noel'den önceki dört Pazar günüdür. Birçok ev Advent mumları, yıldızları veya takvimleri kullanır.</li>
            <li><b>Lucia</b>, 13 Aralık, yılın en karanlık döneminde ışıkla ilgilidir; çoğu zaman alaylar, mumlar ve şarkılarla kutlanır.</li>
            <li><b>Noel</b> Hristiyan kökenlidir ve aynı zamanda önemli bir aile tatilidir. İsveç'te ana kutlama genellikle 24 Aralık'ta, Noel Arifesi'nde olur.</li>
            <li><b>Yılbaşı Gecesi</b>, 31 Aralık, genellikle akşam yemekleri, partiler ve gece yarısı havai fişeklerle kutlanır.</li>
          </ul>
          <h2>Yeni gelenekler</h2>
          <p>Göç, İsveç kamusal yaşamına daha fazla görünür gelenek ekledi. Eid al-Fitr, Nouruz, Newroz, Diwali ve diğer kutlamalar okullarda, işyerlerinde, mahallelerde ve şehir etkinliklerinde görülebilir. Önemli örüntü basittir: gelenekler yolculuk edebilir ve uyum sağlayabilir.</p>
          ${ebookFactBox('tr', null, 'Ulusal Gün: 6 Haziran · Walpurgis Gecesi: 30 Nisan · Yaz Ortası Arifesi: 19 ile 25 Haziran arası bir Cuma · Lucia: 13 Aralık · Noel Arifesi: 24 Aralık.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Традиції змінюються</h2>
          <p>Традиція — це звичай, який поділяє група: свято, пісня, їжа, одяг, церемонія чи спосіб зібратися разом. Традиції можуть бути давніми, не будучи застиглими. Люди переїжджають, родини змішуються, а нові звичаї стають частиною повсякденної Швеції.</p>
          <p>Саме тому цей розділ не є переліком «справжньої» та «несправжньої» шведськості. Це календар спільних орієнтирів: свят і ритуалів, які з'являються у школі, на роботі, у суспільному житті та в матеріалах для вивчення громадянознавства.</p>
          <h2>Національний день і громадянські церемонії</h2>
          <p>Національний день Швеції — 6 червня. Він пов'язаний з обранням Густава Вази королем у 1523 році та з Актом про форму правління 1809 року. Сьогодні піднімають прапори, виголошують промови, і багато муніципалітетів вітають нових громадян Швеції на церемоніях.</p>
          <h2>Весна та літо</h2>
          <ul>
            <li><b>Великдень</b> припадає на березень або квітень і має християнське коріння, хоча багато людей святкують його як родинне та весняне свято.</li>
            <li><b>Вальпургієва ніч</b> (Valborg), 30 квітня, часто означає багаття та пісні на честь весни.</li>
            <li><b>Перше травня</b> — Міжнародний день праці, який відзначають демонстраціями та політичними промовами.</li>
            <li><b>Переддень літнього сонцестояння</b> (Midsommar) — це завжди п'ятниця між 19 та 25 червня, із зібраннями просто неба, вінками з квітів, святковим стовпом, оселедцем, молодою картоплею та полуницею.</li>
          </ul>
          <h2>Осінь і зима</h2>
          <ul>
            <li><b>День усіх святих</b> — це коли багато людей запалюють свічки на могилах, щоб згадати померлих родичів і друзів.</li>
            <li><b>Адвент</b> — це чотири неділі перед Різдвом. Багато домівок використовують адвентські свічки, зірки або календарі.</li>
            <li><b>Lucia</b>, 13 грудня, присвячена світлу в найтемнішу пору року, часто з процесіями, свічками та співами.</li>
            <li><b>Різдво</b> має християнське коріння і є також важливим родинним святом. У Швеції головне святкування зазвичай припадає на Святвечір, 24 грудня.</li>
            <li><b>Переддень Нового року</b>, 31 грудня, зазвичай святкують вечерями, вечірками та феєрверками опівночі.</li>
          </ul>
          <h2>Нові традиції</h2>
          <p>Міграція додала більше помітних традицій до суспільного життя Швеції. Eid al-Fitr, Nouruz, Newroz, Diwali та інші святкування можуть з'являтися у школах, на робочих місцях, у районах і на міських заходах. Важлива закономірність проста: традиції можуть подорожувати й адаптуватися.</p>
          ${ebookFactBox('uk', null, "Національний день: 6 червня · Вальпургієва ніч: 30 квітня · Переддень літнього сонцестояння: п'ятниця між 19 та 25 червня · Lucia: 13 грудня · Святвечір: 24 грудня.", ['uhrStudyMaterial'])}
        `,
      },
    },
  };

  const ORDER = ['intro', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

  function getLang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }
  function tr(map) {
    return (map && (map[getLang()] || map.en)) || '';
  }
  function getActiveChapter() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    const m = hash.match(/[?&]c=([^&]+)/);
    return m ? m[1] : 'intro';
  }
  const PRACTICE_LINKS = {
    intro: { href: '#/practice', en: 'Open practice', sv: 'Öppna övning' },
    1: { href: '#/practice?c=10', en: 'Practice history', sv: 'Öva historia' },
    2: { href: '#/practice?c=3', en: 'Practice government', sv: 'Öva statsskick' },
    3: { href: '#/practice?c=5', en: 'Practice rights', sv: 'Öva rättigheter' },
    4: { href: '#/practice?c=8', en: 'Practice work and money', sv: 'Öva arbete och ekonomi' },
    5: { href: '#/practice?c=7', en: 'Practice equality', sv: 'Öva jämställdhet' },
    6: { href: '#/practice?c=9', en: 'Practice welfare', sv: 'Öva välfärd' },
    7: { href: '#/practice?c=1', en: 'Practice nature', sv: 'Öva natur' },
    8: { href: '#/practice?c=13', en: 'Practice traditions', sv: 'Öva traditioner' },
    9: { href: '#/practice?c=8', en: 'Practice money', sv: 'Öva ekonomi' },
    10: { href: '#/practice?c=11', en: 'Practice EU and world', sv: 'Öva EU och omvärld' },
    11: { href: '#/practice?c=mix', en: 'Practice mixed questions', sv: 'Öva blandade frågor' },
    12: { href: '#/mock', en: 'Start mock exam', sv: 'Starta övningsprov' },
    13: { href: '#/practice?c=13', en: 'Practice traditions', sv: 'Öva traditioner' },
  };
  function practiceLink(id) {
    return PRACTICE_LINKS[id] || { href: '#/practice', en: 'Open practice', sv: 'Öppna övning' };
  }

  function render() {
    const reader = document.getElementById('ebook-reader');
    if (!reader) return;
    const requestedId = getActiveChapter();
    const id = ORDER.includes(requestedId) ? requestedId : 'intro';
    const lang = getLang();
    const ch = CHAPTERS[id] || CHAPTERS.intro;
    const sv = lang === 'sv';

    const titleHtml = ch.title
      ? `<h1 class="ebook__h1"><span>${ch.title[lang] || ch.title.en}</span> <em>${ch.title_em[lang] || ch.title_em.en}</em></h1>`
      : `<h1 class="ebook__h1"><em>${(ch.kicker[lang] || ch.kicker.en).split('·')[1]?.trim() || ch.kicker[lang] || ch.kicker.en}</em></h1>`;

    const ledeHtml = ch.lede ? `<p class="ebook__lede">${ch.lede[lang] || ch.lede.en}</p>` : '';

    const baseBodyHtml = ch.body
      ? ch.body[lang] || ch.body.en
      : `<div class="ebook__stub">
          <h3>${tr({ sv: 'Kapitlet kunde inte öppnas', en: 'Chapter could not be opened', 'zh-Hans': '无法打开该章节', 'zh-Hant': '無法開啟該章節', ar: 'تعذّر فتح الفصل', ckb: 'بەشەکە نەکرایەوە', fa: 'فصل باز نشد', pl: 'Nie udało się otworzyć rozdziału', so: 'Cutubka lama furi karin', ti: 'እቲ ምዕራፍ ክኽፈት ኣይከኣለን', tr: 'Bölüm açılamadı', uk: 'Не вдалося відкрити розділ' })}</h3>
          <p>${tr({
            sv: 'Välj ett kapitel i listan eller gå tillbaka till introduktionen.',
            en: 'Choose a chapter from the list or return to the introduction.',
            'zh-Hans': '请从列表中选择一个章节，或返回简介。',
            'zh-Hant': '請從列表中選擇一個章節，或返回簡介。',
            ar: 'اختر فصلًا من القائمة أو ارجع إلى المقدمة.',
            ckb: 'بەشێک لە لیستەکە هەڵبژێرە یان بگەڕێوە بۆ پێشەکی.',
            fa: 'یک فصل را از فهرست انتخاب کنید یا به مقدمه بازگردید.',
            pl: 'Wybierz rozdział z listy lub wróć do wprowadzenia.',
            so: 'Liiska ka dooro cutub ama ku noqo hordhaca.',
            ti: 'ካብ ዝርዝር ምዕራፍ ምረጽ ወይ ናብ መእተዊ ተመለስ።',
            tr: 'Listeden bir bölüm seçin veya girişe geri dönün.',
            uk: 'Виберіть розділ зі списку або поверніться до вступу.',
          })}</p>
        </div>`;
    const bodyProvenance = addEbookSectionFootnotes(lang, id, baseBodyHtml);

    const idx = ORDER.indexOf(id);
    const prev = idx > 0 ? ORDER[idx - 1] : null;
    const next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    const practice = practiceLink(id);
    const progressLabel =
      id === 'intro' ? (sv ? 'Guide' : 'Guide') : `${idx} / ${ORDER.length - 1}`;
    const actions = `
      <aside class="ebook__study-actions" aria-label="${tr({ sv: 'Nästa steg', en: 'Next study steps', 'zh-Hans': '下一步', 'zh-Hant': '下一步', ar: 'خطوات الدراسة التالية', ckb: 'هەنگاوەکانی دواتری خوێندن', fa: 'گام‌های بعدی مطالعه', pl: 'Następne kroki', so: 'Tallaabooyinka xiga', ti: 'ዝቕጽሉ ስጉምትታት', tr: 'Sonraki adımlar', uk: 'Наступні кроки' })}">
        <div>
          <span class="ebook__progress">${progressLabel}</span>
          <p>${tr({
            sv: 'Gör kapitlet aktivt: öva direkt, kontrollera källor eller gör ett övningsprov när du har läst klart.',
            en: 'Make the chapter active: practice it now, check the sources, or run a mock exam once you finish reading.',
            'zh-Hans': '让本章动起来：立即练习、查看来源，或在读完后做一次模拟考试。',
            'zh-Hant': '讓本章動起來：立即練習、查看來源，或在讀完後做一次模擬考試。',
            ar: 'فعّل الفصل: تدرّب عليه الآن، أو تحقّق من المصادر، أو أجرِ اختبارًا تجريبيًا بعد أن تنتهي من القراءة.',
            ckb: 'بەشەکە چالاک بکە: ئێستا لەسەری مەشق بکە، سەرچاوەکان بپشکنە، یان دوای تەواوکردنی خوێندنەوە تاقیکردنەوەیەکی ئەزموونی ئەنجام بدە.',
            fa: 'فصل را فعال کنید: همین حالا روی آن تمرین کنید، منابع را بررسی کنید، یا پس از پایان خواندن یک آزمون آزمایشی بدهید.',
            pl: 'Wykorzystaj rozdział w praktyce: poćwicz od razu, sprawdź źródła lub zrób egzamin próbny, gdy skończysz czytać.',
            so: 'Cutubka firfircoon ka dhig: isla markiiba tababar, hubi ilaha, ama samee imtixaan tijaabo ah marka aad akhrinta dhammayso.',
            ti: 'ነቲ ምዕራፍ ንጡፍ ግበሮ፦ ብኡንብኡ ተለማመድ፣ ንምንጪታት ኣረጋግጽ፣ ወይ ምንባብ ምስ ወዳእካ ናይ ልምምድ ፈተና ግበር።',
            tr: 'Bölümü etkin kullanın: hemen alıştırma yapın, kaynakları kontrol edin veya okumayı bitirdiğinizde bir deneme sınavı yapın.',
            uk: 'Зробіть розділ активним: потренуйтеся одразу, перевірте джерела або пройдіть пробний іспит, коли дочитаєте.',
          })}</p>
        </div>
        <div class="ebook__study-links">
          <a class="btn btn--gold btn--sm" href="${practice.href}">${practice[lang]} →</a>
          <a class="btn btn--ghost btn--sm" href="#/mock">${tr({ sv: 'Övningsprov', en: 'Mock exam', 'zh-Hans': '模拟考试', 'zh-Hant': '模擬考試', ar: 'اختبار تجريبي', ckb: 'تاقیکردنەوەی ئەزموونی', fa: 'آزمون آزمایشی', pl: 'Egzamin próbny', so: 'Imtixaan tijaabo ah', ti: 'ናይ ልምምድ ፈተና', tr: 'Deneme sınavı', uk: 'Пробний іспит' })}</a>
          <a class="btn btn--ghost btn--sm" href="#/sources">${tr({ sv: 'Källor', en: 'Sources', 'zh-Hans': '来源', 'zh-Hant': '來源', ar: 'المصادر', ckb: 'سەرچاوەکان', fa: 'منابع', pl: 'Źródła', so: 'Ilaha', ti: 'ምንጪታት', tr: 'Kaynaklar', uk: 'Джерела' })}</a>
        </div>
      </aside>
    `;
    const notes = `
      <section class="ebook__notes" aria-label="${tr({ sv: 'Dina markeringar', en: 'Your highlights', 'zh-Hans': '你的标注', 'zh-Hant': '你的標註', ar: 'تظليلاتك', ckb: 'نیشانەکردنەکانت', fa: 'هایلایت‌های شما', pl: 'Twoje zaznaczenia', so: 'Calaamadahaaga', ti: 'ምልክታትካ', tr: 'İşaretlemeleriniz', uk: 'Ваші виділення' })}">
        <h2>${tr({ sv: 'Markeringar i kapitlet', en: 'Chapter highlights', 'zh-Hans': '本章标注', 'zh-Hant': '本章標註', ar: 'تظليلات الفصل', ckb: 'نیشانەکردنەکانی بەش', fa: 'هایلایت‌های فصل', pl: 'Zaznaczenia w rozdziale', so: 'Calaamadaha cutubka', ti: 'ምልክታት ኣብ ምዕራፍ', tr: 'Bölümdeki işaretlemeler', uk: 'Виділення в розділі' })}</h2>
        <div id="eb-notes-list"></div>
      </section>
    `;
    const pager = `
      <nav class="ebook__pager">
        ${prev ? `<a href="#/ebook?c=${prev}"><span class="lbl">${tr({ sv: 'Förra', en: 'Previous', 'zh-Hans': '上一章', 'zh-Hant': '上一章', ar: 'السابق', ckb: 'پێشتر', fa: 'قبلی', pl: 'Poprzednie', so: 'Hore', ti: 'ዝሓለፈ', tr: 'Önceki', uk: 'Попереднє' })}</span><span>${CHAPTERS[prev].kicker[lang] || CHAPTERS[prev].kicker.en}</span></a>` : `<span></span>`}
        ${next ? `<a href="#/ebook?c=${next}" class="next"><span class="lbl">${tr({ sv: 'Nästa', en: 'Next', 'zh-Hans': '下一章', 'zh-Hant': '下一章', ar: 'التالي', ckb: 'دواتر', fa: 'بعدی', pl: 'Następne', so: 'Xiga', ti: 'ዝቕጽል', tr: 'Sonraki', uk: 'Наступне' })}</span><span>${CHAPTERS[next].kicker[lang] || CHAPTERS[next].kicker.en}</span></a>` : `<span></span>`}
      </nav>
    `;

    reader.innerHTML = `
      <div class="ebook__crumb">${ch.kicker[lang] || ch.kicker.en}</div>
      ${titleHtml}
      ${ledeHtml}
      ${renderEbookProvenanceBadge(lang, bodyProvenance.sourceCounts)}
      ${bodyProvenance.html}
      ${bodyProvenance.footnotesHtml}
      ${actions}
      ${notes}
      ${pager}
    `;

    // highlight sidebar
    document.querySelectorAll('.ebook__nav a[data-eb]').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.eb === id);
    });

    // scroll reader to top
    reader.scrollTop = 0;
    if (window.smtApplyEbookHighlights) window.smtApplyEbookHighlights();
  }

  function isOnEbook() {
    const path = (location.hash || '#/').replace(/^#/, '').split('?')[0];
    return path === '/ebook';
  }

  window.smtEbookRender = render;
  window.addEventListener('hashchange', () => {
    if (isOnEbook()) render();
  });
  window.addEventListener('DOMContentLoaded', () => {
    if (isOnEbook()) render();
  });
  document.addEventListener('click', (e) => {
    if (
      e.target.closest('.lang button[data-lang]') ||
      e.target.closest('[data-set="language"] button')
    ) {
      if (isOnEbook()) setTimeout(render, 50);
    }
  });
})();
