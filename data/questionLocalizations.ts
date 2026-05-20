import { localeCodes, type LocaleCode } from '../lib/i18n/locales';
import type { LocalizedContentText, PracticeQuestion } from '../types/content';

type LocalizedTargetText = Partial<Record<LocaleCode, string>>;

type QuestionLocalization = {
  questionText: LocalizedTargetText;
  options: Record<string, LocalizedTargetText>;
  explanationText: LocalizedTargetText;
};

export const QUESTION_LOCALIZATION_PILOT_IDS = [
  'q001',
  'q002',
  'q003',
  'q004',
  'q005',
  'q006',
] as const;

export const questionLocalizationPilot: Record<
  (typeof QUESTION_LOCALIZATION_PILOT_IDS)[number],
  QuestionLocalization
> = {
  q001: {
    questionText: {
      'zh-Hant': '瑞典位於哪裡？',
      'zh-Hans': '瑞典位于哪里？',
      ar: 'أين تقع السويد؟',
      ckb: 'سوید لە کوێیە؟',
      fa: 'سوئد کجا قرار دارد؟',
      pl: 'Gdzie leży Szwecja?',
      so: 'Iswiidhan xaggee ku taallaa?',
      ti: 'ሽወደን ኣበይ ትርከብ?',
      tr: 'İsveç nerede bulunur?',
      uk: 'Де розташована Швеція?',
    },
    options: {
      a: {
        'zh-Hant': '位於北歐的北歐地區',
        'zh-Hans': '位于北欧的北欧地区',
        ar: 'في منطقة الشمال الأوروبي في شمال أوروبا',
        ckb: 'لە ناوچەی نۆردیک لە باکووری ئەوروپا',
        fa: 'در منطقه نوردیک در شمال اروپا',
        pl: 'W regionie nordyckim w północnej Europie',
        so: 'Gobolka Nordic ee Waqooyiga Yurub',
        ti: 'ኣብ ናይ ኖርዲክ ክልል ኣብ ሰሜን ኤውሮጳ',
        tr: 'Kuzey Avrupa’daki Nordik bölgede',
        uk: 'У Північній Європі, у скандинавському регіоні',
      },
      b: {
        'zh-Hant': '位於南歐',
        'zh-Hans': '位于南欧',
        ar: 'في جنوب أوروبا',
        ckb: 'لە باشووری ئەوروپا',
        fa: 'در جنوب اروپا',
        pl: 'W południowej Europie',
        so: 'Koonfurta Yurub',
        ti: 'ኣብ ደቡብ ኤውሮጳ',
        tr: 'Güney Avrupa’da',
        uk: 'У Південній Європі',
      },
      c: {
        'zh-Hant': '位於西亞',
        'zh-Hans': '位于西亚',
        ar: 'في غرب آسيا',
        ckb: 'لە ڕۆژئاوای ئاسیا',
        fa: 'در غرب آسیا',
        pl: 'W zachodniej Azji',
        so: 'Galbeedka Aasiya',
        ti: 'ኣብ ምዕራብ ኤስያ',
        tr: 'Batı Asya’da',
        uk: 'У Західній Азії',
      },
      d: {
        'zh-Hant': '位於北美洲',
        'zh-Hans': '位于北美洲',
        ar: 'في أمريكا الشمالية',
        ckb: 'لە ئەمریکای باکوور',
        fa: 'در آمریکای شمالی',
        pl: 'W Ameryce Północnej',
        so: 'Waqooyiga Ameerika',
        ti: 'ኣብ ሰሜን ኣመሪካ',
        tr: 'Kuzey Amerika’da',
        uk: 'У Північній Америці',
      },
    },
    explanationText: {
      'zh-Hant': '瑞典位於北歐的北歐地區。北歐包括丹麥、芬蘭、冰島、挪威和瑞典，是北歐的一部分。',
      'zh-Hans':
        '瑞典位于北欧的北欧地区。北欧地区包括丹麦、芬兰、冰岛、挪威和瑞典，属于北欧的一部分。',
      ar: 'تقع السويد في منطقة الشمال الأوروبي في شمال أوروبا. وتشمل هذه المنطقة الدنمارك وفنلندا وآيسلندا والنرويج والسويد.',
      ckb: 'سوید لە ناوچەی نۆردیک لە باکووری ئەوروپا دەکەوێت. ئەم ناوچەیە دانمارک، فینلاند، ئایسلاند، نەرویج و سوید دەگرێتەوە.',
      fa: 'سوئد در منطقه نوردیک در شمال اروپا قرار دارد. این منطقه شامل دانمارک، فنلاند، ایسلند، نروژ و سوئد است.',
      pl: 'Szwecja leży w regionie nordyckim w północnej Europie. Region ten obejmuje Danię, Finlandię, Islandię, Norwegię i Szwecję.',
      so: 'Iswiidhan waxay ku taallaa gobolka Nordic ee Waqooyiga Yurub. Gobolkaas waxaa ka mid ah Denmark, Finland, Iceland, Norway iyo Iswiidhan.',
      ti: 'ሽወደን ኣብ ናይ ኖርዲክ ክልል ኣብ ሰሜን ኤውሮጳ ትርከብ። እዚ ክልል ዴንማርክ፣ ፊንላንድ፣ ኣይስላንድ፣ ኖርወይን ሽወደንን የጠቓልል።',
      tr: 'İsveç, Kuzey Avrupa’daki Nordik bölgede yer alır. Bu bölge Danimarka, Finlandiya, İzlanda, Norveç ve İsveç’i kapsar.',
      uk: 'Швеція розташована в Північній Європі, у скандинавському регіоні. До нього належать Данія, Фінляндія, Ісландія, Норвегія та Швеція.',
    },
  },
  q002: {
    questionText: {
      'zh-Hant': '瑞典最北端位於北極圈以北。',
      'zh-Hans': '瑞典最北端位于北极圈以北。',
      ar: 'يقع أقصى شمال السويد شمال الدائرة القطبية الشمالية.',
      ckb: 'باکوورترین بەشی سوید لە باکووری بازنەی جەمسەریی باکوورە.',
      fa: 'شمالی‌ترین بخش سوئد در شمال دایره قطب شمال قرار دارد.',
      pl: 'Najbardziej wysunięta na północ część Szwecji leży na północ od koła podbiegunowego.',
      so: 'Qaybta ugu waqooyi ee Iswiidhan waxay ka xigtaa waqooyiga xariiqda Arctic Circle.',
      ti: 'እቲ ናይ ሽወደን ብዝያዳ ሰሜናዊ ክፍሊ ካብ ዓውዲ ሰሜናዊ ፖላር ንሰሜን ይርከብ።',
      tr: 'İsveç’in en kuzeydeki bölümü Kuzey Kutup Dairesi’nin kuzeyindedir.',
      uk: 'Найпівнічніша частина Швеції розташована на північ від Полярного кола.',
    },
    options: {
      true: {
        'zh-Hant': '正確',
        'zh-Hans': '正确',
        ar: 'صحيح',
        ckb: 'ڕاستە',
        fa: 'درست',
        pl: 'Prawda',
        so: 'Sax',
        ti: 'ትኽክል',
        tr: 'Doğru',
        uk: 'Правда',
      },
      false: {
        'zh-Hant': '錯誤',
        'zh-Hans': '错误',
        ar: 'خطأ',
        ckb: 'هەڵەیە',
        fa: 'نادرست',
        pl: 'Fałsz',
        so: 'Khalad',
        ti: 'ጌጋ',
        tr: 'Yanlış',
        uk: 'Неправда',
      },
    },
    explanationText: {
      'zh-Hant': '瑞典最北端在北極圈以北，屬於北極地區。也就是說，瑞典北部延伸到北極圈以北的區域。',
      'zh-Hans': '瑞典最北端在北极圈以北，属于北极地区。也就是说，瑞典北部延伸到北极圈以北的区域。',
      ar: 'يقع أقصى شمال السويد شمال الدائرة القطبية الشمالية، في المنطقة القطبية. لذلك تمتد الأجزاء الشمالية من البلاد إلى المنطقة الواقعة شمال الدائرة القطبية الشمالية.',
      ckb: 'باکوورترین بەشی سوید لە باکووری بازنەی جەمسەریی باکوور، لە ناوچەی ئەرکتیکدایە. بۆیە باکووری وڵات دەگاتە ناوچەکانی باکووری ئەو بازنەیە.',
      fa: 'شمالی‌ترین بخش سوئد در شمال دایره قطب شمال و در منطقه قطبی قرار دارد. بنابراین شمال کشور تا ناحیه شمال دایره قطب شمال امتداد پیدا می‌کند.',
      pl: 'Najbardziej wysunięta na północ część Szwecji leży na północ od koła podbiegunowego, w obszarze arktycznym. Północ kraju sięga więc terenów położonych za kołem podbiegunowym.',
      so: 'Qaybta ugu waqooyi ee Iswiidhan waxay ka xigtaa waqooyiga Arctic Circle, gudaha aagga Arctic. Sidaas awgeed waqooyiga dalka wuxuu gaaraa dhulka ka sarreeya xariiqdaas.',
      ti: 'እቲ ብዝያዳ ሰሜናዊ ክፍሊ ሽወደን ኣብ ናይ ኣርክቲክ ክልል፣ ካብ ዓውዲ ሰሜናዊ ፖላር ንሰሜን ይርከብ። ስለዚ ሰሜናዊ ክፍሊ ሃገር ናብቲ ካብ ዓውዲ ፖላር ንሰሜን ዘሎ ክልል ይዝርጋሕ።',
      tr: 'İsveç’in en kuzey bölümü, Arktik bölgede Kuzey Kutup Dairesi’nin kuzeyindedir. Bu nedenle ülkenin kuzeyi bu dairenin kuzeyindeki alana kadar uzanır.',
      uk: 'Найпівнічніша частина Швеції лежить на північ від Полярного кола, в арктичній зоні. Отже, північ країни простягається в територію за Полярним колом.',
    },
  },
  q003: {
    questionText: {
      'zh-Hant': '從 Treriksröset 到 Smygehuk，瑞典南北大約有多長？',
      'zh-Hans': '从 Treriksröset 到 Smygehuk，瑞典南北大约有多长？',
      ar: 'ما المسافة التقريبية التي تمتد فيها السويد من Treriksröset إلى Smygehuk؟',
      ckb: 'سوید بە نزیکەیی چەند دوورە لە Treriksröset تا Smygehuk؟',
      fa: 'سوئد از Treriksröset تا Smygehuk تقریباً چه اندازه امتداد دارد؟',
      pl: 'Jaką mniej więcej długość ma Szwecja od Treriksröset do Smygehuk?',
      so: 'Qiyaastii intee ayuu dhererka Iswiidhan ka yahay Treriksröset ilaa Smygehuk?',
      ti: 'ሽወደን ካብ Treriksröset ክሳዕ Smygehuk ብግምት ክንደይ ትዝርጋሕ?',
      tr: 'İsveç, Treriksröset’ten Smygehuk’a kadar yaklaşık ne kadar uzanır?',
      uk: 'Приблизно на яку відстань простягається Швеція від Treriksröset до Smygehuk?',
    },
    options: {
      a: {
        'zh-Hant': '約 160 公里',
        'zh-Hans': '约 160 公里',
        ar: 'نحو 160 كيلومترًا',
        ckb: 'نزیکەی ١٦٠ کیلۆمەتر',
        fa: 'حدود ۱۶۰ کیلومتر',
        pl: 'Około 160 kilometrów',
        so: 'Qiyaastii 160 kiiloomitir',
        ti: 'ብግምት 160 ኪሎሜተር',
        tr: 'Yaklaşık 160 kilometre',
        uk: 'Близько 160 кілометрів',
      },
      b: {
        'zh-Hant': '約 1,600 公里',
        'zh-Hans': '约 1,600 公里',
        ar: 'نحو 1600 كيلومتر',
        ckb: 'نزیکەی ١٦٠٠ کیلۆمەتر',
        fa: 'حدود ۱۶۰۰ کیلومتر',
        pl: 'Około 1600 kilometrów',
        so: 'Qiyaastii 1,600 kiiloomitir',
        ti: 'ብግምት 1,600 ኪሎሜተር',
        tr: 'Yaklaşık 1600 kilometre',
        uk: 'Близько 1600 кілометрів',
      },
      c: {
        'zh-Hant': '約 16,000 公里',
        'zh-Hans': '约 16,000 公里',
        ar: 'نحو 16000 كيلومتر',
        ckb: 'نزیکەی ١٦٠٠٠ کیلۆمەتر',
        fa: 'حدود ۱۶۰۰۰ کیلومتر',
        pl: 'Około 16 000 kilometrów',
        so: 'Qiyaastii 16,000 kiiloomitir',
        ti: 'ብግምት 16,000 ኪሎሜተር',
        tr: 'Yaklaşık 16.000 kilometre',
        uk: 'Близько 16 000 кілометрів',
      },
      d: {
        'zh-Hant': '約 60 公里',
        'zh-Hans': '约 60 公里',
        ar: 'نحو 60 كيلومترًا',
        ckb: 'نزیکەی ٦٠ کیلۆمەتر',
        fa: 'حدود ۶۰ کیلومتر',
        pl: 'Około 60 kilometrów',
        so: 'Qiyaastii 60 kiiloomitir',
        ti: 'ብግምት 60 ኪሎሜተር',
        tr: 'Yaklaşık 60 kilometre',
        uk: 'Близько 60 кілометрів',
      },
    },
    explanationText: {
      'zh-Hant':
        '瑞典是狹長的國家，從北部的 Treriksröset 到南部的 Smygehuk 約 1,600 公里。160 和 60 公里太短，16,000 公里則太長。',
      'zh-Hans':
        '瑞典是狭长的国家，从北部的 Treriksröset 到南部的 Smygehuk 约 1,600 公里。160 和 60 公里太短，16,000 公里则太长。',
      ar: 'السويد بلد طويل وممتد؛ تبلغ المسافة من Treriksröset في الشمال إلى Smygehuk في الجنوب نحو 1600 كيلومتر. أما 160 و60 كيلومترًا فقصيرتان جدًا، و16000 كيلومتر طويلة جدًا.',
      ckb: 'سوید وڵاتێکی درێژە کە نزیکەی ١٦٠٠ کیلۆمەتر لە Treriksröset لە باکوورەوە تا Smygehuk لە باشوور درێژ دەبێتەوە. ١٦٠ و ٦٠ کیلۆمەتر زۆر کورتن، و ١٦٠٠٠ کیلۆمەتر زۆر درێژە.',
      fa: 'سوئد کشوری کشیده است که از Treriksröset در شمال تا Smygehuk در جنوب حدود ۱۶۰۰ کیلومتر امتداد دارد. ۱۶۰ و ۶۰ کیلومتر خیلی کوتاه‌اند و ۱۶۰۰۰ کیلومتر خیلی طولانی است.',
      pl: 'Szwecja jest długim, wydłużonym krajem i rozciąga się na około 1600 kilometrów od Treriksröset na północy do Smygehuk na południu. Odległości 160 i 60 kilometrów są za krótkie, a 16 000 kilometrów za długie.',
      so: 'Iswiidhan waa dal dheer oo dhuuban; waxay qiyaastii 1,600 kiiloomitir ka fidsan tahay Treriksröset ee waqooyiga ilaa Smygehuk ee koonfurta. 160 iyo 60 kiiloomitir aad bay u gaaban yihiin, 16,000 kiiloomitirna aad bay u dheer tahay.',
      ti: 'ሽወደን ነዊሕን ዝተዘርግሐን ሃገር እያ፣ ካብ Treriksröset ኣብ ሰሜን ክሳዕ Smygehuk ኣብ ደቡብ ብግምት 1,600 ኪሎሜተር ትዝርጋሕ። 160ን 60ን ኪሎሜተር ብዙሕ ሓጺር እዩ፣ 16,000 ኪሎሜተር ድማ ብዙሕ ነዊሕ እዩ።',
      tr: 'İsveç uzunlamasına uzanan bir ülkedir; kuzeydeki Treriksröset’ten güneydeki Smygehuk’a kadar yaklaşık 1600 kilometre uzanır. 160 ve 60 kilometre çok kısa, 16.000 kilometre ise çok uzundur.',
      uk: 'Швеція — витягнута країна, що простягається приблизно на 1600 кілометрів від Treriksröset на півночі до Smygehuk на півдні. 160 і 60 кілометрів — замало, а 16 000 кілометрів — забагато.',
    },
  },

  q004: {
    questionText: {
      'zh-Hant': '瑞典東海岸沿岸的海叫什麼？',
      'zh-Hans': '瑞典东海岸沿岸的海叫什么？',
      ar: 'ما اسم البحر على الساحل الشرقي للسويد؟',
      ckb: 'دەریای کەناری ڕۆژهەڵاتی سوید چییە؟',
      fa: 'دریای کنار ساحل شرقی سوئد چه نام دارد؟',
      pl: 'Jak nazywa się morze przy wschodnim wybrzeżu Szwecji?',
      so: 'Badda ku teedsan xeebta bari ee Iswiidhan maxaa la yiraahdaa?',
      ti: 'ኣብ ምብራቓዊ ገምገም ባሕሪ ሽወደን ዘሎ ባሕሪ እንታይ ይበሃል?',
      tr: 'İsveç’in doğu kıyısındaki denizin adı nedir?',
      uk: 'Як називається море біля східного узбережжя Швеції?',
    },
    options: {
      a: {
        'zh-Hant': '北海',
        'zh-Hans': '北海',
        ar: 'بحر الشمال',
        ckb: 'دەریای باکوور',
        fa: 'دریای شمال',
        pl: 'Morze Północne',
        so: 'Badda Waqooyi',
        ti: 'ሰሜናዊ ባሕሪ',
        tr: 'Kuzey Denizi',
        uk: 'Північне море',
      },
      b: {
        'zh-Hant': '地中海',
        'zh-Hans': '地中海',
        ar: 'البحر الأبيض المتوسط',
        ckb: 'دەریای ناوەڕاست',
        fa: 'دریای مدیترانه',
        pl: 'Morze Śródziemne',
        so: 'Badda Mediterranean',
        ti: 'ባሕሪ ሜዲተራንያን',
        tr: 'Akdeniz',
        uk: 'Середземне море',
      },
      c: {
        'zh-Hant': '波羅的海',
        'zh-Hans': '波罗的海',
        ar: 'بحر البلطيق',
        ckb: 'دەریای بەڵتیک',
        fa: 'دریای بالتیک',
        pl: 'Morze Bałtyckie',
        so: 'Badda Baltic',
        ti: 'ባሕሪ ባልቲክ',
        tr: 'Baltık Denizi',
        uk: 'Балтійське море',
      },
      d: {
        'zh-Hant': '大西洋',
        'zh-Hans': '大西洋',
        ar: 'المحيط الأطلسي',
        ckb: 'زەریای ئەتڵەسی',
        fa: 'اقیانوس اطلس',
        pl: 'Ocean Atlantycki',
        so: 'Badweynta Atlantic',
        ti: 'ውቅያኖስ ኣትላንቲክ',
        tr: 'Atlas Okyanusu',
        uk: 'Атлантичний океан',
      },
    },
    explanationText: {
      'zh-Hant': '瑞典東海岸沿岸的海是波羅的海。北海、地中海和大西洋都不是瑞典東海岸沿岸的海名。',
      'zh-Hans': '瑞典东海岸沿岸的海是波罗的海。北海、地中海和大西洋都不是瑞典东海岸沿岸的海名。',
      ar: 'البحر على الساحل الشرقي للسويد هو بحر البلطيق. أما بحر الشمال والبحر الأبيض المتوسط والمحيط الأطلسي فليست أسماء البحر الواقع على الساحل الشرقي للسويد.',
      ckb: 'دەریای کەناری ڕۆژهەڵاتی سوید دەریای بەڵتیکە. دەریای باکوور، دەریای ناوەڕاست و زەریای ئەتڵەسی ناوی ئەو دەریایە نین.',
      fa: 'دریای کنار ساحل شرقی سوئد دریای بالتیک است. دریای شمال، دریای مدیترانه و اقیانوس اطلس نام دریای کنار ساحل شرقی سوئد نیستند.',
      pl: 'Morze przy wschodnim wybrzeżu Szwecji to Morze Bałtyckie. Morze Północne, Morze Śródziemne i Ocean Atlantycki nie są morzem przy wschodnim wybrzeżu Szwecji.',
      so: 'Badda ku teedsan xeebta bari ee Iswiidhan waa Badda Baltic. Badda Waqooyi, Badda Mediterranean iyo Badweynta Atlantic ma aha magaca badda xeebta bari ee Iswiidhan.',
      ti: 'ኣብ ምብራቓዊ ገምገም ባሕሪ ሽወደን ዘሎ ባሕሪ ባልቲክ ይበሃል። ሰሜናዊ ባሕሪ፣ ባሕሪ ሜዲተራንያንን ውቅያኖስ ኣትላንቲክን ናይዚ ባሕሪ ስም ኣይኮኑን።',
      tr: 'İsveç’in doğu kıyısındaki deniz Baltık Denizi’dir. Kuzey Denizi, Akdeniz ve Atlas Okyanusu İsveç’in doğu kıyısındaki denizin adı değildir.',
      uk: 'Море біля східного узбережжя Швеції називається Балтійським морем. Північне море, Середземне море й Атлантичний океан не є морем біля східного узбережжя Швеції.',
    },
  },
  q005: {
    questionText: {
      'zh-Hant': '瑞典最大的兩座島是哪兩座？',
      'zh-Hans': '瑞典最大的两座岛是哪两座？',
      ar: 'ما أكبر جزيرتين في السويد؟',
      ckb: 'دوو گەورەترین دوورگەی سوید کامانەن؟',
      fa: 'دو جزیره بزرگ سوئد کدام‌اند؟',
      pl: 'Które wyspy są dwiema największymi wyspami Szwecji?',
      so: 'Jasiiradaha ugu waaweyn ee Iswiidhan waa kuwee?',
      ti: 'ክልተ ዝዓበያ ደሴታት ሽወደን ኣየኖት እየን?',
      tr: 'İsveç’in en büyük iki adası hangileridir?',
      uk: 'Які острови є двома найбільшими у Швеції?',
    },
    options: {
      a: {
        'zh-Hant': 'Gotland 和 Öland',
        'zh-Hans': 'Gotland 和 Öland',
        ar: 'Gotland و Öland',
        ckb: 'Gotland و Öland',
        fa: 'Gotland و Öland',
        pl: 'Gotlandia i Olandia',
        so: 'Gotland iyo Öland',
        ti: 'Gotlandን Ölandን',
        tr: 'Gotland ve Öland',
        uk: 'Готланд і Еланд',
      },
      b: {
        'zh-Hant': 'Hisingen 和 Orust',
        'zh-Hans': 'Hisingen 和 Orust',
        ar: 'Hisingen و Orust',
        ckb: 'Hisingen و Orust',
        fa: 'Hisingen و Orust',
        pl: 'Hisingen i Orust',
        so: 'Hisingen iyo Orust',
        ti: 'Hisingenን Orustን',
        tr: 'Hisingen ve Orust',
        uk: 'Hisingen і Orust',
      },
      c: {
        'zh-Hant': 'Värmdö 和 Tjörn',
        'zh-Hans': 'Värmdö 和 Tjörn',
        ar: 'Värmdö و Tjörn',
        ckb: 'Värmdö و Tjörn',
        fa: 'Värmdö و Tjörn',
        pl: 'Värmdö i Tjörn',
        so: 'Värmdö iyo Tjörn',
        ti: 'Värmdöን Tjörnን',
        tr: 'Värmdö ve Tjörn',
        uk: 'Värmdö і Tjörn',
      },
      d: {
        'zh-Hant': 'Malmö 和 Göteborg',
        'zh-Hans': 'Malmö 和 Göteborg',
        ar: 'Malmö و Göteborg',
        ckb: 'Malmö و Göteborg',
        fa: 'Malmö و Göteborg',
        pl: 'Malmö i Göteborg',
        so: 'Malmö iyo Göteborg',
        ti: 'Malmöን Göteborgን',
        tr: 'Malmö ve Göteborg',
        uk: 'Мальме і Гетеборг',
      },
    },
    explanationText: {
      'zh-Hant':
        '瑞典最大的兩座島是 Gotland 和 Öland。Hisingen、Orust、Värmdö 和 Tjörn 也是瑞典島嶼，但不是最大的兩座；Malmö 和 Göteborg 是城市。',
      'zh-Hans':
        '瑞典最大的两座岛是 Gotland 和 Öland。Hisingen、Orust、Värmdö 和 Tjörn 也是瑞典岛屿，但不是最大的两座；Malmö 和 Göteborg 是城市。',
      ar: 'أكبر جزيرتين في السويد هما Gotland وÖland. وتُعد Hisingen وOrust وVärmdö وTjörn جزرًا سويدية أيضًا لكنها ليست الأكبر، أما Malmö وGöteborg فهما مدينتان.',
      ckb: 'دوو گەورەترین دوورگەی سوید Gotland و Öland ن. Hisingen و Orust و Värmdö و Tjörnیش دوورگەی سویدین بەڵام دوو گەورەترینەکان نین، و Malmö و Göteborg شارن.',
      fa: 'دو جزیره بزرگ سوئد Gotland و Öland هستند. Hisingen، Orust، Värmdö و Tjörn نیز جزیره‌های سوئدی‌اند اما دو جزیره بزرگ نیستند، و Malmö و Göteborg شهر هستند.',
      pl: 'Dwie największe wyspy Szwecji to Gotlandia i Olandia. Hisingen, Orust, Värmdö i Tjörn też są szwedzkimi wyspami, ale nie dwiema największymi, a Malmö i Göteborg to miasta.',
      so: 'Labada jasiiradood ee ugu waaweyn Iswiidhan waa Gotland iyo Öland. Hisingen, Orust, Värmdö iyo Tjörn iyaguna waa jasiirado Iswiidhish ah laakiin ma aha labada ugu waaweyn, Malmö iyo Göteborg-na waa magaalooyin.',
      ti: 'ክልተ ዝዓበያ ደሴታት ሽወደን Gotlandን Ölandን እየን። Hisingen፣ Orust፣ Värmdöን Tjörnን እውን ደሴታት ሽወደን እየን፣ ግን ክልተ ዝዓበያ ኣይኮናን፤ Malmöን Göteborgን ድማ ከተማታት እየን።',
      tr: 'İsveç’in en büyük iki adası Gotland ve Öland’dır. Hisingen, Orust, Värmdö ve Tjörn de İsveç adalarıdır ama en büyük iki ada değildir; Malmö ve Göteborg ise şehirlerdir.',
      uk: 'Два найбільші острови Швеції — Gotland і Öland. Hisingen, Orust, Värmdö і Tjörn також є шведськими островами, але не двома найбільшими, а Malmö і Göteborg — це міста.',
    },
  },
  q006: {
    questionText: {
      'zh-Hant': '墨西哥灣流和北大西洋洋流有助於讓瑞典氣候溫和。',
      'zh-Hans': '墨西哥湾流和北大西洋洋流有助于让瑞典气候温和。',
      ar: 'يساعد تيار الخليج وتيار شمال الأطلسي في جعل مناخ السويد معتدلًا.',
      ckb: 'ڕەوتی گەلف و ڕەوتی باکووری ئەتڵەسی یارمەتی دەدەن کە ئاووهەوای سوید نەرمو مامناوەند بێت.',
      fa: 'جریان گلف استریم و جریان اقیانوس اطلس شمالی به ملایم بودن آب‌وهوای سوئد کمک می‌کنند.',
      pl: 'Golfsztrom i Prąd Północnoatlantycki przyczyniają się do łagodnego klimatu Szwecji.',
      so: 'Gulf Stream iyo qulqulka Waqooyiga Atlantic waxay ka qayb qaataan cimilada deggan ee Iswiidhan.',
      ti: 'ጎልፍ ስትሪምን ሰሜናዊ ኣትላንቲክ ዋሕዝን ንለስላሳ ክሊማ ሽወደን ይሕግዙ።',
      tr: 'Golfstream ve Kuzey Atlantik Akıntısı, İsveç’in ikliminin ılıman olmasına katkı sağlar.',
      uk: 'Гольфстрім і Північно-Атлантична течія сприяють м’якому клімату Швеції.',
    },
    options: {
      true: {
        'zh-Hant': '正確',
        'zh-Hans': '正确',
        ar: 'صحيح',
        ckb: 'ڕاستە',
        fa: 'درست',
        pl: 'Prawda',
        so: 'Sax',
        ti: 'ትኽክል',
        tr: 'Doğru',
        uk: 'Правда',
      },
      false: {
        'zh-Hant': '錯誤',
        'zh-Hans': '错误',
        ar: 'خطأ',
        ckb: 'هەڵەیە',
        fa: 'نادرست',
        pl: 'Fałsz',
        so: 'Khalad',
        ti: 'ጌጋ',
        tr: 'Yanlış',
        uk: 'Неправда',
      },
    },
    explanationText: {
      'zh-Hant':
        '與許多同緯度地區相比，瑞典氣候較溫和。墨西哥灣流和北大西洋洋流把暖水帶向歐洲，讓吹向瑞典的空氣變暖。',
      'zh-Hans':
        '与许多同纬度地区相比，瑞典气候较温和。墨西哥湾流和北大西洋洋流把暖水带向欧洲，让吹向瑞典的空气变暖。',
      ar: 'لدى السويد مناخ معتدل مقارنة بكثير من المناطق الأخرى الواقعة على خط العرض نفسه. ينقل تيار الخليج وتيار شمال الأطلسي مياهًا دافئة نحو أوروبا، فتدفئ الهواء الذي تحمله الرياح إلى السويد.',
      ckb: 'سوید بە بەراورد لەگەڵ زۆر ناوچەی تر لە هەمان پانی جوگرافی، ئاووهەوایەکی نەرمتری هەیە. ڕەوتی گەلف و ڕەوتی باکووری ئەتڵەسی ئاوی گەرم بەرەو ئەوروپا دەگوازنەوە و ئەو هەوایە گەرم دەکەن کە با بەرەو سوید دەیهێنێت.',
      fa: 'سوئد در مقایسه با بسیاری از مناطق دیگر در همان عرض جغرافیایی آب‌وهوای ملایمی دارد. گلف استریم و جریان اقیانوس اطلس شمالی آب گرم را به سوی اروپا می‌برند و هوایی را که بادها به سوئد می‌آورند گرم می‌کنند.',
      pl: 'Szwecja ma łagodny klimat w porównaniu z wieloma innymi obszarami na tej samej szerokości geograficznej. Golfsztrom i Prąd Północnoatlantycki niosą ciepłą wodę ku Europie, ogrzewając powietrze przynoszone przez wiatry nad Szwecję.',
      so: 'Iswiidhan waxay leedahay cimilo deggan marka loo barbardhigo meelo badan oo kale oo isla loolkaas ku yaal. Gulf Stream iyo qulqulka Waqooyiga Atlantic waxay biyo diirran u qaadaan Yurub, taas oo diirisa hawada dabayluhu u keenaan Iswiidhan.',
      ti: 'ሽወደን ካብ ብዙሓት ኣብ ተመሳሳሊ ኬክሮስ ዘለዋ ከባቢታት ጋር ክትነጻጸር ከላ ለስላሳ ክሊማ ኣለዋ። ጎልፍ ስትሪምን ሰሜናዊ ኣትላንቲክ ዋሕዝን ሞቃት ማይ ናብ ኤውሮጳ ይወስዱ፣ እዚ ድማ ነቲ ንሽወደን ዝመጽእ ኣየር የሞቕ።',
      tr: 'İsveç, aynı enlemdeki birçok bölgeye göre ılıman bir iklime sahiptir. Golfstream ve Kuzey Atlantik Akıntısı Avrupa’ya sıcak su taşır; bu da rüzgârların İsveç’e getirdiği havayı ısıtır.',
      uk: 'Швеція має м’який клімат порівняно з багатьма іншими територіями на тій самій широті. Гольфстрім і Північно-Атлантична течія несуть теплу воду до Європи, зігріваючи повітря, яке вітри приносять до Швеції.',
    },
  },
};

