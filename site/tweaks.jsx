/* Sveriges Medborgartest — Tweaks panel
   Swedish palette presets + slogan variants + display knobs.
*/

const SMT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "flag",
  "headlineSize": 100,
  "showFlagMotif": true,
  "sloganVariant": "midsommar",
  "adsMode": "both"
}/*EDITMODE-END*/;

const SMT_PALETTES = {
  flag: {
    label: "Flag — blue + gold",
    vars: {
      "--blue": "#006aa7", "--blue-deep": "#003a5c", "--blue-ink": "#00253c",
      "--gold": "#fecc00", "--gold-deep": "#d9a900", "--gold-soft": "#fff3cf",
    },
  },
  midsommar: {
    label: "Midsommar — green + flower yellow",
    vars: {
      "--blue": "#3e7c52", "--blue-deep": "#22442b", "--blue-ink": "#1d3324",
      "--gold": "#f4c542", "--gold-deep": "#c79a18", "--gold-soft": "#fdf2c4",
    },
  },
  lingonberry: {
    label: "Lingonberry — red + cream",
    vars: {
      "--blue": "#8c1a2b", "--blue-deep": "#5b0e1c", "--blue-ink": "#2a0b11",
      "--gold": "#e9b94a", "--gold-deep": "#b88a19", "--gold-soft": "#fbe7b7",
    },
  },
  archipelago: {
    label: "Archipelago — slate + sun",
    vars: {
      "--blue": "#2f4a5c", "--blue-deep": "#1b2e3b", "--blue-ink": "#10212c",
      "--gold": "#ffd166", "--gold-deep": "#d39e2c", "--gold-soft": "#ffeec1",
    },
  },
  royal: {
    label: "Royal — navy + brass",
    vars: {
      "--blue": "#0f2748", "--blue-deep": "#091a32", "--blue-ink": "#080f1e",
      "--gold": "#c9a227", "--gold-deep": "#8f7117", "--gold-soft": "#f5e3a6",
    },
  },
};

const SMT_SLOGANS = {
  midsommar: { a: "Pass the test.", b: "Earn the passport.", c: "Brag at midsommar." },
  abba:      { a: "Take a chance.", b: "Mamma mia, study.", c: "Pass like a dancing queen." },
  fika:      { a: "Sip the coffee.", b: "Open the app.",     c: "Pass with pulla." },
  serious:   { a: "Study Sweden's", b: "civic test.",        c: "On your phone." },
};

function applyPalette(name) {
  const p = SMT_PALETTES[name] || SMT_PALETTES.flag;
  const root = document.documentElement.style;
  Object.entries(p.vars).forEach(([k, v]) => root.setProperty(k, v));
}
function applyHeadlineSize(pct) {
  let sheet = document.getElementById("smt-tweak-sheet");
  if (!sheet) {
    sheet = document.createElement("style");
    sheet.id = "smt-tweak-sheet";
    document.head.appendChild(sheet);
  }
  const k = pct / 100;
  sheet.textContent = `
    .hero h1 { font-size: clamp(${36 * k}px, ${5.6 * k}vw, ${76 * k}px); }
    h2.headline { font-size: clamp(${30 * k}px, ${4 * k}vw, ${56 * k}px); }
    .doc h1 { font-size: clamp(${36 * k}px, ${4.5 * k}vw, ${64 * k}px); }
  `;
}
function applyFlagMotif(on) {
  const el = document.querySelector(".hero__cross");
  if (el) el.style.display = on ? "" : "none";
}
function applySlogan(variant) {
  const s = SMT_SLOGANS[variant] || SMT_SLOGANS.midsommar;
  const a = document.querySelector('[data-i18n="hero.h1a"]');
  const b = document.querySelector('[data-i18n="hero.h1b"]');
  const c = document.querySelector('[data-i18n="hero.h1c"]');
  // override the i18n value so language toggles don't snap us back
  if (window.i18n && window.i18n.en) {
    window.i18n.en["hero.h1a"] = s.a;
    window.i18n.en["hero.h1b"] = s.b;
    window.i18n.en["hero.h1c"] = s.c;
  }
  if (a) a.textContent = s.a;
  if (b) b.textContent = s.b;
  if (c) c.textContent = s.c;
}

const { useEffect } = React;

function PaletteGrid({ value, onChange }) {
  const items = Object.entries(SMT_PALETTES);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
      {items.map(([key, p]) => {
        const isOn = value === key;
        const [name, desc] = p.label.split(" — ");
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: "flex", flexDirection: "column", gap: 6,
              padding: 8, borderRadius: 10,
              background: isOn ? "rgba(0,0,0,.06)" : "transparent",
              border: isOn ? "1.5px solid #0b1f33" : "1px solid rgba(0,0,0,.12)",
              cursor: "pointer", textAlign: "left",
              font: "inherit", color: "#0b1f33",
            }}
            title={p.label}
          >
            <div style={{ display: "flex", gap: 3, height: 22, borderRadius: 5, overflow: "hidden" }}>
              <span style={{ flex: 1.4, background: p.vars["--blue"] }} />
              <span style={{ flex: 1,   background: p.vars["--gold"] }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontSize: 10, opacity: .65, lineHeight: 1.3 }}>{desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function SMTTweaks() {
  const [t, setTweak] = useTweaks(SMT_TWEAK_DEFAULTS);

  useEffect(() => { applyPalette(t.palette); }, [t.palette]);
  useEffect(() => { applyHeadlineSize(t.headlineSize); }, [t.headlineSize]);
  useEffect(() => { applyFlagMotif(t.showFlagMotif); }, [t.showFlagMotif]);
  useEffect(() => { applySlogan(t.sloganVariant); }, [t.sloganVariant]);
  useEffect(() => { if (window.smtSetAdsMode) window.smtSetAdsMode(t.adsMode); }, [t.adsMode]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Swedish palette" />
      <PaletteGrid value={t.palette} onChange={(v) => setTweak("palette", v)} />

      <TweakSection label="Hero slogan" />
      <TweakSelect
        label="Variant"
        value={t.sloganVariant}
        options={[
          { value: "midsommar", label: "Midsommar brag" },
          { value: "abba",      label: "ABBA energy" },
          { value: "fika",      label: "Fika first" },
          { value: "serious",   label: "Just the facts" },
        ]}
        onChange={(v) => setTweak("sloganVariant", v)}
      />

      <TweakSection label="Display" />
      <TweakSlider
        label="Headline size"
        value={t.headlineSize}
        min={70} max={130} step={5} unit="%"
        onChange={(v) => setTweak("headlineSize", v)}
      />
      <TweakToggle
        label="Flag cross in hero"
        value={t.showFlagMotif}
        onChange={(v) => setTweak("showFlagMotif", v)}
      />

      <TweakSection label="Ads" />
      <TweakSelect
        label="Placement"
        value={t.adsMode}
        options={[
          { value: "none",   label: "No ads" },
          { value: "inline", label: "Inline only (between sections)" },
          { value: "anchor", label: "Bottom anchor only" },
          { value: "both",   label: "Inline + anchor" },
        ]}
        onChange={(v) => setTweak("adsMode", v)}
      />
      <p style={{ fontSize: 11, color: "#44586b", lineHeight: 1.45, margin: "6px 4px 0" }}>
        Ads only show after consent. Clear localStorage to re-test the banner.
      </p>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.body.appendChild(document.createElement("div")))
  .render(<SMTTweaks />);
