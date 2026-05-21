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
    uhrOfficialTestSources: {
      label: 'UHR current medborgarskapsprovet source pages',
      mixLabel: 'UHR test status',
      url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
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

  const OFFICIAL_TEST_SOURCE_KEYS = Object.freeze(['uhrOfficialTestSources']);

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

  function sourceAnchor(note) {
    const safeExternalAttrs = /^https?:\/\//.test(note.url)
      ? ' target="_blank" rel="noreferrer"'
      : '';
    return `<a href="${note.url}"${safeExternalAttrs}>${note.label}</a>`;
  }

  function sourceLink(note) {
    return `${sourceAnchor(note)} (${note.retrievedDate})`;
  }

  function ebookSourceNotes(sourceKeys) {
    return Array.from(new Set(sourceKeys))
      .map((key) => EBOOK_SOURCE_NOTES[key])
      .filter(Boolean);
  }

  function officialTestSourceLinks() {
    return OFFICIAL_TEST_SOURCE_NOTES.map(sourceAnchor).join(' · ');
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

  const EBOOK_EDITORIAL_ONLY_SOURCE_KEYS = Object.freeze(['editorialCommentary']);
  const EBOOK_EDITORIAL_PROSE_SOURCE_KEYS = Object.freeze([
    'uhrStudyMaterial',
    'editorialCommentary',
  ]);
  const EBOOK_BODY_SOURCE_KEYS = Object.freeze({
    intro: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    1: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    2: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    3: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    4: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    5: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    6: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    7: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    8: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    9: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    10: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    11: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    12: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
    13: EBOOK_EDITORIAL_PROSE_SOURCE_KEYS,
  });
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

  function ebookBodySourceKeys(chapterId) {
    const sourceKeys = EBOOK_BODY_SOURCE_KEYS[chapterId];
    assertEbookSourceKeys(sourceKeys, `ebook body chapter ${chapterId}`);
    return sourceKeys;
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
      annotate(html, typedSourceKeys) {
        const normalizedTypedSourceKeys = typedSourceKeys
          ? normalizedEbookSourceKeys(typedSourceKeys, `ebook prose chapter ${chapterId}`)
          : null;
        return html.replace(
          /<(p|li)(?![^>]*class="ebook__source-note")([^>]*)>([\s\S]*?)<\/\1>/g,
          (match, tagName, attrs, content) => {
            const explicitSourceKeys = parseEbookSourceKeyMetadata(attrs);
            const cleanAttrs = stripEbookSourceKeyMetadata(attrs);
            if (!explicitSourceKeys && !normalizedTypedSourceKeys) {
              throw new Error(
                `ebook ${tagName} chapter ${chapterId} must pass inline or typed source metadata`,
              );
            }
            const sourceKeys = normalizedEbookSourceKeys(
              explicitSourceKeys || normalizedTypedSourceKeys,
              `ebook ${tagName} chapter ${chapterId}`,
            );
            const metadataKind = explicitSourceKeys ? 'inline' : 'typed';
            const footnoteIndex = footnotes.length + 1;
            const id = `eb-${chapterId}-${lang}-fn-${footnoteIndex}`;
            footnotes.push({ id, index: footnoteIndex, sourceKeys });
            const keys = Array.from(new Set(sourceKeys)).join(' ');
            return `<${tagName}${cleanAttrs} data-source-claims="ebook" data-source-scope="ebook" data-source-keys="${keys}" data-source-metadata="${metadataKind}">${content}<sup id="${id}-ref" class="ebook__source-ref"><a href="${ebookRouteHash(chapterId, 'fn', id)}" aria-label="${lang === 'sv' ? 'Källa' : 'Source'} ${footnoteIndex}">[${footnoteIndex}]</a></sup></${tagName}>`;
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
        const sourceKeys = Array.from(new Set(footnote.sourceKeys)).join(' ');
        return `<li id="${footnote.id}" data-source-key="${sourceKeys}"><a href="${ebookRouteHash(chapterId, 'fnref', footnote.id)}"><span>${footnote.index}</span></a> ${sources}</li>`;
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
    const normalizedBriefSourceKeys = normalizedEbookSourceKeys(
      sourceKeys,
      'svStudyBrief body source metadata',
    );
    const items = points
      .map((point) => {
        const text = typeof point === 'string' ? point : point.text;
        const pointSourceKeys =
          typeof point === 'string' ? normalizedBriefSourceKeys : point.sourceKeys;
        return `<li${ebookSourceKeyDataAttr(pointSourceKeys)}>${text}</li>`;
      })
      .join('');
    return `
      <h2>Det viktigaste</h2>
      <ul>${items}</ul>
      <h2>Plugga smart</h2>
      <p${ebookSourceKeyDataAttr(EBOOK_EDITORIAL_ONLY_SOURCE_KEYS)}>${practiceHint || 'Läs punkterna långsamt, öppna sedan övningen för samma kapitel och låt fel svar visa vad du ska läsa om.'}</p>
      ${afterPracticeHtml}
      ${ebookFactBox('sv', 'Fakta att repetera', facts, normalizedBriefSourceKeys)}
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
          <div class="ebook__factbox"><h4>Tip</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>Read on your phone in 10-minute windows. Short, repeated sessions make it easier to notice what needs review before you open the practice questions.</p></div>
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
          <div class="ebook__factbox"><h4>Tips</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>Växla mellan svenska och engelska om ett begrepp känns tungt. Provet kräver svenska, men förståelsen kan byggas på båda språken.</p></div>
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
          <div class="ebook__factbox"><h4>提示</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>用手机在 10 分钟的零碎时段里阅读。短而反复的学习，会让你在打开练习题之前更容易察觉到哪些内容需要复习。</p></div>`,
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
          <div class="ebook__factbox"><h4>提示</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>用手機在 10 分鐘的零碎時段裡閱讀。短而反覆的學習，會讓你在打開練習題之前更容易察覺到哪些內容需要複習。</p></div>`,
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
          <div class="ebook__factbox"><h4>نصيحة</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>اقرأ على هاتفك في نوافذ من 10 دقائق. الجلسات القصيرة المتكرّرة تجعل من الأسهل أن تلاحظ ما يحتاج إلى مراجعة قبل أن تفتح أسئلة التدريب.</p></div>`,
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
          <div class="ebook__factbox"><h4>ئامۆژگاری</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>لەسەر مۆبایلەکەت لە ماوەی 10 خولەکیدا بیخوێنەوە. دانیشتنی کورت و دووبارە وادەکات ئاسانتر تێبگەیت کە پێش کردنەوەی پرسیارەکانی مەشق چی پێویستی بە پێداچوونەوە هەیە.</p></div>`,
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
          <div class="ebook__factbox"><h4>نکته</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>روی گوشی خود در بازه‌های 10 دقیقه‌ای بخوانید. جلسه‌های کوتاه و مکرر باعث می‌شود راحت‌تر متوجه شوید پیش از باز کردن سؤال‌های تمرین چه چیزی نیاز به مرور دارد.</p></div>`,
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
          <div class="ebook__factbox"><h4>Wskazówka</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>Czytaj na telefonie w 10-minutowych okienkach. Krótkie, powtarzane sesje ułatwiają zauważenie, co wymaga powtórki, zanim otworzysz pytania ćwiczeniowe.</p></div>`,
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
          <div class="ebook__factbox"><h4>Talo</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>Ku akhri telefoonkaaga muddooyin 10 daqiiqo ah. Fadhiyo gaagaaban oo soo noqnoqda ayaa fududeeya in la ogaado waxa u baahan dib-u-eegis ka hor inta aadan furin su'aalaha tababarka.</p></div>`,
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
          <div class="ebook__factbox"><h4>ምኽሪ</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>ኣብ ተሌፎንካ ብ10-ደቓይቕ መስኮታት ኣንብብ። ሓጸርቲ፣ ዝድገሙ ክፍለ ግዜታት ነቲ ናይ ልምምድ ሕቶታት ቅድሚ ምኽፋትካ እንታይ ምድጋም ከም ዘድልዮ ንምልላይ የቕልሉ።</p></div>`,
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
          <div class="ebook__factbox"><h4>İpucu</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>Telefonunuzda 10 dakikalık aralıklarla okuyun. Kısa, tekrarlanan oturumlar, alıştırma sorularını açmadan önce neyin tekrar gerektirdiğini fark etmeyi kolaylaştırır.</p></div>`,
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
          <div class="ebook__factbox"><h4>Підказка</h4><p${ebookSourceKeyDataAttr(['editorialCommentary'])}>Читайте з телефона у 10-хвилинні проміжки. Короткі, повторювані сесії полегшують помічати, що потребує повторення, перш ніж відкриєте тренувальні питання.</p></div>`,
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
          '一位无权决断的国王、一个真正做决定的 Riksdag（议会），以及 290 个你大概只会在回收站碰到的市镇。',
        'zh-Hant':
          '一位無權決斷的國王、一個真正做決定的 Riksdag（議會），以及 290 個你大概只會在回收站碰到的市鎮。',
        ar: 'ملكٌ لا يستطيع أن يقرّر، و Riksdag (البرلمان) يقرّر، و290 بلدية لن تلتقي بها في الغالب إلا عند محطة إعادة التدوير.',
        ckb: 'پاشایەک کە ناتوانێت بڕیار بدات، Riksdagـێک (پەرلەمان) کە بڕیار دەدات، و 290 شارەوانی کە زۆرتر تەنها لە وێستگەی پیتاندنەوەدا دەیانبینیت.',
        fa: 'پادشاهی که نمی‌تواند تصمیم بگیرد، یک Riksdag (پارلمان) که تصمیم می‌گیرد، و 290 کمون که بیشتر فقط در ایستگاه بازیافت با آن‌ها سروکار خواهید داشت.',
        pl: 'Król, który nie może decydować, Riksdag (parlament), który decyduje, oraz 290 gmin (kommuner), które spotkasz głównie przy stacji recyklingu.',
        so: "Boqor aan go'aan qaadan karin, Riksdag (baarlamaan) oo qaada, iyo 290 degmo (kommuner) oo aad badanaa kula kulmi doonto saldhigga dib-u-warshadaynta.",
        ti: 'ክውስን ዘይክእል ንጉስ፣ ዝውስን Riksdag (ባይቶ)፣ ከምኡ’ውን መብዛሕትኡ ግዜ ኣብ መደበር ዳግመ-ምጥቃም ጥራይ እትረኽቦም 290 ምምሕዳራት ከተማ።',
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
            <li><b>区域层级</b>——21 个大区，主要负责医疗和公共交通。</li>
            <li><b>地方层级</b>——290 个市镇，负责学校、社会服务、供水和垃圾处理。</li>
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
          <p>你会在同一天参加三场各自独立的选举：Riksdag、区域和市镇。此外，你每五年还会参加一次 EU（欧盟）选举。瑞典公民这四种选举都能参加；永久居民在居住满三年后，可以参加区域和市镇选举。</p>
          ${ebookFactBox('zh-Hans', null, 'Riksdag 席位数：349 · 门槛：4% · 选举间隔：4 年 · 大区数量：21 · 市镇数量：290。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>三級政府</h2>
          <p>瑞典是一個 <em>君主立憲制國家</em>，也是一個 <em>議會民主制國家</em>。權力在三個層級上運作：</p>
          <ul>
            <li><b>全國層級</b>——Riksdag（議會）、regering（政府）和國王（禮儀性角色）。</li>
            <li><b>區域層級</b>——21 個大區，主要負責醫療和公共交通。</li>
            <li><b>地方層級</b>——290 個市鎮，負責學校、社會服務、供水和垃圾處理。</li>
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
          <p>你會在同一天參加三場各自獨立的選舉：Riksdag、區域和市鎮。此外，你每五年還會參加一次 EU（歐盟）選舉。瑞典公民這四種選舉都能參加；永久居民在居住滿三年後，可以參加區域和市鎮選舉。</p>
          ${ebookFactBox('zh-Hant', null, 'Riksdag 席位數：349 · 門檻：4% · 選舉間隔：4 年 · 大區數量：21 · 市鎮數量：290。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>ثلاثة مستويات للحكم</h2>
          <p>السويد <em>ملكية دستورية</em> و<em>ديمقراطية برلمانية</em>. وتجري السلطة على ثلاثة مستويات:</p>
          <ul>
            <li><b>الوطني</b> — Riksdag (البرلمان)، وregering (الحكومة)، والملك (دور تشريفي).</li>
            <li><b>الإقليمي</b> — 21 إقليمًا، مسؤولة أساسًا عن الرعاية الصحية والنقل العام.</li>
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
          <p>تصوّت في ثلاثة انتخابات منفصلة في اليوم نفسه: Riksdag، والإقليم، والبلدية. كما تصوّت في انتخابات EU كل خمس سنوات. ويصوّت المواطنون السويديون في الأربعة جميعًا؛ أما المقيمون الدائمون فيصوّتون في الانتخابات الإقليمية والبلدية بعد ثلاث سنوات.</p>
          ${ebookFactBox('ar', null, 'حجم Riksdag: 349 · العتبة: 4% · فترة الانتخابات: 4 سنوات · عدد الأقاليم: 21 · عدد البلديات: 290.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>سێ ئاستی فەرمانڕەوایی</h2>
          <p>سوید <em>پاشایەتییەکی دەستوورییە</em> و <em>دیموکراسییەکی پەرلەمانی</em>یە. هێز لە سێ ئاستدا کاردەکات:</p>
          <ul>
            <li><b>نیشتمانی</b> — Riksdag (پەرلەمان)، regering (حکومەت) و پاشا (ڕێوڕەسمی).</li>
            <li><b>هەرێمی</b> — 21 هەرێم، کە زۆرتر بەرپرسی خزمەتگوزاریی تەندروستی و گواستنەوەی گشتین.</li>
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
          <p>لە یەک ڕۆژدا لە سێ هەڵبژاردنی جیاوازدا دەنگ دەدەیت: Riksdag، هەرێم و شارەوانی. هەروەها هەر پێنج ساڵ جارێک لە هەڵبژاردنی EUدا دەنگ دەدەیت. هاووڵاتیانی سویدی لە هەر چوارەکەدا دەنگ دەدەن؛ نیشتەجێ هەمیشەییەکان دوای سێ ساڵ لە هەڵبژاردنی هەرێمی و شارەوانیدا دەنگ دەدەن.</p>
          ${ebookFactBox('ckb', null, 'قەبارەی Riksdag: 349 · سنوور: 4% · ماوەی هەڵبژاردن: 4 ساڵ · ژمارەی هەرێمەکان: 21 · ژمارەی شارەوانییەکان: 290.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>سه سطح حکومت</h2>
          <p>سوئد یک <em>پادشاهی مشروطه</em> و <em>دموکراسی پارلمانی</em> است. قدرت در سه سطح جریان دارد:</p>
          <ul>
            <li><b>ملی</b> — Riksdag (پارلمان)، regering (دولت) و پادشاه (تشریفاتی).</li>
            <li><b>منطقه‌ای</b> — 21 منطقه که عمدتاً مسئول خدمات بهداشتی و حمل‌ونقل عمومی هستند.</li>
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
          <p>شما در یک روز در سه انتخابات جداگانه رأی می‌دهید: Riksdag، منطقه و کمون. همچنین هر پنج سال در انتخابات EU رأی می‌دهید. شهروندان سوئدی در هر چهار انتخابات رأی می‌دهند؛ مقیمان دائم پس از سه سال در انتخابات منطقه‌ای و کمونی رأی می‌دهند.</p>
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
          <p>Głosujesz w trzech odrębnych wyborach tego samego dnia: do Riksdagu oraz w wyborach regionalnych i gminnych. Głosujesz też w wyborach do EU co pięć lat. Obywatele szwedzcy głosują we wszystkich czterech; stali rezydenci głosują w wyborach regionalnych i gminnych po trzech latach.</p>
          ${ebookFactBox('pl', null, 'Liczebność Riksdagu: 349 · Próg: 4% · Częstotliwość wyborów: 4 lata · Liczba regionów: 21 · Liczba gmin: 290.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Saddex heer oo dawladnimo</h2>
          <p>Iswiidhan waa <em>boqortooyo dastuuri ah</em> iyo <em>dimoqraadiyad baarlamaani ah</em>. Awooddu waxay ka shaqaysaa saddex heer:</p>
          <ul>
            <li><b>Heer qaran</b> — Riksdag (baarlamaan), regering (dawlad) iyo boqorka (xafladeed).</li>
            <li><b>Heer gobol</b> — 21 gobol, oo inta badan mas'uul ka ah daryeelka caafimaadka iyo gaadiidka dadweynaha.</li>
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
          <p>Waxaad ka codaysaa saddex doorasho oo kala duwan maalin isku mid ah: Riksdag, gobolka iyo degmada. Waxaad sidoo kale ka codaysaa doorashooyinka EU shantii sanaba mar. Muwaadiniinta Iswiidhan waxay ka codeeyaan dhammaan afarta; dadka deganaanshaha joogtada ah waxay ka codeeyaan doorashooyinka gobolka iyo degmada saddex sano ka dib.</p>
          ${ebookFactBox('so', null, 'Cabbirka Riksdag: 349 · Xadka: 4% · Muddada doorashada: 4 sano · Tirada gobollada: 21 · Tirada degmooyinka: 290.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ሰለስተ ደረጃታት ምሕደራ</h2>
          <p>ሽወደን <em>ቅዋማዊ ንግስና</em>ን <em>ፓርላሜንታዊ ደሞክራሲ</em>ን እያ። ስልጣን ኣብ ሰለስተ ደረጃ ይሰርሕ፦</p>
          <ul>
            <li><b>ሃገራዊ</b> — Riksdag (ባይቶ)፣ regering (መንግስቲ)ን ንጉስ (ስነ-ስርዓታዊ)ን።</li>
            <li><b>ዞባዊ</b> — 21 ዞባታት፣ ብቐንዱ ንክንክን ጥዕናን ህዝባዊ መጓዓዝያን ሓላፍነት ዘለዎም።</li>
            <li><b>ከባብያዊ</b> — 290 ምምሕዳራት ከተማ፣ ንኣብያተ ትምህርቲ፣ ማሕበራዊ ኣገልግሎት፣ ማይን ጓሓፍን ሓላፍነት ዘለዎም።</li>
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
          <p>ኣብ ሓደ መዓልቲ ኣብ ሰለስተ በበይኖም ምርጫታት ትመርጽ፦ Riksdag፣ ዞባን ምምሕዳር ከተማን። ከምኡ’ውን ኣብ ነፍሲ ወከፍ ሓሙሽተ ዓመት ኣብ ምርጫታት EU ትመርጽ። ዜጋታት ሽወደን ኣብ ኩሉ ኣርባዕተ ይመርጹ፣ ቀወምቲ ነበርቲ ድሕሪ ሰለስተ ዓመት ኣብ ዞባውን ምምሕዳር ከተማን ምርጫታት ይመርጹ።</p>
          ${ebookFactBox('ti', null, 'ዓቐን Riksdag፦ 349 · ደረት፦ 4% · ግዜ ምርጫ፦ 4 ዓመት · ቍጽሪ ዞባታት፦ 21 · ቍጽሪ ምምሕዳራት ከተማ፦ 290።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Üç yönetim düzeyi</h2>
          <p>İsveç bir <em>anayasal monarşi</em> ve <em>parlamenter demokrasi</em>dir. Erk üç düzeyde işler:</p>
          <ul>
            <li><b>Ulusal</b> — Riksdag (parlamento), regering (hükümet) ve kral (törensel).</li>
            <li><b>Bölgesel</b> — başlıca sağlık hizmetleri ve toplu taşımadan sorumlu 21 bölge.</li>
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
          <p>Aynı gün üç ayrı seçimde oy verirsiniz: Riksdag, bölge ve belediye. Ayrıca beş yılda bir EU seçimlerinde oy verirsiniz. İsveç vatandaşları dördünde de oy verir; daimi oturum sahipleri üç yıl sonra bölge ve belediye seçimlerinde oy verir.</p>
          ${ebookFactBox('tr', null, 'Riksdag büyüklüğü: 349 · Baraj: %4 · Seçim aralığı: 4 yıl · bölge sayısı: 21 · belediye sayısı: 290.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Три рівні влади</h2>
          <p>Швеція є <em>конституційною монархією</em> та <em>парламентською демократією</em>. Влада діє на трьох рівнях:</p>
          <ul>
            <li><b>Загальнодержавний</b> — Riksdag (парламент), regering (уряд) і король (церемоніальний).</li>
            <li><b>Регіональний</b> — 21 регіон, що відповідають переважно за охорону здоров'я та громадський транспорт.</li>
            <li><b>Місцевий</b> — 290 муніципалітетів, що відповідають за школи, соціальні служби, воду та сміття.</li>
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
          <p>Ви голосуєте на трьох окремих виборах одного дня: Riksdag, регіон і муніципалітет. Також ви голосуєте на виборах до EU кожні п'ять років. Громадяни Швеції голосують на всіх чотирьох; постійні мешканці голосують на регіональних і муніципальних виборах через три роки.</p>
          ${ebookFactBox('uk', null, 'Розмір Riksdag: 349 · Поріг: 4% · Інтервал виборів: 4 роки · Кількість регіонів: 21 · Кількість муніципалітетів: 290.', ['uhrStudyMaterial'])}
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
          <p>ቀረጽ ንመንግስቲ ድሕነት ይምውል። መብዛሕትኦም ሰባት ኣስታት 30% ደሞዞም ከም ናይ ከባቢ ምምሕዳር ቀረጽ እቶት ይኸፍሉ። ካብ ደረት ቀረጽ መንግስቲ (ኣብ 2024 ኣስታት 613 900 SEK) ንላዕሊ ዝረኽቡ ሰባት፣ ካብቲ መስመር ንላዕሊ ኣብ ዘሎ እቶት ተወሳኺ 20% ይኸፍሉ። ካብ ካፒታል ዝርከብ መኽሰብ ብ30% ይቕረጽ። VAT (<em>moms</em>) ኣብ መብዛሕትኡ ኣቕሑ 25%፣ ኣብ ምግቢ 12%፣ ኣብ መጻሕፍትን ባህልን 6% እዩ።</p>
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
        so: 'Sinnaan',
        ti: 'ማዕርነት',
        tr: 'Eşitlik',
        uk: 'Рівність',
      },
      title_em: {
        en: 'and the modern household.',
        sv: 'och det moderna hemmet.',
        'zh-Hans': '与现代家庭。',
        'zh-Hant': '與現代家庭。',
        ar: 'والأسرة الحديثة.',
        ckb: 'و ماڵی هاوچەرخ.',
        fa: 'و خانوار مدرن.',
        pl: 'i nowoczesny dom.',
        so: 'iyo qoyska casriga ah.',
        ti: 'ከምኡውን እቲ ዘመናዊ ስድራቤት።',
        tr: 've modern hane.',
        uk: 'та сучасне домогосподарство.',
      },
      lede: {
        en: 'Sweden is a quiet feminist project. The laws are clearer than the dinner-table conversations, but both are worth knowing.',
        sv: 'Sverige är ett tyst feministiskt projekt. Lagarna är tydligare än middagsbordssamtalen — men båda är värda att kunna.',
        'zh-Hans': '瑞典是一项安静的女性主义工程。法律比餐桌上的谈话更清晰，但两者都值得了解。',
        'zh-Hant': '瑞典是一項安靜的女性主義工程。法律比餐桌上的談話更清晰，但兩者都值得了解。',
        ar: 'السويد مشروع نسوي هادئ. القوانين أوضح من أحاديث مائدة العشاء، لكن كليهما يستحق المعرفة.',
        ckb: 'سوید پڕۆژەیەکی فێمێنیستیی بێدەنگە. یاساکان لە گفتوگۆکانی سەر خوانی نانخواردن ڕوونترن، بەڵام هەردووکیان شایانی زانینن.',
        fa: 'سوئد یک پروژهٔ فمینیستی آرام است. قانون‌ها روشن‌تر از گفت‌وگوهای سر میز شام‌اند، اما هر دو ارزش دانستن دارند.',
        pl: 'Szwecja to cichy projekt feministyczny. Prawa są jaśniejsze niż rozmowy przy stole, ale jedne i drugie warto znać.',
        so: 'Iswiidhan waa mashruuc dumarnimo oo aamusan. Sharciyadu way ka cad yihiin sheekooyinka miiska cuntada, laakiin labadaba way mudan yihiin in la ogaado.',
        ti: 'ሽወደን ህዱእ ናይ ደቂ ኣንስትዮ ምንቅስቓስ እዩ። ሕግታት ካብቲ ኣብ ሰደቓ ምግቢ ዝግበር ዕላላት ንጹር እዩ፣ ክልቲኡ ግን ምፍላጡ ይብጻሕ።',
        tr: 'İsveç sessiz bir feminist projedir. Yasalar yemek masasındaki sohbetlerden daha nettir, ama her ikisini de bilmeye değer.',
        uk: 'Швеція — це тихий феміністичний проєкт. Закони чіткіші за розмови за обіднім столом, але варто знати і те, і інше.',
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
        'zh-Hans': `<h2>法律上的平等</h2>
          <p>《反歧视法》（<em>diskrimineringslagen</em>，2008 年）禁止基于七项理由的歧视：性别、性别认同或表达、族裔、宗教或信仰、残障、性取向和年龄。它适用于工作、教育、医疗、住房和公共服务。</p>
          <h2>同性婚姻与彩虹家庭</h2>
          <p>同性婚姻自 2009 年起合法。同性伴侣可以在平等条件下收养子女并获得辅助生育治疗。跨性别者无需任何医学要求即可更改法律性别。</p>
          <h2>育儿假</h2>
          <p>每个孩子 480 天，其中 90 天为每位父母保留（即"pappamånader"，爸爸月），不可转让。目的是：让父母双方都在家。在瑞典，孩子的第一个生日通常由两位略显疲惫的大人一起庆祝，而不是一位。</p>
          <h2>家务责任</h2>
          <p>在瑞典，做饭、打扫、照看孩子和料理家务并不是分性别的活儿——至少在官方层面不是。调查显示，这是家务时间分配最平等的国家。（统计数据就像青少年，多少会撒点小谎。）</p>
          <h2>女性与工作</h2>
          <p>女性的劳动参与率位居世界前列（约 80%）。性别薪酬差距确实存在（约 10–12%），但正在缩小。孕产妇死亡率也位居世界最低之列。</p>
          ${ebookFactBox('zh-Hans', null, '同性婚姻：2009 年 · 歧视理由：7 项 · 育儿假：480 天 · 每位父母保留：各 90 天。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>法律上的平等</h2>
          <p>《反歧視法》（<em>diskrimineringslagen</em>，2008 年）禁止基於七項理由的歧視：性別、性別認同或表達、族裔、宗教或信仰、殘障、性取向和年齡。它適用於工作、教育、醫療、住房和公共服務。</p>
          <h2>同性婚姻與彩虹家庭</h2>
          <p>同性婚姻自 2009 年起合法。同性伴侶可以在平等條件下收養子女並獲得輔助生育治療。跨性別者無需任何醫學要求即可更改法律性別。</p>
          <h2>育兒假</h2>
          <p>每個孩子 480 天，其中 90 天為每位父母保留（即「pappamånader」，爸爸月），不可轉讓。目的是：讓父母雙方都在家。在瑞典，孩子的第一個生日通常由兩位略顯疲憊的大人一起慶祝，而不是一位。</p>
          <h2>家務責任</h2>
          <p>在瑞典，做飯、打掃、照看孩子和料理家務並不是分性別的活兒——至少在官方層面不是。調查顯示，這是家務時間分配最平等的國家。（統計數據就像青少年，多少會撒點小謊。）</p>
          <h2>女性與工作</h2>
          <p>女性的勞動參與率位居世界前列（約 80%）。性別薪酬差距確實存在（約 10–12%），但正在縮小。孕產婦死亡率也位居世界最低之列。</p>
          ${ebookFactBox('zh-Hant', null, '同性婚姻：2009 年 · 歧視理由：7 項 · 育兒假：480 天 · 每位父母保留：各 90 天。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>متساوون أمام القانون</h2>
          <p>يحمي قانون مكافحة التمييز (<em>diskrimineringslagen</em>، 2008) من التمييز على سبعة أسس: الجنس، والهوية أو التعبير الجندري، والأصل العرقي، والدين أو المعتقد، والإعاقة، والميل الجنسي، والعمر. ويسري في العمل والتعليم والرعاية الصحية والسكن والخدمات العامة.</p>
          <h2>زواج المثليين والأسر قوس قزح</h2>
          <p>زواج المثليين قانوني منذ عام 2009. ويمكن للأزواج من الجنس نفسه التبنّي والحصول على علاج الخصوبة على قدم المساواة. ويمكن للأشخاص المتحولين جنسيًا تغيير جنسهم القانوني دون متطلبات طبية.</p>
          <h2>الإجازة الوالدية</h2>
          <p>480 يومًا لكل طفل، منها 90 يومًا محجوزة لكل والد ("pappamånader") ولا يمكن نقلها. الهدف: أن يبقى كلا الوالدين في المنزل. عيد الميلاد الأول لطفل في السويد عادةً ما يحتفل به بالغان متعبان قليلًا، لا واحد.</p>
          <h2>مسؤوليات المنزل</h2>
          <p>الطبخ والتنظيف ورعاية الأطفال وإدارة شؤون المنزل ليست مهامًا ذات طابع جنسي في السويد — على الأقل ليس رسميًا. وتظهر الاستطلاعات أن هذا هو البلد الأكثر مساواة في الوقت المخصص للأعمال المنزلية. (الإحصاءات، مثل المراهقين، تكذب قليلًا.)</p>
          <h2>المرأة والعمل</h2>
          <p>مشاركة المرأة في سوق العمل من بين الأعلى في العالم (نحو 80%). فجوة الأجور بين الجنسين حقيقية (نحو 10–12%) لكنها تتقلص. ووفيات الأمهات من بين الأدنى في العالم.</p>
          ${ebookFactBox('ar', null, 'زواج المثليين: 2009 · أسس التمييز: 7 · الإجازة الوالدية: 480 يومًا · المحجوز لكل والد: 90 يومًا لكل منهما.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>یەکسان لەبەردەم یاسا</h2>
          <p>یاسای دژەجیاوازی (<em>diskrimineringslagen</em>، 2008) پاراستن دەکات لە جیاوازی لەسەر حەوت بنەما: ڕەگەز، ناسنامە یان دەربڕینی جێندەری، ڕەگەزنامە، ئایین یان باوەڕ، کەمئەندامی، ئاراستەی سێکسی، و تەمەن. لە کار، خوێندن، تەندروستی، نیشتەجێبوون و خزمەتگوزاریی گشتیدا جێبەجێ دەبێت.</p>
          <h2>هاوسەرگیریی هاوڕەگەز و خێزانە ڕەنگاوڕەنگەکان</h2>
          <p>هاوسەرگیریی هاوڕەگەز لە 2009ەوە یاساییە. هاوسەرە هاوڕەگەزەکان دەتوانن بە مەرجی یەکسان منداڵ بگرنە خۆیان و دەستیان بە چارەسەری بەرهەمهێنان ڕابگات. کەسانی ترانس دەتوانن بەبێ هیچ مەرجێکی پزیشکی ڕەگەزی یاساییان بگۆڕن.</p>
          <h2>مۆڵەتی دایک‌وباوکی</h2>
          <p>480 ڕۆژ بۆ هەر منداڵێک، کە 90 ڕۆژیان بۆ هەر دایک یان باوکێک تەرخانکراوە ("pappamånader") و ناگوازرێنەوە. ئامانج: هەردوو دایک و باوک لە ماڵ بمێننەوە. لە سویددا یەکەم ڕۆژی لەدایکبوونی منداڵ زۆرجار دوو گەورەی کەمێک ماندوو ئاهەنگی بۆ دەگێڕن، نەک یەکێک.</p>
          <h2>بەرپرسیارێتیی ماڵ</h2>
          <p>چێشت لێنان، پاککردنەوە، چاودێریی منداڵ و کاروباری ماڵ لە سویددا ئەرکی تایبەت بە ڕەگەزێک نین — هیچ‌نەبێت بە فەرمی. ڕاپرسییەکان دەریدەخەن کە ئەمە ئەو وڵاتەیە کە کاتی تەرخانکراو بۆ کاری ماڵ یەکسانترینە تێیدا. (ئامارەکان، وەک هەرزەکاران، کەمێک درۆ دەکەن.)</p>
          <h2>ژنان و کار</h2>
          <p>بەشداریی ژنان لە بازاڕی کاردا لە بەرزترینەکانی جیهانە (نزیکەی 80%). جیاوازیی موچە لەنێوان ڕەگەزدا ڕاستەقینەیە (نزیکەی 10–12%) بەڵام کەم دەبێتەوە. مردنی دایکان لە کەمترینەکانی جیهانە.</p>
          ${ebookFactBox('ckb', null, 'هاوسەرگیریی هاوڕەگەز: 2009 · بنەماکانی جیاوازی: 7 · مۆڵەتی دایک‌وباوکی: 480 ڕۆژ · تەرخانکراو بۆ هەر دایک‌وباوکێک: 90 ڕۆژ بۆ هەرکامیان.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>برابر در برابر قانون</h2>
          <p>قانون منع تبعیض (<em>diskrimineringslagen</em>، 2008) از تبعیض بر هفت مبنا محافظت می‌کند: جنسیت، هویت یا بیان جنسیتی، قومیت، دین یا باور، معلولیت، گرایش جنسی و سن. این قانون در کار، آموزش، خدمات بهداشتی، مسکن و خدمات عمومی اجرا می‌شود.</p>
          <h2>ازدواج هم‌جنس و خانواده‌های رنگین‌کمانی</h2>
          <p>ازدواج هم‌جنس از سال 2009 قانونی است. زوج‌های هم‌جنس می‌توانند با شرایط برابر فرزندخواندگی و درمان ناباروری داشته باشند. افراد تراجنسیتی می‌توانند بدون هیچ الزام پزشکی جنسیت قانونی خود را تغییر دهند.</p>
          <h2>مرخصی والدین</h2>
          <p>480 روز برای هر کودک که 90 روز آن برای هر یک از والدین کنار گذاشته شده است ("pappamånader") و قابل انتقال نیست. هدف این است که هر دو والد در خانه بمانند. در سوئد، اولین تولد یک کودک را معمولاً دو بزرگسالِ کمی خسته جشن می‌گیرند، نه یک نفر.</p>
          <h2>مسئولیت‌های خانه</h2>
          <p>آشپزی، نظافت، نگهداری از کودک و امور خانه در سوئد وظایفی جنسیتی نیستند — دست‌کم نه به‌طور رسمی. نظرسنجی‌ها نشان می‌دهند این کشور برابرترین کشور از نظر زمان صرف‌شده برای کارهای خانه است. (آمارها، مانند نوجوانان، کمی دروغ می‌گویند.)</p>
          <h2>زنان و کار</h2>
          <p>مشارکت زنان در نیروی کار از بالاترین‌های جهان است (حدود 80%). شکاف دستمزد جنسیتی واقعی است (حدود 10–12%) اما در حال کاهش است. مرگ‌ومیر مادران نیز از کم‌ترین‌های جهان است.</p>
          ${ebookFactBox('fa', null, 'ازدواج هم‌جنس: 2009 · مبانی تبعیض: 7 · مرخصی والدین: 480 روز · کنارگذاشته برای هر والد: هرکدام 90 روز.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Równi wobec prawa</h2>
          <p>Ustawa antydyskryminacyjna (<em>diskrimineringslagen</em>, 2008) chroni przed dyskryminacją z siedmiu powodów: płci, tożsamości lub ekspresji płciowej, pochodzenia etnicznego, religii lub przekonań, niepełnosprawności, orientacji seksualnej oraz wieku. Obowiązuje w pracy, edukacji, opiece zdrowotnej, mieszkalnictwie i usługach publicznych.</p>
          <h2>Małżeństwa jednopłciowe i tęczowe rodziny</h2>
          <p>Małżeństwa jednopłciowe są legalne od 2009 roku. Pary jednopłciowe mogą adoptować dzieci i korzystać z leczenia niepłodności na równych zasadach. Osoby transpłciowe mogą zmienić swoją płeć prawną bez wymogów medycznych.</p>
          <h2>Urlop rodzicielski</h2>
          <p>480 dni na dziecko, z czego 90 jest zarezerwowanych dla każdego z rodziców ("pappamånader") i nie można ich przenieść. Cel: oboje rodzice zostają w domu. Pierwsze urodziny dziecka w Szwecji świętuje zwykle dwoje lekko zmęczonych dorosłych, a nie jedno.</p>
          <h2>Obowiązki domowe</h2>
          <p>Gotowanie, sprzątanie, opieka nad dziećmi i prowadzenie domu nie są w Szwecji zadaniami przypisanymi do płci — przynajmniej nie oficjalnie. Badania pokazują, że to kraj o najbardziej równym podziale czasu poświęcanego na prace domowe. (Statystyki, jak nastolatki, trochę kłamią.)</p>
          <h2>Kobiety i praca</h2>
          <p>Aktywność zawodowa kobiet należy do najwyższych na świecie (~80%). Luka płacowa między płciami jest realna (~10–12%), ale się zmniejsza. Śmiertelność okołoporodowa należy do najniższych na świecie.</p>
          ${ebookFactBox('pl', null, 'Małżeństwa jednopłciowe: 2009 · Przesłanki dyskryminacji: 7 · Urlop rodzicielski: 480 dni · Zarezerwowane dla każdego rodzica: po 90 dni.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Sharcigu way isku mid yihiin</h2>
          <p>Sharciga ka-hortagga takoorka (<em>diskrimineringslagen</em>, 2008) wuxuu ka ilaaliyaa takoor ku saleysan toddoba sababood: jinsiga, aqoonsiga ama muujinta jinsiyeed, qowmiyadda, diinta ama caqiidada, naafonimada, jihada galmada, iyo da'da. Wuxuu khuseeyaa shaqada, waxbarashada, daryeelka caafimaadka, guriyeynta, iyo adeegyada dadweynaha.</p>
          <h2>Guurka isku-jinsiga ah iyo qoysaska qaansoroobaadka</h2>
          <p>Guurka isku-jinsiga ahi wuxuu sharci ahaa tan iyo 2009. Lammaanaha isku-jinsiga ahi waxay korsan karaan carruur oo heli karaan daawaynta dhalmada si siman. Dadka jinsi-beddelka ahi waxay bedeli karaan jinsigooda sharci iyada oo aan loo baahnayn shuruudo caafimaad.</p>
          <h2>Fasaxa waalidnimada</h2>
          <p>480 maalmood ilmo kasta, kuwaas oo 90 loogu kaydiyay waalid kasta ("pappamånader") oo aan la wareejin karin. Ujeeddadu waa: labada waalidba inay guriga joogaan. Iswiidhan, dhalashada koowaad ee ilmo waxaa badanaa u dabaaldega laba qof oo waaweyn oo wax yar daallan, ma aha mid keliya.</p>
          <h2>Mas'uuliyadaha guriga</h2>
          <p>Karinta, nadiifinta, daryeelka carruurta, iyo maamulka guriga maaha hawlo jinsi gaar ah lagu xidho Iswiidhan — ugu yaraan si rasmi ah. Sahannada ayaa muujinaya inay tani tahay dalka ugu sinnaan badan waqtiga lagu qaato shaqada guriga. (Tirakoobyadu, sida dhallinyarada, wax yar bay been sheegaan.)</p>
          <h2>Dumarka iyo shaqada</h2>
          <p>Ka-qaybgalka dumarka ee xoogga shaqada wuxuu ka mid yahay kuwa ugu sarreeya adduunka (~80%). Farqiga mushaharka ee jinsiyeed waa run (~10–12%) laakiin wuu yaraanayaa. Dhimashada hooyooyinka ayaa ka mid ah kuwa ugu hooseeya adduunka.</p>
          ${ebookFactBox('so', null, 'Guurka isku-jinsiga ah: 2009 · Sababaha takoorka: 7 · Fasaxa waalidnimada: 480 maalmood · Loo kaydiyay waalid kasta: 90 maalmood mid kasta.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ኣብ ሕጊ ማዕረ</h2>
          <p>ሕጊ ጸረ-ኣድልዎ (<em>diskrimineringslagen</em>፣ 2008) ካብ ኣብ ሸውዓተ መሰረታት ዝግበር ኣድልዎ ይከላኸል፦ ጾታ፣ ጾታዊ መንነት ወይ መግለጺ፣ ብሄር፣ ሃይማኖት ወይ እምነት፣ ስንክልና፣ ጾታዊ ዝምባለ፣ ከምኡውን ዕድመ። ኣብ ስራሕ፣ ትምህርቲ፣ ክንክን ጥዕና፣ መንበሪ ቤትን ህዝባዊ ኣገልግሎታትን ይትግበር።</p>
          <h2>ናይ ሓደ ጾታ መውስቦን ሕብራዊ ስድራቤታትን</h2>
          <p>ናይ ሓደ ጾታ መውስቦ ካብ 2009 ጀሚሩ ሕጋዊ እዩ። ናይ ሓደ ጾታ ጽምዲ ብማዕረ ኩነታት ቆልዓ ክቕበሉን ናይ ምውላድ ሕክምና ክረኽቡን ይኽእሉ። ጾታ ዝቐየሩ ሰባት ብዘይ ዝኾነ ሕክምናዊ መሰረታት ሕጋዊ ጾታኦም ክቕይሩ ይኽእሉ።</p>
          <h2>ናይ ወለዲ ዕረፍቲ</h2>
          <p>480 መዓልታት ኣብ ሓደ ቆልዓ፣ ካብኡ 90 መዓልታት ንነፍሲ ወከፍ ወላዲ ዝተሓዝአ ("pappamånader") ኮይኑ ክመሓላለፍ ኣይከኣልን። ዕላማ፦ ክልቲኦም ወለዲ ኣብ ገዛ ክጸንሑ። ኣብ ሽወደን ቀዳማይ ልደት ሓደ ቆልዓ መብዛሕትኡ ግዜ ብክልተ ቁሩብ ዝደኸሙ ዓበይቲ እዩ ዝብዓል፣ ብሓደ ኣይኮነን።</p>
          <h2>ናይ ገዛ ሓላፍነታት</h2>
          <p>ምግቢ ምስራሕ፣ ምጽራይ፣ ክንክን ቆልዑን ምሕደራ ገዛን ኣብ ሽወደን ብጾታ ዝፍለ ስራሕ ኣይኮነን — እንተወሓደ ብወግዓዊ መንገዲ። መጽናዕትታት ከም ዘርእዮ እዚ እታ ኣብ ስራሕ ገዛ ዝውዕል ግዜ ብዝያዳ ማዕረ ዝኾነላ ሃገር እያ። (ስታቲስቲክስ፣ ከም ጎበዛት፣ ቁሩብ ይሕሱ እዮም።)</p>
          <h2>ደቂ ኣንስትዮን ስራሕን</h2>
          <p>ተሳትፎ ደቂ ኣንስትዮ ኣብ ዓውዲ ስራሕ ካብ ናይ ዓለም ዝለዓለ እዩ (ኣስታት 80%)። ጋግ ደሞዝ ኣብ መንጎ ጾታ ሓቂ እዩ (ኣስታት 10–12%) ግን ይጸብብ ኣሎ። ሞት ኣዴታት ካብ ናይ ዓለም ዝተሓተ እዩ።</p>
          ${ebookFactBox('ti', null, 'ናይ ሓደ ጾታ መውስቦ፦ 2009 · መሰረታት ኣድልዎ፦ 7 · ናይ ወለዲ ዕረፍቲ፦ 480 መዓልታት · ንነፍሲ ወከፍ ወላዲ ዝተሓዝአ፦ 90 መዓልታት ንነፍሲ ወከፍ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Yasa önünde eşit</h2>
          <p>Ayrımcılık Yasası (<em>diskrimineringslagen</em>, 2008) yedi temelde ayrımcılığa karşı korur: cinsiyet, cinsiyet kimliği veya ifadesi, etnik köken, din veya inanç, engellilik, cinsel yönelim ve yaş. İş, eğitim, sağlık, konut ve kamu hizmetlerinde geçerlidir.</p>
          <h2>Eşcinsel evlilik ve gökkuşağı aileleri</h2>
          <p>Eşcinsel evlilik 2009'dan beri yasaldır. Eşcinsel çiftler eşit koşullarda evlat edinebilir ve doğurganlık tedavisine erişebilir. Trans bireyler tıbbi gereklilik olmadan yasal cinsiyetlerini değiştirebilir.</p>
          <h2>Ebeveyn izni</h2>
          <p>Çocuk başına 480 gün; bunun 90 günü her ebeveyne ayrılmıştır ("pappamånader") ve devredilemez. Amaç: her iki ebeveynin de evde kalması. İsveç'te bir çocuğun ilk doğum günü genellikle bir değil, biraz yorgun iki yetişkin tarafından kutlanır.</p>
          <h2>Ev sorumlulukları</h2>
          <p>Yemek, temizlik, çocuk bakımı ve ev işleri İsveç'te cinsiyete dayalı görevler değildir — en azından resmi olarak. Anketler, bunun ev işlerine ayrılan zaman bakımından en eşit ülke olduğunu gösteriyor. (İstatistikler, tıpkı ergenler gibi, biraz yalan söyler.)</p>
          <h2>Kadınlar ve çalışma</h2>
          <p>Kadınların iş gücüne katılımı dünyada en yüksekler arasındadır (~%80). Cinsiyetler arası ücret farkı gerçektir (~%10–12) ama azalmaktadır. Anne ölümleri dünyada en düşükler arasındadır.</p>
          ${ebookFactBox('tr', null, "Eşcinsel evlilik: 2009 · Ayrımcılık temelleri: 7 · Ebeveyn izni: 480 gün · Her ebeveyne ayrılan: 90'ar gün.", ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Рівні перед законом</h2>
          <p>Закон про недискримінацію (<em>diskrimineringslagen</em>, 2008) захищає від дискримінації за сімома ознаками: стать, гендерна ідентичність або вираження, етнічна належність, релігія чи переконання, інвалідність, сексуальна орієнтація та вік. Він діє у сфері праці, освіти, охорони здоров'я, житла та публічних послуг.</p>
          <h2>Одностатеві шлюби та веселкові родини</h2>
          <p>Одностатеві шлюби легальні з 2009 року. Одностатеві пари можуть усиновлювати дітей і користуватися лікуванням безпліддя на рівних умовах. Трансгендерні люди можуть змінити свою юридичну стать без медичних вимог.</p>
          <h2>Батьківська відпустка</h2>
          <p>480 днів на дитину, з яких 90 зарезервовано за кожним із батьків ("pappamånader") і не можуть бути передані. Мета: щоб удома залишалися обидва з батьків. Перший день народження дитини у Швеції зазвичай святкують двоє трохи втомлених дорослих, а не один.</p>
          <h2>Домашні обов'язки</h2>
          <p>Готування, прибирання, догляд за дітьми та ведення домашнього господарства у Швеції не є завданнями, прив'язаними до статі — принаймні офіційно. Опитування показують, що це країна з найрівномірнішим розподілом часу на хатню роботу. (Статистика, як підлітки, трохи бреше.)</p>
          <h2>Жінки та робота</h2>
          <p>Участь жінок у робочій силі — одна з найвищих у світі (~80%). Гендерний розрив в оплаті праці реальний (~10–12%), але скорочується. Материнська смертність — одна з найнижчих у світі.</p>
          ${ebookFactBox('uk', null, 'Одностатеві шлюби: 2009 · Ознаки дискримінації: 7 · Батьківська відпустка: 480 днів · Зарезервовано за кожним із батьків: по 90 днів.', ['uhrStudyMaterial'])}
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
      title: {
        en: 'Society, school,',
        sv: 'Samhälle, skola',
        'zh-Hans': '社会、学校',
        'zh-Hant': '社會、學校',
        ar: 'المجتمع والمدرسة',
        ckb: 'کۆمەڵگا، خوێندنگە',
        fa: 'جامعه، مدرسه',
        pl: 'Społeczeństwo, szkoła',
        so: 'Bulshada, dugsiga',
        ti: 'ሕብረተሰብ፣ ቤት ትምህርቲ',
        tr: 'Toplum, okul',
        uk: 'Суспільство, школа',
      },
      title_em: {
        en: 'and healthcare.',
        sv: 'och vård.',
        'zh-Hans': '与医疗。',
        'zh-Hant': '與醫療。',
        ar: 'والرعاية الصحية.',
        ckb: 'و چاودێری تەندروستی.',
        fa: 'و مراقبت بهداشتی.',
        pl: 'i opieka zdrowotna.',
        so: 'iyo daryeelka caafimaadka.',
        ti: 'ከምኡ’ውን ክንክን ጥዕና።',
        tr: 've sağlık hizmeti.',
        uk: 'та охорона здоров’я.',
      },
      lede: {
        en: 'Sweden runs the boring parts of life — school, healthcare, eldercare — through the public sector, and is largely on first-name terms with its bureaucrats.',
        sv: 'Sverige sköter livets tråkiga delar — skola, vård, äldreomsorg — i offentlig regi, och är på förnamn med byråkraterna.',
        'zh-Hans':
          '瑞典把生活中那些枯燥的部分——学校、医疗、养老照护——交给公共部门来打理，而且基本上跟自己的官员都是直呼其名的关系。',
        'zh-Hant':
          '瑞典把生活中那些枯燥的部分——學校、醫療、養老照護——交給公共部門來打理，而且基本上跟自己的官員都是直呼其名的關係。',
        ar: 'تتولّى السويد الأجزاء المملّة من الحياة — المدرسة والرعاية الصحية ورعاية المسنّين — عبر القطاع العام، وهي إلى حدٍّ كبير على علاقة تنادي فيها موظفيها بأسمائهم الأولى.',
        ckb: 'سوید بەشە بێزارکەرەکانی ژیان — خوێندنگە، چاودێری تەندروستی، چاودێری بەساڵاچووان — لە ڕێگەی کەرتی گشتییەوە بەڕێوە دەبات، و زۆرتر لەگەڵ کارمەندە دەوڵەتییەکانی بە ناوی یەکەم بانگ دەکات.',
        fa: 'سوئد بخش‌های کسل‌کنندهٔ زندگی — مدرسه، مراقبت بهداشتی، مراقبت از سالمندان — را از طریق بخش عمومی اداره می‌کند و تا حد زیادی کارمندان اداری‌اش را با نام کوچک صدا می‌زند.',
        pl: 'Szwecja zajmuje się nudnymi częściami życia — szkołą, opieką zdrowotną, opieką nad seniorami — poprzez sektor publiczny i w dużej mierze zwraca się do swoich urzędników po imieniu.',
        so: 'Iswiidhan waxay qaybaha caajiska ah ee nolosha — dugsiga, daryeelka caafimaadka, daryeelka waayeelka — ku maamushaa qaybta dadweynaha, oo inta badan shaqaalaheeda dawladeed waxay ugu yeeraan magacooda hore.',
        ti: 'ሽወደን ነቶም ኣሰልቸውቲ ክፍልታት ህይወት — ቤት ትምህርቲ፣ ክንክን ጥዕና፣ ክንክን ኣረጋውያን — ብመንግስታዊ ጽላት ተመሓድሮም፣ ምስ ሰብ-መዚኣ ድማ መብዛሕትኡ ግዜ ብቐዳማይ ስም ኢያ እትጽውዕ።',
        tr: 'İsveç hayatın sıkıcı kısımlarını — okul, sağlık hizmeti, yaşlı bakımı — kamu sektörü aracılığıyla yürütür ve büyük ölçüde bürokratlarına ilk adıyla hitap eder.',
        uk: 'Швеція веде нудні частини життя — школу, охорону здоров’я, догляд за літніми — через державний сектор і здебільшого звертається до своїх чиновників на ім’я.',
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
          <p>义务教育阶段（<em>grundskolan</em>，基础学校）为期十年，从 6 岁（förskoleklass，学前班）一直到 9 年级。之后是三年的高中（<em>gymnasium</em>）——分学术或职业方向，两者都免费。大学对公民、欧盟/欧洲经济区居民以及持有瑞典居留许可的人也是免费的。</p>
          <p>《教育法》保障平等的入学机会，无论背景、性别或居住地。私立学校和"自由学校"（<em>friskolor</em>）也存在，但不得收取学费。</p>
          <h2>医疗</h2>
          <p>医疗主要由税收资助，在区域层级运作（21 个大区）。你每次看医生需支付一笔小额费用（通常为 100–400 瑞典克朗），处方药和住院费用每年设有上限（<em>högkostnadsskydd</em>，高费用保障）。儿童医疗免费。</p>
          <p>1177 是全国性的医疗热线和网站。日常就诊通过你的 <em>vårdcentral</em>（社区医疗中心）；急诊通过 <em>akutmottagning</em>（急诊科）；心理和牙科医疗也有，但收费规则不同。</p>
          <h2>养老照护</h2>
          <p>养老照护由市镇负责——居家帮助（<em>hemtjänst</em>，居家照护服务）、特殊住所以及紧急呼叫警报。其原则是尽可能长久地独立生活的权利；而实际情况则因市镇而异。</p>
          <h2>社会服务</h2>
          <p>Socialtjänsten（社会服务局）为任何无法自食其力的人提供支持——经济援助（försörjningsstöd，生活补助）、儿童福利、成瘾支持、家庭帮助。当某个儿童处于危险中时，他们还负有法定的干预义务。</p>
          ${ebookFactBox('zh-Hans', null, '义务教育：10 年（förskoleklass + 1–9 年级） · 医疗热线：1177 · 大区数量：21 · 大学学费：居民免费。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>學校</h2>
          <p>義務教育階段（<em>grundskolan</em>，基礎學校）為期十年，從 6 歲（förskoleklass，學前班）一直到 9 年級。之後是三年的高中（<em>gymnasium</em>）——分學術或職業方向，兩者都免費。大學對公民、歐盟/歐洲經濟區居民以及持有瑞典居留許可的人也是免費的。</p>
          <p>《教育法》保障平等的入學機會，無論背景、性別或居住地。私立學校和「自由學校」（<em>friskolor</em>）也存在，但不得收取學費。</p>
          <h2>醫療</h2>
          <p>醫療主要由稅收資助，在區域層級運作（21 個大區）。你每次看醫生需支付一筆小額費用（通常為 100–400 瑞典克朗），處方藥和住院費用每年設有上限（<em>högkostnadsskydd</em>，高費用保障）。兒童醫療免費。</p>
          <p>1177 是全國性的醫療熱線和網站。日常就診透過你的 <em>vårdcentral</em>（社區醫療中心）；急診透過 <em>akutmottagning</em>（急診科）；心理和牙科醫療也有，但收費規則不同。</p>
          <h2>養老照護</h2>
          <p>養老照護由市鎮負責——居家幫助（<em>hemtjänst</em>，居家照護服務）、特殊住所以及緊急呼叫警報。其原則是盡可能長久地獨立生活的權利；而實際情況則因市鎮而異。</p>
          <h2>社會服務</h2>
          <p>Socialtjänsten（社會服務局）為任何無法自食其力的人提供支援——經濟援助（försörjningsstöd，生活補助）、兒童福利、成癮支援、家庭幫助。當某個兒童處於危險中時，他們還負有法定的介入義務。</p>
          ${ebookFactBox('zh-Hant', null, '義務教育：10 年（förskoleklass + 1–9 年級） · 醫療熱線：1177 · 大區數量：21 · 大學學費：居民免費。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>المدرسة</h2>
          <p>التعليم الإلزامي (<em>grundskolan</em> — المدرسة الأساسية) عشر سنوات، من سنّ 6 (förskoleklass — صف ما قبل المدرسة) حتى الصف التاسع. بعد ذلك ثلاث سنوات من المرحلة الثانوية العليا (<em>gymnasium</em>) — مسارات أكاديمية أو مهنية، وكلاهما مجاني. والجامعة مجانية أيضًا للمواطنين، ومقيمي الاتحاد الأوروبي/المنطقة الاقتصادية الأوروبية، ومن يحملون تصريح إقامة سويدي.</p>
          <p>يضمن قانون التعليم تكافؤ فرص الوصول بصرف النظر عن الخلفية أو الجنس أو مكان السكن. وتوجد مدارس خاصة و"حرّة" (<em>friskolor</em>) لكن لا يجوز لها فرض رسوم دراسية.</p>
          <h2>الرعاية الصحية</h2>
          <p>الرعاية الصحية ممولة في معظمها من الضرائب وتُدار على المستوى الإقليمي (21 منطقة). تدفع رسمًا صغيرًا (عادةً 100–400 كرونة) عن كل زيارة للطبيب، وتُوضع سقوف سنوية لأدوية الوصفات الطبية ورسوم المستشفى (<em>högkostnadsskydd</em> — الحماية من التكاليف العالية). الرعاية الصحية للأطفال مجانية.</p>
          <p>رقم 1177 هو الخط الساخن والموقع الصحي الوطني. الرعاية الاعتيادية تمرّ عبر <em>vårdcentral</em> الخاص بك (مركز الرعاية الصحية)؛ وحالات الطوارئ عبر <em>akutmottagning</em> (قسم الطوارئ)؛ وتتوفّر الرعاية النفسية ورعاية الأسنان لكن بقواعد رسوم مختلفة.</p>
          <h2>رعاية المسنّين</h2>
          <p>تتولّى البلدية رعاية المسنّين — المساعدة المنزلية (<em>hemtjänst</em> — خدمة الرعاية المنزلية)، والسكن الخاص، وأجهزة إنذار الطوارئ. المبدأ هو الحق في العيش باستقلالية أطول مدة ممكنة؛ أما الواقع فيتفاوت من بلدية إلى أخرى.</p>
          <h2>الخدمات الاجتماعية</h2>
          <p>تدعم Socialtjänsten (دائرة الخدمات الاجتماعية) كل من يعجز عن إعالة نفسه — المساعدة المالية (försörjningsstöd — إعانة المعيشة)، ورعاية الطفولة، ودعم الإدمان، ومساعدة الأسرة. وعليها أيضًا التزامات قانونية بالتدخّل حين يكون طفلٌ في خطر.</p>
          ${ebookFactBox('ar', null, 'التعليم الإلزامي: 10 سنوات (förskoleklass + الصفوف 1–9) · الخط الساخن الصحي: 1177 · عدد المناطق: 21 · رسوم الجامعة: مجانية للمقيمين.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>خوێندنگە</h2>
          <p>خوێندنی ناچاری (<em>grundskolan</em> — قوتابخانەی بنەڕەت) دە ساڵە، لە تەمەنی 6 (förskoleklass — پۆلی پێش‌قوتابخانە) تا پۆلی نۆیەم. دوای ئەوە، سێ ساڵ خوێندنی ئامادەیی (<em>gymnasium</em>) — ڕێچکەی ئەکادیمی یان پیشەیی، هەردووکیان بەخۆڕایین. زانکۆش بەخۆڕاییە بۆ هاووڵاتییان، دانیشتووانی یەکێتیی ئەورووپا/ناوچەی ئابووریی ئەورووپا، و ئەو کەسانەی مۆڵەتی نیشتەجێبوونی سویدیان هەیە.</p>
          <p>یاسای پەروەردە دەستڕاگەیشتنی یەکسان دڵنیا دەکاتەوە بەبێ گوێدان بە پاشخان، ڕەگەز، یان ئەوەی لەکوێ دەژیت. قوتابخانەی تایبەت و "ئازاد" (<em>friskolor</em>) هەن بەڵام ناتوانن کرێی خوێندن وەربگرن.</p>
          <h2>چاودێری تەندروستی</h2>
          <p>چاودێری تەندروستی زۆرتر لە باجەوە دابین دەکرێت و لە ئاستی هەرێمیدا کاردەکات (21 هەرێم). بۆ هەر سەردانێکی پزیشک کرێیەکی بچووک دەدەیت (بەزۆری 100–400 کرۆن)، و دەرمانی نووسراو و کرێی نەخۆشخانە بە ساڵانە سنووردارکراون (<em>högkostnadsskydd</em> — پاراستن لە تێچووی بەرز). چاودێری تەندروستیی منداڵان بەخۆڕاییە.</p>
          <p>1177 هێڵی پەیوەندی و ماڵپەڕی تەندروستیی نیشتمانییە. چاودێریی ئاسایی لە ڕێگەی <em>vårdcentral</em>ـەکەتەوەیە (ناوەندی چاودێری تەندروستی)؛ کاتی فریاکەوتن لە ڕێگەی <em>akutmottagning</em>ـەوە (بەشی فریاکەوتن)؛ چاودێری دەروونی و ددان هەن بەڵام بە یاسای کرێی جیاواز.</p>
          <h2>چاودێری بەساڵاچووان</h2>
          <p>شارەوانی چاودێریی بەساڵاچووان بەڕێوە دەبات — یارمەتیی ماڵەوە (<em>hemtjänst</em> — خزمەتگوزاریی چاودێریی ماڵەوە)، نیشتەجێبوونی تایبەت، و ئاژیری فریاکەوتن. بنەماکە مافی ژیانی سەربەخۆیە بۆ ئەوپەڕی ماوەی گونجاو؛ بەڵام پراکتیزەکردنەکەی لە شارەوانییەوە بۆ شارەوانی جیاوازە.</p>
          <h2>خزمەتگوزارییە کۆمەڵایەتییەکان</h2>
          <p>Socialtjänsten (لقی خزمەتگوزاری کۆمەڵایەتی) پشتگیریی هەر کەسێک دەکات کە ناتوانێت بەخۆی بژێوی خۆی دابین بکات — یارمەتیی دارایی (försörjningsstöd — یارمەتیی بژێوی)، خۆشگوزەرانیی منداڵ، پشتگیریی ئالوودەبوون، یارمەتیی خێزان. هەروەها ئەرکی یاسایییان هەیە بۆ دەستێوەردان لەکاتێکدا منداڵێک لە مەترسیدا بێت.</p>
          ${ebookFactBox('ckb', null, 'خوێندنی ناچاری: 10 ساڵ (förskoleklass + پۆلەکانی 1–9) · هێڵی تەندروستی: 1177 · ژمارەی هەرێمەکان: 21 · کرێی زانکۆ: بەخۆڕایی بۆ دانیشتووان.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>مدرسه</h2>
          <p>آموزش اجباری (<em>grundskolan</em> — مدرسهٔ پایه) ده سال است، از سن 6 (förskoleklass — کلاس پیش‌دبستانی) تا کلاس نهم. پس از آن، سه سال دبیرستان (<em>gymnasium</em>) — مسیرهای دانشگاهی یا حرفه‌ای، هر دو رایگان. دانشگاه نیز برای شهروندان، ساکنان اتحادیهٔ اروپا/منطقهٔ اقتصادی اروپا و دارندگان مجوز اقامت سوئد رایگان است.</p>
          <p>قانون آموزش دسترسی برابر را بدون توجه به پیشینه، جنسیت یا محل زندگی تضمین می‌کند. مدرسه‌های خصوصی و "آزاد" (<em>friskolor</em>) وجود دارند اما نمی‌توانند شهریه بگیرند.</p>
          <h2>مراقبت بهداشتی</h2>
          <p>مراقبت بهداشتی بیشتر از محل مالیات تأمین می‌شود و در سطح منطقه‌ای اداره می‌شود (21 منطقه). برای هر مراجعه به پزشک هزینهٔ اندکی می‌پردازید (معمولاً 100 تا 400 کرون)، و داروهای نسخه‌ای و هزینه‌های بیمارستانی سالانه سقف دارند (<em>högkostnadsskydd</em> — حفاظت در برابر هزینهٔ بالا). مراقبت بهداشتی کودکان رایگان است.</p>
          <p>1177 خط تلفن و وب‌سایت ملی سلامت است. مراقبت معمول از طریق <em>vårdcentral</em> شما انجام می‌شود (مرکز مراقبت بهداشتی)؛ موارد اورژانسی از طریق <em>akutmottagning</em> (بخش اورژانس)؛ مراقبت روانی و دندان‌پزشکی وجود دارند اما با قواعد هزینهٔ متفاوت.</p>
          <h2>مراقبت از سالمندان</h2>
          <p>شهرداری مراقبت از سالمندان را اداره می‌کند — کمک خانگی (<em>hemtjänst</em> — خدمات مراقبت خانگی)، اقامتگاه ویژه و آژیرهای اضطراری. اصل بر حق زندگی مستقل تا حد امکان است؛ اما در عمل از شهرداری به شهرداری متفاوت است.</p>
          <h2>خدمات اجتماعی</h2>
          <p>Socialtjänsten (ادارهٔ خدمات اجتماعی) از هر کسی که نمی‌تواند خود را تأمین کند پشتیبانی می‌کند — کمک مالی (försörjningsstöd — کمک‌هزینهٔ معیشت)، رفاه کودک، حمایت از اعتیاد، کمک به خانواده. آن‌ها همچنین تعهدات قانونی برای مداخله در جایی که کودکی در خطر است دارند.</p>
          ${ebookFactBox('fa', null, 'آموزش اجباری: 10 سال (förskoleklass + کلاس‌های 1 تا 9) · خط سلامت: 1177 · تعداد مناطق: 21 · شهریهٔ دانشگاه: برای ساکنان رایگان.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Szkoła</h2>
          <p>Szkoła obowiązkowa (<em>grundskolan</em> — szkoła podstawowa) trwa dziesięć lat, od 6. roku życia (förskoleklass — klasa zerowa) do 9. klasy. Potem trzy lata szkoły średniej (<em>gymnasium</em>) — ścieżka akademicka lub zawodowa, obie bezpłatne. Uczelnia jest również bezpłatna dla obywateli, mieszkańców UE/EOG oraz osób z szwedzkim zezwoleniem na pobyt.</p>
          <p>Ustawa o oświacie gwarantuje równy dostęp niezależnie od pochodzenia, płci czy miejsca zamieszkania. Istnieją szkoły prywatne i "wolne" (<em>friskolor</em>), ale nie mogą pobierać czesnego.</p>
          <h2>Opieka zdrowotna</h2>
          <p>Opieka zdrowotna jest w większości finansowana z podatków i działa na poziomie regionalnym (21 regionów). Za każdą wizytę u lekarza płacisz niewielką opłatę (zwykle 100–400 SEK), a leki na receptę i opłaty szpitalne mają roczny limit (<em>högkostnadsskydd</em> — ochrona przed wysokimi kosztami). Opieka zdrowotna dla dzieci jest bezpłatna.</p>
          <p>1177 to ogólnokrajowa infolinia zdrowotna i strona internetowa. Rutynowa opieka odbywa się przez twój <em>vårdcentral</em> (przychodnia); nagłe przypadki przez <em>akutmottagning</em> (oddział ratunkowy); opieka psychiatryczna i stomatologiczna istnieją, ale z innymi zasadami opłat.</p>
          <h2>Opieka nad seniorami</h2>
          <p>Gmina prowadzi opiekę nad seniorami — pomoc domową (<em>hemtjänst</em> — usługi opieki domowej), specjalne miejsca zamieszkania i alarmy awaryjne. Zasadą jest prawo do jak najdłuższego samodzielnego życia; praktyka różni się w zależności od gminy.</p>
          <h2>Usługi społeczne</h2>
          <p>Socialtjänsten (opieka społeczna) wspiera każdego, kto nie jest w stanie utrzymać się samodzielnie — pomoc finansowa (försörjningsstöd — zasiłek na utrzymanie), opieka nad dzieckiem, wsparcie w uzależnieniach, pomoc rodzinie. Mają również prawny obowiązek interwencji, gdy dziecko jest zagrożone.</p>
          ${ebookFactBox('pl', null, 'Szkoła obowiązkowa: 10 lat (förskoleklass + klasy 1–9) · Infolinia zdrowotna: 1177 · Liczba regionów: 21 · Czesne na uczelni: bezpłatne dla mieszkańców.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Dugsiga</h2>
          <p>Dugsiga qasabka ah (<em>grundskolan</em> — dugsiga aasaasiga) waa toban sano, laga bilaabo da'da 6 (förskoleklass — fasalka dugsi-ka-hor) ilaa fasalka 9-aad. Intaas ka dib, saddex sano oo dugsi sare ah (<em>gymnasium</em>) — waddooyin tacliimeed ama xirfadeed, labaduba waa bilaash. Jaamacaddu sidoo kale waa bilaash u tahay muwaadiniinta, deggenaha EU/EEA, iyo dadka haysta ogolaansho deganaansho Iswiidhan.</p>
          <p>Sharciga Waxbarashadu wuxuu dammaanad qaadayaa helitaan siman iyadoon loo eegin asalka, jinsiga, ama meesha aad ku nooshahay. Dugsiyada gaarka ah iyo kuwa "xorta ah" (<em>friskolor</em>) way jiraan laakiin ma qaadan karaan lacag waxbarasho.</p>
          <h2>Daryeelka caafimaadka</h2>
          <p>Daryeelka caafimaadku inta badan waxaa maalgeliya canshuurta wuxuuna ka shaqeeyaa heerka gobolka (21 gobol). Waxaad bixisaa lacag yar (caadiyan 100–400 SEK) booqasho kasta oo dhakhtar, dawooyinka qoraalka ah iyo lacagaha cisbitaalka waxaa la dhigay xad sannadle ah (<em>högkostnadsskydd</em> — ilaalinta kharashka sare). Daryeelka caafimaadka carruurtu waa bilaash.</p>
          <p>1177 waa khadka caafimaadka iyo websaydhka qaranka. Daryeelka caadiga ah wuxuu maraa <em>vårdcentral</em>kaaga (xarunta daryeelka caafimaadka); xaaladaha degdegga ah waxay maraan <em>akutmottagning</em> (qaybta degdegga); daryeelka maskaxda iyo ilkaha way jiraan laakiin xeerar lacag oo kala duwan.</p>
          <h2>Daryeelka waayeelka</h2>
          <p>Degmadu waxay maamushaa daryeelka waayeelka — caawimaadda guriga (<em>hemtjänst</em> — adeegga daryeelka guriga), hoy gaar ah, iyo digniinaha degdegga ah. Mabda'gu waa xaqa lagu noolaado si madax-banaan inta ugu badan ee suurtagal ah; ficilkuse wuu kala duwan yahay degmo ilaa degmo.</p>
          <h2>Adeegyada bulshada</h2>
          <p>Socialtjänsten (adeegga bulshada) wuxuu taageeraa qof kasta oo aan is-quudin karin — caawimaad maaliyadeed (försörjningsstöd — gargaarka nolol-maalmeedka), daryeelka carruurta, taageerada balwadda, caawimaadda qoyska. Waxay sidoo kale leeyihiin waajibaad sharci ah inay farageliyaan halka ilmuhu khatar ku jiro.</p>
          ${ebookFactBox('so', null, 'Dugsiga qasabka ah: 10 sano (förskoleklass + fasallada 1–9) · Khadka caafimaadka: 1177 · Tirada gobollada: 21 · Lacagta jaamacadda: bilaash u ah deggenaha.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ቤት ትምህርቲ</h2>
          <p>ግዴታዊ ትምህርቲ (<em>grundskolan</em> — መሰረታዊ ቤት ትምህርቲ) ዓሰርተ ዓመት እዩ፣ ካብ 6 ዓመት (förskoleklass — ቅድመ-ትምህርቲ ክፍሊ) ክሳብ 9ይ ክፍሊ። ድሕሪኡ፣ ሰለስተ ዓመት ላዕለዋይ ካልኣይ ደረጃ (<em>gymnasium</em>) — ኣካዳሚያዊ ወይ ሞያዊ መንገድታት፣ ክልቲኦም ብናጻ። ዩኒቨርሲቲ’ውን ንዜጋታት፣ ነበርቲ EU/EEA፣ ከምኡ’ውን ሽወደናዊ ናይ መንበሪ ፍቓድ ንዘለዎም ብናጻ እዩ።</p>
          <p>ሕጊ ትምህርቲ ብዘይ ኣፈላላይ ድሕረ-ባይታ፣ ጾታ ወይ መንበሪ ቦታ ማዕረ ተበጻሕነት የውሕስ። ብሕታውን "ናጻ"ን ኣብያተ ትምህርቲ (<em>friskolor</em>) ኣለዋ ግን ክፍሊት ትምህርቲ ክወስዳ ኣይክእላን።</p>
          <h2>ክንክን ጥዕና</h2>
          <p>ክንክን ጥዕና መብዛሕትኡ ብግብሪ ይምወል ኣብ ደረጃ ዞባ ድማ ይካየድ (21 ዞባታት)። ንነፍሲ ወከፍ ምብጻሕ ሓኪም ንእሽቶ ክፍሊት (ብተለምዶ 100–400 ክሮነር) ትኸፍል፣ ብወረቐት ሕክምና ዝውሰዱ መድሃኒታትን ናይ ሆስፒታል ክፍሊትን ድማ ዓመታዊ ጥርዙ ኣለዎ (<em>högkostnadsskydd</em> — ካብ ላዕለዋይ ወጻኢ ዝከላኸል)። ክንክን ጥዕና ቆልዑ ብናጻ እዩ።</p>
          <p>1177 ሃገራዊ መስመር ጥዕናን መርበብ ሓበሬታን እዩ። ንቡር ክንክን ብናትካ <em>vårdcentral</em> ይኸውን (ማእከል ክንክን ጥዕና)፣ ህጹጽ ኩነታት ብ<em>akutmottagning</em> (ክፍሊ ህጹጽ)፣ ኣእምሮኣውን ናይ ስኒ ክንክንን ኣለዉ ግን ብዝተፈላለየ ሕጊ ክፍሊት።</p>
          <h2>ክንክን ኣረጋውያን</h2>
          <p>ምምሕዳር ከተማ ክንክን ኣረጋውያን የካይድ — ናይ ገዛ ሓገዝ (<em>hemtjänst</em> — ናይ ገዛ ክንክን ኣገልግሎት)፣ ፍሉይ መንበሪ፣ ከምኡ’ውን ናይ ህጹጽ ጭራሕ ድምጺ። እቲ መትከል ክሳብ ዝከኣል ብናጻነት ናይ ምንባር መሰል እዩ፣ ኣብ ግብሪ ግን ካብ ምምሕዳር ናብ ምምሕዳር ዘይማዕረ እዩ።</p>
          <h2>ማሕበራዊ ኣገልግሎታት</h2>
          <p>Socialtjänsten (ማሕበራዊ ኣገልግሎት) ንዝኾነ ንርእሱ ክናቢ ዘይክእል ይድግፍ — ገንዘባዊ ሓገዝ (försörjningsstöd — ናይ መነባብሮ ሓገዝ)፣ ድሕነት ቆልዑ፣ ናይ ወልፊ ደገፍ፣ ናይ ስድራቤት ሓገዝ። ቆልዓ ኣብ ሓደጋ ኣብ ዝህልወሉ ኩነታት ጣልቃ ናይ ምእታው ሕጋዊ ግዴታ’ውን ኣለዎም።</p>
          ${ebookFactBox('ti', null, 'ግዴታዊ ትምህርቲ: 10 ዓመት (förskoleklass + ክፍሊ 1–9) · መስመር ጥዕና: 1177 · ቁጽሪ ዞባታት: 21 · ክፍሊት ዩኒቨርሲቲ: ንነበርቲ ብናጻ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Okul</h2>
          <p>Zorunlu eğitim (<em>grundskolan</em> — temel okul) on yıldır, 6 yaşından (förskoleklass — okul öncesi sınıf) 9. sınıfa kadar. Ardından üç yıllık ortaöğretim (<em>gymnasium</em>) — akademik veya mesleki yollar, ikisi de ücretsiz. Üniversite de vatandaşlar, AB/AEA sakinleri ve İsveç oturma izni olanlar için ücretsizdir.</p>
          <p>Eğitim Yasası, geçmiş, cinsiyet veya yaşadığınız yer fark etmeksizin eşit erişimi güvence altına alır. Özel ve "serbest" okullar (<em>friskolor</em>) vardır ama ücret alamazlar.</p>
          <h2>Sağlık hizmeti</h2>
          <p>Sağlık hizmeti çoğunlukla vergiyle finanse edilir ve bölgesel düzeyde yürütülür (21 bölge). Doktora her gidişinizde küçük bir ücret ödersiniz (genellikle 100–400 SEK), reçeteli ilaçlar ve hastane ücretleri yıllık olarak tavanla sınırlanır (<em>högkostnadsskydd</em> — yüksek maliyete karşı koruma). Çocuk sağlık hizmeti ücretsizdir.</p>
          <p>1177 ulusal sağlık hattı ve web sitesidir. Rutin bakım <em>vårdcentral</em>iniz üzerinden gider (sağlık merkezi); acil durumlar <em>akutmottagning</em> üzerinden (acil servis); ruh sağlığı ve diş bakımı vardır ama farklı ücret kurallarıyla.</p>
          <h2>Yaşlı bakımı</h2>
          <p>Belediye yaşlı bakımını yürütür — evde yardım (<em>hemtjänst</em> — evde bakım hizmeti), özel konaklama ve acil alarmlar. İlke, mümkün olduğunca uzun süre bağımsız yaşama hakkıdır; uygulama belediyeden belediyeye değişir.</p>
          <h2>Sosyal hizmetler</h2>
          <p>Socialtjänsten (sosyal hizmetler), kendini geçindiremeyen herkesi destekler — maddi yardım (försörjningsstöd — geçim yardımı), çocuk refahı, bağımlılık desteği, aile yardımı. Bir çocuk risk altındayken müdahale etme konusunda yasal yükümlülükleri de vardır.</p>
          ${ebookFactBox('tr', null, 'Zorunlu eğitim: 10 yıl (förskoleklass + 1–9. sınıflar) · Sağlık hattı: 1177 · Bölge sayısı: 21 · Üniversite ücreti: sakinler için ücretsiz.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Школа</h2>
          <p>Обов’язкова школа (<em>grundskolan</em> — базова школа) триває десять років, від 6 років (förskoleklass — підготовчий клас) до 9-го класу. Після цього три роки старшої середньої школи (<em>gymnasium</em>) — академічний або професійний напрям, обидва безкоштовні. Університет також безкоштовний для громадян, мешканців ЄС/ЄЕЗ і людей зі шведським дозволом на проживання.</p>
          <p>Закон про освіту гарантує рівний доступ незалежно від походження, статі чи місця проживання. Приватні та "вільні" школи (<em>friskolor</em>) існують, але не можуть стягувати плату за навчання.</p>
          <h2>Охорона здоров’я</h2>
          <p>Охорона здоров’я переважно фінансується за рахунок податків і працює на регіональному рівні (21 регіон). За кожен візит до лікаря ви платите невеликий внесок (зазвичай 100–400 SEK), а рецептурні ліки та лікарняні збори мають річну стелю (<em>högkostnadsskydd</em> — захист від високих витрат). Медична допомога дітям безкоштовна.</p>
          <p>1177 — це національна медична гаряча лінія та вебсайт. Звичайна допомога йде через ваш <em>vårdcentral</em> (медичний центр); невідкладні випадки — через <em>akutmottagning</em> (приймальне відділення невідкладної допомоги); психіатрична та стоматологічна допомога існують, але з іншими правилами оплати.</p>
          <h2>Догляд за літніми</h2>
          <p>Муніципалітет веде догляд за літніми — домашня допомога (<em>hemtjänst</em> — послуга домашнього догляду), спеціальне житло та аварійні сигналізації. Принцип — право жити самостійно якомога довше; на практиці це різниться від муніципалітету до муніципалітету.</p>
          <h2>Соціальні служби</h2>
          <p>Socialtjänsten (соціальна служба) підтримує кожного, хто не може забезпечити себе — фінансова допомога (försörjningsstöd — допомога на проживання), захист дитини, підтримка при залежності, допомога сім’ї. Вони також мають юридичні обов’язки втручатися там, де дитина в небезпеці.</p>
          ${ebookFactBox('uk', null, 'Обов’язкова школа: 10 років (förskoleklass + класи 1–9) · Медична лінія: 1177 · Кількість регіонів: 21 · Плата за університет: безкоштовно для мешканців.', ['uhrStudyMaterial'])}
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
      title: {
        en: 'Nature, climate,',
        sv: 'Natur, klimat',
        'zh-Hans': '自然、气候，',
        'zh-Hant': '自然、氣候，',
        ar: 'الطبيعة والمناخ',
        ckb: 'سروشت، کەشوهەوا،',
        fa: 'طبیعت، آب‌وهوا',
        pl: 'Przyroda, klimat',
        so: 'Dabeecadda, cimilada,',
        ti: 'ተፈጥሮ፣ ክሊማ',
        tr: 'Doğa, iklim',
        uk: 'Природа, клімат',
      },
      title_em: {
        en: 'and allemansrätten.',
        sv: 'och allemansrätten.',
        'zh-Hans': '与 allemansrätten。',
        'zh-Hant': '與 allemansrätten。',
        ar: 'و allemansrätten.',
        ckb: 'و allemansrätten.',
        fa: 'و allemansrätten.',
        pl: 'i allemansrätten.',
        so: 'iyo allemansrätten.',
        ti: 'ከምኡ’ውን allemansrätten።',
        tr: 've allemansrätten.',
        uk: 'та allemansrätten.',
      },
      lede: {
        en: "Sweden is mostly forest, and the forest is mostly open to you. The rule is simple: don't disturb, don't destroy.",
        sv: 'Sverige är mest skog, och skogen är mest öppen för dig. Regeln är enkel: stör inte, förstör inte.',
        'zh-Hans': '瑞典大部分是森林，而森林大体上向你敞开。规则很简单：不打扰，不破坏。',
        'zh-Hant': '瑞典大部分是森林，而森林大體上向你敞開。規則很簡單：不打擾，不破壞。',
        ar: 'السويد في معظمها غابات، والغابة في معظمها مفتوحة لك. والقاعدة بسيطة: لا تُزعج، لا تُتلف.',
        ckb: 'سوید زۆربەی دارستانە، و دارستانەکەش زۆربەی بۆ تۆ کراوەیە. یاساکە سادەیە: مەستێنە، تێکمەدە.',
        fa: 'سوئد بیشتر جنگل است، و جنگل بیشتر به روی شما باز است. قاعده ساده است: مزاحم نشو، نابود نکن.',
        pl: 'Szwecja to głównie las, a las jest w większości otwarty dla ciebie. Zasada jest prosta: nie przeszkadzaj, nie niszcz.',
        so: 'Iswiidhan inteeda badan waa kayn, kayntuna inteeda badan way kuu furan tahay. Xeerku waa fudud yahay: ha carqaladayn, ha burburin.',
        ti: 'ሽወደን መብዛሕትኣ ጫካ እያ፣ እታ ጫካ ድማ መብዛሕትኣ ንዓኻ ክፍት እያ። እቲ ሕጊ ቀሊል እዩ፦ ኣይተረብሽ፣ ኣይተበላሹ።',
        tr: 'İsveç çoğunlukla ormandır ve orman çoğunlukla size açıktır. Kural basittir: rahatsız etme, tahrip etme.',
        uk: 'Швеція — це здебільшого ліс, і ліс здебільшого відкритий для вас. Правило просте: не турбуй, не нищ.',
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
        'zh-Hans': `<h2>公共通行权（allemansrätten）</h2>
          <p>瑞典几乎所有土地——森林、田野、海岸——都向人们开放，可以行走、采摘浆果、游泳、采集野食、露营（一晚）以及安静地享受自然。这是一种习俗，而非成文法律，但人们认真对待它。</p>
          <p>需要注意的是：<em>"Inte störa, inte förstöra"</em>——不打扰，不破坏。你不可以进入私人花园，或在他人视野范围内搭帐篷。在防火禁令期间不可以生火。不可以取走倒木去出售，也不可以采摘受保护的物种。</p>
          <h2>地理</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>瑞典是欧洲第五大国家。它的地理融合了森林、湖泊、山脉、农业用地以及漫长的海岸线。最长的河流是 Klarälven–Göta älv（约 720 公里）。最大的湖泊是 Vänern。</p>
          <h2>气候与季节</h2>
          <p>四季分明，在北部尤为显著。冬天黑暗漫长；夏天在北极圈以北有午夜太阳。气候变化正使冬天变暖、夏天变得更湿润；政府已承诺在 2045 年前实现净零排放。</p>
          <h2>回收与日常环境</h2>
          <p>瑞典对回收近乎执着。玻璃、金属、纸张、塑料、厨余、电池和电子产品都要投入专门的回收箱，通常在当地的 <em>återvinningscentral</em>（回收中心）。瓶罐回收（<em>pant</em>，押金返还）会返还一小笔现金。</p>
          ${ebookFactBox('zh-Hans', null, 'Allemansrätten——公共通行权 · 净零目标年份：2045 · 最大湖泊：Vänern · 地貌主题：森林、湖泊、山脉与漫长的海岸线。', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        'zh-Hant': `<h2>公共通行權（allemansrätten）</h2>
          <p>瑞典幾乎所有土地——森林、田野、海岸——都向人們開放，可以行走、採摘漿果、游泳、採集野食、露營（一晚）以及安靜地享受自然。這是一種習俗，而非成文法律，但人們認真對待它。</p>
          <p>需要注意的是：<em>"Inte störa, inte förstöra"</em>——不打擾，不破壞。你不可以進入私人花園，或在他人視野範圍內搭帳篷。在防火禁令期間不可以生火。不可以取走倒木去出售，也不可以採摘受保護的物種。</p>
          <h2>地理</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>瑞典是歐洲第五大國家。它的地理融合了森林、湖泊、山脈、農業用地以及漫長的海岸線。最長的河流是 Klarälven–Göta älv（約 720 公里）。最大的湖泊是 Vänern。</p>
          <h2>氣候與季節</h2>
          <p>四季分明，在北部尤為顯著。冬天黑暗漫長；夏天在北極圈以北有午夜太陽。氣候變遷正使冬天變暖、夏天變得更濕潤；政府已承諾在 2045 年前實現淨零排放。</p>
          <h2>回收與日常環境</h2>
          <p>瑞典對回收近乎執著。玻璃、金屬、紙張、塑膠、廚餘、電池和電子產品都要投入專門的回收箱，通常在當地的 <em>återvinningscentral</em>（回收中心）。瓶罐回收（<em>pant</em>，押金返還）會返還一小筆現金。</p>
          ${ebookFactBox('zh-Hant', null, 'Allemansrätten——公共通行權 · 淨零目標年份：2045 · 最大湖泊：Vänern · 地貌主題：森林、湖泊、山脈與漫長的海岸線。', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ar: `<h2>حق الوصول العام (allemansrätten)</h2>
          <p>أي أرض تقريبًا في السويد — غابة أو حقل أو شاطئ — مفتوحة للمشي وقطف التوت والسباحة وجمع ثمار البرية والتخييم (ليلة واحدة) والاستمتاع الهادئ. إنه عُرف، لا قانون مكتوب، لكنه يُؤخذ على محمل الجد.</p>
          <p>الشرط: <em>"Inte störa, inte förstöra"</em> — لا تُزعج، لا تُتلف. لا يجوز لك دخول الحدائق الخاصة أو نصب خيمة في مرأى أحدهم. ولا يجوز إشعال النار عند وجود حظر على إشعال النيران. ولا يجوز أخذ الحطب المتساقط للبيع، ولا قطف الأنواع المحمية.</p>
          <h2>الجغرافيا</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>السويد خامس أكبر دولة في أوروبا. تمزج جغرافيتها بين الغابات والبحيرات والجبال والأراضي الزراعية وساحل طويل. أطول نهر هو Klarälven–Göta älv (نحو 720 كم). وأكبر بحيرة هي Vänern.</p>
          <h2>المناخ والفصول</h2>
          <p>أربعة فصول كاملة، شديدة الوضوح في الشمال. الشتاء مظلم؛ وفي الصيف تظهر شمس منتصف الليل شمال الدائرة القطبية الشمالية. يجعل تغيّر المناخ الشتاء أدفأ والصيف أكثر رطوبة؛ وقد التزمت الحكومة بصافي انبعاثات صفري بحلول عام 2045.</p>
          <h2>إعادة التدوير والبيئة اليومية</h2>
          <p>تُعيد السويد التدوير بهوس. فالزجاج والمعدن والورق والبلاستيك ونفايات الطعام والبطاريات والإلكترونيات كلها تذهب إلى حاويات مخصّصة، غالبًا في <em>återvinningscentral</em> (مركز إعادة التدوير) المحلي. وإعادة الزجاجات والعلب (<em>pant</em>) تعود في صورة استرداد نقدي صغير.</p>
          ${ebookFactBox('ar', null, 'Allemansrätten — حق الوصول العام · سنة هدف صافي الانبعاثات الصفري: 2045 · أكبر بحيرة: Vänern · معالم المشهد الطبيعي: الغابات والبحيرات والجبال وساحل طويل.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ckb: `<h2>مافی دەستگەیشتنی گشتی (allemansrätten)</h2>
          <p>بەنزیکەیی هەموو زەوییەک لە سوید — دارستان، کێڵگە، کەنار — کراوەیە بۆ پیادەڕۆیی، چنینی توو، مەلەکردن، کۆکردنەوەی خۆراکی کێوی، خێوەتگرتن (یەک شەو) و چێژوەرگرتنی هێمن. ئەمە نەریتێکە، نەک یاسایەکی نووسراو، بەڵام بەجدی وەردەگیرێت.</p>
          <p>مەرجەکە: <em>"Inte störa, inte förstöra"</em> — مەستێنە، تێکمەدە. ناتوانیت بچیتە ناو باخچەی تایبەت یان لە بەرچاوی کەسێکدا خێوەت هەڵبدەیت. ناتوانیت ئاگر بکەیتەوە کاتێک قەدەغەی ئاگرکردنەوە هەیە. ناتوانیت داری کەوتوو بۆ فرۆشتن ببەیت، یان جۆرە پارێزراوەکان بچنیت.</p>
          <h2>جوگرافیا</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>سوید پێنجەمین وڵاتی گەورەی ئەورووپایە. جوگرافیاکەی دارستان، دەریاچە، چیا، زەوی کشتوکاڵی و کەنارێکی درێژ تێکەڵ دەکات. درێژترین ڕووبار Klarälven–Göta älv-ە (نزیکەی 720 کم). گەورەترین دەریاچە Vänern-ە.</p>
          <h2>کەشوهەوا و وەرزەکان</h2>
          <p>چوار وەرزی تەواو، لە باکوور دیارتر. زستان تاریکە؛ هاوین خۆری نیوەشەو لە سەرووی بازنەی ئارکتیک هەیە. گۆڕانی کەشوهەوا زستان گەرمتر و هاوین تەڕتر دەکات؛ حکوومەت پابەند بووە بە سفر-بەربڵاوبوونەوەی پاک تا ساڵی 2045.</p>
          <h2>پیتانەوە و ژینگەی ڕۆژانە</h2>
          <p>سوید بە شێوەیەکی ئابووری پیتاندنەوە دەکات. شووشە، فلز، کاغەز، پلاستیک، خۆراکی بەفیڕۆچوو، باتری و ئەلیکترۆنیک هەموویان دەچنە ناو سندووقی تایبەت، زۆرتر لە <em>återvinningscentral</em> (ناوەندی پیتاندنەوەی) ناوخۆیی. گەڕاندنەوەی بوتڵ و قووتوو (<em>pant</em>) وەک گەڕانەوەی کەمێک پارەی نەختینە دێتەوە.</p>
          ${ebookFactBox('ckb', null, 'Allemansrätten — مافی دەستگەیشتنی گشتی · ساڵی ئامانجی سفر-بەربڵاوبوونەوەی پاک: 2045 · گەورەترین دەریاچە: Vänern · بابەتە سروشتییەکان: دارستان، دەریاچە، چیا و کەنارێکی درێژ.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        fa: `<h2>حق دسترسی همگانی (allemansrätten)</h2>
          <p>تقریباً هر زمینی در سوئد — جنگل، دشت، ساحل — برای پیاده‌روی، چیدن توت، شنا، گردآوری خوراکی‌های وحشی، چادر زدن (یک شب) و لذت آرام باز است. این یک رسم است، نه قانونی نوشته، اما جدی گرفته می‌شود.</p>
          <p>اما نکته اینجاست: <em>"Inte störa, inte förstöra"</em> — مزاحم نشو، نابود نکن. نمی‌توانید وارد باغ‌های خصوصی شوید یا در منظر کسی چادر بزنید. هنگام ممنوعیت آتش‌افروزی نمی‌توانید آتش روشن کنید. نمی‌توانید چوب افتاده را برای فروش بردارید، یا گونه‌های حفاظت‌شده را بچینید.</p>
          <h2>جغرافیا</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>سوئد پنجمین کشور بزرگ اروپاست. جغرافیای آن آمیزه‌ای از جنگل، دریاچه، کوه، زمین کشاورزی و خط ساحلی بلند است. بلندترین رود Klarälven–Göta älv است (حدود 720 کیلومتر). بزرگ‌ترین دریاچه Vänern است.</p>
          <h2>آب‌وهوا و فصل‌ها</h2>
          <p>چهار فصل کامل، که در شمال چشمگیرند. زمستان تاریک است؛ تابستان بالای مدار قطب شمال آفتاب نیمه‌شب دارد. تغییر اقلیم زمستان‌ها را گرم‌تر و تابستان‌ها را مرطوب‌تر می‌کند؛ دولت متعهد شده تا سال 2045 به انتشار خالص صفر برسد.</p>
          <h2>بازیافت و محیط روزمره</h2>
          <p>سوئد به‌طور وسواس‌گونه بازیافت می‌کند. شیشه، فلز، کاغذ، پلاستیک، پسماند غذا، باتری و لوازم الکترونیکی همگی به سطل‌های ویژه می‌روند، اغلب در <em>återvinningscentral</em> (مرکز بازیافت) محلی. بازگرداندن بطری و قوطی (<em>pant</em>) به‌صورت بازپرداخت نقدی اندکی برمی‌گردد.</p>
          ${ebookFactBox('fa', null, 'Allemansrätten — حق دسترسی همگانی · سال هدف انتشار خالص صفر: 2045 · بزرگ‌ترین دریاچه: Vänern · درون‌مایه‌های چشم‌انداز: جنگل، دریاچه، کوه و خط ساحلی بلند.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        pl: `<h2>Prawo powszechnego dostępu (allemansrätten)</h2>
          <p>Niemal każdy teren w Szwecji — las, pole, brzeg — jest otwarty na wędrówki, zbieranie jagód, kąpiel, zbieractwo, biwakowanie (jedna noc) i ciche obcowanie z naturą. To zwyczaj, nie spisane prawo, ale traktuje się go poważnie.</p>
          <p>Haczyk: <em>"Inte störa, inte förstöra"</em> — nie przeszkadzaj, nie niszcz. Nie wolno wchodzić do prywatnych ogrodów ani rozbijać namiotu na czyimś widoku. Nie wolno rozpalać ognia, gdy obowiązuje zakaz. Nie wolno zabierać powalonego drewna na sprzedaż ani zrywać gatunków chronionych.</p>
          <h2>Geografia</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Szwecja jest piątym co do wielkości krajem Europy. Jej geografia łączy lasy, jeziora, góry, ziemie rolne i długą linię brzegową. Najdłuższa rzeka to Klarälven–Göta älv (około 720 km). Największe jezioro to Vänern.</p>
          <h2>Klimat i pory roku</h2>
          <p>Cztery pełne pory roku, wyraziste na północy. Zima jest ciemna; latem za kołem podbiegunowym świeci słońce o północy. Zmiana klimatu sprawia, że zimy są cieplejsze, a lata bardziej mokre; rząd zobowiązał się do osiągnięcia zerowej emisji netto do 2045 roku.</p>
          <h2>Recykling i codzienne środowisko</h2>
          <p>Szwecja segreguje obsesyjnie. Szkło, metal, papier, plastik, odpady spożywcze, baterie i elektronika trafiają do osobnych pojemników, często w lokalnym <em>återvinningscentral</em> (punkt recyklingu). Zwrot butelek i puszek (<em>pant</em>) wraca jako drobny zwrot gotówki.</p>
          ${ebookFactBox('pl', null, 'Allemansrätten — prawo powszechnego dostępu · Rok docelowy zerowej emisji netto: 2045 · Największe jezioro: Vänern · Motywy krajobrazu: lasy, jeziora, góry i długa linia brzegowa.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        so: `<h2>Xaqa gelitaanka dadweynaha (allemansrätten)</h2>
          <p>Ku dhowaad dhul kasta oo Iswiidhan ku yaal — kayn, beer, xeeb — wuxuu u furan yahay socod, ururinta berriyaha, dabaasha, ugaarsiga cuntada duurjoogta ah, teendhada (hal habeen), iyo raaxo deggan. Waa caado, ma aha sharci qoran, laakiin si dhab ah ayaa loo qaataa.</p>
          <p>Qabashada: <em>"Inte störa, inte förstöra"</em> — ha carqaladayn, ha burburin. Ma gali kartid beero gaar ah ama ma dhisi kartid teendho meel uu qof arki karo. Ma shidi kartid dab marka mamnuucid dab jirto. Ma qaadan kartid alwaax dhacay si aad u iibiso, ama ma soo gurin kartid noocyada la ilaaliyo.</p>
          <h2>Juqraafi</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Iswiidhan waa wadanka shanaad ee ugu weyn Yurub. Juqraafigeedu wuxuu isku daraa kayn, harooyin, buuro, dhul beereed, iyo xeeb dheer. Webiga ugu dheer waa Klarälven–Göta älv (qiyaastii 720 km). Harada ugu weyn waa Vänern.</p>
          <h2>Cimilada iyo xilliyada</h2>
          <p>Afar xilli oo dhammaystiran, oo aad uga muuqda waqooyiga. Jiilaalku waa mugdi; xagaaga waxaa jira qorrax habeenkii oo ka sarreysa Wareegga Arktikada. Isbeddelka cimiladu wuxuu ka dhigayaa jiilaalka mid kulul iyo xagaaga mid qoyan; dawladdu waxay ballan-qaaday inay gaarto wax-saarista eber saafiga ah sannadka 2045.</p>
          <h2>Dib-u-warshadaynta iyo deegaanka maalinlaha ah</h2>
          <p>Iswiidhan si aad ah ayey wax u dib-u-warshadaysaa. Galaaska, biraha, warqadda, balaastiga, qashinka cuntada, baytariyada, iyo qalabka elektaroonigga ah dhammaantood waxay galaan qasnado gaar ah, badanaa <em>återvinningscentral</em> (xarunta dib-u-warshadaynta) maxalliga ah. Soo-celinta dhalooyinka iyo qasacadaha (<em>pant</em>) waxay ku soo noqotaa lacag yar oo dib loo celiyo.</p>
          ${ebookFactBox('so', null, 'Allemansrätten — xaqa gelitaanka dadweynaha · Sannadka bartilmaameedka eber saafiga ah: 2045 · Harada ugu weyn: Vänern · Mawduucyada muuqaalka dhulka: kayn, harooyin, buuro, iyo xeeb dheer.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        ti: `<h2>መሰል ህዝባዊ ኣቕርቦት (allemansrätten)</h2>
          <p>ኣብ ሽወደን ዳርጋ ኩሉ መሬት — ጫካ፣ ሕርሻ፣ ገምገም ባሕሪ — ንኽትዛወር፣ ቤሪ ንኽትቅንጥብ፣ ንኽትሕምብስ፣ ናይ በረኻ መግቢ ንኽትእክብ፣ ከተምፕ (ሓደ ለይቲ) ንኽትገብርን ብህዱእ ንኽትሕጎስን ክፉት እዩ። ንሱ ልምዲ እዩ፣ ጽሑፍ ሕጊ ኣይኮነን፣ ግን ብቑምነት ይውሰድ።</p>
          <p>እቲ ጥንቃቐ፦ <em>"Inte störa, inte förstöra"</em> — ኣይተረብሽ፣ ኣይተበላሹ። ናብ ብሕታዊ ጀርዲን ክትኣቱ ወይ ኣብ ቅድሚ ዓይኒ ሰብ ድንኳን ክትተኽል ኣይትኽእልን። ክልከላ ሓዊ ኣብ ዘለዎ እዋን ሓዊ ክተንድድ ኣይትኽእልን። ዝወደቐ ዕንጨይቲ ንመሸጣ ክትወስድ፣ ወይ ዝተሓለዉ ዓይነታት ክትቅንጥብ ኣይትኽእልን።</p>
          <h2>ጆግራፊ</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>ሽወደን ኣብ ኤውሮጳ ሓምሻይ ዓባይ ሃገር እያ። ጆግራፊኣ ጫካ፣ ቀላያት፣ ኣኽራን፣ ሕርሻዊ መሬትን ነዊሕ ገምገም ባሕርን ይሓውስ። እቲ ዝነውሐ ርባ Klarälven–Göta älv እዩ (ኣስታት 720 ኪሎ ሜተር)። እቲ ዝዓበየ ቀላይ Vänern እዩ።</p>
          <h2>ክሊማን ወቕትታትን</h2>
          <p>ኣርባዕተ ምሉእ ወቕትታት፣ ኣብ ሰሜን ብጣዕሚ ዝረኣዩ። ክረምቲ ጸልማት እዩ፤ ሓጋይ ኣብ ልዕሊ ኣርክቲክ ዞባ ናይ ፍርቂ ለይቲ ጸሓይ ኣለዎ። ምቕያር ክሊማ ንክረምቲ ዝሞቐ ንሓጋይ ድማ ዝረሰነ ይገብሮ ኣሎ፤ መንግስቲ ክሳብ 2045 ናብ ጽሩይ-ባዶ ልቐት ንምብጻሕ ቃል ኣትዩ ኣሎ።</p>
          <h2>ምድጋም ምጥቃምን ናይ ዕለታዊ ኣከባቢን</h2>
          <p>ሽወደን ብኣዝዩ ዝለዓለ ኣገባብ ትደግም ትጥቀም። ቢቆሎ፣ ብረት፣ ወረቐት፣ ፕላስቲክ፣ ናይ መግቢ ጓሓፍ፣ ባትሪታትን ኤለክትሮኒክስን ኩሎም ናብ ፍሉያት ቆፎታት ይኸዱ፣ መብዛሕትኡ እዋን ኣብ ናይ ከባቢ <em>återvinningscentral</em> (ናይ ምድጋም ምጥቃም ማእከል)። ምምላስ ጥርሙዝን ታኒካን (<em>pant</em>) ከም ንእሽቶ ናይ ጥረ ገንዘብ ምምላስ ይምለስ።</p>
          ${ebookFactBox('ti', null, 'Allemansrätten — መሰል ህዝባዊ ኣቕርቦት · ዓመት ሸቶ ጽሩይ-ባዶ ልቐት፦ 2045 · ዝዓበየ ቀላይ፦ Vänern · ናይ መልክዕ ምድሪ ኣርእስትታት፦ ጫካ፣ ቀላያት፣ ኣኽራንን ነዊሕ ገምገም ባሕርን።', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        tr: `<h2>Kamusal erişim hakkı (allemansrätten)</h2>
          <p>İsveç'teki hemen hemen her arazi — orman, tarla, kıyı — yürümeye, çilek toplamaya, yüzmeye, doğadan yiyecek toplamaya, kamp yapmaya (bir gece) ve sakin bir keyfe açıktır. Bu yazılı bir yasa değil bir gelenektir, ama ciddiye alınır.</p>
          <p>İşin püf noktası: <em>"Inte störa, inte förstöra"</em> — rahatsız etme, tahrip etme. Özel bahçelere giremez ya da birinin manzarasına çadır kuramazsınız. Ateş yakma yasağı varken ateş yakamazsınız. Devrilmiş odunu satmak için alamaz, korunan türleri toplayamazsınız.</p>
          <h2>Coğrafya</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>İsveç, Avrupa'nın beşinci büyük ülkesidir. Coğrafyası orman, göl, dağ, tarım arazisi ve uzun bir kıyı şeridini bir araya getirir. En uzun nehir Klarälven–Göta älv'dir (yaklaşık 720 km). En büyük göl Vänern'dir.</p>
          <h2>İklim ve mevsimler</h2>
          <p>Dört eksiksiz mevsim, kuzeyde çarpıcı biçimde. Kış karanlıktır; yaz, Kuzey Kutup Dairesi'nin üstünde gece yarısı güneşine sahiptir. İklim değişikliği kışları daha ılık, yazları daha yağışlı yapıyor; hükûmet 2045 yılına kadar net sıfır emisyon hedefine bağlı kaldı.</p>
          <h2>Geri dönüşüm ve gündelik çevre</h2>
          <p>İsveç takıntılı biçimde geri dönüşüm yapar. Cam, metal, kâğıt, plastik, gıda atığı, piller ve elektronik ürünlerin hepsi, çoğu zaman yereldeki <em>återvinningscentral</em>'da (geri dönüşüm merkezi) ayrı kutulara gider. Şişe ve kutu iadeleri (<em>pant</em>) küçük bir nakit geri ödeme olarak geri döner.</p>
          ${ebookFactBox('tr', null, 'Allemansrätten — kamusal erişim hakkı · Net sıfır hedef yılı: 2045 · En büyük göl: Vänern · Manzara temaları: ormanlar, göller, dağlar ve uzun bir kıyı şeridi.', ['uhrStudyMaterial', 'scbLandUse'])}
        `,
        uk: `<h2>Право загального доступу (allemansrätten)</h2>
          <p>Майже будь-яка земля у Швеції — ліс, поле, берег — відкрита для прогулянок, збирання ягід, купання, збиральництва, ночівлі в наметі (одну ніч) і тихого відпочинку. Це звичай, а не писаний закон, але до нього ставляться серйозно.</p>
          <p>Заковика: <em>"Inte störa, inte förstöra"</em> — не турбуй, не нищ. Не можна заходити у приватні сади чи ставити намет у когось перед очима. Не можна розводити вогонь, коли діє заборона на вогонь. Не можна забирати повалену деревину на продаж чи зривати охоронювані види.</p>
          <h2>Географія</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'scbLandUse'])}>Швеція — п'ята за величиною країна Європи. Її географія поєднує ліси, озера, гори, сільськогосподарські землі та довгу берегову лінію. Найдовша річка — Klarälven–Göta älv (близько 720 км). Найбільше озеро — Vänern.</p>
          <h2>Клімат і пори року</h2>
          <p>Чотири повноцінні пори року, особливо виразні на півночі. Зима темна; влітку за полярним колом світить опівнічне сонце. Зміна клімату робить зими теплішими, а літо вологішим; уряд зобов'язався досягти нульових чистих викидів до 2045 року.</p>
          <h2>Переробка та повсякденне довкілля</h2>
          <p>Швеція переробляє одержимо. Скло, метал, папір, пластик, харчові відходи, батарейки та електроніка — усе йде в окремі контейнери, часто в місцевому <em>återvinningscentral</em> (центрі переробки). Повернення пляшок і банок (<em>pant</em>) повертається у вигляді невеликого грошового відшкодування.</p>
          ${ebookFactBox('uk', null, 'Allemansrätten — право загального доступу · Цільовий рік нульових чистих викидів: 2045 · Найбільше озеро: Vänern · Теми ландшафту: ліси, озера, гори та довга берегова лінія.', ['uhrStudyMaterial', 'scbLandUse'])}
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
      title: {
        en: 'Culture, traditions,',
        sv: 'Kultur, traditioner',
        'zh-Hans': '文化、传统，',
        'zh-Hant': '文化、傳統，',
        ar: 'الثقافة والتقاليد',
        ckb: 'کەلتوور، نەریت،',
        fa: 'فرهنگ، سنت‌ها،',
        pl: 'Kultura, tradycje',
        so: 'Dhaqanka, caadooyinka',
        ti: 'ባህሊ፣ ልምድታት',
        tr: 'Kültür, gelenekler',
        uk: 'Культура, традиції',
      },
      title_em: {
        en: 'and the Swedish calendar.',
        sv: 'och svenska kalendern.',
        'zh-Hans': '以及瑞典的日历。',
        'zh-Hant': '以及瑞典的日曆。',
        ar: 'والتقويم السويدي.',
        ckb: 'و ساڵنامەی سویدی.',
        fa: 'و تقویم سوئدی.',
        pl: 'i szwedzki kalendarz.',
        so: 'iyo kalandarka Iswiidhan.',
        ti: 'ከምኡ’ውን ሽወደናዊ ዓውደ-ኣዋርሕ።',
        tr: 've İsveç takvimi.',
        uk: 'і шведський календар.',
      },
      lede: {
        en: "If you don't know when midsummer is, you'll get a polite explanation. If you don't know what fika is, you'll get one whether you want it or not.",
        sv: 'Vet du inte när midsommar är får du en artig förklaring. Vet du inte vad fika är får du en — vare sig du vill eller inte.',
        'zh-Hans':
          '如果你不知道仲夏节是什么时候，你会得到一番礼貌的解释。如果你不知道 fika（瑞典式咖啡歇）是什么，那你不管想不想都会被请去喝上一回。',
        'zh-Hant':
          '如果你不知道仲夏節是什麼時候，你會得到一番禮貌的解釋。如果你不知道 fika（瑞典式咖啡歇）是什麼，那你不管想不想都會被請去喝上一回。',
        ar: 'إن لم تكن تعرف موعد منتصف الصيف، فستحصل على شرح مهذّب. وإن لم تكن تعرف ما هي fika، فستحصل على واحدة شئت أم أبيت.',
        ckb: 'ئەگەر نەزانیت کەی ناوەڕاستی هاوینە، ڕوونکردنەوەیەکی بەڕێزانەت پێ دەدرێت. ئەگەر نەزانیت fika چییە، یەکێکت پێ دەدرێت، چ بتەوێت چ نەتەوێت.',
        fa: 'اگر ندانید نیمهٔ تابستان کِی است، توضیحی مؤدبانه دریافت خواهید کرد. اگر ندانید fika چیست، خواه بخواهید خواه نخواهید یکی نصیبتان می‌شود.',
        pl: 'Jeśli nie wiesz, kiedy jest midsommar, dostaniesz uprzejme wyjaśnienie. Jeśli nie wiesz, czym jest fika, dostaniesz ją — czy chcesz, czy nie.',
        so: 'Haddii aadan garanaynin goorta midsummer-ka, waxaad heli doontaa sharraxaad edeb leh. Haddii aadan garanaynin waxa fika ay tahay, mid baad heli doontaa hadii aad rabto iyo haddii kale.',
        ti: 'መዓስ ምዃኑ ማእከል ሓጋይ እንተ ዘይፈሊጥካ፣ ኣኽብሮታዊ መብርሂ ክወሃበካ እዩ። fika እንታይ ምዃኑ እንተ ዘይፈሊጥካ፣ ትደልዮ ይኹን ኣይትደልዮ ሓደ ክወሃበካ እዩ።',
        tr: "Yaz ortasının ne zaman olduğunu bilmiyorsanız, kibar bir açıklama alırsınız. Fika'nın ne olduğunu bilmiyorsanız, isteseniz de istemeseniz de bir tane alırsınız.",
        uk: 'Якщо ви не знаєте, коли середина літа, вам ввічливо пояснять. Якщо ви не знаєте, що таке fika, ви її отримаєте — хочете ви того чи ні.',
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
        'zh-Hans': `<h2>四大节日</h2>
          <ul>
            <li><b>Midsommar（仲夏节）</b> — 六月的第三个星期五。五月柱、鲱鱼、烈酒，还有学青蛙跳的舞。这是瑞典人盼了一整年的真正假日。</li>
            <li><b>Påsk（复活节）</b> — 彩蛋和羽毛装饰，孩子们打扮成复活节女巫（<em>påskkärringar</em>），用画作换糖果。</li>
            <li><b>Lucia（12 月 13 日）</b> — 身穿白袍的孩子、蜡烛，还有那首《Sankta Lucia》。在黑暗中点起的光。</li>
            <li><b>Jul（圣诞夜）</b> — 大餐在 24 日，而不是 25 日。每年下午 3 点电视上都会播唐老鸭动画。别问为什么。</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika 不是一次咖啡休息——它是一种社会制度。咖啡或茶，通常配上一个甜面包（kanelbulle 肉桂卷、kardemummabulle 豆蔻卷）。在职场常常一天两次。拒绝 fika 在社交上是可能的，但在情感上并不明智。</p>
          <h2>国庆日</h2>
          <p>6 月 6 日——Sveriges nationaldag（瑞典国庆日）——纪念 Gustav Vasa 在 1523 年的当选，以及 1809 年的宪法修订。它直到 2005 年才成为公共假日，至今仍在适应这个角色。</p>
          <h2>新的传统</h2>
          <p>长期以来，瑞典通过移民吸纳了新的传统：Eid al-Fitr（穆斯林开斋节）、Nouruz（波斯新年）、Newroz（库尔德新年，同样在 3 月 21 日）、Diwali（排灯节）等等。它们正越来越多地成为公共生活的一部分——在学校、职场和城市广场上庆祝。</p>
          ${ebookFactBox('zh-Hans', null, '国庆日：6 月 6 日 · Midsommar：六月的第三个星期五 · Lucia：12 月 13 日 · 主要庆祝的是圣诞夜（而非圣诞日）。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>四大節日</h2>
          <ul>
            <li><b>Midsommar（仲夏節）</b> — 六月的第三個星期五。五月柱、鯡魚、烈酒，還有學青蛙跳的舞。這是瑞典人盼了一整年的真正假日。</li>
            <li><b>Påsk（復活節）</b> — 彩蛋和羽毛裝飾，孩子們打扮成復活節女巫（<em>påskkärringar</em>），用畫作換糖果。</li>
            <li><b>Lucia（12 月 13 日）</b> — 身穿白袍的孩子、蠟燭，還有那首《Sankta Lucia》。在黑暗中點起的光。</li>
            <li><b>Jul（聖誕夜）</b> — 大餐在 24 日，而不是 25 日。每年下午 3 點電視上都會播唐老鴨動畫。別問為什麼。</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika 不是一次咖啡休息——它是一種社會制度。咖啡或茶，通常配上一個甜麵包（kanelbulle 肉桂捲、kardemummabulle 豆蔻捲）。在職場常常一天兩次。拒絕 fika 在社交上是可能的，但在情感上並不明智。</p>
          <h2>國慶日</h2>
          <p>6 月 6 日——Sveriges nationaldag（瑞典國慶日）——紀念 Gustav Vasa 在 1523 年的當選，以及 1809 年的憲法修訂。它直到 2005 年才成為公共假日，至今仍在適應這個角色。</p>
          <h2>新的傳統</h2>
          <p>長期以來，瑞典透過移民吸納了新的傳統：Eid al-Fitr（穆斯林開齋節）、Nouruz（波斯新年）、Newroz（庫德新年，同樣在 3 月 21 日）、Diwali（排燈節）等等。它們正越來越多地成為公共生活的一部分——在學校、職場和城市廣場上慶祝。</p>
          ${ebookFactBox('zh-Hant', null, '國慶日：6 月 6 日 · Midsommar：六月的第三個星期五 · Lucia：12 月 13 日 · 主要慶祝的是聖誕夜（而非聖誕日）。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>الأعياد الأربعة الكبرى</h2>
          <ul>
            <li><b>Midsommar</b> (منتصف الصيف) — ثالث جمعة من يونيو. عمود مايو، والرنجة، والشنابس، والرقص على هيئة الضفادع. إنه يوم العطلة الذي تتطلّع إليه السويد طوال العام.</li>
            <li><b>Påsk</b> (عيد الفصح) — البيض والزينة الريشية، وأطفال يرتدون زي ساحرات الفصح (<em>påskkärringar</em>) يقايضون رسوماتهم بالحلوى.</li>
            <li><b>Lucia</b> (13 ديسمبر) — أطفال في أردية بيضاء، وشموع، وأغنية "Sankta Lucia". أضواء في وجه الظلام.</li>
            <li><b>Jul</b> (ليلة عيد الميلاد) — وجبة الطعام في الرابع والعشرين، لا الخامس والعشرين. ورسوم البطّ دونالد على التلفاز في الثالثة عصرًا، كل عام. لا تسأل عن السبب.</li>
          </ul>
          <h2>Fika</h2>
          <p>الـ fika ليست استراحة قهوة — إنها مؤسسة اجتماعية. قهوة أو شاي، غالبًا مع كعكة محلّاة (kanelbulle، kardemummabulle). كثيرًا مرتين في اليوم في العمل. رفض الـ fika ممكن اجتماعيًا لكنه غير حكيم عاطفيًا.</p>
          <h2>اليوم الوطني</h2>
          <p>6 يونيو — Sveriges nationaldag — يحيي ذكرى انتخاب Gustav Vasa عام 1523 والتعديل الدستوري لعام 1809. وهو عطلة رسمية منذ عام 2005 فقط، ولا يزال يستقرّ في دوره.</p>
          <h2>تقاليد جديدة</h2>
          <p>استوعبت السويد منذ زمن طويل تقاليد جديدة عبر الهجرة: Eid al-Fitr (عيد الفطر لدى المسلمين)، وNouruz (رأس السنة الفارسية)، وNewroz (رأس السنة الكردية، وأيضًا في 21 مارس)، وDiwali (مهرجان الأنوار)، وغيرها. وهي تصبح جزءًا متزايدًا من الحياة العامة — يُحتفل بها في المدارس وأماكن العمل وساحات المدن.</p>
          ${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · Midsommar: ثالث جمعة من يونيو · Lucia: 13 ديسمبر · ليلة عيد الميلاد (لا اليوم) هي الاحتفال الرئيسي.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>چوار جەژنە گەورەکە</h2>
          <ul>
            <li><b>Midsommar</b> (ناوەڕاستی هاوین) — سێیەم هەینیی مانگی ژوئن. ستوونی مایۆ، ماسی هێرینگ، شنابس، و سەماکردن وەک بۆق. ئەو ڕۆژە پشووە ڕاستەقینەیەی کە سوید بە درێژایی ساڵ چاوەڕێی دەکات.</li>
            <li><b>Påsk</b> (جەژنی پاک) — هێلکە و ڕازاندنەوەی پەڕ، منداڵان وەک جادووگەری جەژنی پاک (<em>påskkärringar</em>) جلوبەرگ دەکەن و وێنەکانیان بە شیرینی دەگۆڕنەوە.</li>
            <li><b>Lucia</b> (13ی دیسەمبەر) — منداڵان بە کراسی سپییەوە، مۆم، و گۆرانیی "Sankta Lucia". ڕووناکی بەرامبەر تاریکی.</li>
            <li><b>Jul</b> (شەوی کریسمس) — ژەمەکە لە ڕۆژی 24ـە، نەک 25. کارتۆنی دۆناڵد دەک لە تەلەفزیۆن سەعات 3ی پاش نیوەڕۆ، هەموو ساڵێک. مەپرسە بۆچی.</li>
          </ul>
          <h2>Fika</h2>
          <p>fika پشووی قاوە نییە — دامەزراوەیەکی کۆمەڵایەتییە. قاوە یان چا، زۆرتر لەگەڵ نانێکی شیرین (kanelbulle، kardemummabulle). زۆر جار ڕۆژانە دوو جار لە کار. ڕەتکردنەوەی fika لە ڕووی کۆمەڵایەتییەوە دەکرێت بەڵام لە ڕووی هەستەوە دانا نییە.</p>
          <h2>ڕۆژی نیشتمانی</h2>
          <p>6ی ژوئن — Sveriges nationaldag — یادی هەڵبژاردنی Gustav Vasa لە 1523 و چاکسازیی دەستووریی 1809 دەکاتەوە. تەنها لە 2005ەوە پشوویەکی فەرمییە، و هێشتا لە ڕۆڵەکەی دەستنیشان دەبێت.</p>
          <h2>نەریتی نوێ</h2>
          <p>سوید ماوەیەکی درێژە لە ڕێگەی کۆچەوە نەریتی نوێی هەڵمژراوە: Eid al-Fitr (موسوڵمان)، Nouruz (ساڵی نوێی فارسی)، Newroz (ساڵی نوێی کوردی، هەروەها لە 21ی مارس)، Diwali، و چەند شتێکی تر. ئەمانە بەزیاتری دەبنە بەشێک لە ژیانی گشتی — لە قوتابخانە، شوێنی کار و گۆڕەپانی شارەکاندا جەژن دەگیرێن.</p>
          ${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: 6ی ژوئن · Midsommar: سێیەم هەینیی ژوئن · Lucia: 13ی دیسەمبەر · شەوی کریسمس (نەک ڕۆژەکەی) جەژنە سەرەکییەکەیە.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>چهار جشن بزرگ</h2>
          <ul>
            <li><b>Midsommar</b> (نیمهٔ تابستان) — سومین جمعهٔ ژوئن. ستون مایو، شاه‌ماهی، اشنپس، و رقصیدن مانند قورباغه‌ها. روز تعطیلی واقعی که سوئد تمام سال چشم‌انتظار آن است.</li>
            <li><b>Påsk</b> (عید پاک) — تخم‌مرغ و تزیینات پَردار، کودکانی که در نقش جادوگران عید پاک (<em>påskkärringar</em>) ظاهر می‌شوند و نقاشی‌هایشان را با آب‌نبات معاوضه می‌کنند.</li>
            <li><b>Lucia</b> (13 دسامبر) — کودکانی در ردای سفید، شمع‌ها، و ترانهٔ "Sankta Lucia". نور در برابر تاریکی.</li>
            <li><b>Jul</b> (شب کریسمس) — وعدهٔ غذا در روز بیست‌وچهارم است، نه بیست‌وپنجم. کارتون‌های دونالد داک ساعت 3 بعدازظهر در تلویزیون، هر سال. نپرسید چرا.</li>
          </ul>
          <h2>Fika</h2>
          <p>fika یک استراحت قهوه نیست — یک نهاد اجتماعی است. قهوه یا چای، معمولاً همراه با یک نان شیرین (kanelbulle، kardemummabulle). اغلب دو بار در روز سر کار. رد کردن fika از نظر اجتماعی ممکن است اما از نظر عاطفی نابخردانه است.</p>
          <h2>روز ملی</h2>
          <p>6 ژوئن — Sveriges nationaldag — یادبود انتخاب Gustav Vasa در 1523 و بازنگری قانون اساسی در 1809 است. تنها از سال 2005 یک تعطیلی رسمی است و هنوز در حال جا افتادن در این نقش است.</p>
          <h2>سنت‌های تازه</h2>
          <p>سوئد دیرزمانی است که از راه مهاجرت سنت‌های تازه را در خود جای داده است: Eid al-Fitr (مسلمانان)، Nouruz (سال نوی ایرانی)، Newroz (سال نوی کردی، آن هم در 21 مارس)، Diwali، و دیگران. این‌ها روزبه‌روز بخشی از زندگی عمومی می‌شوند — در مدرسه‌ها، محل‌های کار و میدان‌های شهر جشن گرفته می‌شوند.</p>
          ${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · Midsommar: سومین جمعهٔ ژوئن · Lucia: 13 دسامبر · شب کریسمس (نه روز آن) جشن اصلی است.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Wielka czwórka</h2>
          <ul>
            <li><b>Midsommar</b> (środek lata) — trzeci piątek czerwca. Słup majowy, śledź, sznaps, taniec jak żaby. Prawdziwy wolny dzień, na który Szwecja czeka cały rok.</li>
            <li><b>Påsk</b> (Wielkanoc) — jajka i ozdoby z piór, dzieci przebrane za wielkanocne czarownice (<em>påskkärringar</em>) wymieniające rysunki na słodycze.</li>
            <li><b>Lucia</b> (13 grudnia) — dzieci w białych szatach, świece, pieśń „Sankta Lucia”. Światło przeciw ciemności.</li>
            <li><b>Jul</b> (Wigilia) — posiłek jest 24., a nie 25. Kreskówki z Kaczorem Donaldem w telewizji o 15:00, co roku. Nie pytaj.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika to nie przerwa na kawę — to instytucja społeczna. Kawa albo herbata, zwykle ze słodką bułką (kanelbulle, kardemummabulle). W pracy często dwa razy dziennie. Odmówienie fiki jest społecznie możliwe, ale emocjonalnie nierozsądne.</p>
          <h2>Święto narodowe</h2>
          <p>6 czerwca — Sveriges nationaldag — upamiętnia wybór Gustava Vasy w 1523 i rewizję konstytucji z 1809. Dniem wolnym od pracy jest dopiero od 2005 i wciąż wchodzi w tę rolę.</p>
          <h2>Nowe tradycje</h2>
          <p>Szwecja od dawna wchłania nowe tradycje za sprawą migracji: Eid al-Fitr (muzułmańskie), Nouruz (perski Nowy Rok), Newroz (kurdyjski Nowy Rok, również 21 marca), Diwali i inne. Coraz częściej stają się one częścią życia publicznego — obchodzone w szkołach, miejscach pracy i na miejskich placach.</p>
          ${ebookFactBox('pl', null, 'Święto narodowe: 6 czerwca · Midsommar: trzeci piątek czerwca · Lucia: 13 grudnia · Głównym świętem jest Wigilia (a nie Boże Narodzenie).', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Afarta waaweyn</h2>
          <ul>
            <li><b>Midsommar</b> (badhtanka xagaaga) — Jimcaha saddexaad ee Juun. Tiir Maajo, kalluun la dhanaaniyey, cabitaan dhaqameed, iyo qoob-ka-cayaar sida rahyada. Maalinta nasashada dhabta ah ee Iswiidhan sannadka oo dhan filaynayso.</li>
            <li><b>Påsk</b> (Iistarka) — ukun iyo qurxin baal ah, carruur u labbisan sida sixiroolayaasha Iistarka (<em>påskkärringar</em>) oo sawirro ku beddelaya nacnac.</li>
            <li><b>Lucia</b> (13 Diseembar) — carruur khamiis cad gashan, shumacyo, iyo heesta "Sankta Lucia". Iftiin ka hor mugdiga.</li>
            <li><b>Jul</b> (Habeenka Kirismaska) — cuntada waxay tahay 24-ka, ma aha 25-ka. Kartoonnada Donald Duck oo TV-ga lagu daawado 3-ta galab, sannad walba. Ha weydiin.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika ma aha nasasho qaxwo — waa hay'ad bulsho. Qaxwo ama shaah, badanaa la socda rooti macaan (kanelbulle, kardemummabulle). Inta badan laba jeer maalintii shaqada. In la diido fika waa suurtagal arrimaha bulshada laakiin shucuur ahaan ma caqli-gal aha.</p>
          <h2>Maalinta qaranka</h2>
          <p>6 Juun — Sveriges nationaldag — waxay xusaysaa doorashada Gustav Vasa ee 1523 iyo dib-u-eegista dastuuriga ah ee 1809. Waa fasax dadweyne kaliya tan iyo 2005, weligeedna weli way ku jirtaa inay doorkaas dejiso.</p>
          <h2>Caadooyin cusub</h2>
          <p>Iswiidhan muddo dheer ayay soo qaadatay caadooyin cusub iyada oo loo marayo socdaalka: Eid al-Fitr (Muslim), Nouruz (Sannadka Cusub ee Faaris), Newroz (Sannadka Cusub ee Kurdiga, sidoo kale 21 Maarso), Diwali, iyo kuwo kale. Kuwani waxay si isa soo taraysa u noqonayaan qayb ka mid ah nolosha dadweynaha — waxaa lagu xuso dugsiyada, goobaha shaqada, iyo fagaarayaasha magaalada.</p>
          ${ebookFactBox('so', null, 'Maalinta qaranka: 6 Juun · Midsommar: Jimcaha saddexaad ee Juun · Lucia: 13 Diseembar · Habeenka Kirismaska (ma aha Maalinta) ayaa ah dabbaaldegga ugu weyn.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>እተን ኣርባዕተ ዓበይቲ</h2>
          <ul>
            <li><b>Midsommar</b> (ማእከል ሓጋይ) — ሳልሰይቲ ዓርቢ ሰነ። ናይ ሜይ ዓንዲ፣ ሄሪንግ ዓሳ፣ ሽናፕስ፣ ከም እንቁቕሖ ምስዕሳዕ። እታ ሽወደን ምሉእ ዓመት እትጽበያ ናይ ሓቂ ናይ ዕረፍቲ መዓልቲ።</li>
            <li><b>Påsk</b> (ፋሲካ) — እንቋቑሖን ብክንቲት ዝተሰለመ ምልክዕን፣ ቆልዑ ከም ጠንቋሊ ፋሲካ (<em>påskkärringar</em>) ተኸዲኖም ስእልታቶም ብከረሜላ ይልውጡ።</li>
            <li><b>Lucia</b> (13 ታሕሳስ) — ቆልዑ ብጻዕዳ ክዳን፣ ሽምዓታት፣ ከምኡ’ውን "Sankta Lucia" ዝብል ደርፊ። ኣንጻር ጸልማት ብርሃን።</li>
            <li><b>Jul</b> (ሌሊት ልደት) — እቲ ምግቢ ኣብ 24፣ ኣብ 25 ኣይኮነን። ኩሉ ዓመት ሰዓት 3 ድሕሪ ቐትሪ ኣብ ተለቪዥን ናይ ዶናልድ ዳክ ካርቱን። ስለምንታይ ኢልካ ኣይትሕተት።</li>
          </ul>
          <h2>Fika</h2>
          <p>fika ናይ ቡን ዕረፍቲ ኣይኮነን — ማሕበራዊ ትካል እዩ። ቡን ወይ ሻሂ፣ መብዛሕትኡ ግዜ ምስ ጥዑም ባኒ (kanelbulle፣ kardemummabulle)። ኣብ ስራሕ መብዛሕትኡ ግዜ መዓልታዊ ክልተ ግዜ። ንfika ምንጻግ ብማሕበራዊ መዳይ ይከኣል እዩ ግን ብስምዒት ግዜ ጥበብ ኣይኮነን።</p>
          <h2>ሃገራዊ መዓልቲ</h2>
          <p>6 ሰነ — Sveriges nationaldag — ንምርጫ Gustav Vasa ኣብ 1523ን ናይ 1809 ቅዋማዊ ምሕዳስን ይዝክር። ካብ 2005 ጥራይ ህዝባዊ በዓል እዩ፣ ክሳብ ሕጂ ድማ ኣብቲ ተራ ይሰፍር ኣሎ።</p>
          <h2>ሓደስቲ ልምድታት</h2>
          <p>ሽወደን ካብ ነዊሕ ግዜ ኣትሒዛ ብስደት ሓደስቲ ልምድታት ወሲዳ፦ Eid al-Fitr (ናይ ሙስሊም)፣ Nouruz (ናይ ፋርሲ ሓድሽ ዓመት)፣ Newroz (ናይ ኩርዲ ሓድሽ ዓመት፣ ንሱ’ውን 21 መጋቢት)፣ Diwali፣ ካልኦትን። እዚኣቶም እናወሰኹ ኣካል ህዝባዊ ህይወት ይኾኑ ኣለዉ — ኣብ ኣብያተ ትምህርቲ፣ ቦታታት ስራሕን ኣደባባያት ከተማን ይብዓሉ።</p>
          ${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ፦ 6 ሰነ · Midsommar፦ ሳልሰይቲ ዓርቢ ሰነ · Lucia፦ 13 ታሕሳስ · እቲ ቀንዲ በዓል ሌሊት ልደት (ዘይኮነ መዓልቲ ልደት) እዩ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Dört büyük bayram</h2>
          <ul>
            <li><b>Midsommar</b> (yaz ortası) — haziranın üçüncü cuması. Mayıs direği, ringa balığı, schnapps, kurbağa gibi dans etmek. İsveç'in yıl boyu iple çektiği asıl tatil günü.</li>
            <li><b>Påsk</b> (Paskalya) — yumurtalar ve tüylü süslemeler, Paskalya cadıları (<em>påskkärringar</em>) kılığına giren çocuklar çizimlerini şekerle takas eder.</li>
            <li><b>Lucia</b> (13 Aralık) — beyaz cüppeli çocuklar, mumlar ve "Sankta Lucia" şarkısı. Karanlığa karşı ışıklar.</li>
            <li><b>Jul</b> (Noel Arifesi) — yemek 25'inde değil, 24'ünde. Her yıl saat 15.00'te televizyonda Donald Duck çizgi filmleri. Sorma.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika bir kahve molası değildir — toplumsal bir kurumdur. Kahve ya da çay, genellikle tatlı bir çörekle (kanelbulle, kardemummabulle). İş yerinde çoğu zaman günde iki kez. Fikayı reddetmek toplumsal olarak mümkün ama duygusal olarak akıllıca değil.</p>
          <h2>Ulusal gün</h2>
          <p>6 Haziran — Sveriges nationaldag — Gustav Vasa'nın 1523'teki seçimini ve 1809 anayasa revizyonunu anar. Ancak 2005'ten beri resmî tatildir ve hâlâ bu role yerleşmektedir.</p>
          <h2>Yeni gelenekler</h2>
          <p>İsveç uzun zamandır göç yoluyla yeni gelenekleri içine almıştır: Eid al-Fitr (Müslüman), Nouruz (Pers Yeni Yılı), Newroz (Kürt Yeni Yılı, ayrıca 21 Mart), Diwali ve diğerleri. Bunlar giderek kamusal yaşamın bir parçası oluyor — okullarda, iş yerlerinde ve şehir meydanlarında kutlanıyor.</p>
          ${ebookFactBox('tr', null, "Ulusal gün: 6 Haziran · Midsommar: haziranın üçüncü cuması · Lucia: 13 Aralık · Asıl kutlama Noel Arifesi'dir (Noel Günü değil).", ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Велика четвірка</h2>
          <ul>
            <li><b>Midsommar</b> (середина літа) — третя п'ятниця червня. Травневий стовп, оселедець, шнапс, танці «як жаби». Справжній вихідний, на який Швеція чекає весь рік.</li>
            <li><b>Påsk</b> (Великдень) — яйця та оздоби з пір'я, діти, вбрані як великодні відьми (<em>påskkärringar</em>), що міняють малюнки на цукерки.</li>
            <li><b>Lucia</b> (13 грудня) — діти в білих шатах, свічки, пісня «Sankta Lucia». Світло проти темряви.</li>
            <li><b>Jul</b> (Святвечір) — святкова вечеря 24-го, а не 25-го. Мультфільми про Дональда Дака по телевізору о 15:00, щороку. Не питайте.</li>
          </ul>
          <h2>Fika</h2>
          <p>Fika — це не перерва на каву, а соціальний інститут. Кава або чай, зазвичай із солодкою булочкою (kanelbulle, kardemummabulle). На роботі часто двічі на день. Відмовитися від fika соціально можливо, але емоційно нерозумно.</p>
          <h2>Національне свято</h2>
          <p>6 червня — Sveriges nationaldag — відзначає обрання Gustav Vasa у 1523 та конституційну реформу 1809. Державним вихідним воно є лише з 2005 і досі звикає до цієї ролі.</p>
          <h2>Нові традиції</h2>
          <p>Швеція давно вбирає нові традиції через міграцію: Eid al-Fitr (мусульманське), Nouruz (перський Новий рік), Newroz (курдський Новий рік, також 21 березня), Diwali та інші. Вони дедалі більше стають частиною суспільного життя — їх святкують у школах, на робочих місцях і на міських площах.</p>
          ${ebookFactBox('uk', null, "Національне свято: 6 червня · Midsommar: третя п'ятниця червня · Lucia: 13 грудня · Головне святкування — Святвечір (а не День Різдва).", ['uhrStudyMaterial'])}
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
        'zh-Hans': '银行与 BankID。',
        'zh-Hant': '銀行與 BankID。',
        ar: 'والبنوك، وBankID.',
        ckb: 'بانک، و BankID.',
        fa: 'بانک‌ها و BankID.',
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
          '瑞典是地球上最不依赖现金的国家之一。如今几乎每一笔交易都通过一个小小的应用完成。',
        'zh-Hant':
          '瑞典是地球上最不依賴現金的國家之一。如今幾乎每一筆交易都透過一個小小的應用程式完成。',
        ar: 'السويد من أقل دول العالم اعتمادًا على النقد. واليوم تمرّ كل معاملة تقريبًا عبر تطبيق صغير واحد.',
        ckb: 'سوید یەکێکە لە کەمترین وڵاتانی جیهان کە پشت بە پارەی کاش دەبەستێت. ئێستا نزیکەی هەموو مامەڵەیەک بە ڕێگەی ئەپێکی بچووکەوە دەڕوات.',
        fa: 'سوئد یکی از کم‌وابسته‌ترین کشورها به پول نقد در جهان است. امروز تقریباً هر تراکنشی از طریق یک برنامهٔ کوچک انجام می‌شود.',
        pl: 'Szwecja należy do krajów najmniej zależnych od gotówki na świecie. Niemal każda transakcja przechodzi dziś przez jedną małą aplikację.',
        so: 'Iswiidhan waa mid ka mid ah dalalka adduunka ugu yar ku tiirsanaanta lacagta caddaanka ah. Maanta ku dhawaad dhaqdhaqaaq kasta wuxuu maraa hal app yar.',
        ti: 'ሽወደን ካብ ዓለም ብውሑድ ኣብ ጥረ ገንዘብ ዝምርኮሳ ሃገራት ሓንቲ እያ። ሎሚ ኩሉ ግብይት ማለት ብሓደ ንእሽቶ መተግበሪ እዩ ዝሓልፍ።',
        tr: 'İsveç dünyada nakde en az bağımlı ülkelerden biridir. Bugün neredeyse her işlem tek bir küçük uygulamadan geçiyor.',
        uk: 'Швеція — одна з найменш залежних від готівки країн світу. Сьогодні майже кожна транзакція проходить через один маленький застосунок.',
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
        'zh-Hans': `<h2>瑞典克朗（krona，SEK）</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>瑞典在 2003 年公投反对采用欧元，使用克朗（kr）。Riksbank（瑞典央行，成立于 1668 年）负责制定货币政策，并印制那种几乎没人使用的现金。</p>
          <h2>银行卡与应用程序</h2>
          <p>现金很少见。大多数商店只接受刷卡。个人之间的付款通过 <em>Swish</em> 完成——这是各家银行共同开发的一款移动支付应用。你输入对方的电话号码、金额和一条留言，然后点一下即可。</p>
          <h2>BankID</h2>
          <p>BankID 是瑞典的国家数字身份。它是一套私营系统（由各家银行建立），但在报税、签租约、参加选举投票、开户以及几乎任何政府服务中，都被当作合法的身份证明。办理 BankID 是新居民最先要做的实用步骤之一。</p>
          <h2>银行与账户</h2>
          <p>要开设瑞典银行账户，你通常需要一个 personnummer（个人身份号码）或协调号码、一份身份证件，以及居住证明。主要银行有：Swedbank、Handelsbanken、SEB、Nordea。仅限线上的选择包括 Avanza 和 Nordnet。</p>
          <h2>养老金</h2>
          <p>分为三层：国家养老金（allmän pension）、通过雇主缴纳的职业养老金（tjänstepension），以及任何个人储蓄。国家养老金覆盖基本生活；其余部分的重要性，往往超出人们的预期。</p>
          ${ebookFactBox('zh-Hans', null, '货币：瑞典克朗（SEK） · Riksbank 成立：1668 · 公投反对欧元：2003 · 支付应用：Swish · 数字身份：BankID。', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        'zh-Hant': `<h2>瑞典克朗（krona，SEK）</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>瑞典在 2003 年公投反對採用歐元，使用克朗（kr）。Riksbank（瑞典央行，成立於 1668 年）負責制定貨幣政策，並印製那種幾乎沒人使用的現金。</p>
          <h2>銀行卡與應用程式</h2>
          <p>現金很少見。大多數商店只接受刷卡。個人之間的付款透過 <em>Swish</em> 完成——這是各家銀行共同開發的一款行動支付應用程式。你輸入對方的電話號碼、金額和一條留言，然後點一下即可。</p>
          <h2>BankID</h2>
          <p>BankID 是瑞典的國家數位身分。它是一套私營系統（由各家銀行建立），但在報稅、簽租約、參加選舉投票、開戶以及幾乎任何政府服務中，都被當作合法的身分證明。辦理 BankID 是新居民最先要做的實用步驟之一。</p>
          <h2>銀行與帳戶</h2>
          <p>要開設瑞典銀行帳戶，你通常需要一個 personnummer（個人身分號碼）或協調號碼、一份身分證件，以及居住證明。主要銀行有：Swedbank、Handelsbanken、SEB、Nordea。僅限線上的選擇包括 Avanza 和 Nordnet。</p>
          <h2>退休金</h2>
          <p>分為三層：國家退休金（allmän pension）、透過雇主繳納的職業退休金（tjänstepension），以及任何個人儲蓄。國家退休金涵蓋基本生活；其餘部分的重要性，往往超出人們的預期。</p>
          ${ebookFactBox('zh-Hant', null, '貨幣：瑞典克朗（SEK） · Riksbank 成立：1668 · 公投反對歐元：2003 · 支付應用：Swish · 數位身分：BankID。', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ar: `<h2>الكرونة السويدية (krona، SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>صوّتت السويد ضد اعتماد اليورو عام 2003 وتستخدم الكرونة (kr). ويضع Riksbank — البنك المركزي السويدي، الذي تأسّس عام 1668 — السياسة النقدية ويطبع النقد الذي لا يكاد أحد يستخدمه.</p>
          <h2>البطاقات والتطبيقات</h2>
          <p>النقد نادر. ومعظم المتاجر تقبل البطاقة فقط. أما الدفع بين شخص وآخر فيتم عبر <em>Swish</em> — تطبيق دفع عبر الهاتف بنته البنوك معًا. تُدخل رقم هاتف ومبلغًا وملاحظة، ثم تنقر.</p>
          <h2>BankID</h2>
          <p>BankID هو الهوية الرقمية الوطنية في السويد. وهو نظام خاص (بنته البنوك)، لكنه يُعامَل كإثبات قانوني للهوية في تقديم الإقرارات الضريبية، وتوقيع عقود الإيجار، والتصويت في الانتخابات، وفتح الحسابات، وفي أي خدمة حكومية تقريبًا. والحصول على BankID هو من أوائل الخطوات العملية التي يتخذها المقيم الجديد.</p>
          <h2>البنوك والحسابات</h2>
          <p>لفتح حساب مصرفي سويدي تحتاج عادةً إلى personnummer (رقم شخصي) أو رقم تنسيق، وبطاقة هوية، وإثبات إقامة. أبرز البنوك: Swedbank وHandelsbanken وSEB وNordea. ومن الخيارات الإلكترونية فقط Avanza وNordnet.</p>
          <h2>المعاش التقاعدي</h2>
          <p>ثلاث طبقات: المعاش الحكومي (allmän pension)، والمعاش المهني عبر صاحب العمل (tjänstepension)، وأي مدّخرات خاصة. يغطّي المعاش الحكومي الأساسيات؛ أما البقية فأهميتها أكبر مما يتوقّع الناس.</p>
          ${ebookFactBox('ar', null, 'العملة: الكرونة السويدية (SEK) · تأسيس Riksbank: 1668 · التصويت ضد اليورو: 2003 · تطبيق الدفع: Swish · الهوية الرقمية: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ckb: `<h2>کرۆنای سویدی (krona، SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>سوید لە ساڵی 2003 دژی پەسەندکردنی یۆرۆ دەنگی دا و کرۆنا (kr) بەکاردەهێنێت. Riksbank — بانکی ناوەندیی سوید، کە لە ساڵی 1668 دامەزراوە — سیاسەتی دراوی دادەنێت و ئەو پارەیە چاپ دەکات کە بەزۆری کەس بەکاری ناهێنێت.</p>
          <h2>کارت و ئەپەکان</h2>
          <p>پارەی کاش دەگمەنە. زۆربەی دوکانەکان تەنها کارت قبووڵ دەکەن. پارەدان لە کەسێکەوە بۆ کەسێکی تر بە <em>Swish</em> دەکرێت — ئەپێکی پارەدانی مۆبایل کە بانکەکان بە هاوبەشی دروستیان کردووە. ژمارەی تەلەفۆن، بڕەکە و تێبینییەک دەنووسیت و کرتە دەکەیت.</p>
          <h2>BankID</h2>
          <p>BankID ناسنامەی دیجیتاڵیی نیشتمانیی سویدە. سیستەمێکی تایبەتە (بانکەکان دروستیان کردووە)، بەڵام وەک بەڵگەی یاساییی ناسنامە مامەڵەی لەگەڵ دەکرێت بۆ پێشکەشکردنی باج، واژووکردنی گرێبەستی کرێ، دەنگدان لە هەڵبژاردنەکاندا، کردنەوەی هەژمار، و بەزۆری هەر خزمەتگوزارییەکی حکوومی. وەرگرتنی BankID یەکێکە لە یەکەم هەنگاوە کرداریییەکانی دانیشتووێکی نوێ.</p>
          <h2>بانک و هەژمارەکان</h2>
          <p>بۆ کردنەوەی هەژمارێکی بانکیی سویدی بەزۆری پێویستت بە personnummer (ژمارەی کەسی) یان ژمارەی هەماهەنگی، ناسنامە، و بەڵگەی نیشتەجێبوون دەبێت. بانکە سەرەکییەکان: Swedbank، Handelsbanken، SEB، Nordea. لە بژاردە تەنها-سەرهێڵەکان Avanza و Nordnet هەن.</p>
          <h2>خانەنشینی</h2>
          <p>سێ چین: خانەنشینیی دەوڵەتی (allmän pension)، خانەنشینیی پیشەیی لە ڕێگەی کارفەرماکەتەوە (tjänstepension)، و هەر پاشەکەوتێکی تایبەت. خانەنشینیی دەوڵەتی پێداویستییە بنەڕەتییەکان دادەپۆشێت؛ ئەوانی تر گرنگییان زۆرترە لەوەی خەڵک چاوەڕێی دەکات.</p>
          ${ebookFactBox('ckb', null, 'دراو: کرۆنای سویدی (SEK) · دامەزراندنی Riksbank: 1668 · دەنگدانی نەرێنی بۆ یۆرۆ: 2003 · ئەپی پارەدان: Swish · ناسنامەی دیجیتاڵ: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        fa: `<h2>کرون سوئد (krona، SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>سوئد در سال 2003 به پذیرش یورو رأی منفی داد و از کرون (kr) استفاده می‌کند. Riksbank — بانک مرکزی سوئد که در سال 1668 تأسیس شد — سیاست پولی را تعیین می‌کند و همان پول نقدی را چاپ می‌کند که تقریباً هیچ‌کس از آن استفاده نمی‌کند.</p>
          <h2>کارت‌ها و اپلیکیشن‌ها</h2>
          <p>پول نقد کمیاب است. بیشتر فروشگاه‌ها فقط کارت می‌پذیرند. پرداخت شخص‌به‌شخص از طریق <em>Swish</em> انجام می‌شود — یک اپلیکیشن پرداخت موبایلی که بانک‌ها به‌طور مشترک ساخته‌اند. یک شماره تلفن، مبلغ و یک یادداشت وارد می‌کنید و ضربه می‌زنید.</p>
          <h2>BankID</h2>
          <p>BankID هویت دیجیتال ملی سوئد است. یک سامانهٔ خصوصی است (که بانک‌ها ساخته‌اند)، اما به‌عنوان مدرک قانونی هویت برای اظهارنامهٔ مالیاتی، امضای قرارداد اجاره، رأی دادن در انتخابات، باز کردن حساب و تقریباً هر خدمت دولتی پذیرفته می‌شود. گرفتن BankID یکی از نخستین گام‌های عملی یک ساکن تازه‌وارد است.</p>
          <h2>بانک‌ها و حساب‌ها</h2>
          <p>برای باز کردن حساب بانکی سوئدی معمولاً به یک personnummer (شمارهٔ شخصی) یا شمارهٔ هماهنگی، یک کارت شناسایی و مدرک محل سکونت نیاز دارید. بانک‌های اصلی: Swedbank، Handelsbanken، SEB، Nordea. گزینه‌های فقط آنلاین شامل Avanza و Nordnet می‌شوند.</p>
          <h2>بازنشستگی</h2>
          <p>سه لایه: بازنشستگی دولتی (allmän pension)، بازنشستگی شغلی از طریق کارفرما (tjänstepension)، و هر پس‌انداز خصوصی. بازنشستگی دولتی نیازهای اولیه را پوشش می‌دهد؛ بقیه بیش از آنچه مردم انتظار دارند اهمیت پیدا می‌کند.</p>
          ${ebookFactBox('fa', null, 'واحد پول: کرون سوئد (SEK) · تأسیس Riksbank: 1668 · رأی منفی به یورو: 2003 · اپلیکیشن پرداخت: Swish · هویت دیجیتال: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        pl: `<h2>Korona szwedzka (krona, SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Szwecja w 2003 roku zagłosowała przeciw przyjęciu euro i używa korony (kr). Riksbank — bank centralny Szwecji, założony w 1668 roku — ustala politykę pieniężną i drukuje gotówkę, której prawie nikt nie używa.</p>
          <h2>Karty i aplikacje</h2>
          <p>Gotówka jest rzadkością. Większość sklepów przyjmuje tylko karty. Płatności między osobami przechodzą przez <em>Swish</em> — aplikację do płatności mobilnych zbudowaną wspólnie przez banki. Wpisujesz numer telefonu, kwotę, notatkę i stukasz.</p>
          <h2>BankID</h2>
          <p>BankID to krajowa tożsamość cyfrowa Szwecji. To system prywatny (zbudowany przez banki), ale traktowany jest jako prawny dowód tożsamości przy składaniu zeznań podatkowych, podpisywaniu umów najmu, głosowaniu w wyborach, otwieraniu kont i niemal każdej usłudze administracji. Uzyskanie BankID to jeden z pierwszych praktycznych kroków nowego mieszkańca.</p>
          <h2>Banki i konta</h2>
          <p>Aby otworzyć szwedzkie konto bankowe, zwykle potrzebujesz personnummer (numeru osobistego) lub numeru koordynacyjnego, dokumentu tożsamości i potwierdzenia zamieszkania. Najważniejsze banki: Swedbank, Handelsbanken, SEB, Nordea. Opcje wyłącznie internetowe to m.in. Avanza i Nordnet.</p>
          <h2>Emerytura</h2>
          <p>Trzy warstwy: emerytura państwowa (allmän pension), emerytura zakładowa przez pracodawcę (tjänstepension) oraz wszelkie oszczędności prywatne. Emerytura państwowa pokrywa podstawy; reszta ma większe znaczenie, niż ludzie się spodziewają.</p>
          ${ebookFactBox('pl', null, 'Waluta: korona szwedzka (SEK) · Riksbank założony: 1668 · Głosowanie przeciw euro: 2003 · Aplikacja płatnicza: Swish · Tożsamość cyfrowa: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        so: `<h2>Krownada Iswiidhan (krona, SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Iswiidhan waxay 2003 ka codaysay diidmada qaadashada euro waxayna isticmaashaa krona (kr). Riksbank — bankiga dhexe ee Iswiidhan, oo la aasaasay 1668 — ayaa dejiya siyaasadda lacagta wuxuuna daabacaa lacagta caddaanka ah ee ku dhowaad cidna isticmaali.</p>
          <h2>Kaararka iyo barnaamijyada</h2>
          <p>Lacagta caddaanka ah way dhif tahay. Dukaamada badankood waxay aqbalaan oo keliya kaarka. Bixinta qof-ka-qof waxay maraysaa <em>Swish</em> — barnaamij lacag-bixin moobiil ah oo ay bankiyadu si wadajir ah u dhiseen. Waxaad gelisaa lambar telefoon, qaddarka, qoraal, dabadeedna waad taabataa.</p>
          <h2>BankID</h2>
          <p>BankID waa aqoonsiga dhijitaalka ah ee qaranka Iswiidhan. Waa nidaam gaar loo leeyahay (oo ay bankiyadu dhiseen), laakiin waxaa loola dhaqmaa caddayn sharci oo aqoonsi ah marka la gudbinayo canshuurta, la saxiixayo heshiisyada kireynta, la codaynayo doorashooyinka, la furayo xisaabaadka, iyo ku dhowaad adeeg kasta oo dawladeed. Helitaanka BankID waa mid ka mid ah tallaabooyinka koowaad ee wax-ku-ool ah ee uu qaato deganaha cusub.</p>
          <h2>Bankiyada iyo xisaabaadka</h2>
          <p>Si aad u furto xisaab bangi oo Iswiidhan ah waxaad caadiyan u baahan tahay personnummer (lambar shaqsiyeed) ama lambar isku-dubbarid, aqoonsi, iyo caddayn deggenaansho. Bankiyada waaweyn: Swedbank, Handelsbanken, SEB, Nordea. Doorashooyinka onlaynka oo keliya waxaa ka mid ah Avanza iyo Nordnet.</p>
          <h2>Hawlgab</h2>
          <p>Saddex lakab: hawlgabka dawladda (allmän pension), hawlgabka shaqada ee loo maro shaqo-bixiyahaaga (tjänstepension), iyo wax kasta oo kayd gaar ah. Hawlgabka dawladda wuxuu daboolaa waxyaabaha aasaasiga ah; inta kale waxay muhiim u tahay si ka badan inta dadku filayaan.</p>
          ${ebookFactBox('so', null, 'Lacagta: krownada Iswiidhan (SEK) · Riksbank la aasaasay: 1668 · Cod diidmo euro: 2003 · Barnaamijka lacag-bixinta: Swish · Aqoonsi dhijitaal: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        ti: `<h2>ሽወደናዊ ክሮና (krona, SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>ሽወደን ኣብ 2003 ኤውሮ ንምቕባል ኣይኮነን ኢላ ድምጺ ሃበት ክሮና (kr) ድማ ትጥቀም። Riksbank — ማእከላይ ባንክ ሽወደን፣ ኣብ 1668 እተመስረተ — ፖሊሲ ገንዘብ የውጽእ ነቲ ኣስታት ዋላ ሓደ ዘይጥቀመሉ ጥረ ገንዘብ ድማ ይሓትም።</p>
          <h2>ካርድታትን ኣፕታትን</h2>
          <p>ጥረ ገንዘብ ሳሕቲ እዩ። መብዛሕትኦም ድኳናት ካርድ ጥራይ እዮም ዝቕበሉ። ካብ ሰብ ናብ ሰብ ዝግበር ክፍሊት ብ<em>Swish</em> ይካየድ — እዚ ድማ እተን ባንክታት ብሓባር ዝሰርሕኦ ናይ ሞባይል ክፍሊት ኣፕ እዩ። ቁጽሪ ተሌፎን፣ መጠን፣ ሓጺር መልእኽቲ ተእቱ፣ ቀጺልካ ድማ ትትንክፍ።</p>
          <h2>BankID</h2>
          <p>BankID ሃገራዊ ዲጂታላዊ መንነት ሽወደን እዩ። ብሕታዊ ስርዓት እዩ (ብባንክታት እተሰርሐ)፣ ግን ኣብ ምቕራብ ግብሪ፣ ምፍራም ውዕል ክራይ፣ ኣብ ምርጫታት ምድማጽ፣ ምኽፋት ሕሳብ፣ ከምኡ’ውን ኣስታት ኩሉ መንግስታዊ ኣገልግሎት ከም ሕጋዊ መረጋገጺ መንነት ይውሰድ። BankID ምርካብ ሓደ ካብቶም ቀዳሞት ግብራዊ ስጉምትታት ናይ ሓድሽ ነባሪ እዩ።</p>
          <h2>ባንክታትን ሕሳባትን</h2>
          <p>ሽወደናዊ ሕሳብ ባንክ ንምኽፋት ብተለምዶ personnummer (ውልቃዊ ቁጽሪ) ወይ ቁጽሪ ምውህሃድ፣ መንነት፣ ከምኡ’ውን መረጋገጺ መንበሪ የድልየካ። ዓበይቲ ባንክታት፦ Swedbank፣ Handelsbanken፣ SEB፣ Nordea። ኣብ መስመር ጥራይ ካብ ዘለዉ ኣማራጺታት Avanza ን Nordnet ን ይርከብዎም።</p>
          <h2>ጡረታ</h2>
          <p>ሰለስተ ደረጃታት፦ መንግስታዊ ጡረታ (allmän pension)፣ ብኣስራሒኻ ኣቢሉ ዝውሃብ ሞያዊ ጡረታ (tjänstepension)፣ ከምኡ’ውን ዝኾነ ውልቃዊ ቁጠባ። መንግስታዊ ጡረታ ነቲ መሰረታዊ ይሽፍን፤ እቲ ዝተረፈ ግን ሰባት ካብ ዝጽበይዎ ንላዕሊ ኣገዳሲ እዩ።</p>
          ${ebookFactBox('ti', null, 'ባጤራ፦ ሽወደናዊ ክሮና (SEK) · Riksbank እተመስረተ፦ 1668 · ኤውሮ ዝተነጽገሉ ድምጺ፦ 2003 · ናይ ክፍሊት ኣፕ፦ Swish · ዲጂታላዊ መንነት፦ BankID።', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        tr: `<h2>İsveç kronu (krona, SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>İsveç 2003'te euroyu benimsemeye karşı oy verdi ve kronu (kr) kullanıyor. Riksbank — 1668'de kurulan İsveç merkez bankası — para politikasını belirler ve neredeyse kimsenin kullanmadığı nakdi basar.</p>
          <h2>Kartlar ve uygulamalar</h2>
          <p>Nakit nadirdir. Çoğu mağaza yalnızca kart kabul eder. Kişiden kişiye ödeme <em>Swish</em> üzerinden yapılır — bankaların birlikte geliştirdiği bir mobil ödeme uygulamasıdır. Bir telefon numarası, tutar ve bir not girer, ardından dokunursunuz.</p>
          <h2>BankID</h2>
          <p>BankID, İsveç'in ulusal dijital kimliğidir. Özel bir sistemdir (bankalar tarafından geliştirilmiştir), ancak vergi beyannamesi verme, kira sözleşmesi imzalama, seçimlerde oy verme, hesap açma ve neredeyse her kamu hizmetinde yasal kimlik kanıtı olarak kabul edilir. BankID edinmek, yeni bir sakinin attığı ilk pratik adımlardan biridir.</p>
          <h2>Bankalar ve hesaplar</h2>
          <p>İsveç banka hesabı açmak için genellikle bir personnummer (kişisel numara) veya koordinasyon numarası, bir kimlik ve ikamet belgesi gerekir. Başlıca bankalar: Swedbank, Handelsbanken, SEB, Nordea. Yalnızca çevrim içi seçenekler arasında Avanza ve Nordnet bulunur.</p>
          <h2>Emeklilik</h2>
          <p>Üç katman: devlet emekliliği (allmän pension), işvereniniz aracılığıyla mesleki emeklilik (tjänstepension) ve varsa özel birikimler. Devlet emekliliği temel ihtiyaçları karşılar; geri kalanı insanların beklediğinden daha çok önem taşır.</p>
          ${ebookFactBox('tr', null, 'Para birimi: İsveç kronu (SEK) · Riksbank kuruluşu: 1668 · Euroya karşı oy: 2003 · Ödeme uygulaması: Swish · Dijital kimlik: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
        `,
        uk: `<h2>Шведська крона (krona, SEK)</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'riksbankHistory'])}>Швеція у 2003 році проголосувала проти запровадження євро й використовує крону (kr). Riksbank — центральний банк Швеції, заснований 1668 року — визначає монетарну політику й друкує готівку, якою майже ніхто не користується.</p>
          <h2>Картки й застосунки</h2>
          <p>Готівка трапляється рідко. Більшість крамниць приймають лише картку. Платежі між людьми проходять через <em>Swish</em> — застосунок для мобільних платежів, спільно створений банками. Ви вводите номер телефону, суму, примітку — і торкаєтеся екрана.</p>
          <h2>BankID</h2>
          <p>BankID — це національна цифрова ідентичність Швеції. Це приватна система (створена банками), але вона вважається законним підтвердженням особи для подання податкової декларації, підписання договорів оренди, голосування на виборах, відкриття рахунків і майже будь-якої державної послуги. Отримання BankID — один із перших практичних кроків нового мешканця.</p>
          <h2>Банки та рахунки</h2>
          <p>Щоб відкрити шведський банківський рахунок, зазвичай потрібні personnummer (особистий номер) або координаційний номер, документ, що посвідчує особу, і підтвердження проживання. Основні банки: Swedbank, Handelsbanken, SEB, Nordea. Серед суто онлайнових варіантів — Avanza та Nordnet.</p>
          <h2>Пенсія</h2>
          <p>Три рівні: державна пенсія (allmän pension), професійна пенсія через роботодавця (tjänstepension) і будь-які приватні заощадження. Державна пенсія покриває основне; решта важить більше, ніж люди очікують.</p>
          ${ebookFactBox('uk', null, 'Валюта: шведська крона (SEK) · Riksbank заснований: 1668 · Голосування проти євро: 2003 · Платіжний застосунок: Swish · Цифрова ідентичність: BankID.', ['uhrStudyMaterial', 'riksbankHistory'])}
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
      title: {
        en: 'Sweden,',
        sv: 'Sverige,',
        'zh-Hans': '瑞典、',
        'zh-Hant': '瑞典、',
        ar: 'السويد',
        ckb: 'سوید،',
        fa: 'سوئد،',
        pl: 'Szwecja,',
        so: 'Iswiidhan,',
        ti: 'ሽወደን፣',
        tr: 'İsveç,',
        uk: 'Швеція,',
      },
      title_em: {
        en: 'the EU, and the world.',
        sv: 'EU och världen.',
        'zh-Hans': '欧盟与世界。',
        'zh-Hant': '歐盟與世界。',
        ar: 'والاتحاد الأوروبي والعالم.',
        ckb: 'یەکێتیی ئەورووپا و جیهان.',
        fa: 'اتحادیهٔ اروپا و جهان.',
        pl: 'UE i świat.',
        so: 'Midowga Yurub, iyo adduunka.',
        ti: 'ኤውሮጳዊ ሕብረትን ዓለምን።',
        tr: 'AB ve dünya.',
        uk: 'ЄС і світ.',
      },
      lede: {
        en: 'Sweden spent two centuries avoiding war and one decade rapidly joining alliances. The pattern is the same — be useful, stay out of trouble.',
        sv: 'Sverige tillbringade två sekel med att undvika krig och ett årtionde med att snabbt gå med i allianser. Mönstret är detsamma — gör nytta, undvik bråk.',
        'zh-Hans':
          '瑞典用了两个世纪来避免战争，又用了十年时间迅速加入各种联盟。其模式始终如一——做个有用的伙伴，远离麻烦。',
        'zh-Hant':
          '瑞典用了兩個世紀來避免戰爭，又用了十年時間迅速加入各種聯盟。其模式始終如一——做個有用的夥伴，遠離麻煩。',
        ar: 'أمضت السويد قرنين في تجنّب الحرب وعقدًا واحدًا في الانضمام السريع إلى التحالفات. النمط هو نفسه — كن مفيدًا، وابقَ بعيدًا عن المتاعب.',
        ckb: 'سوید دوو سەدەی بەسەربرد بۆ خۆلابوون لە جەنگ و دەیەیەکیش بۆ چوونە ناو هاوپەیمانییەکان بە خێرایی. شێوازەکە هەمان شتە — سوودبەخش بە، خۆت لە کێشە بپارێزە.',
        fa: 'سوئد دو سده را صرف پرهیز از جنگ کرد و یک دهه را صرف پیوستن سریع به ائتلاف‌ها. الگو همان است — سودمند باش، از دردسر دور بمان.',
        pl: 'Szwecja spędziła dwa stulecia na unikaniu wojny i jedną dekadę na szybkim przystępowaniu do sojuszy. Wzorzec jest ten sam — bądź użyteczny, trzymaj się z dala od kłopotów.',
        so: 'Iswiidhan waxay laba qarni ku qaadatay ka fogaanshaha dagaalka iyo toban sano oo ay si degdeg ah ugu biirtay isbahaysiyo. Qaabku waa isku mid — wax tar, kana fogow dhibaatada.',
        ti: 'ሽወደን ክልተ ክፍለ ዘመን ኲናት ብምውጋድ፣ ሓደ ዓሰርተ ዓመት ድማ ብቕልጡፍ ናብ ኪዳናት ብምእታው ኣሕለፈት። እቲ ኣገባብ ሓደ እዩ — ጠቓሚ ኩን፣ ካብ ጸገም ራሕቕ።',
        tr: 'İsveç iki yüzyılını savaştan kaçınarak, on yılını ise hızla ittifaklara katılarak geçirdi. Örüntü aynı — yararlı ol, beladan uzak dur.',
        uk: 'Швеція провела два століття, уникаючи війни, і одне десятиліття, стрімко вступаючи до союзів. Схема та сама — будь корисним, тримайся подалі від халепи.',
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
        'zh-Hans': `<h2>欧洲联盟（EU）</h2>
          <p>瑞典在 1994 年举行公投（52% 赞成，47% 反对）之后，于 1995 年 1 月 1 日加入 EU。它使用克朗，而非欧元。它在欧洲议会拥有 21 个席位。在 EU 拥有职权的领域——贸易、农业、渔业、环境、自由流动——EU 法律优先于瑞典法律。</p>
          <h2>申根（Schengen）</h2>
          <p>瑞典属于申根区——与大多数 EU 国家以及挪威、冰岛、瑞士和列支敦士登之间内部边界开放。你可以无须护照检查地通行；但你仍可能被要求出示身份证件。</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>瑞典在两百多年里保持军事不结盟，在两次世界大战和冷战期间都保持中立。在俄罗斯入侵乌克兰之后，瑞典于 2022 年 5 月申请加入 NATO，并于 2024 年 3 月 7 日正式加入。</p>
          <h2>联合国（UN）与援助</h2>
          <p>瑞典于 1946 年加入 UN。它在国际援助与和平外交方面有着悠久的记录。1953 至 1961 年担任 UN 秘书长的 Dag Hammarskjöld 就是瑞典人。</p>
          <h2>国防</h2>
          <p>义务兵役制（<em>värnplikt</em>，征兵制）于 2017 年重新启动，适用于 1999 年及以后出生的男女。并非每个人都会被征召——选拔依据测试和意愿。服役期通常为 9 至 12 个月。</p>
          ${ebookFactBox('zh-Hans', null, '加入 EU：1995 · 投票反对欧元：2003 · 加入 NATO：2024 · 自 1946 年起为 UN 成员 · 重新启动义务兵役：2017。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        'zh-Hant': `<h2>歐洲聯盟（EU）</h2>
          <p>瑞典在 1994 年舉行公投（52% 贊成，47% 反對）之後，於 1995 年 1 月 1 日加入 EU。它使用克朗，而非歐元。它在歐洲議會擁有 21 個席位。在 EU 擁有職權的領域——貿易、農業、漁業、環境、自由流動——EU 法律優先於瑞典法律。</p>
          <h2>申根（Schengen）</h2>
          <p>瑞典屬於申根區——與大多數 EU 國家以及挪威、冰島、瑞士和列支敦斯登之間內部邊界開放。你可以無須護照檢查地通行；但你仍可能被要求出示身分證件。</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>瑞典在兩百多年裡保持軍事不結盟，在兩次世界大戰和冷戰期間都保持中立。在俄羅斯入侵烏克蘭之後，瑞典於 2022 年 5 月申請加入 NATO，並於 2024 年 3 月 7 日正式加入。</p>
          <h2>聯合國（UN）與援助</h2>
          <p>瑞典於 1946 年加入 UN。它在國際援助與和平外交方面有著悠久的記錄。1953 至 1961 年擔任 UN 秘書長的 Dag Hammarskjöld 就是瑞典人。</p>
          <h2>國防</h2>
          <p>義務兵役制（<em>värnplikt</em>，徵兵制）於 2017 年重新啟動，適用於 1999 年及以後出生的男女。並非每個人都會被徵召——選拔依據測驗和意願。服役期通常為 9 至 12 個月。</p>
          ${ebookFactBox('zh-Hant', null, '加入 EU：1995 · 投票反對歐元：2003 · 加入 NATO：2024 · 自 1946 年起為 UN 成員 · 重新啟動義務兵役：2017。', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ar: `<h2>الاتحاد الأوروبي</h2>
          <p>انضمّت السويد إلى الاتحاد الأوروبي في 1 يناير 1995 بعد استفتاء جرى عام 1994 (52% نعم، 47% لا). تستخدم الكرونة لا اليورو. ولها 21 مقعدًا في البرلمان الأوروبي. ولقانون الاتحاد الأوروبي أسبقية على القانون السويدي في المجالات التي يملك الاتحاد صلاحية فيها — التجارة والزراعة والثروة السمكية والبيئة وحرية التنقّل.</p>
          <h2>شنغن (Schengen)</h2>
          <p>السويد جزء من منطقة شنغن — حدود داخلية مفتوحة مع معظم دول الاتحاد الأوروبي، إضافةً إلى النرويج وأيسلندا وسويسرا وليختنشتاين. يمكنك السفر دون فحص جوازات السفر؛ لكن قد يُطلب منك إثبات الهوية.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>كانت السويد غير منحازة عسكريًا لأكثر من 200 عام، محايدةً خلال الحربين العالميتين والحرب الباردة. بعد غزو روسيا لأوكرانيا، تقدّمت السويد بطلب الانضمام إلى NATO في مايو 2022 وانضمّت رسميًا في 7 مارس 2024.</p>
          <h2>الأمم المتحدة (UN) والمساعدات</h2>
          <p>انضمّت السويد إلى UN عام 1946. ولها سجلّ طويل في المساعدات الدولية ودبلوماسية السلام. وكان Dag Hammarskjöld، الأمين العام لـ UN بين عامي 1953 و1961، سويديًا.</p>
          <h2>الدفاع</h2>
          <p>أُعيد تفعيل الخدمة العسكرية الإلزامية (<em>värnplikt</em>) عام 2017 وتنطبق على الرجال والنساء المولودين من عام 1999 فصاعدًا. لا يُستدعى الجميع — يقوم الاختيار على الاختبارات والدافعية. وتمتدّ الخدمة عادةً من 9 إلى 12 شهرًا.</p>
          ${ebookFactBox('ar', null, 'الانضمام إلى EU: 1995 · التصويت ضد اليورو: 2003 · الانضمام إلى NATO: 2024 · عضو في UN منذ: 1946 · إعادة تفعيل الخدمة الإلزامية: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ckb: `<h2>یەکێتیی ئەورووپا</h2>
          <p>سوید لە 1ی جانیوەری 1995 چووە ناو EU دوای ڕاپرسییەک لە 1994 (52% بەڵێ، 47% نا). کرۆنا بەکاردەهێنێت، نەک یۆرۆ. 21 کورسیی لە پەرلەمانی ئەورووپیدا هەیە. یاسای EU لەو بوارانەی کە EU دەسەڵاتی تێدا هەیە لەسەر یاسای سوید پێشینەی هەیە — بازرگانی، کشتوکاڵ، ماسیگرتن، ژینگە، جووڵەی ئازاد.</p>
          <h2>شەنگن (Schengen)</h2>
          <p>سوید بەشێکە لە ناوچەی شەنگن — سنووری ناوخۆیی کراوە لەگەڵ زۆربەی EU، لەگەڵ نەرویج، ئایسلەند، سویسرا و لیختنشتاین. دەتوانیت بەبێ پشکنینی پاسپۆرت گەشت بکەیت؛ بەڵام لەوانەیە هێشتا داوای ناسنامەت لێ بکرێت.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>سوید بۆ ماوەی زیاتر لە 200 ساڵ لە ڕووی سەربازییەوە نابەستراو بوو، لە هەردوو جەنگی جیهانی و جەنگی ساردیشدا بێلایەن. دوای هێرشی ڕووسیا بۆ سەر ئۆکرانیا، سوید لە مایسی 2022دا داوای چوونە ناو NATOی کرد و لە 7ی مارسی 2024 بە شێوەی فەرمی چووە ناوی.</p>
          <h2>نەتەوە یەکگرتووەکان (UN) و یارمەتی</h2>
          <p>سوید لە 1946دا چووە ناو UN. تۆمارێکی درێژی هەیە لە یارمەتیی نێودەوڵەتی و دیپلۆماسیی ئاشتی. Dag Hammarskjöld، سکرتێری گشتیی UN لە 1953–1961، سویدی بوو.</p>
          <h2>بەرگری</h2>
          <p>خزمەتی سەربازیی ناچاری (<em>värnplikt</em>) لە 2017دا دووبارە چالاک کرایەوە و بۆ ژن و پیاوانی لەدایکبووی 1999 بەدواوە جێبەجێ دەکرێت. هەموو کەس بانگ ناکرێت — هەڵبژاردن لەسەر بنەمای تاقیکردنەوە و خواست دەبێت. خزمەتەکە بەزۆری 9–12 مانگە.</p>
          ${ebookFactBox('ckb', null, 'چوونە ناو EU: 1995 · دەنگدانی نەرێنی بۆ یۆرۆ: 2003 · چوونە ناو NATO: 2024 · ئەندامی UN لە: 1946 · دووبارە چالاککردنەوەی خزمەتی سەربازی: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        fa: `<h2>اتحادیهٔ اروپا</h2>
          <p>سوئد در 1 ژانویهٔ 1995 پس از یک همه‌پرسی در سال 1994 (52% آری، 47% نه) به EU پیوست. از کرون استفاده می‌کند، نه یورو. در پارلمان اروپا 21 کرسی دارد. قانون EU در حوزه‌هایی که EU صلاحیت دارد بر قانون سوئد تقدّم دارد — تجارت، کشاورزی، شیلات، محیط زیست، جابه‌جایی آزاد.</p>
          <h2>شِنگن (Schengen)</h2>
          <p>سوئد بخشی از منطقهٔ شِنگن است — مرزهای داخلی باز با بیشتر کشورهای EU، به‌علاوهٔ نروژ، ایسلند، سوئیس و لیختن‌اشتاین. می‌توانید بدون بازرسی گذرنامه سفر کنید؛ اما ممکن است هنوز از شما کارت شناسایی خواسته شود.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>سوئد بیش از 200 سال از نظر نظامی غیرمتعهد بود و در هر دو جنگ جهانی و جنگ سرد بی‌طرف ماند. پس از تهاجم روسیه به اوکراین، سوئد در مهٔ 2022 برای پیوستن به NATO درخواست داد و در 7 مارس 2024 به‌طور رسمی پیوست.</p>
          <h2>سازمان ملل متحد (UN) و کمک</h2>
          <p>سوئد در سال 1946 به UN پیوست. سابقهٔ طولانی در کمک‌رسانی بین‌المللی و دیپلماسی صلح دارد. Dag Hammarskjöld، دبیرکل UN در سال‌های 1953 تا 1961، سوئدی بود.</p>
          <h2>دفاع</h2>
          <p>خدمت سربازی اجباری (<em>värnplikt</em>) در سال 2017 دوباره فعال شد و شامل زنان و مردان متولد 1999 به بعد می‌شود. همه فراخوانده نمی‌شوند — گزینش بر پایهٔ آزمون‌ها و انگیزه است. خدمت معمولاً 9 تا 12 ماه است.</p>
          ${ebookFactBox('fa', null, 'پیوستن به EU: 1995 · رأی منفی به یورو: 2003 · پیوستن به NATO: 2024 · عضو UN از: 1946 · فعال‌سازی دوبارهٔ سربازی اجباری: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        pl: `<h2>Unia Europejska</h2>
          <p>Szwecja przystąpiła do UE 1 stycznia 1995 po referendum w 1994 (52% za, 47% przeciw). Używa korony, nie euro. Ma 21 miejsc w Parlamencie Europejskim. Prawo UE ma pierwszeństwo przed prawem szwedzkim w obszarach, w których UE ma kompetencje — handel, rolnictwo, rybołówstwo, środowisko, swobodny przepływ.</p>
          <h2>Schengen</h2>
          <p>Szwecja należy do strefy Schengen — otwarte granice wewnętrzne z większością UE oraz Norwegią, Islandią, Szwajcarią i Liechtensteinem. Możesz podróżować bez kontroli paszportowej; nadal jednak możesz zostać poproszony o dokument tożsamości.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Szwecja przez ponad 200 lat pozostawała poza sojuszami wojskowymi, neutralna podczas obu wojen światowych i zimnej wojny. Po inwazji Rosji na Ukrainę Szwecja złożyła wniosek o przystąpienie do NATO w maju 2022 i formalnie dołączyła 7 marca 2024.</p>
          <h2>Organizacja Narodów Zjednoczonych (UN) i pomoc</h2>
          <p>Szwecja przystąpiła do UN w 1946. Ma długą historię pomocy międzynarodowej i dyplomacji pokojowej. Dag Hammarskjöld, Sekretarz Generalny UN w latach 1953–1961, był Szwedem.</p>
          <h2>Obrona</h2>
          <p>Pobór (<em>värnplikt</em>) został przywrócony w 2017 i obejmuje mężczyzn i kobiety urodzonych od 1999. Nie każdy jest powoływany — wybór opiera się na testach i motywacji. Służba trwa zwykle 9–12 miesięcy.</p>
          ${ebookFactBox('pl', null, 'Przystąpienie do EU: 1995 · Głosowanie przeciw euro: 2003 · Przystąpienie do NATO: 2024 · Członek UN od: 1946 · Przywrócenie poboru: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        so: `<h2>Midowga Yurub</h2>
          <p>Iswiidhan waxay ku biirtay EU 1 Janaayo 1995 ka dib aftida 1994 (52% haa, 47% maya). Waxay isticmaashaa krona, ee ma aha euro. Waxay ku leedahay 21 kursi Baarlamaanka Yurub. Sharciga EU wuxuu ka horreeyaa sharciga Iswiidhan meelaha EU awood u leedahay — ganacsiga, beeraha, kalluumeysiga, deegaanka, dhaqdhaqaaqa xorta ah.</p>
          <h2>Schengen</h2>
          <p>Iswiidhan waa qayb ka mid ah Aagga Schengen — xudduudo gudaha ah oo furan oo lala leeyahay inta badan EU, oo ay weheliyaan Norway, Iceland, Switzerland, iyo Liechtenstein. Waad safri kartaa adigoon baasaboor lagaa hubin; haddana waxaa lagaa weydiin karaa aqoonsi.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Iswiidhan in ka badan 200 sano way ahayd mid aan militari isbahaysi lahayn, dhexdhexaad ah labadii Dagaal ee Adduunka iyo Dagaalkii Qaboobaa. Ka dib markii Ruushku ku duulay Ukrayn, Iswiidhan waxay codsatay inay ku biirto NATO May 2022 waxayna si rasmi ah ugu biirtay 7 Maarso 2024.</p>
          <h2>Qaramada Midoobay (UN) iyo gargaarka</h2>
          <p>Iswiidhan waxay ku biirtay UN 1946. Waxay leedahay rikoor dheer oo caawimaad caalami ah iyo diblomaasiyad nabadeed. Dag Hammarskjöld, Xoghayaha Guud ee UN 1953–1961, wuxuu ahaa Iswiidhish.</p>
          <h2>Difaaca</h2>
          <p>Ciidanka qasabka ah (<em>värnplikt</em>) ayaa dib loo soo celiyay 2017 wuxuuna khuseeyaa rag iyo dumar ay dhasheen 1999 wixii ka dambeeyay. Qof walba lama yeerin — xulashada waxay ku salaysan tahay imtixaanno iyo dafac. Adeegga caadi ahaan waa 9–12 bilood.</p>
          ${ebookFactBox('so', null, 'Ku biiristii EU: 1995 · Codkii ka soo horjeeday euro: 2003 · Ku biiristii NATO: 2024 · Xubin UN tan iyo: 1946 · Dib-u-soo-celinta ciidanka qasabka ah: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        ti: `<h2>ኤውሮጳዊ ሕብረት</h2>
          <p>ሽወደን ኣብ 1ይ ጥሪ 1995 ድሕሪ ናይ 1994 ህዝበ ውሳነ (52% እወ፣ 47% ኣይፋል) ናብ EU ኣተወት። ክሮና ትጥቀም፣ ዩሮ ኣይኮነን። ኣብ ኤውሮጳዊ ፓርላማ 21 መንበር ኣለዋ። ሕጊ EU ኣብቶም EU ስልጣን ዘለዎ ጽላታት — ንግዲ፣ ሕርሻ፣ ምግፋፍ ዓሳ፣ ኣከባቢ፣ ናጻ ምንቅስቓስ — ካብ ሕጊ ሽወደን ቀዳምነት ኣለዎ።</p>
          <h2>ሸንገን (Schengen)</h2>
          <p>ሽወደን ክፋል ናይ ዞባ ሸንገን እያ — ምስ መብዛሕትኡ EU፣ ከምኡ’ውን ኖርወይ፣ ኣይስላንድ፣ ስዊዘርላንድን ሊختንስታይንን ክፉት ውሽጣዊ ዶብ። ብዘይ ምርመራ ፓስፖርት ክትጓዓዝ ትኽእል፣ ኮይኑ ግን ኣይዲ ክሕተት ትኽእል ኢኻ።</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>ሽወደን ካብ 200 ዓመት ንላዕሊ ወተሃደራዊ ዘይምሕባር ጸኒሓ፣ ኣብ ክልቲኡ ኲናት ዓለምን ዝሑል ኲናትን ድማ ገለልተኛ ነበረት። ድሕሪ ወራር ሩስያ ኣብ ልዕሊ ዩክሬን፣ ሽወደን ኣብ ግንቦት 2022 ናብ NATO ንምእታው ኣመልከተት፣ ኣብ 7 መጋቢት 2024 ድማ ብወግዒ ኣተወት።</p>
          <h2>ሕቡራት ሃገራት (UN) ን ሓገዝን</h2>
          <p>ሽወደን ኣብ 1946 ናብ UN ኣተወት። ኣብ ኣህጉራዊ ሓገዝን ናይ ሰላም ዲፕሎማሲን ነዊሕ ታሪኽ ኣለዋ። Dag Hammarskjöld፣ ዋና ጸሓፊ UN 1953–1961፣ ሽወደናዊ ነበረ።</p>
          <h2>ምክልኻል</h2>
          <p>ግዴታዊ ውትህድርና (<em>värnplikt</em>) ኣብ 2017 እንደገና ተበጊሱ፣ ካብ 1999 ንደሓር ንዝተወልዱ ደቂ ተባዕትዮን ደቂ ኣንስትዮን ድማ ይምልከት። ኩሉ ሰብ ኣይጽዋዕን — ምርጫ ኣብ ፈተናታትን ድሌትን ይምርኮስ። እቲ ኣገልግሎት መብዛሕትኡ ግዜ 9–12 ኣዋርሕ እዩ።</p>
          ${ebookFactBox('ti', null, 'ናብ EU ምእታው፦ 1995 · ኣንጻር ዩሮ ምድማጽ፦ 2003 · ናብ NATO ምእታው፦ 2024 · ካብ ኣባል UN፦ 1946 · ግዴታዊ ውትህድርና እንደገና ምብጋስ፦ 2017።', ['uhrStudyMaterial', 'governmentNato'])}
        `,
        tr: `<h2>Avrupa Birliği</h2>
          <p>İsveç, 1994'teki bir referandumun (%52 evet, %47 hayır) ardından 1 Ocak 1995'te AB'ye katıldı. Euro değil, kronu kullanır. Avrupa Parlamentosu'nda 21 sandalyesi vardır. AB hukuku, AB'nin yetkili olduğu alanlarda — ticaret, tarım, balıkçılık, çevre, serbest dolaşım — İsveç hukukuna göre önceliklidir.</p>
          <h2>Schengen</h2>
          <p>İsveç, Schengen Bölgesi'nin bir parçasıdır — AB'nin çoğuyla, ayrıca Norveç, İzlanda, İsviçre ve Liechtenstein ile açık iç sınırlar. Pasaport kontrolü olmadan seyahat edebilirsiniz; yine de kimlik istenebilir.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>İsveç 200 yılı aşkın süre askeri açıdan tarafsız kaldı; her iki Dünya Savaşı'nda ve Soğuk Savaş boyunca tarafsızdı. Rusya'nın Ukrayna'yı işgalinden sonra İsveç, Mayıs 2022'de NATO'ya katılmak için başvurdu ve 7 Mart 2024'te resmen katıldı.</p>
          <h2>Birleşmiş Milletler (UN) ve yardım</h2>
          <p>İsveç 1946'da UN'ye katıldı. Uluslararası yardım ve barış diplomasisinde uzun bir geçmişi vardır. 1953–1961 yılları arasında UN Genel Sekreteri olan Dag Hammarskjöld İsveçliydi.</p>
          <h2>Savunma</h2>
          <p>Zorunlu askerlik (<em>värnplikt</em>) 2017'de yeniden yürürlüğe girdi ve 1999 ve sonrasında doğan kadın ile erkekleri kapsar. Herkes çağrılmaz — seçim, testlere ve motivasyona dayanır. Hizmet süresi genellikle 9–12 aydır.</p>
          ${ebookFactBox('tr', null, "EU'ya katılım: 1995 · Euroya karşı oy: 2003 · NATO'ya katılım: 2024 · UN üyesi olunan yıl: 1946 · Zorunlu askerliğin yeniden başlaması: 2017.", ['uhrStudyMaterial', 'governmentNato'])}
        `,
        uk: `<h2>Європейський Союз</h2>
          <p>Швеція вступила до ЄС 1 січня 1995 після референдуму 1994 року (52% за, 47% проти). Вона використовує крону, а не євро. Має 21 місце в Європейському парламенті. Право ЄС має перевагу над шведським правом у сферах, де ЄС має компетенцію — торгівля, сільське господарство, рибальство, довкілля, вільне пересування.</p>
          <h2>Шенген (Schengen)</h2>
          <p>Швеція входить до Шенгенської зони — відкриті внутрішні кордони з більшістю країн ЄС, а також Норвегією, Ісландією, Швейцарією та Ліхтенштейном. Можна подорожувати без паспортного контролю; утім, у вас усе ще можуть попросити документ, що посвідчує особу.</p>
          <h2>NATO</h2>
          <p${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'governmentNato'])}>Швеція понад 200 років зберігала військовий нейтралітет, була нейтральною в обох світових війнах і в холодній війні. Після вторгнення Росії в Україну Швеція подала заявку на вступ до NATO у травні 2022 і офіційно вступила 7 березня 2024.</p>
          <h2>Організація Об'єднаних Націй (UN) та допомога</h2>
          <p>Швеція вступила до UN у 1946. Вона має тривалу історію міжнародної допомоги та мирної дипломатії. Dag Hammarskjöld, Генеральний секретар UN у 1953–1961, був шведом.</p>
          <h2>Оборона</h2>
          <p>Військовий призов (<em>värnplikt</em>) було відновлено у 2017 і він стосується чоловіків і жінок, народжених від 1999 року. Призивають не всіх — відбір ґрунтується на тестах і мотивації. Служба зазвичай триває 9–12 місяців.</p>
          ${ebookFactBox('uk', null, 'Вступ до EU: 1995 · Голосування проти євро: 2003 · Вступ до NATO: 2024 · Член UN від: 1946 · Відновлення призову: 2017.', ['uhrStudyMaterial', 'governmentNato'])}
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
      title: {
        en: 'Migration, residence,',
        sv: 'Migration, uppehåll',
        'zh-Hans': '移民、居留，',
        'zh-Hant': '移民、居留，',
        ar: 'الهجرة والإقامة',
        ckb: 'کۆچ، نیشتەجێبوون،',
        fa: 'مهاجرت، اقامت',
        pl: 'Migracja, pobyt',
        so: 'Socdaalka, deganaanshaha,',
        ti: 'ስደት፣ መንበሪ፣',
        tr: 'Göç, ikamet',
        uk: 'Міграція, проживання',
      },
      title_em: {
        en: 'and citizenship.',
        sv: 'och medborgarskap.',
        'zh-Hans': '与公民身份。',
        'zh-Hant': '與公民身分。',
        ar: 'والجنسية.',
        ckb: 'و هاووڵاتیبوون.',
        fa: 'و شهروندی.',
        pl: 'i obywatelstwo.',
        so: 'iyo muwaadinimada.',
        ti: 'ከምኡ’ውን ዜግነት።',
        tr: 've vatandaşlık.',
        uk: 'та громадянство.',
      },
      lede: {
        en: 'Becoming a Swedish citizen is a process more than an event. The paperwork is long, but the rules are unusually clear.',
        sv: 'Att bli svensk medborgare är mer en process än ett ögonblick. Pappersarbetet är långt, men reglerna är ovanligt tydliga.',
        'zh-Hans': '成为瑞典公民更像是一个过程，而不是一个瞬间。手续繁多，但规则却异常清晰。',
        'zh-Hant': '成為瑞典公民更像是一個過程，而不是一個瞬間。手續繁多，但規則卻異常清晰。',
        ar: 'أن تصبح مواطنًا سويديًا عملية أكثر منه حدثًا. المعاملات طويلة، لكن القواعد واضحة على نحو غير معتاد.',
        ckb: 'بوون بە هاووڵاتییەکی سویدی زیاتر پرۆسەیەکە تا ڕووداوێک. کاغەزبازییەکە درێژە، بەڵام یاساکان بە شێوەیەکی نائاسایی ڕوونن.',
        fa: 'شهروند سوئد شدن بیش از آنکه یک رویداد باشد، یک فرایند است. کارهای اداری طولانی است، اما قواعد به‌طور غیرمعمولی روشن‌اند.',
        pl: 'Zostanie szwedzkim obywatelem to bardziej proces niż wydarzenie. Formalności są długie, ale zasady są niezwykle jasne.',
        so: 'In aad noqoto muwaadin Iswiidhan waa hannaan ka badan dhacdo. Warqadahu way dheer yihiin, laakiin xeerarku waa kuwo si aan caadi ahayn u cad.',
        ti: 'ሽወደናዊ ዜጋ ምዃን ካብ ሓደ ፍጻመ ንላዕሊ መስርሕ እዩ። እቲ ናይ ወረቐት ስራሕ ነዊሕ እዩ፣ እቲ ሕግታት ግን ብዘይልሙድ ንጹር እዩ።',
        tr: 'İsveç vatandaşı olmak bir olaydan çok bir süreçtir. Evrak işleri uzundur, ama kurallar alışılmadık ölçüde nettir.',
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
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>For an adult application, be at least 18 years old. From 6 June 2026, children can no longer be included on a parent's citizenship application; a child needs a separate application signed by a guardian.</li>
            <li>Have a permanent residence permit, right of residence, or right of permanent residence.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Have lived in Sweden for a qualifying period. From 6 June 2026, the adult main rule is eight years, with shorter periods for some groups.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Meet the stricter conduct requirement. Offences can mean a longer waiting period before citizenship can be granted, and Migrationsverket decides individual cases.</li>
            <li>(From 2026) Pass the medborgarskapsprov — the citizenship test on civic knowledge and Swedish — and meet a Swedish-language requirement.</li>
          </ul>
          <h2>Dual citizenship</h2>
          <p>Sweden has accepted dual citizenship since 2001. You do not lose your original citizenship by becoming Swedish (subject to your origin country's rules).</p>
          ${ebookFactBox('en', 'Current citizenship notes', 'New citizenship rules apply from 6 June 2026. The first civic-knowledge sitting is 15 August 2026 in Stockholm. Children need a separate citizenship application from 6 June 2026 · Adult main residence rule: 8 years · Stricter conduct requirement with longer waiting periods after offences · Decision authority: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
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
            {
              text: 'Från 6 juni 2026 skärps skötsamhetskravet, och brott kan innebära längre karenstid innan medborgarskap kan beviljas. Migrationsverket avgör det enskilda ärendet.',
              sourceKeys: ['migrationsverketCitizenshipRules'],
            },
            'Dubbelt medborgarskap är tillåtet enligt svensk rätt, men andra länders regler kan påverka.',
          ],
          'Migrationsverket · Skatteverket · Huvudregel för vuxnas hemvist: 8 år · Skärpt skötsamhetskrav med längre karenstider efter brott · Dubbelt medborgarskap tillåts sedan 2001.',
          ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'],
          'Kontrollera alltid aktuella krav hos Migrationsverket och UHR. Regler kan ändras, och den här boken är bara ett studiehjälpmedel.',
          ebookSourceNote('sv', ['migrationsverketCitizenshipRules']),
        ),
        'zh-Hans': `<h2>谁是谁</h2>
          <ul>
            <li><b>Migrationsverket</b> —— 移民局。负责裁定居留许可、庇护、家庭团聚、工作许可以及公民身份。</li>
            <li><b>Skatteverket</b> —— 一旦你拥有居留许可并被登记为在瑞典居住，它就会给你 personnummer（个人编号）。</li>
            <li><b>Polisen</b> —— 负责护照和部分身份证件事务。</li>
          </ul>
          <h2>取得永久居留的途径</h2>
          <p>你可以以下列身份来到瑞典：劳动者（持有高于最低工资的工作录用通知）、学生、研究人员、某位居民的家庭成员、行使自由迁徙权的欧盟公民，或寻求庇护者。在经过一段时间的合法居留——通常为四到五年——之后，你可以申请永久居留（<em>permanent uppehållstillstånd</em>），或者，对欧盟公民而言，申请永久居留权。</p>
          <h2>成为瑞典人</h2>
          <p>若要通过入籍申请瑞典公民身份，你通常需要：</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>就成年人的申请而言，年满 18 周岁。自 2026 年 6 月 6 日起，子女不能再被列入父母一方的公民身份申请之中；子女需要一份由监护人签署的单独申请。</li>
            <li>持有永久居留许可、居留权，或永久居留权。</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>已在瑞典居住满符合条件的期限。自 2026 年 6 月 6 日起，成年人的主要规则为八年，部分群体期限较短。</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>满足更严格的行为要求。违法行为可能意味着在获准公民身份前有更长的等待期，Migrationsverket 会逐案决定。</li>
            <li>（自 2026 年起）通过 medborgarskapsprov——关于公民知识和瑞典语的公民身份考试——并满足瑞典语语言要求。</li>
          </ul>
          <h2>双重国籍</h2>
          <p>瑞典自 2001 年起接受双重国籍。成为瑞典人并不会让你失去原有国籍（须视你原籍国的规定而定）。</p>
          ${ebookFactBox('zh-Hans', '当前公民身份须知', '新的公民身份规则自 2026 年 6 月 6 日起适用。首场公民知识考试定于 2026 年 8 月 15 日在斯德哥尔摩举行。自 2026 年 6 月 6 日起子女需要单独的公民身份申请 · 成年人主要居留规则：8 年 · 更严格的行为要求，违法后等待期更长 · 裁定机关：Migrationsverket。', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        'zh-Hant': `<h2>誰是誰</h2>
          <ul>
            <li><b>Migrationsverket</b> —— 移民局。負責裁定居留許可、庇護、家庭團聚、工作許可以及公民身分。</li>
            <li><b>Skatteverket</b> —— 一旦你擁有居留許可並被登記為在瑞典居住，它就會給你 personnummer（個人編號）。</li>
            <li><b>Polisen</b> —— 負責護照和部分身分證件事務。</li>
          </ul>
          <h2>取得永久居留的途徑</h2>
          <p>你可以以下列身分來到瑞典：勞動者（持有高於最低工資的工作錄用通知）、學生、研究人員、某位居民的家庭成員、行使自由遷徙權的歐盟公民，或尋求庇護者。在經過一段時間的合法居留——通常為四到五年——之後，你可以申請永久居留（<em>permanent uppehållstillstånd</em>），或者，對歐盟公民而言，申請永久居留權。</p>
          <h2>成為瑞典人</h2>
          <p>若要透過入籍申請瑞典公民身分，你通常需要：</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>就成年人的申請而言，年滿 18 周歲。自 2026 年 6 月 6 日起，子女不能再被列入父母一方的公民身分申請之中；子女需要一份由監護人簽署的單獨申請。</li>
            <li>持有永久居留許可、居留權，或永久居留權。</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>已在瑞典居住滿符合條件的期限。自 2026 年 6 月 6 日起，成年人的主要規則為八年，部分群體期限較短。</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>滿足更嚴格的行為要求。違法行為可能意味著在獲准公民身分前有更長的等待期，Migrationsverket 會逐案決定。</li>
            <li>（自 2026 年起）通過 medborgarskapsprov——關於公民知識和瑞典語的公民身分考試——並滿足瑞典語語言要求。</li>
          </ul>
          <h2>雙重國籍</h2>
          <p>瑞典自 2001 年起接受雙重國籍。成為瑞典人並不會讓你失去原有國籍（須視你原籍國的規定而定）。</p>
          ${ebookFactBox('zh-Hant', '當前公民身分須知', '新的公民身分規則自 2026 年 6 月 6 日起適用。首場公民知識考試定於 2026 年 8 月 15 日在斯德哥爾摩舉行。自 2026 年 6 月 6 日起子女需要單獨的公民身分申請 · 成年人主要居留規則：8 年 · 更嚴格的行為要求，違法後等待期更長 · 裁定機關：Migrationsverket。', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        ar: `<h2>مَن هو مَن</h2>
          <ul>
            <li><b>Migrationsverket</b> — وكالة الهجرة. تبتّ في تصاريح الإقامة واللجوء ولمّ شمل العائلة وتصاريح العمل والجنسية.</li>
            <li><b>Skatteverket</b> — تمنحك personnummer الخاص بك بمجرد حصولك على تصريح إقامة وتسجيلك كمقيم في السويد.</li>
            <li><b>Polisen</b> — تتولّى جوازات السفر وبعض شؤون الهوية.</li>
          </ul>
          <h2>مسارات الإقامة الدائمة</h2>
          <p>يمكنك القدوم إلى السويد بصفتك: عاملًا (بعرض عمل يتجاوز حدًّا أدنى للأجر)، أو طالبًا، أو باحثًا، أو فردًا من عائلة مقيم، أو مواطنًا من الاتحاد الأوروبي يمارس حرية التنقّل، أو طالب لجوء. بعد فترة من الإقامة القانونية — عادةً من أربع إلى خمس سنوات — يمكنك التقدّم للحصول على الإقامة الدائمة (<em>permanent uppehållstillstånd</em>)، أو حقّ الإقامة الدائمة لمواطني الاتحاد الأوروبي.</p>
          <h2>أن تصبح سويديًا</h2>
          <p>للتقدّم بطلب الجنسية السويدية عبر التجنّس، تحتاج عمومًا إلى أن:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>بالنسبة لطلب البالغ، أن تكون قد بلغت 18 عامًا على الأقل. اعتبارًا من 6 يونيو 2026، لم يَعُد بالإمكان إدراج الأطفال في طلب جنسية أحد الوالدين؛ يحتاج الطفل إلى طلب منفصل يوقّعه وليّ أمر.</li>
            <li>أن يكون لديك تصريح إقامة دائمة أو حقّ إقامة أو حقّ إقامة دائمة.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>أن تكون قد عشت في السويد مدةً مؤهِّلة. اعتبارًا من 6 يونيو 2026، القاعدة الرئيسية للبالغين هي ثماني سنوات، مع مدد أقصر لبعض الفئات.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>أن تستوفي شرط السلوك الأكثر صرامة. قد تعني المخالفات فترة انتظار أطول قبل منح الجنسية، وتبتّ Migrationsverket في كل حالة على حدة.</li>
            <li>(اعتبارًا من 2026) أن تجتاز medborgarskapsprov — اختبار الجنسية في المعرفة المدنية واللغة السويدية — وأن تستوفي شرط اللغة السويدية.</li>
          </ul>
          <h2>ازدواج الجنسية</h2>
          <p>تقبل السويد ازدواج الجنسية منذ 2001. لا تفقد جنسيتك الأصلية بصيرورتك سويديًا (رهنًا بقواعد بلدك الأصلي).</p>
          ${ebookFactBox('ar', 'ملاحظات الجنسية الحالية', 'تُطبَّق قواعد الجنسية الجديدة اعتبارًا من 6 يونيو 2026. ستُعقَد أول جلسة للمعرفة المدنية في 15 أغسطس 2026 في ستوكهولم. يحتاج الأطفال إلى طلب جنسية منفصل اعتبارًا من 6 يونيو 2026 · قاعدة الإقامة الرئيسية للبالغين: 8 سنوات · شرط سلوك أكثر صرامة وفترات انتظار أطول بعد المخالفات · الجهة صاحبة القرار: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        ckb: `<h2>کێ کێیە</h2>
          <ul>
            <li><b>Migrationsverket</b> — ئاژانسی کۆچ. بڕیار لەسەر مۆڵەتی نیشتەجێبوون، پەنابەری، یەکگرتنەوەی خێزان، مۆڵەتی کار، و هاووڵاتیبوون دەدات.</li>
            <li><b>Skatteverket</b> — کاتێک مۆڵەتی نیشتەجێبوونت هەبوو و وەک نیشتەجێ لە سوید تۆمار کرایت، personnummerەکەت پێدەدات.</li>
            <li><b>Polisen</b> — پاسپۆرت و هەندێک کاری ناسنامە بەڕێوەدەبات.</li>
          </ul>
          <h2>ڕێگاکانی نیشتەجێبوونی هەمیشەیی</h2>
          <p>دەتوانیت بەم شێوانە بێیتە سوید: وەک کرێکار (بە پێشنیاری کارێک سەروو کەمترین موچە)، خوێندکار، توێژەر، ئەندامی خێزانی کەسێکی نیشتەجێ، هاووڵاتییەکی یەکێتیی ئەورووپا کە ئازادیی جووڵە بەکاردەهێنێت، یان داواکاری پەنابەری. دوای ماوەیەک نیشتەجێبوونی یاسایی — بە شێوەی ئاسایی چوار بۆ پێنج ساڵ — دەتوانیت داوای نیشتەجێبوونی هەمیشەیی بکەیت (<em>permanent uppehållstillstånd</em>)، یان بۆ هاووڵاتیانی یەکێتیی ئەورووپا، مافی نیشتەجێبوونی هەمیشەیی.</p>
          <h2>بوون بە سویدی</h2>
          <p>بۆ داواکردنی هاووڵاتیبوونی سویدی لە ڕێگەی شارستانیبوونەوە، بە گشتی پێویستە:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>بۆ داواکارییەکی گەورەسالان، دەبێت لانیکەم تەمەنت 18 ساڵ بێت. لە 6ی حوزەیرانی 2026ەوە، منداڵان ناتوانن چیتر لە داواکاریی هاووڵاتیبوونی دایک یان باوکدا بخرێنە ناو؛ منداڵ پێویستی بە داواکارییەکی جیاوازە کە سەرپەرشتیارێک واژووی دەکات.</li>
            <li>مۆڵەتی نیشتەجێبوونی هەمیشەیی، مافی نیشتەجێبوون، یان مافی نیشتەجێبوونی هەمیشەییت هەبێت.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>بۆ ماوەیەکی شیاو لە سوید ژیابیت. لە 6ی حوزەیرانی 2026ەوە، یاسای سەرەکی بۆ گەورەسالان هەشت ساڵە، و بۆ هەندێک گرووپ ماوەکان کورتترن.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>مەرجی ڕەفتاری توندتر جێبەجێ بکەیت. تاوانەکان دەتوانن پێویستی بە ماوەی چاوەڕوانیی درێژتر بکەن پێش ئەوەی هاووڵاتیبوون بدرێت، و Migrationsverket بڕیار لەسەر هەر دۆسیەیەک دەدات.</li>
            <li>(لە 2026ەوە) لە medborgarskapsprovدا سەرکەوتوو بیت — تاقیکردنەوەی هاووڵاتیبوون لەسەر زانیاریی شارستانی و زمانی سویدی — و مەرجی زمانی سویدی جێبەجێ بکەیت.</li>
          </ul>
          <h2>هاووڵاتیبوونی دووانە</h2>
          <p>سوید لە 2001ەوە هاووڵاتیبوونی دووانەی پەسەند کردووە. بە سویدیبوون هاووڵاتیبوونی ڕەسەنی خۆت لەدەست نادەیت (بەپێی یاساکانی وڵاتی ڕەسەنت).</p>
          ${ebookFactBox('ckb', 'تێبینییەکانی هاووڵاتیبوونی ئێستا', 'یاسا نوێیەکانی هاووڵاتیبوون لە 6ی حوزەیرانی 2026ەوە جێبەجێ دەکرێن. یەکەم دانیشتنی زانیاریی شارستانی لە 15ی ئابی 2026 لە ستۆکهۆڵم دەبێت. منداڵان لە 6ی حوزەیرانی 2026ەوە پێویستیان بە داواکارییەکی هاووڵاتیبوونی جیاوازە · یاسای سەرەکی نیشتەجێبوونی گەورەسالان: 8 ساڵ · مەرجی ڕەفتاری توندتر و چاوەڕوانیی درێژتر دوای تاوانەکان · دەسەڵاتی بڕیاردان: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        fa: `<h2>چه کسی چه کسی است</h2>
          <ul>
            <li><b>Migrationsverket</b> — ادارهٔ مهاجرت. دربارهٔ مجوزهای اقامت، پناهندگی، پیوستن خانواده، مجوزهای کار و شهروندی تصمیم می‌گیرد.</li>
            <li><b>Skatteverket</b> — به‌محض اینکه مجوز اقامت داشته باشید و به‌عنوان مقیم سوئد ثبت شوید، personnummer شما را می‌دهد.</li>
            <li><b>Polisen</b> — گذرنامه‌ها و برخی امور هویتی را انجام می‌دهد.</li>
          </ul>
          <h2>مسیرهای اقامت دائم</h2>
          <p>می‌توانید به‌عنوان یکی از این‌ها به سوئد بیایید: کارگر (با پیشنهاد شغلی بالاتر از حداقل دستمزد)، دانشجو، پژوهشگر، عضو خانوادهٔ یک مقیم، شهروند اتحادیهٔ اروپا که از آزادی جابه‌جایی استفاده می‌کند، یا پناه‌جو. پس از مدتی اقامت قانونی — معمولاً چهار تا پنج سال — می‌توانید برای اقامت دائم (<em>permanent uppehållstillstånd</em>) یا، برای شهروندان اتحادیهٔ اروپا، حق اقامت دائم درخواست دهید.</p>
          <h2>سوئدی شدن</h2>
          <p>برای درخواست شهروندی سوئد از طریق تابعیت‌پذیری، عموماً باید:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>برای درخواست بزرگ‌سال، دست‌کم 18 سال داشته باشید. از 6 ژوئن 2026، دیگر نمی‌توان فرزندان را در درخواست شهروندی یکی از والدین گنجاند؛ فرزند به یک درخواست جداگانه نیاز دارد که سرپرستی آن را امضا کند.</li>
            <li>مجوز اقامت دائم، حق اقامت یا حق اقامت دائم داشته باشید.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>برای یک دورهٔ واجد شرایط در سوئد زندگی کرده باشید. از 6 ژوئن 2026، قاعدهٔ اصلی برای بزرگ‌سالان هشت سال است؛ برای برخی گروه‌ها دوره‌های کوتاه‌تری وجود دارد.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>شرط سخت‌گیرانه‌تر مربوط به رفتار را برآورده کنید. تخلف‌ها می‌توانند به معنای دورهٔ انتظار طولانی‌تر پیش از اعطای شهروندی باشند و Migrationsverket دربارهٔ هر پرونده تصمیم می‌گیرد.</li>
            <li>(از 2026) در medborgarskapsprov — آزمون شهروندی در زمینهٔ دانش مدنی و زبان سوئدی — قبول شوید و شرط زبان سوئدی را برآورده کنید.</li>
          </ul>
          <h2>شهروندی دوگانه</h2>
          <p>سوئد از 2001 شهروندی دوگانه را پذیرفته است. با سوئدی شدن، شهروندی اصلی خود را از دست نمی‌دهید (مشروط به قواعد کشور مبدأ شما).</p>
          ${ebookFactBox('fa', 'نکات شهروندی فعلی', 'قواعد جدید شهروندی از 6 ژوئن 2026 اعمال می‌شود. نخستین جلسهٔ دانش مدنی در 15 اوت 2026 در استکهلم برگزار می‌شود. فرزندان از 6 ژوئن 2026 به یک درخواست شهروندی جداگانه نیاز دارند · قاعدهٔ اصلی اقامت بزرگ‌سالان: 8 سال · شرط رفتار سخت‌گیرانه‌تر و دوره‌های انتظار طولانی‌تر پس از تخلف · مرجع تصمیم‌گیری: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        pl: `<h2>Kto jest kim</h2>
          <ul>
            <li><b>Migrationsverket</b> — Urząd ds. Migracji. Decyduje o pozwoleniach na pobyt, azylu, łączeniu rodzin, pozwoleniach na pracę i obywatelstwie.</li>
            <li><b>Skatteverket</b> — nadaje ci personnummer, gdy masz już pozwolenie na pobyt i jesteś zarejestrowany jako mieszkaniec Szwecji.</li>
            <li><b>Polisen</b> — zajmuje się paszportami i niektórymi sprawami związanymi z dowodami tożsamości.</li>
          </ul>
          <h2>Drogi do stałego pobytu</h2>
          <p>Do Szwecji możesz przyjechać jako: pracownik (z ofertą pracy powyżej minimalnego wynagrodzenia), student, naukowiec, członek rodziny osoby tu mieszkającej, obywatel UE korzystający ze swobody przemieszczania się lub osoba ubiegająca się o azyl. Po okresie legalnego pobytu — zwykle od czterech do pięciu lat — możesz ubiegać się o stały pobyt (<em>permanent uppehållstillstånd</em>) lub, w przypadku obywateli UE, o prawo stałego pobytu.</p>
          <h2>Stawanie się Szwedem</h2>
          <p>Aby ubiegać się o szwedzkie obywatelstwo w drodze naturalizacji, na ogół musisz:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>W przypadku wniosku osoby dorosłej mieć co najmniej 18 lat. Od 6 czerwca 2026 dzieci nie mogą już być uwzględniane we wniosku o obywatelstwo rodzica; dziecko potrzebuje osobnego wniosku podpisanego przez opiekuna.</li>
            <li>Mieć pozwolenie na pobyt stały, prawo pobytu lub prawo stałego pobytu.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Mieszkać w Szwecji przez wymagany okres. Od 6 czerwca 2026 główna zasada dla dorosłych to osiem lat, z krótszymi okresami dla niektórych grup.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Spełnić surowszy wymóg dotyczący prowadzenia się. Przestępstwa mogą oznaczać dłuższy okres oczekiwania przed przyznaniem obywatelstwa, a Migrationsverket rozstrzyga indywidualne sprawy.</li>
            <li>(Od 2026) Zdać medborgarskapsprov — test na obywatelstwo z wiedzy obywatelskiej i języka szwedzkiego — oraz spełnić wymóg dotyczący języka szwedzkiego.</li>
          </ul>
          <h2>Podwójne obywatelstwo</h2>
          <p>Szwecja akceptuje podwójne obywatelstwo od 2001 roku. Stając się Szwedem, nie tracisz swojego pierwotnego obywatelstwa (z zastrzeżeniem przepisów twojego kraju pochodzenia).</p>
          ${ebookFactBox('pl', 'Bieżące informacje o obywatelstwie', 'Nowe przepisy o obywatelstwie obowiązują od 6 czerwca 2026. Pierwsza sesja z wiedzy obywatelskiej odbędzie się 15 sierpnia 2026 w Sztokholmie. Od 6 czerwca 2026 dzieci potrzebują osobnego wniosku o obywatelstwo · Główna zasada pobytu dorosłych: 8 lat · Surowszy wymóg prowadzenia się i dłuższe okresy oczekiwania po przestępstwach · Organ decyzyjny: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        so: `<h2>Yaa yaa ah</h2>
          <ul>
            <li><b>Migrationsverket</b> — Hay'adda Socdaalka. Waxay go'aamisaa ruqsadaha deganaanshaha, magangelyada, dib-u-midaynta qoyska, ruqsadaha shaqada, iyo muwaadinimada.</li>
            <li><b>Skatteverket</b> — waxay ku siisaa personnummer-kaaga marka aad hesho ruqsad deganaansho oo aad ku diiwaangashan tahay inaad Iswiidhan ku nooshahay.</li>
            <li><b>Polisen</b> — waxay maamushaa baasaboorrada iyo qaar ka mid ah arrimaha aqoonsiga.</li>
          </ul>
          <h2>Jidadka loo maro deganaansho joogto ah</h2>
          <p>Waxaad Iswiidhan u iman kartaa: shaqaale (oo leh dalab shaqo ka sarreeya mushahar ugu yar), arday, cilmi-baare, xubin qoys oo ka tirsan qof deggan, muwaadin Midowga Yurub oo isticmaalaya xorriyadda guurguurka, ama qof magangelyo doon ah. Ka dib muddo deganaansho sharci ah — caadi ahaan afar ilaa shan sano — waxaad codsan kartaa deganaansho joogto ah (<em>permanent uppehållstillstånd</em>) ama, muwaadiniinta Midowga Yurub, xaqa deganaanshaha joogtada ah.</p>
          <h2>Inaad noqoto Iswiidhan</h2>
          <p>Si aad u codsato muwaadinimada Iswiidhan iyada oo loo marayo dhalashada-bixinta, guud ahaan waxaad u baahan tahay inaad:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>Codsiga qof weyn, ugu yaraan 18 sano jir tahay. Laga bilaabo 6 Juun 2026, carruurta lama dari karo codsiga muwaadinimada waalidkood; ilmuhu wuxuu u baahan yahay codsi gooni ah oo uu saxiixo masuul.</li>
            <li>Haysato ruqsad deganaansho joogto ah, xaq deganaansho, ama xaq deganaansho joogto ah.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Iswiidhan ku noolaan jirtay muddo u qalanta. Laga bilaabo 6 Juun 2026, xeerka guud ee dadka waaweyn waa siddeed sano; kooxo qaar waxay leeyihiin muddooyin ka gaaban.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Buuxiso shuruudda dhaqanka oo la adkeeyay. Dembiyadu waxay keeni karaan muddo sugitaan oo dheer ka hor inta muwaadinimo la siin, Migrationsverket-na wuxuu go'aamiyaa kiis kasta.</li>
            <li>(Laga bilaabo 2026) Inaad gudubto medborgarskapsprov — imtixaanka muwaadinimada ee aqoonta bulshada iyo Iswiidhishka — oo aad buuxiso shuruudda luqadda Iswiidhishka.</li>
          </ul>
          <h2>Labanlaab muwaadinimo</h2>
          <p>Iswiidhan waxay aqbashay labanlaab muwaadinimo tan iyo 2001. Ma lumiso muwaadinimadaada asalka ah markaad noqoto Iswiidhan (iyada oo ku xiran xeerarka dalkaaga asalka).</p>
          ${ebookFactBox('so', 'Qoraallada muwaadinimada hadda', "Xeerarka cusub ee muwaadinimadu waxay khusayaan laga bilaabo 6 Juun 2026. Fadhiga ugu horreeya ee aqoonta bulshada wuxuu dhici doonaa 15 Ogosto 2026 ee Stockholm. Carruurtu waxay u baahan yihiin codsi muwaadinimo oo gooni ah laga bilaabo 6 Juun 2026 · Xeerka guud ee deganaanshaha dadka waaweyn: 8 sano · Shuruud dhaqan oo la adkeeyay iyo sugitaan dheer ka dib dembiyo · Maamulka go'aaminta: Migrationsverket.", ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        ti: `<h2>መን መን ምዃኑ</h2>
          <ul>
            <li><b>Migrationsverket</b> — ኤጀንሲ ስደት። ብዛዕባ ፍቓዳት መንበሪ፣ ዕቝባ፣ ምትእኽኻብ ስድራቤት፣ ፍቓዳት ስራሕን ዜግነትን ይውስን።</li>
            <li><b>Skatteverket</b> — ፍቓድ መንበሪ ምስ ኣጥረኻን ኣብ ሽወደን ትነብር ኢልካ ምስ ተመዝገብካን personnummerካ ይህበካ።</li>
            <li><b>Polisen</b> — ፓስፖርትን ገለ ጉዳያት መንነትን የማሕድር።</li>
          </ul>
          <h2>መንገድታት ናብ ቀዋሚ መንበሪ</h2>
          <p>ናብ ሽወደን ከምዚ ኢልካ ክትመጽእ ትኽእል፦ ሰራሕተኛ (ካብ ዝተሓተ ደሞዝ ንላዕሊ ናይ ስራሕ መጸዋዕታ ዘለዎ)፣ ተማሃራይ፣ ተመራማሪ፣ ኣባል ስድራቤት ሓደ ነባሪ፣ ናጻ ምንቅስቓስ ዝጥቀም ዜጋ ኤውሮጳዊ ሕብረት፣ ወይ ሓታቲ ዕቝባ። ድሕሪ ሓደ ግዜ ሕጋዊ መንበሪ — ብልሙድ ካብ ኣርባዕተ ክሳብ ሓሙሽተ ዓመት — ቀዋሚ መንበሪ (<em>permanent uppehållstillstånd</em>) ወይ ንዜጋታት ኤውሮጳዊ ሕብረት፣ መሰል ቀዋሚ መንበሪ ክትሓትት ትኽእል።</p>
          <h2>ሽወደናዊ ምዃን</h2>
          <p>ብመስርሕ ዜግነት ሽወደን ንምሕታት፣ ብሓፈሻ ከምዚ ክትገብር የድልየካ፦</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>ንሕቶ ዓቢ ሰብ፣ እንተ ወሓደ 18 ዓመት ክትከውን። ካብ 6 ሰነ 2026 ጀሚሩ፣ ቆልዑ ኣብ ሕቶ ዜግነት ሓደ ወላዲ ክካተቱ ኣይክእሉን፤ ቆልዓ ሓደ ኣላዪ ዝፍርሞ ናይ በይኑ ሕቶ የድልዮ።</li>
            <li>ቀዋሚ ፍቓድ መንበሪ፣ መሰል መንበሪ፣ ወይ መሰል ቀዋሚ መንበሪ ክህልወካ።</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>ኣብ ሽወደን ንዘፍቅድ ግዜ ነቢርካ ክትከውን። ካብ 6 ሰነ 2026 ጀሚሩ፣ ንዓበይቲ ሰባት ዋና ሕጊ ሸሞንተ ዓመት እዩ፤ ንገለ ጉጅለታት ግዜታት ይሓጽር።</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>እቲ ዝተጠናኸረ ናይ ጠባይ ረቛሒ ከተማልእ። ገበናት ቅድሚ ዜግነት ምሃብ ዝነውሐ ግዜ ምጽባይ ከም ዘድሊ ክገብሩ ይኽእሉ፣ Migrationsverket ድማ ነፍሲ ወከፍ ጉዳይ ይውስን።</li>
            <li>(ካብ 2026 ጀሚሩ) medborgarskapsprov ክትሓልፍ — እቲ ናይ ዜግነት ፈተና ኣብ ሲቪካዊ ፍልጠትን ሽወደንኛን — ከምኡ’ውን ናይ ሽወደንኛ ቋንቋ ረቛሒ ከተማልእ።</li>
          </ul>
          <h2>ድርብ ዜግነት</h2>
          <p>ሽወደን ካብ 2001 ጀሚራ ድርብ ዜግነት ተቐቢላ። ሽወደናዊ ብምዃንካ ናይ መበቆልካ ዜግነት ኣይተጥፍእን (ብመሰረት ሕግታት ሃገር መበቆልካ)።</p>
          ${ebookFactBox('ti', 'ናይ ሕጂ ሓበሬታ ዜግነት', 'ሓደስቲ ሕግታት ዜግነት ካብ 6 ሰነ 2026 ጀሚሮም ይሰርሑ። እቲ ቀዳማይ ናይ ሲቪካዊ ፍልጠት ፈተና ኣብ 15 ነሓሰ 2026 ኣብ ስቶክሆልም ይካየድ። ቆልዑ ካብ 6 ሰነ 2026 ጀሚሮም ናይ በይኖም ሕቶ ዜግነት የድልዮም · ዋና ሕጊ መንበሪ ዓበይቲ፦ 8 ዓመት · ዝተጠናኸረ ናይ ጠባይ ረቛሒን ድሕሪ ገበናት ዝነውሐ ምጽባይን · ወሳኒ ኣካል፦ Migrationsverket።', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        tr: `<h2>Kim kimdir</h2>
          <ul>
            <li><b>Migrationsverket</b> — Göç Kurumu. Oturum izinleri, iltica, aile birleşimi, çalışma izinleri ve vatandaşlık konularında karar verir.</li>
            <li><b>Skatteverket</b> — bir oturum izniniz olup İsveç'te ikamet ettiğiniz kayıtlı olunca size personnummer'inizi verir.</li>
            <li><b>Polisen</b> — pasaportlar ve bazı kimlik işlerini yürütür.</li>
          </ul>
          <h2>Daimi oturuma giden yollar</h2>
          <p>İsveç'e şu sıfatlarla gelebilirsiniz: işçi (asgari ücretin üzerinde bir iş teklifiyle), öğrenci, araştırmacı, bir mukimin aile üyesi, serbest dolaşım hakkını kullanan bir AB vatandaşı veya sığınmacı. Yasal bir ikamet döneminden sonra — genellikle dört ila beş yıl — daimi oturum (<em>permanent uppehållstillstånd</em>) için veya AB vatandaşları için daimi ikamet hakkı için başvurabilirsiniz.</p>
          <h2>İsveçli olmak</h2>
          <p>Vatandaşlığa kabul yoluyla İsveç vatandaşlığına başvurmak için genellikle şunlar gerekir:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>Yetişkin başvurusu için en az 18 yaşında olmak. 6 Haziran 2026'dan itibaren çocuklar artık bir ebeveynin vatandaşlık başvurusuna dahil edilemez; bir çocuğun bir veli tarafından imzalanan ayrı bir başvuruya ihtiyacı vardır.</li>
            <li>Daimi oturum izni, ikamet hakkı veya daimi ikamet hakkına sahip olmak.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>İsveç'te uygun bir süre yaşamış olmak. 6 Haziran 2026'dan itibaren yetişkinler için ana kural sekiz yıldır; bazı gruplar için daha kısa süreler vardır.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Daha sıkı davranış şartını karşılamak. Suçlar, vatandaşlık verilmeden önce daha uzun bekleme süresi anlamına gelebilir ve Migrationsverket her dosyayı ayrı değerlendirir.</li>
            <li>(2026'dan itibaren) medborgarskapsprov'u — yurttaşlık bilgisi ve İsveççe üzerine vatandaşlık sınavını — geçmek ve İsveççe dil şartını karşılamak.</li>
          </ul>
          <h2>Çifte vatandaşlık</h2>
          <p>İsveç, 2001'den beri çifte vatandaşlığı kabul ediyor. İsveçli olmakla asıl vatandaşlığınızı kaybetmezsiniz (köken ülkenizin kurallarına tabi olarak).</p>
          ${ebookFactBox('tr', 'Güncel vatandaşlık notları', "Yeni vatandaşlık kuralları 6 Haziran 2026'dan itibaren geçerlidir. İlk yurttaşlık bilgisi oturumu 15 Ağustos 2026'da Stockholm'de yapılacak. Çocuklar 6 Haziran 2026'dan itibaren ayrı bir vatandaşlık başvurusuna ihtiyaç duyar · Yetişkinler için ana ikamet kuralı: 8 yıl · Daha sıkı davranış şartı ve suçlardan sonra daha uzun bekleme süreleri · Karar makamı: Migrationsverket.", ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
        `,
        uk: `<h2>Хто є хто</h2>
          <ul>
            <li><b>Migrationsverket</b> — Міграційне агентство. Вирішує питання дозволів на проживання, притулку, возз'єднання сім'ї, дозволів на роботу та громадянства.</li>
            <li><b>Skatteverket</b> — видає вам personnummer, щойно ви маєте дозвіл на проживання та зареєстровані як такий, що мешкає у Швеції.</li>
            <li><b>Polisen</b> — займається паспортами та деякими питаннями посвідчень особи.</li>
          </ul>
          <h2>Шляхи до постійного проживання</h2>
          <p>Ви можете приїхати до Швеції як: працівник (з пропозицією роботи понад мінімальну зарплату), студент, дослідник, член сім'ї мешканця, громадянин ЄС, що користується свободою пересування, або шукач притулку. Після періоду законного проживання — зазвичай від чотирьох до п'яти років — ви можете подати заяву на постійне проживання (<em>permanent uppehållstillstånd</em>) або, для громадян ЄС, на право постійного проживання.</p>
          <h2>Стати шведом</h2>
          <p>Щоб подати заяву на шведське громадянство шляхом натуралізації, вам зазвичай потрібно:</p>
          <ul>
            <li${ebookSourceKeyDataAttr(['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}>Для заяви дорослої особи бути щонайменше 18 років. Від 6 червня 2026 року дітей більше не можна включати до заяви на громадянство одного з батьків; дитині потрібна окрема заява, підписана опікуном.</li>
            <li>Мати дозвіл на постійне проживання, право проживання або право постійного проживання.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Прожити у Швеції кваліфікаційний період. Від 6 червня 2026 року головне правило для дорослих становить вісім років; для деяких груп діють коротші строки.</li>
            <li${ebookSourceKeyDataAttr(['migrationsverketCitizenshipRules'])}>Відповідати суворішій вимозі щодо поведінки. Правопорушення можуть означати довший період очікування перед наданням громадянства, а Migrationsverket вирішує кожну справу окремо.</li>
            <li>(Від 2026) Скласти medborgarskapsprov — тест на громадянство з громадянознавства та шведської мови — і відповідати вимозі щодо шведської мови.</li>
          </ul>
          <h2>Подвійне громадянство</h2>
          <p>Швеція приймає подвійне громадянство з 2001 року. Ставши шведом, ви не втрачаєте свого початкового громадянства (за умови дотримання правил вашої країни походження).</p>
          ${ebookFactBox('uk', 'Поточні нотатки про громадянство', 'Нові правила громадянства діють від 6 червня 2026 року. Перша сесія з громадянознавства відбудеться 15 серпня 2026 року у Стокгольмі. Дітям від 6 червня 2026 року потрібна окрема заява на громадянство · Головне правило проживання для дорослих: 8 років · Суворіша вимога щодо поведінки й довші строки очікування після правопорушень · Орган, що ухвалює рішення: Migrationsverket.', ['uhrStudyMaterial', 'migrationsverketCitizenshipRules'])}
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
      title: {
        en: 'Mock exam',
        sv: 'Övningsprov',
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
        en: 'and current test status.',
        sv: 'och aktuell provstatus.',
        'zh-Hans': '与当前的考试状态。',
        'zh-Hant': '與當前的考試狀態。',
        ar: 'وحالة الاختبار الراهنة.',
        ckb: 'و دۆخی ئێستای تاقیکردنەوە.',
        fa: 'و وضعیت کنونی آزمون.',
        pl: 'i bieżący status egzaminu.',
        so: 'iyo xaaladda imtixaanka ee hadda.',
        ti: 'ከምኡ’ውን ህሉው ኩነታት ፈተና።',
        tr: 've güncel sınav durumu.',
        uk: 'та поточний статус іспиту.',
      },
      lede: {
        en: 'Use the mock exam for practice, but keep the practical test details tied to UHR and Migrationsverket.',
        sv: 'Använd övningsprovet för övning, men håll praktiska provdetaljer knutna till UHR och Migrationsverket.',
        'zh-Hans':
          '把模拟考试用于练习，但与考试实际安排有关的细节，请以 UHR 和 Migrationsverket（瑞典移民局）的信息为准。',
        'zh-Hant':
          '把模擬考試用於練習，但與考試實際安排有關的細節，請以 UHR 和 Migrationsverket（瑞典移民局）的資訊為準。',
        ar: 'استخدم الاختبار التجريبي للتدرّب، لكن اعتمد في تفاصيل الاختبار العملية على UHR وMigrationsverket.',
        ckb: 'تاقیکردنەوەی ئەزموونی بۆ مەشق بەکاربهێنە، بەڵام وردەکارییە کردارییەکانی تاقیکردنەوە بە UHR و Migrationsverket بەستراوە بهێڵەرەوە.',
        fa: 'از آزمون آزمایشی برای تمرین استفاده کنید، اما جزئیات عملی آزمون را وابسته به UHR و Migrationsverket نگه دارید.',
        pl: 'Użyj egzaminu próbnego do ćwiczeń, ale szczegóły praktyczne egzaminu trzymaj zgodne z UHR i Migrationsverket.',
        so: 'U isticmaal imtixaanka tijaabada ah tababar, laakiin faahfaahinta wax-ku-oolka ah ee imtixaanka ku xidh UHR iyo Migrationsverket.',
        ti: 'ነቲ ናይ ልምምድ ፈተና ንልምምድ ተጠቐመሉ፣ ግን ነቲ ግብራዊ ዝርዝራት ፈተና ምስ UHR ከምኡ’ውን Migrationsverket ኣተኣሳሲርካ ሓዞ።',
        tr: 'Deneme sınavını alıştırma için kullanın, ancak sınavın pratik ayrıntılarını UHR ve Migrationsverket ile bağlantılı tutun.',
        uk: 'Використовуйте пробний іспит для тренування, але практичні деталі іспиту звіряйте з UHR та Migrationsverket.',
      },
      body: {
        en: `
          <h2>Current official status</h2>
          <p>The first civic-knowledge sitting will be held on 15 August 2026 in Stockholm. A Migrationsverket letter is required: only people who receive a letter from Migrationsverket can sign up.</p>
          <p>Seats are limited. The August sitting is free of charge, and participants will have generous time.</p>
          <h2>Practical details pending from UHR</h2>
          <p>UHR has not yet published the exact time and place. Use this app for unofficial practice, and use UHR and Migrationsverket for instructions that affect your own case.</p>
          <h2>How to study now</h2>
          <ol>
            <li>Read this ebook end-to-end at least once. Use the Practice tab to drill what you forget.</li>
            <li>For every fact you get wrong twice, write it on a card and stick it on the fridge. Embarrassment is a great teacher.</li>
            <li>Skim the official <em>Sverige i fokus</em> PDF (free download from UHR) the week before the test. Don't try to memorise it.</li>
            <li>Use the mock exam here as a rehearsal for mixed-topic recall, then revisit the chapters where you missed points.</li>
          </ol>
          <div class="ebook__factbox"><h4>Current source notes</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>Sources accessed 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        sv: `
          <h2>Aktuell officiell status</h2>
          <p>Det första samhällskunskapsprovet inom medborgarskapsprovet hålls den 15 augusti 2026 i Stockholm. Anmälan kräver brev från Migrationsverket.</p>
          <p>Antalet platser är begränsat. Augustiprovet är kostnadsfritt, och deltagarna får generöst med tid.</p>
          <h2>Praktiska detaljer väntar hos UHR</h2>
          <p>UHR har ännu inte publicerat exakt tid och plats. Använd appen som inofficiell övning, och använd UHR och Migrationsverket för instruktioner som påverkar ditt eget ärende.</p>
          <h2>Plugga nu</h2>
          <ol>
            <li>Läs boken en gång från början till slut och öppna sedan Öva för det du glömmer.</li>
            <li>Skriv ner fakta du missar två gånger och repetera dem kort nästa dag.</li>
            <li>Använd UHR:s utbildningsmaterial som kontrollpunkt innan provet.</li>
            <li>Använd övningsprovet här för blandad repetition och gå tillbaka till kapitlen där du tappade poäng.</li>
          </ol>
          <div class="ebook__factbox"><h4>Aktuella källnoter</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>Källor hämtade 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        'zh-Hans': `
          <h2>当前的官方状态</h2>
          <p>第一次公民知识考试定于 2026 年 8 月 15 日在斯德哥尔摩举行。报名需要 Migrationsverket（瑞典移民局）的信函：只有收到 Migrationsverket 信函的人才能报名。</p>
          <p>名额有限。8 月这场考试免费，参加者将有充裕的时间。</p>
          <h2>实际细节仍待 UHR 公布</h2>
          <p>UHR 尚未公布确切的时间和地点。请把本应用用于非官方练习，而涉及你自身情况的具体指引，请以 UHR 和 Migrationsverket 为准。</p>
          <h2>现在如何学习</h2>
          <ol>
            <li>把这本电子书至少完整读一遍。用“练习”标签页反复操练你忘记的内容。</li>
            <li>每当一条事实你连续答错两次，就把它写在卡片上贴到冰箱上。难为情是个好老师。</li>
            <li>在考试前一周，快速浏览官方的 <em>Sverige i fokus</em> PDF（可从 UHR 免费下载）。不要试图把它背下来。</li>
            <li>把这里的模拟考试当作混合题型回忆的彩排，然后回到你失分的那些章节重新复习。</li>
          </ol>
          <div class="ebook__factbox"><h4>当前来源说明</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>来源访问于 2026-05-19：${officialTestSourceLinks()}</p></div>
        `,
        'zh-Hant': `
          <h2>當前的官方狀態</h2>
          <p>第一次公民知識考試定於 2026 年 8 月 15 日在斯德哥爾摩舉行。報名需要 Migrationsverket（瑞典移民局）的信函：只有收到 Migrationsverket 信函的人才能報名。</p>
          <p>名額有限。8 月這場考試免費，參加者將有充裕的時間。</p>
          <h2>實際細節仍待 UHR 公布</h2>
          <p>UHR 尚未公布確切的時間和地點。請把本應用用於非官方練習，而涉及你自身情況的具體指引，請以 UHR 和 Migrationsverket 為準。</p>
          <h2>現在如何學習</h2>
          <ol>
            <li>把這本電子書至少完整讀一遍。用「練習」標籤頁反覆操練你忘記的內容。</li>
            <li>每當一條事實你連續答錯兩次，就把它寫在卡片上貼到冰箱上。難為情是個好老師。</li>
            <li>在考試前一週，快速瀏覽官方的 <em>Sverige i fokus</em> PDF（可從 UHR 免費下載）。不要試圖把它背下來。</li>
            <li>把這裡的模擬考試當作混合題型回憶的彩排，然後回到你失分的那些章節重新複習。</li>
          </ol>
          <div class="ebook__factbox"><h4>當前來源說明</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>來源存取於 2026-05-19：${officialTestSourceLinks()}</p></div>
        `,
        ar: `
          <h2>الوضع الرسمي الراهن</h2>
          <p>ستُعقد أول جلسة لاختبار المعرفة المدنية في 15 أغسطس 2026 في ستوكهولم. ويُشترط وجود خطاب من Migrationsverket: لا يمكن التسجيل إلا لمن يتلقّى خطابًا من Migrationsverket.</p>
          <p>عدد المقاعد محدود. وجلسة أغسطس مجانية، وسيتوفّر للمشاركين وقت وافٍ.</p>
          <h2>تفاصيل عملية لم تنشرها UHR بعد</h2>
          <p>لم تنشر UHR بعد الزمان والمكان بالضبط. استخدم هذا التطبيق للتدرّب غير الرسمي، واستخدم UHR وMigrationsverket للإرشادات التي تخصّ حالتك أنت.</p>
          <h2>كيف تدرس الآن</h2>
          <ol>
            <li>اقرأ هذا الكتاب الإلكتروني من أوله إلى آخره مرة واحدة على الأقل. استخدم تبويب التدريب للتمرّن على ما تنساه.</li>
            <li>كل حقيقة تخطئ فيها مرتين، اكتبها على بطاقة وألصقها على الثلاجة. الإحراج معلّم بارع.</li>
            <li>تصفّح ملف <em>Sverige i fokus</em> الرسمي بصيغة PDF (تنزيل مجاني من UHR) في الأسبوع الذي يسبق الاختبار. لا تحاول حفظه عن ظهر قلب.</li>
            <li>استخدم الاختبار التجريبي هنا كبروفة لاستذكار مواضيع متنوّعة، ثم عد إلى الفصول التي خسرت فيها نقاطًا.</li>
          </ol>
          <div class="ebook__factbox"><h4>ملاحظات المصادر الحالية</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>المصادر تمّ الاطلاع عليها 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        ckb: `
          <h2>دۆخی فەرمیی ئێستا</h2>
          <p>یەکەم دانیشتنی تاقیکردنەوەی زانیاری شارستانی لە 15ی ئاگوستی 2026 لە ستۆکهۆڵم بەڕێوەدەچێت. نامەیەکی Migrationsverket پێویستە: تەنها ئەو کەسانە دەتوانن خۆیان تۆمار بکەن کە نامەیەک لە Migrationsverket وەردەگرن.</p>
          <p>ژمارەی شوێنەکان سنووردارە. دانیشتنی ئاگوست بێبەرامبەرە، و بەشداربووان کاتێکی بەفراوانیان دەبێت.</p>
          <h2>وردەکارییە کردارییەکان چاوەڕێی UHRن</h2>
          <p>UHR هێشتا کات و شوێنی ورد بڵاو نەکردووەتەوە. ئەم ئەپە بۆ مەشقی نافەرمی بەکاربهێنە، و بۆ ئەو ڕێنماییانەی کە کاریگەری لەسەر کەیسی خۆت دەکەن UHR و Migrationsverket بەکاربهێنە.</p>
          <h2>چۆن ئێستا بخوێنیت</h2>
          <ol>
            <li>ئەم کتێبە ئەلیکترۆنییە بەلایەنی کەمەوە جارێک لە سەرەتاوە بۆ کۆتایی بخوێنەوە. بۆ مەشقکردن لەسەر ئەوەی لەبیری دەکەیت خشتەی مەشق بەکاربهێنە.</li>
            <li>هەر ڕاستییەک دوو جار هەڵە وەڵامی دەدەیتەوە، لەسەر کارتێک بینووسە و لە سەلاجەکە بیلکێنە. شەرمیاری مامۆستایەکی باشە.</li>
            <li>هەفتەی پێش تاقیکردنەوەکە بە خێرایی PDFی فەرمیی <em>Sverige i fokus</em> (داگرتنی بێبەرامبەر لە UHR) بخوێنەوە. هەوڵ مەدە لەبەری بکەیت.</li>
            <li>تاقیکردنەوەی ئەزموونیی ئێرە وەک ڕاهێنانێک بۆ بیرهێنانەوەی بابەتی تێکەڵ بەکاربهێنە، پاشان بگەڕێرەوە بۆ ئەو بەشانەی کە خاڵت تێدا لەدەستدا.</li>
          </ol>
          <div class="ebook__factbox"><h4>تێبینییەکانی سەرچاوەی ئێستا</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>سەرچاوەکان سەردانیان کراوە 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        fa: `
          <h2>وضعیت رسمی کنونی</h2>
          <p>نخستین جلسهٔ آزمون دانش مدنی در 15 اوت 2026 در استکهلم برگزار می‌شود. داشتن نامه‌ای از Migrationsverket لازم است: فقط کسانی می‌توانند ثبت‌نام کنند که از Migrationsverket نامه دریافت کنند.</p>
          <p>تعداد صندلی‌ها محدود است. جلسهٔ اوت رایگان است و شرکت‌کنندگان زمان کافی خواهند داشت.</p>
          <h2>جزئیات عملی که هنوز از سوی UHR منتشر نشده</h2>
          <p>UHR هنوز زمان و مکان دقیق را منتشر نکرده است. از این برنامه برای تمرین غیررسمی استفاده کنید، و برای دستورالعمل‌هایی که بر پروندهٔ خودتان اثر می‌گذارد به UHR و Migrationsverket مراجعه کنید.</p>
          <h2>اکنون چگونه مطالعه کنید</h2>
          <ol>
            <li>این کتاب الکترونیکی را دست‌کم یک بار از ابتدا تا انتها بخوانید. برای تمرین آنچه فراموش می‌کنید از زبانهٔ تمرین استفاده کنید.</li>
            <li>هر واقعیتی را که دو بار اشتباه پاسخ دادید، روی یک کارت بنویسید و به یخچال بچسبانید. خجالت معلم خوبی است.</li>
            <li>هفتهٔ پیش از آزمون، فایل PDF رسمی <em>Sverige i fokus</em> (دانلود رایگان از UHR) را مرور کنید. سعی نکنید آن را حفظ کنید.</li>
            <li>از آزمون آزمایشی اینجا به‌عنوان تمرینی برای یادآوری موضوعات درهم استفاده کنید، سپس به فصل‌هایی که در آن‌ها امتیاز از دست داده‌اید بازگردید.</li>
          </ol>
          <div class="ebook__factbox"><h4>یادداشت‌های منابع کنونی</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>منابع در 2026-05-19 بازدید شده‌اند: ${officialTestSourceLinks()}</p></div>
        `,
        pl: `
          <h2>Aktualny status oficjalny</h2>
          <p>Pierwsza sesja egzaminu z wiedzy obywatelskiej odbędzie się 15 sierpnia 2026 roku w Sztokholmie. Wymagane jest pismo z Migrationsverket: zapisać się mogą tylko osoby, które otrzymają pismo z Migrationsverket.</p>
          <p>Liczba miejsc jest ograniczona. Sesja sierpniowa jest bezpłatna, a uczestnicy będą mieli dużo czasu.</p>
          <h2>Szczegóły praktyczne — wciąż oczekiwane od UHR</h2>
          <p>UHR nie opublikował jeszcze dokładnego czasu i miejsca. Korzystaj z tej aplikacji do nieoficjalnych ćwiczeń, a w sprawie wskazówek dotyczących Twojej własnej sytuacji zwracaj się do UHR i Migrationsverket.</p>
          <h2>Jak uczyć się teraz</h2>
          <ol>
            <li>Przeczytaj tego e-booka przynajmniej raz od początku do końca. Korzystaj z zakładki Ćwiczenie, by przerabiać to, co zapominasz.</li>
            <li>Każdy fakt, który pomylisz dwa razy, zapisz na kartce i przyklej na lodówce. Zażenowanie to świetny nauczyciel.</li>
            <li>W tygodniu przed egzaminem przejrzyj oficjalny plik PDF <em>Sverige i fokus</em> (bezpłatne pobranie z UHR). Nie próbuj uczyć się go na pamięć.</li>
            <li>Egzamin próbny tutaj potraktuj jako próbę przypominania mieszanych tematów, a potem wróć do rozdziałów, w których straciłeś punkty.</li>
          </ol>
          <div class="ebook__factbox"><h4>Bieżące uwagi o źródłach</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>Źródła otwarte 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        so: `
          <h2>Xaaladda rasmiga ah ee hadda</h2>
          <p>Fadhiga ugu horreeya ee imtixaanka aqoonta bulshada wuxuu dhici doonaa 15 Ogosto 2026 magaalada Stockholm. Waxaa loo baahan yahay warqad ka timid Migrationsverket: kaliya dadka hela warqad ka timid Migrationsverket ayaa is-diiwaangelin kara.</p>
          <p>Kuraasta way xaddidan yihiin. Fadhiga Ogosto waa bilaash, oo ka-qaybgalayaashu waxay heli doonaan waqti badan.</p>
          <h2>Faahfaahin wax-ku-ool ah oo weli laga sugayo UHR</h2>
          <p>UHR weli ma soo saarin waqtiga iyo goobta saxda ah. U isticmaal barnaamijkan tababar aan rasmi ahayn, oo u isticmaal UHR iyo Migrationsverket tilmaamaha saameeya kiiskaaga gaarka ah.</p>
          <h2>Sida loo barto hadda</h2>
          <ol>
            <li>Akhri buuggan elektaroonigga ah ugu yaraan hal mar bilow ilaa dhammaad. U isticmaal tabka Tababarka si aad u celcelisid waxa aad ilowdo.</li>
            <li>Xaqiiqo kasta oo aad laba jeer si khaldan uga jawaabto, ku qor kaadh oo ku dheji qaboojiyaha. Ceebtu waa macallin wanaagsan.</li>
            <li>Toddobaadka ka horreeya imtixaanka, si degdeg ah u eeg faylka rasmiga ah ee <em>Sverige i fokus</em> ee PDF (lacag la'aan kala soo deg UHR). Ha isku dayin inaad xafiddo.</li>
            <li>U isticmaal imtixaanka tijaabada ah ee halkan tababar xusuus mowduucyo isku dhafan, kadibna ku noqo cutubyada aad dhibcaha ka lumisay.</li>
          </ol>
          <div class="ebook__factbox"><h4>Xusuusyada ilaha ee hadda</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>Ilaha la galay 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        ti: `
          <h2>ህሉው ወግዓዊ ኩነታት</h2>
          <p>እታ ቐዳመይቲ ናይ ሲቪካዊ ፍልጠት ፈተና ኣብ 15 ነሓሰ 2026 ኣብ ስቶክሆልም ክትካየድ እያ። ካብ Migrationsverket ዝመጸ ደብዳበ የድሊ፦ ካብ Migrationsverket ደብዳበ ዝተቐበሉ ሰባት ጥራይ እዮም ክምዝገቡ ዝኽእሉ።</p>
          <p>ብዝሒ መናብር ድሩት እዩ። እታ ናይ ነሓሰ ፈተና ብናጻ እያ፣ ተሳተፍቲ ድማ እኹል ግዜ ይረኽቡ።</p>
          <h2>ግብራዊ ዝርዝራት ካብ UHR ይጽበ ኣሎ</h2>
          <p>UHR ክሳብ ሕጂ ነቲ ልክዕ ግዜን ቦታን ኣይዘርግሐን። ነዚ መተግበሪ ንዘይወግዓዊ ልምምድ ተጠቐመሉ፣ ንዓኻ ንዝምልከት ጉዳይ ዝትንክፍ መምርሒታት ድማ ንUHR ከምኡ’ውን Migrationsverket ተጠቐም።</p>
          <h2>ሕጂ ብኸመይ ከም እትመሃር</h2>
          <ol>
            <li>ነዚ ኢ-መጽሓፍ ብውሕዱ ሓደ ግዜ ካብ መጀመርታ ክሳብ መወዳእታ ኣንብቦ። ነቲ እትርስዖ ንምልምማድ ነቲ ናይ ልምምድ ታብ ተጠቐም።</li>
            <li>ንነፍሲ ወከፍ ክልተ ግዜ ብጌጋ ዝመለስካዮ ሓቂ፣ ኣብ ካርድ ጽሓፎ ኣብ ፍሪጅ ድማ ለጥፎ። ሕፍረት ጽቡቕ መምህር እዩ።</li>
            <li>ቅድሚ ፈተና ሰሙን፣ ነቲ ወግዓዊ <em>Sverige i fokus</em> PDF (ካብ UHR ብናጻ ዝውረድ) ብቕልጡፍ ኣንብቦ። ብቓል ክትሕዞ ኣይትፈትን።</li>
            <li>ነቲ ኣብዚ ዘሎ ናይ ልምምድ ፈተና ከም ልምምድ ናይ ዝተሓዋወሰ ኣርእስቲ ምዝካር ተጠቐመሉ፣ ድሕሪኡ ነቶም ነጥቢ ዝሰኣንካሎም ምዕራፋት ተመለሰሎም።</li>
          </ol>
          <div class="ebook__factbox"><h4>ህሉዋት ናይ ምንጪ መግለጺታት</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>ምንጪታት ዝተበጽሑ 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        tr: `
          <h2>Güncel resmî durum</h2>
          <p>İlk yurttaşlık bilgisi oturumu 15 Ağustos 2026'da Stockholm'de yapılacak. Migrationsverket'ten bir mektup gereklidir: yalnızca Migrationsverket'ten mektup alan kişiler kayıt yaptırabilir.</p>
          <p>Kontenjan sınırlıdır. Ağustos oturumu ücretsizdir ve katılımcıların bol zamanı olacaktır.</p>
          <h2>UHR'den beklenen pratik ayrıntılar</h2>
          <p>UHR henüz kesin zaman ve yeri yayımlamadı. Bu uygulamayı gayriresmî alıştırma için kullanın; kendi durumunuzu etkileyen yönergeler için UHR ve Migrationsverket'i kullanın.</p>
          <h2>Şimdi nasıl çalışılır</h2>
          <ol>
            <li>Bu e-kitabı en az bir kez baştan sona okuyun. Unuttuklarınızı çalışmak için Alıştırma sekmesini kullanın.</li>
            <li>İki kez yanlış yaptığınız her bilgiyi bir karta yazıp buzdolabına yapıştırın. Mahcubiyet harika bir öğretmendir.</li>
            <li>Sınavdan önceki hafta resmî <em>Sverige i fokus</em> PDF'ini (UHR'den ücretsiz indirilir) göz gezdirin. Ezberlemeye çalışmayın.</li>
            <li>Buradaki deneme sınavını karışık konuları hatırlama provası olarak kullanın, ardından puan kaybettiğiniz bölümlere geri dönün.</li>
          </ol>
          <div class="ebook__factbox"><h4>Güncel kaynak notları</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>Kaynaklara erişim 2026-05-19: ${officialTestSourceLinks()}</p></div>
        `,
        uk: `
          <h2>Поточний офіційний статус</h2>
          <p>Перша сесія іспиту на знання громадянознавства відбудеться 15 серпня 2026 року в Стокгольмі. Потрібен лист від Migrationsverket: зареєструватися можуть лише ті, хто отримує лист від Migrationsverket.</p>
          <p>Кількість місць обмежена. Серпнева сесія безкоштовна, і учасники матимуть достатньо часу.</p>
          <h2>Практичні деталі ще очікуються від UHR</h2>
          <p>UHR ще не оприлюднив точний час і місце. Використовуйте цей застосунок для неофіційного тренування, а для вказівок, що стосуються вашого власного випадку, звертайтеся до UHR та Migrationsverket.</p>
          <h2>Як вчитися зараз</h2>
          <ol>
            <li>Прочитайте цю електронну книжку щонайменше один раз від початку до кінця. Користуйтеся вкладкою «Тренування», щоб опрацьовувати те, що забуваєте.</li>
            <li>Кожен факт, у якому ви помиляєтеся двічі, запишіть на картці й прикріпіть її на холодильник. Сором — чудовий учитель.</li>
            <li>За тиждень до іспиту перегляньте офіційний PDF <em>Sverige i fokus</em> (безкоштовне завантаження від UHR). Не намагайтеся вивчити його напам'ять.</li>
            <li>Використайте пробний іспит тут як репетицію пригадування змішаних тем, а потім поверніться до розділів, де ви втратили бали.</li>
          </ol>
          <div class="ebook__factbox"><h4>Поточні примітки до джерел</h4><p${ebookSourceKeyDataAttr(OFFICIAL_TEST_SOURCE_KEYS)}>Джерела відкрито 2026-05-19: ${officialTestSourceLinks()}</p></div>
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
      title: {
        en: 'Traditions,',
        sv: 'Traditioner,',
        'zh-Hans': '传统、',
        'zh-Hant': '傳統、',
        ar: 'التقاليد',
        ckb: 'نەریتەکان،',
        fa: 'سنت‌ها،',
        pl: 'Tradycje,',
        so: 'Caadooyinka,',
        ti: 'ባህልታት፣',
        tr: 'Gelenekler,',
        uk: 'Традиції,',
      },
      title_em: {
        en: 'holidays, and change.',
        sv: 'högtider och förändring.',
        'zh-Hans': '节日与变化。',
        'zh-Hant': '節日與變化。',
        ar: 'والأعياد والتغيّر.',
        ckb: 'جەژن و گۆڕان.',
        fa: 'جشن‌ها و دگرگونی.',
        pl: 'święta i zmiana.',
        so: 'fasaxyada, iyo isbeddelka.',
        ti: 'በዓላትን ለውጥን።',
        tr: 'bayramlar ve değişim.',
        uk: 'свята і зміни.',
      },
      lede: {
        en: 'Swedish traditions are not museum pieces. Some are old, some are borrowed, and most are just ways people mark the year together.',
        sv: 'Svenska traditioner är inte museiföremål. Vissa är gamla, vissa har kommit hit senare, och de flesta hjälper människor att känna igen året tillsammans.',
        'zh-Hans':
          '瑞典的传统并不是博物馆里的陈列品。有些古老，有些是外来的，而大多数只是人们一起标记一年时光的方式。',
        'zh-Hant':
          '瑞典的傳統並不是博物館裡的陳列品。有些古老，有些是外來的，而大多數只是人們一起標記一年時光的方式。',
        ar: 'التقاليد السويدية ليست قطعًا في متحف. بعضها قديم، وبعضها مستعار، ومعظمها مجرّد طرق يحتفي بها الناس بالعام معًا.',
        ckb: 'نەریتە سویدییەکان پارچەی مۆزەخانە نین. هەندێکیان کۆنن، هەندێکیان وەرگیراون، و زۆربەیان تەنها ڕێگان بۆ ئەوەی خەڵک پێکەوە ساڵ نیشانە بکەن.',
        fa: 'سنت‌های سوئدی اشیای موزه‌ای نیستند. برخی کهن‌اند، برخی وام‌گرفته‌شده، و بیشترشان فقط راه‌هایی‌اند که مردم با هم سال را گرامی می‌دارند.',
        pl: 'Szwedzkie tradycje to nie eksponaty muzealne. Niektóre są stare, niektóre zapożyczone, a większość to po prostu sposoby, w jakie ludzie wspólnie odmierzają rok.',
        so: 'Caadooyinka Iswiidhishku ma aha alaab matxaf. Qaarkood way duqoobeen, qaarkood waa la amaahday, badidooduna waa kaliya siyaabo ay dadku si wadajir ah u xuso sannadka.',
        ti: 'ሽወደናዊ ባህልታት ናይ ቤተ መዘክር ኣቕሑ ኣይኮኑን። ገሊኦም ኣረጊት እዮም፣ ገሊኦም ተለቒሖም መጺኦም፣ መብዛሕትኦም ድማ ሰባት ብሓባር ነታ ዓመት ዝምልክቱላ መንገድታት እዮም።',
        tr: 'İsveç gelenekleri müze parçaları değildir. Kimisi eski, kimisi ödünç alınmış, çoğu ise insanların yılı birlikte işaretlemesinin yollarıdır.',
        uk: 'Шведські традиції — це не музейні експонати. Деякі давні, деякі запозичені, а більшість — це просто способи, якими люди разом відзначають рік.',
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
        'zh-Hans': `<h2>传统会改变</h2>
          <p>传统是一个群体共享的习惯：一个节日、一首歌、食物、衣着、一场仪式，或一种聚在一起的方式。传统可以古老，却并非一成不变。人们迁徙，家庭融合，新的习俗也成为日常瑞典的一部分。</p>
          <p>因此本章不是一份关于"真正"与"不真正"瑞典性的清单。它是一份常见参照点的日历：那些出现在学校、工作、公共生活以及公民学习材料中的节日与仪式。</p>
          <h2>国庆日与公民仪式</h2>
          <p>瑞典的国庆日是 6 月 6 日。它与 Gustav Vasa（古斯塔夫·瓦萨）于 1523 年当选国王，以及 1809 年《政府组织法》相关联。如今人们升旗、发表演讲，许多市镇还会在仪式上欢迎新的瑞典公民。</p>
          <h2>春季与夏季</h2>
          <ul>
            <li><b>复活节</b>在 3 月或 4 月，源于基督教，不过许多人把它当作家庭与春天的节日来庆祝。</li>
            <li><b>瓦尔普吉斯之夜</b>，4 月 30 日，通常意味着点燃篝火、唱歌迎接春天。</li>
            <li><b>五一劳动节</b>是国际劳动节，以游行示威和政治演讲为标志。</li>
            <li><b>仲夏夜</b>总是在 6 月 19 日至 25 日之间的一个星期五，人们户外聚会、戴花环、立仲夏柱，吃鲱鱼、新土豆和草莓。</li>
          </ul>
          <h2>秋季与冬季</h2>
          <ul>
            <li><b>诸圣节</b>是许多人在墓前点蜡烛、缅怀已逝亲友的日子。</li>
            <li><b>将临期</b>是圣诞日之前的四个星期日。许多家庭会使用将临期蜡烛、星星或日历。</li>
            <li><b>露西亚节（Lucia）</b>，12 月 13 日，主题是一年中最黑暗时节里的光明，常有游行、蜡烛和歌唱。</li>
            <li><b>圣诞节</b>源于基督教，也是一个重要的家庭节日。在瑞典，主要的庆祝通常在 12 月 24 日的平安夜。</li>
            <li><b>除夕</b>，12 月 31 日，人们通常以晚宴、聚会和午夜的烟花来庆祝。</li>
          </ul>
          <h2>新的传统</h2>
          <p>移民为瑞典的公共生活增添了更多可见的传统。Eid al-Fitr（开斋节）、Nouruz、Newroz、Diwali（排灯节）以及其他庆典，可能出现在学校、职场、社区和城市活动中。其中重要的规律很简单：传统可以迁移，也可以适应。</p>
          ${ebookFactBox('zh-Hans', null, '国庆日：6 月 6 日 · 沃尔普吉斯之夜：4 月 30 日 · 仲夏夜：6 月 19 日至 25 日之间的星期五 · 露西亚节：12 月 13 日 · 平安夜：12 月 24 日。', ['uhrStudyMaterial'])}
        `,
        'zh-Hant': `<h2>傳統會改變</h2>
          <p>傳統是一個群體共享的習慣：一個節日、一首歌、食物、衣著、一場儀式，或一種聚在一起的方式。傳統可以古老，卻並非一成不變。人們遷徙，家庭融合，新的習俗也成為日常瑞典的一部分。</p>
          <p>因此本章不是一份關於"真正"與"不真正"瑞典性的清單。它是一份常見參照點的日曆：那些出現在學校、工作、公共生活以及公民學習材料中的節日與儀式。</p>
          <h2>國慶日與公民儀式</h2>
          <p>瑞典的國慶日是 6 月 6 日。它與 Gustav Vasa（古斯塔夫·瓦薩）於 1523 年當選國王，以及 1809 年《政府組織法》相關聯。如今人們升旗、發表演講，許多市鎮還會在儀式上歡迎新的瑞典公民。</p>
          <h2>春季與夏季</h2>
          <ul>
            <li><b>復活節</b>在 3 月或 4 月，源於基督教，不過許多人把它當作家庭與春天的節日來慶祝。</li>
            <li><b>瓦爾普吉斯之夜</b>，4 月 30 日，通常意味著點燃篝火、唱歌迎接春天。</li>
            <li><b>五一勞動節</b>是國際勞動節，以遊行示威和政治演講為標誌。</li>
            <li><b>仲夏夜</b>總是在 6 月 19 日至 25 日之間的一個星期五，人們戶外聚會、戴花環、立仲夏柱，吃鯡魚、新馬鈴薯和草莓。</li>
          </ul>
          <h2>秋季與冬季</h2>
          <ul>
            <li><b>諸聖節</b>是許多人在墓前點蠟燭、緬懷已逝親友的日子。</li>
            <li><b>將臨期</b>是聖誕日之前的四個星期日。許多家庭會使用將臨期蠟燭、星星或日曆。</li>
            <li><b>露西亞節（Lucia）</b>，12 月 13 日，主題是一年中最黑暗時節裡的光明，常有遊行、蠟燭和歌唱。</li>
            <li><b>聖誕節</b>源於基督教，也是一個重要的家庭節日。在瑞典，主要的慶祝通常在 12 月 24 日的平安夜。</li>
            <li><b>除夕</b>，12 月 31 日，人們通常以晚宴、聚會和午夜的煙火來慶祝。</li>
          </ul>
          <h2>新的傳統</h2>
          <p>移民為瑞典的公共生活增添了更多可見的傳統。Eid al-Fitr（開齋節）、Nouruz、Newroz、Diwali（排燈節）以及其他慶典，可能出現在學校、職場、社區和城市活動中。其中重要的規律很簡單：傳統可以遷移，也可以適應。</p>
          ${ebookFactBox('zh-Hant', null, '國慶日：6 月 6 日 · 沃爾普吉斯之夜：4 月 30 日 · 仲夏夜：6 月 19 日至 25 日之間的星期五 · 露西亞節：12 月 13 日 · 平安夜：12 月 24 日。', ['uhrStudyMaterial'])}
        `,
        ar: `<h2>التقاليد تتغيّر</h2>
          <p>التقليد عادةٌ تتشاركها مجموعة: عيد، أو أغنية، أو طعام، أو ملابس، أو مراسم، أو طريقة للاجتماع. يمكن للتقاليد أن تكون قديمة دون أن تكون متجمّدة. ينتقل الناس، وتتمازج العائلات، وتصبح عادات جديدة جزءًا من السويد اليومية.</p>
          <p>ولهذا فإن هذا الفصل ليس قائمة بما هو "سويديٌّ حقيقي" وما "ليس حقيقيًا". بل هو تقويم لنقاط مرجعية مشتركة: الأعياد والطقوس التي تظهر في المدرسة والعمل والحياة العامة ومواد الدراسة المدنية.</p>
          <h2>اليوم الوطني والمراسم المدنية</h2>
          <p>اليوم الوطني للسويد هو 6 يونيو. وهو مرتبط بانتخاب Gustav Vasa ملكًا عام 1523 وبصك الحكم لعام 1809. واليوم تُرفع الأعلام وتُلقى الخطب، وترحّب كثير من البلديات بالمواطنين السويديين الجدد في مراسم.</p>
          <h2>الربيع والصيف</h2>
          <ul>
            <li><b>عيد الفصح</b> يقع في مارس أو أبريل وله جذور مسيحية، وإن كان كثير من الناس يحتفلون به كعيد عائلي وربيعي.</li>
            <li><b>ليلة فالبورغ</b>، 30 أبريل، تعني غالبًا نيرانًا وأغانيَ ترحيبًا بالربيع.</li>
            <li><b>الأول من مايو</b> هو اليوم العالمي للعمّال، يُحتفى به بالمظاهرات والخطب السياسية.</li>
            <li><b>ليلة منتصف الصيف</b> تكون دائمًا يوم جمعة بين 19 و25 يونيو، مع تجمّعات في الهواء الطلق، وأكاليل الزهور، وعمود منتصف الصيف، والرنجة، والبطاطس الجديدة، والفراولة.</li>
          </ul>
          <h2>الخريف والشتاء</h2>
          <ul>
            <li><b>عيد جميع القدّيسين</b> هو حين يُشعل كثير من الناس الشموع عند القبور لتذكّر الأقارب والأصدقاء الذين رحلوا.</li>
            <li><b>زمن المجيء</b> هو آحاد الأربعة السابقة ليوم عيد الميلاد. تستخدم بيوت كثيرة شموع المجيء، أو النجوم، أو التقويمات.</li>
            <li><b>لوسيا (Lucia)</b>، 13 ديسمبر، تدور حول النور في أشدّ أوقات السنة ظلامًا، وغالبًا بمواكب وشموع وغناء.</li>
            <li><b>عيد الميلاد</b> له جذور مسيحية، وهو أيضًا عيد عائلي كبير. وفي السويد يكون الاحتفال الرئيسي عادةً ليلة عيد الميلاد، 24 ديسمبر.</li>
            <li><b>ليلة رأس السنة</b>، 31 ديسمبر، يُحتفل بها عادةً بالعشاءات والحفلات والألعاب النارية عند منتصف الليل.</li>
          </ul>
          <h2>تقاليد جديدة</h2>
          <p>أضافت الهجرة تقاليد أكثر ظهورًا إلى الحياة العامة في السويد. فقد تظهر احتفالات عيد الفطر (Eid al-Fitr) ونوروز (Nouruz) ونوروز الكردي (Newroz) وديوالي (Diwali) وغيرها في المدارس وأماكن العمل والأحياء وفعاليات المدن. والنمط المهمّ بسيط: التقاليد يمكن أن تنتقل وتتكيّف.</p>
          ${ebookFactBox('ar', null, 'اليوم الوطني: 6 يونيو · ليلة فالبورغ: 30 أبريل · ليلة منتصف الصيف: الجمعة بين 19 و25 يونيو · لوسيا: 13 ديسمبر · ليلة عيد الميلاد: 24 ديسمبر.', ['uhrStudyMaterial'])}
        `,
        ckb: `<h2>نەریتەکان دەگۆڕێن</h2>
          <p>نەریت گۆڕانکارییەکی هاوبەشە لەنێوان کۆمەڵێکدا: جەژنێک، گۆرانییەک، خواردن، جلوبەرگ، ڕێوڕەسمێک، یان ڕێگایەک بۆ کۆبوونەوە. نەریتەکان دەتوانن کۆن بن بەبێ ئەوەی بەستوو بن. خەڵک دەجووڵێن، خێزانەکان تێکەڵ دەبن، و نەریتە نوێیەکان دەبنە بەشێک لە سویدی ڕۆژانە.</p>
          <p>لەبەر ئەوەیە کە ئەم بەشە لیستێک نییە بۆ ئەوەی چی سویدیی "ڕاستەقینە"یە و چی "ڕاستەقینە نییە". بەڵکوو ساڵنامەیەکی خاڵە هاوبەشەکانە: ئەو جەژن و ڕێوڕەسمانەی لە قوتابخانە، کار، ژیانی گشتی و کەرەستەی خوێندنی شارستانیدا دەردەکەون.</p>
          <h2>ڕۆژی نیشتمانی و ڕێوڕەسمە شارستانییەکان</h2>
          <p>ڕۆژی نیشتمانیی سوید 6ی ژوئنە. پەیوەستە بە هەڵبژاردنی Gustav Vasa وەک پاشا لە ساڵی 1523 و بەڵگەنامەی فەرمانڕەواییی ساڵی 1809. ئەمڕۆ ئاڵاکان بەرز دەکرێنەوە، وتارەکان دەخوێنرێنەوە، و زۆر شارەوانی لە ڕێوڕەسمدا بەخێرهاتنی هاووڵاتییە نوێیە سویدییەکان دەکەن.</p>
          <h2>بەهار و هاوین</h2>
          <ul>
            <li><b>جەژنی هەستانەوە</b> لە مارس یان ئاپریلدا دێت و ڕەگی مەسیحیی هەیە، هەرچەندە زۆر کەس وەک جەژنێکی خێزانی و بەهاری دەیگێڕن.</li>
            <li><b>شەوی ڤالبۆرگ</b>، 30ی ئاپریل، زۆرجار مانای ئاگری گەورە و گۆرانییە بۆ بەخێرهاتنی بەهار.</li>
            <li><b>یەکی مایس</b> ڕۆژی نێودەوڵەتیی کرێکارانە، بە خۆپیشاندان و وتاری سیاسی نیشانە دەکرێت.</li>
            <li><b>شەوی ناوەڕاستی هاوین</b> هەمیشە ڕۆژی هەینییەکە لەنێوان 19 و 25ی ژوئندا، لەگەڵ کۆبوونەوەی دەرەوە، تاجی گوڵ، کۆڵەکەی ناوەڕاستی هاوین، ماسیی هێرینگ، پەتاتەی نوێ و فڕاولە.</li>
          </ul>
          <h2>پاییز و زستان</h2>
          <ul>
            <li><b>ڕۆژی هەموو پیرۆزان</b> ئەو ڕۆژەیە کە زۆر کەس مۆم لەسەر گۆڕەکان دادەگیرسێنن بۆ بیرکردنەوەی ئەو خزم و دۆستانەی کۆچی دوایییان کردووە.</li>
            <li><b>ئادڤێنت</b> چوار ڕۆژی یەکشەممەی پێش ڕۆژی کریسمسە. زۆر ماڵ مۆمی ئادڤێنت، ئەستێرە، یان ساڵنامە بەکاردەهێنن.</li>
            <li><b>لووسیا (Lucia)</b>، 13ی دیسەمبەر، دەربارەی ڕووناکییە لە تاریکترین بەشی ساڵدا، زۆرجار بە ڕێپێوان، مۆم و گۆرانییەوە.</li>
            <li><b>کریسمس</b> ڕەگی مەسیحیی هەیە و هەروەها جەژنێکی گەورەی خێزانییە. لە سویددا ئاهەنگی سەرەکی زۆرتر شەوی کریسمسە، 24ی دیسەمبەر.</li>
            <li><b>شەوی ساڵی نوێ</b>، 31ی دیسەمبەر، بەگشتی بە نانی ئێوارە، ئاهەنگ و ئاگری ساختە لە نیوەشەودا دەگێڕدرێت.</li>
          </ul>
          <h2>نەریتە نوێیەکان</h2>
          <p>کۆچ نەریتی زیاتری بەرچاوی بۆ ژیانی گشتیی سوید زیادکردووە. جەژنی Eid al-Fitr، Nouruz، Newroz، Diwali و ئاهەنگی تر لەوانەیە لە قوتابخانە، شوێنی کار، گەڕەک و چالاکییەکانی شاردا دەربکەون. ئەو شێوازە گرنگە سادەیە: نەریتەکان دەتوانن بگوازرێنەوە و خۆیان بگونجێنن.</p>
          ${ebookFactBox('ckb', null, 'ڕۆژی نیشتمانی: 6ی ژوئن · شەوی ڤالبۆرگ: 30ی ئاپریل · شەوی ناوەڕاستی هاوین: هەینی لەنێوان 19 و 25ی ژوئن · لووسیا: 13ی دیسەمبەر · شەوی کریسمس: 24ی دیسەمبەر.', ['uhrStudyMaterial'])}
        `,
        fa: `<h2>سنت‌ها دگرگون می‌شوند</h2>
          <p>سنت عادتی است که گروهی در آن سهیم‌اند: یک جشن، یک ترانه، خوراک، پوشاک، یک آیین، یا شیوه‌ای برای گرد هم آمدن. سنت‌ها می‌توانند کهن باشند بی‌آنکه منجمد بمانند. مردم جابه‌جا می‌شوند، خانواده‌ها در هم می‌آمیزند، و رسم‌های تازه بخشی از سوئدِ روزمره می‌شوند.</p>
          <p>به همین دلیل این فصل فهرستی از سوئدی‌بودنِ "واقعی" و "ناواقعی" نیست. بلکه تقویمی از نقاط مرجعِ مشترک است: جشن‌ها و آیین‌هایی که در مدرسه، کار، زندگی عمومی و مواد مطالعهٔ مدنی پدیدار می‌شوند.</p>
          <h2>روز ملی و آیین‌های مدنی</h2>
          <p>روز ملی سوئد 6 ژوئن است. این روز به انتخاب Gustav Vasa به پادشاهی در سال 1523 و به سند حکومت سال 1809 پیوند دارد. امروزه پرچم‌ها برافراشته می‌شوند، سخنرانی‌ها برگزار می‌شود، و بسیاری از کمون‌ها در آیین‌هایی به شهروندان تازهٔ سوئدی خوش‌آمد می‌گویند.</p>
          <h2>بهار و تابستان</h2>
          <ul>
            <li><b>عید پاک</b> در مارس یا آوریل می‌افتد و ریشهٔ مسیحی دارد، هرچند بسیاری آن را همچون جشنی خانوادگی و بهاری می‌گیرند.</li>
            <li><b>شب والپورگیس</b>، 30 آوریل، اغلب به معنای آتش‌افروزی و ترانه‌هایی برای خوش‌آمدگویی به بهار است.</li>
            <li><b>اول مه</b> روز جهانی کارگر است که با راهپیمایی‌ها و سخنرانی‌های سیاسی برگزار می‌شود.</li>
            <li><b>شب میانهٔ تابستان</b> همیشه یک جمعه میان 19 و 25 ژوئن است، با گردهمایی‌های فضای باز، تاج‌های گل، ستون میانهٔ تابستان، شاه‌ماهی، سیب‌زمینیِ نوبر و توت‌فرنگی.</li>
          </ul>
          <h2>پاییز و زمستان</h2>
          <ul>
            <li><b>روز همهٔ مقدسان</b> روزی است که بسیاری بر سر گورها شمع روشن می‌کنند تا یاد خویشان و دوستانِ درگذشته را گرامی بدارند.</li>
            <li><b>آدونت</b> چهار یکشنبهٔ پیش از روز کریسمس است. بسیاری از خانه‌ها از شمع‌های آدونت، ستاره‌ها یا تقویم‌ها استفاده می‌کنند.</li>
            <li><b>لوسیا (Lucia)</b>، 13 دسامبر، دربارهٔ نور در تاریک‌ترین بخش سال است، اغلب با دسته‌های راهپیمایی، شمع و آواز.</li>
            <li><b>کریسمس</b> ریشهٔ مسیحی دارد و جشنی خانوادگیِ مهم نیز هست. در سوئد جشن اصلی معمولاً شب کریسمس، 24 دسامبر است.</li>
            <li><b>شب سال نو</b>، 31 دسامبر، معمولاً با شام، مهمانی و آتش‌بازی در نیمه‌شب جشن گرفته می‌شود.</li>
          </ul>
          <h2>سنت‌های تازه</h2>
          <p>مهاجرت سنت‌های آشکارتری به زندگی عمومی سوئد افزوده است. عید فطر (Eid al-Fitr)، نوروز (Nouruz)، نوروز کردی (Newroz)، دیوالی (Diwali) و جشن‌های دیگر ممکن است در مدارس، محل‌های کار، محله‌ها و رویدادهای شهری نمایان شوند. الگوی مهم ساده است: سنت‌ها می‌توانند سفر کنند و خود را وفق دهند.</p>
          ${ebookFactBox('fa', null, 'روز ملی: 6 ژوئن · شب والپورگیس: 30 آوریل · شب میانهٔ تابستان: جمعه میان 19 و 25 ژوئن · لوسیا: 13 دسامبر · شب کریسمس: 24 دسامبر.', ['uhrStudyMaterial'])}
        `,
        pl: `<h2>Tradycje się zmieniają</h2>
          <p>Tradycja to zwyczaj wspólny dla grupy: święto, piosenka, jedzenie, ubiór, ceremonia albo sposób spotykania się. Tradycje mogą być stare, nie będąc zamrożone. Ludzie się przemieszczają, rodziny się mieszają, a nowe obyczaje stają się częścią codziennej Szwecji.</p>
          <p>Dlatego ten rozdział nie jest listą tego, co jest „prawdziwą” i „nieprawdziwą” szwedzkością. To kalendarz wspólnych punktów odniesienia: świąt i rytuałów, które pojawiają się w szkole, pracy, życiu publicznym oraz w materiałach do nauki obywatelskiej.</p>
          <h2>Święto narodowe i ceremonie obywatelskie</h2>
          <p>Szwedzkie święto narodowe przypada 6 czerwca. Wiąże się z wyborem Gustava Vasy na króla w 1523 oraz z Aktem o formie rządu z 1809. Dziś wciąga się flagi, wygłasza przemówienia, a wiele gmin wita podczas ceremonii nowych obywateli Szwecji.</p>
          <h2>Wiosna i lato</h2>
          <ul>
            <li><b>Wielkanoc</b> wypada w marcu lub kwietniu i ma chrześcijańskie korzenie, choć wielu ludzi obchodzi ją jako święto rodzinne i wiosenne.</li>
            <li><b>Noc Walpurgi</b>, 30 kwietnia, często oznacza ogniska i pieśni witające wiosnę.</li>
            <li><b>1 maja</b> to Międzynarodowy Dzień Pracy, obchodzony manifestacjami i przemówieniami politycznymi.</li>
            <li><b>Wigilia nocy świętojańskiej</b> to zawsze piątek między 19 a 25 czerwca, z plenerowymi spotkaniami, wiankami z kwiatów, słupem świętojańskim, śledziem, młodymi ziemniakami i truskawkami.</li>
          </ul>
          <h2>Jesień i zima</h2>
          <ul>
            <li><b>Dzień Wszystkich Świętych</b> to dzień, w którym wielu ludzi zapala świece na grobach, by wspomnieć zmarłych krewnych i przyjaciół.</li>
            <li><b>Adwent</b> to cztery niedziele przed Bożym Narodzeniem. Wiele domów używa świec adwentowych, gwiazd lub kalendarzy.</li>
            <li><b>Lucia (Lucia)</b>, 13 grudnia, dotyczy światła w najciemniejszej porze roku, często z procesjami, świecami i śpiewem.</li>
            <li><b>Boże Narodzenie</b> ma chrześcijańskie korzenie i jest też ważnym świętem rodzinnym. W Szwecji główne obchody przypadają zwykle na Wigilię, 24 grudnia.</li>
            <li><b>Sylwester</b>, 31 grudnia, świętuje się zwykle kolacjami, przyjęciami i fajerwerkami o północy.</li>
          </ul>
          <h2>Nowe tradycje</h2>
          <p>Migracja dodała do szwedzkiego życia publicznego więcej widocznych tradycji. Eid al-Fitr, Nouruz, Newroz, Diwali i inne uroczystości mogą pojawiać się w szkołach, miejscach pracy, dzielnicach i wydarzeniach miejskich. Ważny wzorzec jest prosty: tradycje mogą podróżować i się dostosowywać.</p>
          ${ebookFactBox('pl', null, 'Święto narodowe: 6 czerwca · Noc Walpurgi: 30 kwietnia · Wigilia nocy świętojańskiej: piątek między 19 a 25 czerwca · Lucia: 13 grudnia · Wigilia Bożego Narodzenia: 24 grudnia.', ['uhrStudyMaterial'])}
        `,
        so: `<h2>Caadooyinku way isbeddelaan</h2>
          <p>Caado waa caado koox wadaagto: fasax, hees, cunto, dhar, xaflad, ama hab lagu kulmo. Caadooyinku way duqoobi karaan iyagoon barafoobin. Dadku way guuraan, qoysasku way isku dhex galaan, caadooyin cusubna waxay qayb ka noqdaan Iswiidhanka maalinlaha ah.</p>
          <p>Taasi waa sababta cutubkani aanu u ahayn liis ah waxa ah Iswiidhinimo "dhab ah" iyo "aan dhab ahayn". Waa jadwal qodobbo wadaag ah: fasaxyada iyo cibaadooyinka ka muuqda dugsiga, shaqada, nolosha guud iyo agabka waxbarashada bulshada.</p>
          <h2>Maalinta qaranka iyo xafladaha bulshada</h2>
          <p>Maalinta qaranka Iswiidhan waa 6 Juun. Waxay la xidhiidhaa doorashada Gustav Vasa oo boqor lagu doortay 1523 iyo Qoraalka Dawladnimada ee 1809. Maanta calammada waa la taagaa, khudbado waa la jeediyaa, degmooyin badanna waxay xafladaha ku soo dhoweeyaan muwaadiniinta cusub ee Iswiidhishka ah.</p>
          <h2>Gu' iyo xagaa</h2>
          <ul>
            <li><b>Iidda Faasiga</b> waxay ku dhacdaa Maarso ama Abriil waxayna leedahay xididdo Masiixi ah, inkastoo dad badani u xuso sidii fasax qoys iyo gu'.</li>
            <li><b>Habeenka Walpurgis</b>, 30 Abriil, badanaa wuxuu macnaheedu yahay dab-shidan iyo heeso lagu soo dhoweynayo gu'ga.</li>
            <li><b>Kowda Maajo</b> waa Maalinta Caalamiga ah ee Shaqaalaha, oo lagu calaamadiyo bannaanbaxyo iyo khudbado siyaasadeed.</li>
            <li><b>Habeenka Bartamaha Xagaaga</b> had iyo jeer waa Jimce u dhexeeya 19 iyo 25 Juun, oo leh kulammo bannaan, taajaj ubax, tiir bartamaha xagaaga, kalluun la dhanaaniyey, baradho cusub iyo farawle.</li>
          </ul>
          <h2>Dayr iyo jiilaal</h2>
          <ul>
            <li><b>Maalinta Quduusiinta oo dhan</b> waa marka dad badani shumacyo ku shidaan qabuuraha si ay u xusuustaan qaraabo iyo saaxiibbo dhintay.</li>
            <li><b>Xilliga Advent</b> waa afarta Axad ee ka horreeya Maalinta Kirismaska. Guryo badan waxay isticmaalaan shumacyada Advent, xiddigaha, ama jadwallada.</li>
            <li><b>Lucia (Lucia)</b>, 13 Diseembar, waxay ku saabsan tahay iftiinka qaybta ugu mugdiga badan sannadka, badanaa oo leh socod, shumacyo iyo heeso.</li>
            <li><b>Kirismaska</b> wuxuu leeyahay xididdo Masiixi ah waana sidoo kale fasax qoys oo weyn. Iswiidhan dabbaaldegga ugu weyn badanaa waa Habeenka Kirismaska, 24 Diseembar.</li>
            <li><b>Habeenka Sannadka Cusub</b>, 31 Diseembar, badanaa waxaa lagu dabbaaldegaa casheeyo, xafillado iyo foosto-dab habeenbadhe.</li>
          </ul>
          <h2>Caadooyin cusub</h2>
          <p>Socdaalku wuxuu nolosha guud ee Iswiidhan ku daray caadooyin badan oo muuqda. Eid al-Fitr, Nouruz, Newroz, Diwali iyo dabbaaldegyo kale waxay ka muuqan karaan dugsiyada, goobaha shaqada, xaafadaha iyo munaasabadaha magaalada. Qaabka muhiimka ah waa fudud: caadooyinku way socdaali karaan oo isla qabsan karaan.</p>
          ${ebookFactBox('so', null, 'Maalinta qaranka: 6 Juun · Habeenka Walpurgis: 30 Abriil · Habeenka Bartamaha Xagaaga: Jimce u dhexeeya 19 iyo 25 Juun · Lucia: 13 Diseembar · Habeenka Kirismaska: 24 Diseembar.', ['uhrStudyMaterial'])}
        `,
        ti: `<h2>ባህልታት ይቕየሩ</h2>
          <p>ባህሊ ሓደ ጉጅለ ዝካፈሎ ልምዲ እዩ፦ በዓል፣ ደርፊ፣ መግቢ፣ ክዳን፣ ስነ ስርዓት፣ ወይ ናይ ምትእኽኻብ መንገዲ። ባህልታት ከይተዓጽዉ ኣረጊት ክኾኑ ይኽእሉ። ሰባት ይግዕዙ፣ ስድራቤታት ይተሓዋወሱ፣ ሓደስቲ ልምድታት ድማ ክፍሊ ናይታ ዕለታዊት ሽወደን ይኾኑ።</p>
          <p>ስለዚ እዩ እዚ ምዕራፍ "ሓቀኛ" ከምኡ’ውን "ዘይሓቀኛ" ሽወደናውነት ዝብል ዝርዝር ዘይኮነ። ናይ ሓባር መወከሲ ነጥብታት ዓውደ-ኣዋርሕ እዩ፦ እቶም ኣብ ቤት ትምህርቲ፣ ስራሕ፣ ህዝባዊ ህይወትን ሲቪካዊ ናይ ትምህርቲ ጽሑፍን ዝረኣዩ በዓላትን ስነ ስርዓታትን።</p>
          <h2>ሃገራዊ መዓልትን ሲቪካዊ ስነ ስርዓታትን</h2>
          <p>ሃገራዊ መዓልቲ ሽወደን 6 ሰነ እዩ። ምስ ምርጫ Gustav Vasa ከም ንጉስ ኣብ 1523 ከምኡ’ውን ምስ ሰነድ ምሕደራ መንግስቲ ናይ 1809 ይተኣሳሰር። ሎሚ ባንዴራታት ይለዓሉ፣ መደረታት ይካየዱ፣ ብዙሓት ምምሕዳራት ከተማ ድማ ኣብ ስነ ስርዓታት ንሓደስቲ ሽወደናውያን ዜጋታት እንቋዕ ብደሓን መጻእኩም ይብሉ።</p>
          <h2>ጽድያን ሓጋይን</h2>
          <ul>
            <li><b>ፋሲካ</b> ኣብ መጋቢት ወይ ሚያዝያ ይወድቕ ክርስትያናዊ ሱር ድማ ኣለዎ፣ እንተኾነ ብዙሓት ሰባት ከም ስድራቤታውን ጽድያውን በዓል የብዕልዎ።</li>
            <li><b>ለይቲ ቫልቦርግ</b>፣ 30 ሚያዝያ፣ መብዛሕትኡ ግዜ ሓዊ ምውላዕን ንጽድያ ናይ ምቕባል ደርፍታትን ማለት እዩ።</li>
            <li><b>ቀዳማይ ግንቦት</b> ዓለማዊ መዓልቲ ሰራሕተኛታት እዩ፣ ብሰልፍታትን ፖለቲካዊ መደረታትን ይምልከት።</li>
            <li><b>ለይቲ ማእከል ሓጋይ</b> ኩሉ ግዜ ኣብ መንጎ 19ን 25ን ሰነ ዘሎ ዓርቢ እዩ፣ ምስ ናይ ደገ ምትእኽኻብ፣ ናይ ዕምባባ ዘውድታት፣ ናይ ማእከል ሓጋይ ዓንዲ፣ ሄሪንግ ዓሳ፣ ሓድሽ ድንሽን ፍራውለን።</li>
          </ul>
          <h2>ቀውዕን ክረምትን</h2>
          <ul>
            <li><b>መዓልቲ ኩሎም ቅዱሳን</b> ብዙሓት ሰባት ነቶም ዝሞቱ ኣዝማድን ኣዕሩኽን ንምዝካር ኣብ መቓብር ሽምዓ ዘብርሁሉ ግዜ እዩ።</li>
            <li><b>ኣድቨንት</b> እተን ቅድሚ መዓልቲ ልደት ዘለዋ ኣርባዕተ ሰናብቲ እየን። ብዙሓት ኣባይቲ ናይ ኣድቨንት ሽምዓታት፣ ኮኾባት፣ ወይ ዓውደ-ኣዋርሕ ይጥቀሙ።</li>
            <li><b>ሉስያ (Lucia)</b>፣ 13 ታሕሳስ፣ ብዛዕባ ብርሃን ኣብቲ ኣዝዩ ጸልማት ክፋል ዓመት እዩ፣ መብዛሕትኡ ግዜ ምስ ሰልፍታት፣ ሽምዓታትን ዝማረን።</li>
            <li><b>ልደት</b> ክርስትያናዊ ሱር ኣለዎ ከምኡ’ውን ዓብዪ ስድራቤታዊ በዓል እዩ። ኣብ ሽወደን እቲ ቀንዲ በዓል መብዛሕትኡ ግዜ ለይቲ ልደት፣ 24 ታሕሳስ እዩ።</li>
            <li><b>ለይቲ ሓድሽ ዓመት</b>፣ 31 ታሕሳስ፣ ብተለምዶ ብድራራት፣ ድግሳትን ኣብ ፍርቂ ለይቲ ብርሕሰት ባሩድን ይብዓል።</li>
          </ul>
          <h2>ሓደስቲ ባህልታት</h2>
          <p>ስደት ናብ ህዝባዊ ህይወት ሽወደን ዝያዳ ዝረኣዩ ባህልታት ወሲኹ። Eid al-Fitr፣ Nouruz፣ Newroz፣ Diwali ከምኡ’ውን ካልኦት በዓላት ኣብ ኣብያተ ትምህርቲ፣ ቦታታት ስራሕ፣ ጐረባብትን ናይ ከተማ ምigበራትን ክርኣዩ ይኽእሉ። እቲ ኣገዳሲ ኣገባብ ቀሊል እዩ፦ ባህልታት ክግዕዙን ክመዓራረዩን ይኽእሉ።</p>
          ${ebookFactBox('ti', null, 'ሃገራዊ መዓልቲ፦ 6 ሰነ · ለይቲ ቫልቦርግ፦ 30 ሚያዝያ · ለይቲ ማእከል ሓጋይ፦ ዓርቢ ኣብ መንጎ 19ን 25ን ሰነ · ሉስያ፦ 13 ታሕሳስ · ለይቲ ልደት፦ 24 ታሕሳስ።', ['uhrStudyMaterial'])}
        `,
        tr: `<h2>Gelenekler değişir</h2>
          <p>Gelenek, bir grubun paylaştığı bir alışkanlıktır: bir bayram, bir şarkı, yemek, kıyafet, bir tören ya da bir araya gelme biçimi. Gelenekler donup kalmadan da eski olabilir. İnsanlar yer değiştirir, aileler karışır ve yeni âdetler gündelik İsveç'in parçası olur.</p>
          <p>Bu yüzden bu bölüm "gerçek" ve "gerçek olmayan" İsveçliliğin bir listesi değildir. Ortak başvuru noktalarından oluşan bir takvimdir: okulda, işte, kamusal yaşamda ve yurttaşlık çalışma materyalinde karşımıza çıkan bayramlar ve ritüeller.</p>
          <h2>Ulusal gün ve yurttaşlık törenleri</h2>
          <p>İsveç'in ulusal günü 6 Haziran'dır. Gustav Vasa'nın 1523'te kral seçilmesine ve 1809 Yönetim Belgesi'ne bağlıdır. Bugün bayraklar göndere çekilir, konuşmalar yapılır ve birçok belediye törenlerle yeni İsveç vatandaşlarını karşılar.</p>
          <h2>İlkbahar ve yaz</h2>
          <ul>
            <li><b>Paskalya</b> mart veya nisana denk gelir ve Hristiyan kökenlidir, yine de birçok kişi onu bir aile ve bahar bayramı olarak kutlar.</li>
            <li><b>Walpurgis Gecesi</b>, 30 Nisan, çoğu zaman bahara hoş geldin diyen şenlik ateşleri ve şarkılar demektir.</li>
            <li><b>Bir Mayıs</b> Uluslararası İşçi Bayramı'dır; gösteriler ve siyasi konuşmalarla anılır.</li>
            <li><b>Yaz Ortası Arifesi</b> her zaman 19 ile 25 Haziran arasındaki bir cumadır; açık havada toplanmalar, çiçekten taçlar, bir yaz ortası direği, ringa, taze patates ve çilek eşlik eder.</li>
          </ul>
          <h2>Sonbahar ve kış</h2>
          <ul>
            <li><b>Azizler Günü</b>, birçok kişinin ölen akraba ve dostlarını anmak için mezarlarda mum yaktığı gündür.</li>
            <li><b>Advent dönemi</b>, Noel Günü'nden önceki dört pazardır. Birçok evde Advent mumları, yıldızlar veya takvimler kullanılır.</li>
            <li><b>Lucia (Lucia)</b>, 13 Aralık, yılın en karanlık döneminde ışıkla ilgilidir; çoğu zaman geçit alayları, mumlar ve şarkılarla.</li>
            <li><b>Noel</b> Hristiyan kökenlidir ve aynı zamanda önemli bir aile bayramıdır. İsveç'te asıl kutlama genellikle 24 Aralık'taki Noel Arifesi'dir.</li>
            <li><b>Yılbaşı Gecesi</b>, 31 Aralık, genellikle akşam yemekleri, partiler ve gece yarısı havai fişeklerle kutlanır.</li>
          </ul>
          <h2>Yeni gelenekler</h2>
          <p>Göç, İsveç'in kamusal yaşamına daha görünür gelenekler kattı. Eid al-Fitr, Nouruz, Newroz, Diwali ve başka kutlamalar okullarda, iş yerlerinde, mahallelerde ve şehir etkinliklerinde görülebilir. Önemli örüntü basittir: gelenekler yolculuk edebilir ve uyum sağlayabilir.</p>
          ${ebookFactBox('tr', null, 'Ulusal gün: 6 Haziran · Walpurgis Gecesi: 30 Nisan · Yaz Ortası Arifesi: 19 ile 25 Haziran arasındaki cuma · Lucia: 13 Aralık · Noel Arifesi: 24 Aralık.', ['uhrStudyMaterial'])}
        `,
        uk: `<h2>Традиції змінюються</h2>
          <p>Традиція — це звичка, спільна для групи: свято, пісня, їжа, одяг, церемонія або спосіб збиратися разом. Традиції можуть бути давніми, не будучи застиглими. Люди переїжджають, родини змішуються, а нові звичаї стають частиною повсякденної Швеції.</p>
          <p>Саме тому цей розділ не є списком «справжньої» та «несправжньої» шведськості. Це календар спільних орієнтирів: свят і ритуалів, які з'являються у школі, на роботі, у публічному житті та в матеріалах для громадянського навчання.</p>
          <h2>Національне свято та громадянські церемонії</h2>
          <p>Національне свято Швеції — 6 червня. Воно пов'язане з обранням Gustav Vasa королем у 1523 та з Актом про форму правління 1809 року. Сьогодні піднімають прапори, виголошують промови, а багато муніципалітетів вітають нових шведських громадян на церемоніях.</p>
          <h2>Весна та літо</h2>
          <ul>
            <li><b>Великдень</b> припадає на березень або квітень і має християнське коріння, хоча багато людей святкують його як родинне й весняне свято.</li>
            <li><b>Вальпургієва ніч</b>, 30 квітня, часто означає вогнища й пісні на честь весни.</li>
            <li><b>Перше травня</b> — Міжнародний день трудящих, який відзначають демонстраціями та політичними промовами.</li>
            <li><b>Переддень Середини літа</b> — це завжди п'ятниця між 19 та 25 червня, із зібраннями просто неба, вінками з квітів, стовпом Середини літа, оселедцем, молодою картоплею та полуницею.</li>
          </ul>
          <h2>Осінь та зима</h2>
          <ul>
            <li><b>День усіх святих</b> — це коли багато людей запалюють свічки на могилах, щоб згадати померлих рідних і друзів.</li>
            <li><b>Адвент</b> — це чотири неділі перед Різдвом. Багато домівок використовують адвентські свічки, зірки або календарі.</li>
            <li><b>Луція (Lucia)</b>, 13 грудня, — це про світло в найтемнішу пору року, часто з процесіями, свічками та співом.</li>
            <li><b>Різдво</b> має християнське коріння і є також важливим родинним святом. У Швеції головне святкування зазвичай припадає на Святвечір, 24 грудня.</li>
            <li><b>Переддень Нового року</b>, 31 грудня, зазвичай святкують вечерями, вечірками та феєрверками опівночі.</li>
          </ul>
          <h2>Нові традиції</h2>
          <p>Міграція додала більше помітних традицій до публічного життя Швеції. Eid al-Fitr, Nouruz, Newroz, Diwali та інші святкування можуть з'являтися у школах, на робочих місцях, у районах і на міських подіях. Важлива закономірність проста: традиції можуть подорожувати й пристосовуватися.</p>
          ${ebookFactBox('uk', null, "Національне свято: 6 червня · Вальпургієва ніч: 30 квітня · Переддень Середини літа: п'ятниця між 19 та 25 червня · Луція: 13 грудня · Святвечір: 24 грудня.", ['uhrStudyMaterial'])}
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
          ebookLedeSourceKeys(id),
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
    const bodyHtml = ch.body
      ? footnoteCollector.annotate(rawBodyHtml, ebookBodySourceKeys(id))
      : rawBodyHtml;
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
      ${window.smtAdSlotMarkup ? window.smtAdSlotMarkup('ebook') : ''}
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
    if (window.smtMountAds) window.smtMountAds();
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
