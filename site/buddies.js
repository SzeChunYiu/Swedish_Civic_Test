/* Almost Swedish — Study Buddies (10 of them)
   Each buddy has SVG art, personality tips, "Did you know" facts about Sweden,
   and "pet me" reactions. Buddies change seasonally if user hasn't picked one.
*/

(function () {
  "use strict";

  // ---------- Shared "Did you know" facts about Sweden ----------

  const SMT_FACTS = [
    { en: "Spotify is Swedish — founded in Stockholm in 2006.", sv: "Spotify är svenskt — grundat i Stockholm 2006." },
    { en: "Skype was co-founded by a Swede, Niklas Zennström.", sv: "Skype grundades delvis av svensken Niklas Zennström." },
    { en: "Minecraft was built by Markus \"Notch\" Persson in Stockholm.", sv: "Minecraft byggdes av Markus \"Notch\" Persson i Stockholm." },
    { en: "Sweden has been at peace since 1814 — over 200 years.", sv: "Sverige har varit i fred sedan 1814 — i över 200 år." },
    { en: "Volvo invented the three-point seat belt in 1959 — and gave the patent away to save lives.", sv: "Volvo uppfann trepunktsbältet 1959 — och gav bort patentet för att rädda liv." },
    { en: "Sweden's Freedom of the Press Act (1766) is the world's oldest.", sv: "Sveriges tryckfrihetsförordning (1766) är världens äldsta." },
    { en: "Sweden recycles ~99% of its household waste — almost nothing goes to landfill.", sv: "Sverige återvinner ~99% av hushållsavfallet — nästan inget hamnar på deponi." },
    { en: "There are ~96,000 lakes and over 200,000 islands in Sweden.", sv: "Det finns ~96 000 sjöar och över 200 000 öar i Sverige." },
    { en: "Swedes drink among the most coffee per capita in the world — top 3.", sv: "Svenskar dricker bland mest kaffe per capita i världen — topp 3." },
    { en: "IKEA's name comes from Ingvar Kamprad + Elmtaryd (his farm) + Agunnaryd (his village).", sv: "IKEA är Ingvar Kamprad + Elmtaryd (hans gård) + Agunnaryd (hans by)." },
    { en: "Sweden offers 480 days of paid parental leave per child.", sv: "Sverige har 480 dagar betald föräldraledighet per barn." },
    { en: "The Vasa ship sank on its maiden voyage in 1628. It now has its own museum.", sv: "Vasaskeppet sjönk på sin jungfrufärd 1628. Nu har det ett eget museum." },
    { en: "Sweden was the first country to ban physical punishment of children — in 1979.", sv: "Sverige var första landet att förbjuda barnaga — 1979." },
    { en: "Stockholm is built on 14 islands connected by 57 bridges.", sv: "Stockholm är byggt på 14 öar med 57 broar mellan." },
    { en: "Sweden has about 300,000 moose — more than any other country.", sv: "Sverige har omkring 300 000 älgar — fler än något annat land." },
    { en: "Klarna, Truecaller, Candy Crush (King), and iZettle were all started in Sweden.", sv: "Klarna, Truecaller, Candy Crush (King) och iZettle startade i Sverige." },
    { en: "Sweden runs on ~98% fossil-free electricity.", sv: "Sverige drivs av cirka 98% fossilfri el." },
    { en: "Alfred Nobel — yes, that Nobel — invented dynamite.", sv: "Alfred Nobel — ja, Nobelpriset — uppfann dynamit." },
    { en: "The pacemaker was first implanted in Stockholm in 1958.", sv: "Pacemakern implanterades för första gången i Stockholm 1958." },
    { en: "Tetra Pak (the milk carton) was invented in Lund in the 1950s.", sv: "Tetra Pak (mjölkpaketet) uppfanns i Lund på 1950-talet." },
    { en: "Allemansrätten — the right to roam — dates back to medieval common law.", sv: "Allemansrätten har medeltida rötter i sedvanerätt." },
    { en: "Sweden's national anthem doesn't actually mention Sweden by name.", sv: "Sveriges nationalsång nämner inte ens \"Sverige\" vid namn." },
    { en: "ABBA won Eurovision in 1974 with Waterloo. The rest is history.", sv: "ABBA vann Eurovision 1974 med Waterloo. Resten är historia." },
    { en: "Astrid Lindgren (Pippi Longstocking) was such a national treasure she got her own tax law named after her.", sv: "Astrid Lindgren (Pippi) var så folkkär att hon fick en skattelag uppkallad efter sig." },
    { en: "Saab still makes airplanes — they just don't make cars anymore.", sv: "Saab tillverkar fortfarande flygplan — bara inte bilar längre." },
    { en: "The Riksdag is about 46% women — among the highest shares in the world.", sv: "Riksdagen är ca 46% kvinnor — bland de högsta andelarna i världen." },
    { en: "Pippi Longstocking, the safety match, and the adjustable wrench: all Swedish.", sv: "Pippi, säkerhetständstickan och skiftnyckeln: alla svenska." },
    { en: "Sweden's blue + gold flag is older than the country in its modern form.", sv: "Den blå-gula flaggan är äldre än Sverige i sin moderna form." },
    { en: "The number 7 in Swedish (\"sju\") is famously hard to pronounce.", sv: "Sjuan på svenska är ökänt svår att uttala." },
    { en: "Sweden was once a 17th-century superpower stretching to Finland, the Baltics, and parts of Germany.", sv: "Sverige var en stormakt på 1600-talet — Finland, Baltikum, delar av Tyskland." },
  ];

  function randomFact(lang) {
    const f = SMT_FACTS[Math.floor(Math.random() * SMT_FACTS.length)];
    return f[lang] || f.en;
  }

  // ---------- The 10 buddies ----------

  const BUDDIES = [
    {
      id: "dala",
      name: "Dala",
      subtitle: { en: "The dala horse", sv: "Dalahästen" },
      factPrefix: { en: "Did you know — ", sv: "Visste du — " },
      tips: {
        en: [
          "Pace yourself. I've been carved from one piece of wood since the 1700s — and even *I* take breaks.",
          "Study the material. Practice with sources. Tell people I helped.",
          "Read the whole question, then answer the fact it actually asks for. Tiny horse rule.",
          "My hometown is Mora. Lots of horses, not many beaches.",
          "Tap an option, even if you're guessing. Wrong answers come back later.",
        ],
        sv: [
          "Ta det lugnt. Jag har varit en träklump sedan 1700-talet — *jag* tar paus.",
          "Plugga materialet. Öva med källor. Säg att jag höll dig sällskap.",
          "Läs hela frågan och svara på just den fakta som efterfrågas. Liten hästregel.",
          "Min hemstad är Mora. Mycket hästar, få sandstränder.",
        ],
      },
      pet: {
        en: ["Tack. Wood appreciates that.", "Hej hej.", "I am painted, but I have feelings."],
        sv: ["Tack. Trä uppskattar.", "Hej hej.", "Jag är målad, men jag har känslor."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="93" rx="32" ry="2.5" fill="rgba(11,31,51,.18)"/>
<path d="M12 56Q6 56 6 64Q6 70 12 70Q18 66 22 62Z" fill="#c92733"/>
<path d="M18 56L70 56Q76 56 76 60L76 68Q76 70 74 70L22 70Q18 70 18 68Z" fill="#c92733"/>
<path d="M64 50L80 22Q84 18 88 24L84 28L68 56Z" fill="#c92733"/>
<path d="M80 20Q88 18 92 20L92 28Q88 32 82 30L76 26Z" fill="#c92733"/>
<path d="M84 16L86 12L90 18Z" fill="#c92733"/>
<circle cx="86" cy="24" r="1.4" fill="#0b1f33"/>
<rect x="58" y="68" width="6" height="22" fill="#c92733"/>
<rect x="48" y="68" width="6" height="22" fill="#c92733"/>
<rect x="34" y="68" width="6" height="22" fill="#c92733"/>
<rect x="24" y="68" width="6" height="22" fill="#c92733"/>
<g fill="#0b1f33"><rect x="58" y="88" width="6" height="3"/><rect x="48" y="88" width="6" height="3"/><rect x="34" y="88" width="6" height="3"/><rect x="24" y="88" width="6" height="3"/></g>
<path d="M74 26Q76 30 70 50" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<rect x="38" y="56" width="22" height="10" fill="#006aa7"/>
<line x1="38" y1="60" x2="60" y2="60" stroke="#fecc00" stroke-width="1.2"/>
<line x1="38" y1="64" x2="60" y2="64" stroke="#fecc00" stroke-width="1.2"/>
<g fill="#fff"><circle cx="26" cy="60" r="2"/><circle cx="22" cy="63" r="1.3"/><circle cx="30" cy="63" r="1.3"/><circle cx="26" cy="66" r="1.3"/></g>
<path d="M18 60Q20 56 26 56" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`,
    },

    {
      id: "kanel",
      name: "Kanel",
      subtitle: { en: "The cinnamon bun", sv: "Kanelbullen" },
      factPrefix: { en: "Mysig fact — ", sv: "Mysig fakta — " },
      tips: {
        en: [
          "Studied 25 minutes? Time for fika. It's basically the law.",
          "Kanelbullens dag is October 4. But honestly, every day works.",
          "Stuck on a question? Eat something sweet. Brain runs on sugar.",
          "Pro tip: explanations stick better with butter on them.",
          "Lagom is not on the test. But it should be.",
        ],
        sv: [
          "Pluggat 25 minuter? Dags för fika. Det är ju lag.",
          "Kanelbullens dag är 4 oktober. Men varje dag funkar egentligen.",
          "Fastnat? Ät något sött. Hjärnan går på socker.",
        ],
      },
      pet: {
        en: ["Glaze me.", "I'm warm. Are you warm?", "More butter."],
        sv: ["Glasera mig.", "Jag är varm. Är du varm?", "Mer smör."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="92" rx="28" ry="2" fill="rgba(11,31,51,.18)"/>
<circle cx="50" cy="50" r="36" fill="#a06d3a"/>
<circle cx="50" cy="50" r="28" fill="none" stroke="#5a3416" stroke-width="3"/>
<circle cx="50" cy="50" r="18" fill="none" stroke="#5a3416" stroke-width="3"/>
<circle cx="50" cy="50" r="8" fill="none" stroke="#5a3416" stroke-width="3"/>
<path d="M22 30Q40 22 56 30M38 14Q48 12 60 18" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<g fill="#5a3416"><circle cx="20" cy="46" r="1.5"/><circle cx="76" cy="58" r="1.5"/><circle cx="32" cy="80" r="1.5"/></g>
<circle cx="40" cy="46" r="1.8" fill="#0b1f33"/>
<circle cx="60" cy="46" r="1.8" fill="#0b1f33"/>
<path d="M42 58Q50 64 58 58" stroke="#0b1f33" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
    },

    {
      id: "algis",
      name: "Älgis",
      subtitle: { en: "The moose", sv: "Älgen" },
      factPrefix: { en: "...did you know. ", sv: "...visste du. " },
      tips: {
        en: [
          "...",
          "I stood here for an hour. You can read one chapter.",
          "Don't try to wave at me on the side of the road. I will not wave back.",
          "There are 300,000 of us. Outnumber the questions, you outnumber us.",
          "Moose can run 60 km/h. You can run a 10-minute chapter.",
        ],
        sv: [
          "...",
          "Jag stod här i en timme. Du klarar ett kapitel.",
          "Vinka inte åt mig vid vägkanten. Jag vinkar inte tillbaka.",
        ],
      },
      pet: {
        en: ["...", "Mm.", "Hej. *chews leaf*"],
        sv: ["...", "Mm.", "Hej. *tuggar löv*"],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="93" rx="26" ry="2.5" fill="rgba(11,31,51,.18)"/>
<path d="M32 24L22 18L14 14L10 18L16 22L8 22L14 28L20 26L18 32L26 28L30 30Z" fill="#7a4d20"/>
<path d="M68 24L78 18L86 14L90 18L84 22L92 22L86 28L80 26L82 32L74 28L70 30Z" fill="#7a4d20"/>
<ellipse cx="34" cy="32" rx="5" ry="3" fill="#5a3a18" transform="rotate(-30 34 32)"/>
<ellipse cx="66" cy="32" rx="5" ry="3" fill="#5a3a18" transform="rotate(30 66 32)"/>
<ellipse cx="50" cy="44" rx="14" ry="14" fill="#6b4520"/>
<path d="M40 52Q38 64 44 70Q50 72 56 70Q62 64 60 52Z" fill="#5a3a18"/>
<ellipse cx="50" cy="76" rx="20" ry="12" fill="#6b4520"/>
<rect x="34" y="84" width="3" height="8" fill="#3a2510"/>
<rect x="46" y="86" width="3" height="6" fill="#3a2510"/>
<rect x="63" y="84" width="3" height="8" fill="#3a2510"/>
<circle cx="44" cy="42" r="1.6" fill="#0b1f33"/>
<circle cx="56" cy="42" r="1.6" fill="#0b1f33"/>
<circle cx="46" cy="60" r="1.3" fill="#0b1f33"/>
<circle cx="54" cy="60" r="1.3" fill="#0b1f33"/>
<path d="M46 66Q50 64 54 66" stroke="#0b1f33" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="62" rx="3" ry="4" fill="#5a3a18"/></svg>`,
    },

    {
      id: "tomte",
      name: "Tomte",
      subtitle: { en: "The Swedish gnome", sv: "Tomten" },
      factPrefix: { en: "Psst. ", sv: "Psst. " },
      tips: {
        en: [
          "The hint is in the question. Read it twice. I'll wait.",
          "Leave gröt out for me and I'll deliver the right answer in your sleep. Probably.",
          "Sweden has FOUR basic laws. Not three. Even I had to memorise that.",
          "I only rearrange porridge bowls. Read twice, pick calmly, and trust the shuffled options.",
          "If something feels too easy, it usually is.",
        ],
        sv: [
          "Ledtråden finns i frågan. Läs två gånger. Jag väntar.",
          "Sätt fram gröt så levererar jag rätt svar i sömnen. Förmodligen.",
          "Fyra grundlagar. INTE tre. Jag fick också plugga in det.",
        ],
      },
      pet: {
        en: ["Bah, fine.", "Watch the beard.", "Gröt please."],
        sv: ["Pyttsan.", "Akta skägget.", "Gröt tack."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="95" rx="22" ry="2" fill="rgba(11,31,51,.18)"/>
<path d="M28 76Q28 92 34 92L66 92Q72 92 72 76L60 70L40 70Z" fill="#5a6878"/>
<ellipse cx="40" cy="92" rx="6" ry="3" fill="#3a2510"/>
<ellipse cx="60" cy="92" rx="6" ry="3" fill="#3a2510"/>
<rect x="28" y="80" width="44" height="3" fill="#3a2510"/>
<rect x="48" y="79" width="4" height="5" fill="#fecc00"/>
<path d="M28 50Q24 84 50 86Q76 84 72 50Q68 56 50 58Q32 56 28 50Z" fill="#f3ede0"/>
<path d="M28 48L50 4L72 48Q60 50 50 50Q40 50 28 48Z" fill="#c2272e"/>
<circle cx="50" cy="4" r="3" fill="#fff"/>
<ellipse cx="50" cy="48" rx="22" ry="3" fill="#fff"/>
<ellipse cx="50" cy="56" rx="6" ry="5" fill="#e8a67d"/>
<circle cx="44" cy="50" r="0.9" fill="#0b1f33"/>
<circle cx="56" cy="50" r="0.9" fill="#0b1f33"/></svg>`,
    },

    {
      id: "sillis",
      name: "Sillis",
      subtitle: { en: "The pickled herring", sv: "Sillen" },
      factPrefix: { en: "Glug glug — ", sv: "Glugg-glugg — " },
      tips: {
        en: [
          "There are at least seven ways to pickle me. You don't need to know that for the test.",
          "I'm a fish, not a tutor. But I believe in you.",
          "Don't let surströmming represent us. We don't all smell.",
          "Midsommar table without me is just sad.",
          "If the question mentions \"sill\" or \"strömming\", it's not on the civic test. Probably.",
        ],
        sv: [
          "Det finns minst sju sätt att lägga in mig. Inte på provet, lugn.",
          "Jag är en fisk, inte lärare. Men jag tror på dig.",
        ],
      },
      pet: {
        en: ["Cool and slimy.", "Add dill.", "Glug."],
        sv: ["Sval och slipprig.", "Mer dill.", "Glugg."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="92" rx="26" ry="2" fill="rgba(11,31,51,.18)"/>
<ellipse cx="48" cy="52" rx="36" ry="18" fill="#a8b6c4"/>
<ellipse cx="42" cy="44" rx="20" ry="6" fill="#dde4eb"/>
<path d="M82 52L98 32L98 72Z" fill="#7a8896"/>
<circle cx="22" cy="50" r="4" fill="#fff"/>
<circle cx="22" cy="50" r="1.8" fill="#0b1f33"/>
<path d="M34 42Q38 52 34 62" stroke="#5a6878" stroke-width="1.6" fill="none"/>
<path d="M10 54Q14 60 22 60" stroke="#0b1f33" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<g fill="#7a8896"><circle cx="48" cy="52" r="1.5"/><circle cx="58" cy="50" r="1.5"/><circle cx="68" cy="54" r="1.5"/><circle cx="62" cy="46" r="1.5"/></g></svg>`,
    },

    {
      id: "kaffe",
      name: "Kaffe",
      subtitle: { en: "The coffee cup", sv: "Kaffekoppen" },
      factPrefix: { en: "DID YOU KNOW: ", sv: "VISSTE DU: " },
      tips: {
        en: [
          "GO. STUDY. GO.",
          "Take a sip. Take a question. Take another sip.",
          "Swedes drink among the most coffee per capita in the world. Catch up.",
          "I peaked at 200mg. You're doing fine on water.",
          "Coffee + kanelbulle = optimum.",
        ],
        sv: [
          "KÖR. PLUGGA. KÖR.",
          "En klunk. En fråga. En klunk till.",
          "Svenskar dricker bland mest kaffe per capita. Hänger du med?",
        ],
      },
      pet: {
        en: ["More foam!", "Hot hot hot.", "Buzz."],
        sv: ["Mer skum!", "Hett hett hett.", "Buzz."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="46" cy="94" rx="26" ry="2" fill="rgba(11,31,51,.18)"/>
<path d="M38 10Q34 18 38 26M50 6Q46 14 50 22M62 10Q58 18 62 26" stroke="#a8b6c4" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M20 38L24 84Q24 92 32 92L58 92Q66 92 66 84L70 38Z" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
<ellipse cx="45" cy="38" rx="24" ry="6" fill="#3d2817"/>
<path d="M42 36Q38 32 42 30Q46 32 46 36Q46 32 50 30Q54 32 50 36Q48 38 46 38Q44 38 42 36Z" fill="#e8d4a8"/>
<path d="M70 50Q86 50 86 64Q86 78 70 78" stroke="#fff" stroke-width="5" fill="none"/>
<path d="M70 50Q86 50 86 64Q86 78 70 78" stroke="#0b1f33" stroke-width="1" fill="none"/></svg>`,
    },

    {
      id: "vasa",
      name: "Vasa",
      subtitle: { en: "The ship that sank", sv: "Skeppet som sjönk" },
      factPrefix: { en: "Speaking of comebacks — ", sv: "På tal om comebacks — " },
      tips: {
        en: [
          "I sank on my maiden voyage in 1628. You'll do better.",
          "Top tip: don't load the upper deck with too many cannons.",
          "I live in a museum now. People pay to see me. Even failure has a comeback.",
          "If your first attempt sinks, dock it for 333 years and try again.",
          "The Vasa Museum is Sweden's most-visited museum. Bring kids.",
        ],
        sv: [
          "Jag sjönk på jungfrufärden 1628. Du klarar bättre.",
          "Tips: lasta inte överdäcket med för många kanoner.",
        ],
      },
      pet: {
        en: ["Cannons too heavy.", "Don't tilt me.", "Ahoy."],
        sv: ["Kanoner för tunga.", "Tippa mig inte.", "Ohoj."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<line x1="50" y1="20" x2="50" y2="62" stroke="#5a3416" stroke-width="3"/>
<path d="M50 22L78 50L50 50Z" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
<path d="M50 22L22 50L50 50Z" fill="#f3ebd6" stroke="#0b1f33" stroke-width="1"/>
<rect x="36" y="30" width="14" height="10" fill="#006aa7"/>
<line x1="42" y1="30" x2="42" y2="40" stroke="#fecc00" stroke-width="1.5"/>
<line x1="36" y1="35" x2="50" y2="35" stroke="#fecc00" stroke-width="1.5"/>
<path d="M14 64L86 64L78 84L22 84Z" fill="#6b4520" stroke="#0b1f33" stroke-width="1"/>
<line x1="22" y1="74" x2="78" y2="74" stroke="#4a3018" stroke-width="1"/>
<circle cx="30" cy="78" r="2" fill="#0b1f33"/>
<circle cx="50" cy="78" r="2" fill="#0b1f33"/>
<circle cx="70" cy="78" r="2" fill="#0b1f33"/>
<path d="M0 86Q25 92 50 86T100 86L100 100L0 100Z" fill="#006aa7" opacity=".5"/></svg>`,
    },

    {
      id: "stang",
      name: "Stång",
      subtitle: { en: "The midsommar maypole", sv: "Midsommarstången" },
      factPrefix: { en: "Round-and-round fact — ", sv: "Snurrfakta — " },
      tips: {
        en: [
          "Dance around me three times and the right answer comes to you. Allegedly.",
          "Rain or shine, we dance. Rain or shine, you study.",
          "\"Små grodorna\" is the frog song. Don't ask why frogs.",
          "Six rings on me. Six chapters before your next fika. Deal?",
          "Midsommar is always Friday between June 19–25. The party is mandatory.",
        ],
        sv: [
          "Dansa runt mig tre varv så kommer rätt svar. Påstås.",
          "Regn eller sol, vi dansar. Regn eller sol, du pluggar.",
          "\"Små grodorna\" — fråga inte varför grodor.",
        ],
      },
      pet: {
        en: ["Twirl with me.", "More flowers.", "Hej, dansa!"],
        sv: ["Snurra med mig.", "Mer blommor.", "Hej, dansa!"],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<line x1="50" y1="14" x2="50" y2="92" stroke="#6b4520" stroke-width="4"/>
<line x1="32" y1="22" x2="68" y2="22" stroke="#6b4520" stroke-width="3"/>
<circle cx="32" cy="34" r="7" fill="none" stroke="#3e7c52" stroke-width="2.5"/>
<circle cx="68" cy="34" r="7" fill="none" stroke="#3e7c52" stroke-width="2.5"/>
<line x1="26" y1="60" x2="74" y2="60" stroke="#6b4520" stroke-width="3"/>
<g fill="#f4c542"><circle cx="22" cy="22" r="3"/><circle cx="78" cy="22" r="3"/><circle cx="50" cy="14" r="3.5"/></g>
<g fill="#bc1f2a"><circle cx="46" cy="24" r="2"/><circle cx="54" cy="24" r="2"/></g>
<g fill="#f4c542"><circle cx="20" cy="60" r="2.5"/><circle cx="80" cy="60" r="2.5"/></g>
<g fill="#bc1f2a"><circle cx="36" cy="62" r="2"/><circle cx="64" cy="62" r="2"/></g>
<path d="M38 30Q42 34 46 30M54 30Q58 34 62 30" stroke="#3e7c52" stroke-width="2" fill="none"/></svg>`,
    },

    {
      id: "lucia",
      name: "Lucia",
      subtitle: { en: "Lucia, bringer of light", sv: "Lucia, ljusbärerskan" },
      factPrefix: { en: "A little light — ", sv: "En tändning — " },
      tips: {
        en: [
          "Light a candle. Or a desk lamp. Either works.",
          "Wear white if you can. I find it improves recall.",
          "Sing quietly if you must. Your neighbour is also studying.",
          "Saffron is in the bullar, not the test.",
          "Lucia is December 13. Mark your calendar for darkness + light.",
        ],
        sv: [
          "Tänd ett ljus. Eller en lampa. Båda funkar.",
          "Bär vitt om du kan. Förbättrar minnet, sägs det.",
        ],
      },
      pet: {
        en: ["Sjung.", "Lussekatt please.", "Mind the candles."],
        sv: ["Sjung.", "Lussekatt tack.", "Akta ljusen."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="94" rx="22" ry="2" fill="rgba(11,31,51,.18)"/>
<path d="M28 50Q28 70 36 88L64 88Q72 70 72 50L50 38Z" fill="#c8a050"/>
<ellipse cx="50" cy="58" rx="20" ry="22" fill="#f3d2b0"/>
<path d="M28 40Q50 30 72 40" stroke="#3e7c52" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="32" y="20" width="3" height="14" fill="#fff"/>
<ellipse cx="33.5" cy="18" rx="2" ry="3" fill="#fecc00"/>
<rect x="44" y="14" width="3" height="14" fill="#fff"/>
<ellipse cx="45.5" cy="12" rx="2" ry="3" fill="#fecc00"/>
<rect x="56" y="14" width="3" height="14" fill="#fff"/>
<ellipse cx="57.5" cy="12" rx="2" ry="3" fill="#fecc00"/>
<rect x="68" y="20" width="3" height="14" fill="#fff"/>
<ellipse cx="69.5" cy="18" rx="2" ry="3" fill="#fecc00"/>
<circle cx="42" cy="58" r="1.6" fill="#0b1f33"/>
<circle cx="58" cy="58" r="1.6" fill="#0b1f33"/>
<path d="M44 68Q50 72 56 68" stroke="#bc1f2a" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
    },

    {
      id: "snogubbe",
      name: "Snögubbe",
      subtitle: { en: "The snowman", sv: "Snögubben" },
      factPrefix: { en: "Cold fact — ", sv: "Sval fakta — " },
      tips: {
        en: [
          "I melt for you. Literally, by April.",
          "Study now while the days are dark. Reward: long summer evenings.",
          "The carrot is decorative. Don't eat me.",
          "Built in 5 minutes. Studied for 6. You're already ahead of me.",
          "Vinter is hard. Vinter is also when Swedes do their best plugging.",
        ],
        sv: [
          "Jag smälter för din skull. Bokstavligen, till april.",
          "Plugga nu när det är mörkt. Belöning: ljusa sommarkvällar.",
        ],
      },
      pet: {
        en: ["Brr.", "Mind the carrot.", "Snögubbe needs scarf."],
        sv: ["Brr.", "Akta moroten.", "Snögubben behöver halsduk."],
      },
      svg: `<svg viewBox="0 0 100 100" class="dala-horse">
<ellipse cx="50" cy="96" rx="22" ry="2" fill="rgba(11,31,51,.18)"/>
<circle cx="50" cy="80" r="16" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
<circle cx="50" cy="56" r="12" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
<circle cx="50" cy="34" r="10" fill="#fff" stroke="#0b1f33" stroke-width="1"/>
<rect x="42" y="16" width="16" height="8" fill="#0b1f33"/>
<rect x="38" y="22" width="24" height="3" fill="#0b1f33"/>
<rect x="46" y="22" width="8" height="2" fill="#bc1f2a"/>
<rect x="38" y="42" width="24" height="4" fill="#bc1f2a"/>
<rect x="58" y="44" width="3" height="10" fill="#bc1f2a"/>
<circle cx="46" cy="32" r="1.6" fill="#0b1f33"/>
<circle cx="54" cy="32" r="1.6" fill="#0b1f33"/>
<path d="M50 34L60 37L50 38Z" fill="#ff8c1a"/>
<path d="M42 38Q46 41 50 38" stroke="#0b1f33" stroke-width="1.2" fill="none"/>
<circle cx="50" cy="54" r="1.2" fill="#0b1f33"/>
<circle cx="50" cy="60" r="1.2" fill="#0b1f33"/>
<line x1="38" y1="54" x2="22" y2="46" stroke="#6b4520" stroke-width="2"/>
<line x1="62" y1="54" x2="78" y2="46" stroke="#6b4520" stroke-width="2"/></svg>`,
    },
  ];

  // ---------- Seasonal default ----------

  function seasonalDefault() {
    const d = new Date();
    const m = d.getMonth(), day = d.getDate();
    if (m === 11 && day === 13) return "lucia";
    if (m === 11) return "tomte";
    if (m === 0 || m === 1) return "snogubbe";
    if (m === 9 && day === 4) return "kanel";
    if (m === 5 && day >= 19 && day <= 25) return "stang";
    return "dala";
  }

  function currentLang() {
    try { return localStorage.getItem("smt_lang") || "en"; } catch { return "en"; }
  }
  function getBuddyId() {
    try { return localStorage.getItem("smt_buddy") || seasonalDefault(); } catch { return "dala"; }
  }
  function getBuddy() {
    return BUDDIES.find((b) => b.id === getBuddyId()) || BUDDIES[0];
  }

  // ---------- Render ----------

  function renderBuddy() {
    const fig = document.getElementById("dala-figure");
    const nameEl = document.getElementById("dala-name");
    if (!fig) return;
    const b = getBuddy();
    fig.innerHTML = b.svg;
    if (nameEl) nameEl.textContent = `${b.name} · ${b.subtitle[currentLang()] || b.subtitle.en}`;
  }

  let hideTimer = null;
  let fadeTimer = null;
  function showMessage(html, opts = {}) {
    const bubble = document.getElementById("dala-bubble");
    const msg = document.getElementById("dala-msg");
    const widget = document.getElementById("dala-buddy");
    if (!bubble || !msg || !widget) return;
    msg.innerHTML = html;
    clearTimeout(hideTimer);
    clearTimeout(fadeTimer);
    bubble.hidden = false;
    bubble.classList.remove("is-out");
    // next frame, trigger transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => bubble.classList.add("is-in"));
    });
    widget.classList.add("is-talking");
    const ms = opts.autoHide ?? 9000;
    if (ms > 0) hideTimer = setTimeout(hideMessage, ms);
  }
  function hideMessage() {
    const bubble = document.getElementById("dala-bubble");
    const widget = document.getElementById("dala-buddy");
    if (!bubble) return;
    bubble.classList.remove("is-in");
    bubble.classList.add("is-out");
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      bubble.hidden = true;
      bubble.classList.remove("is-out");
    }, 480);
    if (widget) widget.classList.remove("is-talking");
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

  function showRandomTip() { showMessage(pickLine()); }

  function showGreeting() {
    const b = getBuddy();
    const lang = currentLang();
    const greetings = {
      en: [
        `Hej. I'm ${b.name}. I'll be your study buddy. Tap me anytime.`,
        `${b.name} reporting for duty. Click me for tips and Swedish facts.`,
        `Welcome. ${b.name} here. Click me, I have things to say.`,
      ],
      sv: [
        `Hej. Jag är ${b.name}. Din pluggkompis. Tryck när du vill.`,
        `${b.name} här. Klicka för tips och svenska fakta.`,
      ],
    };
    const list = greetings[lang] || greetings.en;
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
    const path = (location.hash || "#/").replace(/^#/, "").split("?")[0];
    const b = getBuddy();
    const lang = currentLang();
    const lines = {
      "/practice": {
        en: `${b.name} says: ten questions, no penalty for wrong ones. Just tap and learn.`,
        sv: `${b.name} säger: tio frågor, inget straff för fel. Tryck och lär.`,
      },
      "/ebook": {
        en: `${b.name} loves a quiet read. Pick a chapter from the left.`,
        sv: `${b.name} gillar en lugn läsning. Välj kapitel till vänster.`,
      },
    };
    if (lines[path]) showMessage(lines[path][lang] || lines[path].en);
  }

  // ---------- Public API ----------

  window.smtBuddyList = () => BUDDIES.map((b) => ({
    id: b.id, name: b.name, subtitle: b.subtitle, svg: b.svg,
  }));
  window.smtSetBuddy = (id) => {
    try { localStorage.setItem("smt_buddy", id); } catch {}
    renderBuddy();
    setTimeout(() => {
      const b = getBuddy();
      const lang = currentLang();
      showMessage(
        lang === "sv"
          ? `Hej. Jag är ${b.name}. Trevligt att hänga ihop.`
          : `Hej. I'm ${b.name}. Nice to be on duty.`
      );
    }, 100);
  };
  window.smtBuddyCelebrate = (msgEn, msgSv) => {
    const lang = currentLang();
    showMessage(lang === "sv" ? msgSv : msgEn, { autoHide: 6000 });
  };
  window.smtBuddyConsole = (msgEn, msgSv) => {
    const lang = currentLang();
    showMessage(lang === "sv" ? msgSv : msgEn, { autoHide: 5500 });
  };
  window.smtBuddyHide = () => {
    const w = document.getElementById("dala-buddy");
    if (w) w.hidden = true;
    try { localStorage.setItem("smt_buddy_hidden", "1"); } catch {}
  };
  window.smtBuddyShow = () => {
    const w = document.getElementById("dala-buddy");
    if (w) w.hidden = false;
    try { localStorage.removeItem("smt_buddy_hidden"); } catch {}
  };

  // ---------- Wire up ----------

  function activateBuddyFigure() {
    const bubble = document.getElementById("dala-bubble");
    if (bubble && !bubble.hidden) hideMessage();
    else if (Math.random() < 0.4) petReaction();
    else showRandomTip();
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#dala-figure")) {
      activateBuddyFigure();
      return;
    }
    if (e.target.closest("#dala-bubble-close")) { hideMessage(); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (!e.target.closest("#dala-figure")) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    activateBuddyFigure();
  });

  window.addEventListener("hashchange", () => setTimeout(pageNudge, 400));
  document.addEventListener("click", (e) => {
    // re-render name when language changes
    if (e.target.closest(".lang button[data-lang]") || e.target.closest('[data-set="language"] button')) {
      setTimeout(renderBuddy, 50);
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    let hidden = false;
    try { hidden = localStorage.getItem("smt_buddy_hidden") === "1"; } catch {}
    const widget = document.getElementById("dala-buddy");
    if (!widget) return;
    widget.hidden = hidden;
    renderBuddy();
    if (!hidden) {
      let seen = false;
      try { seen = sessionStorage.getItem("smt_buddy_greeted") === "1"; } catch {}
      if (!seen) {
        setTimeout(() => {
          showGreeting();
          try { sessionStorage.setItem("smt_buddy_greeted", "1"); } catch {}
        }, 1800);
      }
    }
  });
})();