function localizedContentText(
  sv: string,
  en: string,
  localizedText: LocalizedTargetText,
): LocalizedContentText {
  return { sv, en, ...localizedText };
}

function assertCompleteLocalizationMap(map: LocalizedContentText, path: string): void {
  const missing = localeCodes.filter((locale) => !map[locale]?.trim());
  if (missing.length > 0) {
    throw new Error(`${path} missing localized text for ${missing.join(', ')}`);
  }
}

export function applyQuestionLocalizationPilot(question: PracticeQuestion): PracticeQuestion {
  const localization =
    questionLocalizationPilot[question.id as keyof typeof questionLocalizationPilot];
  if (!localization) return question;

  const questionText = localizedContentText(
    question.questionSv,
    question.questionEn,
    localization.questionText,
  );
  const explanationText = localizedContentText(
    question.explanationSv,
    question.explanationEn,
    localization.explanationText,
  );
  assertCompleteLocalizationMap(questionText, `${question.id}.questionText`);
  assertCompleteLocalizationMap(explanationText, `${question.id}.explanationText`);

  return {
    ...question,
    questionText,
    explanationText,
    options: question.options.map((option) => {
      const optionLocalization = localization.options[option.id];
      if (!optionLocalization) {
        throw new Error(`${question.id}.options.${option.id}.text missing localization map`);
      }
      const text = localizedContentText(option.textSv, option.textEn, optionLocalization);
      assertCompleteLocalizationMap(text, `${question.id}.options.${option.id}.text`);
      return { ...option, text };
    }),
  };
}
