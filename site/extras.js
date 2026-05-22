/* Almost Swedish — Extras
   - Reveal-on-scroll for chapter list
   - Easter eggs: fika, abba, snö, vasa, ikea, skål, lagom, brand-tap, "?" cheatsheet, triple-click facts
   - Smooth in-page anchor scroll
*/

(function () {
  'use strict';

  // ---------- Reveal chapter rows on scroll ----------

  function setupReveal() {
    const items = document.querySelectorAll('.list-quiet li');
    if (!items.length || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Array.from(items).indexOf(e.target);
            setTimeout(() => e.target.classList.add('is-in'), Math.min(idx * 40, 240));
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    items.forEach((el) => io.observe(el));
  }

  // ---------- Lang helper ----------
  function lang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }

  const EXTRAS_COPY = {
    fikaToast: {
      en: '☕ Fika break.',
      sv: '☕ Fikapaus.',
      'zh-Hans': '☕ Fika 休息。',
      'zh-Hant': '☕ Fika 休息。',
      ar: '☕ استراحة فيكا.',
      ckb: '☕ پشووی فیکا.',
      fa: '☕ وقت فیکا.',
      pl: '☕ Przerwa na fikę.',
      so: '☕ Nasasho fika.',
      ti: '☕ ናይ fika ዕረፍቲ።',
      tr: '☕ Fika molası.',
      uk: '☕ Перерва на фіку.',
    },
    fikaBuddy: {
      en: 'Fika break? Always allowed.',
      sv: 'Fika? Alltid tillåtet.',
      'zh-Hans': 'Fika 休息？当然可以。',
      'zh-Hant': 'Fika 休息？當然可以。',
      ar: 'استراحة فيكا؟ مسموحة دائمًا.',
      ckb: 'پشووی فیکا؟ هەمیشە ڕێگەپێدراوە.',
      fa: 'استراحت فیکا؟ همیشه مجاز است.',
      pl: 'Przerwa na fikę? Zawsze wolno.',
      so: 'Nasasho fika? Mar walba waa la oggol yahay.',
      ti: 'ዕረፍቲ fika? ኩሉ ግዜ ይፍቀድ።',
      tr: 'Fika molası mı? Her zaman olur.',
      uk: 'Перерва на фіку? Завжди можна.',
    },
    abbaToast: {
      en: '💃 Take a chance on me.',
      sv: '💃 Chansa på mig.',
      'zh-Hans': '💃 给我一次机会。',
      'zh-Hant': '💃 給我一次機會。',
      ar: '💃 امنحني فرصة.',
      ckb: '💃 دەرفەتێکم پێ بدە.',
      fa: '💃 به من فرصت بده.',
      pl: '💃 Daj mi szansę.',
      so: '💃 Fursad i sii.',
      ti: '💃 ዕድል ሃበኒ።',
      tr: '💃 Bana bir şans ver.',
      uk: '💃 Дай мені шанс.',
    },
    abbaBuddy: {
      en: 'Mamma mia, here we go again.',
      sv: 'Mamma mia, här går vi igen.',
      'zh-Hans': 'Mamma mia，我们又来了。',
      'zh-Hant': 'Mamma mia，我們又來了。',
      ar: 'ماما ميا، ها نحن من جديد.',
      ckb: 'Mamma mia، دیسان دەست پێ دەکەین.',
      fa: 'ماما میا، دوباره شروع شد.',
      pl: 'Mamma mia, zaczynamy znowu.',
      so: 'Mamma mia, mar kale ayaan bilownay.',
      ti: 'Mamma mia፣ እንደገና ንጅምር።',
      tr: 'Mamma mia, yine başlıyoruz.',
      uk: 'Mamma mia, знову починаємо.',
    },
    snowToast: {
      en: '❄ Snow.',
      sv: '❄ Snö.',
      'zh-Hans': '❄ 下雪。',
      'zh-Hant': '❄ 下雪。',
      ar: '❄ ثلج.',
      ckb: '❄ بەفر.',
      fa: '❄ برف.',
      pl: '❄ Śnieg.',
      so: '❄ Baraf.',
      ti: '❄ በረድ።',
      tr: '❄ Kar.',
      uk: '❄ Сніг.',
    },
    snowBuddy: {
      en: 'Winter is here. Sip something hot.',
      sv: 'Vintern är här. Drick något varmt.',
      'zh-Hans': '冬天来了。喝点热的吧。',
      'zh-Hant': '冬天來了。喝點熱的吧。',
      ar: 'الشتاء هنا. ارتشف شيئًا ساخنًا.',
      ckb: 'زستان هاتووە. شتێکی گەرم بخۆرەوە.',
      fa: 'زمستان آمده است. یک نوشیدنی گرم بنوش.',
      pl: 'Zima już tu jest. Wypij coś ciepłego.',
      so: 'Jiilaalkii waa yimid. Cab wax kulul.',
      ti: 'ክረምቲ መጺኡ። ገለ ውዑይ ስተ።',
      tr: 'Kış geldi. Sıcak bir şeyler iç.',
      uk: 'Зима тут. Випий щось гаряче.',
    },
    vasaToast: {
      en: '⛵ Vasa, on its way.',
      sv: '⛵ Vasa, på väg.',
      'zh-Hans': '⛵ 瓦萨号出发了。',
      'zh-Hant': '⛵ 瓦薩號出發了。',
      ar: '⛵ فاسا في الطريق.',
      ckb: '⛵ ڤاسا لە ڕێگادایە.',
      fa: '⛵ واسا در راه است.',
      pl: '⛵ Vasa w drodze.',
      so: '⛵ Vasa way soo socotaa.',
      ti: '⛵ Vasa ኣብ መገዲ ኣሎ።',
      tr: '⛵ Vasa yolda.',
      uk: '⛵ Vasa вирушає.',
    },
    vasaBuddy: {
      en: "It sank in 1628. Don't get attached.",
      sv: 'Det sjönk 1628. Knyt inte an för mycket.',
      'zh-Hans': '它在 1628 年沉没了。别太投入。',
      'zh-Hant': '它在 1628 年沉沒了。別太投入。',
      ar: 'غرقت عام 1628. لا تتعلّق بها كثيرًا.',
      ckb: 'لە ساڵی ١٦٢٨ نوقم بوو. زۆر پێوە مەبەستە.',
      fa: 'در سال ۱۶۲۸ غرق شد. زیاد دلبسته نشو.',
      pl: 'Zatonął w 1628 roku. Nie przywiązuj się za bardzo.',
      so: 'Waxay degtay 1628. Aad ha ugu dhegganaan.',
      ti: 'ብ1628 ጠሊቑ። ብዙሕ ኣይትተኣሳሰር።',
      tr: '1628’de battı. Fazla bağlanma.',
      uk: 'Він затонув у 1628 році. Не прив’язуйся надто сильно.',
    },
    ikeaToast: {
      en: '📦 Some assembly required.',
      sv: '📦 Viss montering krävs.',
      'zh-Hans': '📦 需要自行组装。',
      'zh-Hant': '📦 需要自行組裝。',
      ar: '📦 يحتاج إلى بعض التركيب.',
      ckb: '📦 پێویستی بە کۆکردنەوەیەکی کەم هەیە.',
      fa: '📦 کمی سرهم‌بندی لازم است.',
      pl: '📦 Wymagany montaż.',
      so: '📦 Isku xirid yar ayaa loo baahan yahay.',
      ti: '📦 ገለ ምትካል የድሊ።',
      tr: '📦 Biraz montaj gerekir.',
      uk: '📦 Потрібне складання.',
    },
    ikeaBuddy: {
      en: 'Step 1: do not lose the small allen key. Step 2: there is no step 2.',
      sv: 'Steg 1: tappa inte bort den lilla insexnyckeln. Steg 2: det finns inget steg 2.',
      'zh-Hans': '第一步：别弄丢小内六角扳手。第二步：没有第二步。',
      'zh-Hant': '第一步：別弄丟小內六角扳手。第二步：沒有第二步。',
      ar: 'الخطوة 1: لا تُضع مفتاح ألن الصغير. الخطوة 2: لا توجد خطوة 2.',
      ckb: 'هەنگاوی ١: کلیلی ئەلنی بچووک ون مەکە. هەنگاوی ٢: هەنگاوی ٢ نییە.',
      fa: 'گام ۱: آچار آلن کوچک را گم نکن. گام ۲: گام دومی وجود ندارد.',
      pl: 'Krok 1: nie zgub małego imbusa. Krok 2: nie ma kroku 2.',
      so: 'Tallaabada 1: ha lumin furaha allen-ka yar. Tallaabada 2: tallaabo 2 ma jirto.',
      ti: 'ስጉምቲ 1፦ እታ ንእሽቶ መፍትሕ allen ኣይተጥፍኣያ። ስጉምቲ 2፦ ስጉምቲ 2 የለን።',
      tr: 'Adım 1: küçük alyan anahtarını kaybetme. Adım 2: ikinci adım yok.',
      uk: 'Крок 1: не загуби маленький шестигранник. Крок 2: кроку 2 немає.',
    },
    skalToast: {
      en: '🥂 Cheers!',
      sv: '🥂 Skål!',
      'zh-Hans': '🥂 干杯！',
      'zh-Hant': '🥂 乾杯！',
      ar: '🥂 بصحتك!',
      ckb: '🥂 بەخۆشی!',
      fa: '🥂 به سلامتی!',
      pl: '🥂 Na zdrowie!',
      so: '🥂 Hambalyo!',
      ti: '🥂 ንጥዕና!',
      tr: '🥂 Şerefe!',
      uk: '🥂 Будьмо!',
    },
    skalBuddy: {
      en: "Eyes up. Glass up. Sip. Eyes again. That's the protocol.",
      sv: 'Ögonkontakt. Höj glaset. Klunk. Ögonkontakt igen. Så går det till.',
      'zh-Hans': '先看对方。举杯。喝一口。再看对方。这就是流程。',
      'zh-Hant': '先看對方。舉杯。喝一口。再看對方。這就是流程。',
      ar: 'ارفع عينيك. ارفع الكأس. رشفة. عيون مرة أخرى. هذه هي القاعدة.',
      ckb: 'چاوەکان بەرز بکە. پەرداخ بەرز بکە. قومێک. دیسان چاو. ئەمە ڕێساکەیە.',
      fa: 'چشم‌ها بالا. لیوان بالا. یک جرعه. دوباره چشم‌ها. رسمش همین است.',
      pl: 'Spójrz w oczy. Unieś kieliszek. Łyk. Znowu oczy. Taki protokół.',
      so: 'Indhaha kor u qaad. Koobka kor u qaad. Cab. Haddana indhaha. Taasi waa habka.',
      ti: 'ዓይኒ ንላዕሊ። ብርጭቆ ንላዕሊ። ጉንጭ። ዓይኒ እንደገና። እቲ ስርዓት እዩ።',
      tr: 'Gözler yukarı. Bardak yukarı. Bir yudum. Yeniden gözler. Protokol bu.',
      uk: 'Очі вгору. Келих вгору. Ковток. Знову очі. Такий протокол.',
    },
    lagomToast: {
      en: '👌 Lagom.',
      sv: '👌 Lagom.',
      'zh-Hans': '👌 刚刚好。',
      'zh-Hant': '👌 剛剛好。',
      ar: '👌 باعتدال.',
      ckb: '👌 بە ئەندازە.',
      fa: '👌 درست به اندازه.',
      pl: '👌 W sam raz.',
      so: '👌 Dhexdhexaad.',
      ti: '👌 ብመጠን።',
      tr: '👌 Tam kararında.',
      uk: '👌 Саме в міру.',
    },
    lagomBuddy: {
      en: 'Not too much. Not too little. Just right.',
      sv: 'Inte för mycket. Inte för lite. Precis lagom.',
      'zh-Hans': '不太多。不太少。刚刚好。',
      'zh-Hant': '不太多。不太少。剛剛好。',
      ar: 'ليس كثيرًا. ليس قليلًا. تمامًا كما ينبغي.',
      ckb: 'نە زۆر. نە کەم. تەواو گونجاو.',
      fa: 'نه زیاد. نه کم. درست به اندازه.',
      pl: 'Nie za dużo. Nie za mało. W sam raz.',
      so: 'Ma badna. Ma yara. Waa ku filan.',
      ti: 'ብዙሕ ኣይኮነን። ውሑድ ኣይኮነን። ትኽክል መጠን።',
      tr: 'Ne fazla. Ne az. Tam kararında.',
      uk: 'Не забагато. Не замало. Саме так.',
    },
    cheatsheetClose: {
      en: 'Close',
      sv: 'Stäng',
      'zh-Hans': '关闭',
      'zh-Hant': '關閉',
      ar: 'إغلاق',
      ckb: 'داخستن',
      fa: 'بستن',
      pl: 'Zamknij',
      so: 'Xir',
      ti: 'ዕጾ',
      tr: 'Kapat',
      uk: 'Закрити',
    },
    cheatsheetTitle: {
      en: 'Hidden things',
      sv: 'Gömda saker',
      'zh-Hans': '隐藏彩蛋',
      'zh-Hant': '隱藏彩蛋',
      ar: 'أشياء مخفية',
      ckb: 'شتە شاراوەکان',
      fa: 'چیزهای پنهان',
      pl: 'Ukryte funkcje',
      so: 'Waxyaabo qarsoon',
      ti: 'ዝተሓብኡ ነገራት',
      tr: 'Gizli şeyler',
      uk: 'Приховані речі',
    },
    cheatsheetOr: {
      en: 'or',
      sv: 'eller',
      'zh-Hans': '或',
      'zh-Hant': '或',
      ar: 'أو',
      ckb: 'یان',
      fa: 'یا',
      pl: 'albo',
      so: 'ama',
      ti: 'ወይ',
      tr: 'veya',
      uk: 'або',
    },
    cheatsheetFika: {
      en: 'coffee break',
      sv: 'fikapaus',
      'zh-Hans': '咖啡休息',
      'zh-Hant': '咖啡休息',
      ar: 'استراحة قهوة',
      ckb: 'پشووی قاوە',
      fa: 'استراحت قهوه',
      pl: 'przerwa na kawę',
      so: 'nasasho kafee',
      ti: 'ናይ ቡን ዕረፍቲ',
      tr: 'kahve molası',
      uk: 'кавова перерва',
    },
    cheatsheetAbba: {
      en: 'disco',
      sv: 'disco',
      'zh-Hans': '迪斯科',
      'zh-Hant': '迪斯可',
      ar: 'ديسكو',
      ckb: 'دیسکۆ',
      fa: 'دیسکو',
      pl: 'dyskoteka',
      so: 'disco',
      ti: 'ዲስኮ',
      tr: 'disko',
      uk: 'диско',
    },
    cheatsheetSnow: {
      en: 'winter',
      sv: 'vinter',
      'zh-Hans': '冬天',
      'zh-Hant': '冬天',
      ar: 'الشتاء',
      ckb: 'زستان',
      fa: 'زمستان',
      pl: 'zima',
      so: 'jiilaal',
      ti: 'ክረምቲ',
      tr: 'kış',
      uk: 'зима',
    },
    cheatsheetVasa: {
      en: 'a ship sails by',
      sv: 'ett skepp seglar förbi',
      'zh-Hans': '一艘船驶过',
      'zh-Hant': '一艘船駛過',
      ar: 'سفينة تمرّ',
      ckb: 'کەشتییەک تێدەپەڕێت',
      fa: 'یک کشتی عبور می‌کند',
      pl: 'statek przepływa obok',
      so: 'markab ayaa ag mara',
      ti: 'መርከብ ትሓልፍ',
      tr: 'bir gemi geçer',
      uk: 'корабель пропливає повз',
    },
    cheatsheetIkea: {
      en: 'some assembly required',
      sv: 'lite montering krävs',
      'zh-Hans': '需要一点组装',
      'zh-Hant': '需要一點組裝',
      ar: 'يحتاج إلى بعض التركيب',
      ckb: 'کەمێک کۆکردنەوەی پێویستە',
      fa: 'کمی سرهم‌بندی لازم است',
      pl: 'wymaga trochę montażu',
      so: 'wax yar ayaa la isku xirayaa',
      ti: 'ገለ ምትካል የድሊ',
      tr: 'biraz montaj gerekir',
      uk: 'потрібне трохи складання',
    },
    cheatsheetSkal: {
      en: 'cheers',
      sv: 'skål',
      'zh-Hans': '干杯',
      'zh-Hant': '乾杯',
      ar: 'بصحتك',
      ckb: 'بەخۆشی',
      fa: 'به سلامتی',
      pl: 'na zdrowie',
      so: 'hambalyo',
      ti: 'ንጥዕና',
      tr: 'şerefe',
      uk: 'будьмо',
    },
    cheatsheetLagom: {
      en: 'just right',
      sv: 'precis lagom',
      'zh-Hans': '刚刚好',
      'zh-Hant': '剛剛好',
      ar: 'تمامًا كما ينبغي',
      ckb: 'تەواو گونجاو',
      fa: 'درست به اندازه',
      pl: 'w sam raz',
      so: 'ku filan',
      ti: 'ትኽክል መጠን',
      tr: 'tam kararında',
      uk: 'саме в міру',
    },
    cheatsheetBrand: {
      en: 'click brand logo',
      sv: 'klicka på logotypen',
      'zh-Hans': '点击品牌标志',
      'zh-Hant': '點擊品牌標誌',
      ar: 'انقر شعار التطبيق',
      ckb: 'کلیک لە لۆگۆی بەرنامەکە بکە',
      fa: 'روی نشان برنامه کلیک کن',
      pl: 'kliknij logo aplikacji',
      so: 'guji astaanta app-ka',
      ti: 'ሎጎ ናይቲ መተግበሪ ጠውቕ',
      tr: 'uygulama logosuna tıkla',
      uk: 'натисни логотип застосунку',
    },
    cheatsheetFlag: {
      en: 'flag',
      sv: 'flagga',
      'zh-Hans': '旗帜',
      'zh-Hant': '旗幟',
      ar: 'العلم',
      ckb: 'ئاڵا',
      fa: 'پرچم',
      pl: 'flaga',
      so: 'calan',
      ti: 'ባንዴራ',
      tr: 'bayrak',
      uk: 'прапор',
    },
    cheatsheetQuiet: {
      en: 'click anywhere quiet',
      sv: 'klicka på en lugn yta',
      'zh-Hans': '点击页面空白处',
      'zh-Hant': '點擊頁面空白處',
      ar: 'انقر في مكان هادئ من الصفحة',
      ckb: 'لە شوێنێکی ئارامی پەڕەکە کلیک بکە',
      fa: 'روی جای خلوت صفحه کلیک کن',
      pl: 'kliknij spokojne miejsce strony',
      so: 'guji meel deggan oo bogga ah',
      ti: 'ኣብ ጸጥ ዝበለ ቦታ ናይ ገጽ ጠውቕ',
      tr: 'sayfada sakin bir yere tıkla',
      uk: 'натисни спокійне місце сторінки',
    },
    cheatsheetFact: {
      en: 'Sweden fact',
      sv: 'Sverige-fakta',
      'zh-Hans': '瑞典小知识',
      'zh-Hant': '瑞典小知識',
      ar: 'معلومة عن السويد',
      ckb: 'زانیارییەک دەربارەی سوێد',
      fa: 'نکته‌ای درباره سوئد',
      pl: 'ciekawostka o Szwecji',
      so: 'xog ku saabsan Iswiidhan',
      ti: 'ሓቂ ብዛዕባ ሽወደን',
      tr: 'İsveç bilgisi',
      uk: 'факт про Швецію',
    },
    cheatsheetSwedenMode: {
      en: 'Sweden mode',
      sv: 'Sverige-läge',
      'zh-Hans': '瑞典模式',
      'zh-Hant': '瑞典模式',
      ar: 'وضع السويد',
      ckb: 'دۆخی سوێد',
      fa: 'حالت سوئد',
      pl: 'tryb Szwecji',
      so: 'habka Iswiidhan',
      ti: 'ሞድ ሽወደን',
      tr: 'İsveç modu',
      uk: 'режим Швеції',
    },
    cheatsheetToggle: {
      en: 'toggle this',
      sv: 'visa eller dölj detta',
      'zh-Hans': '显示或隐藏这个面板',
      'zh-Hant': '顯示或隱藏這個面板',
      ar: 'إظهار أو إخفاء هذه اللوحة',
      ckb: 'ئەم پەنجەرەیە پیشان بدە یان بشارەوە',
      fa: 'این پنل را نشان بده یا پنهان کن',
      pl: 'pokaż lub ukryj ten panel',
      so: 'muuji ama qari sanduuqan',
      ti: 'ነዚ ፓነል ኣርእይ ወይ ሕባእ',
      tr: 'bu paneli göster ya da gizle',
      uk: 'показати або сховати цю панель',
    },
    cheatsheetFoot: {
      en: 'Hej hej - Swedish secrets unlocked.',
      sv: 'Hej hej - svenska hemlisar upplåsta.',
      'zh-Hans': 'Hej hej，瑞典小秘密已开启。',
      'zh-Hant': 'Hej hej，瑞典小秘密已開啟。',
      ar: 'Hej hej - انفتحت الأسرار السويدية الصغيرة.',
      ckb: 'Hej hej - نهێنییە بچووکەکانی سوێد کرانەوە.',
      fa: 'Hej hej - رازهای کوچک سوئدی باز شد.',
      pl: 'Hej hej - szwedzkie sekrety odblokowane.',
      so: 'Hej hej - siraha yar ee Iswiidhan waa furmeen.',
      ti: 'Hej hej - ናይ ሽወደን ንኣሽቱ ምስጢራት ተኸፊቶም።',
      tr: 'Hej hej - İsveç sırları açıldı.',
      uk: 'Hej hej - шведські секрети відкрито.',
    },
    swedenModeToast: {
      en: 'Sweden mode. Hej hej.',
      sv: 'Sverige-läge. Hej hej.',
      'zh-Hans': '瑞典模式。Hej hej。',
      'zh-Hant': '瑞典模式。Hej hej。',
      ar: 'وضع السويد. Hej hej.',
      ckb: 'دۆخی سوێد. Hej hej.',
      fa: 'حالت سوئد. Hej hej.',
      pl: 'Tryb Szwecji. Hej hej.',
      so: 'Habka Iswiidhan. Hej hej.',
      ti: 'ሞድ ሽወደን። Hej hej.',
      tr: 'İsveç modu. Hej hej.',
      uk: 'Режим Швеції. Hej hej.',
    },
    swedenModeActivated: {
      en: 'Sweden mode activated.',
      sv: 'Sverige-läge aktiverat.',
      'zh-Hans': '瑞典模式已开启。',
      'zh-Hant': '瑞典模式已開啟。',
      ar: 'تم تفعيل وضع السويد.',
      ckb: 'دۆخی سوێد چالاک کرا.',
      fa: 'حالت سوئد فعال شد.',
      pl: 'Tryb Szwecji włączony.',
      so: 'Habka Iswiidhan waa la hawlgeliyay.',
      ti: 'ሞድ ሽወደን ተነቓቒሑ።',
      tr: 'İsveç modu etkinleştirildi.',
      uk: 'Режим Швеції ввімкнено.',
    },
    facts: [
      {
        en: 'Spotify, Skype, Minecraft, and Klarna were all started in Sweden.',
        sv: 'Spotify, Skype, Minecraft och Klarna startade alla i Sverige.',
        'zh-Hans': 'Spotify、Skype、Minecraft 和 Klarna 都起源于瑞典。',
        'zh-Hant': 'Spotify、Skype、Minecraft 和 Klarna 都起源於瑞典。',
        ar: 'بدأت Spotify وSkype وMinecraft وKlarna كلها في السويد.',
        ckb: 'Spotify و Skype و Minecraft و Klarna هەموویان لە سوێد دەستیان پێکرد.',
        fa: 'Spotify، Skype، Minecraft و Klarna همگی در سوئد شروع شدند.',
        pl: 'Spotify, Skype, Minecraft i Klarna powstały w Szwecji.',
        so: 'Spotify, Skype, Minecraft iyo Klarna dhammaantood waxay ka bilowdeen Iswiidhan.',
        ti: 'Spotify, Skype, Minecraft እና Klarna ኩሎም ኣብ ሽወደን ጀሚሮም።',
        tr: 'Spotify, Skype, Minecraft ve Klarna İsveç’te başladı.',
        uk: 'Spotify, Skype, Minecraft і Klarna почалися у Швеції.',
      },
      {
        en: 'Sweden has been at peace since 1814.',
        sv: 'Sverige har varit i fred sedan 1814.',
        'zh-Hans': '瑞典自 1814 年以来一直处于和平状态。',
        'zh-Hant': '瑞典自 1814 年以來一直處於和平狀態。',
        ar: 'تعيش السويد في سلام منذ عام 1814.',
        ckb: 'سوێد لە ساڵی ١٨١٤ەوە لە ئاشتیدایە.',
        fa: 'سوئد از سال ۱۸۱۴ در صلح بوده است.',
        pl: 'Szwecja żyje w pokoju od 1814 roku.',
        so: 'Iswiidhan nabad ayay ku jirtay tan iyo 1814.',
        ti: 'ሽወደን ካብ 1814 ጀሚራ ኣብ ሰላም ኣላ።',
        tr: 'İsveç 1814’ten beri barış içindedir.',
        uk: 'Швеція живе в мирі з 1814 року.',
      },
      {
        en: 'Sweden recycles ~99% of household waste.',
        sv: 'Sverige återvinner ~99% av hushållsavfallet.',
        'zh-Hans': '瑞典回收约 99% 的生活垃圾。',
        'zh-Hant': '瑞典回收約 99% 的生活垃圾。',
        ar: 'تعيد السويد تدوير نحو 99% من نفايات المنازل.',
        ckb: 'سوێد نزیکەی ٩٩٪ی پاشماوەی ماڵان دووبارە بەکاردەهێنێتەوە.',
        fa: 'سوئد حدود ۹۹٪ زباله خانگی را بازیافت می‌کند.',
        pl: 'Szwecja odzyskuje około 99% odpadów domowych.',
        so: 'Iswiidhan waxay dib u isticmaashaa ku dhowaad 99% qashinka guryaha.',
        ti: 'ሽወደን ኣስታት 99% ናይ ገዛ ጎሓፍ ዳግም ትጥቀመሉ።',
        tr: 'İsveç evsel atıkların yaklaşık %99’unu geri dönüştürür.',
        uk: 'Швеція переробляє близько 99% побутових відходів.',
      },
      {
        en: '~96,000 lakes. 200,000 islands.',
        sv: '~96 000 sjöar. 200 000 öar.',
        'zh-Hans': '约 96,000 个湖泊。200,000 个岛屿。',
        'zh-Hant': '約 96,000 個湖泊。200,000 個島嶼。',
        ar: 'نحو 96,000 بحيرة. 200,000 جزيرة.',
        ckb: 'نزیکەی ٩٦,٠٠٠ دەریاچە. ٢٠٠,٠٠٠ دوورگە.',
        fa: 'حدود ۹۶٬۰۰۰ دریاچه. ۲۰۰٬۰۰۰ جزیره.',
        pl: 'Około 96 000 jezior. 200 000 wysp.',
        so: 'Ku dhowaad 96,000 haro. 200,000 jasiiradood.',
        ti: 'ኣስታት 96,000 ቀላያት። 200,000 ደሴታት።',
        tr: 'Yaklaşık 96.000 göl. 200.000 ada.',
        uk: 'Близько 96 000 озер. 200 000 островів.',
      },
      {
        en: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        sv: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        'zh-Hans': 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd。',
        'zh-Hant': 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd。',
        ar: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        ckb: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        fa: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        pl: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        so: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        ti: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        tr: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
        uk: 'IKEA = Ingvar Kamprad + Elmtaryd + Agunnaryd.',
      },
      {
        en: '480 days of paid parental leave per child.',
        sv: '480 dagar betald föräldraledighet per barn.',
        'zh-Hans': '每个孩子有 480 天带薪育儿假。',
        'zh-Hant': '每個孩子有 480 天帶薪育兒假。',
        ar: '480 يومًا من إجازة الوالدين المدفوعة لكل طفل.',
        ckb: '٤٨٠ ڕۆژ مۆڵەتی دایک و باوکی پارەدراو بۆ هەر منداڵێک.',
        fa: '۴۸۰ روز مرخصی والدین با حقوق برای هر کودک.',
        pl: '480 dni płatnego urlopu rodzicielskiego na dziecko.',
        so: '480 maalmood oo fasax waalidnimo lacag leh ilmo kasta.',
        ti: 'ንነፍሲ ወከፍ ቆልዓ 480 መዓልቲ ዝኽፈል ናይ ወለዲ ዕረፍቲ።',
        tr: 'Çocuk başına 480 gün ücretli ebeveyn izni.',
        uk: '480 днів оплачуваної батьківської відпустки на дитину.',
      },
      {
        en: 'Volvo invented the three-point seatbelt and gave the patent away.',
        sv: 'Volvo uppfann trepunktsbältet och gav bort patentet.',
        'zh-Hans': '沃尔沃发明了三点式安全带，并开放了专利。',
        'zh-Hant': 'Volvo 發明了三點式安全帶，並開放了專利。',
        ar: 'اخترعت فولفو حزام الأمان ثلاثي النقاط وتخلّت عن براءة الاختراع.',
        ckb: 'Volvo پشتێنی سێ خاڵی داهێنا و پاتێنتەکەی بەخشی.',
        fa: 'ولوو کمربند ایمنی سه‌نقطه‌ای را اختراع کرد و حق ثبت آن را آزاد گذاشت.',
        pl: 'Volvo wynalazło trzypunktowe pasy i udostępniło patent.',
        so: 'Volvo waxay hindistay suunka saddexda dhibcood, patent-kana way siisay dadka.',
        ti: 'Volvo ሰለስተ ነጥቢ ዘለዎ መቐነት ድሕነት ፈጢራ፣ ፓተንቱ ድማ ሂባቶ።',
        tr: 'Volvo üç noktalı emniyet kemerini icat etti ve patentini paylaştı.',
        uk: 'Volvo винайшла триточковий ремінь безпеки й відкрила патент.',
      },
    ],
  };

  function extrasText(key) {
    const copy = EXTRAS_COPY[key];
    return (copy && (copy[lang()] || copy.en)) || '';
  }

  function extrasBuddy(key) {
    if (!window.smtBuddyCelebrate) return;
    const text = extrasText(key);
    window.smtBuddyCelebrate(text, text);
  }

  function prefersReducedMotion() {
    const fx = window.smtFx;
    if (fx && typeof fx.prefersReducedMotion === 'function') return fx.prefersReducedMotion();
    return document.documentElement.getAttribute('data-motion') === 'reduce';
  }
  function isTyping() {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  }

  // ---------- Type-a-word easter eggs ----------

  const WORDS = {
    fika: fikaEgg,
    abba: abbaEgg,
    snö: snowEgg,
    snow: snowEgg,
    vasa: vasaEgg,
    ikea: ikeaEgg,
    skål: skalEgg,
    skol: skalEgg,
    lagom: lagomEgg,
  };
  const MAX_LEN = 5; // longest trigger length
  let buf = '';
  document.addEventListener('keydown', (e) => {
    if (isTyping()) return;
    // "?" cheatsheet
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      toggleCheatsheet();
      return;
    }
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-MAX_LEN);
    for (const w in WORDS) {
      if (buf.endsWith(w)) {
        WORDS[w]();
        buf = '';
        return;
      }
    }
  });

  // ---------- Individual eggs ----------

  function fikaEgg() {
    const fx = window.smtFx;
    if (fx) {
      const cx = innerWidth * 0.5,
        cy = innerHeight * 0.3;
      fx.burst(cx, cy, { colors: ['#8a5a2b', '#5a3416', '#fff', '#fecc00'], count: 30 });
      fx.toast(extrasText('fikaToast'), { duration: 2200 });
    }
    if (window.smtBuddyCelebrate) extrasBuddy('fikaBuddy');
  }

  function abbaEgg() {
    // disco rainbow confetti from center top
    const fx = window.smtFx;
    if (fx) {
      const cols = ['#ff3d8c', '#ff8c1a', '#fecc00', '#3eda9a', '#3aa7ff', '#b46cf4', '#fff'];
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          fx.burst(innerWidth * (0.2 + Math.random() * 0.6), 80 + Math.random() * 100, {
            colors: cols,
            count: 40,
            spread: 240,
          });
        }, i * 220);
      }
      fx.toast(extrasText('abbaToast'), { flavor: 'win', duration: 2800 });
    }
    if (window.smtBuddyCelebrate) extrasBuddy('abbaBuddy');
  }

  function snowEgg() {
    if (document.getElementById('smt-snow')) return; // already running
    if (prefersReducedMotion()) {
      if (window.smtFx) window.smtFx.toast(extrasText('snowToast'), { duration: 2200 });
      if (window.smtBuddyCelebrate) extrasBuddy('snowBuddy');
      return;
    }
    const layer = document.createElement('div');
    layer.id = 'smt-snow';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:94;overflow:hidden';
    document.body.appendChild(layer);
    const flakes = ['❄', '❅', '❆', '·', '*'];
    const N = 60;
    for (let i = 0; i < N; i++) {
      const f = document.createElement('span');
      f.textContent = flakes[Math.floor(Math.random() * flakes.length)];
      const size = 10 + Math.random() * 16;
      const x = Math.random() * innerWidth;
      const dx = (Math.random() - 0.5) * 160;
      const dur = 5500 + Math.random() * 4500;
      const delay = Math.random() * 4000;
      f.style.cssText = `
        position:absolute; left:${x}px; top:-30px;
        color: rgba(255,255,255,${0.55 + Math.random() * 0.35});
        font-size:${size}px;
        text-shadow: 0 1px 2px rgba(0,80,160,.4);
        will-change: transform, opacity;
      `;
      layer.appendChild(f);
      f.animate(
        [
          { transform: 'translate(0,0) rotate(0)', opacity: 0 },
          {
            transform: `translate(${dx * 0.3}px,${innerHeight * 0.3}px) rotate(80deg)`,
            opacity: 1,
            offset: 0.2,
          },
          { transform: `translate(${dx}px,${innerHeight + 40}px) rotate(360deg)`, opacity: 0 },
        ],
        { duration: dur, delay, easing: 'cubic-bezier(.3,.4,.5,1)' },
      ).onfinish = () => f.remove();
    }
    if (window.smtFx) window.smtFx.toast(extrasText('snowToast'), { duration: 2200 });
    if (window.smtBuddyCelebrate) extrasBuddy('snowBuddy');
    setTimeout(() => layer.remove(), 11000);
  }

  function vasaEgg() {
    if (document.getElementById('smt-vasa')) return;
    if (prefersReducedMotion()) {
      if (window.smtFx) window.smtFx.toast(extrasText('vasaToast'), { duration: 2200 });
      if (window.smtBuddyCelebrate) extrasBuddy('vasaBuddy');
      return;
    }
    const ship = document.createElement('div');
    ship.id = 'smt-vasa';
    ship.innerHTML = `
      <svg viewBox="0 0 220 140" width="180" height="115" aria-hidden="true">
        <line x1="60" y1="20" x2="60" y2="80" stroke="#3a2510" stroke-width="3"/>
        <line x1="120" y1="14" x2="120" y2="80" stroke="#3a2510" stroke-width="3"/>
        <path d="M60 20L90 60L60 60Z" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
        <path d="M120 14L160 60L120 60Z" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
        <path d="M60 20L34 60L60 60Z" fill="#f3ebd6" stroke="#0b1f33" stroke-width="1"/>
        <rect x="100" y="28" width="22" height="18" fill="#006aa7"/>
        <line x1="108" y1="28" x2="108" y2="46" stroke="#fecc00" stroke-width="1.5"/>
        <line x1="100" y1="36" x2="122" y2="36" stroke="#fecc00" stroke-width="1.5"/>
        <path d="M14 80L206 80L188 110L32 110Z" fill="#6b4520" stroke="#0b1f33" stroke-width="1"/>
        <line x1="30" y1="95" x2="190" y2="95" stroke="#4a3018" stroke-width="1"/>
        <g fill="#0b1f33"><circle cx="50" cy="98" r="2"/><circle cx="80" cy="98" r="2"/><circle cx="110" cy="98" r="2"/><circle cx="140" cy="98" r="2"/><circle cx="170" cy="98" r="2"/></g>
      </svg>
    `;
    ship.style.cssText = `
      position: fixed;
      left: -200px; bottom: 18px;
      z-index: 93; pointer-events: none;
      transform-origin: 50% 100%;
      filter: drop-shadow(0 6px 8px rgba(0,30,60,.25));
    `;
    document.body.appendChild(ship);
    // sail across, then sink
    ship.animate(
      [
        { transform: 'translate(0,0) rotate(0)' },
        { transform: `translate(${innerWidth * 0.7}px, 0) rotate(0)`, offset: 0.7 },
        { transform: `translate(${innerWidth * 0.7}px, 60px) rotate(-25deg)`, offset: 0.9 },
        { transform: `translate(${innerWidth * 0.72}px, 200px) rotate(-50deg)`, opacity: 0 },
      ],
      { duration: 14000, easing: 'cubic-bezier(.42,.05,.7,1)' },
    ).onfinish = () => ship.remove();
    if (window.smtFx) window.smtFx.toast(extrasText('vasaToast'), { duration: 2200 });
    if (window.smtBuddyCelebrate) extrasBuddy('vasaBuddy');
  }

  function ikeaEgg() {
    if (window.smtFx) {
      window.smtFx.toast(extrasText('ikeaToast'), { duration: 2400 });
    }
    if (window.smtBuddyCelebrate) extrasBuddy('ikeaBuddy');
  }

  function skalEgg() {
    if (window.smtFx) {
      const cx = innerWidth * 0.5,
        cy = innerHeight * 0.3;
      window.smtFx.burst(cx, cy, { colors: ['#fecc00', '#fff', '#fff3cf'], count: 24 });
      window.smtFx.toast(extrasText('skalToast'), { duration: 1800 });
    }
    if (window.smtBuddyCelebrate) extrasBuddy('skalBuddy');
  }

  function lagomEgg() {
    if (window.smtFx) window.smtFx.toast(extrasText('lagomToast'), { duration: 1800 });
    if (window.smtBuddyCelebrate) extrasBuddy('lagomBuddy');
  }

  // ---------- Click brand logo 5× → flag flutter ----------

  let brandClicks = 0;
  let brandClickTimer = null;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.brand, .footer__brand')) return;
    brandClicks++;
    clearTimeout(brandClickTimer);
    brandClickTimer = setTimeout(() => {
      brandClicks = 0;
    }, 1500);
    if (brandClicks >= 5) {
      brandClicks = 0;
      flagFlutter();
    }
  });
  function flagFlutter() {
    if (prefersReducedMotion()) {
      if (window.smtFx) window.smtFx.toast(extrasText('swedenModeToast'), { duration: 1800 });
      if (window.smtBuddyCelebrate) extrasBuddy('swedenModeToast');
      return;
    }
    const flag = document.createElement('div');
    flag.style.cssText = `
      position: fixed; top: 40%; left: 50%;
      width: 240px; height: 150px;
      transform: translate(-50%, -50%);
      z-index: 96; pointer-events: none;
      background: #006aa7;
      box-shadow: 0 30px 80px -20px rgba(0,30,60,.45);
    `;
    flag.innerHTML = `
      <div style="position:absolute;top:0;bottom:0;left:88px;width:28px;background:#fecc00"></div>
      <div style="position:absolute;left:0;right:0;top:55px;height:28px;background:#fecc00"></div>
    `;
    document.body.appendChild(flag);
    flag.animate(
      [
        { transform: 'translate(-50%, -50%) scale(.3) rotate(-12deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, -50%) scale(1.04) rotate(2deg) skewX(-3deg)', offset: 0.55 },
        { transform: 'translate(-50%, -50%) scale(1.02) rotate(-1deg) skewX(2deg)', offset: 0.85 },
        { transform: 'translate(-50%, -50%) scale(.95) rotate(0deg)', opacity: 0 },
      ],
      { duration: 2200, easing: 'cubic-bezier(.3,.7,.4,1)' },
    ).onfinish = () => flag.remove();
    if (window.smtFx) window.smtFx.rain({ colors: ['#006aa7', '#fecc00'], count: 80 });
    if (window.smtBuddyCelebrate) extrasBuddy('swedenModeToast');
  }

  // ---------- Konami → flag rain (kept from before) ----------

  const SEQ = [
    'arrowup',
    'arrowup',
    'arrowdown',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'arrowleft',
    'arrowright',
    'b',
    'a',
  ];
  let kbuf = [];
  document.addEventListener('keydown', (e) => {
    if (isTyping()) return;
    kbuf.push(e.key.toLowerCase());
    if (kbuf.length > SEQ.length) kbuf.shift();
    if (kbuf.join(',') === SEQ.join(',')) {
      if (window.smtFx) window.smtFx.rain({ colors: ['#006aa7', '#fecc00'], count: 160 });
      if (window.smtBuddyCelebrate) extrasBuddy('swedenModeActivated');
      kbuf = [];
    }
  });

  // ---------- Triple-click → random Sweden fact ----------

  let clicks = 0;
  let clickTimer = null;
  document.addEventListener('click', (e) => {
    // skip clicks on real interactive elements
    if (
      e.target.closest(
        'a, button, input, label, summary, .qopt, .quiz__opt, .nav, .modal, .dala-buddy',
      )
    )
      return;
    clicks++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      clicks = 0;
    }, 600);
    if (clicks >= 3) {
      clicks = 0;
      const facts = EXTRAS_COPY.facts;
      const f = facts[Math.floor(Math.random() * facts.length)];
      if (window.smtFx) window.smtFx.toast(`💡 ${f[lang()] || f.en}`, { duration: 4200 });
    }
  });

  // ---------- "?" — easter eggs cheatsheet ----------

  function toggleCheatsheet() {
    let el = document.getElementById('smt-cheats');
    if (el) {
      el.remove();
      return;
    }
    el = document.createElement('div');
    el.id = 'smt-cheats';
    el.innerHTML = `
      <div class="cheats__panel">
        <button class="cheats__close" aria-label="${extrasText('cheatsheetClose')}">✕</button>
        <h3>${extrasText('cheatsheetTitle')}</h3>
        <ul>
          <li><kbd>fika</kbd> — ${extrasText('cheatsheetFika')}</li>
          <li><kbd>abba</kbd> — ${extrasText('cheatsheetAbba')}</li>
          <li><kbd>snö</kbd> ${extrasText('cheatsheetOr')} <kbd>snow</kbd> — ${extrasText('cheatsheetSnow')}</li>
          <li><kbd>vasa</kbd> — ${extrasText('cheatsheetVasa')}</li>
          <li><kbd>ikea</kbd> — ${extrasText('cheatsheetIkea')}</li>
          <li><kbd>skål</kbd> — ${extrasText('cheatsheetSkal')}</li>
          <li><kbd>lagom</kbd> — ${extrasText('cheatsheetLagom')}</li>
          <li><b>5×</b> ${extrasText('cheatsheetBrand')} — ${extrasText('cheatsheetFlag')}</li>
          <li><b>3×</b> ${extrasText('cheatsheetQuiet')} — ${extrasText('cheatsheetFact')}</li>
          <li><kbd>↑↑↓↓←→←→ b a</kbd> — ${extrasText('cheatsheetSwedenMode')}</li>
          <li><kbd>?</kbd> — ${extrasText('cheatsheetToggle')}</li>
        </ul>
        <p class="cheats__foot">${extrasText('cheatsheetFoot')}</p>
      </div>
    `;
    el.style.cssText =
      'position:fixed;inset:0;z-index:101;display:grid;place-items:center;background:rgba(11,31,51,.55);backdrop-filter:blur(4px);animation:smt-cheats-in .18s ease-out';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('.cheats__close')) el.remove();
    });
  }

  // ---------- Smooth in-page anchors ----------

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (h.length <= 1) return;
    if (h.startsWith('#/')) return;
    const target = document.querySelector(h);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('DOMContentLoaded', setupReveal);
})();
