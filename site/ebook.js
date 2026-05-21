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

  function ebookLocalizedLabel(map, lang) {
    return (map && (map[lang] || map.en)) || '';
  }

  function ebookSourceNote(lang, sourceKeys) {
    const notes = sourceKeys.map((key) => EBOOK_FACTBOX_SOURCE_NOTES[key]).filter(Boolean);
    const label = ebookLocalizedLabel(
      {
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
      },
      lang,
    );
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
      ebookLocalizedLabel(
        {
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
        },
        lang,
      );
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

  function ebookSourceCountUnit(lang, count) {
    if (lang === 'sv') return count === 1 ? 'källa' : 'källor';
    return count === 1 ? 'cite' : 'cites';
  }

  function ebookSourceMixLabel(lang, footnotes) {
    const counts = ebookSourceCounts(footnotes);
    return Object.keys(EBOOK_SOURCE_NOTES)
      .filter((key) => counts[key])
      .map((key) => {
        const note = EBOOK_SOURCE_NOTES[key];
        const count = counts[key];
        return `${note.mixLabel || note.label} (${count} ${ebookSourceCountUnit(lang, count)})`;
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
    const sourceSummary = ebookSourceMixLabel(lang, footnotes) || 'source metadata';
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
        'zh-Hans': `<h2>法律上平等</h2>
          <p>《反歧视法》（<em>diskrimineringslagen</em>，2008 年）防止基于七种理由的歧视：性别、性别认同或表达、种族、宗教或信仰、残疾、性取向和年龄。它适用于工作、教育、医疗保健、住房和公共服务。</p>
          <h2>同性婚姻和彩虹家庭</h2>
          <p>同性婚姻自 2009 年起合法。同性伴侣可以在平等条件下收养和获得生育治疗。跨性别者可以在没有医疗要求的情况下改变其法定性别。</p>
          <h2>育儿假</h2>
          <p>每个孩子 480 天，其中 90 天为每位家长（“pappamånader”）预留，且不能转让。目标：父母双方都呆在家里。在瑞典，孩子的第一个生日通常由两个稍微疲倦的成年人庆祝，而不是一个。</p>
          <h2>家庭责任</h2>
          <p>在瑞典，烹饪、清洁、儿童保育和家庭管理等工作并不存在性别歧视——至少在官方上是这样。调查显示，这是花在家务上的时间最平等的国家。 （统计数字就像青少年一样，会撒谎。）</p>
          <h2>女性与工作</h2>
          <p>女性劳动力参与率位居世界前列（约 80%）。性别工资差距是真实存在的（~10-12%），但正在缩小。孕产妇死亡率位居世界最低之列。</p>${ebookFactBox('zh-Hans', null, '同性婚姻：2009 年 · 歧视理由：7 · 育儿假：480 天 · 每位父母保留：每人 90 天。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>法律上平等</h2>
          <p>《反歧視法》（<em>diskrimineringslagen</em>，2008 年）防止基於七種理由的歧視：性別、性別認同或表達、種族、宗教或信仰、殘疾、性取向和年齡。它適用於工作、教育、醫療保健、住房和公共服務。 </p>
          <h2>同性婚姻與彩虹家庭</h2>
          <p>同性婚姻自 2009 年起合法。同性伴侶可以在平等條件下收養和獲得生育治療。跨性別者可以在沒有醫療要求的情況下改變其法定性別。 </p>
          <h2>育嬰假</h2>
          <p>每個孩子 480 天，其中 90 天為每位家長（「pappamånader」）預留，且不能轉讓。目標：父母雙方都待在家裡。在瑞典，孩子的第一個生日通常由兩個稍微疲倦的成年人慶祝，而不是一個。 </p>
          <h2>家庭責任</h2>
          <p>在瑞典，烹飪、清潔、兒童保育和家庭管理等工作並不存在性別歧視——至少在官方上是如此。調查顯示，這是花在家務事上的時間最平等的國家。 （統計數字就像青少年一樣，會說謊。）</p>
          <h2>女性與工作</h2>
          <p>女性勞動參與率位居世界前列（約 80%）。性別薪資差距是真實存在的（~10-12%），但正在縮小。孕產婦死亡率位居世界最低之列。 </p>${ebookFactBox('zh-Hant', null, '同性婚姻：2009 年 · 歧視理由：7 · 育嬰假：480 天 · 每位父母保留：每人 90 天。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>متساويون في القانون</h2>
          <p>يحمي قانون التمييز (<em>diskrimineringslagen</em>، 2008) من التمييز على سبعة أسس: الجنس، والهوية الجنسية أو التعبير، والانتماء العرقي، والدين أو المعتقد، والإعاقة، والتوجه الجنسي، والعمر. وينطبق ذلك على العمل والتعليم والرعاية الصحية والإسكان والخدمات العامة.</p>
          <h2>زواج المثليين وعائلات قوس قزح</h2>
          <p>أصبح زواج المثليين قانونيًا منذ عام 2009. ويمكن للأزواج من نفس الجنس تبني علاج الخصوبة والحصول عليه على قدم المساواة. يجوز للأشخاص المتحولين جنسيًا تغيير جنسهم القانوني دون متطلبات طبية.</p>
          <h2>إجازة الوالدين</h2>
          <p>480 يومًا لكل طفل، منها 90 يومًا محجوزة لكل من الوالدين ("pappamånader") ولا يمكن نقلها. الهدف: يبقى كلا الوالدين في المنزل. عادةً ما يتم الاحتفال بعيد الميلاد الأول للطفل في السويد من قبل شخصين بالغين متعبين قليلاً، وليس شخصًا واحدًا.</p>
          <h2>المسؤوليات المنزلية</h2>
          <p>لا تعتبر مهام الطبخ والتنظيف ورعاية الأطفال وإدارة المنزل من المهام المرتبطة بنوع الجنس في السويد - على الأقل ليس رسميًا. تظهر الدراسات الاستقصائية أن هذا هو البلد الذي يتمتع بأكبر قدر من المساواة في الوقت الذي يقضيه في الأعمال المنزلية. (الإحصائيات، مثل المراهقين، تكذب قليلاً.)</p>
          <h2>المرأة والعمل</h2>
          <p>تعد مشاركة المرأة في القوى العاملة من بين أعلى المعدلات في العالم (~ 80%). الفجوة في الأجور بين الجنسين حقيقية (حوالي 10-12%) ولكنها آخذة في التقلص. معدل وفيات الأمهات هو من بين أدنى المعدلات في العالم.</p>${ebookFactBox('ar', null, 'زواج المثليين: 2009 · أسباب التمييز: 7 · إجازة الوالدين: 480 يومًا · محفوظة لكل والد: 90 يومًا لكل منهما.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>یەکسان لە یاسادا</h2>
          <p>یاسای جیاکاری (<em>diskrimineringslagen</em>, 2008) لە جیاکاری دەپارێزێت لەسەر حەوت هۆکار: ڕەگەز، ناسنامە یان دەربڕینی ڕەگەزی، نەتەوە، ئایین یان باوەڕ، کەمئەندامی، ئاراستەی سێکسی و تەمەن. لە کار، پەروەردە، چاودێری تەندروستی، خانووبەرە و خزمەتگوزارییە گشتیەکاندا بەکاردێت.</p>
          <h2>هاوسەرگیری هاوڕەگەزبازان و خێزانە کەوانەییەکان</h2>
          <p>هاوسەرگیری هاوڕەگەزبازان لە ساڵی ٢٠٠٩ەوە یاساییە. هاوسەرە هاوڕەگەزەکان دەتوانن بە مەرجی یەکسان چارەسەری منداڵبوون وەربگرن و دەستیان پێ بگات. ڕەنگە کەسانی ڕەگەزگۆڕاو بەبێ مەرجی پزیشکی ڕەگەزی یاسایی خۆیان بگۆڕن.</p>
          <h2>مۆڵەتی دایک و باوک</h2>
          <p>480 ڕۆژ بۆ هەر منداڵێک، کە 90 ڕۆژ بۆ هەر دایک و باوکێک ("پاپاماندەر") تەرخانکراوە و ناتوانرێت بگوازرێتەوە. ئامانج: هەردوو دایک و باوک لە ماڵەوە بمێننەوە. یەکەمین ساڵیادی لەدایک بوونی منداڵ لە سوید بەزۆری دوو کەسی پێگەیشتوو کە کەمێک ماندوو دەبن، نەک یەکێک.</p>
          <h2>بەرپرسیارێتی ماڵەوە</h2>
          <p>چێشت لێنان، پاککردنەوە، چاودێری منداڵان و بەڕێوەبەری ماڵ لە سوید ئەرکی ڕەگەزی نین — لانیکەم بە فەرمی نا. ڕاپرسییەکان دەریدەخەن کە ئەمە ئەو وڵاتەیە کە زۆرترین کات بە یەکسانی بۆ کارەکانی ماڵەوە بەسەر دەبات. (ئامار وەک هەرزەکاران کەمێک درۆ دەکات.)</p>
          <h2>ژن و کار</h2>
          <p>بەشداری ژنان لە هێزی کاردا لە بەرزترین ئاستی جیهاندایە (~80%). جیاوازی مووچەی ڕەگەزی ڕاستەقینە (~10-12%) بەڵام بچووک دەبێتەوە. ڕێژەی مردنی دایکان لە کەمترین ئاستی جیهاندایە.</p>${ebookFactBox('ckb', null, 'هاوسەرگیری هاوڕەگەزبازان: ٢٠٠٩ · هۆکاری جیاکاری: ٧ · مۆڵەتی دایک و باوک: ٤٨٠ ڕۆژ · تەرخانکراوە بۆ هەر دایک و باوکێک: هەر دایک و باوکێک ٩٠ ڕۆژ.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2> برابر قانون</h2>
          <p>قانون تبعیض (<em>diskrimineringslagen</em>، 2008) در برابر تبعیض به هفت دلیل محافظت می کند: جنسیت، هویت یا بیان جنسیتی، قومیت، مذهب یا اعتقاد، ناتوانی، گرایش جنسی و سن. این در کار، آموزش، مراقبت های بهداشتی، مسکن و خدمات عمومی کاربرد دارد.</p>
          <h2>ازدواج همجنس گرایان و خانواده های رنگین کمانی</h2>
          <p>از سال 2009 ازدواج همجنس‌گرایان قانونی شده است. زوج‌های همجنس ممکن است با شرایط مساوی از درمان باروری استفاده کنند. افراد تراجنسیتی ممکن است بدون نیازهای پزشکی جنسیت قانونی خود را تغییر دهند.</p>
          <h2>مرخصی والدین</h2>
          <p>480 روز برای هر فرزند، که 90 روز آن برای هر یک از والدین ("pappamånader") رزرو شده است و قابل انتقال نیست. هدف: هر دو والدین در خانه بمانند. اولین تولد یک کودک در سوئد معمولا توسط دو بزرگسال کمی خسته جشن گرفته می شود، نه یک نفر.</p>
          <h2>مسئولیت های خانگی</h2>
          <p>آشپزی، نظافت، مراقبت از کودکان، و سرپرست خانواده وظایف جنسیتی در سوئد نیستند - حداقل به طور رسمی. نظرسنجی ها نشان می دهد که این کشوری است که بیشترین زمان را برای کارهای خانه سپری می کند. (آمار مانند نوجوانان کمی دروغ می گوید.)</p>
          <h2>زنان و کار</h2>
          <p>مشارکت زنان در نیروی کار در میان بالاترین میزان (~80%) در جهان است. شکاف دستمزد جنسیتی واقعی است (~10-12٪) اما در حال کاهش است. مرگ و میر مادران در میان کمترین میزان مرگ و میر در جهان است.</p>${ebookFactBox('fa', null, 'ازدواج همجنس گرایان: 2009 · دلایل تبعیض: 7 · مرخصی والدین: 480 روز · رزرو شده برای هر والدین: هر کدام 90 روز.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Równi pod względem prawnym</h2>
          <p>Ustawa o dyskryminacji (<em>diskrimineringslagen</em>, 2008) chroni przed dyskryminacją z siedmiu powodów: płeć, tożsamość lub ekspresja płciowa, pochodzenie etniczne, religia lub przekonania, niepełnosprawność, orientacja seksualna i wiek. Ma zastosowanie w pracy, edukacji, opiece zdrowotnej, mieszkalnictwie i usługach publicznych.</p>
          <h2>Małżeństwa osób tej samej płci i rodziny tęczowe</h2>
          <p>Małżeństwa osób tej samej płci są legalne od 2009 roku. Pary tej samej płci mogą podejmować leczenie niepłodności i korzystać z niego na równych warunkach. Osoby transpłciowe mogą zmienić swoją płeć prawną bez wymagań medycznych.</p>
          <h2>Urlop rodzicielski</h2>
          <p>480 dni na dziecko, z czego 90 dni jest zarezerwowanych dla każdego z rodziców („pappamånader”) i nie można go przenieść. Cel: oboje rodzice zostają w domu. Pierwsze urodziny dziecka w Szwecji świętują zazwyczaj dwie nieco zmęczone osoby dorosłe, a nie jedna.</p>
          <h2>Obowiązki domowe</h2>
          <p>Gotowanie, sprzątanie, opieka nad dziećmi i prowadzenie domu nie są w Szwecji zadaniami uwarunkowanymi płcią — przynajmniej nie oficjalnie. Badania pokazują, że jest to kraj, w którym najwięcej czasu spędza się na pracach domowych. (Statystyki, podobnie jak nastolatki, trochę kłamią.)</p>
          <h2>Kobiety i praca</h2>
          <p>Udział kobiet w rynku pracy należy do najwyższych na świecie (~80%). Różnica w wynagrodzeniach kobiet i mężczyzn jest realna (~10–12%), ale maleje. Śmiertelność matek należy do najniższych na świecie.</p>${ebookFactBox('pl', null, 'Małżeństwa osób tej samej płci: 2009 · Podstawy dyskryminacji: 7 · Urlop rodzicielski: 480 dni · Zarezerwowany dla każdego rodzica: 90 dni.', ['uhrStudyMaterial'])}
        `,
        so: `
          <h2>Sharciga oo siman</h2>
          <p>Xeerka Takoorka (<em>diskrimineringslagen</em>, 2008) waxa ay ka ilaalisaa takoorka todobada arrimood: lab ama dhedig, aqoonsiga lab ama dhedig, qoomiyadda, diinta ama caqiidada, naafanimada, nooca galmada, iyo da'da. Waxay qusaysaa shaqada, waxbarashada, daryeelka caafimaadka, guriyeynta, iyo adeegyada guud.</p>
          <h2>Guurka isku jinsiga ah iyo qoysaska qaanso roobaadka</h2>
          <p>Guurka dadka isku jinsiga ah ayaa sharci ahaa ilaa 2009. Lammaanaha isku jinsiga ah ayaa laga yaabaa inay qaataan oo ay helaan daaweyn bacrin ah si isku mid ah. Dadka transgender-ka ah ayaa laga yaabaa inay beddelaan jinsigooda sharciga ah iyada oo aan loo baahnayn shuruudo caafimaad.</p>
          <h2>Fasaxa waalidka</h2>
          <p>480 maalmood ilmo kasta, kuwaas oo 90 ka mid ah loo qoondeeyay waalid kasta ("pappamånader") oo aan la wareejin karin. Ujeedada: labada waalidba waxay joogaan guriga. Dhalashada koowaad ee ilmaha Iswiidhan waxaa inta badan xusa labo qaangaar ah oo xoogaa daalan, midna ma xuso.</p>
          <h2>Waajibaadka qoyska</h2>
          <p>Cunto karinta, nadiifinta, daryeelka carruurta, iyo maamulka gurigu maaha hawlo jinsi ahaaneed gudaha Iswiidhan - ugu yaraan si rasmi ah uma aha. Baaritaano la sameeyay ayaa muujinaya in kani yahay dalka ugu badan ee waqti isku mid ah lagu bixiyo shaqada guriga. (Tirakoobyada, sida dhalinyarada, been yar.)</p>
          <h2>Haweenka iyo shaqada</h2>
          <p>Ka-qaybgalka xoog-shaqaale ee haweenka ayaa ka mid ah kuwa ugu sarreeya adduunka (~80%). Farqiga mushaharka jinsiga waa dhab (~ 10-12%) laakiin wuu sii yaraanayaa. Dhimashada hooyadu waxay ka mid tahay kuwa ugu hooseeya adduunka.</p>
          ${ebookFactBox('so', null, 'Guurka dadka isku jinsiga ah: 2009 · Sababaha takoorka: 7 · Fasaxa waalidka: 480 maalmood · Waalidkiiba waxa loo hayaa: 90 maalmood midkiiba.', ['uhrStudyMaterial'])}

        `,
        ti: `<h2>ብሕጊ ማዕረ</h2>
          <p>ሕጊ ኣድልዎ (<em>diskrimineringslagen</em>, 2008) ብሸውዓተ ምኽንያታት ካብ ኣድልዎ ይከላኸል፡ ጾታ፡ ጾታዊ መንነት ወይ መግለጺ፡ ብሄር፡ ሃይማኖት ወይ እምነት፡ ስንክልና፡ ጾታዊ ዝንባለ፡ ከምኡ’ውን ዕድመ። ኣብ ስራሕ፡ ትምህርቲ፡ ክንክን ጥዕና፡ ኣባይትን ህዝባዊ ኣገልግሎታትን ይምልከት።</p>
          <h2>መውስቦ ተመሳሳሊ ጾታን ቀስተ ደመና ስድራቤታትን</h2>
          <p>መውስቦ ተመሳሳሊ ጾታ ካብ 2009 ጀሚሩ ሕጋዊ ኮይኑ ኣሎ።ተመሳሳሊ ጾታ ዘለዎም መጻምድቲ ብማዕረ ውዕል ፍርያምነት ሕክምና ክወስዱን ክረኽቡን ይኽእሉ። ትራንስጀንደር ሰባት ብዘይ ሕክምናዊ ጠለባት ሕጋዊ ጾታኦም ክቕይሩ ይኽእሉ እዮም።</p>
          <h2>ናይ ወለዲ ዕረፍቲ</h2>
          <p>ንሓደ ቆልዓ 480 መዓልታት፣ ካብዚኦም እተን 90 ንነፍሲ ወከፍ ወላዲ (እቲ "ፓፓማናደር") ዝተሓዝኣ ኮይነን ክሰጋገራ ኣይክእላን እየን። እቲ ዕላማ፡ ክልቲኦም ወለዲ ኣብ ገዛ ይጸንሑ። ኣብ ሽወደን ናይ ሓደ ቆልዓ ናይ መጀመርታ ዕለተ ልደት መብዛሕትኡ ግዜ ብሓደ ዘይኮነስ ብኽልተ ቁሩብ ዝደኸሙ ዓበይቲ ሰባት እዩ ዘብዕል።</p>
          <h2>ሓላፍነት ገዛ</h2>
          <p>ምብሳል፡ ምጽራይ፡ ምእላይ ህጻናት፡ ከምኡ’ውን ኣድሚን ገዛ ኣብ ሽወደን ጾታዊ ዕማማት ኣይኮኑን — እንተወሓደ ብወግዒ ኣይኮነን። መጽናዕትታት ከም ዘመልክትዎ፡ እዚኣ ኣብ ዕዮ ገዛ ዝበዝሐ ማዕረ ግዜ እተሕልፍ ሃገር እያ። (ስታቲስቲክስ ከም መንእሰያት ቁሩብ ይሕሱ።)</p>
          <h2>ደቂ ኣንስትዮን ስራሕን</h2>
          <p>ተሳትፎ ደቂ ኣንስትዮ ኣብ ሓይሊ ዕዮ ካብቶም ዝለዓሉ (~80%) እዩ። ናይ ጾታ ደሞዝ ክፍተት ሓቀኛ (~10–12%) ኮይኑ ግን ይንኪ ኣሎ። ሞት ኣዴታት ኣብ ዓለም ካብቶም ዝተሓተ እዩ።</p>${ebookFactBox('ti', null, 'መውስቦ ተመሳሳሊ ጾታ፡ 2009 · ምኽንያት ኣድልዎ፡ 7 · ናይ ወለዲ ዕረፍቲ፡ 480 መዓልታት · ንነፍሲ ​​ወከፍ ወላዲ ዝተሓዝአ፡ ነፍሲ ወከፎም 90 መዓልታት።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Kanunen eşittir</h2>
          <p>Ayrımcılık Yasası (<em>diskrimineringslagen</em>, 2008) yedi temele dayalı ayrımcılığa karşı koruma sağlar: cinsiyet, cinsel kimlik veya ifade, etnik köken, din veya inanç, engellilik, cinsel yönelim ve yaş. İş, eğitim, sağlık, barınma ve kamu hizmetlerinde geçerlidir.</p>
          <h2>Eşcinsel evlilik ve gökkuşağı aileleri</h2>
          <p>Eşcinsel evlilik 2009'dan beri yasaldır. Eşcinsel çiftler eşit şartlarda doğurganlık tedavisini benimseyebilir ve bu tedaviye erişebilir. Trans bireyler, tıbbi gereklilikler olmaksızın yasal cinsiyetlerini değiştirebilir.</p>
          <h2>Ebeveynlik izni</h2>
          <p>Çocuk başına 480 gün; bunun 90 günü her ebeveyne ("pappamånader") ayrılır ve devredilemez. Amaç: Her iki ebeveynin de evde kalması. İsveç'te bir çocuğun ilk doğum günü genellikle bir değil, biraz yorgun iki yetişkin tarafından kutlanır.</p>
          <h2>Ev sorumlulukları</h2>
          <p>Yemek yapma, temizlik, çocuk bakımı ve ev idaresi İsveç'te cinsiyete dayalı görevler değil; en azından resmi olarak. Anketler, ev işlerine en eşit zamanın harcandığı ülkenin bu ülke olduğunu gösteriyor. (İstatistikler de gençler gibi biraz yalan söyler.)</p>
          <h2>Kadınlar ve iş</h2>
          <p>Kadınların işgücüne katılımı dünyadaki en yüksek oranlar arasındadır (~%80). Cinsiyetler arası ücret farkı gerçektir (~%10-12) ancak daralmaktadır. Anne ölüm oranı dünyadaki en düşük oranlar arasında yer alıyor.</p>${ebookFactBox('tr', null, 'Eşcinsel evlilik: 2009 · Ayrımcılık gerekçeleri: 7 · Ebeveyn izni: 480 gün · Ebeveyn başına ayrılmıştır: her biri 90 gün.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Рівні перед законом</h2>
          <p>Закон про дискримінацію (<em>diskrimineringslagen</em>, 2008) захищає від дискримінації за семи ознаками: стать, гендерна приналежність або самовираження, етнічна приналежність, релігія або переконання, інвалідність, сексуальна орієнтація та вік. Це стосується роботи, освіти, охорони здоров’я, житла та комунальних послуг.</p>
          <h2>Одностатеві шлюби та райдужні сім’ї</h2>
          <p>Одностатеві шлюби легалізовані з 2009 року. Одностатеві пари можуть усиновлювати дитину та мати доступ до лікування безпліддя на рівних умовах. Трансгендери можуть змінити свою юридичну стать без медичних вимог.</p>
          <h2>Батьківська відпустка</h2>
          <p>480 днів на дитину, з яких 90 зарезервовані для кожного з батьків ("pappamånader") і не можуть бути передані. Мета: обоє батьків залишаються вдома. Перший день народження дитини в Швеції зазвичай святкують двоє трохи втомлених дорослих, а не один.</p>
          <h2>Домашні обов'язки</h2>
          <p>Приготування їжі, прибирання, догляд за дітьми та адміністрування домашнього господарства не є гендерними завданнями у Швеції — принаймні офіційно. Опитування показують, що це країна, де найбільше часу витрачається на роботу по дому. (Статистика, як підлітки, трохи бреше.)</p>
          <h2>Жінки та робота</h2>
          <p>Рівень участі жінок у робочій силі є одним із найвищих у світі (~80%). Гендерний розрив в оплаті праці є реальним (~10–12%), але він скорочується. Материнська смертність є однією з найнижчих у світі.</p>${ebookFactBox('uk', null, 'Одностатеві шлюби: 2009 · Причини дискримінації: 7 · Відпустка по догляду за дитиною: 480 днів · Зарезервовано для кожного з батьків: 90 днів.', ['uhrStudyMaterial'])}
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
        'zh-Hans': `<h2>学校</h2>
          <p>义务教育 (<em>grundskolan</em>) 为期十年，从 6 岁 (förskoleklass) 到 9 年级。此后，三年高中（<em>体育馆</em>）——学术或职业课程，均为免费。公民、欧盟/欧洲经济区居民以及拥有瑞典居留许可的人也可以免费上大学。</p>
          <p>《教育法》保证平等的教育机会，无论背景、性别或居住地如何。存在私立和“免费”学校 (<em>friskolor</em>)，但不收取学费。</p>
          <h2>医疗保健</h2>
          <p>医疗保健大部分由税收资助，并在地区层面（21 个地区）运行。每次看医生只需支付少量费用（通常为 100-400 瑞典克朗），处方药和住院费用每年都有上限（<em>högkostnadsskydd</em>）。儿童医疗保健是免费的。</p>
          <p>1177是国家卫生健康热线和网站。日常护理通过您的<em>vårdcentral</em>进行；通过<em>akutmottagning</em>处理紧急情况；存在精神和牙科护理，但收费规则不同。</p>
          <h2>老年护理</h2>
          <p>市政府负责老年人护理——家庭帮助 (<em>hemtjänst</em>)、特殊住宿和紧急警报。原则是尽可能长时间独立生活的权利；各市政府的做法参差不齐。</p>
          <h2>社会服务</h2>
          <p>Socialtjänsten 支持任何无法养活自己的人 - 经济援助 (försörjningsstöd)、儿童福利、毒瘾支持、家庭帮助。他们还有法律义务在儿童面临危险时进行干预。</p>${ebookFactBox('zh-Hans', null, '义务教育：10 年（förskoleklass + 1-9 年级） · 健康热线：1177 · 地区数量：21 · 大学学费：居民免费。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>学校</h2>
          <p>义务教育 (<em>grundskolan</em>) 为期十年，从 6 岁 (förskoleklass) 到 9 年级。此后，三年高中（<em>体育馆</em>）——学术或职业课程，均为免费。公民、欧盟/欧洲经济区居民以及拥有瑞典居留许可的人也可以免费上大学。 </p>
          <p>《教育法》保证平等的教育机会，无论背景、性别或居住地如何。存在私立和“免费”学校 (<em>friskolor</em>)，但不收取学费。 </p>
          <h2>医疗保健</h2>
          <p>医疗保健大部分由税收资助，并在地区层面（21 个地区）运行。每次看醫生只需支付少量費用（通常為 100-400 瑞典克朗），處方藥和住院費用每年都有上限（<em>högkostnadsskydd</em>）。儿童医疗保健是免费的。 </p>
          <p>1177是国家卫生健康热线和网站。日常護理透過您的<em>vårdcentral</em>進行；透過<em>akutmottagning</em>處理緊急情況；存在精神和牙科護理，但收費規則不同。 </p>
          <h2>老年护理</h2>
          <p>市政府负责老年人护理——家庭帮助 (<em>hemtjänst</em>)、特殊住宿和紧急警报。原则是尽可能长时间独立生活的权利；各市政府的做法参差不齐。 </p>
          <h2>社会服务</h2>
          <p>Socialtjänsten 支持任何无法养活自己的人 - 经济援助 (försörjningsstöd)、儿童福利、毒瘾支持、家庭帮助。他们还有法律义务在儿童面临危险时进行干预。 </p>${ebookFactBox('zh-Hant', null, '義務教育：10 年（förskoleklass + 1-9 年級） · 健康熱線：1177 · 地區數量：21 · 大學學費：居民免費。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>المدرسة</h2>
          <p>مدة المدرسة الأساسية (<em>grundskolan</em>) هي عشر سنوات، من سن 6 (förskoleklass) حتى الصف التاسع. بعد ذلك، ثلاث سنوات من الدراسة الثانوية العليا (<em>صالة للألعاب الرياضية</em>) — وهي مسارات أكاديمية أو مهنية، وكلاهما مجاني. الجامعة مجانية أيضًا للمواطنين والمقيمين في الاتحاد الأوروبي/المنطقة الاقتصادية الأوروبية والأشخاص الذين يحملون تصريح إقامة سويدي.</p>
          <p>يضمن قانون التعليم المساواة في الوصول بغض النظر عن الخلفية أو الجنس أو المكان الذي تعيش فيه. توجد مدارس خاصة و"مجانية" (<em>friskolor</em>) ولكن لا يمكنها فرض رسوم دراسية.</p>
          <h2>الرعاية الصحية</h2>
          <p>يتم تمويل الرعاية الصحية في الغالب من الضرائب ويتم تشغيلها على المستوى الإقليمي (21 منطقة). أنت تدفع رسومًا بسيطة (عادةً 100-400 كرونة سويدية) لكل زيارة للطبيب، ويتم وضع حد أقصى على الأدوية الموصوفة ورسوم المستشفى سنويًا (<em>högkostnadsskydd</em>). الرعاية الصحية للأطفال مجانية.</p>
          <p>1177 هو الخط الساخن الوطني للصحة والموقع الإلكتروني. تتم الرعاية الروتينية من خلال <em>vårdcentral</em> الخاص بك؛ حالات الطوارئ من خلال <em>akutmottagning</em>؛ توجد رعاية نفسية ورعاية أسنان ولكن بقواعد رسوم مختلفة.</p>
          <h2>رعاية المسنين</h2>
          <p>تدير البلدية رعاية المسنين — المساعدة المنزلية (<em>hemtjänst</em>)، والإقامة الخاصة، وأجهزة إنذار الطوارئ. المبدأ هو الحق في العيش المستقل لأطول فترة ممكنة؛ هذه الممارسة متفاوتة من قبل البلدية.</p>
          <h2>الخدمات الاجتماعية</h2>
          <p>يدعم Socialtjänsten أي شخص غير قادر على إعالة نفسه - المساعدة المالية (försörjningsstöd)، رعاية الأطفال، دعم الإدمان، مساعدة الأسرة. كما أن لديهم أيضًا التزامات قانونية بالتدخل عندما يكون الطفل معرضًا للخطر.</p>${ebookFactBox('ar', null, 'المدرسة الإلزامية: 10 سنوات (förskoleklass + الصفوف 1-9) · الخط الساخن للصحة: ​​1177 · عدد المناطق: 21 · الرسوم الجامعية: مجانية للمقيمين.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>قوتابخانە</h2>
          <p>قوتابخانەی ناچاری (<em>grundskolan</em>) دە ساڵە، لە تەمەنی ٦ ساڵی (förskoleklass) تا پۆلی ٩. دوای ئەوە، سێ ساڵ قۆناغی ناوەندی (<em>لەشجوانی</em>) — ڕێڕەوی ئەکادیمی یان پیشەیی، هەردووکیان بەخۆڕایی. هەروەها زانکۆ بۆ هاوڵاتیان و دانیشتوانی یەکێتی ئەوروپا/EEA و ئەو کەسانەی کە مۆڵەتی نیشتەجێبوونی سویدییان هەیە بەخۆڕاییە.</p>
          <p>یاسای پەروەردە گەرەنتی دەستڕاگەیشتنێکی یەکسان دەکات بەبێ گوێدانە پێشینە، ڕەگەز، یان شوێنی نیشتەجێبوونت. قوتابخانە ئەهلی و "بەخۆڕاییەکان" (<em>friskolor</em>) هەن بەڵام ناتوانن کرێی خوێندن وەربگرن.</p>
          <h2>چاودێری تەندروستی</h2>
          <p>چاودێری تەندروستی زیاتر بە باج دابین دەکرێت و لەسەر ئاستی ناوچەیی (21 هەرێم) بەڕێوەدەچێت. تۆ پارەیەکی کەم دەدەیت (بە شێوەیەکی ئاسایی 100-400 کرۆن) بۆ هەر سەردانێک بۆ لای پزیشک، و دەرمانی ڕەچەتە و کرێی نەخۆشخانە لە ساڵێکدا سنووردار دەکرێت (<em>högkostnadsskydd</em>). چاودێری تەندروستی منداڵان بەخۆڕاییە.</p>
          <p>1177 هێڵی گەرمی تەندروستی نیشتمانی و ماڵپەڕە. چاودێری ڕۆتینی بە <em>vårdcentral</em>ی تۆدا تێدەپەڕێت؛ حاڵەتە فریاگوزاریەکان لە ڕێگەی <em>akutmottagning</em>؛ چاودێری دەروونی و ددان هەیە بەڵام بە یاسای جیاوازی کرێ.</p>
          <h2>چاودێری بەساڵاچووان</h2>
          <p>شارەوانی چاودێری بەساڵاچووان بەڕێوەدەبات — یارمەتی ماڵەوە (<em>hemtjänst</em>)، شوێنی نیشتەجێبوونی تایبەت، و زەنگی فریاگوزاری. پرەنسیپ مافی ژیانی سەربەخۆیە بۆ ماوەیەکی زۆر؛ پراکتیکەکە لەلایەن شارەوانییەوە نایەکسانە.</p>
          <h2>خزمەتگوزاری کۆمەڵایەتی</h2>
          <p>Socialtjänsten پشتگیری هەر کەسێک دەکات کە نەتوانێت خۆی بژیێنێت — یارمەتی دارایی (försörjningsstöd)، خۆشگوزەرانی منداڵان، پشتگیری ئالوودەبوون، یارمەتی خێزان. هەروەها ئەرکی یاسایییان لەسەرە بۆ دەستێوەردان لەو شوێنانەی کە منداڵێک لە مەترسیدایە.</p>${ebookFactBox('ckb', null, 'قوتابخانەی ناچاری: ١٠ ساڵ (förskoleklass + پۆلەکانی ١-٩) · هێڵی گەرمی تەندروستی: ١١٧٧ · ژمارەی ناوچەکان: ٢١ · خوێندنی زانکۆ: بەخۆڕایی بۆ دانیشتووان.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>مدرسه</h2>
          <p>مدرسه اجباری (<em>grundskolan</em>) ده ساله است، از سن 6 سالگی (förskoleklass) تا کلاس نهم. پس از آن، سه سال دوره متوسطه (<em>وزشگاه</em>) - مسیرهای آکادمیک یا حرفه ای، هر دو رایگان. دانشگاه همچنین برای شهروندان، ساکنان اتحادیه اروپا/EEA و افرادی که دارای مجوز اقامت سوئد هستند رایگان است.</p>
          <p>قانون آموزش و پرورش دسترسی برابر را بدون در نظر گرفتن پیشینه، جنسیت یا محل زندگی شما تضمین می کند. مدارس خصوصی و "رایگان" (<em>friskolor</em>) وجود دارند اما نمی توانند شهریه دریافت کنند.</p>
          <h2> مراقبت های بهداشتی</h2>
          <p> مراقبت‌های بهداشتی عمدتاً از طریق مالیات تأمین می‌شود و در سطح منطقه‌ای (21 منطقه) اجرا می‌شود. شما هزینه اندکی (معمولاً 100 تا 400 کرون کرون) در هر بازدید از پزشک می پردازید، و هزینه های داروهای تجویزی و بیمارستان در سال محدود می شود (<em>högkostnadsskydd</em>). مراقبت های بهداشتی کودکان رایگان است.</p>
          <p>1177 خط تلفن و وب سایت ملی سلامت است. مراقبت های معمول از طریق <em>vårdcentral</em> شما انجام می شود. موارد اضطراری از طریق <em>akutmottagning</em>؛ مراقبت های روانی و دندانی وجود دارد اما با قوانین هزینه های متفاوت.</p>
          <h2>مراقبت از سالمندان</h2>
          <p>شهرداری خدمات مراقبت از سالمندان - کمک در منزل (<em>hemtjänst</em>)، اسکان ویژه، و هشدارهای اضطراری را اداره می‌کند. اصل بر حق زندگی مستقل تا زمانی که ممکن است است. این عمل توسط شهرداری ناهموار است.</p>
          <h2>خدمات اجتماعی</h2>
          <p>Socialtjänsten از هر کسی که قادر به تامین مالی نیست حمایت می کند - کمک مالی (försörjningsstöd)، رفاه کودکان، حمایت از اعتیاد، کمک خانواده. آنها همچنین تعهدات قانونی برای مداخله در جایی که کودک در معرض خطر است دارند.</p>${ebookFactBox('fa', null, 'مدرسه اجباری: 10 سال (förskoleklass + کلاس های 1-9) · خط تلفن بهداشتی: 1177 · تعداد مناطق: 21 · شهریه دانشگاه: رایگان برای ساکنان.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Szkoła</h2>
          <p>Szkoła obowiązkowa (<em>grundskolan</em>) trwa dziesięć lat, od 6. roku życia (förskoleklass) do 9. klasy. Następnie trzy lata szkoły średniej II stopnia (<em>gimnazjum</em>) — ścieżki akademickie lub zawodowe, obie bezpłatne. Uniwersytet jest również bezpłatny dla obywateli, mieszkańców UE/EOG i osób posiadających szwedzkie pozwolenie na pobyt.</p>
          <p>Ustawa o edukacji gwarantuje równy dostęp bez względu na pochodzenie, płeć czy miejsce zamieszkania. Istnieją szkoły prywatne i „bezpłatne” (<em>friskolor</em>), ale nie mogą pobierać czesnego.</p>
          <h2>Opieka zdrowotna</h2>
          <p>Opieka zdrowotna jest w większości finansowana z podatków i prowadzona na poziomie regionalnym (21 regionów). Za wizytę u lekarza płacisz niewielką opłatę (zwykle 100–400 SEK), a opłaty za leki na receptę i opłaty szpitalne są ograniczone w skali roku (<em>högkostnadsskydd</em>). Opieka zdrowotna dla dzieci jest bezpłatna.</p>
          <p>1177 to krajowa infolinia i witryna internetowa dotycząca zdrowia. Rutynowa opieka przechodzi przez <em>vårdcentral</em>; sytuacje awaryjne poprzez <em>akutmottagning</em>; istnieje opieka psychiatryczna i stomatologiczna, ale obowiązują inne zasady dotyczące opłat.</p>
          <h2>Opieka nad osobami starszymi</h2>
          <p>Gmina prowadzi opiekę nad osobami starszymi — pomoc domową (<em>hemtjänst</em>), specjalne zakwaterowanie i systemy alarmowe. Zasadą jest prawo do samodzielnego życia tak długo, jak to możliwe; praktyka jest nierówna w poszczególnych gminach.</p>
          <h2>Usługi społeczne</h2>
          <p>Socialtjänsten wspiera każdą osobę, która nie jest w stanie sama się utrzymać – pomoc finansową (försörjningsstöd), opiekę nad dziećmi, wsparcie dla osób uzależnionych, pomoc rodzinną. Mają także prawny obowiązek interweniować, gdy dziecko jest zagrożone.</p>${ebookFactBox('pl', null, 'Szkoła obowiązkowa: 10 lat (förskoleklass + klasy 1–9) · Infolinia zdrowotna: 1177 · Liczba regionów: 21 · Czesne uniwersyteckie: bezpłatne dla mieszkańców.', ['uhrStudyMaterial'])}
        `,
        so: `
          <h2>Dugsiga</h2>
          <p>Dugsiga qasabka ah (<em>grundskolan</em>) waa toban sano, laga bilaabo da'da 6 (förskoleklass) ilaa fasalka 9aad. Intaa ka dib, saddex sano oo dugsiga sare ah<em>jimicsiga</em>) - tacliin ama raadad xirfadeed, labaduba waa bilaash. Jaamacadu sidoo kale waa u bilaash muwaadiniinta, EU/EEA deganayaasha, iyo dadka haysta sharciga degenaanshada Iswiidhan.</p>
          <p>Sharciga waxbarashadu waxa uu dammaanad qaadayaa helitaan siman iyadoon loo eegayn asalka, jinsiga, ama meesha aad ku nooshahay. Dugsiyada gaarka loo leeyahay iyo kuwa "free"<em>friskolor</em>) jira laakiin ma dalaci karo waxbarashada.</p>
          <h2>Daryeelka caafimaadka</h2>
          <p>Daryeelka caafimaadka inta badan waxaa laga bixiyaa canshuur waxayna ku socotaa heer gobol (21 gobol). Waxaad bixisa kharash yar (sida caadiga ah 100-400 SEK) booqasho kasta oo dhakhtar ah, iyo daawooyinka laguu qoro iyo kharashka isbitaalku waa mid xadidan sanadkii (<em>högkostnadsskydd</em>). Daryeelka caafimaadka carruurtu waa bilaash.</p>
          <p>1177 waa khadka caafimaadka qaranka iyo mareegaha. Daryeelka caadiga ah ayaa kuu soo mara<em>vårdcentral</em>; xaaladaha degdega ah iyada oo loo marayo<em>akutmottagning</em>; daryeelka maskaxda iyo ilkaha ayaa jira laakiin leh xeerar ujro kala duwan.</p>
          <h2>Waayeelka</h2>
          <p>Degmadu waxay maamushaa daryeelka waayeelka - caawinta guriga<em>hemtjänst</em>), hoy gaar ah, iyo qaylo-dhaan degdeg ah. Mabda'a ayaa ah xaqa aad u leedahay in aad si madaxbanaan u noolaato ilaa inta suurtogalka ah; dhaqanku waa mid aan sinnayn degmadu.</p>
          <h2>Adeegyada bulshada</h2>
          <p>Socialtjänsten waxa ay taageertaa cid kasta oo aan awoodin in ay is masruufto - kaalmada dhaqaale (försörjningsstöd), daryeelka carruurta, kaalmada balwadda, kaalmada qoyska. Waxa kale oo ay leeyihiin waajibaad sharci ah si ay u soo farageliyaan marka ilmuhu khatar ku jiro.</p>
          ${ebookFactBox('so', null, 'Dugsiga aasaasiga ah: 10 sano (förskoleklass + fasalada 1-9) · Khadka telefoonka ee caafimaadka: 1177 · Tirada gobollada: 21 · Waxbarashada jaamacadda: bilaash ah dadka deggan.', ['uhrStudyMaterial'])}

        `,
        ti: `<h2>ቤት ትምህርቲ</h2>
          <p>ግዴታዊ ቤት ትምህርቲ (<em>grundskolan</em>) ዓሰርተ ዓመት እዩ፣ ካብ 6 ዓመት ዕድመ (förskoleklass) ክሳብ 9ይ ክፍሊ። ብድሕሪኡ፡ ሰለስተ ዓመት ላዕለዋይ ካልኣይ ደረጃ (<em>ጂምናዝየም</em>) — ኣካዳሚያዊ ወይ ሞያዊ ትራክ፡ ክልቲኡ ነጻ። ዩኒቨርሲቲ ንዜጋታት፡ ነበርቲ ሕብረት ኤውሮጳ/ኢ.ኤ.፡ ከምኡ’ውን መንበሪ ፍቓድ ሽወደን ዘለዎም ሰባት’ውን ነጻ እዩ።</p>
          <p>ሕጊ ትምህርቲ ድሕረ ባይታ፡ ጾታ፡ ወይ ትነብረሉ ቦታ ብዘየገድስ ማዕረ ተበጻሕነት ውሕስነት ይህብ። ናይ ብሕቲን "ነጻ" ኣብያተ ትምህርቲ (<em>friskolor</em>) ኣለዋ ግን ክፍሊት ትምህርቲ ክሓታ ኣይክእላን እየን።</p>
          <h2>ክንክን ጥዕና</h2>
          <p>ክንክን ጥዕና መብዛሕትኡ ብግብሪ ዝምወል ኮይኑ ብደረጃ ዞባ (21 ዞባታት) ዝካየድ እዩ። ንሓደ ምብጻሕ ናብ ሓኪም ንእሽቶ ክፍሊት (ብተለምዶ 100–400 ክሮነር) ትኸፍል፣ ብሓኪም ዝተኣዘዙ መድሃኒታትን ክፍሊት ሆስፒታልን ድማ ኣብ ዓመት ደረት ኣለዎ (እቲ <em>högkostnadsskydd</em>)። ክንክን ጥዕና ህጻናት ብነጻ እዩ።</p>
          <p>1177 ሃገራዊ መስመር ቴሌፎንን መርበብ ሓበሬታን ጥዕና እዩ። ስሩዕ ክንክን ብ<em>vårdcentral</em>ኻ ይሓልፍ፤ ህጹጽ ኩነታት ብመንገዲ <em>akutmottagning</em>፤ ናይ ኣእምሮን ስኒን ክንክን ኣሎ ግን ዝተፈላለየ ሕግታት ክፍሊት ኣለዎ።</p>
          <h2>ምሕብሓብ ኣረጋውያን</h2>
          <p>እቲ ኮሙን ክንክን ኣረጋውያን የካይድ — ናይ ገዛ ሓገዝ (<em>hemtjänst</em>)፣ ፍሉይ መንበሪን ህጹጽ መጥፍኢታትን። እቲ መትከል ብዝተኻእለ መጠን ንነዊሕ እዋን ብናጻ ናይ ምንባር መሰል እዩ፤ እቲ ኣሰራርሓ ብኮሙን ዘይምዕሩይ እዩ።</p>
          <h2>ማሕበራዊ ኣገልግሎት</h2>
          <p>Socialtjänsten ንዝኾነ ንነብሱ ክመርሕ ዘይክእል ሰብ ይድግፍ — ገንዘባዊ ሓገዝ (försörjningsstöd)፣ ድሕነት ህጻናት፣ ደገፍ ወልፊ፣ ሓገዝ ስድራቤት። ሓደ ቆልዓ ኣብ ሓደጋ ኣብ ዝወደቐሉ ቦታ ጣልቃ ናይ ምእታው እውን ሕጋዊ ግዴታ ኣለዎም።</p>${ebookFactBox('ti', null, 'ግዴታዊ ቤት ትምህርቲ: 10 ዓመት (förskoleklass + grades 1–9) · መስመር ቴሌፎን ጥዕና: 1177 · ብዝሒ ዞባታት: 21 · ትምህርቲ ዩኒቨርሲቲ: ንነበርቲ ብነጻ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Okul</h2>
          <p>Zorunlu okul (<em>grundskolan</em>), 6 yaşından (förskoleklass) 9. sınıfa kadar on yıldır. Bundan sonra, üç yıllık lise (<em>gymnasium</em>) — akademik veya mesleki bölümler, ikisi de ücretsiz. Üniversite ayrıca vatandaşlar, AB/AEA'da ikamet edenler ve İsveç oturma iznine sahip kişiler için de ücretsizdir.</p>
          <p>Eğitim Yasası, geçmişe, cinsiyete veya yaşadığınız yere bakılmaksızın eşit erişimi garanti eder. Özel ve "ücretsiz" okullar (<em>friskolor</em>) mevcuttur ancak öğrenim ücreti alamazlar.</p>
          <h2>Sağlık</h2>
          <p>Sağlık hizmetleri çoğunlukla vergilerle finanse edilir ve bölgesel düzeyde (21 bölge) yürütülür. Doktor ziyareti başına küçük bir ücret (genellikle 100-400 SEK) ödersiniz ve reçeteli ilaçlar ile hastane ücretleri yıllık olarak sınırlandırılır (<em>högkostnadsskydd</em>). Çocuk sağlığı hizmetleri ücretsizdir.</p>
          <p>1177 ulusal sağlık yardım hattı ve web sitesidir. Rutin bakım <em>vårdcentral</em>'inizden geçer; <em>akutmottagning</em> aracılığıyla acil durumlar; Akıl ve diş sağlığı hizmetleri mevcut ancak ücret kuralları farklı.</p>
          <h2>Yaşlı bakımı</h2>
          <p>Belediye, evde yardım (<em>hemtjänst</em>), özel konaklama ve acil durum alarmları gibi yaşlı bakımı hizmetlerini yürütmektedir. İlke, mümkün olduğu kadar uzun süre bağımsız yaşama hakkıdır; Bu uygulama belediye tarafından eşitsizdir.</p>
          <h2>Sosyal hizmetler</h2>
          <p>Socialtjänsten, maddi yardım (försörjningsstöd), çocuk refahı, bağımlılık desteği, aile yardımı gibi geçimini sağlayamayan herkesi destekliyor. Ayrıca çocuğun risk altında olduğu durumlarda müdahale etme konusunda yasal yükümlülükleri de vardır.</p>${ebookFactBox('tr', null, 'Zorunlu okul: 10 yıl (förskoleklass + 1-9. Sınıflar) · Sağlık hattı: 1177 · Bölge sayısı: 21 · Üniversite eğitimi: sakinler için ücretsiz.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Школа</h2>
          <p>Обов’язкова школа (<em>grundskolan</em>) триває десять років, починаючи з 6 років (förskoleklass) і закінчуючи 9-м класом. Після цього три роки вищої середньої школи (<em>гімназія</em>) — академічні або професійні напрямки, обидва безкоштовні. Університет також є безкоштовним для громадян, резидентів ЄС/ЄЕЗ та людей із посвідкою на проживання у Швеції.</p>
          <p>Закон про освіту гарантує рівний доступ незалежно від походження, статі чи місця проживання. Приватні та «безкоштовні» школи (<em>friskolor</em>) існують, але не можуть стягувати плату за навчання.</p>
          <h2>Охорона здоров'я</h2>
          <p>Охорона здоров'я в основному фінансується з податків і працює на регіональному рівні (21 регіон). Ви платите невелику плату (зазвичай 100–400 шведських крон) за візит до лікаря, а вартість ліків, що відпускаються за рецептом, і госпіталізаційних зборів обмежені на рік (<em>högkostnadsskydd</em>). Оздоровлення дітей безкоштовне.</p>
          <p>1177 – це національна гаряча лінія охорони здоров’я та веб-сайт. Звичайний догляд проходить через ваш <em>vårdcentral</em>; надзвичайні ситуації через <em>akutmottagning</em>; психіатрична та стоматологічна допомога існує, але з іншими правилами оплати.</p>
          <h2>Догляд за людьми похилого віку</h2>
          <p>Мініципалітет забезпечує догляд за людьми похилого віку — допомогу вдома (<em>hemtjänst</em>), спеціальне житло та аварійну сигналізацію. Принцип – право жити самостійно якомога довше; практика неоднакова для муніципалітетів.</p>
          <h2>Соціальні служби</h2>
          <p>Socialtjänsten підтримує всіх, хто не в змозі прогодувати себе — фінансова допомога (försörjningsstöd), допомога дітям, допомога залежним, допомога сім’ї. Вони також мають юридичні зобов’язання втручатися, якщо дитина знаходиться в зоні ризику.</p>${ebookFactBox('uk', null, 'Обов’язкова школа: 10 років (förskoleklass + 1–9 класи) · Гаряча лінія здоров’я: 1177 · Кількість регіонів: 21 · Навчання в університеті: безкоштовне для жителів.', ['uhrStudyMaterial'])}
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
        'zh-Hans': `<h2>公共访问权 (allemansrätten)</h2>
          <p>瑞典的几乎所有土地——森林、田野、海岸——都可以散步、采摘浆果、游泳、觅食、露营（一晚）和安静的享受。这是一种习惯，不是成文法律，但受到认真对待。</p>
          <p>注意事项：<em>“Inte störa，inte förstöra”</em> - 请勿打扰，请勿破坏。您不得进入私人花园或在他人视线范围内搭帐篷。禁火令期间不得生火。您不得出售倒下的木材或采摘受保护的物种。</p>
          <h2>地理</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>瑞典是欧洲第五大国。它的地理混合了森林、湖泊、山脉、农田和漫长的海岸线。最长的河流是 Klarälven–Göta älv（约 720 公里）。最大的湖泊是维纳恩湖。</p>
          <h2>气候和季节</h2>
          <p>四个完整的季节，在北方充满戏剧性。冬天是黑暗的；夏季，午夜太阳位于北极圈上方。气候变化使冬季更加温暖，夏季更加潮湿；政府承诺到 2045 年实现净零排放。</p>
          <h2>回收和日常环境</h2>
          <p>瑞典痴迷于回收利用。玻璃、金属、纸张、塑料、食物垃圾、电池和电子产品都被放入专用垃圾箱，通常位于当地的<em>återvinningscentral</em>。瓶子和罐头退货（<em>裤子</em>）将作为小额现金退款返回。</p>${ebookFactBox('zh-Hans', null, 'Allemansrätten — 公共使用权 · 净零目标年：2045 · 最大的湖泊：Vänern · 景观主题：森林、湖泊、山脉和漫长的海岸线。', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        'zh-Hant': `<h2>公共存取權 (allemansrätten)</h2>
          <p>瑞典的幾乎所有土地——森林、田野、海岸——都可以散步、採摘漿果、游泳、覓食、露營（一晚）和安靜的享受。這是一種習慣，不是成文法律，但受到認真對待。 </p>
          <p>注意事項：<em>「Inte störa，inte förstöra」</em> - 請勿打擾，請勿破壞。您不得進入私人花園或在他人視線範圍內搭帳篷。禁火令期間不得生火。您不得出售倒下的木材或採摘受保護的物種。 </p>
          <h2>地理</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>瑞典是歐洲第五大國。它的地理混合了森林、湖泊、山脈、農田和漫長的海岸線。最長的河流是 Klarälven–Göta älv（約 720 公里）。最大的湖泊是維納恩湖。 </p>
          <h2>氣候和季節</h2>
          <p>四個完整的季節，在北方充滿戲劇性。冬天是黑暗的；夏季，午夜太陽位於北極圈上方。氣候變遷使冬季更加溫暖，夏季更加潮濕；政府承諾在 2045 年實現淨零排放。 </p>
          <h2>回收與日常環境</h2>
          <p>瑞典沉迷於回收。玻璃、金屬、紙張、塑膠、食物垃圾、電池和電子產品都被放入專用垃圾箱，通常位於當地的<em>återvinningscentral</em>。瓶子和罐頭退貨（<em>褲子</em>）將作為小額現金退款返回。 </p>${ebookFactBox('zh-Hant', null, 'Allemansrätten — 公共使用權 · 淨零目標年：2045 · 最大的湖泊：Vänern · 景觀主題：森林、湖泊、山脈和漫長的海岸線。', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ar: `<h2>حق الوصول العام (allemansrätten)</h2>
          <p>إن أي أرض في السويد تقريبًا - الغابات والحقول والشواطئ - مفتوحة للمشي وقطف التوت والسباحة والبحث عن الطعام والتخييم (ليلة واحدة) والاستمتاع الهادئ. وهي عادة وليست قانونًا مكتوبًا، ولكنها تؤخذ على محمل الجد.</p>
          <p>المشكلة: <em>"Inte störa, inte förstöra"</em> — لا تزعج، لا تدمر. لا يجوز لك الدخول إلى الحدائق الخاصة أو نصب خيمة على مرأى من أحد. لا يجوز لك إشعال الحرائق عندما يكون هناك حظر على إشعال النار. لا يجوز لك أخذ الأخشاب المقطوعة للبيع، أو اختيار الأنواع المحمية.</p>
          <h2>الجغرافيا</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>تعد السويد خامس أكبر دولة في أوروبا. تمزج جغرافيتها بين الغابات والبحيرات والجبال والأراضي الزراعية وخط ساحلي طويل. أطول نهر هو Klarälven–Göta älv (حوالي 720 كم). أكبر بحيرة هي فانيرن.</p>
          <h2>المناخ والفصول</h2>
          <p>أربعة مواسم كاملة، درامية في الشمال. الشتاء مظلم. الصيف له شمس منتصف الليل فوق الدائرة القطبية الشمالية. تغير المناخ يجعل الشتاء أكثر دفئا والصيف أكثر رطوبة. وقد التزمت الحكومة بخفض الانبعاثات إلى الصفر بحلول عام 2045.</p>
          <h2>إعادة التدوير والبيئة اليومية</h2>
          <p>تقوم السويد بإعادة التدوير بشكل هوسي. يتم إرسال الزجاج والمعادن والورق والبلاستيك ومخلفات الطعام والبطاريات والإلكترونيات إلى صناديق مخصصة، غالبًا في <em>återvinningscentral</em> المحلي. يتم إرجاع الزجاجة والعلبة (<em>البنطلون</em>) كاسترداد نقدي صغير.</p>${ebookFactBox('ar', null, 'Allemansrätten — حق الوصول العام · العام المستهدف لصافي الصفر: 2045 · أكبر بحيرة: فانيرن · موضوعات المناظر الطبيعية: الغابات والبحيرات والجبال والخط الساحلي الطويل.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ckb: `<h2>مافی دەستڕاگەیشتن بە گشتی (allemansrätten)</h2>
          <p>نزیکەی هەر زەوییەک لە سوید - دارستان، کێڵگە، کەنار - کراوەیە بۆ ڕۆیشتن، هەڵگرتنی توو، مەلەکردن، گەڕان بەدوای خۆراک، کەمپکردن (شەوێک)، و چێژوەرگرتنی بێدەنگ. داب و نەریتە نەک یاسایەکی نووسراو، بەڵام بە جددی وەردەگیرێت.</p>
          <p>گرتنەکە: <em>"Inte störa, inte förstöra"</em> — تێک مەدە، لەناو مەبە. لەوانەیە نەچیتە ناو باخچەی تایبەتەوە یان چادرێک لە چاوی کەسێکدا هەڵنەگریت. لەوانەیە ئاگر نەکەیتەوە کاتێک قەدەغەکردنی ئاگرکەوتنەوە هەیە. لەوانەیە دارە دابەزیوەکان نەبەیت بۆ فرۆشتن، یان جۆرە پارێزراوەکان هەڵنەبژێریت.</p>
          <h2>جوگرافیا</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>سوید پێنجەم گەورەترین وڵاتی ئەوروپایە. جوگرافیاکەی دارستان و دەریاچە و شاخ و زەوی کشتوکاڵی و کەنار دەریایەکی درێژ تێکەڵ دەکات. درێژترین ڕووبار بریتییە لە Klarälven–Göta älv (نزیکەی ٧٢٠ کم). گەورەترین دەریاچە ڤانێرنە.</p>
          <h2>کەشوهەوا و وەرزەکان</h2>
          <p>چوار وەرزی تەواو، لە باکوور دراماتیک. زستان تاریکە؛ هاوین خۆری نیوەشەوی هەیە لە سەرووی بازنەی جەمسەری باکوورەوە. گۆڕانی کەشوهەوا خەریکە زستان گەرمتر و هاوین تەڕتر دەکات؛ حکومەت پابەند بووە بە سفرکردنی دەردانی گازی ژەهراوی تا ساڵی ٢٠٤٥.</p>
          <h2>ریسایکلکردن و ژینگەی ڕۆژانە</h2>
          <p>سوید بە شێوەیەکی وەسوەسەیی ڕیسایکل دەکات. شووشە، کانزا، کاغەز، پلاستیک، پاشماوەی خۆراک، پاتری و ئەلیکترۆنیات هەموویان دەچنە سەبەتەی تایبەت، زۆرجار لە <em>återvinningscentral</em>ی ناوخۆیی. گەڕانەوەی شووشە و دەبە (<em>pant</em>) وەک گەڕانەوەی پارەی کەم دەگەڕێتەوە.</p>${ebookFactBox('ckb', null, 'Allemansrätten — مافی دەستڕاگەیشتن بە گشتی · ساڵی ئامانجی تۆڕ-سفر: 2045 · گەورەترین دەریاچە: Vänern · بابەتەکانی دیمەنی سروشتی: دارستان، دەریاچە، شاخ و کەنار دەریایەکی درێژ.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        fa: `<h2>حق دسترسی عمومی (allemansrätten)</h2>
          <p>تقریباً هر سرزمینی در سوئد - جنگل، مزرعه، ساحل - برای پیاده‌روی، چیدن انواع توت‌ها، شنا کردن، جستجوی غذا، کمپینگ (یک شب) و لذت بردن آرام باز است. این یک عرف است، نه یک قانون مکتوب، اما جدی گرفته می شود.</p>
          <p>گرفتن: <em>"Inte störa, inte förstöra"</em> — مزاحم نشوید، تخریب نکنید. شما نمی توانید وارد باغ های خصوصی شوید یا در نظر کسی چادر بزنید. وقتی ممنوعیت آتش‌سوزی وجود دارد، نمی‌توانید آتش روشن کنید. شما نمی توانید چوب های ریز شده را برای فروش ببرید، یا گونه های حفاظت شده را انتخاب کنید.</p>
          <h2>جغرافیا</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>سوئد پنجمین کشور بزرگ اروپاست. جغرافیای آن جنگل، دریاچه ها، کوه ها، زمین های کشاورزی و یک خط ساحلی طولانی را در هم می آمیزد. طولانی ترین رودخانه Klarälven–Göta älv (حدود 720 کیلومتر) است. بزرگترین دریاچه Vänern است.</p>
          <h2>آب و هوا و فصول</h2>
          <p>چهار فصل کامل، دراماتیک در شمال. زمستان تاریک است؛ تابستان دارای خورشید نیمه شب در بالای دایره قطب شمال است. تغییرات آب و هوایی زمستان ها را گرم تر و تابستان ها را مرطوب تر می کند. دولت متعهد شده است تا سال 2045 انتشار خالص صفر داشته باشد.</p>
          <h2>بازیافت و محیط روزمره</h2>
          <p>سوئد با وسواس بازیافت می کند. شیشه، فلز، کاغذ، پلاستیک، ضایعات مواد غذایی، باتری‌ها و وسایل الکترونیکی همه به سطل‌های اختصاصی، اغلب در <em>återvinningscentral</em> محلی می‌روند. بطری و قوطی (<em>شلوار</em>) به عنوان بازپرداخت نقدی کوچک برمی گردد.</p>${ebookFactBox('fa', null, 'Allemansrätten — حق دسترسی عمومی · سال هدف خالص صفر: 2045 · بزرگترین دریاچه: Vänern · موضوعات چشم انداز: جنگل ها، دریاچه ها، کوه ها و خط ساحلی طولانی.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        pl: `<h2>Prawo publicznego dostępu (allemansrätten)</h2>
          <p>Prawie każdy teren w Szwecji — las, pole, brzeg — jest otwarty na spacery, zbieranie jagód, pływanie, żerowanie, biwakowanie (na jedną noc) i cichą zabawę. Jest to zwyczaj, a nie pisane prawo, ale traktuje się je poważnie.</p>
          <p>Haczyk: <em>„Inte störa, inte förstöra”</em> — nie przeszkadzaj, nie niszcz. Nie wolno wchodzić do prywatnych ogrodów ani rozbijać namiotu na czyimś oczach. Nie wolno rozpalać ognisk, jeżeli obowiązuje zakaz palenia. Nie wolno sprzedawać powalonego drewna ani wybierać gatunków chronionych.</p>
          <h2>Geografia</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Szwecja jest piątym co do wielkości krajem w Europie. Jego położenie geograficzne obejmuje lasy, jeziora, góry, tereny rolne i długą linię brzegową. Najdłuższą rzeką jest Klarälven – Göta älv (około 720 km). Największym jeziorem jest Vänern.</p>
          <h2>Klimat i pory roku</h2>
          <p>Cztery pełne pory roku, dramatyczne na północy. Zima jest ciemna; lato ma słońce polarne nad kołem podbiegunowym. Zmiana klimatu powoduje, że zimy stają się cieplejsze, a lata bardziej wilgotne; rząd zobowiązał się do osiągnięcia zerowej emisji netto do 2045 r.</p>
          <h2>Recykling a środowisko życia codziennego</h2>
          <p>Szwecja obsesyjnie poddaje recyklingowi. Szkło, metal, papier, plastik, odpady spożywcze, baterie i elektronika trafiają do specjalnych pojemników, często w lokalnym <em>återvinningscentral</em>. Zwroty butelek i puszek (<em>spodnie</em>) zwracane są w postaci niewielkiego zwrotu gotówki.</p>${ebookFactBox('pl', null, 'Allemansrätten — prawo publicznego dostępu · Rok docelowy zerowej wartości netto: 2045 · Największe jezioro: Vänern · Motywy krajobrazowe: lasy, jeziora, góry i długa linia brzegowa.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        so: `
          <h2>Xaq u lahaanshaha dadweynaha (allemansrätten)</h2>
          <p>Ku dhawaad ​​dhul kasta oo ku yaal Iswiidhan - kaynta, berrinka, xeebta - waxay u furan tahay socodka, gurashada berry, dabaasha, calafka, xero (hal habeen), iyo raaxaysi deggan. Waa dhaqan ee maaha sharci qoran, laakiin si dhab ah ayaa loo qaataa.</p>
          <p>Qabashada:<em>"Inte störa, inte förstöra"</em>- ha qasin, ha dumin. Ma geli kartid jardiinooyin gaar ah ama aadan teendho ka taagneen qof aragtidiisa. Waxaa laga yaabaa inaadan dab shidin marka ay jirto mamnuucid dab. Ma iibsan kartid alwaax la soo tuuray, ama aadan soo qaadan noocyada la ilaaliyo.</p>
          <h2>Juqraafiga</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Iswiidhan waa dalka shanaad ee ugu weyn Yurub. Juquraafigeedu wuxuu isku daraa kaynta, harooyinka, buuro, dhul beereed, iyo xeeb dheer. Webiga ugu dheer waa Klarälven-Göta älv (qiyaastii 720 km). Harada ugu weyn waa Vänern.</p>
          <h2>Cimilada iyo xilliyada</h2>
          <p>Afar xilli oo buuxa, oo riwaayado ah waqooyiga. Jiilaalku waa madow; xagaaga ayaa qorraxdu saqda dhexe ka sarreeyaa Arctic Circle. Isbeddelka cimiladu waxay keenaysaa in jiilaalka uu sii kululaado, xagaagana uu qoyo; Dawladdu waxay ballan-qaadday in 2045-ka ay sii daayaan saafiga ah eber.</p>
          <h2>Dib u warshadaynta iyo deegaanka maalinlaha ah</h2>
          <p>Iswiidhan waxay dib u warshadaynaysaa si waswaasiil ah. Dhalo, bir, warqad, balaastiig, hadhaaga cuntada, baytariyada, iyo qalabka elektaroonigga ah dhamaantood waxa ay tagaan haamaha loo qoondeeyay, inta badan xaafadda<em>återvinningscentral</em>. Dhalo oo soo noqon karta (<em>surwaal</em>) ku soo noqo lacag yar oo lacag caddaan ah.</p>
          ${ebookFactBox('so', null, 'Allemansrätten — Xuquuqda helitaanka dadweynaha · Sannad-dugsiyeedka eber: 2045 · Harada ugu weyn: Vänern · Mawduucyada muuqaalka: kaymaha, harooyinka, buuraha, iyo xeebta dheer.', ['uhrStudyMaterial', 'scbLandUse'])}

        `,
        ti: `<h2>መሰል ህዝባዊ ምብጻሕ (allemansrätten)</h2>
          <p>ዳርጋ ዝኾነ መሬት ሽወደን — ጫካ፡ ሜዳ፡ ገማግም ባሕሪ — ንእግሪ ምጉዓዝ፡ ፍረታት በርበረ ንምልቃም፡ ንምሕንባስ፡ ንምድላይ መግቢ፡ ንመዓስከር (ሓንቲ ለይቲ)፡ ከምኡ’ውን ህድእ ዝበለ ምዝንጋዕ ክፉት እዩ። ልምዲ እምበር ዝተጻሕፈ ሕጊ ዘይኮነስ ብዕቱብ እዩ ዝውሰድ።</p>
          <p>እቲ ምትሓዝ: <em>"Inte störa, inte förstöra"</em> — ኣይትረበሹ፣ ኣይትጥፍኡ። ኣብ ናይ ብሕቲ ኣታኽልቲ ክትኣቱ ወይ ኣብ ርእሲ ሓደ ሰብ ዳስ ክትተክል ኣይትኽእልን ኢኻ። እገዳ ባርዕ ኣብ ዝህልወሉ እዋን ሓዊ ዘይትወልዕ ትኽእል ኢኻ። ዝወደቐ ዕንጨይቲ ንመሸጣ ክትወስድ ኣይትኽእልን ኢኻ፣ ወይ ድማ ዝተሓለዉ ዓይነታት ክትመርጽ ትኽእል ኢኻ።</p>
          <h2>ጂኦግራፊ</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>ሽወደን ኣብ ኤውሮጳ ኣብ 5ይ ደረጃ ትርከብ። ጂኦግራፊኣ ጫካታት፡ ቀላያት፡ ኣኽራን፡ ሕርሻዊ መሬትን ነዊሕ ገማግም ባሕርን ዝሓዋወሰ እዩ። እቲ ዝነውሐ ሩባ ክላራልቨን–ጎታ älv (ኣስታት 720 ኪ.ሜ) እዩ። እቲ ዝዓበየ ቀላይ ቫነርን እዩ።</p>
          <h2>ክሊማን ወቕትታትን</h2>
          <p>ኣርባዕተ ምሉእ ወቕትታት፡ ኣብ ሰሜን ድራማዊ። ክረምቲ ጸልማት እዩ፤ ሓጋይ ኣብ ልዕሊ ዓንኬል ኣርክቲክ ፍርቂ ለይቲ ጸሓይ ኣለዎ። ለውጢ ክሊማ ክረምቲ ውዑይን ሓጋይ ዝረግፍን ይገብሮ ኣሎ፤ መንግስቲ ክሳብ 2045 ጽሩይ ዜሮ ልቀት ልቀት ክገብር ቃል ኣትዩ ኣሎ።</p>
          <h2>ዳግመ-ምጥቃምን መዓልታዊ ሃዋህውን</h2>
          <p>ሽወደን ብውጥረት ዳግማይ ትጥቀመሉ። ብርጭቆ፡ ብረት፡ ወረቐት፡ ፕላስቲክ፡ ጎሓፍ መግቢ፡ ባትሪን ኤሌክትሮኒክስን ኩሎም ናብ ውፉያት መትሓዚታት ይኸዱ፡ መብዛሕትኡ ግዜ ኣብቲ ከባቢ <em>återvinningscentral</em>። ናይ ጥርሙዝን ቆርቆሮን ምምላስ (<em>pant</em>) ከም ንእሽቶ ናይ ገንዘብ ምምላስ ይምለስ።</p>${ebookFactBox('ti', null, 'Allemansrätten — መሰል ህዝባዊ ምብጻሕ · ጽሩይ-ዜሮ ዕላማ ዓመት: 2045 · ዝዓበየ ቀላይ: Vänern · ቴማታት መልክዓ ምድሪ: ኣግራብ: ቀላያት: ኣኽራናት: ከምኡውን ነዊሕ ገማግም ባሕሪ።', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        tr: `<h2>Kamusal erişim hakkı (allemansrätten)</h2>
          <p>İsveç'teki hemen hemen her arazi (orman, tarla, kıyı) yürüyüşe, böğürtlen toplamaya, yüzmeye, yiyecek aramaya, kamp yapmaya (bir gece) ve sessiz eğlenceye açıktır. Bu yazılı bir yasa değil, bir gelenektir ancak ciddiye alınır.</p>
          <p>Yararlı nokta: <em>"Inte störa, inte förstöra"</em> — rahatsız etmeyin, yok etmeyin. Özel bahçelere giremezsiniz, başkalarının görüş alanında çadır kuramazsınız. Ateş yasağı varken ateş yakamazsınız. Kesilen ahşabı satışa çıkaramaz veya koruma altındaki türleri seçemezsiniz.</p>
          <h2>Coğrafya</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>İsveç, Avrupa'nın beşinci büyük ülkesidir. Coğrafyası ormanlar, göller, dağlar, tarım arazileri ve uzun bir kıyı şeridinden oluşmaktadır. En uzun nehir Klarälven-Götaälv'dir (yaklaşık 720 km). En büyük göl Vänern'dir.</p>
          <h2>İklim ve mevsimler</h2>
          <p>Kuzeyde dramatik dört mevsim. Kış karanlıktır; yaz aylarında Kuzey Kutup Dairesi üzerinde gece yarısı güneşi görülür. İklim değişikliği kışları daha sıcak, yazları daha yağışlı hale getiriyor; hükümet 2045 yılına kadar net sıfır emisyon taahhüt etti.</p>
          <h2>Geri dönüşüm ve günlük ortam</h2>
          <p>İsveç takıntılı bir şekilde geri dönüşüm yapıyor. Cam, metal, kağıt, plastik, yiyecek atıkları, piller ve elektronik eşyaların tümü genellikle yerel <em>återvinningscentral</em>'deki özel çöp kutularına atılıyor. Şişe ve kutu iadeleri (<em>pantolon</em>) küçük bir nakit para iadesi olarak geri gelir.</p>${ebookFactBox('tr', null, 'Allemansrätten — kamu erişim hakkı · Net sıfır hedef yılı: 2045 · En büyük göl: Vänern · Peyzaj temaları: ormanlar, göller, dağlar ve uzun bir kıyı şeridi.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        uk: `<h2>Право публічного доступу (allemansrätten)</h2>
          <p>Майже будь-яка земля в Швеції — ліс, поле, узбережжя — відкрита для прогулянок, збору ягід, купання, пошуку їжі, кемпінгу (на одну ніч) і тихих насолод. Це звичай, а не писаний закон, але до нього ставляться серйозно.</p>
          <p>Заковика: <em>"Inte störa, inte förstöra"</em> — не заважай, не руйнуй. Не можна заходити в приватні сади або розбивати намет на очах у когось. Не можна розпалювати багаття, коли діє заборона на вогонь. Ви не можете брати зрубану деревину на продаж або збирати охоронювані види.</p>
          <h2>Географія</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Швеція є п'ятою за величиною країною в Європі. Його географія поєднує ліси, озера, гори, сільськогосподарські угіддя та довгу берегову лінію. Найдовша річка — Кларалвен–Ґота Ельв (близько 720 км). Найбільше озеро Венерн.</p>
          <h2>Клімат і пори року</h2>
          <p>Чотири повні сезони, драматичні на півночі. Зима темна; літо опівнічне сонце над полярним колом. Зміна клімату робить зиму теплішою, а літо вологішим; уряд зобов’язався звести до 2045 року нульові викиди.</p>
          <h2>Переробка та повсякденне середовище</h2>
          <p>Швеція одержимо переробляє. Скло, метал, папір, пластик, харчові відходи, батареї та електроніка – усе це викидається до спеціальних контейнерів, часто в місцевому <em>återvinningscentral</em>. Повернення пляшок і банок (<em>труни</em>) повертаються як невелике відшкодування готівкою.</p>${ebookFactBox('uk', null, 'Allemansrätten — право публічного доступу · Цільовий рік чистого нуля: 2045 · Найбільше озеро: Венерн · Теми ландшафту: ліси, озера, гори та довга берегова лінія.', ['uhrStudyMaterial', 'scbLandUse'])}
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
        'zh-Hans': `<h2>四大</h2>
          <ul>
            <li><b>仲夏节</b>——六月的第三个星期五。五月花柱、鲱鱼、杜松子酒，像青蛙一样跳舞。瑞典全年都期待真正的休息日。</li>
            <li><b>Påsk（复活节）</b> — 鸡蛋和羽毛装饰品，孩子们打扮成复活节女巫 (<em>påskkärringar</em>)，用图画换糖果。</li>
            <li><b>露西亚（12 月 13 日）</b> — 穿着白袍的孩子们，蜡烛，歌曲“Sankta Lucia”。光明对抗黑暗。</li>
            <li><b>7 月（平安夜）</b> — 用餐时间为 24 日，而不是 25 日。每年下午 3 点电视上都会播放唐老鸭动画片。别问。</li>
          </ul>
          <h2>菲卡</h2>
          <p>Fika 不是一个喝咖啡休息的地方——它是一个社会机构。咖啡或茶，通常搭配甜面包（kanelbulle、kardemummabulle）。工作时经常一天两次。拒绝 Fika 在社交上是可能的，但在情感上是不明智的。</p>
          <h2>国庆节</h2>
          <p>6 月 6 日——瑞典国庆日——标志着 1523 年古斯塔夫·瓦萨的当选和 1809 年宪法的修订。自 2005 年以来才成为公共假期，并且仍在适应这一角色。</p>
          <h2>新传统</h2>
          <p>瑞典长期以来通过移民吸收了新的传统：开斋节（穆斯林）、努鲁兹（波斯新年）、纽鲁兹（库尔德新年，也是 3 月 21 日）、排灯节等。这些越来越成为公共生活的一部分——在学校、工作场所和城市广场庆祝。</p>${ebookFactBox('zh-Hans', null, '国庆节：6月6日·仲夏节：6月的第三个星期五·露西亚：12月13日·平安夜（不是圣诞节）是主要的庆祝活动。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>四大</h2>
          <ul>
            <li><b>仲夏節</b>——六月的第三個星期五。五月花柱、鯡魚、琴酒，像青蛙一樣跳舞。瑞典全年都期待真正的休息日。 </li>
            <li><b>Påsk（復活節）</b> — 雞蛋和羽毛裝飾品，孩子們打扮成復活節女巫 (<em>påskkärringar</em>)，用圖畫換糖果。 </li>
            <li><b>露西亞（12 月 13 日）</b> — 穿著白袍的孩子們，蠟燭，歌曲「Sankta Lucia」。光明對抗黑暗。 </li>
            <li><b>7 月（平安夜）</b> — 用餐時間為 24 日，而非 25 日。每年下午 3 點電視上都會播放唐老鴨動畫片。別問。 </li>
          </ul>
          <h2>菲卡</h2>
          <p>Fika 不是一個喝咖啡休息的地方－它是一個社會機構。咖啡或茶，通常搭配甜麵包（kanelbulle、kardemummabulle）。工作時常常一天兩次。拒絕 Fika 在社交上是可能的，但在情感上是不明智的。 </p>
          <h2>國慶日</h2>
          <p>6 月 6 日——瑞典國慶日——標誌著 1523 年古斯塔夫·瓦薩的當選和 1809 年憲法的修訂。自 2005 年以來才成為公共假期，並且仍在適應這一角色。 </p>
          <h2>新傳統</h2>
          <p>瑞典長期以來透過移民吸收了新的傳統：開齋節（穆斯林）、努魯茲（波斯新年）、紐魯茲（庫德族新年，也是 3 月 21 日）、排燈節等。這些越來越成為公共生活的一部分——在學校、工作場所和城市廣場慶祝。 </p>${ebookFactBox('zh-Hant', null, '國慶日：6月6日仲夏節：6月的第三個星期五·露西亞：12月13日·平安夜（不是聖誕節）是主要的慶祝活動。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>الأربعة الكبار</h2>
          <ul>
            <li><b>منتصف الصيف</b> — الجمعة الثالثة من شهر يونيو. مايبول، الرنجة، المسكر، يرقصون مثل الضفادع. يوم الإجازة الفعلي الذي تتطلع إليه السويد طوال العام.</li>
            <li><b>باسك (عيد الفصح)</b> — زخارف البيض والريش، والأطفال الذين يرتدون زي ساحرات عيد الفصح (<em>påskkärringar</em>) ويتاجرون بالرسومات للحصول على الحلوى.</li>
            <li><b>لوسيا (13 ديسمبر)</b> — أطفال يرتدون أردية بيضاء، شموع، أغنية "سانكتا لوسيا". أضواء ضد الظلام.</li>
            <li><b>يوليو (عشية عيد الميلاد)</b> — الوجبة يوم 24، وليس يوم 25. يتم عرض الرسوم الكاريكاتورية لدونالد داك على شاشة التلفزيون في الساعة 3 مساءً كل عام. لا تسأل.</li>
          </ul>
          <h2>فيكا</h2>
          <p>"فيكا" ليست استراحة لتناول القهوة - إنها مؤسسة اجتماعية. القهوة أو الشاي، عادة مع كعكة حلوة (كانيلبول، كارديمومابول). في كثير من الأحيان مرتين في اليوم في العمل. إن رفض الفيكا أمر ممكن اجتماعيًا ولكنه غير حكيم عاطفيًا.</p>
          <h2>اليوم الوطني</h2>
          <p>يصادف يوم 6 يونيو — Sveriges nationaldag — انتخاب غوستاف فاسا عام 1523 ومراجعة الدستور عام 1809. وهو يوم عطلة رسمية منذ عام 2005 فقط، وما زال يستقر في هذا المنصب.</p>
          <h2>تقاليد جديدة</h2>
          <p>لقد استوعبت السويد منذ فترة طويلة تقاليد جديدة من خلال الهجرة: عيد الفطر (الإسلامي)، والنوروز (رأس السنة الفارسية)، والنوروز (رأس السنة الكردية، 21 مارس أيضًا)، وديوالي، وغيرها. وقد أصبحت هذه الاحتفالات جزءًا متزايدًا من الحياة العامة، حيث يتم الاحتفال بها في المدارس وأماكن العمل وساحات المدينة.</p>${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · منتصف الصيف: الجمعة الثالثة من شهر يونيو · لوسيا: 13 ديسمبر · عشية عيد الميلاد (وليس اليوم) هي الاحتفال الرئيسي.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>چوار گەورەکە</h2>
          <ul>
            <li><b>Midsommar</b> — سێیەم هەینی لە مانگی حوزەیران. مایپۆل، هێرینگ، شناپس، سەماکردن وەک چۆلەکە. ڕۆژی پشوودانی ڕاستەقینەی سوید بە درێژایی ساڵ چاوەڕێی دەکات.</li>
            <li><b>پاسک (جەژنی جەژنی ئیستەر)</b> — هێلکە و ڕازاندنەوەی پەڕ، منداڵان جل و بەرگی جادووگەری جەژنی ئیستەر (<em>påskkärringar</em>)یان پۆشیوە کە وێنەکێشان بە شیرینی دەگۆڕنەوە.</li>
            <li><b>لوسیا (١٣ی کانوونی دووەم)</b> — منداڵان بە جل و بەرگی سپی، مۆم، گۆرانی "سانکتا لوسیا". ڕووناکی لە بەرامبەر تاریکیدا.</li>
            <li><b>تەمموز (شەوی یەڵدا)</b> — ژەمەکە لە ٢٤دایە نەک ٢٥. کارتۆنی دۆناڵد داک لە تیڤی کاتژمێر ٣ی پاشنیوەڕۆ، هەموو ساڵێک. پرسیار مەکە.</li>
          </ul>
          <h2>فیکا</h2>
          <p>فیکا پشوویەکی قاوە نییە — دامەزراوەیەکی کۆمەڵایەتییە. قاوە یان چا، بەزۆری لەگەڵ کۆلایەکی شیرین (kanelbulle، kardemummabulle). زۆرجار ڕۆژانە دوو جار لە شوێنی کار. ڕەتکردنەوەی فیکا لە ڕووی کۆمەڵایەتییەوە ئەگەری هەیە بەڵام لە ڕووی سۆزدارییەوە ناژیرانە.</p>
          <h2>ڕۆژی نیشتمانی</h2>
          <p>٦ی حوزەیران — Sveriges nationaldag — هەڵبژاردنی گوستاڤ ڤاسا لە ساڵی ١٥٢٣ و پێداچوونەوەی دەستووری ساڵی ١٨٠٩. تەنها لە ساڵی ٢٠٠٥ەوە پشووی فەرمی بووە، و هێشتا لە ڕۆڵەکەدا جێگیر بووە.</p>
          <h2>نەریتەکانی نوێ</h2>
          <p>سوید لە مێژە نەریتە نوێیەکانی لە ڕێگەی کۆچەوە هەڵمژیوە: جەژنی ڕەمەزان (موسڵمان)، نوروز (ساڵی نوێی فارسی)، نەورۆز (ساڵی نوێی کوردی، هەروەها ٢١ی ئازار)، دیوالی و ئەوانی تر. ئەمانە تادێت بەشێکن لە ژیانی گشتی — لە قوتابخانەکان، شوێنی کار و گۆڕەپانی شارەکاندا ئاهەنگ دەگێڕن.</p>${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: ٦ی حوزەیران · ناوەڕاستی خەوتن: سێیەم هەینی لە مانگی حوزەیران · لوسیا: ١٣ی کانوونی دووەم · شەوی یەڵدا (نەک ڕۆژ) ئاهەنگی سەرەکییە.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>چهار بزرگ</h2>
          <ul>
            <li><b>Midsommar</b> — سومین جمعه ماه ژوئن. میپل، شاه ماهی، اسکاپ، مثل قورباغه می رقصند. روز تعطیل واقعی سوئد منتظر تمام سال است.</li>
            <li><b>Påsk (عید پاک)</b> - تزئینات تخم مرغ و پر، بچه هایی که لباس جادوگران عید پاک (<em>påskkärringar</em>) را پوشیده اند، نقاشی برای آب نبات معامله می کنند.</li>
            <li><b>لوسیا (13 دسامبر)</b> — کودکان با لباس سفید، شمع، آهنگ "سانکتا لوسیا". نور در برابر تاریکی.</li>
            <li><b>ژوئیه (شب کریسمس)</b> — غذا در 24 ام است، نه 25 ام. کارتون های اردک دونالد هر سال ساعت 3 بعد از ظهر روی تلویزیون. نپرس.</li>
          </ul>
          <h2>فیکا</h2>
          <p>فیکا یک استراحت قهوه نیست - یک نهاد اجتماعی است. قهوه یا چای، معمولاً با نان شیرین (کانلبول، کاردمومامابول). اغلب دو بار در روز در محل کار. امتناع از فیکا از نظر اجتماعی ممکن است اما از نظر احساسی غیرعاقلانه است.</p>
          <h2>روز ملی</h2>
          <p>6 ژوئن — Sveriges Nationaldag — نشان دهنده انتخاب گوستاو واسا در 1523 و بازنگری قانون اساسی 1809 است. تنها از سال 2005 تعطیل رسمی است و هنوز این نقش را ادامه می دهد.</p>
          <h2>سنت های جدید</h2>
          <p>سوئد مدت‌هاست که سنت‌های جدیدی را از طریق مهاجرت جذب کرده است: عید فطر (مسلمانان)، نوروز (سال نوی ایرانی)، نوروز (سال نو کردی، همچنین 21 مارس)، دیوالی، و غیره. اینها به طور فزاینده ای بخشی از زندگی عمومی هستند - که در مدارس، محل کار، و میادین شهر جشن گرفته می شود.</p>${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · میدسومار: سومین جمعه در ژوئن · لوسیا: 13 دسامبر · جشن اصلی شب کریسمس (نه روز) است.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Wielka czwórka</h2>
          <ul>
            <li><b>Midsommar</b> — trzeci piątek czerwca. Słup majowy, śledź, wódka tańczą jak żaby. Prawdziwy dzień wolny, na który Szwecja czeka z utęsknieniem przez cały rok.</li>
            <li><b>Påsk (Wielkanoc)</b> — jajka i ozdoby z piór, dzieci przebrane za wielkanocne wiedźmy (<em>påskkärringar</em>) wymieniające rysunki na cukierki.</li>
            <li><b>Łucja (13 grudnia)</b> — dzieci w białych szatach, świece, piosenka „Sankta Lucia”. Światła przeciw ciemności.</li>
            <li><b>Lipiec (Wigilia)</b> — posiłek jest 24, a nie 25. Animacje z Kaczorem Donaldem w telewizji co roku o 15:00. Nie pytaj.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika to nie przerwa na kawę – to instytucja społeczna. Kawa lub herbata, zazwyczaj ze słodką bułeczką (kanelbulle, kardemummabulle). Często dwa razy dziennie w pracy. Odmowa „fika” jest społecznie możliwa, ale emocjonalnie niemądra.</p>
          <h2>Święto Narodowe</h2>
          <p>6 czerwca — Sveriges Nationaldag — upamiętnia wybór Gustawa Wazy w 1523 r. i rewizję konstytucji w 1809 r. Święto państwowe dopiero od 2005 r. i wciąż pełniące tę rolę.</p>
          <h2>Nowe tradycje</h2>
          <p>Szwecja od dawna wchłania nowe tradycje poprzez migrację: Id al-Fitr (muzułmanin), Nouruz (perski Nowy Rok), Newroz (kurdyjski Nowy Rok, również obchodzony 21 marca), Diwali i inne. Są one coraz częściej częścią życia publicznego – świętujemy w szkołach, miejscach pracy i na placach miejskich.</p>${ebookFactBox('pl', null, 'Święto narodowe: 6 czerwca · Midsommar: trzeci piątek czerwca · Łucja: 13 grudnia · Wigilia (nie dzień) jest głównym świętem.', ['uhrStudyMaterial'])}
        `,
        so: `
          <h2>Afarta weyn</h2>
          <ul>
            <li><b>Midsommar</b>- Jimcaha saddexaad ee Juun. Maypole, herring, schnapps, qoob ka ciyaar sida rahyo. Fasaxa dhabta ah ee Iswiidhan waxay rajaynaysaa sanadka oo dhan.</li>
            <li><b>Påsk (Cidii)</b>- ukunta iyo qurxinta baalasha, carruurta u labisan sida saaxiriinta Easter (<em>påskkärringar</em>) sawiro ganacsi oo nacnac ah.</li>
            <li><b>Lucia (13 Diseembar)</b>- carruurta dhar cad, shumacyo, heesta "Sankta Lucia". Nalalka ka soo horjeeda mugdiga.</li>
            <li><b>Jul (Xalay)</b>- cuntadu waa 24-ka, maaha 25-ka. Donald Duck sawir-gacmeedka TV-ga 3pm, sanad walba. Ha weydiin.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika ma aha nasasho kafeega - waa xarun bulsho. Qaxwaha ama shaaha, sida caadiga ah leh rooti macaan (kanelbulle, kardemummabulle). Badana laba jeer maalintii shaqada. Diidmada fika waa suurtagal bulsho ahaan laakiin dareen ahaan caqli-xumo.</p>
          <h2>Maalinta qaranka</h2>
          <p>Juun 6 - Sveriges nationaldag - waxay calaamad u tahay doorashadii Gustav Vasa ee 1523 iyo dib u eegistii dastuurka ee 1809. Fasax dadweyne oo keliya tan iyo 2005, oo wali la degaya doorka.</p>
          <h2>Dhaqan cusub</h2>
          <p>Iswiidhan waxa ay muddo dheer la soo degtay dhaqamo cusub iyada oo loo marayo socdaalka: Ciid al-Fitr (Muslim), Nouruz (Sannadka Cusub ee Faaris), Newroz (Sannadka Cusub ee Kurdida, sidoo kale 21-ka Maarso), Diwali, iyo kuwa kale. Kuwani waa qayb sii kordheysa oo ka mid ah nolosha guud - oo lagu dabaaldego dugsiyada, goobaha shaqada, iyo fagaarayaasha magaalada.</p>
          ${ebookFactBox('so', null, 'Maalinta Qaranka: Juun 6 · Midsommar: Jimcaha saddexaad ee Juun · Lucia: Diseembar 13 · Habeenka Kirismaska ​​(maaha Maalinta) waa dabaaldega ugu weyn.', ['uhrStudyMaterial'])}

        `,
        ti: `<h2>እቶም ዓበይቲ ኣርባዕተ</h2>
          <ul> ዝብል ጽሑፍ ኣሎ።
            <li><b>ሚድሶማር</b> — ሳልሳይ ዓርቢ ኣብ ወርሒ ሰነ። ማይፖል፡ ሄሪንግ፡ ስናፕስ፡ ከም እንቁርዖብ ዝስዕስዑ። እቲ ጭቡጥ መዓልቲ ዕረፍቲ ሽወደን ዓመት ምሉእ ብሃንቀውታ ትጽበዮ።</li>
            <li><b>ፓስክ (ፋሲካ)</b> — እንቋቑሖን ላሕምን ስልማት፣ ከም ናይ ፋሲካ ጠንቆልቲ (<em>påskkärringar</em>) ተኸዲኖም ስእልታት ብካራሜላ ዝነግዱ ቆልዑ።</li>
            <li><b>ሉቺያ (13 ታሕሳስ)</b> — ጻዕዳ ክዳን ዝለበሱ ህጻናት፡ ሽምዓ፡ "ሳንክታ ሉቺያ" እትብል ደርፊ። መብራህቲ ኣንጻር ጸልማት።</li>
            <li><b>ሓምለ (ዋዜማ ልደት)</b> — እቲ ድራር ኣብ 24 እምበር ኣብ 25 ኣይኮነን። ዶናልድ ዳክ ካርቱን ኣብ ቲቪ ሰዓት 3 ድሕሪ ቀትሪ፡ ዓመት ዓመት። ኣይትሕተት።</li>
          </ul> ዝብል ጽሑፍ ኣሎ።
          <h2>ፊካ</h2>
          <p>ፊካ ዕረፍቲ ቡን ኣይኮነን — ማሕበራዊ ትካል እዩ። ቡን ወይ ሻሂ፡ መብዛሕትኡ ግዜ ምስ ምቁር ባኒ (kanelbulle, kardemummabulle)። መብዛሕትኡ ግዜ ኣብ መዓልቲ ክልተ ግዜ ኣብ ስራሕ። ፊካ ምእባዩ ብማሕበራዊ መዳይ ዝከኣል ኮይኑ ብስምዒት ግን ዘይልቦና እዩ።</p>
          <h2>ሃገራዊ መዓልቲ</h2>
          <p>6 ሰነ — Sveriges nationaldag — ምርጫ ጉስታቭ ቫሳ ኣብ 1523ን ቅዋማዊ ምምሕያሽ 1809ን ዘመልክት እዩ።ካብ 2005 ጀሚሩ ጥራይ ህዝባዊ በዓል ኮይኑ፡ ሕጂ’ውን ኣብቲ ተራ ይሰፍር ኣሎ።</p>
          <h2>ሓደስቲ ልምድታት</h2>
          <p>ሽወደን ካብ ነዊሕ እዋን ኣትሒዛ ብስደት ኣቢላ ሓደስቲ ልምድታት ትውሕጥ ኣላ፡ ዒድ ኣል-ፊጥር (ኣስላማይ)፡ ኑሩዝ (ሓድሽ ዓመት ፋርስ)፡ ኒውሮዝ (ሓድሽ ዓመት ኩርዳውያን፡ ከምኡ’ውን 21 መጋቢት)፡ ዲዋሊ፡ ካልኦትን እዮም። እዚኦም ኣካል ህዝባዊ ህይወት እናኾነ ይመጹ ኣለዉ — ኣብ ኣብያተ ትምህርቲ፡ ናይ ስራሕ ቦታታትን ኣደባባያት ከተማን ዝኽበሩ።</p>${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ: ሰነ 6 · Midsommar: ሳልሳይ ዓርቢ ኣብ ወርሒ ሰነ · ሉቺያ: ታሕሳስ 13 · ዋዜማ ልደት (መዓልቲ ኣይኮነን) እቲ ቀንዲ በዓል እዩ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Büyük dörtlü</h2>
          <ul>
            <li><b>Midsommar</b> — Haziran ayının üçüncü Cuması. Mayıs direği, ringa balığı, schnapps, kurbağalar gibi dans ediyorlar. İsveç'in asıl tatil günü tüm yıl boyunca sabırsızlıkla bekleniyor.</li>
            <li><b>Påsk (Paskalya)</b> — yumurta ve tüy süsleri, Paskalya cadıları (<em>påskkärringar</em>) gibi giyinmiş çocuklar şeker karşılığında resim ticareti yapıyor.</li>
            <li><b>Lucia (13 Aralık)</b> — beyaz cübbeli çocuklar, mumlar, "Sankta Lucia" şarkısı. Karanlığa karşı ışıklar.</li>
            <li><b>Temmuz (Noel Arifesi)</b> — yemek ayın 25'inde değil 24'ünde. Donald Duck çizgi filmleri her yıl saat 15.00'te televizyonda yayınlanır. Sormayın.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika bir kahve molası değil, sosyal bir kurumdur. Kahve veya çay, genellikle tatlı çörekle (kanelbulle, kardemummabulle). Genellikle iş yerinde günde iki kez. Fika'yı reddetmek sosyal açıdan mümkün ancak duygusal açıdan akıllıca değil.</p>
          <h2>Ulusal gün</h2>
          <p>6 Haziran - İsveç ulusal günü - 1523'te Gustav Vasa'nın seçilmesini ve 1809'da anayasa değişikliğini simgeliyor. Yalnızca 2005'ten bu yana resmi tatil ve hâlâ bu göreve alışılıyor.</p>
          <h2>Yeni gelenekler</h2>
          <p>İsveç uzun zamandır göç yoluyla yeni gelenekleri özümsemiştir: Ramazan Bayramı (Müslüman), Nevruz (Fars Yeni Yılı), Newroz (Kürt Yeni Yılı, yine 21 Mart), Diwali ve diğerleri. Bunlar giderek kamusal yaşamın bir parçası haline geliyor; okullarda, işyerlerinde ve şehir meydanlarında kutlanıyor.</p>${ebookFactBox('tr', null, 'Ulusal gün: 6 Haziran · Midsommar: Haziran ayının üçüncü Cuması · Lucia: 13 Aralık · Noel Arifesi (Gün değil) ana kutlamadır.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Велика четвірка</h2>
          <ul>
            <li><b>Мідсоммар</b> — третя п'ятниця червня. Майське дерево, оселедець, шнапс, танці, як жаби. Справжній вихідний день Швеція чекає цілий рік.</li>
            <li><b>Påsk (Великдень)</b> — прикраси з яєць і пір’я, діти, одягнені як великодні чарівниці (<em>påskkärringar</em>), обмінюють малюнки на цукерки.</li>
            <li><b>Lucia (13 грудня)</b> — діти в білих шатах, свічки, пісня «Sankta Lucia». Світло на тлі темряви.</li>
            <li><b>Липень (Святвечір)</b> — їжа припадає на 24, а не на 25 число. Мультфільми про Дональда Дака щороку о 15:00. Не питайте.</li>
          </ul>
          <h2>Фіка</h2>
          <p>Фіка — це не кафе-брейк — це соціальний заклад. Кава або чай, зазвичай із солодкою булочкою (kanelbulle, kardemummabulle). Часто двічі на день на роботі. Відмова від fika соціально можлива, але емоційно нерозумна.</p>
          <h2>Національний день</h2>
          <p>6 червня — Sveriges nationaldag — знаменує обрання Густава Васи в 1523 році та перегляд конституції в 1809 році. Державне свято лише з 2005 року, але все ще вживається в цю роль.</p>
          <h2>Нові традиції</h2>
          <p>Швеція давно засвоїла нові традиції через міграцію: Ід аль-Фітр (мусульманський), Нуруз (перський Новий рік), Невроз (курдський Новий рік, також 21 березня), Дівалі та інші. Вони все частіше стають частиною суспільного життя — святкуються в школах, на робочих місцях і на міських площах.</p>${ebookFactBox('uk', null, "Національний день: 6 червня · Мідсоммар: третя п'ятниця червня · Лючія: 13 грудня · Святвечір (не День) є головним святом.", ['uhrStudyMaterial'])}
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
        'zh-Hans': `<h2>瑞典克朗 (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>瑞典在 2003 年投票反对采用欧元，并使用克朗 (kr)。瑞典央行（瑞典中央银行，成立于 1668 年）制定货币政策并印制几乎无人使用的现金。</p>
          <h2>卡片和应用</h2>
          <p>现金很少见。大多数商店只接受刷卡。个人对个人的支付通过 <em>Swish</em> 进行，这是一款由银行联合开发的移动支付应用程序。您输入电话号码、金额、备注，然后点击。</p>
          <h2>银行ID</h2>
          <p>BankID 是瑞典的国家数字身份。它是一个私人系统（由银行建立），但被视为纳税申报、签署租约、选举投票、开立账户和几乎所有政府服务的合法身份证明。获取 BankID 是新居民首先采取的实际步骤之一。</p>
          <h2>银行和账户</h2>
          <p>要开设瑞典银行账户，您通常需要人员编号或协调号、身份证件和居住证明。主要银行：瑞典银行、瑞典商业银行、瑞典北欧斯安银行、北欧联合银行。仅限在线选项包括 Avanza 和 Nordnet。</p>
          <h2>养老金</h2>
          <p>三层：国家养老金（allmänpension）、雇主提供的职业养老金（tjänstepension）以及任何私人储蓄。国家养老金涵盖基本生活；其余的比人们预期的更重要。</p>${ebookFactBox('zh-Hans', null, '货币：瑞典克朗 (SEK) · 瑞典央行成立时间：1668 年 · 投票反对欧元：2003 年 · 支付应用程序：Swish · 数字 ID：BankID。', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        'zh-Hant': `<h2>瑞典克朗 (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>瑞典在 2003 年投票反對採用歐元，並使用克朗 (kr)。瑞典央行（瑞典中央銀行，成立於 1668 年）制定貨幣政策並印製幾乎無人使用的現金。 </p>
          <h2>卡片與應用程式</h2>
          <p>現金很少見。大多數商店只接受刷卡。個人對個人的支付透過 <em>Swish</em> 進行，這是一款由銀行共同開發的行動支付應用程式。您輸入電話號碼、金額、備註，然後點選。 </p>
          <h2>銀行ID</h2>
          <p>BankID 是瑞典的國家數位身分。它是一個私人系統（由銀行建立），但被視為納稅申報、簽署租約、選舉投票、開立帳戶和幾乎所有政府服務的合法身份證明。取得 BankID 是新居民首先採取的實際步驟之一。 </p>
          <h2>銀行與帳戶</h2>
          <p>要開立瑞典銀行帳戶，您通常需要人員編號或協調號碼、身分證件和居住證明。主要銀行：瑞典銀行、瑞典商業銀行、瑞典北歐斯安銀行、北歐聯合銀行。僅限線上選項包括 Avanza 和 Nordnet。 </p>
          <h2>退休金</h2>
          <p>三層：全國退休金（allmänpension）、雇主提供的職業退休金（tjänstepension）以及任何私人儲蓄。國家退休金涵蓋基本生活；其餘的比人們預期的更重要。 </p>${ebookFactBox('zh-Hant', null, '貨幣：瑞典克朗 (SEK) · 瑞典央行成立時間：1668 年 · 投票反對歐元：2003 年 · 支付應用程式：Swish · 數位 ID：BankID。', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ar: `<h2>الكرونة السويدية (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>صوتت السويد ضد اعتماد اليورو في عام 2003 وتستخدم الكرونا (kr). البنك المركزي السويدي - البنك المركزي السويدي، الذي تأسس عام 1668 - يحدد السياسة النقدية ويطبع الأموال النقدية التي لا يستخدمها أحد تقريبًا.</p>
          <h2>البطاقات والتطبيقات</h2>
          <p>النقود نادرة. تقبل معظم المتاجر البطاقة فقط. يتم إجراء الدفع من شخص إلى شخص من خلال <em>Swish</em> — وهو تطبيق للدفع عبر الهاتف المحمول تم إنشاؤه بشكل مشترك بين البنوك. أدخل رقم هاتف، والمبلغ، وملاحظة، ثم اضغط.</p>
          <h2>الرقم التعريفي للبنك</h2>
          <p>BankID هي الهوية الرقمية الوطنية للسويد. إنه نظام خاص (تم إنشاؤه بواسطة البنوك)، ولكن يتم التعامل معه كدليل قانوني على الهوية لتقديم الضرائب، وتوقيع عقود الإيجار، والتصويت في الانتخابات، وفتح الحسابات، وأي خدمة حكومية تقريبًا. يعد الحصول على BankID إحدى الخطوات العملية الأولى التي يتخذها المقيم الجديد.</p>
          <h2>البنوك والحسابات</h2>
          <p>لفتح حساب مصرفي سويدي، تحتاج عادةً إلى رقم شخصي أو رقم تنسيق وبطاقة هوية وإثبات إقامة. البنوك الكبرى: سويدبانك، هاندلسبانكن، SEB، نورديا. تشمل الخيارات المتاحة عبر الإنترنت فقط Avanza وNordnet.</p>
          <h2>المعاش التقاعدي</h2>
          <p>ثلاث طبقات: معاش الدولة (معاش allmän)، والمعاش المهني عن طريق صاحب العمل (tjänstepension)، وأي مدخرات خاصة. يغطي معاش الدولة الأساسيات؛ أما الباقي فهو أكثر أهمية مما يتوقعه الناس.</p>${ebookFactBox('ar', null, 'العملة: الكرونا السويدية (SEK) · تأسست Riksbank: 1668 · تم التصويت ضد اليورو: 2003 · تطبيق الدفع: Swish · المعرف الرقمي: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ckb: `<h2>کرۆنی سویدی (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>سوید لە ساڵی ٢٠٠٣ دەنگی دژی پەسەندکردنی یۆرۆ دا و کرۆن (کرۆن) بەکاردەهێنێت. ڕیکسبانک — بانکی ناوەندی سوید کە لە ساڵی ١٦٦٨ دامەزراوە — سیاسەتی دراو دادەنێت و ئەو پارە نەختینەیە چاپ دەکات کە نزیکەی کەس بەکاری ناهێنێت.</p>
          <h2>کارت و ئەپەکان</h2>
          <p>پارەی کاش دەگمەنە. زۆربەی دوکانەکان تەنها کارت وەردەگرن. پارەدانی کەس بە کەس لە ڕێگەی <em>Swish</em>ەوە بەڕێوەدەچێت — ئەپێکی پارەدانی مۆبایل کە بە هاوبەشی لەلایەن بانکەکانەوە دروستکراوە. ژمارەیەکی تەلەفۆن و بڕە پارەکە و تێبینییەک داخڵ دەکەیت و پەنجە دەدەیت.</p>
          <h2>ناسنامەی بانکی</h2>
          <p>BankID ناسنامەی دیجیتاڵی نیشتمانی سوید. سیستەمێکی تایبەتە (لەلایەن بانکەکانەوە دروستکراوە)، بەڵام وەک بەڵگەی یاسایی ناسنامە مامەڵەی لەگەڵ دەکرێت بۆ تۆمارکردنی باج، واژۆکردنی گرێبەستی بەکرێدان، دەنگدان لە هەڵبژاردنەکاندا، کردنەوەی ئەژمێرەکان و نزیکەی هەر خزمەتگوزارییەکی حکومی. وەرگرتنی BankID یەکێکە لە یەکەم هەنگاوە پراکتیکییەکان کە دانیشتوویەکی نوێ دەیگرێتەبەر.</p>
          <h2>بانک و ئەکاونتەکان</h2>
          <p>بۆ کردنەوەی ئەژمێری بانکی سویدی بە شێوەیەکی گشتی پێویستت بە ژمارەی کەس یان ژمارەی هەماهەنگی، ناسنامە و بەڵگەی نیشتەجێبوونە. بانکە سەرەکییەکان: سویدبانک، هاندێلسبانکن، ئێس ئێب، نۆردیا. بژاردەکانی تەنها ئۆنلاین بریتین لە ئاڤانزا و نۆردنێت.</p>
          <h2>خانەنشینی</h2>
          <p>سێ چین: خانەنشینی دەوڵەت (خانەنشینی allmän)، خانەنشینی پیشەیی لە ڕێگەی خاوەنکارەکەتەوە (tjänstepension)، و هەر پاشەکەوتێکی تایبەت. خانەنشینی دەوڵەت بنەماکان دەگرێتەوە؛ باقیەکەی تر گرنگترە لەوەی خەڵک چاوەڕێی دەکەن.</p>${ebookFactBox('ckb', null, 'دراو: کرۆنی سویدی (SEK) · دامەزراوەی Riksbank: 1668 · دەنگی دژی یۆرۆ: 2003 · ئەپی پارەدان: Swish · ناسنامەی دیجیتاڵی: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        fa: `<h2>کرون سوئد (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>سوئد در سال 2003 به پذیرش یورو رأی منفی داد و از کرون (kr) استفاده کرد. Riksbank - بانک مرکزی سوئد که در سال 1668 تأسیس شد - سیاست پولی را تنظیم می کند و پول نقدی را چاپ می کند که تقریباً هیچ کس از آن استفاده نمی کند.</p>
          <h2>کارت‌ها و برنامه‌ها</h2>
          <p> پول نقد نادر است. اکثر مغازه ها فقط کارت می پذیرند. پرداخت شخص به فرد از طریق <em>Swish</em> انجام می شود - یک برنامه پرداخت تلفن همراه که به طور مشترک توسط بانک ها ساخته شده است. شماره تلفن، مبلغ، یادداشت را وارد کرده و روی ضربه بزنید.</p>
          <h2>BankID</h2>
          <p>BankID هویت دیجیتال ملی سوئد است. این یک سیستم خصوصی است (ساخته شده توسط بانک ها)، اما به عنوان مدرک قانونی هویت برای تشکیل پرونده مالیاتی، امضای قراردادهای اجاره، رای دادن در انتخابات، افتتاح حساب و تقریباً هر سرویس دولتی تلقی می شود. دریافت کارت بانکی یکی از اولین گام‌های عملی است که یک مقیم جدید انجام می‌دهد.</p>
          <h2>بانک‌ها و حساب‌ها</h2>
          <p>برای افتتاح یک حساب بانکی سوئدی معمولاً به شماره پرسنل یا هماهنگی، شناسه و مدرک اقامت نیاز دارید. بانک های اصلی: Swedbank، Handelsbanken، SEB، Nordea. گزینه های فقط آنلاین شامل Avanza و Nordnet هستند.</p>
          <h2>بازنشستگی</h2>
          <p>سه لایه: بازنشستگی دولتی (تمام بازنشستگی)، بازنشستگی شغلی از طریق کارفرما (tjänstepension)، و هرگونه پس انداز خصوصی. حقوق بازنشستگی دولتی اصول اولیه را پوشش می دهد. بقیه بیشتر از آنچه مردم انتظار دارند اهمیت دارد.</p>${ebookFactBox('fa', null, 'واحد پول: کرون سوئد (SEK) · Riksbank تاسیس: 1668 · رأی در برابر یورو: 2003 · برنامه پرداخت: Swish · شناسه دیجیتال: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        pl: `<h2>Korona szwedzka (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Szwecja głosowała przeciwko przyjęciu euro w 2003 roku i używa korony (kr). Riksbank — szwedzki bank centralny założony w 1668 r. — ustala politykę pieniężną i drukuje gotówkę, której prawie nikt nie używa.</p>
          <h2>Karty i aplikacje</h2>
          <p>Gotówka jest rzadkością. Większość sklepów akceptuje tylko karty. Płatności między osobami odbywają się za pośrednictwem <em>Swish</em> — aplikacji do płatności mobilnych opracowanej wspólnie przez banki. Wpisujesz numer telefonu, kwotę, notatkę i klikasz.</p>
          <h2>ID banku</h2>
          <p>BankID to narodowa tożsamość cyfrowa Szwecji. Jest to system prywatny (zbudowany przez banki), ale traktowany jest jako prawny dowód tożsamości na potrzeby składania zeznań podatkowych, podpisywania umów najmu, głosowania w wyborach, otwierania rachunków i prawie wszystkich usług rządowych. Uzyskanie BankID jest jednym z pierwszych praktycznych kroków, jakie podejmuje nowy mieszkaniec.</p>
          <h2>Banki i konta</h2>
          <p>Aby otworzyć szwedzkie konto bankowe, zazwyczaj potrzebujesz numeru osobistego lub numeru koordynacyjnego, dokumentu tożsamości i dowodu zamieszkania. Największe banki: Swedbank, Handelsbanken, SEB, Nordea. Opcje dostępne wyłącznie online obejmują Avanza i Nordnet.</p>
          <h2>Emerytura</h2>
          <p>Trzy warstwy: emerytura państwowa (allmän Pension), emerytura pracownicza zapewniana przez pracodawcę (tjänstepension) oraz wszelkie prywatne oszczędności. Emerytura państwowa obejmuje podstawy; reszta ma większe znaczenie, niż ludzie się spodziewają.</p>${ebookFactBox('pl', null, 'Waluta: korona szwedzka (SEK) · Założenie Riksbanku: 1668 · Głosowano przeciwko euro: 2003 · Aplikacja płatnicza: Swish · Identyfikator cyfrowy: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        so: `
          <h2>Karoonka Iswiidhishka (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Iswiidhan waxay diiday qaadashada lacagta euro-da 2003 waxayna isticmaashaa krona (kr). Riksbank - bangiga dhexe ee Iswiidhan, oo la aasaasay 1668 - wuxuu dejiyaa siyaasadda lacagta wuxuuna daabacaa lacagta caddaanka ah ee aan qofna isticmaalin.</p>
          <h2>Kaararka iyo apps-ka</h2>
          <p>Lacag caddaan ah waa dhif. Dukaamada intooda badani waxay aqbalaan kaadhka kaliya. Lacag-bixinta qof-ka-qof ayaa socota<em>Iswiish</em>- App-ka lacag-bixinta moobilka oo ay wadajir u dhiseen bangiyadu. Waxaad gelisaa lambarka taleefanka, qaddarka, qoraal, oo taabo.</p>
          <h2>BankID</h2>
          <p>BankID waa aqoonsiga dhijitaalka ah ee qaranka Iswiidhan. Waa nidaam gaar ah (ay dhiseen baananku), laakiin waxaa loola dhaqmaa sida caddaynta sharciga ah ee aqoonsiga xaraynta cashuurta, saxeexida heshiisyada, codaynta doorashooyinka, furitaanka xisaabaadka, iyo ku dhawaad ​​adeeg kasta oo dawladeed. Helitaanka BankID waa mid ka mid ah tillaabooyinka ugu horreeya ee la taaban karo ee qof cusub uu qaado.</p>
          <h2>Bangiyada iyo xisaabaadka</h2>
          <p>Si aad u furato akoon bangi Iswiidhish ah waxaad caadi ahaan u baahan tahay nambarka shakhsiga ama isuduwidda, aqoonsiga, iyo caddaynta deganaanshaha. Bangiyada waaweyn: Swedbank, Handelsbanken, SEB, Nordea. Ikhtiyaarada online-kaliya waxaa ka mid ah Avanza iyo Nordnet.</p>
          <h2>Hawlgabka</h2>
          <p>Saddex lakab: hawlgabka dawladda (allmän pension), hawlgabka shaqada ee loo-shaqeeyahaaga (tjänstepension), iyo kayd kasta oo gaar ah. Hawlgabka dawladeed wuxuu daboolayaa aasaaska; inta soo hartay ayaa ka muhiimsan inta ay dadku filayaan.</p>
          ${ebookFactBox('so', null, 'Lacagta: Swedish krona (SEK) · Riksbank oo la aasaasay: 1668 · Waxaa loogu codeeyay euro: 2003 · App-ka lacag bixinta: Swish · Digital ID: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}

        `,
        ti: `<h2>ናይ ሽወደን ክሮና (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>ሽወደን ኣብ 2003 ዩሮ ንኸይትቕበል ድምጺ ሂባ፡ ክሮና (kr) ትጥቀም። ሪክስባንክ — ኣብ 1668 ዝተመስረተ ማእከላይ ባንክ ሽወደን — ገንዘባዊ ፖሊሲ የቐምጥን ዳርጋ ዝኾነ ሰብ ዘይጥቀመሉ ጥረ ገንዘብ ይሕትምን እዩ።</p>
          <h2>ካርድታትን ኣፕታትን</h2>
          <p>ጥረ ገንዘብ ሳሕቲ እዩ። መብዛሕትአን ድኳናት ካርድ ጥራይ እየን ዝቕበላ። ካብ ሰብ ናብ ሰብ ዝግበር ክፍሊት ብመንገዲ <em>Swish</em> — ብባንክታት ብሓባር ዝተሃንጸ ናይ ሞባይል ክፍሊት ኣፕ ይካየድ። ቁጽሪ ተሌፎን፡ መጠን ገንዘብ፡ ኖት ኣእቲኻ።</p> ትጥውቕ
          <h2>ባንክ መለለዪ</h2>
          <p>BankID ሃገራዊ ዲጂታላዊ መንነት ሽወደን እዩ። ናይ ብሕቲ ስርዓት (ብባንክታት ዝተሃንጸ) ኮይኑ፡ ግን ከኣ ንቐረጽ ንምምዝጋብ፡ ንሊዝ ንምፍራም፡ ኣብ ምርጫ ንምድማጽ፡ ንሕሳብ ንምኽፋት፡ ዳርጋ ንዝኾነ መንግስታዊ ኣገልግሎት ከም ሕጋዊ መርትዖ መንነት ይሕሰብ። BankID ምርካብ ሓደ ካብቶም ቀዳሞት ግብራዊ ስጉምትታት ሓደ ሓድሽ ነባሪ እዩ።</p>
          <h2>ባንክታትን ሕሳባትን</h2>
          <p>ናይ ሽወደን ናይ ባንክ ሕሳብ ንምኽፋት ብተለምዶ ናይ personnummer ወይ ናይ ምውህሃድ ቁጽሪ፡ መለለዪ መንነት፡ ከምኡ’ውን መረጋገጺ መንበሪ የድልየካ። ዓበይቲ ባንክታት፡ ስዌድባንክ፡ ሃንደልስባንከን፡ ኤስ.ኢ.ቢ.፡ ኖርድያ። ኣብ ኢንተርነት ጥራይ ዝጥቀሙ ኣማራጺታት ኣቫንዛን ኖርድኔትን ይርከብዎም።</p>
          <h2>ጡረታ</h2>
          <p>ሰለስተ ንብርኪታት፡ ናይ መንግስቲ ጡረታ (allmän pension)፡ ብመንገዲ ኣስራሒኻ ዝረኽብዎ ናይ ስራሕ ጡረታ (tjänstepension)፡ ከምኡ’ውን ዝኾነ ናይ ብሕቲ ዕቋር። እቲ ናይ መንግስቲ ጡረታ መሰረታዊ ነገራት ዝሽፍን እዩ፤ እቲ ዝተረፈ ካብቲ ሰባት ዝጽበይዎ ንላዕሊ ኣገዳሲ እዩ።</p>${ebookFactBox('ti', null, 'ባጤራ: ሽወደናዊ ክሮና (SEK) · ሪክስባንክ ዝተመስረተ: 1668 · ኣንጻር ዩሮ ድምጺ ዝሃበ: 2003 · ናይ ክፍሊት ኣፕ: ስዊሽ · ዲጂታል መለለዪ: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        tr: `<h2>İsveç kronu (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>İsveç 2003 yılında euroya geçişe karşı oy kullandı ve krona (kr) kullanıyor. İsveç'in 1668'de kurulan merkez bankası Riksbank, para politikasını belirliyor ve neredeyse hiç kimsenin kullanmadığı parayı basıyor.</p>
          <h2>Kartlar ve uygulamalar</h2>
          <p>Nakit nadirdir. Çoğu mağaza yalnızca kart kabul etmektedir. Kişiden kişiye ödeme, bankaların ortaklaşa geliştirdiği bir mobil ödeme uygulaması olan <em>Swish</em> aracılığıyla gerçekleştirilir. Bir telefon numarası, tutar ve not girip dokunun.</p>
          <h2>Banka Kimliği</h2>
          <p>BankID İsveç'in ulusal dijital kimliğidir. Bu özel bir sistemdir (bankalar tarafından inşa edilmiştir), ancak vergi beyanı, kira sözleşmelerinin imzalanması, seçimlerde oy kullanılması, hesap açılması ve hemen hemen her türlü devlet hizmeti için yasal kimlik kanıtı olarak kabul edilir. Banka Kimliği almak, yeni ikamet eden birinin attığı ilk pratik adımlardan biridir.</p>
          <h2>Bankalar ve hesaplar</h2>
          <p>Bir İsveç banka hesabı açmak için genellikle bir kişi numarasına veya koordinasyon numarasına, bir kimliğe ve ikamet belgesine ihtiyacınız vardır. Büyük bankalar: Swedbank, Handelsbanken, SEB, Nordea. Yalnızca çevrimiçi seçenekler arasında Avanza ve Nordnet bulunur.</p>
          <h2>Emeklilik</h2>
          <p>Üç katman: Devlet emekliliği (allmän emeklilik), işvereniniz aracılığıyla mesleki emeklilik (tjänstepension) ve her türlü özel tasarruf. Devlet emekliliği temel konuları kapsar; geri kalanı insanların beklediğinden daha önemli.</p>${ebookFactBox('tr', null, "Para birimi: İsveç kronu (SEK) · Riksbank kuruldu: 1668 · Euro'ya karşı oy kullanıldı: 2003 · Ödeme uygulaması: Swish · Dijital kimlik: BankID.", ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        uk: `<h2>Шведська крона (SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Швеція проголосувала проти прийняття євро в 2003 році та використовує крону (kr). Riksbank — центральний банк Швеції, заснований у 1668 році — визначає монетарну політику та друкує готівку, якою майже ніхто не користується.</p>
          <h2>Картки та програми</h2>
          <p>Готівка буває рідко. Більшість магазинів приймають тільки картку. Оплата між особами здійснюється через <em>Swish</em> — додаток для мобільних платежів, розроблений банками спільно. Ви вводите номер телефону, суму, примітку та торкаєтеся.</p>
          <h2>Ідентифікатор банку</h2>
          <p>BankID — це національна цифрова ідентифікація Швеції. Це приватна система (створена банками), але вона розглядається як юридичне підтвердження особи для подання податкових декларацій, підписання договорів оренди, голосування на виборах, відкриття рахунків і майже будь-яких державних послуг. Отримання BankID є одним із перших практичних кроків, які робить новий резидент.</p>
          <h2>Банки та рахунки</h2>
          <p>Щоб відкрити рахунок у шведському банку, вам зазвичай потрібен персональний або координаційний номер, ідентифікаційний номер і підтвердження місця проживання. Основні банки: Swedbank, Handelsbanken, SEB, Nordea. Лише онлайн-опції включають Avanza та Nordnet.</p>
          <h2>Пенсія</h2>
          <p>Три рівні: державна пенсія (allmän pension), професійна пенсія через вашого роботодавця (tjänstepension) і будь-які приватні заощадження. Державна пенсія покриває базове; решта має більше значення, ніж очікують люди.</p>${ebookFactBox('uk', null, 'Валюта: шведська крона (SEK) · Riksbank засновано: 1668 · Голосував проти євро: 2003 · Платіжна програма: Swish · Цифровий ідентифікатор: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
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
        'zh-Hans': `<h2>欧盟</h2>
          <p>瑞典在 1994 年全民公投后于 1995 年 1 月 1 日加入欧盟（52% 同意，47% 反对）。它使用克朗，而不是欧元。它在欧洲议会中拥有21个席位。在欧盟有权管辖的领域（贸易、农业、渔业、环境、自由流动），欧盟法律优先于瑞典法律。</p>
          <h2>申根</h2>
          <p>瑞典是申根区的一部分，与大多数欧盟国家以及挪威、冰岛、瑞士和列支敦士登开放内部边界。您无需检查护照即可旅行；可能仍会要求您提供身份证件。</p>
          <h2>北约</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>瑞典在军事上保持不结盟长达 200 多年，在两次世界大战和冷战期间都保持中立。俄罗斯入侵乌克兰后，瑞典于2022年5月申请加入北约，并于2024年3月7日正式加入。</p>
          <h2>联合国与援助</h2>
          <p>瑞典于 1946 年加入联合国。它在国际援助与和平外交方面有着悠久的记录。达格·哈马舍尔德 (Dag Hammarskjöld)，1953 年至 1961 年任联合国秘书长，瑞典人。</p>
          <h2>防御</h2>
          <p>征兵制度 (<em>värnplikt</em>) 于 2017 年重新启动，适用于 1999 年出生的男性和女性。并不是每个人都会被征召——选拔是基于测试和动机。服务通常为 9-12 个月。</p>${ebookFactBox('zh-Hans', null, '加入欧盟：1995 年 · 投票反对欧元：2003 年 · 加入北约：2024 年 · 自 1946 年起成为联合国成员 · 重新征兵：2017 年。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        'zh-Hant': `<h2>歐盟</h2>
          <p>瑞典在 1994 年全民公投後於 1995 年 1 月 1 日加入歐盟（52% 同意，47% 反對）。它使用克朗，而不是歐元。它在歐洲議會中擁有21個席位。在歐盟有權管轄的領域（貿易、農業、漁業、環境、自由流動），歐盟法律優先於瑞典法律。 </p>
          <h2>申根</h2>
          <p>瑞典是申根區的一部分，與大多數歐盟國家以及挪威、冰島、瑞士和列支敦士登開放內部邊界。您無需檢查護照即可旅行；可能仍會要求您提供身分證件。 </p>
          <h2>北約</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>瑞典在軍事上保持不結盟長達 200 多年，在兩次世界大戰和冷戰期間都保持中立。俄羅斯入侵烏克蘭後，瑞典於2022年5月申請加入北約，並於2024年3月7日正式加入。 </p>
          <h2>聯合國與援助</h2>
          <p>瑞典於 1946 年加入聯合國。它在國際援助與和平外交方面有著悠久的記錄。達格‧哈馬舍爾德 (Dag Hammarskjöld)，1953 年至 1961 年任聯合國秘書長，瑞典人。 </p>
          <h2>防禦</h2>
          <p>徵兵制度 (<em>värnplikt</em>) 於 2017 年重新啟動，適用於 1999 年出生的男性和女性。並不是每個人都會被徵召——選拔是基於測試和動機。服務通常為 9-12 個月。 </p>${ebookFactBox('zh-Hant', null, '加入歐盟：1995 年 · 投票反對歐元：2003 年 · 加入北約：2024 年 · 自 1946 年起成為聯合國成員 · 重新徵兵：2017 年。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ar: `<h2>الاتحاد الأوروبي</h2>
          <p>انضمت السويد إلى الاتحاد الأوروبي في الأول من يناير/كانون الثاني 1995 بعد استفتاء عام 1994 (52% نعم، 47% لا). ويستخدم الكرونا، وليس اليورو. ولها 21 مقعدا في البرلمان الأوروبي. لقانون الاتحاد الأوروبي الأسبقية على القانون السويدي في المجالات التي يختص بها الاتحاد الأوروبي - التجارة والزراعة ومصايد الأسماك والبيئة وحرية الحركة.</p>
          <h2>شنغن</h2>
          <p>السويد جزء من منطقة شنغن - حدود داخلية مفتوحة مع معظم دول الاتحاد الأوروبي، بالإضافة إلى النرويج وأيسلندا وسويسرا وليختنشتاين. يمكنك السفر دون فحص جواز السفر؛ ربما لا يزال يُطلب منك تقديم بطاقة الهوية.</p>
          <h2>الناتو</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>كانت السويد غير منحازة عسكريًا لأكثر من 200 عام، وكانت محايدة خلال الحربين العالميتين والحرب الباردة. بعد الغزو الروسي لأوكرانيا، تقدمت السويد بطلب للانضمام إلى حلف شمال الأطلسي (الناتو) في مايو 2022 وانضمت رسميًا في 7 مارس 2024.</p>
          <h2>الأمم المتحدة والمساعدات</h2>
          <p>انضمت السويد إلى الأمم المتحدة في عام 1946. وهي تتمتع بسجل طويل من المساعدات الدولية ودبلوماسية السلام. داج همرشولد، الأمين العام للأمم المتحدة 1953-1961، كان سويديًا.</p>
          <h2>الدفاع</h2>
          <p>تمت إعادة تفعيل التجنيد الإجباري (<em>värnplikt</em>) في عام 2017 وينطبق على كل من الرجال والنساء من مواليد عام 1999 وما بعده. لا يتم استدعاء الجميع، فالاختيار يعتمد على الاختبارات والتحفيز. تتراوح مدة الخدمة عادة من 9 إلى 12 شهرًا.</p>${ebookFactBox('ar', null, 'انضمت إلى الاتحاد الأوروبي: 1995 · التصويت ضد اليورو: 2003 · انضمت إلى حلف شمال الأطلسي: 2024 · عضو في الأمم المتحدة منذ: 1946 · أعيد تنشيط التجنيد الإجباري: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ckb: `<h2>یەکێتی ئەوروپا</h2>
          <p>سوید لە 1ی ژانویەی 1995 دوای گشتپرسییەک لە ساڵی 1994 پەیوەندی بە یەکێتی ئەوروپا کرد (52% بەڵێ، 47% نەخێر). کرۆن بەکاردەهێنێت نەک یۆرۆ. 21 کورسی پەرلەمانی ئەوروپای هەیە. یاسای یەکێتی ئەوروپا پێشینەی یاسای سوید هەیە لەو بوارانەی کە یەکێتی ئەوروپا کارامەیی بەسەردا هەیە — بازرگانی، کشتوکاڵ، ماسیگرتن، ژینگە، جووڵەی ئازاد.</p>
          <h2>شنگن</h2>
          <p>سوید بەشێکە لە ناوچەی شنگن — سنوورە ناوخۆییەکانی کراوە لەگەڵ زۆربەی یەکێتی ئەوروپا، لەگەڵ نەرویج، ئایسلەندا، سویسرا و لیختنشتاین. دەتوانیت بەبێ پشکنینی پاسپۆرت گەشت بکەیت؛ لەوانەیە هێشتا داوای ناسنامەت لێ بکرێت.</p>
          <h2>ناتۆ</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>سوید بۆ زیاتر لە ٢٠٠ ساڵ لە ڕووی سەربازییەوە بێلایەن بوو، لە هەردوو جەنگی جیهانی و جەنگی سارددا بێلایەن بوو. دوای لەشکرکێشی ڕووسیا بۆ سەر ئۆکرانیا، سوید لە مانگی ئایاری ٢٠٢٢ داوای بەشداریکردنی لە ناتۆ کرد و لە ٧ی ئازاری ٢٠٢٤ بە فەرمی پەیوەندی بە ناتۆوە کرد.</p>
          <h2>نەتەوە یەکگرتووەکان و هاوکاری</h2>
          <p>سوید لە ساڵی ١٩٤٦ پەیوەندی بە نەتەوە یەکگرتووەکانەوە کردووە، پێشینەیەکی دوور و درێژی هەیە لە هاوکاری نێودەوڵەتی و دیپلۆماسی ئاشتی. داگ هامارسکیۆڵد، سکرتێری گشتی نەتەوە یەکگرتووەکان لە ساڵانی ١٩٥٣-١٩٦١، سویدی بووە.</p>
          <h2>بەرگری</h2>
          <p>وەرگرتنی سەربازی (<em>värnplikt</em>) لە ساڵی ٢٠١٧ چالاککرایەوە و هەردوو ژن و پیاوی لەدایکبووی ساڵی ١٩٩٩ بەدواوە دەگرێتەوە. هەموو کەسێک بانگ ناکرێت — هەڵبژاردن لەسەر بنەمای تاقیکردنەوە و پاڵنەرە. خزمەتگوزاری بە شێوەیەکی گشتی ٩-١٢ مانگە.</p>${ebookFactBox('ckb', null, 'پەیوەندی بە یەکێتی ئەوروپا کردووە: ١٩٩٥ · دەنگی دژی یۆرۆ داوە: ٢٠٠٣ · پەیوەندی بە ناتۆوە کردووە: ٢٠٢٤ · ئەندامی نەتەوە یەکگرتووەکان لە ساڵی ١٩٤٦ەوە · وەرگرتنی سەربازی چالاککراوەتەوە: ٢٠١٧.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        fa: `<h2>اتحادیه اروپا</h2>
          <p>سوئد در 1 ژانویه 1995 پس از همه پرسی در سال 1994 به اتحادیه اروپا پیوست (52٪ بله، 47٪ خیر). از کرون استفاده می کند نه یورو. این کشور 21 کرسی در پارلمان اروپا دارد. قوانین اتحادیه اروپا در زمینه هایی که اتحادیه اروپا در مورد آنها صلاحیت دارد - تجارت، کشاورزی، شیلات، محیط زیست، حرکت آزاد، تقدم دارد.</p>
          <h2>شنگن</h2>
          <p>سوئد بخشی از منطقه شینگن است - مرزهای داخلی باز با اکثر کشورهای اتحادیه اروپا، به علاوه نروژ، ایسلند، سوئیس و لیختن اشتاین. شما می توانید بدون چک پاسپورت سفر کنید. ممکن است همچنان از شما شناسه خواسته شود.</p>
          <h2>ناتو</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>سوئد بیش از 200 سال از نظر نظامی غیر متعهد بود و در هر دو جنگ جهانی و جنگ سرد بی طرف بود. پس از تهاجم روسیه به اوکراین، سوئد در می 2022 درخواست پیوستن به ناتو کرد و در 7 مارس 2024 رسماً به آن ملحق شد.</p>
          <h2>سازمان ملل متحد و کمک</h2>
          <p>سوئد در سال 1946 به سازمان ملل پیوست. این کشور سابقه طولانی در زمینه کمک بین المللی و دیپلماسی صلح دارد. Dag Hammarskjöld، دبیر کل سازمان ملل 1953-1961، سوئدی بود.</p>
          <h2>دفاع</h2>
          <p> خدمت اجباری (<em>värnplikt</em>) در سال 2017 دوباره فعال شد و برای مردان و زنان متولد 1999 به بعد اعمال می شود. همه دعوت نمی شوند - انتخاب بر اساس آزمون ها و انگیزه است. خدمات معمولاً 9 تا 12 ماه است.</p>${ebookFactBox('fa', null, 'پیوستن به اتحادیه اروپا: 1995 · رأی مخالف یورو: 2003 · پیوستن به ناتو: 2024 · عضویت در سازمان ملل از: 1946 · فعالیت اجباری مجدد: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        pl: `<h2>Unia Europejska</h2>
          <p>Szwecja przystąpiła do UE 1 stycznia 1995 r. po referendum w 1994 r. (52% tak, 47% nie). Używa korony, a nie euro. Posiada 21 mandatów w Parlamencie Europejskim. Prawo UE ma pierwszeństwo przed prawem szwedzkim w obszarach objętych kompetencjami UE – handlu, rolnictwie, rybołówstwie, środowisku i swobodnym przepływie.</p>
          <h2>Schengen</h2>
          <p>Szwecja należy do strefy Schengen — otwarte granice wewnętrzne z większością krajów UE oraz Norwegią, Islandią, Szwajcarią i Liechtensteinem. Możesz podróżować bez kontroli paszportowych; nadal możesz zostać poproszony o dowód tożsamości.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Szwecja była militarnie niezaangażowana przez ponad 200 lat i była neutralna zarówno podczas wojen światowych, jak i zimnej wojny. Po inwazji Rosji na Ukrainę Szwecja złożyła wniosek o członkostwo w NATO w maju 2022 r. i formalnie przystąpiła do niego 7 marca 2024 r.</p>
          <h2>Organizacja Narodów Zjednoczonych i pomoc</h2>
          <p>Szwecja przystąpiła do ONZ w 1946 roku. Ma długą historię pomocy międzynarodowej i dyplomacji pokojowej. Dag Hammarskjöld, Sekretarz Generalny ONZ w latach 1953–1961, był Szwedem.</p>
          <h2>Obrona</h2>
          <p>Pobór do wojska (<em>värnplikt</em>) został reaktywowany w 2017 r. i dotyczy zarówno mężczyzn, jak i kobiet urodzonych po 1999 r. Nie każdy zostaje powołany – selekcja opiera się na testach i motywacji. Usługa trwa zazwyczaj 9–12 miesięcy.</p>${ebookFactBox('pl', null, 'Wstąpił do UE: 1995 · Głosował przeciwko euro: 2003 · Wstąpił do NATO: 2024 · Członek ONZ od: 1946 · Reaktywacja poboru do wojska: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        so: `
          <h2>Midowga Yurub</h2>
          <p>Iswiidhan waxay ku biirtay EU 1 Janaayo 1995 ka dib aftidii 1994 (52% haa, 47% maya). Waxay isticmaashaa krona, ma isticmaasho euro. Waxay 21 kursi ku leedahay baarlamaanka Yurub. Sharciga EU-da ayaa ka hormaray sharciga Iswiidhishka ee meelaha EU-du ay awood u leeyihiin - ganacsiga, beeraha, kalluumeysiga, deegaanka, dhaqdhaqaaqa xorta ah.</p>
          <h2>Schengen</h2>
          <p>Iswiidhan waa qayb ka mid ah aagga Schengen-xuduudaha gudaha ee u furan inta badan Midowga Yurub, oo lagu daray Norway, Iceland, Switzerland, iyo Liechtenstein. Waxaad ku safri kartaa adigoon hubin baasaboor; Waxaa laga yaabaa in weli lagu weydiiyo aqoonsi.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Iswiidhan waxay ahayd ciidan ahaan aan la safnayn in ka badan 200 oo sano, dhexdhexaad ah iyada oo loo marayo dagaalladii adduunka iyo dagaalkii qaboobaa. Ka dib duulaankii Ruushka ee Ukraine, Sweden waxay codsatay inay ku biirto NATO May 2022 waxayna si rasmi ah ugu biirtay 7 March 2024.</p>
          <h2>Qaramada Midoobay iyo gargaarka</h2>
          <p>Iswiidhan waxay ku biirtay UN 1946. Waxay leedahay taariikh dheer oo kaalmo caalami ah iyo diblomaasiyad nabadeed. Dag Hammarskjöld, Xoghayaha Guud ee Qaramada Midoobay 1953-1961, wuxuu ahaa Iswidish.</p>
          <h2>Difaaca</h2>
          <p>Askar qorista (<em>värnplikt</em>) ayaa dib loo hawlgeliyay 2017 waxayna khusaysaa ragga iyo dumarka labadaba dhashay 1999 wixii ka dambeeyay. Qof walba looma yeero - xulashada waxay ku saleysan tahay imtixaanno iyo dhiirigelin. Adeeggu caadi ahaan waa 9-12 bilood.</p>
          ${ebookFactBox('so', null, 'Ku biiray EU: 1995 · Waxaa loogu codeeyay diidmo euro: 2003 · Ku biirtay NATO: 2024 · Xubin ka tirsan Qaramada Midoobay tan iyo: 1946 · Dib u shaqaysiinta ciidanka: 2017.', ['uhrStudyMaterial', 'governmentNato'])}

        `,
        ti: `<h2>ሕብረት ኤውሮጳ</h2>
          <p>ሽወደን ኣብ 1994 ድሕሪ ረፈረንደም ብ1 ጥሪ 1995 ናብ ሕብረት ኤውሮጳ ተጸንቢራ (52% እወ፡ 47% ኣይፋል)። ክሮና እምበር ዩሮ ኣይጥቀምን። ኣብ ባይቶ ኤውሮጳ 21 መናብር ኣለዋ። ሕጊ ሕብረት ኤውሮጳ ካብ ሕጊ ሽወደን ቀዳምነት ኣለዎ፡ ሕብረት ኤውሮጳ ብቕዓት ኣብ ዘለዎ መዳያት — ንግዲ፡ ሕርሻ፡ ዓሳ፡ ኣከባቢ፡ ናጻ ምንቅስቓስ።</p>
          <h2>ሸንገን</h2>
          <p>ሽወደን ኣካል ከባቢ ሸንገን እያ — ምስ መብዛሕትኡ ክፋል ሕብረት ኤውሮጳ ክፉት ውሽጣዊ ዶባት፡ ተወሳኺ ኖርወይ፡ ኣይስላንድ፡ ስዊዘርላንድን ሊክተንሽታይንን ኣለዋ። ብዘይ ፓስፖርት ቼክ ክትጓዓዝ ትኽእል ኢኻ፤ ሕጂ ውን መለለዪ መንነት ክትሕተት ትኽእል ኢኻ።</p>
          <h2>ኔቶ</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>ሽወደን ንልዕሊ 200 ዓመታት ብወተሃደራዊ መዳይ ዘይተሰለፈት ኮይና፡ ኣብ ክልቲኡ ውግኣት ዓለምን ዝሑል ኲናትን ገለልተኛ እያ ነይራ። ሩስያ ኣብ ልዕሊ ዩክሬን ምስ ወረረት ሽወደን ኣብ ግንቦት 2022 ናብ ኔቶ ክትጽንበር ኣመልኪታ ብ7 መጋቢት 2024 ድማ ብወግዒ ተጸንቢራ።</p>
          <h2>ውድብ ሕቡራት ሃገራትን ሓገዝን</h2>
          <p>ሽወደን ኣብ 1946 ናብ ሕቡራት ሃገራት ተጸንቢራ።ብኣህጉራዊ ሓገዝን ዲፕሎማሲ ሰላምን ነዊሕ ክብረወሰን ኣለዋ። ዳግ ሃማርስክዮልድ፡ ዋና ጸሓፊ ሕቡራት ሃገራት 1953–1961፡ ሽወደናዊ እዩ ነይሩ።</p>
          <h2>ምክልኻል</h2>
          <p>ምእታው (<em>värnplikt</em>) ኣብ 2017 ዳግማይ ንጡፍ ኮይኑ ካብ 1999 ጀሚሩ ንዝተወልዱ ደቂ ተባዕትዮን ደቂ ኣንስትዮን ዝምልከት እዩ። ኩሉ ሰብ ኣይጽዋዕን — ምምራጽ ኣብ ፈተናን ድርኺትን ዝተመርኮሰ እዩ። ኣገልግሎት ብተለምዶ ካብ 9–12 ኣዋርሕ እዩ።</p>${ebookFactBox('ti', null, 'ናብ ሕብረት ኤውሮጳ ተጸንቢሩ: 1995 · ኣንጻር ዩሮ ድምጺ ሂቡ: 2003 · ናብ ኔቶ ተጸንቢሩ: 2024 · ካብ: 1946 ጀሚሩ ኣባል ሕቡራት ሃገራት · ምልኣኽ ስራሕ ዳግማይ ተነቒሉ: 2017።', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        tr: `<h2>Avrupa Birliği</h2>
          <p>İsveç, 1994'teki referandumun ardından 1 Ocak 1995'te AB'ye katıldı (%52 evet, %47 hayır). Euro değil krona kullanılıyor. Avrupa Parlamentosu'nda 21 sandalyesi var. AB hukuku, AB'nin yetki sahibi olduğu ticaret, tarım, balıkçılık, çevre, serbest dolaşım gibi alanlarda İsveç hukukuna göre önceliklidir.</p>
          <h2>Schengen</h2>
          <p>İsveç, Schengen Bölgesi'nin bir parçasıdır; iç sınırları AB'nin büyük bir kısmının yanı sıra Norveç, İzlanda, İsviçre ve Lihtenştayn ile açıktır. Pasaport kontrolü olmadan seyahat edebilirsiniz; yine de kimliğiniz istenebilir.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>İsveç, 200 yılı aşkın süredir askeri açıdan bağlantısız bir ülkeydi ve hem Dünya Savaşları hem de Soğuk Savaş boyunca tarafsızdı. Rusya'nın Ukrayna'yı işgalinin ardından İsveç, Mayıs 2022'de NATO'ya katılmak için başvurdu ve 7 Mart 2024'te resmen katıldı.</p>
          <h2>Birleşmiş Milletler ve yardım</h2>
          <p>İsveç, 1946'da BM'ye katıldı. Uluslararası yardım ve barış diplomasisi konusunda uzun bir geçmişi var. Dag Hammarskjöld, 1953–1961 BM Genel Sekreteri İsveçliydi.</p>
          <h2>Savunma</h2>
          <p>Zorunlu askerlik (<em>värnplikt</em>) 2017'de yeniden etkinleştirildi ve 1999'dan itibaren doğan hem erkek hem de kadınlar için geçerli. Herkes çağrılmıyor; seçim testlere ve motivasyona dayanıyor. Hizmet süresi genellikle 9-12 aydır.</p>${ebookFactBox('tr', null, "AB'ye katılım: 1995 · Euro'ya karşı oy kullanma: 2003 · NATO'ya katılma: 2024 · BM üyesi olma tarihi: 1946 · Zorunlu askerlik yeniden etkinleştirildi: 2017.", ['uhrStudyMaterial', 'governmentNato'])}
        `,
        uk: `<h2>Європейський Союз</h2>
          <p>Швеція приєдналася до ЄС 1 січня 1995 року після референдуму 1994 року (52% так, 47% ні). Він використовує крони, а не євро. Вона має 21 місце в Європейському парламенті. Законодавство ЄС має пріоритет над законодавством Швеції в сферах компетенції ЄС — торгівля, сільське господарство, рибальство, навколишнє середовище, вільне пересування.</p>
          <h2>Шенген</h2>
          <p>Швеція є частиною Шенгенської зони — відкриті внутрішні кордони з більшою частиною ЄС, а також Норвегією, Ісландією, Швейцарією та Ліхтенштейном. Ви можете подорожувати без перевірки паспорта; вас все одно можуть запитати посвідчення особи.</p>
          <h2>НАТО</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Швеція була позаблоковою у військовому плані понад 200 років, залишаючись нейтральною під час обох світових війн і холодної війни. Після вторгнення Росії в Україну Швеція подала заявку на вступ до НАТО в травні 2022 року та офіційно приєдналася 7 березня 2024 року.</p>
          <h2>Організація Об'єднаних Націй і допомога</h2>
          <p>Швеція приєдналася до ООН у 1946 році. Вона має тривалий досвід міжнародної допомоги та дипломатії миру. Даг Хаммаршельд, Генеральний секретар ООН у 1953–1961 роках, був шведом.</p>
          <h2>Захист</h2>
          <p>Військовий обов’язок (<em>värnplikt</em>) був відновлений у 2017 році і поширюється як на чоловіків, так і на жінок, які народилися з 1999 року. Призивають не всіх — відбір за тестами та мотивацією. Обслуговування зазвичай становить 9–12 місяців.</p>${ebookFactBox('uk', null, 'Приєднався до ЄС: 1995 · Голосував проти євро: 2003 · Приєднався до НАТО: 2024 · Член ООН з: 1946 · Відновлено призову: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
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
        'zh-Hans': `<h2>谁是谁</h2>
          <ul>
            <li><b>Migrationsverket</b> — 移民局。决定居留许可、庇护、家庭团聚、工作许可和公民身份。</li>
            <li><b>Skatteverket</b> — 一旦您获得居留许可并登记为居住在瑞典，就会向您提供您的个人号码。</li>
            <li><b>Polisen</b> — 处理护照和一些身份证件事宜。</li>
          </ul>
          <h2>获得永久居留权的途径</h2>
          <p>您可以以以下身份来瑞典：工人（工作机会高于最低工资）、学生、研究人员、居民的家庭成员、行使行动自由的欧盟公民或寻求庇护者。合法居住一段时间后（通常为四到五年），您可以申请永久居留（<em>permanent uppehållstillstånd</em>），或者，对于欧盟公民，可以申请永久居留权。</p>
          <h2>成为瑞典人</h2>
          <p>要通过入籍申请瑞典公民身份，您通常需要：</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>对于成人申请，年满 18 岁。从 2026 年 6 月 6 日起，儿童不能再包含在父母的公民身份申请中；孩子需要一份由监护人签署的单独申请。</li>
            <li>拥有永久居留许可、居住权或永久居留权。</li>
            <li>在瑞典居住了符合资格的期限 - 通常为五年（无国籍人士、难民和北欧公民的期限较短）。</li>
            <li>生活秩序井然，无重大犯罪记录。</li>
            <li>（自 2026 年起）通过 medborgarskapsprov — 关于公民知识和瑞典语的公民测试 — 并满足瑞典语语言要求。</li>
          </ul>
          <h2>双重国籍</h2>
          <p>瑞典自 2001 年起接受双重国籍。成为瑞典人后，您不会失去原来的公民身份（根据您的原籍国的规定）。</p>${ebookFactBox('zh-Hans', null, '新的公民身份规则自 2026 年 6 月 6 日起适用。UHR 表示，第一次公民知识会议将于 2026 年 8 月 15 日在斯德哥尔摩举行。从 2026 年 6 月 6 日起，儿童需要单独申请公民身份 · 标准居住要求：5 年 · 双重国籍：允许（自 2001 年起） · 决策机构：Migrationsverket。', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        'zh-Hant': `<h2>誰是誰</h2>
          <ul>
            <li><b>Migrationsverket</b> — 移民局。決定居留證、庇護、家庭團聚、工作許可和公民身分。 </li>
            <li><b>Skatteverket</b> — 一旦您獲得居留許可並登記為居住在瑞典，就會向您提供您的個人號碼。 </li>
            <li><b>Polisen</b> — 處理護照和一些身分證件事宜。 </li>
          </ul>
          <h2>取得永久居留權的途徑</h2>
          <p>您可以以以下身分來瑞典：工人（工作機會高於最低工資）、學生、研究人員、居民的家庭成員、行使行動自由的歐盟公民或尋求庇護者。合法居住一段時間後（通常為四到五年），您可以申請永久居留（<em>permanent uppehållstillstånd</em>），或者，對於歐盟公民，可以申請永久居留權。 </p>
          <h2>成為瑞典人</h2>
          <p>要透過入籍申請瑞典公民身份，您通常需要：</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>成人申請，年滿 18 歲。從 2026 年 6 月 6 日起，兒童不能再包含在父母的公民身份申請中；孩子需要一份由監護人簽署的單獨申請。 </li>
            <li>擁有永久居留許可、居住權或永久居留權。 </li>
            <li>在瑞典居住了符合資格的期限 - 通常為五年（無國籍人士、難民和北歐公民的期限較短）。 </li>
            <li>生活秩序井然，無重大犯罪紀錄。 </li>
            <li>（自 2026 年起）通過 medborgarskapsprov — 關於公民知識和瑞典語的公民測試 — 並滿足瑞典語語言要求。 </li>
          </ul>
          <h2>雙重國籍</h2>
          <p>瑞典自 2001 年起接受雙重國籍。成為瑞典人後，您不會失去原來的公民身份（根據您的原籍國的規定）。 </p>${ebookFactBox('zh-Hant', null, '新的公民身份規則自 2026 年 6 月 6 日起適用。 UHR 表示，第一次公民知識會議將於 2026 年 8 月 15 日在斯德哥爾摩舉行。自 2026 年 6 月 6 日起，兒童需要單獨申請公民身分 · 標準居住要求：5 年 · 雙重國籍：允許（自 2001 年起） · 決策機構：Migrationsverket。', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        ar: `<h2>من هو</h2>
          <ul>
            <li><b>Migrationsverket</b> — وكالة الهجرة. يقرر تصاريح الإقامة واللجوء ولم شمل الأسرة وتصاريح العمل والجنسية.</li>
            <li><b>Skatteverket</b> — يمنحك رقمك الشخصي بمجرد حصولك على تصريح إقامة وتسجيلك كمقيم في السويد.</li>
            <li><b>Polisen</b> — يتعامل مع جوازات السفر وبعض المسائل المتعلقة بالهوية.</li>
          </ul>
          <h2>الطرق المؤدية إلى الإقامة الدائمة</h2>
          <p>يمكنك القدوم إلى السويد كعامل (مع عرض عمل أعلى من الحد الأدنى للأجور)، أو طالب، أو باحث، أو أحد أفراد عائلة أحد المقيمين، أو مواطن من الاتحاد الأوروبي يمارس حرية التنقل، أو طالب لجوء. بعد فترة من الإقامة القانونية - عادةً من أربع إلى خمس سنوات - يمكنك التقدم بطلب للحصول على الإقامة الدائمة (<em>uppehållstillstånd</em>) أو، بالنسبة لمواطني الاتحاد الأوروبي، حق الإقامة الدائمة.</p>
          <h2>أن تصبح سويديًا</h2>
          <p>للتقدم بطلب للحصول على الجنسية السويدية عن طريق التجنس، يتعين عليك بشكل عام:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>للتقديم للبالغين، يجب ألا يقل عمرك عن 18 عامًا. اعتبارًا من 6 يونيو 2026، لم يعد من الممكن إدراج الأطفال في طلب جنسية أحد الوالدين؛ يحتاج الطفل إلى طلب منفصل موقع من ولي الأمر.</li>
            <li>الحصول على تصريح إقامة دائمة، أو حق الإقامة، أو حق الإقامة الدائمة.</li>
            <li>لقد عشت في السويد لفترة تأهيلية - عادةً خمس سنوات (أقصر بالنسبة للأشخاص عديمي الجنسية واللاجئين ومواطني بلدان الشمال الأوروبي).</li>
            <li>لقد عاشت حياة منظمة - ولم يكن هناك سجل إجرامي مهم.</li>
            <li>(اعتبارًا من عام 2026) اجتياز اختبار medborgarskapsprov — اختبار الجنسية المتعلق بالمعرفة المدنية واللغة السويدية — واستيفاء متطلبات اللغة السويدية.</li>
          </ul>
          <h2>الجنسية المزدوجة</h2>
          <p>قبلت السويد الجنسية المزدوجة منذ عام 2001. ولن تفقد جنسيتك الأصلية إذا أصبحت سويديًا (مع مراعاة قواعد بلدك الأصلي).</p>${ebookFactBox('ar', null, 'تنطبق قواعد الجنسية الجديدة اعتبارًا من 6 يونيو 2026. ويقول UHR إن أول جلسة للمعرفة المدنية ستعقد في 15 أغسطس 2026 في ستوكهولم. يحتاج الأطفال إلى طلب جنسية منفصل اعتبارًا من 6 يونيو 2026. · متطلبات الإقامة القياسية: 5 سنوات. · الجنسية المزدوجة: مسموح بها (منذ عام 2001) · سلطة اتخاذ القرار: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        ckb: `<h2>کێ کێیە</h2>
          <ul>
            <li><b>Migrationsverket</b> — دەزگای کۆچ. بڕیار لەسەر مۆڵەتی مانەوە، پەنابەری، یەکگرتنەوەی خێزان، مۆڵەتی کارکردن و ڕەگەزنامە دەدات.</li>
            <li><b>Skatteverket</b> — ژمارەی کەسەکانت پێدەدات کاتێک مۆڵەتی نیشتەجێبوونت هەیە و وەک نیشتەجێبوون لە سوید تۆمارکرایت.</li>
            <li><b>Polisen</b> — مامەڵە لەگەڵ پاسپۆرت و هەندێک بابەتی ناسنامە دەکات.</li>
          </ul>
          <h2>رێگاکانی نیشتەجێبوونی هەمیشەیی</h2>
          <p>دەتوانیت بەم شێوەیە بێیتە سوید: کرێکار (کە ئۆفەری کارەکەی لە سەرووی کەمترین مووچەوە)، خوێندکار، توێژەر، ئەندامی خێزانی دانیشتوویەک، هاووڵاتییەکی یەکێتی ئەوروپا کە ئازادی هاتوچۆ بەکاردەهێنێت، یان پەناخوازێک. دوای ماوەی نیشتەجێبوونی یاسایی — بە شێوەیەکی گشتی چوار بۆ پێنج ساڵ — دەتوانیت داوای نیشتەجێبوونی هەمیشەیی بکەیت (<em>permanent uppehållstillstånd</em>) یان، بۆ هاووڵاتیانی یەکێتی ئەوروپا، مافی نیشتەجێبوونی هەمیشەیی.</p>
          <h2>بوون بە سویدی</h2>
          <p>بۆ داواکردنی ڕەگەزنامەی سویدی بە ڕەگەزنامە، بەگشتی پێویستە:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>بۆ داواکاری گەورەساڵان، تەمەنی لانیکەم ١٨ ساڵ بێت. لە ٦ی حوزەیرانی ٢٠٢٦ەوە، چیتر ناتوانرێت منداڵان لە داواکاری ڕەگەزنامەی دایک و باوکدا جێگیر بکرێن؛ منداڵ پێویستی بە داواکارییەکی جیا هەیە کە لەلایەن سەرپەرشتیارێکەوە واژۆ کراوە.</li>
            <li>مۆڵەتی نیشتەجێبوونی هەمیشەیی، مافی نیشتەجێبوون، یان مافی نیشتەجێبوونی هەمیشەیی هەبێت.</li>
            <li>بۆ ماوەیەکی شایستە لە سوید ژیاون — بە شێوەیەکی گشتی پێنج ساڵ (کورتتر بۆ کەسانی بێ دەوڵەت، پەنابەران و هاووڵاتیانی باکوور).</li>
            <li>ژیانێکی ڕێک و پێکیان بەڕێوەبردووە — هیچ تۆمارێکی تاوانکاری بەرچاویان نییە.</li>
            <li>(لە ساڵی ٢٠٢٦ەوە) دەرچوون لە medborgarskapsprov — تاقیکردنەوەی هاووڵاتیبوون لەسەر زانیاری مەدەنی و سویدی — و مەرجێکی زمانی سویدی بەدیبهێنە.</li>
          </ul>
          <h2>دوو ڕەگەزنامە</h2>
          <p>سوید لە ساڵی ٢٠٠١ەوە دوو ڕەگەزنامەی وەرگرتووە، تۆ ڕەگەزنامەی ڕەسەنی خۆت لەدەست نادەیت بە سویدی بوون (بەپێی یاساکانی وڵاتی ڕەچەڵەکی خۆت).</p>${ebookFactBox('ckb', null, 'یاسای نوێی ڕەگەزنامە لە ٦ی حوزەیرانی ٢٠٢٦ەوە جێبەجێ دەکرێت. UHR دەڵێت یەکەم دانیشتنی زانیاری مەدەنی لە ١٥ی ئابی ٢٠٢٦ لە ستۆکهۆڵمە. منداڵان پێویستیان بە داواکاری ڕەگەزنامەی جیا هەیە لە ٦ی حوزەیرانی ٢٠٢٦ەوە · مەرجی نیشتەجێبوونی ستاندارد: ٥ ساڵ · دوو ڕەگەزنامە: ڕێگەپێدراوە (لە ساڵی ٢٠٠١ەوە) · دەسەڵاتی بڕیاردان: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        fa: `<h2>چه کسی چه کسی است</h2>
          <ul>
            <li><b>Migrationsverket</b> — آژانس مهاجرت. در مورد مجوزهای اقامت، پناهندگی، الحاق خانواده، مجوزهای کار و شهروندی تصمیم می گیرد.</li>
            <li><b>Skatteverket</b> — پس از دریافت مجوز اقامت و ثبت نام به عنوان ساکن در سوئد، شماره پرسنل خود را به شما می دهد.</li>
            <li><b>Polisen</b> — گذرنامه ها و برخی از مسائل مربوط به شناسایی را انجام می دهد.</li>
          </ul>
          <h2>مسیرهای اقامت دائم</h2>
          <p>شما می توانید به عنوان: یک کارگر (با پیشنهاد کاری بالاتر از حداقل دستمزد)، یک دانشجو، یک محقق، یکی از اعضای خانواده یک مقیم، یک شهروند اتحادیه اروپا که از آزادی حرکت استفاده می کند، یا یک پناهجو به سوئد بیایید. پس از یک دوره اقامت قانونی - معمولاً چهار تا پنج سال - می توانید برای اقامت دائم (<em>permanent uppehållstillstånd</em>) یا برای شهروندان اتحادیه اروپا، حق اقامت دائم درخواست دهید.</p>
          <h2>سوئدی شدن</h2>
          <p>برای درخواست تابعیت سوئد از طریق تابعیت، معمولاً باید:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>برای برنامه بزرگسالان، حداقل 18 سال سن داشته باشید. از 6 ژوئن 2026، فرزندان دیگر نمی توانند در درخواست شهروندی والدین گنجانده شوند. یک کودک نیاز به یک درخواست جداگانه دارد که توسط سرپرست امضا شده باشد.</li>
            <li>مجوز اقامت دائم، حق اقامت یا حق اقامت دائم داشته باشید.</li>
            <li>برای یک دوره واجد شرایط در سوئد زندگی کرده‌اند - معمولاً پنج سال (برای افراد بدون تابعیت، پناهندگان و شهروندان شمال اروپا کوتاه‌تر).</li>
            <li>زندگی منظمی داشته‌اند - بدون سابقه کیفری قابل توجه.</li>
            <li>(از سال 2026) آزمون medborgarskapsprov - آزمون شهروندی دانش مدنی و سوئدی - را بگذرانید و شرایط سوئدی زبان را برآورده کنید.</li>
          </ul>
          <h2> تابعیت مضاعف</h2>
          <p>سوئد از سال 2001 تابعیت مضاعف را پذیرفته است. شما با سوئد شدن تابعیت اصلی خود را از دست نمی دهید (مطابق با قوانین کشور مبدأ خود).</p>${ebookFactBox('fa', null, 'قوانین جدید شهروندی از 6 ژوئن 2026 اعمال می شود. UHR می گوید اولین جلسه دانش مدنی در 15 اوت 2026 در استکهلم برگزار می شود. کودکان از 6 ژوئن 2026 به درخواست شهروندی جداگانه نیاز دارند · شرایط استاندارد اقامت: 5 سال · تابعیت دوگانه: مجاز (از سال 2001) · مرجع تصمیم گیری: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        pl: `<h2>Kto jest kim</h2>
          <ul>
            <li><b>Migrationsverket</b> — Agencja Migracyjna. Decyduje o pozwoleniach na pobyt, azylu, łączeniu rodzin, pozwoleniach na pracę i obywatelstwie.</li>
            <li><b>Skatteverket</b> — daje Ci numer osobisty po uzyskaniu pozwolenia na pobyt i zarejestrowaniu się jako osoba mieszkająca w Szwecji.</li>
            <li><b>Polisen</b> — zajmuje się paszportami i niektórymi sprawami dotyczącymi tożsamości.</li>
          </ul>
          <h2>Trasy do stałego pobytu</h2>
          <p>Możesz przyjechać do Szwecji jako: pracownik (z ofertą pracy powyżej płacy minimalnej), student, naukowiec, członek rodziny rezydenta, obywatel UE korzystający ze swobody przemieszczania się lub osoba ubiegająca się o azyl. Po okresie legalnego pobytu – zazwyczaj od czterech do pięciu lat – możesz ubiegać się o pobyt stały (<em>permanent uppehållstillstånd</em>) lub, w przypadku obywateli UE, o prawo stałego pobytu.</p>
          <h2>Stać się Szwedem</h2>
          <p>Aby ubiegać się o obywatelstwo szwedzkie w drodze naturalizacji, zazwyczaj musisz:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>W przypadku aplikacji dla osoby dorosłej należy mieć ukończone 18 lat. Od 6 czerwca 2026 r. we wniosku rodzica o nadanie obywatelstwa nie można już uwzględniać dzieci; dziecko potrzebuje osobnego wniosku podpisanego przez opiekuna.</li>
            <li>Posiadać zezwolenie na pobyt stały, prawo pobytu lub prawo stałego pobytu.</li>
            <li>Mieszkali w Szwecji przez wymagany okres – zazwyczaj pięć lat (krócej w przypadku bezpaństwowców, uchodźców i obywateli krajów nordyckich).</li>
            <li>Prowadziły uporządkowane życie – nie była karana.</li>
            <li>(Od 2026 r.) Zdaj medborgarskapsprov — test obywatelski z wiedzy obywatelskiej i języka szwedzkiego — i spełnij wymagania dotyczące języka szwedzkiego.</li>
          </ul>
          <h2>Podwójne obywatelstwo</h2>
          <p>Szwecja akceptuje podwójne obywatelstwo od 2001 roku. Stając się Szwedem, nie tracisz swojego pierwotnego obywatelstwa (z zastrzeżeniem przepisów obowiązujących w kraju pochodzenia).</p>${ebookFactBox('pl', null, 'Nowe zasady dotyczące obywatelstwa obowiązują od 6 czerwca 2026 r. Według UHR pierwsze posiedzenie poświęcone wiedzy obywatelskiej odbędzie się 15 sierpnia 2026 r. w Sztokholmie. Dzieci potrzebują osobnego wniosku o obywatelstwo od 6 czerwca 2026 r. · Standardowy wymóg pobytu: 5 lat · Podwójne obywatelstwo: dozwolone (od 2001 r.) · Organ decyzyjny: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        so: `
          <h2>Waa kuma</h2>
          <ul>
            <li><b>Migrationsverket</b>- Hay'adda Socdaalka. Wuxuu go'aamiyaa ogolaanshaha joogitaanka, magangalyada, isukeenida qoyska, ogolaanshaha shaqada, iyo dhalashada.</li>
            <li><b>Skatteverket</b>- wuxuu ku siinayaa nambarkaaga marka aad haysato sharciga deganaanshaha oo aad ka diiwaan gashan tahay inaad ku nooshahay Iswiidhan.</li>
            <li><b>Polisen</b>- wuxuu qabtaa baasaboorka iyo arrimaha aqoonsiga qaarkood.</li>
          </ul>
          <h2>Wadooyinka loo maro deganaanshaha rasmiga ah</h2>
          <p>Waxaad Iswiidhan ku iman kartaa: shaqaale (oo leh shaqo bixin ka sarreysa mushaharka ugu yar), arday, cilmi-baare, xubin qoyska ka mid ah oo deggan, muwaadin EU-da ah oo sameynaya xorriyadda dhaqdhaqaaqa, ama magangalyo doon. Ka dib muddo degenaansho sharci ah - caadiyan afar ilaa shan sano - waxaad codsan kartaa deganansho rasmi ah (<em>joogto ah uppehållstillstånd</em>) ama, muwaadiniinta EU-da, xuquuqda degenaanshaha joogtada ah.</p>
          <h2>Iswidhish noqosho</h2>
          <p>Si aad u codsato dhalashada Iswiidhishka ee jinsiyadda, waxaad guud ahaan u baahan tahay:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>Codsiga qaangaarka, ugu yaraan da'da 18 jir. Laga bilaabo 6 Juun 2026, carruurta laguma dari karo codsiga dhalashada waalidka; Ilmuhu wuxuu u baahan yahay codsi gooni ah oo uu saxeexo mas'uul.</li>
            <li>In aad haysato sharci degenaansho rasmi ah, xuquuq degenaansho, ama xuquuq degenaansho rasmi ah.</li>
            <li>Ku noolaa Iswiidhan muddo u qalmidda - badiyaa shan sano (oo ka gaaban dadka aan wadan, qaxootiga, iyo muwaadiniinta Waqooyiga Yurub).</li>
            <li>U horseeday nolol nidaamsan - ma jiro diiwaan dambiyeed muhiim ah.</li>
            <li>(Laga bilaabo 2026) Ku gudub medborgarskapsprov - imtixaanka jinsiyadda ee aqoonta madaniga ah iyo iswidhishka - oo buuxi shuruudaha luqadda Iswidhishka.</li>
          </ul>
          <h2>Laba dhalasho</h2>
          <p>Iswiidhan waxay aqbashay laba dhalasho laga soo bilaabo 2001. Ma waayi doontid jinsiyadaada asalka ah markaad noqoto Iswidhish (iyadoo la raacayo sharciga wadankaagi).</p>
          ${ebookFactBox('so', null, "Xeerarka cusub ee jinsiyadda ayaa dhaqan galaya laga bilaabo 6 Juun 2026. UHR waxay leedahay fadhiga ugu horreeya ee aqoonta bulshada waa 15 Agoosto 2026 Stockholm. Carruurtu waxay u baahan yihiin codsi dhalasho oo gaar ah laga bilaabo 6 Juun 2026 · Shuruudaha degenaanshaha caadiga ah: 5 sano · Laba dhalasho: la oggol yahay (ilaa 2001) · Hay'adda go'aanka: Migrationsverket.", ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}

        `,
        ti: `<h2>መን መን እዩ</h2>
          <ul> ዝብል ጽሑፍ ኣሎ።
            <li><b>Migrationsverket</b> — ትካል ስደተኛታት። መንበሪ ፍቓድ፡ ዑቕባ፡ ምጥርናፍ ስድራቤት፡ ፍቓድ ስራሕን ዜግነትን ይውስን።</li>
            <li><b>Skatteverket</b> — መንበሪ ፍቓድ ምስ ረኸብካን ኣብ ሽወደን ከም እትነብር ምስ ተመዝገብካን personnummer ናትካ ይህበካ።</li>
            <li><b>ፖሊሰን</b> — ፓስፖርትን ገለ መለለዪ መንነት ጉዳያትን ይሕዝ።</li>
          </ul> ዝብል ጽሑፍ ኣሎ።
          <h2>መንገድታት ናብ ቀዋሚ መንበሪ</h2>
          <p>ናብ ሽወደን ክትመጽእ ትኽእል ኢኻ፦ ሰራሕተኛ (ልዕሊ ዝተሓተ ደሞዝ ናይ ስራሕ ዕድል ዘለዎ)፡ ተማሃራይ፡ ተመራማሪ፡ ኣባል ስድራቤት ናይ ሓደ ነባሪ፡ ናይ ሕብረት ኤውሮጳ ዜጋ ናጽነት ምንቅስቓስ ዝጥቀም፡ ወይ ሓታቲ ዑቕባ። ድሕሪ ናይ ሕጋዊ መንበሪ ግዜ — ብተለምዶ ካብ ኣርባዕተ ክሳብ ሓሙሽተ ዓመት — ቀዋሚ መንበሪ (<em>ቀዋሚ uppehållstillstånd</em>) ወይ ንዜጋታት ሕብረት ኤውሮጳ ቀዋሚ መሰል መንበሪ ከተመልክት ትኽእል ኢኻ።</p>
          <h2>ሽወደናዊ ምዃን</h2>
          <p>ብናቹራላይዜሽን ዜግነት ሽወደን ንምምልካት፡ ብሓፈሻ ከምዚ ዝስዕብ ክትገብሮ ኣለካ፦</p>
          <ul> ዝብል ጽሑፍ ኣሎ።
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>ንዓበይቲ መመልከቲ፡ እንተወሓደ ዕድሚኡ 18 ዓመት ክኸውን ኣለዎ። ካብ ዕለት 6 ሰነ 2026 ጀሚሩ ህጻናት ኣብ ናይ ወላዲ ዜግነት መመልከቲ ክካተቱ ኣይክእሉን፤ ሓደ ቆልዓ ብኣላዪት ዝተፈረመ ፍሉይ መመልከቲ የድልዮ።</li>
            <li>ቀዋሚ መንበሪ ፍቓድ፣ መሰል መንበሪ፣ ወይ መሰል ቀዋሚ መንበሪ ምህላው።</li>
            <li>ንብቑዕ ግዜ ኣብ ሽወደን ዝነብሩ — ብተለምዶ ንሓሙሽተ ዓመት (ንሃገር ዘይብሎም ሰባት፣ ስደተኛታትን ዜጋታት ኖርዲክን ዝሓጸረ)።</li>
            <li>ስርዓት ዘለዎ ህይወት ዝመርሑ — ትርጉም ዘለዎ ገበናዊ መዝገብ የብሎምን።</li>
            <li>(ካብ 2026 ጀሚሩ) medborgarskapsprov — ኣብ ዜግነታዊ ፍልጠትን ሽወደንኛን ዝግበር ናይ ዜግነት ፈተና — ምሕላፍን ቋንቋ ሽወደን ዝብል ረቛሒ ምምላእን።</li>
          </ul> ዝብል ጽሑፍ ኣሎ።
          <h2>ድርብ ዜግነት</h2>
          <p>ሽወደን ካብ 2001 ጀሚራ ድርብ ዜግነት ተቐቢላ ኣላ።ሽወደናዊ ብምዃንካ መበቆላዊ ዜግነትካ ኣይትስእንን ኢኻ (ብሕጊ መበቆል ሃገርካ ተገዚኡ)።</p>${ebookFactBox('ti', null, 'ሓድሽ ሕግታት ዜግነት ካብ 6 ሰነ 2026 ጀሚሩ ተግባራዊ ይኸውን።UHR ናይ መጀመርታ ሲቪካዊ-ፍልጠት ኣኼባ 15 ነሓሰ 2026 ኣብ ስቶክሆልም ምዃኑ ይገልጽ። ህጻናት ካብ 6 ሰነ 2026 ጀሚሩ ፍሉይ ናይ ዜግነት መመልከቲ የድልዮም · መደበኛ መንበሪ ረቛሒ: 5 ዓመት · ድርብ ዜግነት: ይፍቀድ (ካብ 2001 ጀሚሩ) · በዓል ስልጣን ውሳነ: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        tr: `<h2>Kim kimdir</h2>
          <ul>
            <li><b>Migrationsverket</b> — Göç Ajansı. Oturma izinlerine, ilticaya, aile birleşimine, çalışma izinlerine ve vatandaşlığa karar verir.</li>
            <li><b>Skatteverket</b> — oturma izniniz olduğunda ve İsveç'te yaşıyor olarak kaydolduğunuzda size kişi numaranızı verir.</li>
            <li><b>Polisen</b> — pasaportlarla ve bazı kimlik meseleleriyle ilgilenir.</li>
          </ul>
          <h2>Daimi ikametgah yolları</h2>
          <p>İsveç'e şu kişiler olarak gelebilirsiniz: işçi (asgari ücretin üzerinde iş teklifi almış), öğrenci, araştırmacı, İsveç sakininin aile üyesi, hareket özgürlüğünü kullanan bir AB vatandaşı veya sığınmacı. Genellikle dört ila beş yıl süren yasal ikamet süresinden sonra, kalıcı ikamet (<em>kalıcı uppehållstillstånd</em>) veya AB vatandaşları için kalıcı ikamet hakkı için başvurabilirsiniz.</p>
          <h2>İsveçli Olmak</h2>
          <p>Vatandaşlığa kabul yoluyla İsveç vatandaşlığına başvurmak için genellikle şunları yapmanız gerekir:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>Yetişkinlere yönelik başvurularda en az 18 yaşında olun. 6 Haziran 2026'dan itibaren çocuklar artık ebeveynlerinin vatandaşlık başvurusuna dahil edilemeyecek; çocuğun bir veli tarafından imzalanmış ayrı bir başvuruya ihtiyacı vardır.</li>
            <li>Daimi ikamet iznine, ikamet hakkına veya daimi ikamet hakkına sahip olmak.</li>
            <li>İsveç'te belirli bir süre (genellikle beş yıl) yaşamış olmak (vatansız kişiler, mülteciler ve İskandinav vatandaşları için daha kısa).</li>
            <li>Düzenli bir hayat sürdüler; önemli bir sabıka kaydı yok.</li>
            <li>(2026'dan itibaren) Vatandaşlık bilgisi ve İsveççe vatandaşlık testi olan medborgarskapsprov'u geçin ve İsveççe dil şartını yerine getirin.</li>
          </ul>
          <h2>Çifte vatandaşlık</h2>
          <p>İsveç, 2001'den beri çifte vatandaşlığı kabul etmektedir. İsveçli olduğunuzda asıl vatandaşlığınızı kaybetmezsiniz (köken ülkenizin kurallarına tabidir).</p>${ebookFactBox('tr', null, "Yeni vatandaşlık kuralları 6 Haziran 2026'dan itibaren geçerli olacak. UHR, ilk yurttaşlık bilgisi toplantısının 15 Ağustos 2026'da Stockholm'de yapılacağını söylüyor. Çocukların 6 Haziran 2026'dan itibaren ayrı bir vatandaşlık başvurusuna ihtiyaçları vardır · Standart ikamet şartı: 5 yıl · Çifte vatandaşlık: izin verilir (2001'den beri) · Karar makamı: Migrationsverket.", ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        uk: `<h2>Хто є хто</h2>
          <ul>
            <li><b>Migrationsverket</b> — Міграційне агентство. Приймає рішення щодо дозволів на проживання, притулку, возз’єднання сім’ї, дозволів на роботу та громадянства.</li>
            <li><b>Skatteverket</b> — надає вам персональний номер, коли ви отримаєте дозвіл на проживання та зареєстровані як мешканці Швеції.</li>
            <li><b>Polisen</b> — обробляє паспорти та деякі документи, що посвідчують особу.</li>
          </ul>
          <h2>Шляхи до постійного місця проживання</h2>
          <p>Ви можете приїхати до Швеції як: робітник (із пропозицією роботи вище мінімальної заробітної плати), студент, науковий співробітник, член сім’ї резидента, громадянин ЄС, який користується свободою пересування, або шукач притулку. Після періоду легального проживання — зазвичай чотири-п’ять років — ви можете подати заяву на постійне проживання (<em>permanent uppehållstillstånd</em>) або, для громадян ЄС, на постійне право на проживання.</p>
          <h2>Стати шведкою</h2>
          <p>Щоб подати заяву на отримання шведського громадянства шляхом натуралізації, зазвичай потрібно:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>Щоб подати заявку для дорослих, потрібно мати принаймні 18 років. З 6 червня 2026 року діти більше не можуть бути включені до заявки на громадянство батьків; для дитини потрібна окрема заява, підписана опікуном.</li>
            <li>Мати постійний дозвіл на проживання, право на проживання або право на постійне проживання.</li>
            <li>Прожити в Швеції протягом відповідного періоду — зазвичай п’ять років (менше для осіб без громадянства, біженців і громадян Північної Європи).</li>
            <li>Вели впорядкований спосіб життя — не мали значного кримінального минулого.</li>
            <li>(З 2026 р.) Скласти medborgarskapsprov — іспит на громадянство на громадянські знання та знання шведської мови — і відповідати вимогам щодо знання шведської мови.</li>
          </ul>
          <h2>Подвійне громадянство</h2>
          <p>Швеція прийняла подвійне громадянство з 2001 року. Ви не втрачаєте своє початкове громадянство, ставши шведом (відповідно до правил країни походження).</p>${ebookFactBox('uk', null, 'Нові правила громадянства застосовуються з 6 червня 2026 року. UHR повідомляє, що перше засідання громадянських знань відбудеться 15 серпня 2026 року в Стокгольмі. Дітям потрібна окрема заява на отримання громадянства з 6 червня 2026 р. · Стандартні вимоги до проживання: 5 років · Подвійне громадянство: дозволено (з 2001 р.) · Орган, що приймає рішення: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
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
        'zh-Hans': `<h2>当前官方状态</h2>
          <p>UHR 表示，首次公民知识会议将于 2026 年 8 月 15 日在斯德哥尔摩举行。需要 Migrationsverket 信件：只有收到 Migrationsverket 信件的人才能注册。</p>
          <p>座位有限。八月的会议是免费的，UHR 表示参与者将有充足的时间。</p>
          <h2>UHR 正在等待实际细节</h2>
          <p>UHR尚未公布具体时间和地点。使用此应用程序进行非官方练习，并使用 UHR 和 Migrationsverket 获取影响您自己案例的说明。</p>
          <h2>现在如何学习</h2>
          <ol>
            <li>至少从头到尾阅读这本电子书一次。使用“练习”选项卡来练习您忘记的内容。</li>
            <li>对于每一个你错了两次的事实，把它写在卡片上，然后贴在冰箱上。尴尬是一位伟大的老师。</li>
            <li>在考试前一周浏览官方 <em>Sverige i fokus</em> PDF（从 UHR 免费下载）。不要试图记住它。</li>
            <li>使用此处的模拟考试作为混合主题回忆的排练，然后重温您错过的章节。</li>
          </ol>
          <div class="ebook__factbox"><h4>当前源注释</h4><p>2026-05-19访问的源：${officialTestSourceLinks()}</p></div>
        `,
        'zh-Hant': `<h2>當前官方狀態</h2>
          <p>UHR 表示，首次公民知識會議將於 2026 年 8 月 15 日在斯德哥爾摩舉行。需要 Migrationsverket 信件：只有收到 Migrationsverket 信件的人才能註冊。 </p>
          <p>座位有限。八月的會議是免費的，UHR 表示參與者將有充足的時間。 </p>
          <h2>UHR 正在等待實際細節</h2>
          <p>UHR尚未公佈具體時間和地點。使用此應用程式進行非官方練習，並使用 UHR 和 Migrationsverket 取得影響您自己案例的說明。 </p>
          <h2>現在如何學習</h2>
          <ol>
            <li>至少從頭到尾閱讀這本電子書一次。使用“練習”選項卡來練習您忘記的內容。 </li>
            <li>對於每一個你錯了兩次的事實，把它寫在卡片上，然後貼在冰箱上。尷尬是一位偉大的老師。 </li>
            <li>在考試前一週瀏覽官方 <em>Sverige i fokus</em> PDF（從 UHR 免費下載）。不要試著記住它。 </li>
            <li>使用此處的模擬考試作為混合主題回憶的排練，然後重溫您錯過的章節。 </li>
          </ol>
          <div class="ebook__factbox"><h4>目前來源註解</h4><p>2026-05-19存取的來源：${officialTestSourceLinks()}</p></div>
        `,
        ar: `<h2>الوضع الرسمي الحالي</h2>
          <p>يقول UHR أن الجلسة الأولى للمعرفة المدنية ستعقد في 15 أغسطس 2026 في ستوكهولم. مطلوب خطاب Migrationsverket: فقط الأشخاص الذين يتلقون خطابًا من Migrationsverket يمكنهم الاشتراك.</p>
          <p>المقاعد محدودة. جلسة شهر أغسطس مجانية، وتقول UHR إن المشاركين سيحظون بوقت سخٍ.</p>
          <h2>التفاصيل العملية المعلقة من UHR</h2>
          <p>لم تنشر UHR بعد الوقت والمكان المحددين. استخدم هذا التطبيق للتدريب غير الرسمي، واستخدم UHR وMigrationsverket للحصول على الإرشادات التي تؤثر على حالتك.</p>
          <h2>كيف تدرس الآن</h2>
          <ol>
            <li>اقرأ هذا الكتاب الإلكتروني بالكامل مرة واحدة على الأقل. استخدم علامة التبويب "التدريب" لمعرفة ما نسيته.</li>
            <li>مقابل كل حقيقة أخطأت فيها مرتين، اكتبها على بطاقة وألصقها على الثلاجة. الإحراج معلم عظيم.</li>
            <li>اطلع على ملف PDF الرسمي <em>Sverige i fokus</em> (يمكن تنزيله مجانًا من UHR) قبل أسبوع من الاختبار. لا تحاول حفظه.</li>
            <li>استخدم الاختبار التجريبي هنا كتمرين على تذكر المواضيع المختلطة، ثم قم بمراجعة الفصول التي فاتتك النقاط فيها.</li>
          </ol>
          <div class="ebook__factbox"><h4>ملاحظات المصدر الحالية</h4><p>المصادر التي تم الوصول إليها بتاريخ 2026-05-19:${officialTestSourceLinks()}</p></div>
        `,
        ckb: `<h2>دۆخی فەرمی ئێستا</h2>
          <p>UHR دەڵێت یەکەم دانیشتنی زانیاری مەدەنی لە 15ی ئابی 2026 لە ستۆکهۆڵم بەڕێوەدەچێت. نامەیەکی Migrationsverket پێویستە: تەنها ئەو کەسانەی کە نامەیەک لە Migrationsverket وەردەگرن دەتوانن ناویان تۆمار بکەن.</p>
          <p>کورسییەکان سنووردارە. دانیشتنی مانگی ئاب بێ بەرامبەرە و UHR دەڵێت بەشداربووان کاتێکی بەخشندەیان دەبێت.</p>
          <h2>وردەکارییە پراکتیکییەکان لە UHR</h2>ەوە هەڵپەسێردراون
          <p>هێشتا UHR کات و شوێنی وردی بڵاو نەکردۆتەوە. ئەم ئەپە بۆ پراکتیزەکردنی نافەرمی بەکاربهێنە، و UHR و Migrationsverket بەکاربهێنە بۆ ئەو ڕێنماییانەی کە کاریگەرییان لەسەر کەیسی خۆت هەیە.</p>
          <h2>چۆن ئێستا بخوێنین</h2>
          <ol>
            <li>لانی کەم جارێک ئەم کتێبە ئەلیکترۆنییە لە کۆتاییەوە بۆ کۆتایی بخوێنەرەوە. بۆ کونکردنی ئەوەی لەبیرت کردووە تابی Practice بەکاربهێنە.</li>
            <li>بۆ هەر ڕاستییەک کە دوو جار هەڵە دەکەیت، لەسەر کارتێک بینووسە و لەسەر سەلاجە بیچەسپێنەر. شەرمەزاری مامۆستایەکی گەورەیە.</li>
            <li>هەفتەیەک پێش تاقیکردنەوەکە لە PDFی فەرمی <em>Sverige i fokus</em> (دابەزاندنی بێبەرامبەر لە UHR) تێپەڕێنە. هەوڵ مەدە لەبیری بکەیت.</li>
            <li>لێرەدا تاقیکردنەوەی ساختە وەک پرۆڤەیەک بۆ بیرهێنانەوەی بابەتێکی تێکەڵ بەکاربهێنە، پاشان سەردانی ئەو بابەتانە بکەرەوە کە خاڵەکانت لەدەستداوە.</li>
          </ol>
          <div class="ebook__factbox"><h4>تێبینییەکانی سەرچاوەی ئێستا</h4><p>سەرچاوەکانی دەستگەیشتن بە 2026-05-19:${officialTestSourceLinks()}</p></div>
        `,
        fa: `<h2>وضعیت رسمی فعلی</h2>
          <p>UHR می گوید اولین نشست دانش مدنی در 15 اوت 2026 در استکهلم برگزار خواهد شد. نامه Migrationsverket لازم است: فقط افرادی که نامه ای از Migrationsverket دریافت می کنند می توانند ثبت نام کنند.</p>
          <p>صندلی ها محدود است. جلسه اوت رایگان است و UHR می گوید شرکت کنندگان وقت سخاوتمندانه ای خواهند داشت.</p>
          <h2>جزئیات عملی در انتظار UHR</h2>
          <p>UHR هنوز زمان و مکان دقیق را منتشر نکرده است. از این برنامه برای تمرین غیررسمی استفاده کنید، و از UHR و Migrationsverket برای دستورالعمل‌هایی که بر پرونده شما تأثیر می‌گذارد استفاده کنید.</p>
          <h2>چگونه اکنون مطالعه کنیم</h2>
          <ol>
            <li>حداقل یک بار این کتاب الکترونیکی را از انتها تا انتها بخوانید. از برگه تمرین استفاده کنید تا چیزهایی را که فراموش کرده اید مشخص کنید.</li>
            <li>برای هر حقیقتی که دو بار اشتباه کردید، آن را روی یک کارت بنویسید و روی یخچال بچسبانید. خجالت معلم بزرگی است.</li>
            <li>یک هفته قبل از آزمون، PDF رسمی <em>Sverige i fokus</em> (دانلود رایگان از UHR) را از بین ببرید. سعی نکنید آن را حفظ کنید.</li>
            <li>از امتحان آزمایشی در اینجا به عنوان تمرینی برای یادآوری موضوعات مختلط استفاده کنید، سپس به فصل هایی که در آن نقاط از دست داده اید، دوباره مراجعه کنید.</li>
          </ol>
          <div class="ebook__factbox"><h4>یادداشت‌های منبع کنونی</h4><p>منابع مورد دسترسی 19/05/2026:${officialTestSourceLinks()}</p></div>
        `,
        pl: `<h2>Aktualny stan oficjalny</h2>
          <p>UHR twierdzi, że pierwsze posiedzenie poświęcone wiedzy obywatelskiej odbędzie się 15 sierpnia 2026 r. w Sztokholmie. Wymagany jest list Migrationsverket: mogą zarejestrować się tylko osoby, które otrzymają list od Migrationsverket.</p>
          <p>Miejsca są ograniczone. Sierpniowe posiedzenie jest bezpłatne, a UHR twierdzi, że uczestnicy będą mieli mnóstwo czasu.</p>
          <h2>Praktyczne szczegóły w oczekiwaniu na UHR</h2>
          <p>UHR nie opublikowało jeszcze dokładnego czasu i miejsca. Użyj tej aplikacji do nieoficjalnej praktyki, a UHR i Migrationsverket uzyskają instrukcje dotyczące Twojej sprawy.</p>
          <h2>Jak się teraz uczyć</h2>
          <ol>
            <li>Przeczytaj tego ebooka od początku do końca przynajmniej raz. Skorzystaj z karty Ćwicz, aby ćwiczyć to, o czym zapomniałeś.</li>
            <li>Każdy fakt, w którym pomylisz się dwa razy, zapisz to na kartce i przyklej na lodówce. Wstyd jest świetnym nauczycielem.</li>
            <li>Przejrzyj oficjalny plik <em>Sverige i fokus</em> PDF (do pobrania bezpłatnie z UHR) na tydzień przed testem. Nie próbuj tego zapamiętywać.</li>
            <li>Potraktuj egzamin próbny jako próbę przypomnienia sobie zagadnień mieszanych, a następnie wróć do rozdziałów, w których przegapiłeś punkty.</li>
          </ol>
          <div class="ebook__factbox"><h4>Aktualne notatki źródłowe</h4><p>Źródła udostępnione 19.05.2026:${officialTestSourceLinks()}</p></div>
        `,
        so: `
          <h2>Xaalada rasmiga ah ee hadda</h2>
          <p>UHR ayaa sheegtay in fadhigii ugu horeeyay ee aqoonta bulshada lagu qaban doono 15ka Agoosto 2026 magaalada Stockholm. Warqadda Migrationsverket ayaa loo baahan yahay: kaliya dadka warqad ka hela Migrationsverket ayaa is qori kara.</p>
          <p>Kuraasta ayaa xadidan. Fadhiga Agoosto waa lacag la'aan, UHRna waxay leedahay ka qaybgalayaashu waxay heli doonaan waqti deeqsinimo ah.</p>
          <h2>Faahfaahin wax ku ool ah ayaa laga sugayaa UHR</h2>
          <p>UHR weli ma daabicin wakhtiga iyo goobta saxda ah. U isticmaal abkan dhaqan aan rasmi ahayn, oo UHR iyo Migrationsverket u isticmaal tilmaamaha saameeya kiiskaaga.</p>
          <h2>Sida hadda wax loo barto</h2>
          <ol>
            <li>Akhri ebook-kan dhammaadka-ilaa-dhamaadka ugu yaraan hal mar. Isticmaal tab Practice si aad u qoddo waxaad illowday.</li>
            <li>Xaqiiq kasta oo aad laba jeer khalad gasho, ku qor kaar oo ku dheji talaajadda. Xishoodku waa macalin weyn.</li>
            <li>Maskaxda ku hay<em>Sverige iyo fokus</em>PDF (ka soo degista bilaashka ah ee UHR) usbuuc ka hor imtixaanka. Ha isku dayin inaad xafiddo.</li>
            <li>U isticmaal imtixaanka jeesjeeska ah ee halkan ku celcelin ahaan dib u xasuusinta mawduucyada isku dhafan, ka dibna dib u eeg cutubyada aad dhibcooyinka seegtay.</li>
          </ol>
          <div class="ebook__factbox"><h4>Qoraallada isha hadda</h4><p>Sources accessed 2026-05-19: ${officialTestSourceLinks()}</p></div>

        `,
        ti: `<h2>ናይ ሕጂ ወግዓዊ ኩነታት</h2>
          <p>UHR ናይ መጀመርታ ናይ ሲቪካዊ-ፍልጠት ኣኼባ ንዕለት 15 ነሓሰ 2026 ኣብ ስቶክሆልም ክካየድ ምዃኑ ይገልጽ። ናይ Migrationsverket ደብዳቤ የድሊ: ካብ Migrationsverket ደብዳቤ ዝረኸቡ ሰባት ጥራይ እዮም ክምዝገቡ ዝኽእሉ።</p>
          <p>መንበር ውሱን እዩ። እቲ ናይ ነሓሰ ኮፍ መበሊ ብነጻ ኮይኑ፡ UHR ተሳተፍቲ ልግሲ ዝመልኦ ግዜ ክረኽቡ እዮም ይብል።</p>
          <h2>ግብራዊ ዝርዝር ካብ UHR</h2> ይጽበ ኣሎ።
          <p>UHR ገና ትኽክለኛ ሰዓትን ቦታን ኣይዘርግሐን። ነዚ ኣፕ ንዘይወግዓዊ ልምምድ ተጠቐመሉ፣ ንናይ ገዛእ ርእስኻ ጉዳይ ዝጸሉ መምርሒታት ድማ UHRን Migrationsverketን ተጠቐም።</p>
          <h2>ሕጂ ከመይ ጌርካ ትመሃር</h2>
          <ol> ዝብል ጽሑፍ ኣሎ።
            <li>ነዚ ኢ-መጽሓፍ ካብ መወዳእታ ክሳብ መወዳእታ እንተወሓደ ሓደ ግዜ ኣንብቦ። ነቲ ዝረሳዕካዮ ንምኹዓት ነቲ ልምምድ ዝብል ትብ ተጠቐም።</li>
            <li>ንነፍሲ ወከፍ ክልተ ግዜ ዝተጋገኻ ሓቂ፡ ኣብ ካርድ ጽሒፍካ ኣብ ፍሪጅ ምልጣፍ። ሕፍረት ዓቢ መምህር እዩ።</li>
            <li>ቅድሚ ፈተና ኣብ ዝነበረ ሰሙን ነቲ ወግዓዊ <em>Sverige i fokus</em> PDF (ካብ UHR ብነጻ ምውራድ) ስኪም ግበሩ። ክትዝክሮ ኣይትፈትን።</li>
            <li>ኣብዚ ዘሎ ናይ ሞክ ፈተና ከም ልምምድ ንዝተሓዋወሰ ኣርእስቲ ምዝካር ተጠቐመሉ፣ ድሕሪኡ ነተን ነጥብታት ዝሰኣንካለን ምዕራፋት ዳግማይ ምብጻሕ።</li>
          </ol> ዝብል ጽሑፍ ኣሎ።
          <div class="ebook__factbox"><h4>ናይ ሕጂ ምንጪ መዘኻኸሪታት</h4><p>ዝተረኽበ ምንጭታት 2026-05-19:${officialTestSourceLinks()}</p></div>
        `,
        tr: `<h2>Mevcut resmi durum</h2>
          <p>UHR, ilk yurttaşlık bilgisi toplantısının 15 Ağustos 2026'da Stockholm'de yapılacağını söyledi. Migrationsverket mektubu gereklidir: Yalnızca Migrationsverket'ten mektup alan kişiler kaydolabilir.</p>
          <p>Koltuklar sınırlıdır. Ağustos oturumu ücretsizdir ve UHR, katılımcıların bol zaman ayıracağını söylüyor.</p>
          <h2>UHR'den beklenen pratik ayrıntılar</h2>
          <p>UHR henüz kesin zamanı ve yeri yayınlamadı. Bu uygulamayı resmi olmayan uygulamalar için kullanın ve kendi durumunuzu etkileyecek talimatlar için UHR ve Migrationsverket'i kullanın.</p>
          <h2>Şimdi nasıl ders çalışılır</h2>
          <ol>
            <li>Bu e-kitabı en az bir kez baştan sona okuyun. Unuttuklarınızı detaylandırmak için Alıştırma sekmesini kullanın.</li>
            <li>İki kez yanlış yaptığınız her gerçeği bir karta yazın ve buzdolabına yapıştırın. Utanç harika bir öğretmendir.</li>
            <li>Testten önceki hafta resmi <em>Sverige i fokus</em> PDF'sine (UHR'den ücretsiz indirilebilir) göz atın. Ezberlemeye çalışmayın.</li>
            <li>Buradaki deneme sınavını, karışık konuların hatırlanması için bir prova olarak kullanın, ardından kaçırdığınız noktaları tekrar ziyaret edin.</li>
          </ol>
          <div class="ebook__factbox"><h4>Mevcut kaynak notları</h4><p>19.05.2026'da erişilen kaynaklar:${officialTestSourceLinks()}</p></div>
        `,
        uk: `<h2>Поточний офіційний статус</h2>
          <p>UHR повідомляє, що перше засідання громадянських знань відбудеться 15 серпня 2026 року в Стокгольмі. Потрібен лист від Migrationsverket: зареєструватися можуть лише люди, які отримали лист від Migrationsverket.</p>
          <p>Кількість місць обмежена. Серпневе засідання є безкоштовним, і UHR каже, що учасники матимуть багато часу.</p>
          <h2>Практичні деталі очікують від UHR</h2>
          <p>Точного часу та місця УГР поки не опублікувала. Використовуйте цю програму для неофіційної практики та використовуйте UHR і Migrationsverket для отримання інструкцій, які стосуються вашої справи.</p>
          <h2>Як навчатися зараз</h2>
          <ol>
            <li>Прочитайте цю електронну книгу від кінця до кінця принаймні один раз. Використовуйте вкладку «Практика», щоб відпрацювати те, що ви забули.</li>
            <li>Кожний факт, який ви двічі помилилися, запишіть на картці та поклейте на холодильник. Збентеження — чудовий учитель.</li>
            <li>Переглянути офіційний <em>Sverige i fokus</em> PDF (безкоштовно завантажити з UHR) за тиждень до іспиту. Не намагайтеся запам'ятати це.</li>
            <li>Використовуйте пробний іспит тут як репетицію для пригадування змішаних тем, а потім перегляньте розділи, де ви пропустили очки.</li>
          </ol>
          <div class="ebook__factbox"><h4>Примітки до поточного джерела</h4><p>Джерела доступні 2026-05-19:${officialTestSourceLinks()}</p></div>
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
        'zh-Hans': `<h2>传统发生变化</h2>
          <p>传统是一个群体共有的习惯：节日、歌曲、食物、衣服、仪式或聚会方式。传统可以古老而不会被冻结。人们搬家，家庭团聚，新的习俗成为瑞典日常生活的一部分。</p>
          <p>这就是为什么本章不是“真实”和“非真实”瑞典性的列表。它是一个包含共同参考点的日历：出现在学校、工作、公共生活和公民学习材料中的假期和仪式。</p>
          <h2>国庆节和公民仪式</h2>
          <p>瑞典国庆日是 6 月 6 日。它与 1523 年古斯塔夫·瓦萨 (Gustav Vasa) 当选国王和 1809 年政府文书有关。今天升起旗帜，举行演讲，许多城市在仪式上欢迎瑞典新公民。</p>
          <h2>春季和夏季</h2>
          <ul>
            <li><b>复活节</b>发生在三月或四月，具有基督教根源，尽管许多人将其作为家庭和春季假期来庆祝。</li>
            <li><b>沃尔普吉斯之夜</b>，4 月 30 日，通常意味着篝火和歌声迎接春天。</li>
            <li><b>5 月 1 日</b>是国际劳动节，以示威和政治演讲为标志。</li>
            <li><b>仲夏夜</b>始终是 6 月 19 日至 25 日之间的星期五，举办户外聚会、花圈、仲夏杆、鲱鱼、新土豆和草莓。</li>
          </ul>
          <h2>秋冬</h2>
          <ul>
            <li><b>诸圣节</b>是许多人在坟墓前点燃蜡烛以纪念已故亲友的日子。</li>
            <li><b>降临节</b>是圣诞节前的四个星期日。许多家庭使用降临节蜡烛、星星或日历。</li>
            <li><b>圣露西亚</b>，12 月 13 日，是一年中最黑暗时期的光明节，通常伴随着游行、蜡烛和歌声。</li>
            <li><b>圣诞节</b>源于基督教，也是一个重要的家庭节日。在瑞典，主要的庆祝活动通常是 12 月 24 日平安夜。</li>
            <li><b>除夕夜</b>，即 12 月 31 日，人们通常会在午夜举行晚宴、聚会和燃放烟花来庆祝。</li>
          </ul>
          <h2>新传统</h2>
          <p>移民为瑞典公共生活增添了更多明显的传统。开斋节、努鲁孜节、新鲁孜节、排灯节和其他庆祝活动可能会出现在学校、工作场所、社区和城市活动中。重要的模式很简单：传统可以传播和适应。</p>${ebookFactBox('zh-Hans', null, '国庆节：6月6日 · 沃尔普吉斯之夜：4月30日 · 仲夏夜：6月19日至25日之间的星期五 · 露西亚：12月13日 · 平安夜：12月24日。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>傳統發生變化</h2>
          <p>傳統是一個群體共有的習慣：節慶、歌曲、食物、衣服、儀式或聚會方式。傳統可以古老而不會被凍結。人們搬家，家庭團聚，新的習俗成為瑞典日常生活的一部分。 </p>
          <p>這就是為什麼本章不是「真實」和「非真實」瑞典性的清單。它是一個包含共同參考點的日曆：出現在學校、工作、公共生活和公民學習材料中的假期和儀式。 </p>
          <h2>國慶日與公民儀式</h2>
          <p>瑞典國慶日是 6 月 6 日。它與 1523 年古斯塔夫·瓦薩 (Gustav Vasa) 當選國王和 1809 年政府文書有關。今天升起旗幟，舉行演講，許多城市在儀式上歡迎瑞典新公民。 </p>
          <h2>春季和夏季</h2>
          <ul>
            <li><b>復活節</b>發生在三月或四月，具有基督教根源，儘管許多人將其作為家庭和春季假期來慶祝。 </li>
            <li><b>沃爾普吉斯之夜</b>，4 月 30 日，通常意味著篝火和歌聲迎接春天。 </li>
            <li><b>5 月 1 日</b>是國際勞動節，以示威和政治演講為標誌。 </li>
            <li><b>仲夏夜</b>總是 6 月 19 日至 25 日之間的星期五，舉辦戶外聚會、花圈、仲夏桿、鯡魚、新馬鈴薯和草莓。 </li>
          </ul>
          <h2>秋冬</h2>
          <ul>
            <li><b>諸聖節</b>是許多人在墳墓前點燃蠟燭以紀念已故親友的日子。 </li>
            <li><b>降臨節</b>是聖誕節前的四個星期日。許多家庭使用降臨節蠟燭、星星或日曆。 </li>
            <li><b>聖露西亞</b>，12 月 13 日，是一年中最黑暗時期的光明節，通常伴隨著遊行、蠟燭和歌聲。 </li>
            <li><b>聖誕節</b>源自基督教，也是一個重要的家庭節日。在瑞典，主要的慶祝活動通常是 12 月 24 日平安夜。 </li>
            <li><b>除夕夜</b>，即 12 月 31 日，人們通常會在午夜舉行晚宴、聚會和燃放煙火來慶祝。 </li>
          </ul>
          <h2>新傳統</h2>
          <p>移民為瑞典公共生活增添了更多明顯的傳統。開齋節、努魯孜節、新魯孜節、排燈節和其他慶祝活動可能會出現在學校、工作場所、社區和城市活動中。重要的模式很簡單：傳統可以傳播和適應。 </p>${ebookFactBox('zh-Hant', null, '國慶日：6月6日 · 沃爾普吉斯之夜：4月30日 · 仲夏夜：6月19日至25日之間的星期五 · 露西亞：12月13日 · 平安夜：12月24日。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>تتغير التقاليد</h2>
          <p>التقليد هو عادة مشتركة بين مجموعة: عطلة، أغنية، طعام، ملابس، حفل، أو طريقة للتجمع. يمكن للتقاليد أن تكون قديمة دون أن تتجمد. يتنقل الناس، وتختلط العائلات، وتصبح العادات الجديدة جزءًا من الحياة اليومية في السويد.</p>
          <p>ولهذا السبب فإن هذا الفصل ليس قائمة بالسويدية "الحقيقية" و"غير الحقيقية". وهو عبارة عن تقويم للنقاط المرجعية المشتركة: العطلات والطقوس التي تظهر في المدرسة والعمل والحياة العامة ومواد الدراسة المدنية.</p>
          <h2>اليوم الوطني والاحتفالات المدنية</h2>
          <p>اليوم الوطني للسويد هو 6 يونيو. وهو مرتبط بانتخاب غوستاف فاسا ملكًا في عام 1523 وصك الحكم في عام 1809. واليوم يتم رفع الأعلام وإلقاء الخطب، وترحب العديد من البلديات بالمواطنين السويديين الجدد في الاحتفالات.</p>
          <h2>الربيع والصيف</h2>
          <ul>
            <li><b>عيد الفصح</b> يصادف شهر مارس أو أبريل وله جذور مسيحية، على الرغم من أن العديد من الأشخاص يحتفلون به كعطلة عائلية وعطلة ربيعية.</li>
            <li><b>ليلة والبورجيس</b>، 30 أبريل، غالبًا ما تعني إشعال النيران والأغاني التي ترحب بالربيع.</li>
            <li><b>الأول من مايو</b> هو يوم العمال العالمي، والذي يتميز بالمظاهرات والخطابات السياسية.</li>
            <li><b>عشية منتصف الصيف</b> هي دائمًا يوم جمعة بين 19 و25 يونيو، مع التجمعات في الهواء الطلق وأكاليل الزهور وعمود منتصف الصيف والرنجة والبطاطس الجديدة والفراولة.</li>
          </ul>
          <h2>الخريف والشتاء</h2>
          <ul>
            <li><b>عيد جميع القديسين</b> هو عندما يقوم العديد من الأشخاص بإشعال الشموع عند القبور لتذكر الأقارب والأصدقاء الذين ماتوا.</li>
            <li><b>المجيء</b> هو أيام الآحاد الأربعة التي تسبق يوم عيد الميلاد. تستخدم العديد من المنازل شموع Advent أو النجوم أو التقويمات.</li>
            <li><b>لوسيا</b>، يوم 13 ديسمبر، يدور حول الضوء في أحلك جزء من العام، وغالبًا ما يكون ذلك مصحوبًا بالمواكب والشموع والغناء.</li>
            <li><b>عيد الميلاد</b> له جذور مسيحية وهو أيضًا عطلة عائلية رئيسية. في السويد، يكون الاحتفال الرئيسي عادة هو ليلة عيد الميلاد، 24 ديسمبر.</li>
            يتم الاحتفال <li><b>بليلة رأس السنة الجديدة</b>، الموافق 31 ديسمبر، عادةً بحفلات العشاء والحفلات والألعاب النارية عند منتصف الليل.</li>
          </ul>
          <h2>تقاليد جديدة</h2>
          <p>لقد أضافت الهجرة تقاليد أكثر وضوحًا إلى الحياة العامة السويدية. قد تظهر عيد الفطر ونوروز ونوروز وديوالي وغيرها من الاحتفالات في المدارس وأماكن العمل والأحياء وأحداث المدينة. النمط المهم بسيط: التقاليد يمكن أن تنتقل وتتكيف.</p>${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · ليلة فالبورجي: 30 أبريل · عشية منتصف الصيف: الجمعة بين 19 و25 يونيو · لوسيا: 13 ديسمبر · عشية عيد الميلاد: 24 ديسمبر.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>نەریتەکان دەگۆڕدرێن</h2>
          <p>نەریت خوویەک کە گروپێک هاوبەشی دەکات: جەژن، گۆرانی، خواردن، جل و بەرگ، ڕێوڕەسمێک، یان ڕێگەیەک بۆ کۆبوونەوە. نەریتەکان دەتوانن کۆن بن بەبێ ئەوەی بەستوو بن. خەڵک دەجووڵێن، خێزان تێکەڵاو دەبن و داب و نەریتی نوێ دەبنە بەشێک لە سویدی ڕۆژانە.</p>
          <p>هەر بۆیە ئەم بابەتە لیستی سویدیبوونی "ڕاستەقینە" و "ناڕاستەقینە" نییە. ساڵنامەیەک لە خاڵە ئاماژەییە باوەکان: ئەو جەژن و ڕێوڕەسمانانەی کە لە قوتابخانە، کار، ژیانی گشتی و مادەی خوێندنی مەدەنیدا دەردەکەون.</p>
          <h2>ڕۆژی نیشتمانی و ڕێوڕەسمی مەدەنی</h2>
          <p>ڕۆژی نیشتمانی سوید ٦ی حوزەیرانە. پەیوەستە بە هەڵبژاردنی گوستاڤ ڤاسا وەک پاشا لە ساڵی ١٥٢٣ و ئامرازی حکومەت لە ساڵی ١٨٠٩. ئەمڕۆ ئاڵا هەڵدەگیرێت و وتار دەدرێن و زۆرێک لە شارەوانییەکان لە مەراسیمەکاندا پێشوازی لە هاووڵاتیانی نوێی سویدی دەکەن.</p>
          <h2>بەهار و هاوین</h2>
          <ul>
            <li><b>جەژنی جەژنی ئیستەر</b> دەکەوێتە مانگی ئازار یان نیسان و ڕەگ و ڕیشەی مەسیحی هەیە، هەرچەندە زۆر کەس وەک پشوویەکی خێزانیی و بەهار ئاهەنگی دەگێڕن.</li>
            <li><b>شەوی والپورگیس</b>، ٣٠ی نیسان، زۆرجار بە واتای ئاگر و گۆرانی پێشوازیکردن لە بەهار دێت.</li>
            <li><b>یەکەم مانگی ئایار</b> ڕۆژی جیهانی کرێکارانە، کە بە خۆپیشاندان و وتاری سیاسی بەڕێوەدەچێت.</li>
            <li><b>شەوی ناوەڕاستی هاوین</b> هەمیشە هەینییە لە نێوان ١٩ بۆ ٢٥ی حوزەیران، لەگەڵ کۆبوونەوەی دەرەوە، تاجە گوڵینە، جەمسەرێکی ناوەڕاستی هاوین، هێرینگ، پەتاتەی نوێ و شووتی.</li>
          </ul>
          <h2>پایز و زستان</h2>
          <ul>
            <li><b>ڕۆژی هەموو پیرۆزەکان</b> کاتێکە کە زۆر کەس مۆم لەسەر گۆڕەکان داگیرسێنن بۆ یادکردنەوەی خزم و هاوڕێیان کە مردوون.</li>
            <li><b>هاتن</b> چوار یەکشەممەیە پێش ڕۆژی کریسمس. زۆرێک لە ماڵەکان مۆم، ئەستێرە، یان ساڵنامەی ئەدڤێنت بەکاردەهێنن.</li>
            <li><b>لوسیا</b>، ١٣ی کانوونی دووەم، باس لە ڕووناکی دەکات لە تاریکترین بەشەکانی ساڵدا، زۆرجار بە کاروان و مۆم و گۆرانی.</li>
            <li><b>کریسمس</b> ڕەگ و ڕیشەی مەسیحی هەیە و هەروەها جەژنێکی سەرەکی خێزانییە. لە سوید ئاهەنگی سەرەکی بەزۆری شەوی یەڵدا، ٢٤ی کانوونی دووەمە.</li>
            <li><b>شەوی سەری ساڵ</b>، ٣١ی کانوونی دووەم، بە شێوەیەکی باو بە ژەمی ئێوارە و ئاهەنگ و یارییە ئاگرینەکان لە نیوەی شەودا بەڕێوەدەچێت.</li>
          </ul>
          <h2>نەریتەکانی نوێ</h2>
          <p>کۆچ نەریتی دیارتری بۆ ژیانی گشتی سوید زیاد کردووە. ڕەنگە لە قوتابخانە و شوێنی کار و گەڕەک و بۆنە و ئاهەنگەکانی شاردا ئاهەنگەکانی جەژنی ڕەمەزان و نوروز و نەورۆز و دیوالی و ئاهەنگەکانی تر دەربکەون. نەخشە گرنگەکە سادەیە: نەریتەکان دەتوانن گەشت بکەن و خۆیان لەگەڵ خۆیان بگونجێنن.</p>${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: ٦ی حوزەیران · شەوی والپورگیس: ٣٠ی نیسان · شەوی ناوەڕاستی هاوین: هەینی لە نێوان ١٩ و ٢٥ی حوزەیران · لوسیا: ١٣ی کانوونی دووەم · شەوی کریسمس: ٢٤ی کانوونی دووەم.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>سنت ها تغییر می کنند</h2>
          <p>یک سنت عادتی است که در یک گروه مشترک است: تعطیلات، آهنگ، غذا، لباس، مراسم، یا راهی برای جمع شدن. سنت ها می توانند قدیمی باشند بدون اینکه منجمد شوند. مردم نقل مکان می کنند، خانواده ها در هم می آمیزند و آداب و رسوم جدید بخشی از سوئد روزمره می شود.</p>
          <p>به همین دلیل است که این فصل فهرستی از سوئدی بودن "واقعی" و "غیر واقعی" نیست. این تقویمی از نقاط مرجع مشترک است: تعطیلات و آداب و رسومی که در مدرسه، کار، زندگی عمومی و مطالب مطالعات مدنی ظاهر می‌شوند.</p>
          <h2>روز ملی و مراسم مدنی</h2>
          <p>روز ملی سوئد 6 ژوئن است. این به انتخاب گوستاو واسا به عنوان پادشاه در سال 1523 و سند حکومت 1809 مرتبط است. امروز پرچم‌ها برافراشته می‌شوند، سخنرانی‌ها برگزار می‌شود و بسیاری از شهرداری‌ها از شهروندان جدید سوئدی در مراسم استقبال می‌کنند.</p>
          <h2>بهار و تابستان</h2>
          <ul>
            <li><b>عید پاک</b> در ماه مارس یا آوریل است و ریشه مسیحی دارد، اگرچه بسیاری از مردم آن را به عنوان تعطیلات خانوادگی و بهاری جشن می گیرند.</li>
            <li><b>شب والپورگیس</b>، 30 آوریل، اغلب به معنای آتش سوزی و آوازهای استقبال از بهار است.</li>
            <li><b>اول ماه مه</b> روز جهانی کارگر است که با تظاهرات و سخنرانی های سیاسی مشخص شده است.</li>
            <li><b>شب نیمه تابستان</b> همیشه بین 19 تا 25 ژوئن جمعه است، با گردهمایی در فضای باز، تاج گل، میله تابستانی، شاه ماهی، سیب زمینی جدید و توت فرنگی.</li>
          </ul>
          <h2>پاییز و زمستان</h2>
          <ul>
            <li><b>روز همه مقدسین</b> زمانی است که بسیاری از مردم بر سر قبرها شمع روشن می کنند تا به یاد خویشاوندان و دوستانی که درگذشته اند.</li>
            <li><b> ظهور</b> چهار یکشنبه قبل از روز کریسمس است. بسیاری از خانه ها از شمع ها، ستاره ها یا تقویم های ظهور استفاده می کنند.</li>
            <li><b>لوسیا</b>، 13 دسامبر، مربوط به روشنایی در تاریک ترین بخش سال است که اغلب همراه با راهپیمایی، شمع و آواز است.</li>
            <li><b>کریسمس</b> ریشه مسیحی دارد و همچنین یک تعطیلات خانوادگی مهم است. در سوئد جشن اصلی معمولاً شب کریسمس، 24 دسامبر است.</li>
            <li><b>شب سال نو</b>، 31 دسامبر، معمولاً با شام، مهمانی و آتش بازی در نیمه شب جشن گرفته می شود.</li>
          </ul>
          <h2>سنت های جدید</h2>
          <p>مهاجرت سنت های قابل مشاهده تری را به زندگی عمومی سوئد اضافه کرده است. عید فطر، نوروز، نوروز، دیوالی و جشن‌های دیگر ممکن است در مدارس، محل‌های کار، محله‌ها و رویدادهای شهر ظاهر شوند. الگوی مهم ساده است: سنت ها می توانند سفر کنند و سازگار شوند.</p>${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · شب Walpurgis: 30 آوریل · شب نیمه تابستان: جمعه بین 19 و 25 ژوئن · لوسیا: 13 دسامبر · شب کریسمس: 24 ​​دسامبر.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Tradycje się zmieniają</h2>
          <p>Tradycja to zwyczaj podzielany przez grupę: święto, piosenka, jedzenie, ubiór, ceremonia lub sposób gromadzenia się. Tradycje mogą być stare bez zamrożenia. Ludzie się przeprowadzają, rodziny mieszają się, a nowe zwyczaje stają się częścią codziennej Szwecji.</p>
          <p>Dlatego ten rozdział nie jest listą „prawdziwej” i „nieprawdziwej” szwedzkości. To kalendarz wspólnych punktów odniesienia: świąt i rytuałów pojawiających się w szkole, pracy, życiu publicznym i materiałach obywatelsko-naukowych.</p>
          <h2>Święta Narodowe i uroczystości obywatelskie</h2>
          <p>Święto Narodowe Szwecji przypada 6 czerwca. Jest to związane z wyborem Gustawa Wazy na króla w 1523 r. i dokumentem rządowym z 1809 r. Dziś wywieszane są flagi, wygłaszane są przemówienia, a wiele gmin wita podczas ceremonii nowych obywateli Szwecji.</p>
          <h2>Wiosna i lato</h2>
          <ul>
            <li><b>Wielkanoc</b> przypada na marzec lub kwiecień i ma korzenie chrześcijańskie, chociaż wiele osób obchodzi ją jako święto rodzinne i wiosenne.</li>
            <li><b>Noc Walpurgii</b>, 30 kwietnia, często kojarzy się z ogniskami i pieśniami witającymi wiosnę.</li>
            <li><b>Pierwszy maja</b> to Międzynarodowy Dzień Pracy, który obfituje w demonstracje i przemówienia polityczne.</li>
            <li><b>Wigilia Świętojańska</b> przypada zawsze w piątek między 19 a 25 czerwca i towarzyszą jej spotkania na świeżym powietrzu, wianki z kwiatów, słup letni, śledzie, młode ziemniaki i truskawki.</li>
          </ul>
          <h2>Jesień i zima</h2>
          <ul>
            <li><b>Dzień Wszystkich Świętych</b> to dzień, w którym wiele osób zapala znicze na grobach, aby upamiętnić zmarłych krewnych i przyjaciół.</li>
            <li><b>Adwent</b> to cztery niedziele poprzedzające Boże Narodzenie. W wielu domach używa się świec adwentowych, gwiazdek lub kalendarzy.</li>
            <li><b>Łucji</b>, 13 grudnia, dotyczy światła w najciemniejszej części roku, często z procesjami, świecami i śpiewem.</li>
            <li><b>Boże Narodzenie</b> ma korzenie chrześcijańskie i jest także ważnym świętem rodzinnym. W Szwecji głównym świętem jest zwykle Wigilia Bożego Narodzenia, 24 grudnia.</li>
            <li><b>Sylwester</b> 31 grudnia jest powszechnie obchodzony o północy kolacjami, przyjęciami i pokazem sztucznych ogni.</li>
          </ul>
          <h2>Nowe tradycje</h2>
          <p>Migracja dodała bardziej widoczne tradycje do szwedzkiego życia publicznego. Id al-Fitr, Nouruz, Newroz, Diwali i inne uroczystości mogą pojawiać się w szkołach, miejscach pracy, dzielnicach i wydarzeniach miejskich. Ważny wzór jest prosty: tradycje mogą podróżować i dostosowywać się.</p>${ebookFactBox('pl', null, 'Święto Narodowe: 6 czerwca · Noc Walpurgii: 30 kwietnia · Noc Świętojańska: piątek między 19 a 25 czerwca · Łucja: 13 grudnia · Wigilia: 24 grudnia.', ['uhrStudyMaterial'])}
        `,
        so: `
          <h2>Dhaqanku wuu is beddelaa</h2>
          <p>Dhaqanku waa caado ay kooxi wadaagaan: fasax, hees, cunto, dhar, xaflad, ama hab la isugu yimaado. Dhaqanku waxay noqon karaan kuwo duug ah iyada oo aan la qaboojin. Dadku way guuraan, qoysasku way isku daraan, caadooyin cusubna waxay ka mid noqdaan Iswidhan maalin kasta.</p>
          <p>Taasi waa sababta cutubkani aanu u ahayn liiska "dhabta ah" iyo "ma aha" Swedishnimada. Waa jadwal tixraaceed caadi ah: ciidaha iyo caadooyinka ka muuqda dugsiga, shaqada, nolosha guud, iyo agab-cilmiyeedka bulshada.</p>
          <h2>Maalinta Qaranka iyo xafladaha madaniga ah</h2>
          <p>Maalinta qaranka Iswiidhan waa 6 june. Waxay ku xidhan tahay doorashadii Gustav Vasa ee boqornimada ee 1523 iyo 1809 qalabkii dawladda. Maanta calanka ayaa la taagay, khudbado ayaa laga jeediyay, degmooyin badan ayaana xafladaha kusoo dhaweeyay muwaadiniinta cusub ee Sweden.</p>
          <h2>Guga iyo xagaaga</h2>
          <ul>
            <li><b>Easter</b>Waxay dhacdaa Maarso ama Abriil waxayna leedahay xididdo Masiixi ah, in kasta oo dad badani u dabaaldegaan qoys ahaan iyo fasax gu'ga.</li>
            <li><b>Habeenka Walpurgis</b>, 30ka Abriil, badanaa macneheedu waa dab-qabad iyo heeso soo dhawaynaya gu'ga.</li>
            <li><b>Kowda May</b>waa maalinta shaqaalaha aduunka oo lagu asteeyay banaanbaxyo iyo khudbado siyaasadeed.</li>
            <li><b>Habeen xagaaga</b>had iyo jeer waa jimce inta u dhaxaysa 19 iyo 25 June, oo leh isu imaatinka bannaanka, ubaxyada ubaxa, tiirka dhexe ee xagaaga, herring, baradhada cusub, iyo strawberries.</li>
          </ul>
          <h2>Dayrta iyo jiilaalka</h2>
          <ul>
            <li><b>Maalinta Awliyada oo dhan</b>waa marka dad badan ay shumac ku shidaan qabuuraha si ay u xasuustaan ​​qaraabada iyo asxaabta dhintay.</li>
            <li><b>Imaanshaha</b>waa afarta axad ee ka horeeya maalinta kirismaska. Guryo badan ayaa isticmaala shumacyada Advent, xiddigaha, ama jadwalka taariikhda.</li>
            <li><b>Lucia</b>, 13 Diisambar, waxay ku saabsan tahay iftiinka qaybta madow ee sanadka, oo badanaa leh xaflado, shumacyo, iyo heeso.</li>
            <li><b>Christmas</b>wuxuu leeyahay xidido Masiixi ah iyo sidoo kale waa fasax weyn oo qoyska ah. Dalka Iswiidan waxaa inta badan lagu qabtaa ciida Kirismaska, 24-ka December.</li>
            <li><b>Habeenka sanadka cusub</b>, 31 Diisambar, waxaa caadi ahaan loo dabaaldegaa casho, xaflado, iyo rashka saqda dhexe.</li>
          </ul>
          <h2>Dhaqan cusub</h2>
          <p>Socdaalku waxa uu nolosha guud ee Iswiidhishka ku soo kordhiyey caadooyin muuqda oo muuqda. Ciidul Fidriga, Nouruz, Newroz, Diwali, iyo dabbaaldegyo kale ayaa laga yaabaa inay ka soo muuqdaan dugsiyada, goobaha shaqada, xaafadaha, iyo dhacdooyinka magaalada. Habka muhiimka ah waa mid fudud: caadooyinku way safri karaan oo la qabsan karaan.</p>
          ${ebookFactBox('so', null, 'Maalinta Qaranka: Juun 6 · Habeenka Walpurgis: Abriil 30 · Habeenka badhtamaha: Jimcaha inta u dhaxaysa Juun 19 iyo 25 · Lucia: Diseembar 13 · Habeenka Kirismaska: Diisambar 24.', ['uhrStudyMaterial'])}

        `,
        ti: `<h2>ልምድታት ይቕየሩ</h2>
          <p>ትውፊት ሓደ ጉጅለ ዝካፈሎ ልምዲ እዩ: በዓል: ደርፊ: መግቢ: ክዳውንቲ: ስነ-ስርዓት: ወይ መገዲ ምትእኽኻብ። ልምድታት ከይተዓጽወ ኣረጊት ክኸውን ይኽእል እዩ። ሰባት ይግዕዙ፡ ስድራቤታት ይሕወሱ፡ ሓደስቲ ልምድታት ድማ ኣካል መዓልታዊ ሽወደን ይኾኑ።</p>
          <p>ስለዚ እዩ እዛ ምዕራፍ ዝርዝር "ሓቀኛ"ን "ዘይሓቀኛን" ሽወደናዊነት ዘይኮነት። ናይ ሓባር መወከሲ ነጥብታት ዝሓዘ ኣቆጻጽራ እዩ፡ ማለት ኣብ ቤት ትምህርቲ፡ ስራሕ፡ ህዝባዊ ህይወትን ሲቪካዊ-መጽናዕታዊ ጽሑፋትን ዝረኣዩ በዓላትን ስርዓታትን።</p>
          <h2>ሃገራዊ መዓልቲን ሲቪካዊ ስነ-ስርዓትን</h2>
          <p>ሃገራዊ መዓልቲ ሽወደን 6 ሰነ እዩ። ምስቲ ኣብ 1523 ጉስታቭ ቫሳ ንጉስ ኮይኑ ምምራጹን ኣብ 1809 መሳርሒ መንግስትን ዝተኣሳሰር እዩ። ሎሚ ባንዴራታት ተሰቒለን፡ መደረታት ይካየድ፡ ብዙሓት ኮሙናት ድማ ሓደስቲ ዜጋታት ሽወደን ብስነ-ስርዓት ይቕበላ።</p>
          <h2>ጽድያን ሓጋይን</h2>
          <ul> ዝብል ጽሑፍ ኣሎ።
            <li><b>በዓል ፋሲካ</b> ኣብ ወርሒ መጋቢት ወይ ሚያዝያ ዝወድቕ ኮይኑ ብዙሓት ሰባት ከም ስድራቤታውን ጽድያን በዓል እኳ እንተበዓልዎ ክርስትያናዊ ሱር ዘለዎ እዩ።</li>
            <li><b>ለይቲ ዋልፑርጊስ</b>፡ 30 ሚያዝያ፡ መብዛሕትኡ ግዜ ሓዊን ንጽድያ ዝቕበል ደርፍን ማለት እዩ።</li>
            <li><b>ቀዳማይ ወርሒ ግንቦት</b> ብሰልፍታትን ፖለቲካዊ መደረታትን ዝኽበር ኣህጉራዊ መዓልቲ ሰራሕተኛታት እዩ።</li>
            <li><b>ዋዜማ መፋርቕ ሓጋይ</b> ኩሉ ግዜ ኣብ መንጎ 19ን 25ን ሰነ ዓርቢ ኮይኑ፡ ኣብ ደገ ምትእኽኻብ፡ ዕንበባታት፡ ዓንዲ መፋርቕ ሓጋይ፡ ሄሪንግ፡ ሓድሽ ድንሽን ስትሮቤሪን ይርከብ።</li>
          </ul> ዝብል ጽሑፍ ኣሎ።
          <h2>ቀውዒን ክረምትን</h2>
          <ul> ዝብል ጽሑፍ ኣሎ።
            <li><b>መዓልቲ ኩሎም ቅዱሳን</b> ብዙሓት ሰባት ኣብ መቓብር ሽምዓ ወሊዖም ንዝሞቱ ኣዝማድን ፈተውትን ዝዝክሩሉ ዕለት እዩ።</li>
            <li><b>ምጽኣት</b> ቅድሚ መዓልቲ ልደት ዝርከባ ኣርባዕተ ሰንበት እዩ። ብዙሓት ገዛውቲ ናይ ኣድቨንት ሽምዓ፡ ከዋኽብቲ ወይ ኣቆጻጽራ ይጥቀሙ።</li>
            <li><b>ሉቺያ</b>፡ 13 ታሕሳስ፡ ብዛዕባ ብርሃን ኣብቲ ዝጸልመተ ክፋል ዓመት ኮይኑ፡ መብዛሕትኡ ግዜ ብሰልፊ፡ ሽምዓን ደርፍን እዩ።</li>
            <li><b>በዓል ልደት</b> ክርስትያናዊ ሱር ዘለዎ ኮይኑ ዓቢ ናይ ስድራቤት በዓል እውን እዩ። ኣብ ሽወደን እቲ ቀንዲ በዓል መብዛሕትኡ ግዜ ዋዜማ ልደት 24 ታሕሳስ እዩ።</li>
            <li><b>ዋዜማ ሓድሽ ዓመት</b>፡ 31 ታሕሳስ፡ ኣብ ፍርቂ ለይቲ ድራር፡ ድግስን ርችትን ምብዓል ልሙድ እዩ።</li>
          </ul> ዝብል ጽሑፍ ኣሎ።
          <h2>ሓደስቲ ልምድታት</h2>
          <p>ስደት ኣብ ህዝባዊ ህይወት ሽወደን ዝያዳ ዝርአ ልምድታት ወሲኹ። ዒድ ኣል-ፊጥር፡ ኑሩዝ፡ ኒውሮዝ፡ ዲዋሊን ካልእ በዓላትን ኣብ ኣብያተ ትምህርቲ፡ ናይ ስራሕ ቦታታት፡ ከባቢታትን ናይ ከተማ ፍጻመታትን ክቐርብ ይኽእል። እቲ ኣገዳሲ ቅዲ ቀሊል እዩ፡ ልምድታት ክጓዓዙን ክላመዱን ይኽእሉ።</p>${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ: ሰነ 6 · ዋልፑርጊስ ለይቲ: ሚያዝያ 30 · ፍርቂ ሓጋይ ዋዜማ: ዓርቢ ኣብ መንጎ ሰነ 19ን 25ን · ሉቺያ: ታሕሳስ 13 · ዋዜማ ልደት: ታሕሳስ 24.', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Gelenekler değişiyor</h2>
          <p>Gelenek, bir grup tarafından paylaşılan bir alışkanlıktır: bir tatil, şarkı, yemek, kıyafet, tören veya bir araya gelme şekli. Gelenekler dondurulmadan da eskiyebilir. İnsanlar taşınıyor, aileler karışıyor ve yeni gelenekler İsveç'in gündelik yaşamının bir parçası haline geliyor.</p>
          <p>Bu nedenle bu bölüm "gerçek" ve "gerçek olmayan" İsveçliliğin bir listesi değildir. Ortak referans noktalarından oluşan bir takvimdir: Okulda, işte, kamusal yaşamda ve yurttaşlık çalışmaları materyallerinde görülen tatiller ve ritüeller.</p>
          <h2>Ulusal Gün ve halk törenleri</h2>
          <p>İsveç'in Ulusal Günü 6 Haziran'dır. Gustav Vasa'nın 1523'te kral seçilmesi ve 1809 Hükümet Aracı ile bağlantılıdır. Bugün bayraklar göndere çekiliyor, konuşmalar yapılıyor ve birçok belediye yeni İsveç vatandaşlarını törenlerle karşılıyor.</p>
          <h2>İlkbahar ve yaz</h2>
          <ul>
            <li><b>Paskalya</b> Mart veya Nisan aylarında düşer ve birçok kişi bunu bir aile ve bahar tatili olarak kutlasa da Hıristiyan köklerine sahiptir.</li>
            <li><b>Walpurgis Gecesi</b>, 30 Nisan genellikle şenlik ateşleri ve baharı karşılayan şarkılar anlamına gelir.</li>
            <li><b>1 Mayıs</b>, gösteriler ve siyasi konuşmalarla kutlanan Uluslararası İşçi Bayramıdır.</li>
            <li><b>Yaz Ortası Arifesi</b> her zaman 19 ile 25 Haziran tarihleri arasındaki Cuma günüdür; açık hava toplantıları, çiçek çelenkleri, yaz ortası direği, ringa balığı, yeni patatesler ve çilekler bulunur.</li>
          </ul>
          <h2>Sonbahar ve kış</h2>
          <ul>
            <li><b>Tüm Azizler Günü</b>, birçok kişinin ölen akrabalarını ve arkadaşlarını anmak için mezarlarda mum yaktığı gündür.</li>
            <li><b>Advent</b>, Noel Gününden önceki dört Pazar günüdür. Birçok evde Advent mumları, yıldızları veya takvimleri kullanılır.</li>
            <li><b>Lucia</b>, 13 Aralık, genellikle tören alayları, mumlar ve şarkılarla yılın en karanlık bölümündeki ışığı konu alıyor.</li>
            <li><b>Noel</b>'in Hıristiyan kökenleri vardır ve aynı zamanda önemli bir aile tatilidir. İsveç'te ana kutlama genellikle 24 Aralık'taki Noel Arifesidir.</li>
            <li><b>Yılbaşı Gecesi</b>, yani 31 Aralık, genellikle akşam yemekleri, partiler ve gece yarısı havai fişek gösterileriyle kutlanır.</li>
          </ul>
          <h2>Yeni gelenekler</h2>
          <p>Göç, İsveç kamusal yaşamına daha görünür gelenekler kattı. Ramazan Bayramı, Nevruz, Newroz, Diwali ve diğer kutlamalar okullarda, işyerlerinde, mahallelerde ve şehir etkinliklerinde gerçekleştirilebilir. Önemli olan kalıp basittir: Gelenekler seyahat edebilir ve uyum sağlayabilir.</p>${ebookFactBox('tr', null, 'Ulusal Gün: 6 Haziran · Walpurgis Gecesi: 30 Nisan · Yaz Ortası Arifesi: 19 ile 25 Haziran arası Cuma · Lucia: 13 Aralık · Noel Arifesi: 24 Aralık.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Традиції змінюються</h2>
          <p>Традиція — це спільна для групи звичка: свято, пісня, їжа, одяг, церемонія чи спосіб збирання. Традиції можуть бути старими, не будучи замороженими. Люди переїжджають, родини змішуються, а нові звичаї стають частиною повсякденної Швеції.</p>
          <p>Ось чому цей розділ не є списком «справжнього» та «несправжнього» шведства. Це календар загальних орієнтирів: свят і ритуалів, які з’являються в школі, на роботі, у громадському житті та матеріалах для громадянського навчання.</p>
          <h2>Національний день і громадські церемонії</h2>
          <p>Національний день Швеції - 6 червня. Це пов’язано з обранням Густава Вази королем у 1523 році та Інструментом правління 1809 року. Сьогодні піднімають прапори, звучать промови, і багато муніципалітетів вітають нових громадян Швеції на церемоніях.</p>
          <h2>Весна та літо</h2>
          <ul>
            <li><b>Великдень</b> припадає на березень або квітень і має християнське коріння, хоча багато людей відзначають його як сімейне та весняне свято.</li>
            <li><b>Вальпургієва ніч</b>, 30 квітня, часто означає багаття та пісні, які вітають весну.</li>
            <li><b>Перше травня</b> — День міжнародної солідарності трудящих, який відзначається демонстраціями та політичними виступами.</li>
            <li><b>Напередодні середини літа</b> завжди припадає на п’ятницю з 19 по 25 червня, де проводяться збори на відкритому повітрі, квіткові вінки, жердина середини літа, оселедець, молода картопля та полуниця.</li>
          </ul>
          <h2>Осінь і зима</h2>
          <ul>
            <li><b>День усіх святих</b> – це час, коли багато людей запалюють свічки на могилах, щоб згадати родичів і друзів, які померли.</li>
            <li><b>Адвент</b> — це чотири неділі перед Різдвом. У багатьох домівках використовують адвентні свічки, зірки чи календарі.</li>
            <li><b>Лусія</b>, 13 грудня, означає світло в найтемнішу пору року, часто з процесіями, свічками та співами.</li>
            <li><b>Різдво</b> має християнське коріння, а також є головним сімейним святом. У Швеції головним святом зазвичай є Святвечір, 24 грудня.</li>
            <li><b>Новорічний вечір</b>, 31 грудня, зазвичай святкують обідами, вечірками та феєрверками опівночі.</li>
          </ul>
          <h2>Нові традиції</h2>
          <p>Міграція додала більш помітних традицій у суспільне життя Швеції. Ід аль-Фітр, Нуруз, Ньюроз, Дівалі та інші свята можуть відзначатися в школах, на робочих місцях, у районах і на міських заходах. Важлива схема проста: традиції можуть подорожувати та адаптуватися.</p>${ebookFactBox('uk', null, "Національний день: 6 червня · Вальпургієва ніч: 30 квітня · Святвечір: п'ятниця між 19 і 25 червня · Лючія: 13 грудня · Святвечір: 24 грудня.", ['uhrStudyMaterial'])}
        `,
      },
    },
  };

  const EBOOK_READER_I18N_FALLBACKS = Object.freeze({
    5: {
      title: {
        'zh-Hans': '平等',
        'zh-Hant': '平等',
        ar: 'المساواة',
        ckb: 'یەکسانی',
        fa: 'برابری',
        pl: 'Równość',
        so: 'Sinnaan',
        ti: 'ማዕርነት',
        tr: 'Eşitlik',
        uk: 'Рівність',
      },
      title_em: {
        'zh-Hans': '与现代家庭。',
        'zh-Hant': '與現代家庭。',
        ar: 'والأسرة الحديثة.',
        ckb: 'و ماڵی هاوچەرخ.',
        fa: 'و خانوادهٔ مدرن.',
        pl: 'i nowoczesne gospodarstwo domowe.',
        so: 'iyo guriga casriga ah.',
        ti: 'እና ዘመናዊ ስድራቤት።',
        tr: 've modern hane.',
        uk: 'і сучасне домогосподарство.',
      },
      lede: {
        'zh-Hans': '瑞典是一个安静的女权主义项目。法律比餐桌谈话更清楚，但两者都值得了解。',
        'zh-Hant': '瑞典是一個安靜的女性主義計畫。法律比餐桌談話更清楚，但兩者都值得了解。',
        ar: 'السويد مشروع نسوي هادئ. القوانين أوضح من أحاديث مائدة العشاء، لكن كليهما يستحق المعرفة.',
        ckb: 'سوید پڕۆژەیەکی فێمینیستی ئارامە. یاساکان لە گفتوگۆی سەر خوان ڕوونترن، بەڵام هەردووکیان گرنگن.',
        fa: 'سوئد یک پروژهٔ آرام فمینیستی است. قانون‌ها از گفت‌وگوهای سر میز شام روشن‌ترند، اما هر دو ارزش دانستن دارند.',
        pl: 'Szwecja jest cichym projektem feministycznym. Prawo jest jaśniejsze niż rozmowy przy stole, ale jedno i drugie warto znać.',
        so: 'Iswiidhan waa mashruuc dumarnimo oo deggan. Shuruucdu way ka caddahay sheekada miiska cashada, laakiin labaduba waa muhiim in la ogaado.',
        ti: 'ሽወደን ጸጥ ዝበለ ፕሮጀክት ማዕርነት ደቂ ኣንስትዮ እያ። ሕግታት ካብ ዘተ መኣዲ ዝበለጸ ንጹር እዮም፣ ግን ክልቲኦም ምፍላጦም ይጠቅም።',
        tr: 'İsveç sessiz bir feminist projedir. Yasalar yemek masası sohbetlerinden daha nettir ama ikisini de bilmek gerekir.',
        uk: 'Швеція — тихий феміністичний проєкт. Закони чіткіші за розмови за вечерею, але варто знати і те, й інше.',
      },
    },
    6: {
      title: {
        'zh-Hans': '社会、学校',
        'zh-Hant': '社會、學校',
        ar: 'المجتمع والمدرسة',
        ckb: 'کۆمەڵگا و قوتابخانە',
        fa: 'جامعه، مدرسه',
        pl: 'Społeczeństwo, szkoła',
        so: 'Bulshada, dugsiga',
        ti: 'ሕብረተሰብ፣ ቤት ትምህርቲ',
        tr: 'Toplum, okul',
        uk: 'Суспільство, школа',
      },
      title_em: {
        'zh-Hans': '与医疗。',
        'zh-Hant': '與醫療。',
        ar: 'والرعاية الصحية.',
        ckb: 'و چاودێری تەندروستی.',
        fa: 'و بهداشت و درمان.',
        pl: 'i opieka zdrowotna.',
        so: 'iyo daryeelka caafimaadka.',
        ti: 'እና ክንክን ጥዕና።',
        tr: 've sağlık hizmetleri.',
        uk: 'і охорона здоровʼя.',
      },
      lede: {
        'zh-Hans':
          '瑞典通过公共部门处理生活中许多琐碎但重要的部分——学校、医疗、老人照护——并且与官僚机构保持相当日常的关系。',
        'zh-Hant':
          '瑞典透過公共部門處理生活中許多瑣碎但重要的部分——學校、醫療、老人照護——並且與官僚機構保持相當日常的關係。',
        ar: 'تدير السويد الأجزاء المملة والمهمة من الحياة — المدرسة والرعاية الصحية ورعاية المسنين — عبر القطاع العام، وتتعامل مع البيروقراطية كجزء يومي من الحياة.',
        ckb: 'سوید بەشی بێزارکەر بەڵام گرنگی ژیان — قوتابخانە، تەندروستی و چاودێری پیران — لە ڕێی کەرتی گشتیەوە بەڕێوە دەبات.',
        fa: 'سوئد بخش‌های عادی اما مهم زندگی — مدرسه، درمان و مراقبت از سالمندان — را از راه بخش عمومی اداره می‌کند.',
        pl: 'Szwecja prowadzi nudne, ale ważne części życia — szkołę, ochronę zdrowia i opiekę nad seniorami — przez sektor publiczny.',
        so: 'Iswiidhan waxay qaybaha muhiimka ah ee nolosha — dugsiga, caafimaadka iyo daryeelka waayeelka — ku maamushaa adeegyada guud.',
        ti: 'ሽወደን ናይ ዕለታዊ ህይወት ኣገዳሲ ክፋላት — ቤት ትምህርቲ፣ ጥዕና፣ ክንክን ኣረጋውያን — ብመንግስታዊ ኣገልግሎት ትመሓድር።',
        tr: 'İsveç hayatın sıkıcı ama önemli kısımlarını — okul, sağlık ve yaşlı bakımı — kamu sektörü üzerinden yürütür.',
        uk: 'Швеція організовує буденні, але важливі частини життя — школу, медицину й догляд за літніми людьми — через публічний сектор.',
      },
    },
    7: {
      title: {
        'zh-Hans': '自然、气候',
        'zh-Hant': '自然、氣候',
        ar: 'الطبيعة والمناخ',
        ckb: 'سروشت و کەشوهەوا',
        fa: 'طبیعت، اقلیم',
        pl: 'Przyroda, klimat',
        so: 'Dabeecadda, cimilada',
        ti: 'ተፈጥሮ፣ ክሊማ',
        tr: 'Doğa, iklim',
        uk: 'Природа, клімат',
      },
      title_em: {
        'zh-Hans': '与 allemansrätten。',
        'zh-Hant': '與 allemansrätten。',
        ar: 'وحق الوصول العام.',
        ckb: 'و مافی گەیشتنی گشتی.',
        fa: 'و حق دسترسی عمومی.',
        pl: 'i allemansrätten.',
        so: 'iyo xaqa gelitaanka guud.',
        ti: 'እና allemansrätten።',
        tr: 've allemansrätten.',
        uk: 'і allemansrätten.',
      },
      lede: {
        'zh-Hans': '瑞典大部分是森林，而森林在很大程度上向你开放。规则很简单：不要打扰，不要破坏。',
        'zh-Hant': '瑞典大部分是森林，而森林在很大程度上向你開放。規則很簡單：不要打擾，不要破壞。',
        ar: 'السويد في معظمها غابات، والغابة مفتوحة لك إلى حد كبير. القاعدة بسيطة: لا تزعج ولا تدمّر.',
        ckb: 'زۆربەی سوید دارستانە، و دارستانەکە زۆرجار بۆ تۆ کراوەیە. یاساکە سادەیە: مزاحم مەبە، وێران مەکە.',
        fa: 'بخش بزرگی از سوئد جنگل است و جنگل تا حد زیادی برای شما باز است. قاعده ساده است: مزاحم نشوید و تخریب نکنید.',
        pl: 'Szwecja to w dużej mierze las, a las jest w dużym stopniu otwarty dla ciebie. Zasada jest prosta: nie przeszkadzaj i nie niszcz.',
        so: 'Iswiidhan badankeeda waa kayn, kayntuna inta badan way kuu furan tahay. Xeerku waa fudud yahay: ha dhibin, hana burburin.',
        ti: 'ሽወደን መብዛሕትኣ ዱር እያ፣ እቲ ዱር ድማ ብዙሕ ግዜ ክፉት እዩ። ሕጊ ቀሊል እዩ፦ ኣይትረብሽ፣ ኣይትብላሽ።',
        tr: 'İsveç çoğunlukla ormandır ve orman çoğunlukla size açıktır. Kural basittir: rahatsız etme, zarar verme.',
        uk: 'Швеція переважно вкрита лісами, і ліс здебільшого відкритий для вас. Правило просте: не заважай і не руйнуй.',
      },
    },
    8: {
      title: {
        'zh-Hans': '文化、传统',
        'zh-Hant': '文化、傳統',
        ar: 'الثقافة والتقاليد',
        ckb: 'کلتوور و نەریت',
        fa: 'فرهنگ، سنت‌ها',
        pl: 'Kultura, tradycje',
        so: 'Dhaqan, caadooyin',
        ti: 'ባህሊ፣ ልምድታት',
        tr: 'Kültür, gelenekler',
        uk: 'Культура, традиції',
      },
      title_em: {
        'zh-Hans': '与瑞典日历。',
        'zh-Hant': '與瑞典日曆。',
        ar: 'والتقويم السويدي.',
        ckb: 'و ساڵنامەی سویدی.',
        fa: 'و تقویم سوئدی.',
        pl: 'i szwedzki kalendarz.',
        so: 'iyo kalandarka Iswiidhan.',
        ti: 'እና ዓውደ-ኣዋርሕ ሽወደን።',
        tr: 've İsveç takvimi.',
        uk: 'і шведський календар.',
      },
      lede: {
        'zh-Hans':
          '如果你不知道仲夏节是什么时候，人们会礼貌地解释。若你不知道 fika 是什么，你无论愿不愿意都会得到解释。',
        'zh-Hant':
          '如果你不知道仲夏節是什麼時候，人們會禮貌地解釋。若你不知道 fika 是什麼，你無論願不願意都會得到解釋。',
        ar: 'إن لم تعرف موعد منتصف الصيف فستحصل على شرح مهذب. وإن لم تعرف معنى fika فستحصل على شرح، سواء أردت أم لا.',
        ckb: 'ئەگەر نازانیت midsommar کەیە، بە ڕێزەوە بۆت ڕوون دەکەنەوە. ئەگەر نازانیت fika چییە، حەتمەن ڕوونکردنەوەیەک وەردەگریت.',
        fa: 'اگر ندانید نیمهٔ تابستان چه زمانی است، مؤدبانه توضیح می‌دهند. اگر ندانید fika چیست، چه بخواهید چه نخواهید برایتان توضیح می‌دهند.',
        pl: 'Jeśli nie wiesz, kiedy jest midsommar, dostaniesz uprzejme wyjaśnienie. Jeśli nie wiesz, czym jest fika, też je dostaniesz — czy chcesz, czy nie.',
        so: 'Haddii aadan garanayn goorta midsommar tahay, sharaxaad edeb leh ayaa laguu siinayaa. Haddii aadan garanayn fika, sharaxaad ayaad heli doontaa — xitaa haddii aadan rabin.',
        ti: 'midsommar መዓስ ከም ዝኾነ እንተዘይፈሊጥካ ብኽብሪ ይገልጹልካ። fika እንታይ ከም ዝኾነ እንተዘይፈሊጥካ ድማ ትደሊ ወይ ኣትደሊ መግለጺ ትረክብ።',
        tr: 'Midsommarın ne zaman olduğunu bilmiyorsanız kibarca anlatırlar. Fikanın ne olduğunu bilmiyorsanız, isteseniz de istemeseniz de anlatılır.',
        uk: 'Якщо ви не знаєте, коли midsommar, вам чемно пояснять. Якщо не знаєте, що таке fika, пояснення отримаєте — хочете ви цього чи ні.',
      },
    },
    9: {
      title: {
        'zh-Hans': '金钱、银行',
        'zh-Hant': '金錢、銀行',
        ar: 'المال والبنوك',
        ckb: 'پارە و بانکەکان',
        fa: 'پول، بانک‌ها',
        pl: 'Pieniądze, banki',
        so: 'Lacag, bangiyo',
        ti: 'ገንዘብ፣ ባንክታት',
        tr: 'Para, bankalar',
        uk: 'Гроші, банки',
      },
      title_em: {
        'zh-Hans': '与 BankID。',
        'zh-Hant': '與 BankID。',
        ar: 'وBankID.',
        ckb: 'و BankID.',
        fa: 'و BankID.',
        pl: 'i BankID.',
        so: 'iyo BankID.',
        ti: 'እና BankID።',
        tr: 've BankID.',
        uk: 'і BankID.',
      },
      lede: {
        'zh-Hans':
          '瑞典是世界上最少依赖现金的国家之一。如今几乎每一笔交易都会经过一个小小的应用程序。',
        'zh-Hant':
          '瑞典是世界上最少依賴現金的國家之一。如今幾乎每一筆交易都會經過一個小小的應用程式。',
        ar: 'السويد من أقل دول العالم اعتمادًا على النقد. تكاد كل معاملة تمر اليوم عبر تطبيق صغير.',
        ckb: 'سوید یەکێکە لە وڵاتە کەمترین پشتبەستوو بە کاش لە جیهاندا. نزیکەی هەموو مامەڵەیەک ئەمڕۆ بە ئەپێکی بچووکدا تێدەپەڕێت.',
        fa: 'سوئد یکی از کم‌وابسته‌ترین کشورهای جهان به پول نقد است. امروز تقریباً هر تراکنشی از یک اپ کوچک عبور می‌کند.',
        pl: 'Szwecja jest jednym z krajów najmniej zależnych od gotówki. Prawie każda transakcja przechodzi dziś przez małą aplikację.',
        so: 'Iswiidhan waa mid ka mid ah dalalka ugu yar ee lacag caddaan ah ku tiirsan. Ku dhowaad macaamil kasta maanta wuxuu maraa app yar.',
        ti: 'ሽወደን ኣብ ዓለም ብብዙሕ ገንዘብ ካሽ ዘይትጥቀም ሃገር እያ። ሎሚ ኣብዛኛው ክፍሊት ብንእሽቶ መተግበሪ ይሓልፍ።',
        tr: 'İsveç dünyada nakde en az bağımlı ülkelerden biridir. Neredeyse her işlem artık küçük bir uygulamadan geçer.',
        uk: 'Швеція — одна з найменш залежних від готівки країн світу. Майже кожна операція нині проходить через маленький застосунок.',
      },
    },
    10: {
      title: {
        'zh-Hans': '瑞典、',
        'zh-Hant': '瑞典、',
        ar: 'السويد،',
        ckb: 'سوید،',
        fa: 'سوئد،',
        pl: 'Szwecja,',
        so: 'Iswiidhan,',
        ti: 'ሽወደን፣',
        tr: 'İsveç,',
        uk: 'Швеція,',
      },
      title_em: {
        'zh-Hans': '欧盟与世界。',
        'zh-Hant': '歐盟與世界。',
        ar: 'الاتحاد الأوروبي والعالم.',
        ckb: 'یەکێتیی ئەورووپا و جیهان.',
        fa: 'اتحادیهٔ اروپا و جهان.',
        pl: 'UE i świat.',
        so: 'Midowga Yurub iyo adduunka.',
        ti: 'ኤውሮጳዊ ሕብረትን ዓለምን።',
        tr: 'AB ve dünya.',
        uk: 'ЄС і світ.',
      },
      lede: {
        'zh-Hans':
          '瑞典花了两个世纪避免战争，又在一个十年里迅速加入联盟。模式相同——发挥作用，避免麻烦。',
        'zh-Hant':
          '瑞典花了兩個世紀避免戰爭，又在一個十年裡迅速加入聯盟。模式相同——發揮作用，避免麻煩。',
        ar: 'أمضت السويد قرنين في تجنب الحرب، ثم عقدًا واحدًا في الانضمام السريع إلى التحالفات. النمط نفسه: كن مفيدًا وتجنب المشكلات.',
        ckb: 'سوید دوو سەدەی بە دوورکەوتنەوە لە جەنگ بەسەر برد و یەک دەیە بە خێرایی چووە ناو هاوپەیمانێتییەکان. شێوازەکە هەمانە: سوودبەخش بە، ناکۆکی کەم بکە.',
        fa: 'سوئد دو قرن را صرف دوری از جنگ کرد و یک دهه را صرف پیوستن سریع به اتحادها. الگو همان است: مفید باش و از دردسر دور بمان.',
        pl: 'Szwecja przez dwa stulecia unikała wojny, a w jednej dekadzie szybko weszła do sojuszy. Wzór jest ten sam: bądź użyteczna i unikaj kłopotów.',
        so: 'Iswiidhan laba qarni ayay dagaal ka fogaaday, tobannaankii sano ee dambe si degdeg ah ayay isbahaysiyo ugu biirtay. Qaabku waa isla kii: waxtar yeelo, khilaafkana ka fogow.',
        ti: 'ሽወደን ክልተ ዘመን ካብ ኲናት ተርሒቓ፣ ኣብ ሓደ ዓሰርተ ዓመት ግን ብቕልጡፍ ናብ ስምምዓት ተኣትያ። እቲ ቅዲ ሓደ እዩ፦ ጠቓሚ ኩን፣ ጸገም ርሓቕ።',
        tr: 'İsveç iki yüzyılı savaştan kaçınarak, bir on yılı ise hızla ittifaklara katılarak geçirdi. Örüntü aynı: yararlı ol, sorunlardan uzak dur.',
        uk: 'Швеція два століття уникала війни, а за одне десятиліття швидко приєдналася до союзів. Шаблон той самий: бути корисною й уникати сварок.',
      },
    },
    11: {
      title: {
        'zh-Hans': '移民、居留',
        'zh-Hant': '移民、居留',
        ar: 'الهجرة والإقامة',
        ckb: 'کۆچ و مانەوە',
        fa: 'مهاجرت، اقامت',
        pl: 'Migracja, pobyt',
        so: 'Socdaal, deggenaansho',
        ti: 'ስደት፣ መንበሪ',
        tr: 'Göç, oturum',
        uk: 'Міграція, проживання',
      },
      title_em: {
        'zh-Hans': '与公民身份。',
        'zh-Hant': '與公民身分。',
        ar: 'والجنسية.',
        ckb: 'و هاووڵاتیبوون.',
        fa: 'و شهروندی.',
        pl: 'i obywatelstwo.',
        so: 'iyo muwaadinnimo.',
        ti: 'እና ዜግነት።',
        tr: 've vatandaşlık.',
        uk: 'і громадянство.',
      },
      lede: {
        'zh-Hans': '成为瑞典公民更像一个过程，而不是一个瞬间。文书工作很长，但规则相当清楚。',
        'zh-Hant': '成為瑞典公民更像一個過程，而不是一個瞬間。文書工作很長，但規則相當清楚。',
        ar: 'أن تصبح مواطنًا سويديًا عملية أكثر من كونها لحظة واحدة. الأوراق كثيرة، لكن القواعد واضحة على نحو غير معتاد.',
        ckb: 'بوون بە هاووڵاتی سویدی زیاتر پرۆسەیەکە نەک ساتێک. کارە کاغەزییەکان درێژن، بەڵام یاساکان بە شێوەیەکی باش ڕوونن.',
        fa: 'سوئدی شدن بیشتر یک فرایند است تا یک لحظه. کاغذبازی طولانی است، اما قواعد به‌طور غیرمعمولی روشن‌اند.',
        pl: 'Zostanie obywatelem Szwecji to bardziej proces niż chwila. Dokumentów jest dużo, ale zasady są wyjątkowo jasne.',
        so: 'Noqoshada muwaadin Iswiidhish ah waa hannaan ka badan daqiiqad keliya. Waraaqaha waa badan yihiin, laakiin xeerarku si aan caadi ahayn ayay u cad yihiin.',
        ti: 'ሽወደናዊ ዜጋ ምዃን ካብ ሓደ ኩነት ብዝያዳ ሂደት እዩ። ወረቓቕቲ ብዙሕ እዩ፣ ሕግታት ግን ኣዝዮም ንጹራት እዮም።',
        tr: 'İsveç vatandaşı olmak tek bir andan çok bir süreçtir. Evrak işi uzundur ama kurallar alışılmadık derecede nettir.',
        uk: 'Стати громадянином Швеції — це радше процес, ніж один момент. Документів багато, але правила незвично чіткі.',
      },
    },
    12: {
      title: {
        'zh-Hans': '模拟考试',
        'zh-Hant': '模擬考試',
        ar: 'اختبار تجريبي',
        ckb: 'تاقیکردنەوەی ئەزموونی',
        fa: 'آزمون آزمایشی',
        pl: 'Egzamin próbny',
        so: 'Imtixaan tijaabo ah',
        ti: 'ናይ ልምምድ ፈተና',
        tr: 'Deneme sınavı',
        uk: 'Пробний іспит',
      },
      title_em: {
        'zh-Hans': '与当前考试状态。',
        'zh-Hant': '與目前考試狀態。',
        ar: 'وحالة الاختبار الحالية.',
        ckb: 'و دۆخی ئێستای تاقیکردنەوە.',
        fa: 'و وضعیت کنونی آزمون.',
        pl: 'i aktualny status testu.',
        so: 'iyo xaaladda imtixaanka hadda.',
        ti: 'እና ናይ ሕጂ ኩነታት ፈተና።',
        tr: 've güncel sınav durumu.',
        uk: 'і поточний статус тесту.',
      },
      lede: {
        'zh-Hans': '用模拟考试来练习，但把实际考试细节同 UHR 和 Migrationsverket 的信息对应起来。',
        'zh-Hant': '用模擬考試來練習，但把實際考試細節同 UHR 和 Migrationsverket 的資訊對應起來。',
        ar: 'استخدم الاختبار التجريبي للتدريب، لكن اربط تفاصيل الاختبار العملية بمعلومات UHR وMigrationsverket.',
        ckb: 'تاقیکردنەوەی ئەزموونی بۆ مەشق بەکاربهێنە، بەڵام وردەکارییە کردارییەکان بە زانیاری UHR و Migrationsverket ببەستەوە.',
        fa: 'از آزمون آزمایشی برای تمرین استفاده کنید، اما جزئیات عملی آزمون را به اطلاعات UHR و Migrationsverket گره بزنید.',
        pl: 'Używaj egzaminu próbnego do ćwiczeń, ale praktyczne szczegóły testu wiąż z informacjami UHR i Migrationsverket.',
        so: 'Isticmaal imtixaanka tijaabada ah tababar ahaan, laakiin faahfaahinta rasmiga ah ku xidh UHR iyo Migrationsverket.',
        ti: 'ናይ ልምምድ ፈተና ንልምምድ ተጠቐመሉ፣ ግን ተግባራዊ ዝርዝራት ምስ UHR እና Migrationsverket ኣተሓሕዞም።',
        tr: 'Deneme sınavını alıştırma için kullanın, ama pratik sınav ayrıntılarını UHR ve Migrationsverket bilgilerine bağlayın.',
        uk: 'Використовуйте пробний іспит для тренування, але практичні деталі тесту звіряйте з UHR та Migrationsverket.',
      },
    },
    13: {
      title: {
        'zh-Hans': '传统、',
        'zh-Hant': '傳統、',
        ar: 'التقاليد،',
        ckb: 'نەریتەکان،',
        fa: 'سنت‌ها،',
        pl: 'Tradycje,',
        so: 'Caadooyin,',
        ti: 'ልምድታት፣',
        tr: 'Gelenekler,',
        uk: 'Традиції,',
      },
      title_em: {
        'zh-Hans': '节日与变化。',
        'zh-Hant': '節日與變化。',
        ar: 'الأعياد والتغير.',
        ckb: 'جەژنەکان و گۆڕان.',
        fa: 'تعطیلات و تغییر.',
        pl: 'święta i zmiana.',
        so: 'ciidaha iyo isbeddelka.',
        ti: 'በዓላትን ለውጥን።',
        tr: 'bayramlar ve değişim.',
        uk: 'свята і зміни.',
      },
      lede: {
        'zh-Hans':
          '瑞典传统不是博物馆展品。有些很古老，有些是后来传入的，大多数只是人们一起标记一年节奏的方式。',
        'zh-Hant':
          '瑞典傳統不是博物館展品。有些很古老，有些是後來傳入的，大多數只是人們一起標記一年節奏的方式。',
        ar: 'التقاليد السويدية ليست قطعًا في متحف. بعضها قديم، وبعضها جاء لاحقًا، ومعظمها طرق يتعرّف بها الناس على السنة معًا.',
        ckb: 'نەریتە سویدییەکان شتی مۆزەخانە نین. هەندێکیان کۆنن، هەندێکیان دواتر هاتوون، و زۆربەیان ڕێگایەکن بۆ ئەوەی خەڵک ساڵەکە پێکەوە بناسن.',
        fa: 'سنت‌های سوئدی اشیای موزه‌ای نیستند. بعضی قدیمی‌اند، بعضی بعداً آمده‌اند و بیشترشان راه‌هایی هستند برای اینکه مردم سال را با هم بشناسند.',
        pl: 'Szwedzkie tradycje nie są eksponatami muzealnymi. Część jest stara, część przyszła później, a większość pomaga ludziom wspólnie rozpoznawać rytm roku.',
        so: 'Caadooyinka Iswiidhan ma aha waxyaabo madxaf ku jira. Qaar waa duug, qaar dambe ayay yimaadeen, badankooduna waa siyaabo dadku sannadka wadajir ugu calaamadeeyaan.',
        ti: 'ልምድታት ሽወደን ናይ ሙዚየም ነገራት ኣይኮኑን። ገሊኦም ኣረጋውያን እዮም፣ ገሊኦም ድማ ድሒሮም መጺኦም፣ መብዛሕትኦም ግን ሰባት ዓመት ብሓባር ክፈልጡ ዝሕግዙ እዮም።',
        tr: 'İsveç gelenekleri müze parçası değildir. Bazıları eski, bazıları sonradan gelmiştir; çoğu insanların yılı birlikte işaretleme yoludur.',
        uk: 'Шведські традиції — не музейні експонати. Деякі старі, деякі прийшли пізніше, а більшість просто допомагає людям разом відмічати рік.',
      },
    },
  });

  const EBOOK_FALLBACK_COPY = Object.freeze({
    heading: {
      'zh-Hans': '聚焦阅读',
      'zh-Hant': '聚焦閱讀',
      ar: 'اقرأ بتركيز',
      ckb: 'بە سەرنجەوە بخوێنەوە',
      fa: 'با تمرکز بخوانید',
      pl: 'Czytaj z uwagą',
      so: 'Si diirran u akhri',
      ti: 'ብትኹረት ኣንብብ',
      tr: 'Odaklanarak oku',
      uk: 'Читайте з фокусом',
    },
    reviewHeading: {
      'zh-Hans': '贴近来源复习',
      'zh-Hant': '貼近來源複習',
      ar: 'راجع قريبًا من المصدر',
      ckb: 'نزیک لە سەرچاوە پێداچوونەوە بکە',
      fa: 'نزدیک به منبع مرور کنید',
      pl: 'Powtarzaj blisko źródła',
      so: 'Ku celceli agagaarka isha',
      ti: 'ኣብ ጥቓ ምንጪ ድገም',
      tr: 'Kaynağa yakın tekrar et',
      uk: 'Повторюйте близько до джерела',
    },
    reviewBody: {
      'zh-Hans':
        '本章的术语、日期和制度应同 UHR 学习材料、来源页和练习题一起复习。不要把本应用视为官方说明。',
      'zh-Hant':
        '本章的術語、日期和制度應同 UHR 學習材料、來源頁和練習題一起複習。不要把本應用視為官方說明。',
      ar: 'راجع مصطلحات هذا الفصل وتواريخه ومؤسساته مع مواد UHR وصفحة المصادر وأسئلة التدريب. لا تعتبر هذا التطبيق تعليمات رسمية.',
      ckb: 'زاراوەکان، بەروارەکان و دامەزراوەکانی ئەم بەشە لەگەڵ ماددەکانی UHR، لاپەڕەی سەرچاوەکان و پرسیارەکانی مەشق پێداچوونەوە بکە. ئەم ئەپە وەک ڕێنمایی فەرمی وەرنەگرە.',
      fa: 'اصطلاحات، تاریخ‌ها و نهادهای این فصل را همراه با مواد UHR، صفحهٔ منابع و پرسش‌های تمرینی مرور کنید. این برنامه را دستورالعمل رسمی ندانید.',
      pl: 'Terminy, daty i instytucje z tego rozdziału powtarzaj razem z materiałem UHR, stroną źródeł i pytaniami ćwiczeniowymi. Nie traktuj aplikacji jako instrukcji urzędowej.',
      so: 'Ereyada, taariikhaha iyo hayʼadaha cutubkan ku celi adigoo la eegaya agabka UHR, bogga ilaha iyo suʼaalaha tababarka. App-kan ha u qaadan tilmaamo rasmi ah.',
      ti: 'ቃላት፣ ዕለታትን ትካላትን ናይዚ ምዕራፍ ምስ UHR መምሃሪ ንብረት፣ ገጽ ምንጪታትን ናይ ልምምድ ሕቶታትን ድገሞም። ነዚ መተግበሪ ከም ሕጋዊ መመርሒ ኣይትውሰዶ።',
      tr: 'Bu bölümdeki terimleri, tarihleri ve kurumları UHR materyali, Kaynaklar sayfası ve alıştırma sorularıyla birlikte tekrar edin. Bu uygulamayı resmi talimat saymayın.',
      uk: 'Терміни, дати й установи з цього розділу повторюйте разом із матеріалом UHR, сторінкою джерел і тренувальними питаннями. Не сприймайте застосунок як офіційні інструкції.',
    },
    facts: {
      'zh-Hans': '要复习的重点',
      'zh-Hant': '要複習的重點',
      ar: 'نقاط للمراجعة',
      ckb: 'خاڵەکان بۆ پێداچوونەوە',
      fa: 'نکته‌هایی برای مرور',
      pl: 'Punkty do powtórzenia',
      so: 'Qodobbada dib loo eegayo',
      ti: 'ነጥብታት ንምድጋም',
      tr: 'Tekrar noktaları',
      uk: 'Пункти для повторення',
    },
  });

  function ebookLocalizedField(chapterId, chapter, fieldName, lang) {
    return (
      (chapter[fieldName] && chapter[fieldName][lang]) ||
      (EBOOK_READER_I18N_FALLBACKS[chapterId] &&
        EBOOK_READER_I18N_FALLBACKS[chapterId][fieldName] &&
        EBOOK_READER_I18N_FALLBACKS[chapterId][fieldName][lang]) ||
      (chapter[fieldName] && chapter[fieldName].en) ||
      ''
    );
  }

  function ebookTranslatedBodyFallback(chapterId, chapter, lang) {
    const chapterFallback = EBOOK_READER_I18N_FALLBACKS[chapterId];
    if (!chapterFallback || !chapterFallback.lede || !chapterFallback.lede[lang]) return '';
    const copy = EBOOK_FALLBACK_COPY;
    const title =
      `${ebookLocalizedField(chapterId, chapter, 'title', lang)} ${ebookLocalizedField(chapterId, chapter, 'title_em', lang)}`.trim();
    return `
      <h2>${copy.heading[lang]}</h2>
      <p>${chapterFallback.lede[lang]}</p>
      <h2>${copy.reviewHeading[lang]}</h2>
      <p>${copy.reviewBody[lang]}</p>
      ${ebookFactBox(lang, copy.facts[lang], title, chapterId === '10' ? ['uhrStudyMaterial', 'governmentNato'] : chapterId === '11' ? ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'] : ['uhrStudyMaterial'])}
    `;
  }

  function ebookLocalizedBody(chapterId, chapter, lang) {
    return (
      (chapter.body && chapter.body[lang]) ||
      ebookTranslatedBodyFallback(chapterId, chapter, lang) ||
      (chapter.body && chapter.body.en) ||
      ''
    );
  }

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
      ? `<h1 class="ebook__h1"><span>${ebookLocalizedField(id, ch, 'title', lang)}</span> <em>${ebookLocalizedField(id, ch, 'title_em', lang)}</em></h1>`
      : `<h1 class="ebook__h1"><em>${(ch.kicker[lang] || ch.kicker.en).split('·')[1]?.trim() || ch.kicker[lang] || ch.kicker.en}</em></h1>`;

    const footnoteCollector = createEbookFootnoteCollector(id, lang);
    const ledeHtml = ch.lede
      ? footnoteCollector.annotate(
          `<p class="ebook__lede"${ebookSourceKeyDataAttr(ebookLedeSourceKeys(id))}>${ebookLocalizedField(id, ch, 'lede', lang)}</p>`,
        )
      : '';

    const rawBodyHtml = ch.body
      ? ebookLocalizedBody(id, ch, lang)
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
          <a class="btn btn--gold btn--sm" href="${practice.href}">${practice[lang] || practice.en} →</a>
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
  // Re-render the ebook when the language changes (the redesigned language menu
  // dispatches smt:languagechange; the old .lang button click selector no longer matches).
  window.addEventListener('smt:languagechange', () => {
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
