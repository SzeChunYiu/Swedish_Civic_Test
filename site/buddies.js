/* Almost Swedish — Study Buddies (10 of them)
   Each buddy has SVG art, personality tips, "Did you know" facts about Sweden,
   and "pet me" reactions. Buddies change seasonally if user hasn't picked one.
*/

(function () {
  'use strict';

  // ---------- Shared "Did you know" facts about Sweden ----------

  const SMT_FACTS = [
    {
      en: 'Spotify is Swedish — founded in Stockholm in 2006.',
      sv: 'Spotify är svenskt — grundat i Stockholm 2006.',
    },
    {
      en: 'Skype was co-founded by a Swede, Niklas Zennström.',
      sv: 'Skype grundades delvis av svensken Niklas Zennström.',
    },
    {
      en: 'Minecraft was built by Markus "Notch" Persson in Stockholm.',
      sv: 'Minecraft byggdes av Markus "Notch" Persson i Stockholm.',
    },
    {
      en: 'Sweden has been at peace since 1814 — over 200 years.',
      sv: 'Sverige har varit i fred sedan 1814 — i över 200 år.',
    },
    {
      en: 'Volvo invented the three-point seat belt in 1959 — and gave the patent away to save lives.',
      sv: 'Volvo uppfann trepunktsbältet 1959 — och gav bort patentet för att rädda liv.',
    },
    {
      en: "Sweden's Freedom of the Press Act (1766) is the world's oldest.",
      sv: 'Sveriges tryckfrihetsförordning (1766) är världens äldsta.',
    },
    {
      en: 'Sweden recycles ~99% of its household waste — almost nothing goes to landfill.',
      sv: 'Sverige återvinner ~99% av hushållsavfallet — nästan inget hamnar på deponi.',
    },
    {
      en: 'There are ~96,000 lakes and over 200,000 islands in Sweden.',
      sv: 'Det finns ~96 000 sjöar och över 200 000 öar i Sverige.',
    },
    {
      en: 'Swedes drink among the most coffee per capita in the world — top 3.',
      sv: 'Svenskar dricker bland mest kaffe per capita i världen — topp 3.',
    },
    {
      en: "IKEA's name comes from Ingvar Kamprad + Elmtaryd (his farm) + Agunnaryd (his village).",
      sv: 'IKEA är Ingvar Kamprad + Elmtaryd (hans gård) + Agunnaryd (hans by).',
    },
    {
      en: 'Sweden offers 480 days of paid parental leave per child.',
      sv: 'Sverige har 480 dagar betald föräldraledighet per barn.',
    },
    {
      en: 'The Vasa ship sank on its maiden voyage in 1628. It now has its own museum.',
      sv: 'Vasaskeppet sjönk på sin jungfrufärd 1628. Nu har det ett eget museum.',
    },
    {
      en: 'Sweden was the first country to ban physical punishment of children — in 1979.',
      sv: 'Sverige var första landet att förbjuda barnaga — 1979.',
    },
    {
      en: 'Stockholm is built on 14 islands connected by 57 bridges.',
      sv: 'Stockholm är byggt på 14 öar med 57 broar mellan.',
    },
    {
      en: 'Sweden has about 300,000 moose — more than any other country.',
      sv: 'Sverige har omkring 300 000 älgar — fler än något annat land.',
    },
    {
      en: 'Klarna, Truecaller, Candy Crush (King), and iZettle were all started in Sweden.',
      sv: 'Klarna, Truecaller, Candy Crush (King) och iZettle startade i Sverige.',
    },
    {
      en: 'Sweden runs on ~98% fossil-free electricity.',
      sv: 'Sverige drivs av cirka 98% fossilfri el.',
    },
    {
      en: 'Alfred Nobel — yes, that Nobel — invented dynamite.',
      sv: 'Alfred Nobel — ja, Nobelpriset — uppfann dynamit.',
    },
    {
      en: 'The pacemaker was first implanted in Stockholm in 1958.',
      sv: 'Pacemakern implanterades för första gången i Stockholm 1958.',
    },
    {
      en: 'Tetra Pak (the milk carton) was invented in Lund in the 1950s.',
      sv: 'Tetra Pak (mjölkpaketet) uppfanns i Lund på 1950-talet.',
    },
    {
      en: 'Allemansrätten — the right to roam — dates back to medieval common law.',
      sv: 'Allemansrätten har medeltida rötter i sedvanerätt.',
    },
    {
      en: "Sweden's national anthem doesn't actually mention Sweden by name.",
      sv: 'Sveriges nationalsång nämner inte ens "Sverige" vid namn.',
    },
    {
      en: 'ABBA won Eurovision in 1974 with Waterloo. The rest is history.',
      sv: 'ABBA vann Eurovision 1974 med Waterloo. Resten är historia.',
    },
    {
      en: 'Astrid Lindgren (Pippi Longstocking) was such a national treasure she got her own tax law named after her.',
      sv: 'Astrid Lindgren (Pippi) var så folkkär att hon fick en skattelag uppkallad efter sig.',
    },
    {
      en: "Saab still makes airplanes — they just don't make cars anymore.",
      sv: 'Saab tillverkar fortfarande flygplan — bara inte bilar längre.',
    },
    {
      en: 'The Riksdag is about 46% women — among the highest shares in the world.',
      sv: 'Riksdagen är ca 46% kvinnor — bland de högsta andelarna i världen.',
    },
    {
      en: 'Pippi Longstocking, the safety match, and the adjustable wrench: all Swedish.',
      sv: 'Pippi, säkerhetständstickan och skiftnyckeln: alla svenska.',
    },
    {
      en: "Sweden's blue + gold flag is older than the country in its modern form.",
      sv: 'Den blå-gula flaggan är äldre än Sverige i sin moderna form.',
    },
    {
      en: 'The number 7 in Swedish ("sju") is famously hard to pronounce.',
      sv: 'Sjuan på svenska är ökänt svår att uttala.',
    },
    {
      en: 'Sweden was once a 17th-century superpower stretching to Finland, the Baltics, and parts of Germany.',
      sv: 'Sverige var en stormakt på 1600-talet — Finland, Baltikum, delar av Tyskland.',
    },
  ];

  function randomFact(lang) {
    const f = SMT_FACTS[Math.floor(Math.random() * SMT_FACTS.length)];
    return f[lang] || f.en;
  }

  // ---------- The 10 buddies ----------

  const BUDDIES = [
    {
      id: 'dala',
      name: 'Dala',
      subtitle: { en: 'The dala horse', sv: 'Dalahästen' },
      factPrefix: { en: 'Did you know — ', sv: 'Visste du — ' },
      tips: {
        en: [
          "Pace yourself. I've been carved from one piece of wood since the 1700s — and even *I* take breaks.",
          'Study a little, check the source, and tell people the horse kept you company.',
          'When two answers sound right, slow down and read the whole option.',
          'My hometown is Mora. Lots of horses, not many beaches.',
          "Tap an option, even if you're guessing. Wrong answers come back later.",
        ],
        sv: [
          'Ta det lugnt. Jag har varit en träklump sedan 1700-talet — *jag* tar paus.',
          'Plugga lite, kolla källan och säg att hästen höll dig sällskap.',
          'När två svar verkar rätt — sakta ner och läs hela alternativet.',
          'Min hemstad är Mora. Mycket hästar, få sandstränder.',
          'Tryck på ett alternativ även när du gissar. Fel svar kommer tillbaka senare.',
        ],
      },
      pet: {
        en: ['Tack. Wood appreciates that.', 'Hej hej.', 'I am painted, but I have feelings.'],
        sv: ['Tack. Trä uppskattar.', 'Hej hej.', 'Jag är målad, men jag har känslor.'],
      },
      svg: `<img src="assets/buddies/dala.png" class="buddy-img" alt="dala mascot" loading="lazy" />`,
    },

    {
      id: 'kanel',
      name: 'Kanel',
      subtitle: { en: 'The cinnamon bun', sv: 'Kanelbullen' },
      factPrefix: { en: 'Mysig fact — ', sv: 'Mysig fakta — ' },
      tips: {
        en: [
          "Studied 25 minutes? Time for fika. It's basically the law.",
          'Kanelbullens dag is October 4. But honestly, every day works.',
          'Stuck on a question? Eat something sweet. Brain runs on sugar.',
          'Pro tip: explanations stick better with butter on them.',
          'Lagom is not on the test. But it should be.',
        ],
        sv: [
          'Pluggat 25 minuter? Dags för fika. Det är ju lag.',
          'Kanelbullens dag är 4 oktober. Men varje dag funkar egentligen.',
          'Fastnat? Ät något sött. Hjärnan går på socker.',
          'Proffstips: förklaringar fastnar bättre med smör på.',
          'Lagom står inte på provet. Men det borde göra det.',
        ],
      },
      pet: {
        en: ['Glaze me.', "I'm warm. Are you warm?", 'More butter.'],
        sv: ['Glasera mig.', 'Jag är varm. Är du varm?', 'Mer smör.'],
      },
      svg: `<img src="assets/buddies/kanel.png" class="buddy-img" alt="kanel mascot" loading="lazy" />`,
    },

    {
      id: 'algis',
      name: 'Älgis',
      subtitle: { en: 'The moose', sv: 'Älgen' },
      factPrefix: { en: '...did you know. ', sv: '...visste du. ' },
      tips: {
        en: [
          '...',
          'I stood here for an hour. You can read one chapter.',
          "Don't try to wave at me on the side of the road. I will not wave back.",
          'There are 300,000 of us. Outnumber the questions, you outnumber us.',
          'Moose can run 60 km/h. You can run a 10-minute chapter.',
        ],
        sv: [
          '...',
          'Jag stod här i en timme. Du klarar ett kapitel.',
          'Vinka inte åt mig vid vägkanten. Jag vinkar inte tillbaka.',
          'Vi är omkring 300 000. Fler frågor än älgar? Då ligger du bra till.',
          'Älgar kan springa 60 km/h. Du kan ta ett tiominuterskapitel.',
        ],
      },
      pet: {
        en: ['...', 'Mm.', 'Hej. *chews leaf*'],
        sv: ['...', 'Mm.', 'Hej. *tuggar löv*'],
      },
      svg: `<img src="assets/buddies/algis.png" class="buddy-img" alt="algis mascot" loading="lazy" />`,
    },

    {
      id: 'tomte',
      name: 'Tomte',
      subtitle: { en: 'The Swedish gnome', sv: 'Tomten' },
      factPrefix: { en: 'Psst. ', sv: 'Psst. ' },
      tips: {
        en: [
          "The hint is in the question. Read it twice. I'll wait.",
          "Leave gröt out for me and I'll deliver the right answer in your sleep. Probably.",
          'Sweden has FOUR basic laws. Not three. Even I had to memorise that.',
          'I only rearrange porridge bowls. Read twice, pick calmly, and trust the shuffled options.',
          'If something feels too easy, it usually is.',
        ],
        sv: [
          'Ledtråden finns i frågan. Läs två gånger. Jag väntar.',
          'Sätt fram gröt så levererar jag rätt svar i sömnen. Förmodligen.',
          'Fyra grundlagar. INTE tre. Jag fick också plugga in det.',
          'Jag flyttar bara grötskålar. Läs två gånger, välj lugnt och lita på de blandade svaren.',
          'Känns något för lätt är det ofta just det.',
        ],
      },
      pet: {
        en: ['Bah, fine.', 'Watch the beard.', 'Gröt please.'],
        sv: ['Pyttsan.', 'Akta skägget.', 'Gröt tack.'],
      },
      svg: `<img src="assets/buddies/tomte.png" class="buddy-img" alt="tomte mascot" loading="lazy" />`,
    },

    {
      id: 'sillis',
      name: 'Sillis',
      subtitle: { en: 'The pickled herring', sv: 'Sillen' },
      factPrefix: { en: 'Glug glug — ', sv: 'Glugg-glugg — ' },
      tips: {
        en: [
          "There are at least seven ways to pickle me. You don't need to know that for the test.",
          "I'm a fish, not a tutor. But I believe in you.",
          "Don't let surströmming represent us. We don't all smell.",
          'Midsommar table without me is just sad.',
          'If the question mentions "sill" or "strömming", it\'s not on the civic test. Probably.',
        ],
        sv: [
          'Det finns minst sju sätt att lägga in mig. Inte på provet, lugn.',
          'Jag är en fisk, inte lärare. Men jag tror på dig.',
          'Låt inte surströmming representera oss. Vi luktar inte allihop.',
          'Midsommarbord utan mig blir mest sorgligt.',
          'Om frågan nämner "sill" eller "strömming" är den nog inte med på samhällskunskapsprovet.',
        ],
      },
      pet: {
        en: ['Cool and slimy.', 'Add dill.', 'Glug.'],
        sv: ['Sval och slipprig.', 'Mer dill.', 'Glugg.'],
      },
      svg: `<img src="assets/buddies/sillis.png" class="buddy-img" alt="sillis mascot" loading="lazy" />`,
    },

    {
      id: 'kaffe',
      name: 'Kaffe',
      subtitle: { en: 'The coffee cup', sv: 'Kaffekoppen' },
      factPrefix: { en: 'DID YOU KNOW: ', sv: 'VISSTE DU: ' },
      tips: {
        en: [
          'GO. STUDY. GO.',
          'Take a sip. Take a question. Take another sip.',
          'Swedes drink among the most coffee per capita in the world. Catch up.',
          "I peaked at 200mg. You're doing fine on water.",
          'Coffee + kanelbulle = optimum.',
        ],
        sv: [
          'KÖR. PLUGGA. KÖR.',
          'En klunk. En fråga. En klunk till.',
          'Svenskar dricker bland mest kaffe per capita. Hänger du med?',
          'Jag toppade på 200 mg. Du klarar dig fint på vatten.',
          'Kaffe + kanelbulle = optimalt.',
        ],
      },
      pet: {
        en: ['More foam!', 'Hot hot hot.', 'Buzz.'],
        sv: ['Mer skum!', 'Hett hett hett.', 'Buzz.'],
      },
      svg: `<img src="assets/buddies/kaffe.png" class="buddy-img" alt="kaffe mascot" loading="lazy" />`,
    },

    {
      id: 'vasa',
      name: 'Vasa',
      subtitle: { en: 'The ship that sank', sv: 'Skeppet som sjönk' },
      factPrefix: { en: 'Speaking of comebacks — ', sv: 'På tal om comebacks — ' },
      tips: {
        en: [
          "I sank on my maiden voyage in 1628. You'll do better.",
          "Top tip: don't load the upper deck with too many cannons.",
          'I live in a museum now. People pay to see me. Even failure has a comeback.',
          'If your first attempt sinks, dock it for 333 years and try again.',
          "The Vasa Museum is Sweden's most-visited museum. Bring kids.",
        ],
        sv: [
          'Jag sjönk på jungfrufärden 1628. Du klarar bättre.',
          'Tips: lasta inte överdäcket med för många kanoner.',
          'Jag bor på museum nu. Folk betalar för att se mig. Även misslyckanden kan få en comeback.',
          'Om första försöket sjunker: lägg till kaj i 333 år och försök igen.',
          'Vasamuseet är ett av Sveriges mest besökta museer. Ta med barnen.',
        ],
      },
      pet: {
        en: ['Cannons too heavy.', "Don't tilt me.", 'Ahoy.'],
        sv: ['Kanoner för tunga.', 'Tippa mig inte.', 'Ohoj.'],
      },
      svg: `<img src="assets/buddies/vasa.png" class="buddy-img" alt="vasa mascot" loading="lazy" />`,
    },

    {
      id: 'stang',
      name: 'Stång',
      subtitle: { en: 'The midsommar maypole', sv: 'Midsommarstången' },
      factPrefix: { en: 'Round-and-round fact — ', sv: 'Snurrfakta — ' },
      tips: {
        en: [
          'Dance around me three times and the right answer comes to you. Allegedly.',
          'Rain or shine, we dance. Rain or shine, you study.',
          '"Små grodorna" is the frog song. Don\'t ask why frogs.',
          'Six rings on me. Six chapters before your next fika. Deal?',
          'Midsommar is always Friday between June 19–25. The party is mandatory.',
        ],
        sv: [
          'Dansa runt mig tre varv så kommer rätt svar. Påstås.',
          'Regn eller sol, vi dansar. Regn eller sol, du pluggar.',
          '"Små grodorna" — fråga inte varför grodor.',
          'Sex ringar på mig. Sex kapitel före nästa fika. Deal?',
          'Midsommarafton är alltid en fredag mellan 19 och 25 juni. Festen är nästan obligatorisk.',
        ],
      },
      pet: {
        en: ['Twirl with me.', 'More flowers.', 'Hej, dansa!'],
        sv: ['Snurra med mig.', 'Mer blommor.', 'Hej, dansa!'],
      },
      svg: `<img src="assets/buddies/stang.png" class="buddy-img" alt="stang mascot" loading="lazy" />`,
    },

    {
      id: 'lucia',
      name: 'Lucia',
      subtitle: { en: 'Lucia, bringer of light', sv: 'Lucia, ljusbärerskan' },
      factPrefix: { en: 'A little light — ', sv: 'En tändning — ' },
      tips: {
        en: [
          'Light a candle. Or a desk lamp. Either works.',
          'Wear white if you can. I find it improves recall.',
          'Sing quietly if you must. Your neighbour is also studying.',
          'Saffron is in the bullar, not the test.',
          'Lucia is December 13. Mark your calendar for darkness + light.',
        ],
        sv: [
          'Tänd ett ljus. Eller en lampa. Båda funkar.',
          'Bär vitt om du kan. Förbättrar minnet, sägs det.',
          'Sjung tyst om du måste. Din granne pluggar också.',
          'Saffran hör hemma i bullarna, inte i provet.',
          'Lucia är den 13 december. Skriv in mörker plus ljus i kalendern.',
        ],
      },
      pet: {
        en: ['Sjung.', 'Lussekatt please.', 'Mind the candles.'],
        sv: ['Sjung.', 'Lussekatt tack.', 'Akta ljusen.'],
      },
      svg: `<img src="assets/buddies/lucia.png" class="buddy-img" alt="lucia mascot" loading="lazy" />`,
    },

    {
      id: 'snogubbe',
      name: 'Snögubbe',
      subtitle: { en: 'The snowman', sv: 'Snögubben' },
      factPrefix: { en: 'Cold fact — ', sv: 'Sval fakta — ' },
      tips: {
        en: [
          'I melt for you. Literally, by April.',
          'Study now while the days are dark. Reward: long summer evenings.',
          "The carrot is decorative. Don't eat me.",
          "Built in 5 minutes. Studied for 6. You're already ahead of me.",
          'Vinter is hard. Vinter is also when Swedes do their best plugging.',
        ],
        sv: [
          'Jag smälter för din skull. Bokstavligen, till april.',
          'Plugga nu när det är mörkt. Belöning: ljusa sommarkvällar.',
          'Moroten är dekoration. Ät inte upp mig.',
          'Byggd på fem minuter. Pluggat i sex. Du ligger redan före.',
          'Vintern är tuff. Det är också då svenskar pluggar som bäst.',
        ],
      },
      pet: {
        en: ['Brr.', 'Mind the carrot.', 'Snögubbe needs scarf.'],
        sv: ['Brr.', 'Akta moroten.', 'Snögubben behöver halsduk.'],
      },
      svg: `<img src="assets/buddies/snogubbe.png" class="buddy-img" alt="snogubbe mascot" loading="lazy" />`,
    },
  ];

  // ---------- Seasonal default ----------

  function seasonalDefault() {
    const d = new Date();
    const m = d.getMonth(),
      day = d.getDate();
    if (m === 11 && day === 13) return 'lucia';
    if (m === 11) return 'tomte';
    if (m === 0 || m === 1) return 'snogubbe';
    if (m === 9 && day === 4) return 'kanel';
    if (m === 5 && day >= 19 && day <= 25) return 'stang';
    return 'dala';
  }

  function currentLang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }

  const BUDDY_GREETING_LINES = {
    en: [
      "Hej. I'm {name}. I'll be your study buddy. Tap me anytime.",
      '{name} reporting for duty. Click me for tips and Swedish facts.',
      'Welcome. {name} here. Click me, I have things to say.',
    ],
    sv: [
      'Hej. Jag är {name}. Din pluggkompis. Tryck när du vill.',
      '{name} här. Klicka för tips och svenska fakta.',
      'Välkommen. {name} här. Klicka på mig, jag har saker att säga.',
    ],
  };

  const BUDDY_PAGE_NUDGES = {
    '/practice': {
      en: '{name} says: ten questions, no penalty for wrong ones. Just tap and learn.',
      sv: '{name} säger: tio frågor, inget straff för fel. Tryck och lär.',
    },
    '/ebook': {
      en: '{name} loves a quiet read. Pick a chapter from the left.',
      sv: '{name} gillar en lugn läsning. Välj kapitel till vänster.',
    },
  };

  function buddyCopy(template, buddy) {
    return template.replace(/\{name\}/g, buddy.name);
  }

  function getBuddyId() {
    try {
      return localStorage.getItem('smt_buddy') || seasonalDefault();
    } catch {
      return 'dala';
    }
  }
  function getBuddy() {
    return BUDDIES.find((b) => b.id === getBuddyId()) || BUDDIES[0];
  }

  // ---------- Render ----------

  function renderBuddy() {
    const fig = document.getElementById('dala-figure');
    const nameEl = document.getElementById('dala-name');
    if (!fig) return;
    const b = getBuddy();
    fig.innerHTML = b.svg;
    if (nameEl) nameEl.textContent = `${b.name} · ${b.subtitle[currentLang()] || b.subtitle.en}`;
  }

  let hideTimer = null;
  let fadeTimer = null;
  function showMessage(html, opts = {}) {
    const bubble = document.getElementById('dala-bubble');
    const msg = document.getElementById('dala-msg');
    const widget = document.getElementById('dala-buddy');
    if (!bubble || !msg || !widget) return;
    msg.innerHTML = html;
    clearTimeout(hideTimer);
    clearTimeout(fadeTimer);
    bubble.hidden = false;
    bubble.classList.remove('is-out');
    // next frame, trigger transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => bubble.classList.add('is-in'));
    });
    widget.classList.add('is-talking');
    const ms = opts.autoHide ?? 9000;
    if (ms > 0) hideTimer = setTimeout(hideMessage, ms);
  }
  function hideMessage() {
    const bubble = document.getElementById('dala-bubble');
    const widget = document.getElementById('dala-buddy');
    if (!bubble) return;
    bubble.classList.remove('is-in');
    bubble.classList.add('is-out');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      bubble.hidden = true;
      bubble.classList.remove('is-out');
    }, 480);
    if (widget) widget.classList.remove('is-talking');
  }

  // ---------- Tip pool: mix personality tips + Swedish facts ----------

  function pickLine() {
    const b = getBuddy();
    const lang = currentLang();
    const tips = b.tips[lang] || b.tips.en;
    // 60% personality tip, 40% Swedish fact
    if (Math.random() < 0.4) {
      const prefix = b.factPrefix[lang] || b.factPrefix.en;
      return `<em>${prefix}</em>${randomFact(lang)}`;
    }
    return tips[Math.floor(Math.random() * tips.length)];
  }

  function showRandomTip() {
    showMessage(pickLine());
  }

  function showGreeting() {
    const b = getBuddy();
    const lang = currentLang();
    const list = (BUDDY_GREETING_LINES[lang] || BUDDY_GREETING_LINES.en).map((line) =>
      buddyCopy(line, b),
    );
    showMessage(list[Math.floor(Math.random() * list.length)]);
  }

  function petReaction() {
    const b = getBuddy();
    const lang = currentLang();
    const pool = b.pet[lang] || b.pet.en;
    showMessage(pool[Math.floor(Math.random() * pool.length)], { autoHide: 3500 });
  }

  // ---------- Page-aware nudges ----------

  function pageNudge() {
    const path = (location.hash || '#/').replace(/^#/, '').split('?')[0];
    const b = getBuddy();
    const lang = currentLang();
    const line = BUDDY_PAGE_NUDGES[path];
    if (line) showMessage(buddyCopy(line[lang] || line.en, b));
  }

  // ---------- Public API ----------

  window.smtBuddyList = () =>
    BUDDIES.map((b) => ({
      id: b.id,
      name: b.name,
      subtitle: b.subtitle,
      svg: b.svg,
    }));
  window.smtSetBuddy = (id) => {
    try {
      localStorage.setItem('smt_buddy', id);
    } catch {}
    renderBuddy();
    setTimeout(() => {
      const b = getBuddy();
      const lang = currentLang();
      showMessage(
        lang === 'sv'
          ? `Hej. Jag är ${b.name}. Trevligt att hänga ihop.`
          : `Hej. I'm ${b.name}. Nice to be on duty.`,
      );
    }, 100);
  };
  window.smtBuddyCelebrate = (msgEn, msgSv) => {
    const lang = currentLang();
    showMessage(lang === 'sv' ? msgSv : msgEn, { autoHide: 6000 });
  };
  window.smtBuddyConsole = (msgEn, msgSv) => {
    const lang = currentLang();
    showMessage(lang === 'sv' ? msgSv : msgEn, { autoHide: 5500 });
  };
  window.smtBuddyHide = () => {
    const w = document.getElementById('dala-buddy');
    if (w) w.hidden = true;
    try {
      localStorage.setItem('smt_buddy_hidden', '1');
    } catch {}
  };
  window.smtBuddyShow = () => {
    const w = document.getElementById('dala-buddy');
    if (w) w.hidden = false;
    try {
      localStorage.removeItem('smt_buddy_hidden');
    } catch {}
  };

  // ---------- Wire up ----------

  function activateBuddyFigure() {
    const bubble = document.getElementById('dala-bubble');
    if (bubble && !bubble.hidden) hideMessage();
    else if (Math.random() < 0.4) petReaction();
    else showRandomTip();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#dala-figure')) {
      activateBuddyFigure();
      return;
    }
    if (e.target.closest('#dala-bubble-close')) {
      hideMessage();
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!e.target.closest('#dala-figure')) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    activateBuddyFigure();
  });

  window.addEventListener('hashchange', () => setTimeout(pageNudge, 400));
  document.addEventListener('click', (e) => {
    // re-render name when language changes
    if (
      e.target.closest('.lang button[data-lang]') ||
      e.target.closest('[data-set="language"] button')
    ) {
      setTimeout(renderBuddy, 50);
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    let hidden = false;
    try {
      hidden = localStorage.getItem('smt_buddy_hidden') === '1';
    } catch {}
    const widget = document.getElementById('dala-buddy');
    if (!widget) return;
    widget.hidden = hidden;
    renderBuddy();
    if (!hidden) {
      let seen = false;
      try {
        seen = sessionStorage.getItem('smt_buddy_greeted') === '1';
      } catch {}
      if (!seen) {
        setTimeout(() => {
          showGreeting();
          try {
            sessionStorage.setItem('smt_buddy_greeted', '1');
          } catch {}
        }, 1800);
      }
    }
  });
})();
