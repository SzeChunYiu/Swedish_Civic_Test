/* Sveriges Medborgartest — Ebook reader
   12 chapters; first 3 written in full, rest are friendly stubs.
   Hash: #/ebook?c=intro|1|2|...|12
*/

(function () {
  "use strict";

  const CHAPTERS = {
    intro: {
      kicker: { en: "How to read this book", sv: "Hur man läser den här boken" },
      title:  { en: "Slow down.", sv: "Sakta in." },
      title_em: { en: "We've got coffee.", sv: "Vi har kaffe." },
      lede:   {
        en: "This is a companion, not a textbook. Read a chapter, take a quiz, take a fika. The order doesn't matter — but if you finish in order you get a feel for how Sweden's pieces fit together.",
        sv: "Det här är ett sällskap, inte en lärobok. Läs ett kapitel, gör ett quiz, ta en fika. Ordningen spelar mindre roll — men i ordning får du en känsla för hur Sveriges delar passar ihop.",
      },
      body: {
        en: `
          <h2>What this book is</h2>
          <p>A plain-language reader for Sweden's citizenship test (medborgarskapsprovet). Written for adults learning Swedish civic life from scratch, by someone who's been there.</p>
          <h2>What it's <em>not</em></h2>
          <p>Not the official material. Not a legal document. Not a substitute for the actual sources — every claim here is footnoted in the <a href="#/sources">sources page</a>.</p>
          <h2>How to use it</h2>
          <ul>
            <li>Each chapter is ~10 minutes to read.</li>
            <li>End-of-chapter <em>facts to remember</em> are what you'll see on the test.</li>
            <li>Use the <a href="#/practice">Practice</a> tab to drill the same material with feedback.</li>
            <li>If you forget something, that's normal. The practice quiz brings it back.</li>
          </ul>
          <blockquote><p>You don't need to remember everything. You need to remember the right things. That's what we're here for.</p></blockquote>
          <div class="ebook__factbox"><h4>Tip</h4><p>Read on your phone in 10-minute windows. Most people who pass this way do it in three weeks, not three days.</p></div>
        `,
        sv: `
          <h2>Vad den här boken är</h2>
          <p>En läsbar genomgång av medborgarskapsprovet. Skriven för vuxna som lär sig svenskt samhällsliv från noll — av någon som varit där.</p>
          <h2>Vad den <em>inte</em> är</h2>
          <p>Inte officiellt material. Inte juridiskt dokument. Inte ett substitut för källorna — varje påstående har fotnot i <a href="#/sources">källor</a>.</p>
        `,
      },
    },

    "1": {
      kicker: { en: "Chapter 01 · History", sv: "Kapitel 01 · Historia" },
      title:  { en: "A very short", sv: "En mycket kort" },
      title_em: { en: "history of Sweden.", sv: "Sveriges historia." },
      lede: {
        en: "From Vikings to NATO in under 4,000 words. The dynasties are skippable. The patterns are not.",
        sv: "Från vikingar till NATO på under 4 000 ord. Dynastierna kan du hoppa över. Mönstren kan du inte.",
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
        sv: `<p>Svenska översättningen kommer i v1.1 — på engelska tills vidare. Klicka <a href="#/practice">Öva</a> för svenska frågor.</p>`,
      },
    },

    "2": {
      kicker: { en: "Chapter 02 · Government", sv: "Kapitel 02 · Statsskick" },
      title:  { en: "How Sweden", sv: "Hur Sverige" },
      title_em: { en: "is governed.", sv: "styrs." },
      lede: {
        en: "A king who can't decide, a Riksdag that does, and 290 municipalities you'll mostly only meet at the recycling station.",
        sv: "En kung som inte bestämmer, en riksdag som gör det, och 290 kommuner du oftast bara träffar vid återvinningen.",
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
        sv: `<p>Svenska översättningen kommer i v1.1.</p>`,
      },
    },

    "3": {
      kicker: { en: "Chapter 03 · Rights", sv: "Kapitel 03 · Rättigheter" },
      title:  { en: "Four basic laws,", sv: "Fyra grundlagar," },
      title_em: { en: "one long list of rights.", sv: "en lång lista av rättigheter." },
      lede: {
        en: "Sweden's constitution is split across four laws. The Press Act is the oldest in the world. The rest is almost as interesting.",
        sv: "Sveriges författning står i fyra grundlagar. Tryckfrihetsförordningen är världens äldsta. Resten är nästan lika kul.",
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
        sv: `<p>Svenska översättningen kommer i v1.1.</p>`,
      },
    },

    // Stubs for the rest
    "4":  { kicker: { en: "Chapter 04 · Work & taxes", sv: "Kapitel 04 · Arbete & skatt" } },
    "5":  { kicker: { en: "Chapter 05 · Equality", sv: "Kapitel 05 · Jämställdhet" } },
    "6":  { kicker: { en: "Chapter 06 · Society", sv: "Kapitel 06 · Samhälle" } },
    "7":  { kicker: { en: "Chapter 07 · Nature", sv: "Kapitel 07 · Natur" } },
    "8":  { kicker: { en: "Chapter 08 · Culture", sv: "Kapitel 08 · Kultur" } },
    "9":  { kicker: { en: "Chapter 09 · Money", sv: "Kapitel 09 · Pengar" } },
    "10": { kicker: { en: "Chapter 10 · EU & world", sv: "Kapitel 10 · EU & världen" } },
    "11": { kicker: { en: "Chapter 11 · Migration", sv: "Kapitel 11 · Migration" } },
    "12": { kicker: { en: "Chapter 12 · Mock exam", sv: "Kapitel 12 · Provexempel" } },
  };

  const ORDER = ["intro", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  function getLang() {
    try { return localStorage.getItem("smt_lang") || "en"; } catch { return "en"; }
  }
  function getActiveChapter() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const m = hash.match(/[?&]c=([^&]+)/);
    return m ? m[1] : "intro";
  }

  function render() {
    const reader = document.getElementById("ebook-reader");
    if (!reader) return;
    const id = getActiveChapter();
    const lang = getLang();
    const ch = CHAPTERS[id] || CHAPTERS.intro;

    const titleHtml = ch.title
      ? `<h1 class="ebook__h1"><span>${(ch.title[lang] || ch.title.en)}</span> <em>${(ch.title_em[lang] || ch.title_em.en)}</em></h1>`
      : `<h1 class="ebook__h1"><em>${(ch.kicker[lang] || ch.kicker.en).split("·")[1]?.trim() || (ch.kicker[lang] || ch.kicker.en)}</em></h1>`;

    const ledeHtml = ch.lede
      ? `<p class="ebook__lede">${ch.lede[lang] || ch.lede.en}</p>`
      : "";

    const bodyHtml = ch.body
      ? (ch.body[lang] || ch.body.en)
      : `<div class="ebook__stub">
          <h3>${lang === "sv" ? "Kommer snart" : "Coming soon"}</h3>
          <p>${lang === "sv"
              ? "Vi skriver det här kapitlet just nu. Tills dess kan du öva på frågorna eller läsa ett av de färdiga kapitlen i sidofältet."
              : "We're writing this chapter now. In the meantime, drill the questions in Practice, or jump to one of the completed chapters in the sidebar."}</p>
        </div>`;

    const idx = ORDER.indexOf(id);
    const prev = idx > 0 ? ORDER[idx - 1] : null;
    const next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    const pager = `
      <nav class="ebook__pager">
        ${prev ? `<a href="#/ebook?c=${prev}"><span class="lbl">${lang === "sv" ? "Förra" : "Previous"}</span><span>${(CHAPTERS[prev].kicker[lang] || CHAPTERS[prev].kicker.en)}</span></a>` : `<span></span>`}
        ${next ? `<a href="#/ebook?c=${next}" class="next"><span class="lbl">${lang === "sv" ? "Nästa" : "Next"}</span><span>${(CHAPTERS[next].kicker[lang] || CHAPTERS[next].kicker.en)}</span></a>` : `<span></span>`}
      </nav>
    `;

    reader.innerHTML = `
      <div class="ebook__crumb">${ch.kicker[lang] || ch.kicker.en}</div>
      ${titleHtml}
      ${ledeHtml}
      ${bodyHtml}
      ${pager}
    `;

    // highlight sidebar
    document.querySelectorAll(".ebook__nav a[data-eb]").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.eb === id);
    });

    // scroll reader to top
    reader.scrollTop = 0;
  }

  function isOnEbook() {
    const path = (location.hash || "#/").replace(/^#/, "").split("?")[0];
    return path === "/ebook";
  }

  window.addEventListener("hashchange", () => { if (isOnEbook()) render(); });
  window.addEventListener("DOMContentLoaded", () => { if (isOnEbook()) render(); });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".lang button[data-lang]") || e.target.closest('[data-set="language"] button')) {
      if (isOnEbook()) setTimeout(render, 50);
    }
  });
})();
