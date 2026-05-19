/* Almost Swedish — Ebook reader
   Intro + 13 study chapters with EN reader text and SV study briefs.
   Hash: #/ebook?c=intro|1|2|...|13
*/

(function () {
  'use strict';

  function svStudyBrief(points, facts, practiceHint) {
    const items = points.map((point) => `<li>${point}</li>`).join('');
    return `
      <h2>Det viktigaste</h2>
      <ul>${items}</ul>
      <h2>Plugga smart</h2>
      <p>${practiceHint || 'Läs punkterna långsamt, öppna sedan övningen för samma kapitel och låt fel svar visa vad du ska läsa om.'}</p>
      <div class="ebook__factbox"><h4>Fakta att kunna</h4><p>${facts}</p></div>
    `;
  }

  const OFFICIAL_TEST_SOURCE_NOTES = Object.freeze({
    retrievedDate: '2026-05-19',
    aboutUrl: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
    faqUrl: 'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
    registrationUrl: 'https://www.uhr.se/medborgarskapsprovet/anmalan/',
    studyMaterialUrl: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  });

  const CHAPTERS = {
    intro: {
      kicker: { en: 'How to read this book', sv: 'Hur man läser den här boken' },
      title: { en: 'Slow down.', sv: 'Sakta in.' },
      title_em: { en: "We've got coffee.", sv: 'Vi har kaffe.' },
      lede: {
        en: "This is a companion, not a textbook. Read a chapter, take a quiz, take a fika. The order doesn't matter — but if you finish in order you get a feel for how Sweden's pieces fit together.",
        sv: 'Det här är ett sällskap, inte en lärobok. Läs ett kapitel, gör ett quiz, ta en fika. Ordningen spelar mindre roll — men i ordning får du en känsla för hur Sveriges delar passar ihop.',
      },
      body: {
        en: `
          <h2>What this book is</h2>
          <p>A plain-language reader for Sweden's citizenship test (medborgarskapsprovet). Written for adults learning Swedish civic life from scratch, by someone who's been there.</p>
          <h2>What it's <em>not</em></h2>
          <p>Not the official material. Not a legal document. Not a substitute for UHR's public study material. Use the <a href="#/sources">Sources page</a> for question-bank citations, and check UHR's material when a fact matters.</p>
          <h2>How to use it</h2>
          <ul>
            <li>Each chapter is ~10 minutes to read.</li>
            <li>End-of-chapter <em>facts to remember</em> are what you'll see on the test.</li>
            <li>Use the <a href="#/practice">Practice</a> tab to drill the same material with feedback.</li>
            <li>If you forget something, that's normal. The practice quiz brings it back.</li>
          </ul>
          <blockquote><p>You don't need to remember everything. You need to remember the right things. That's what we're here for.</p></blockquote>
          <div class="ebook__factbox"><h4>Tip</h4><p>Read on your phone in 10-minute windows. Short, repeated sessions make it easier to notice what you know, what needs review, and when to check UHR's material again.</p></div>
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
            <li>Avsluta veckan med ett övningsprov så att tidskänslan sitter.</li>
          </ul>
          <blockquote><p>Du behöver inte kunna allt på en gång. Du behöver veta vad som är värt att repetera.</p></blockquote>
          <div class="ebook__factbox"><h4>Tips</h4><p>Växla mellan svenska och engelska om ett begrepp känns tungt. Provet kräver svenska, men förståelsen kan byggas på båda språken.</p></div>
        `,
      },
    },

    1: {
      kicker: { en: 'Chapter 01 · History', sv: 'Kapitel 01 · Historia' },
      title: { en: 'A very short', sv: 'En kort historia' },
      title_em: { en: 'history of Sweden.', sv: 'om Sverige.' },
      lede: {
        en: 'From Vikings to NATO in under 4,000 words. The dynasties are skippable. The patterns are not.',
        sv: 'Från vikingar till NATO på under 4 000 ord. Dynastierna kan du hoppa över. Mönstren kan du inte.',
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>National day: June 6 · Joined EU: 1995 · Joined NATO: 2024 · Longest period of peace: continuous since 1814.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Sveriges historia handlar om hur ett äldre kungarike blev en modern demokrati med riksdag, grundlagar och offentlig välfärd.',
            'Nationaldagen den 6 juni kopplas till Gustav Vasas val till kung 1523 och till 1809 års regeringsform.',
            'Under 1900-talet byggdes folkhemmet ut med skola, vård, pensioner och socialförsäkringar finansierade med skatter.',
            'I modern tid är EU-medlemskapet 1995, euroomröstningen 2003 och NATO-medlemskapet 2024 centrala hållpunkter.',
          ],
          'Nationaldag: 6 juni · EU: 1995 · Euroomröstning: 2003 · NATO: 2024.',
        ),
      },
    },

    2: {
      kicker: { en: 'Chapter 02 · Government', sv: 'Kapitel 02 · Statsskick' },
      title: { en: 'How Sweden', sv: 'Hur Sverige' },
      title_em: { en: 'is governed.', sv: 'styrs.' },
      lede: {
        en: "A king who can't decide, a Riksdag that does, and 290 municipalities you'll mostly only meet at the recycling station.",
        sv: 'En kung som inte bestämmer, en riksdag som gör det, och 290 kommuner du oftast bara träffar vid återvinningen.',
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Riksdag size: 349 · Threshold: 4% · Election interval: 4 years · Number of regions: 21 · Number of municipalities: 290.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Sverige är både en konstitutionell monarki och en parlamentarisk demokrati: kungen har ceremoniella uppgifter, medan riksdag och regering fattar politiska beslut.',
            'Riksdagen har 349 ledamöter, beslutar om lagar och statsbudget och kontrollerar regeringen.',
            'Regionerna ansvarar främst för hälso- och sjukvård och kollektivtrafik. Kommunerna ansvarar bland annat för skola, socialtjänst, vatten och avfall.',
            'Allmänna val hålls vart fjärde år. Svenska medborgare röstar till riksdagen, regionen och kommunen.',
          ],
          'Riksdag: 349 ledamöter · Val: vart fjärde år · Regioner: 21 · Kommuner: 290.',
        ),
      },
    },

    3: {
      kicker: { en: 'Chapter 03 · Rights', sv: 'Kapitel 03 · Rättigheter' },
      title: { en: 'Four basic laws,', sv: 'Fyra grundlagar,' },
      title_em: { en: 'one long list of rights.', sv: 'en lång lista av rättigheter.' },
      lede: {
        en: "Sweden's constitution is split across four laws. The Press Act is the oldest in the world. The rest is almost as interesting.",
        sv: 'Sveriges författning står i fyra grundlagar. Tryckfrihetsförordningen är världens äldsta. Resten är nästan lika kul.',
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Number of basic laws: 4 · Oldest: Tryckfrihetsförordningen (1766) · Inheritance rule: oldest child regardless of gender (since 1980).</p></div>
        `,
        sv: svStudyBrief(
          [
            'Sverige har fyra grundlagar: regeringsformen, successionsordningen, tryckfrihetsförordningen och yttrandefrihetsgrundlagen.',
            'Grundlagarna skyddar bland annat yttrandefrihet, religionsfrihet, föreningsfrihet och rätten att demonstrera.',
            'Offentlighetsprincipen betyder att många handlingar hos myndigheter är offentliga, om de inte omfattas av sekretess.',
            'Rättigheter hör ihop med ansvar: hot, hets mot folkgrupp, förtal och diskriminering kan fortfarande vara förbjudet.',
          ],
          'Grundlagar: 4 · Tryckfrihetsförordningen: 1766 · Offentlighetsprincipen: insyn i myndigheter.',
        ),
      },
    },

    4: {
      kicker: { en: 'Chapter 04 · Work & taxes', sv: 'Kapitel 04 · Arbete & skatt' },
      title: { en: 'Work,', sv: 'Arbete,' },
      title_em: { en: 'taxes, and the welfare state.', sv: 'skatt och välfärdsstaten.' },
      lede: {
        en: "Sweden takes a lot of your salary and gives most of it back. The trick is knowing what it's paying for.",
        sv: 'Sverige tar mycket av din lön och ger tillbaka det mesta. Knepet är att veta vad det går till.',
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>VAT default: 25% · VAT food: 12% · Parental leave: 480 days · No legal minimum wage · Collective agreements set sector minimums.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Arbetsmarknaden bygger mycket på kollektivavtal mellan fackförbund och arbetsgivare. Där regleras ofta lön, arbetstid och villkor.',
            'Skatter finansierar gemensam välfärd som skola, vård, omsorg, pensioner och socialförsäkringar.',
            'Skatteverket hanterar skatt och folkbokföring. Personnummer och folkbokföringsadress används i många vardagliga kontakter.',
            'Privatekonomi i Sverige handlar ofta om lön efter skatt, räkningar, försäkringar, sparande och att betala i tid.',
          ],
          'Kollektivavtal · Kommunalskatt · Skatteverket · Välfärd finansieras gemensamt.',
        ),
      },
    },

    5: {
      kicker: { en: 'Chapter 05 · Equality', sv: 'Kapitel 05 · Jämställdhet' },
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Same-sex marriage: 2009 · Discrimination grounds: 7 · Parental leave: 480 days · Reserved per parent: 90 days each.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Jämställdhet betyder att kvinnor och män ska ha samma rättigheter, skyldigheter och möjligheter.',
            'Diskrimineringslagen skyddar mot diskriminering i till exempel arbetsliv, utbildning, vård och samhällsservice.',
            'Sverige erkänner samkönade äktenskap och familjer med olika sammansättning.',
            'Föräldraförsäkringen är byggd för att båda föräldrarna ska kunna ta ansvar för barn och arbete.',
          ],
          'Diskrimineringslagen · Samkönade äktenskap: 2009 · Föräldraledighet: 480 dagar per barn.',
        ),
      },
    },

    6: {
      kicker: { en: 'Chapter 06 · Society', sv: 'Kapitel 06 · Samhälle' },
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Compulsory school: 10 years (förskoleklass + grades 1–9) · Health hotline: 1177 · Number of regions: 21 · University tuition: free for residents.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Skolan ska ge barn kunskaper och likvärdiga möjligheter. Grundskolan omfattar förskoleklass och årskurs 1-9.',
            'Regionerna ansvarar för hälso- och sjukvård. 1177 används för sjukvårdsrådgivning och kontakt med vården.',
            'Kommunerna ansvarar för äldreomsorg, socialtjänst och många vardagliga välfärdstjänster.',
            'Socialtjänsten kan ge stöd när någon behöver skydd, råd, ekonomisk hjälp eller omsorg.',
          ],
          'Grundskola: 10 år · 1177 · Regioner ansvarar för vård · Kommuner ansvarar för omsorg och socialtjänst.',
        ),
      },
    },

    7: {
      kicker: { en: 'Chapter 07 · Nature', sv: 'Kapitel 07 · Natur' },
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
          <p>Sweden is the fifth-largest country in Europe. 69% is forest, 9% lake, the rest a mix of mountain, agricultural land, and 35 000 km of coastline (including islands). The longest river is Klarälven–Göta älv (about 720 km). The largest lake is Vänern.</p>
          <h2>Climate and seasons</h2>
          <p>Four full seasons, dramatic in the north. Winter is dark; summer has midnight sun above the Arctic Circle. Climate change is making winters warmer and summers wetter; the government has committed to net-zero emissions by 2045.</p>
          <h2>Recycling and the everyday environment</h2>
          <p>Sweden recycles obsessively. Glass, metal, paper, plastic, food waste, batteries, and electronics all go to dedicated bins, often at the local <em>återvinningscentral</em>. Bottle and can returns (<em>pant</em>) come back as a small cash refund.</p>
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Allemansrätten — the right of public access · Net-zero target year: 2045 · Largest lake: Vänern · Coastline incl. islands: ~35 000 km.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Allemansrätten gör det möjligt att röra sig i naturen, plocka bär och svamp och vistas ute med hänsyn.',
            'Huvudregeln är enkel: inte störa och inte förstöra. Du får inte skada mark, djur, växter eller gå in på privat tomt.',
            'Sverige har stora skogar, många sjöar, fjäll i norr och lång kust. Klimatet varierar mycket mellan norr och söder.',
            'Miljöarbete märks i vardagen genom återvinning, pant, naturvård och mål för minskade utsläpp.',
          ],
          'Allemansrätten · Inte störa, inte förstöra · Vänern är största sjön · Miljömål och återvinning.',
        ),
      },
    },

    8: {
      kicker: { en: 'Chapter 08 · Culture', sv: 'Kapitel 08 · Kultur' },
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>National day: June 6 · Midsommar: third Friday in June · Lucia: December 13 · Christmas Eve (not Day) is the main celebration.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Traditioner förändras över tid, men de hjälper människor att känna igen året och skapa gemenskap.',
            'Midsommar, jul, påsk, nyår, lucia, första maj, nationaldagen och alla helgons dag är vanliga provnära exempel.',
            'Fika är en vardaglig social vana: kaffe eller te, något litet att äta och tid att prata.',
            'Nya traditioner från människor som flyttat till Sverige är också en del av dagens samhälle.',
          ],
          'Nationaldag: 6 juni · Midsommar: tredje fredagen i juni · Lucia: 13 december · Jul firas främst 24 december.',
        ),
      },
    },

    9: {
      kicker: { en: 'Chapter 09 · Money', sv: 'Kapitel 09 · Pengar' },
      title: { en: 'Money,', sv: 'Pengar,' },
      title_em: { en: 'banks, and BankID.', sv: 'banker och BankID.' },
      lede: {
        en: 'Sweden is one of the least cash-dependent countries on earth. Almost every transaction now passes through one little app.',
        sv: 'Sverige är ett av världens minst kontantberoende länder. Nästan varje transaktion går genom en liten app.',
      },
      body: {
        en: `
          <h2>The Swedish krona (SEK)</h2>
          <p>Sweden voted against adopting the euro in 2003 and uses the krona (kr). The Riksbank — Sweden's central bank, founded 1668, the world's oldest — sets monetary policy and prints the cash that almost nobody uses.</p>
          <h2>Cards and apps</h2>
          <p>Cash is rare. Most shops accept only card. Person-to-person payment runs through <em>Swish</em> — a mobile payment app built jointly by the banks. You enter a phone number, the amount, a note, and tap.</p>
          <h2>BankID</h2>
          <p>BankID is Sweden's national digital identity. It's a private system (built by the banks), but is treated as legal proof of identity for tax filing, signing leases, voting in elections, opening accounts, and almost any government service. Getting a BankID is one of the first practical steps a new resident takes.</p>
          <h2>Banks and accounts</h2>
          <p>To open a Swedish bank account you typically need a personnummer or coordination number, an ID, and proof of residence. Major banks: Swedbank, Handelsbanken, SEB, Nordea. Online-only options include Avanza and Nordnet.</p>
          <h2>Pension</h2>
          <p>Three layers: state pension (allmän pension), occupational pension via your employer (tjänstepension), and any private savings. The state pension covers the basics; the rest matters more than people expect.</p>
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Currency: Swedish krona (SEK) · Riksbank: world's oldest central bank (1668) · Voted against euro: 2003 · Payment app: Swish · Digital ID: BankID.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Sverige använder svenska kronor, SEK. Sverige röstade nej till euron i folkomröstningen 2003.',
            'Riksbanken är Sveriges centralbank och ansvarar för penningpolitiken.',
            'BankID och Swish är vanliga i vardagen, men de är bankanknutna tjänster och inte samma sak som medborgarskap.',
            'Pensionen består ofta av allmän pension, tjänstepension och eventuellt privat sparande.',
          ],
          'Valuta: svensk krona · Euroomröstning: 2003 · Riksbanken · Swish · BankID.',
        ),
      },
    },

    10: {
      kicker: { en: 'Chapter 10 · EU & world', sv: 'Kapitel 10 · EU & världen' },
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
          <p>Sweden was militarily non-aligned for over 200 years, neutral through both World Wars and the Cold War. After Russia's invasion of Ukraine, Sweden applied to join NATO in May 2022 and formally joined on 7 March 2024.</p>
          <h2>The United Nations and aid</h2>
          <p>Sweden joined the UN in 1946. It is among the world's largest donors of development aid per capita, and historically commits ~1% of GNI to international assistance. Dag Hammarskjöld, UN Secretary-General 1953–1961, was Swedish.</p>
          <h2>Defence</h2>
          <p>Conscription (<em>värnplikt</em>) was reactivated in 2017 and applies to both men and women born 1999 onwards. Not everyone is called up — selection is based on tests and motivation. Service is typically 9–12 months.</p>
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Joined EU: 1995 · Voted against euro: 2003 · Joined NATO: 2024 · UN member since: 1946 · Conscription reactivated: 2017.</p></div>
        `,
        sv: svStudyBrief(
          [
            'Sverige är medlem i EU sedan 1995 och deltar i europeiskt samarbete om bland annat handel, miljö och fri rörlighet.',
            'Sverige använder fortfarande kronan efter folkomröstningen om euron 2003.',
            'Sverige blev medlem i NATO 2024 efter en lång period av militär alliansfrihet.',
            'Sverige är också medlem i FN och deltar i internationellt samarbete, bistånd och säkerhetspolitik.',
          ],
          'EU: 1995 · Euroomröstning: 2003 · NATO: 2024 · FN-medlem: 1946.',
        ),
      },
    },

    11: {
      kicker: { en: 'Chapter 11 · Migration', sv: 'Kapitel 11 · Migration' },
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
            <li>Be at least 18 years old (children are usually included with a parent's application).</li>
            <li>Have a permanent residence permit, right of residence, or right of permanent residence.</li>
            <li>Have lived in Sweden for a qualifying period — typically five years (shorter for stateless persons, refugees, and Nordic citizens).</li>
            <li>Have led an orderly life — no significant criminal record.</li>
            <li>(From 2026) Pass the medborgarskapsprov — the citizenship test on civic knowledge and Swedish — and meet a Swedish-language requirement.</li>
          </ul>
          <h2>Dual citizenship</h2>
          <p>Sweden has accepted dual citizenship since 2001. You do not lose your original citizenship by becoming Swedish (subject to your origin country's rules).</p>
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>Citizenship test starts: 6 June 2026 · Standard residence requirement: 5 years · Dual citizenship: allowed (since 2001) · Decision authority: Migrationsverket.</p></div>
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
        ),
      },
    },

    12: {
      kicker: { en: 'Chapter 12 · Mock exam', sv: 'Kapitel 12 · Övningsprov' },
      title: { en: 'Mock exam', sv: 'Övningsprov' },
      title_em: { en: 'and survival guide.', sv: 'och överlevnadsguide.' },
      lede: {
        en: "You've read the whole book. Now do twenty questions, take a fika, and keep UHR's current instructions close.",
        sv: 'Du har läst hela boken. Nu gör du tjugo frågor, tar en fika och håller UHR:s aktuella instruktioner nära.',
      },
      body: {
        en: `
          <h2>What UHR has confirmed</h2>
          <p>UHR is responsible for the citizenship test. As of 19 May 2026, UHR says the first civic-knowledge sitting will be held on 15 August 2026 in Stockholm. Registration is expected to open in early June 2026, and only people who receive a letter from Migrationsverket can sign up. Seats are limited.</p>
          <p>UHR also says the August sitting is a trial sitting, will be free of charge, and will allow generous time. UHR has not yet published the exact time and place, adaptation details, full practical-day instructions, whether another sitting is possible after a failed result, or any future cost information.</p>
          <h2>How to study</h2>
          <ol>
            <li>Read this ebook end-to-end at least once. Use the Practice tab to drill what you forget.</li>
            <li>For every fact you get wrong twice, write it on a card and stick it on the fridge. Embarrassment is a great teacher.</li>
            <li>Skim the official <em>Sverige i fokus</em> PDF (free download from UHR) the week before the test. Don't try to memorise it.</li>
            <li>Sleep, eat, do not cram the night before. Sweden does not reward last-minute heroics.</li>
          </ol>
          <h2>Before test day</h2>
          <ul>
            <li>Wait for your Migrationsverket letter before trying to register.</li>
            <li>Use UHR's study material as the source of truth, then use this app for repetition.</li>
            <li>Check UHR's registration page, FAQ, and any letter you receive close to the date for identity, arrival, adaptation, and result instructions.</li>
            <li>If a practical detail is missing from UHR, do not treat old internet advice as confirmed.</li>
          </ul>
          <h2>If details change</h2>
          <p>This chapter should help you prepare without inventing logistics. When UHR publishes more practical information, follow UHR and Migrationsverket first and treat app copy as a study aid.</p>
          <div class="ebook__factbox"><h4>Current official status</h4><p>Provider: UHR · First civic-knowledge sitting: 15 August 2026 in Stockholm · Registration: early June 2026 with a Migrationsverket letter and limited seats · August sitting: free trial sitting with generous time · Practical details pending from UHR.</p><p class="ebook__source-note">Sources accessed ${OFFICIAL_TEST_SOURCE_NOTES.retrievedDate}: <a href="${OFFICIAL_TEST_SOURCE_NOTES.aboutUrl}">UHR about the citizenship test</a>; <a href="${OFFICIAL_TEST_SOURCE_NOTES.faqUrl}">UHR questions and answers</a>; <a href="${OFFICIAL_TEST_SOURCE_NOTES.registrationUrl}">UHR registration page</a>; <a href="${OFFICIAL_TEST_SOURCE_NOTES.studyMaterialUrl}">UHR study material page</a>.</p></div>
        `,
        sv: `
          <h2>Vad UHR har bekräftat</h2>
          <p>UHR ansvarar för medborgarskapsprovet. Den 19 maj 2026 anger UHR att det första samhällskunskapsprovet inom medborgarskapsprovet genomförs den 15 augusti 2026 i Stockholm. Anmälan väntas öppna i början av juni 2026, och bara den som har fått brev från Migrationsverket kan anmäla sig. Antalet platser är begränsat.</p>
          <p>UHR anger också att augustiprovet är ett utprövningsprov, att det är kostnadsfritt och att alla får generöst med tid. Exakt tid och plats, anpassningar, fullständiga instruktioner för provdagen, vad som händer efter ett underkänt resultat och eventuella framtida kostnader var inte publicerade när detta skrevs.</p>
          <h2>Så pluggar du</h2>
          <ol>
            <li>Läs den här boken från början till slut minst en gång. Använd sedan Öva för att repetera det du glömmer.</li>
            <li>Skriv upp fakta du missar två gånger. Kylskåpslappar är låg teknik, men de fungerar.</li>
            <li>Skumma UHR:s officiella <em>Sverige i fokus</em> veckan före provet och kontrollera att begreppen känns bekanta.</li>
            <li>Sov, ät och undvik sista-minuten-plugg. Hjärnan gillar lagom bättre än panik.</li>
          </ol>
          <h2>Inför provdagen</h2>
          <ul>
            <li>Vänta på brevet från Migrationsverket innan du försöker anmäla dig.</li>
            <li>Använd UHR:s studiematerial som huvudkälla och den här appen för repetition.</li>
            <li>Kontrollera UHR:s anmälningssida, frågor och svar samt brevet du får nära provdatumet för praktiska instruktioner.</li>
            <li>Om en praktisk detalj saknas hos UHR ska äldre råd på nätet inte behandlas som bekräftade.</li>
          </ul>
          <h2>När uppgifter ändras</h2>
          <p>Det här kapitlet ska hjälpa dig att förbereda dig utan att hitta på logistik. När UHR publicerar mer praktisk information ska UHR och Migrationsverket gå först, och appen ska ses som ett studiehjälpmedel.</p>
          <div class="ebook__factbox"><h4>Aktuell officiell status</h4><p>Ansvarig myndighet: UHR · Första samhällskunskapsprovet: 15 augusti 2026 i Stockholm · Anmälan: början av juni 2026 med brev från Migrationsverket och begränsat antal platser · Augustiprovet: kostnadsfritt utprövningsprov med generöst med tid · Praktiska detaljer väntar hos UHR.</p><p class="ebook__source-note">Källor hämtade ${OFFICIAL_TEST_SOURCE_NOTES.retrievedDate}: <a href="${OFFICIAL_TEST_SOURCE_NOTES.aboutUrl}">UHR om medborgarskapsprovet</a>; <a href="${OFFICIAL_TEST_SOURCE_NOTES.faqUrl}">UHR frågor och svar</a>; <a href="${OFFICIAL_TEST_SOURCE_NOTES.registrationUrl}">UHR anmälan</a>; <a href="${OFFICIAL_TEST_SOURCE_NOTES.studyMaterialUrl}">UHR studiematerial</a>.</p></div>
        `,
      },
    },

    13: {
      kicker: { en: 'Chapter 13 · Traditions', sv: 'Kapitel 13 · Traditioner' },
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
          <div class="ebook__factbox"><h4>Facts you'll see on the test</h4><p>National Day: June 6 · Walpurgis Night: April 30 · Midsummer Eve: Friday between June 19 and 25 · Lucia: December 13 · Christmas Eve: December 24.</p></div>
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

  function renderEbookProvenanceBadge(lang) {
    const sv = lang === 'sv';
    const label = sv ? 'Redaktionell' : 'Editorial';
    const note = sv
      ? 'Källtyp: Redaktionell. Egen studieguide; kontrollera fakta via källsidan och UHR-materialet.'
      : 'Provenance: Editorial. Original study guide; verify facts through the Sources page and UHR material.';
    return `<span class="ebook__provenance-badge" role="text" aria-label="${note}" title="${note}">${label}</span>`;
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

    const bodyHtml = ch.body
      ? ch.body[lang] || ch.body.en
      : `<div class="ebook__stub">
          <h3>${sv ? 'Kapitlet kunde inte öppnas' : 'Chapter could not be opened'}</h3>
          <p>${
            sv
              ? 'Välj ett kapitel i listan eller gå tillbaka till introduktionen.'
              : 'Choose a chapter from the list or return to the introduction.'
          }</p>
        </div>`;

    const idx = ORDER.indexOf(id);
    const prev = idx > 0 ? ORDER[idx - 1] : null;
    const next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    const practice = practiceLink(id);
    const progressLabel =
      id === 'intro' ? (sv ? 'Guide' : 'Guide') : `${idx} / ${ORDER.length - 1}`;
    const actions = `
      <aside class="ebook__study-actions" aria-label="${sv ? 'Nästa steg' : 'Next study steps'}">
        <div>
          <span class="ebook__progress">${progressLabel}</span>
          <p>${
            sv
              ? 'Gör kapitlet aktivt: öva direkt, kontrollera källor eller kör ett övningsprov när du har läst klart.'
              : 'Make the chapter active: practice it now, check the sources, or run a mock exam once you finish reading.'
          }</p>
        </div>
        <div class="ebook__study-links">
          <a class="btn btn--gold btn--sm" href="${practice.href}">${practice[lang]} →</a>
          <a class="btn btn--ghost btn--sm" href="#/mock">${sv ? 'Övningsprov' : 'Mock exam'}</a>
          <a class="btn btn--ghost btn--sm" href="#/sources">${sv ? 'Källor' : 'Sources'}</a>
        </div>
      </aside>
    `;
    const notes = `
      <section class="ebook__notes" aria-label="${sv ? 'Dina markeringar' : 'Your highlights'}">
        <h2>${sv ? 'Markeringar i kapitlet' : 'Chapter highlights'}</h2>
        <div id="eb-notes-list"></div>
      </section>
    `;
    const pager = `
      <nav class="ebook__pager">
        ${prev ? `<a href="#/ebook?c=${prev}"><span class="lbl">${sv ? 'Förra' : 'Previous'}</span><span>${CHAPTERS[prev].kicker[lang] || CHAPTERS[prev].kicker.en}</span></a>` : `<span></span>`}
        ${next ? `<a href="#/ebook?c=${next}" class="next"><span class="lbl">${sv ? 'Nästa' : 'Next'}</span><span>${CHAPTERS[next].kicker[lang] || CHAPTERS[next].kicker.en}</span></a>` : `<span></span>`}
      </nav>
    `;

    reader.innerHTML = `
      <div class="ebook__meta-row">
        <div class="ebook__crumb">${ch.kicker[lang] || ch.kicker.en}</div>
        ${renderEbookProvenanceBadge(lang)}
      </div>
      ${titleHtml}
      ${ledeHtml}
      ${bodyHtml}
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
