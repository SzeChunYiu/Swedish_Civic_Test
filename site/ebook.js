/* Sveriges Medborgartest — Ebook reader
   Intro + 13 study chapters with EN reader text and SV study briefs.
   Hash: #/ebook?c=intro|1|2|...|13
*/

(function () {
  'use strict';

  const EBOOK_FACTBOX_SOURCE_NOTES = Object.freeze({
    uhrStudyMaterial: {
      label: 'UHR public study material',
      mixLabel: 'UHR',
      url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
      retrievedDate: '2026-05-19',
    },
    scbLandUse: {
      label: 'SCB land and water area statistics',
      mixLabel: 'SCB',
      url: 'https://www.scb.se/mi0803-en',
      retrievedDate: '2026-05-19',
    },
    riksbankHistory: {
      label: 'Riksbank historical timeline',
      mixLabel: 'Riksbank',
      url: 'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
      retrievedDate: '2026-05-19',
    },
    governmentNato: {
      label: 'Government Offices NATO membership notice',
      mixLabel: 'Government Offices',
      url: 'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
      retrievedDate: '2026-05-19',
    },
    migrationsverketCitizenshipRules: {
      label: 'Migrationsverket citizenship rule changes from 6 June 2026',
      mixLabel: 'Migrationsverket',
      url: 'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
      retrievedDate: '2026-05-20',
    },
  });

  const EBOOK_SOURCE_NOTES = Object.freeze({
    ...EBOOK_FACTBOX_SOURCE_NOTES,
    editorialCommentary: {
      label: 'editorial commentary',
      mixLabel: 'Editorial',
      url: '#/sources',
      retrievedDate: 'editorial',
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
    return `<a href="${note.url}">${note.label}</a> (${note.retrievedDate})`;
  }

  function ebookSourceNotes(sourceKeys) {
    return Array.from(new Set(sourceKeys))
      .map((key) => EBOOK_SOURCE_NOTES[key])
      .filter(Boolean);
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

  function assertEbookSourceKeys(sourceKeys, label) {
    if (!Array.isArray(sourceKeys) || sourceKeys.length === 0) {
      throw new Error(`${label} must pass explicit ebook sourceKeys`);
    }
    const unsupported = sourceKeys.filter((key) => !EBOOK_SOURCE_NOTES[key]);
    if (unsupported.length > 0) {
      throw new Error(`${label} has unsupported ebook sourceKeys: ${unsupported.join(', ')}`);
    }
  }

  function normalizedEbookSourceKeys(sourceKeys, label) {
    assertEbookSourceKeys(sourceKeys, label);
    return Array.from(new Set(sourceKeys));
  }

  function ebookSourceKeyDataAttr(sourceKeys) {
    if (!sourceKeys) return '';
    return ` data-ebook-source-keys="${normalizedEbookSourceKeys(sourceKeys, 'ebook source metadata').join(' ')}"`;
  }

  const EBOOK_DEFAULT_PROSE_SOURCE_KEYS = Object.freeze(['uhrStudyMaterial']);
  const EBOOK_EDITORIAL_PROSE_SOURCE_KEYS = Object.freeze([
    'uhrStudyMaterial',
    'editorialCommentary',
  ]);
  const EBOOK_LEDE_SOURCE_KEYS = Object.freeze({
    intro: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    1: Object.freeze(['uhrStudyMaterial', 'governmentNato', 'editorialCommentary']),
    7: Object.freeze(['uhrStudyMaterial', 'scbLandUse', 'editorialCommentary']),
    10: Object.freeze(['uhrStudyMaterial', 'governmentNato', 'editorialCommentary']),
    12: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
  });

  function ebookLedeSourceKeys(chapterId) {
    return EBOOK_LEDE_SOURCE_KEYS[chapterId] || EBOOK_EDITORIAL_PROSE_SOURCE_KEYS;
  }

  function parseEbookSourceKeyMetadata(attrs) {
    const match = attrs.match(/\sdata-ebook-source-keys="([^"]+)"/);
    if (!match) return null;
    return match[1].split(/\s+/).filter(Boolean);
  }

  function stripEbookSourceKeyMetadata(attrs) {
    return attrs.replace(/\sdata-ebook-source-keys="[^"]*"/, '');
  }

  function ebookFactBox(lang, heading, facts, sourceKeys) {
    const normalizedSourceKeys = normalizedEbookSourceKeys(sourceKeys, 'ebookFactBox');
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
        <p${ebookSourceKeyDataAttr(normalizedSourceKeys)}>${facts}</p>
        ${ebookSourceNote(lang, normalizedSourceKeys)}
      </div>
    `;
  }

  function ebookRouteHash(chapterId, targetParam, targetId) {
    return `#/ebook?c=${encodeURIComponent(chapterId)}&${targetParam}=${encodeURIComponent(targetId)}`;
  }

  function ebookSourceCounts(footnotes) {
    const counts = {};
    footnotes.forEach((footnote) => {
      Array.from(new Set(footnote.sourceKeys)).forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }

  function ebookSourceMixLabel(footnotes) {
    const counts = ebookSourceCounts(footnotes);
    return Object.keys(EBOOK_SOURCE_NOTES)
      .filter((key) => counts[key])
      .map((key) => {
        const note = EBOOK_SOURCE_NOTES[key];
        const count = counts[key];
        return `${note.mixLabel || note.label} (${count} ${count === 1 ? 'cite' : 'cites'})`;
      })
      .join(' · ');
  }

  function createEbookFootnoteCollector(chapterId, lang) {
    const footnotes = [];
    return {
      footnotes,
      annotate(html, fallbackSourceKeys = EBOOK_DEFAULT_PROSE_SOURCE_KEYS) {
        normalizedEbookSourceKeys(fallbackSourceKeys, `ebook prose chapter ${chapterId}`);
        return html.replace(
          /<(p|li)(?![^>]*class="ebook__source-note")([^>]*)>([\s\S]*?)<\/\1>/g,
          (match, tagName, attrs, content) => {
            const explicitSourceKeys = parseEbookSourceKeyMetadata(attrs);
            const cleanAttrs = stripEbookSourceKeyMetadata(attrs);
            const sourceKeys = normalizedEbookSourceKeys(
              explicitSourceKeys || fallbackSourceKeys,
              `ebook ${tagName} chapter ${chapterId}`,
            );
            const footnoteIndex = footnotes.length + 1;
            const id = `eb-${chapterId}-${lang}-fn-${footnoteIndex}`;
            footnotes.push({ id, index: footnoteIndex, sourceKeys });
            const keys = Array.from(new Set(sourceKeys)).join(' ');
            return `<${tagName}${cleanAttrs} data-source-claims="ebook" data-source-scope="ebook" data-source-keys="${keys}">${content}<sup id="${id}-ref" class="ebook__source-ref"><a href="${ebookRouteHash(chapterId, 'fn', id)}" aria-label="${lang === 'sv' ? 'Källa' : 'Source'} ${footnoteIndex}">[${footnoteIndex}]</a></sup></${tagName}>`;
          },
        );
      },
    };
  }

  function renderEbookFootnotes(lang, chapterId, footnotes) {
    if (footnotes.length === 0) return '';
    const heading = lang === 'sv' ? 'Källor i kapitlet' : 'Chapter sources';
    const items = footnotes
      .map((footnote) => {
        const sources = ebookSourceNotes(footnote.sourceKeys).map(sourceLink).join(' · ');
        return `<li id="${footnote.id}"><a href="${ebookRouteHash(chapterId, 'fnref', footnote.id)}"><span>${footnote.index}</span></a> ${sources}</li>`;
      })
      .join('');
    return `<section class="ebook__footnotes" aria-label="${heading}"><h2>${heading}</h2><ol>${items}</ol></section>`;
  }

  function renderEbookProvenanceBadge(lang, footnotes) {
    const count = footnotes.length || 0;
    const sourceSummary = ebookSourceMixLabel(footnotes) || 'source metadata';
    const serializedCounts = JSON.stringify(ebookSourceCounts(footnotes));
    if (lang === 'sv') {
      return `<p class="ebook__provenance-badge ebook__provenance-badge--source-mix" data-source-counts='${serializedCounts}' aria-label="Källor: ${count}. ${sourceSummary}. Egen studieguide; kontrollera fakta via källsidan och UHR-materialet."><span>Källor: ${count}</span> · ${sourceSummary} · Egen studieguide med kapitelkällor; kontrollera fakta via <a href="#/sources">källsidan</a> och UHR-materialet.</p>`;
    }
    return `<p class="ebook__provenance-badge ebook__provenance-badge--source-mix" data-source-counts='${serializedCounts}' aria-label="Sources: ${count}. ${sourceSummary}. Original study guide; verify facts through the Sources page and UHR material."><span>Sources: ${count}</span> · ${sourceSummary} · Original study guide with chapter sources; verify facts through the <a href="#/sources">Sources page</a> and UHR material.</p>`;
  }

  function svStudyBrief(points, facts, sourceKeys, practiceHint, afterPracticeHtml = '') {
    assertEbookSourceKeys(sourceKeys, 'svStudyBrief fact box');
    const items = points
      .map((point) => {
        const text = typeof point === 'string' ? point : point.text;
        const pointSourceKeys = typeof point === 'string' ? null : point.sourceKeys;
        return `<li${ebookSourceKeyDataAttr(pointSourceKeys)}>${text}</li>`;
      })
      .join('');
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — joins NATO, ending more than 200 years of military non-alignment.</li>
          </ul>
          ${ebookFactBox('en', 'Facts to review', 'National day: June 6 · Joined EU: 1995 · Joined NATO: 2024 · Long peace period: commonly described as continuous since 1814.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        sv: svStudyBrief(
          [
            'Sveriges historia handlar om hur ett äldre kungarike blev en modern demokrati med riksdag, grundlagar och offentlig välfärd.',
            'Nationaldagen den 6 juni kopplas till Gustav Vasas val till kung 1523 och till 1809 års regeringsform.',
            'Under 1900-talet byggdes folkhemmet ut med skola, vård, pensioner och socialförsäkringar finansierade med skatter.',
            {
              text: 'I modern tid är EU-medlemskapet 1995, euroomröstningen 2003 och NATO-medlemskapet 2024 centrala hållpunkter.',
              sourceKeys: ['uhrStudyMaterial', 'governmentNato'],
            },
          ],
          'Nationaldag: 6 juni · EU: 1995 · Euroomröstning: 2003 · NATO: 2024.',
          ['uhrStudyMaterial', 'governmentNato'],
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 年——加入 NATO，结束了 200 多年的军事不结盟立场。</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 年——加入 NATO，結束了 200 多年的軍事不結盟立場。</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — الانضمام إلى NATO، منهيةً أكثر من 200 عام من عدم الانحياز العسكري.</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — چوونە ناو NATO، کۆتایی هێنان بە زیاتر لە 200 ساڵ نابەستراویی سەربازی.</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — پیوستن به NATO و پایان‌دادن به بیش از 200 سال عدم تعهد نظامی.</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — przystąpienie do NATO, kończące ponad 200 lat braku przynależności wojskowej.</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — waxay ku biirtay NATO, taas oo soo afjartay in ka badan 200 sano oo aan militari isbahaysi lahayn.</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — ናብ NATO ኣተወት፣ ካብ 200 ዓመት ንላዕሊ ዝጸንሐ ወተሃደራዊ ዘይምሕባር ኣብቂዓ።</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — 200 yılı aşkın askeri tarafsızlığı sona erdirerek NATO'ya katılır.</li>
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>2024 — вступає до NATO, завершуючи понад 200 років військового нейтралітету.</li>
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
          ${ebookFactBox('en', 'Facts to review', 'Riksdag size: 349 · Threshold: 4% · Election interval: 4 years · Number of regions: 21 · Number of municipalities: 290.', ['uhrStudyMaterial'])}
        `,
        sv: svStudyBrief(
          [
            'Sverige är både en konstitutionell monarki och en parlamentarisk demokrati: kungen har ceremoniella uppgifter, medan riksdag och regering fattar politiska beslut.',
            'Riksdagen har 349 ledamöter, beslutar om lagar och statsbudget och kontrollerar regeringen.',
            'Regionerna ansvarar främst för hälso- och sjukvård och kollektivtrafik. Kommunerna ansvarar bland annat för skola, socialtjänst, vatten och avfall.',
            'Allmänna val hålls vart fjärde år. Svenska medborgare röstar till riksdagen, regionen och kommunen.',
          ],
          'Riksdag: 349 ledamöter · Val: vart fjärde år · Regioner: 21 · Kommuner: 290.',
          ['uhrStudyMaterial'],
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
          ${ebookFactBox('en', 'Facts to review', 'Number of basic laws: 4 · Oldest: Tryckfrihetsförordningen (1766) · Inheritance rule: oldest child regardless of gender (since 1980).', ['uhrStudyMaterial'])}
        `,
        sv: svStudyBrief(
          [
            'Sverige har fyra grundlagar: regeringsformen, successionsordningen, tryckfrihetsförordningen och yttrandefrihetsgrundlagen.',
            'Grundlagarna skyddar bland annat yttrandefrihet, religionsfrihet, föreningsfrihet och rätten att demonstrera.',
            'Offentlighetsprincipen betyder att många handlingar hos myndigheter är offentliga, om de inte omfattas av sekretess.',
            'Rättigheter hör ihop med ansvar: hot, hets mot folkgrupp, förtal och diskriminering kan fortfarande vara förbjudet.',
          ],
          'Grundlagar: 4 · Tryckfrihetsförordningen: 1766 · Offentlighetsprincipen: insyn i myndigheter.',
          ['uhrStudyMaterial'],
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
          ${ebookFactBox('en', 'Facts to review', 'VAT default: 25% · VAT food: 12% · Parental leave: 480 days · No legal minimum wage · Collective agreements set sector minimums.', ['uhrStudyMaterial'])}
        `,
        sv: svStudyBrief(
          [
            'Arbetsmarknaden bygger mycket på kollektivavtal mellan fackförbund och arbetsgivare. Där regleras ofta lön, arbetstid och villkor.',
            'Skatter finansierar gemensam välfärd som skola, vård, omsorg, pensioner och socialförsäkringar.',
            'Skatteverket hanterar skatt och folkbokföring. Personnummer och folkbokföringsadress används i många vardagliga kontakter.',
            'Privatekonomi i Sverige handlar ofta om lön efter skatt, räkningar, försäkringar, sparande och att betala i tid.',
          ],
          'Kollektivavtal · Kommunalskatt · Skatteverket · Välfärd finansieras gemensamt.',
          ['uhrStudyMaterial'],
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
      title: { en: 'Equality', sv: 'Jämställdhet' },
      title_em: { en: 'and the modern household.', sv: 'och det moderna hemmet.' },
      lede: {
        en: 'Sweden is a quiet feminist project. The laws are clearer than the dinner-table conversations, but both are worth knowing.',
        sv: 'Sverige är ett tyst feministiskt projekt. Lagarna är tydligare än middagsbordssamtalen — men båda är värda att kunna.',
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
          ${ebookFactBox('en', 'Facts to review', 'Same-sex marriage: 2009 · Discrimination grounds: 7 · Parental leave: 480 days · Reserved per parent: 90 days each.', ['uhrStudyMaterial'])}
        `,
        sv: svStudyBrief(
          [
            'Jämställdhet betyder att kvinnor och män ska ha samma rättigheter, skyldigheter och möjligheter.',
            'Diskrimineringslagen skyddar mot diskriminering i till exempel arbetsliv, utbildning, vård och samhällsservice.',
            'Sverige erkänner samkönade äktenskap och familjer med olika sammansättning.',
            'Föräldraförsäkringen är byggd för att båda föräldrarna ska kunna ta ansvar för barn och arbete.',
          ],
          'Diskrimineringslagen · Samkönade äktenskap: 2009 · Föräldraledighet: 480 dagar per barn.',
          ['uhrStudyMaterial'],
        ),
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
        so: 'Cutubka 06 · Bulshada',
        ti: 'ምዕራፍ 06 · ሕብረተሰብ',
        tr: 'Bölüm 06 · Toplum',
        uk: 'Розділ 06 · Суспільство',
      },
      title: { en: 'Society, school,', sv: 'Samhälle, skola' },
      title_em: { en: 'and healthcare.', sv: 'och vård.' },
      lede: {
        en: 'Sweden runs the boring parts of life — school, healthcare, eldercare — through the public sector, and is largely on first-name terms with its bureaucrats.',
        sv: 'Sverige sköter livets tråkiga delar — skola, vård, äldreomsorg — i offentlig regi, och är på förnamn med byråkraterna.',
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
          ${ebookFactBox('en', 'Facts to review', 'Compulsory school: 10 years (förskoleklass + grades 1–9) · Health hotline: 1177 · Number of regions: 21 · University tuition: free for residents.', ['uhrStudyMaterial'])}
        `,
        sv: svStudyBrief(
          [
            'Skolan ska ge barn kunskaper och likvärdiga möjligheter. Grundskolan omfattar förskoleklass och årskurs 1-9.',
            'Regionerna ansvarar för hälso- och sjukvård. 1177 används för sjukvårdsrådgivning och kontakt med vården.',
            'Kommunerna ansvarar för äldreomsorg, socialtjänst och många vardagliga välfärdstjänster.',
            'Socialtjänsten kan ge stöd när någon behöver skydd, råd, ekonomisk hjälp eller omsorg.',
          ],
          'Grundskola: 10 år · 1177 · Regioner ansvarar för vård · Kommuner ansvarar för omsorg och socialtjänst.',
          ['uhrStudyMaterial'],
        ),
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
        so: 'Cutubka 07 · Dabeecadda',
        ti: 'ምዕራፍ 07 · ተፈጥሮ',
        tr: 'Bölüm 07 · Doğa',
        uk: 'Розділ 07 · Природа',
      },
      title: { en: 'Nature, climate,', sv: 'Natur, klimat' },
      title_em: { en: 'and allemansrätten.', sv: 'och allemansrätten.' },
      lede: {
        en: "Sweden is mostly forest, and the forest is mostly open to you. The rule is simple: don't disturb, don't destroy.",
        sv: 'Sverige är mest skog, och skogen är mest öppen för dig. Regeln är enkel: stör inte, förstör inte.',
      },
      body: {
        en: `
          <h2>The right of public access (allemansrätten)</h2>
          <p>Almost any land in Sweden — forest, field, shore — is open to walking, picking berries, swimming, foraging, camping (one night), and quiet enjoyment. It is a custom, not a written law, but it is taken seriously.</p>
          <p>The catch: <em>"Inte störa, inte förstöra"</em> — do not disturb, do not destroy. You may not enter private gardens or pitch a tent in someone's view. You may not light fires when there's a fire ban. You may not take downed wood for sale, or pick protected species.</p>
          <h2>Geography</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Sweden is the fifth-largest country in Europe. Its geography mixes forest, lakes, mountains, agricultural land, and a long coastline. The longest river is Klarälven–Göta älv (about 720 km). The largest lake is Vänern.</p>
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
            {
              text: 'Sverige har stora skogar, många sjöar, fjäll i norr och lång kust. Klimatet varierar mycket mellan norr och söder.',
              sourceKeys: ['uhrStudyMaterial', 'scbLandUse'],
            },
            'Miljöarbete märks i vardagen genom återvinning, pant, naturvård och mål för minskade utsläpp.',
          ],
          'Allemansrätten · Inte störa, inte förstöra · Vänern är största sjön · Miljömål och återvinning.',
          ['uhrStudyMaterial', 'scbLandUse'],
        ),
      },
    },

    8: {
      kicker: {
        en: 'Chapter 08 · Culture',
        sv: 'Kapitel 08 · Kultur',
        'zh-Hans': '第 08 章 · 文化',
        'zh-Hant': '第 08 章 · 文化',
        ar: 'الفصل 08 · الثقافة',
        ckb: 'بەشی 08 · کەلتوور',
        fa: 'فصل 08 · فرهنگ',
        pl: 'Rozdział 08 · Kultura',
        so: 'Cutubka 08 · Dhaqanka',
        ti: 'ምዕራፍ 08 · ባህሊ',
        tr: 'Bölüm 08 · Kültür',
        uk: 'Розділ 08 · Культура',
      },
      title: { en: 'Culture, traditions,', sv: 'Kultur, traditioner' },
      title_em: { en: 'and the Swedish calendar.', sv: 'och svenska kalendern.' },
      lede: {
        en: "If you don't know when midsummer is, you'll get a polite explanation. If you don't know what fika is, you'll get one whether you want it or not.",
        sv: 'Vet du inte när midsommar är får du en artig förklaring. Vet du inte vad fika är får du en — vare sig du vill eller inte.',
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
          ${ebookFactBox('en', 'Facts to review', 'National day: June 6 · Midsommar: third Friday in June · Lucia: December 13 · Christmas Eve (not Day) is the main celebration.', ['uhrStudyMaterial'])}
        `,
        sv: svStudyBrief(
          [
            'Traditioner förändras över tid, men de hjälper människor att känna igen året och skapa gemenskap.',
            'Midsommar, jul, påsk, nyår, lucia, första maj, nationaldagen och alla helgons dag är vanliga provnära exempel.',
            'Fika är en vardaglig social vana: kaffe eller te, något litet att äta och tid att prata.',
            'Nya traditioner från människor som flyttat till Sverige är också en del av dagens samhälle.',
          ],
          'Nationaldag: 6 juni · Midsommar: tredje fredagen i juni · Lucia: 13 december · Jul firas främst 24 december.',
          ['uhrStudyMaterial'],
        ),
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
        so: 'Cutubka 09 · Lacagta',
        ti: 'ምዕራፍ 09 · ገንዘብ',
        tr: 'Bölüm 09 · Para',
        uk: 'Розділ 09 · Гроші',
      },
      title: { en: 'Money,', sv: 'Pengar,' },
      title_em: { en: 'banks, and BankID.', sv: 'banker och BankID.' },
      lede: {
        en: 'Sweden is one of the least cash-dependent countries on earth. Almost every transaction now passes through one little app.',
        sv: 'Sverige är ett av världens minst kontantberoende länder. Nästan varje transaktion går genom en liten app.',
      },
      body: {
        en: `
          <h2>The Swedish krona (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Sweden voted against adopting the euro in 2003 and uses the krona (kr). The Riksbank — Sweden's central bank, founded in 1668 — sets monetary policy and prints the cash that almost nobody uses.</p>
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
            {
              text: 'Riksbanken är Sveriges centralbank och ansvarar för penningpolitiken.',
              sourceKeys: ['uhrStudyMaterial', 'riksbankHistory'],
            },
            'BankID och Swish är vanliga i vardagen, men de är bankanknutna tjänster och inte samma sak som medborgarskap.',
            'Pensionen består ofta av allmän pension, tjänstepension och eventuellt privat sparande.',
          ],
          'Valuta: svensk krona · Euroomröstning: 2003 · Riksbanken · Swish · BankID.',
          ['uhrStudyMaterial', 'riksbankHistory'],
        ),
      },
    },

    10: {
      kicker: {
        en: 'Chapter 10 · EU & world',
        sv: 'Kapitel 10 · EU & världen',
        'zh-Hans': '第 10 章 · 欧盟与世界',
        'zh-Hant': '第 10 章 · 歐盟與世界',
        ar: 'الفصل 10 · الاتحاد الأوروبي والعالم',
        ckb: 'بەشی 10 · یەکێتیی ئەورووپا و جیهان',
        fa: 'فصل 10 · اتحادیهٔ اروپا و جهان',
        pl: 'Rozdział 10 · UE i świat',
        so: 'Cutubka 10 · Midowga Yurub & adduunka',
        ti: 'ምዕራፍ 10 · ኤውሮጳዊ ሕብረትን ዓለምን',
        tr: 'Bölüm 10 · AB ve dünya',
        uk: 'Розділ 10 · ЄС і світ',
      },
      title: { en: 'Sweden,', sv: 'Sverige,' },
      title_em: { en: 'the EU, and the world.', sv: 'EU och världen.' },
      lede: {
        en: 'Sweden spent two centuries avoiding war and one decade rapidly joining alliances. The pattern is the same — be useful, stay out of trouble.',
        sv: 'Sverige tillbringade två sekel med att undvika krig och ett årtionde med att snabbt gå med i allianser. Mönstret är detsamma — gör nytta, undvik bråk.',
      },
      body: {
        en: `
          <h2>The European Union</h2>
          <p>Sweden joined the EU on 1 January 1995 after a referendum in 1994 (52% yes, 47% no). It uses the krona, not the euro. It has 21 seats in the European Parliament. EU law has precedence over Swedish law in areas the EU has competence over — trade, agriculture, fisheries, environment, free movement.</p>
          <h2>Schengen</h2>
          <p>Sweden is part of the Schengen Area — open internal borders with most of the EU, plus Norway, Iceland, Switzerland, and Liechtenstein. You can travel without passport checks; you may still be asked for ID.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Sweden was militarily non-aligned for over 200 years, neutral through both World Wars and the Cold War. After Russia's invasion of Ukraine, Sweden applied to join NATO in May 2022 and formally joined on 7 March 2024.</p>
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
            {
              text: 'Sverige blev medlem i NATO 2024 efter en lång period av militär alliansfrihet.',
              sourceKeys: ['uhrStudyMaterial', 'governmentNato'],
            },
            'Sverige är också medlem i FN och deltar i internationellt samarbete, bistånd och säkerhetspolitik.',
          ],
          'EU: 1995 · Euroomröstning: 2003 · NATO: 2024 · FN-medlem: 1946.',
          ['uhrStudyMaterial', 'governmentNato'],
        ),
      },
    },

    11: {
      kicker: {
        en: 'Chapter 11 · Migration',
        sv: 'Kapitel 11 · Migration',
        'zh-Hans': '第 11 章 · 移民',
        'zh-Hant': '第 11 章 · 移民',
        ar: 'الفصل 11 · الهجرة',
        ckb: 'بەشی 11 · کۆچ',
        fa: 'فصل 11 · مهاجرت',
        pl: 'Rozdział 11 · Migracja',
        so: 'Cutubka 11 · Socdaalka',
        ti: 'ምዕራፍ 11 · ስደት',
        tr: 'Bölüm 11 · Göç',
        uk: 'Розділ 11 · Міграція',
      },
      title: { en: 'Migration, residence,', sv: 'Migration, uppehåll' },
      title_em: { en: 'and citizenship.', sv: 'och medborgarskap.' },
      lede: {
        en: 'Becoming a Swedish citizen is a process more than an event. The paperwork is long, but the rules are unusually clear.',
        sv: 'Att bli svensk medborgare är mer en process än ett ögonblick. Pappersarbetet är långt, men reglerna är ovanligt tydliga.',
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>For an adult application, be at least 18 years old. From 6 June 2026, children can no longer be included on a parent's citizenship application; a child needs a separate application signed by a guardian.</li>
            <li>Have a permanent residence permit, right of residence, or right of permanent residence.</li>
            <li>Have lived in Sweden for a qualifying period — typically five years (shorter for stateless persons, refugees, and Nordic citizens).</li>
            <li>Have led an orderly life — no significant criminal record.</li>
            <li>(From 2026) Pass the medborgarskapsprov — the citizenship test on civic knowledge and Swedish — and meet a Swedish-language requirement.</li>
          </ul>
          <h2>Dual citizenship</h2>
          <p>Sweden has accepted dual citizenship since 2001. You do not lose your original citizenship by becoming Swedish (subject to your origin country's rules).</p>
          ${ebookFactBox('en', 'Current citizenship notes', 'New citizenship rules apply from 6 June 2026. UHR says the first civic-knowledge sitting is 15 August 2026 in Stockholm. Children need a separate citizenship application from 6 June 2026 · Standard residence requirement: 5 years · Dual citizenship: allowed (since 2001) · Decision authority: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        sv: svStudyBrief(
          [
            'Migrationsverket handlägger många frågor om uppehållstillstånd, asyl, familjeanknytning, arbetstillstånd och medborgarskap.',
            'Skatteverket folkbokför personer som bor i Sverige och hanterar personnummer.',
            'Medborgarskap kräver normalt stadigvarande anknytning till Sverige, skötsamhet och att övriga krav är uppfyllda.',
            {
              text: 'Från 6 juni 2026 kan barn inte längre stå med på en förälders medborgarskapsansökan; barnet behöver en egen ansökan som en vårdnadshavare skriver under.',
              sourceKeys: ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'],
            },
            'Dubbelt medborgarskap är tillåtet enligt svensk rätt, men andra länders regler kan påverka.',
          ],
          'Migrationsverket · Skatteverket · Permanent uppehållstillstånd/rätt · Dubbelt medborgarskap tillåts sedan 2001.',
          ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'],
          'Kontrollera alltid aktuella krav hos Migrationsverket och UHR. Regler kan ändras, och den här boken är bara ett studiehjälpmedel.',
          ebookSourceNote('sv', ['migrationsverketCitizenshipRules']),
        ),
      },
    },

    12: {
      kicker: {
        en: 'Chapter 12 · Mock exam',
        sv: 'Kapitel 12 · Övningsprov',
        'zh-Hans': '第 12 章 · 模拟考试',
        'zh-Hant': '第 12 章 · 模擬考試',
        ar: 'الفصل 12 · اختبار تجريبي',
        ckb: 'بەشی 12 · تاقیکردنەوەی ئەزموونی',
        fa: 'فصل 12 · آزمون آزمایشی',
        pl: 'Rozdział 12 · Egzamin próbny',
        so: 'Cutubka 12 · Imtixaan tijaabo ah',
        ti: 'ምዕራፍ 12 · ናይ ልምምድ ፈተና',
        tr: 'Bölüm 12 · Deneme sınavı',
        uk: 'Розділ 12 · Пробний іспит',
      },
      title: { en: 'Mock exam', sv: 'Övningsprov' },
      title_em: { en: 'and current test status.', sv: 'och aktuell provstatus.' },
      lede: {
        en: 'Use the mock exam for practice, but keep the practical test details tied to UHR and Migrationsverket.',
        sv: 'Använd övningsprovet för övning, men håll praktiska provdetaljer knutna till UHR och Migrationsverket.',
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
      },
    },

    13: {
      kicker: {
        en: 'Chapter 13 · Traditions',
        sv: 'Kapitel 13 · Traditioner',
        'zh-Hans': '第 13 章 · 传统',
        'zh-Hant': '第 13 章 · 傳統',
        ar: 'الفصل 13 · التقاليد',
        ckb: 'بەشی 13 · نەریتەکان',
        fa: 'فصل 13 · سنت‌ها',
        pl: 'Rozdział 13 · Tradycje',
        so: 'Cutubka 13 · Caadooyinka',
        ti: 'ምዕራፍ 13 · ባህልታት',
        tr: 'Bölüm 13 · Gelenekler',
        uk: 'Розділ 13 · Традиції',
      },
      title: { en: 'Traditions,', sv: 'Traditioner,' },
      title_em: { en: 'holidays, and change.', sv: 'högtider och förändring.' },
      lede: {
        en: 'Swedish traditions are not museum pieces. Some are old, some are borrowed, and most are just ways people mark the year together.',
        sv: 'Svenska traditioner är inte museiföremål. Vissa är gamla, vissa har kommit hit senare, och de flesta hjälper människor att känna igen året tillsammans.',
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
          ${ebookFactBox('en', 'Facts to review', 'National Day: June 6 · Walpurgis Night: April 30 · Midsummer Eve: Friday between June 19 and 25 · Lucia: December 13 · Christmas Eve: December 24.', ['uhrStudyMaterial'])}
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
          ['uhrStudyMaterial'],
          'Läs kapitlet tillsammans med övningen för traditioner och högtider. Datum, handlingar och vad högtiderna betyder är vanligare än detaljfrågor om exakt hur varje familj firar.',
        ),
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

  function scrollEbookRouteTarget() {
    const hash = (location.hash || '').replace(/^#/, '');
    const query = hash.split('?')[1] || '';
    const params = {};
    query.split('&').forEach((part) => {
      const [key, value] = part.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    const footnoteTarget = params.fn;
    const footnoteRefTarget = params.fnref;
    const targetId = footnoteTarget || (footnoteRefTarget ? `${footnoteRefTarget}-ref` : '');
    const target = targetId ? document.getElementById(targetId) : null;
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'center' });
    }
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

    const footnoteCollector = createEbookFootnoteCollector(id, lang);
    const ledeHtml = ch.lede
      ? footnoteCollector.annotate(
          `<p class="ebook__lede"${ebookSourceKeyDataAttr(ebookLedeSourceKeys(id))}>${ch.lede[lang] || ch.lede.en}</p>`,
        )
      : '';

    const rawBodyHtml = ch.body
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
    const bodyHtml = footnoteCollector.annotate(rawBodyHtml);
    const footnotesHtml = renderEbookFootnotes(lang, id, footnoteCollector.footnotes);

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
      ${renderEbookProvenanceBadge(lang, footnoteCollector.footnotes)}
      ${bodyHtml}
      ${footnotesHtml}
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
    scrollEbookRouteTarget();
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
