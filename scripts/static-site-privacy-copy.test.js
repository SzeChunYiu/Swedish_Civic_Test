const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function readConsentSource() {
  const appSource = read('site/app.js');
  const start = appSource.indexOf('/* ============================ ADS + CONSENT */');
  const end = appSource.indexOf('/* ============================ PRACTICE QUIZ */', start);
  assert.notEqual(start, -1);
  assert.ok(end > start);
  return appSource.slice(start, end);
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function createAdSlot({ presetNpa = false } = {}) {
  const attributes = new Map();
  if (presetNpa) attributes.set('data-npa', '1');
  return {
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
  };
}

function runStaticAdConsent(choices, options = {}) {
  const consentChoices = Array.isArray(choices) ? choices : [choices];
  const adSlot = createAdSlot(options);
  const appendedScripts = [];
  const adRequests = [];
  const adsQueue = [];
  adsQueue.push = function pushAdRequest(value) {
    adRequests.push({
      requestNonPersonalizedAds: this.requestNonPersonalizedAds,
      value,
    });
    return Array.prototype.push.call(this, value);
  };

  const context = {
    document: {
      addEventListener() {},
      createElement(tagName) {
        return { tagName: String(tagName).toUpperCase() };
      },
      getElementById() {
        return null;
      },
      head: {
        appendChild(script) {
          appendedScripts.push({
            requestNonPersonalizedAds: adsQueue.requestNonPersonalizedAds,
            src: script.src,
          });
          return script;
        },
      },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === 'ins.adsbygoogle') return [adSlot];
        return [];
      },
    },
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    window: {
      addEventListener() {},
      adsbygoogle: adsQueue,
    },
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(readConsentSource(), context, { filename: 'site/app.js', timeout: 3000 });
  consentChoices.forEach((choice) => {
    vm.runInContext(`smtApplyConsent(${JSON.stringify(choice)})`, context, {
      filename: 'site/app.js',
      timeout: 3000,
    });
  });

  return {
    adRequests,
    adSlot,
    appendedScripts,
    requestNonPersonalizedAds: adsQueue.requestNonPersonalizedAds,
  };
}

test('static site privacy copy rejects stale monetization claims', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  [
    /real ad rendering is disabled/i,
    /avst[aä]ngd f[oö]r v1\.0/i,
    /If we ever add premium/i,
    /Om vi n[aå]gonsin l[aä]gger till premium/i,
    /we don't sell anything/i,
    /s[aä]ljer ingenting/i,
    /collects nothing and shares nothing/i,
    /samlar inget och delar inget/i,
    /collects no user data and shares no user data/i,
    /samlar inga anv[aä]ndardata och delar inga anv[aä]ndardata/i,
    /No third-party trackers/i,
    /Inga tredjepartssp[aå]rare/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site privacy copy names current ads, consent, and Remove Ads behavior', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  [
    /Google AdSense/,
    /Google Mobile Ads \(AdMob\)/,
    /ad and consent signals/,
    /annons- och samtyckessignaler/,
    /Remove Ads is an optional one-time 29 SEK purchase that removes ads/,
    /Ta bort annonser .*eng[aå]ngsk[oö]p p[aå] 29 SEK som tar bort annonser/,
    /ads never collect study answers or progress/,
    /annonser samlar aldrig in dina studiesvar eller framsteg/,
  ].forEach((pattern) => assert.match(surface, pattern));
});

test('static AdSense consent sets documented async NPA signal before ad requests', () => {
  const min = runStaticAdConsent('min');

  assert.equal(min.requestNonPersonalizedAds, 1);
  assert.equal(min.adSlot.getAttribute('data-npa'), '1');
  assert.equal(min.appendedScripts.length, 1);
  assert.match(
    min.appendedScripts[0].src,
    /^https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/,
  );
  assert.equal(min.appendedScripts[0].requestNonPersonalizedAds, 1);
  assert.equal(min.adRequests.length, 1);
  assert.equal(min.adRequests[0].requestNonPersonalizedAds, 1);

  const all = runStaticAdConsent('all', { presetNpa: true });

  assert.equal(all.requestNonPersonalizedAds, 0);
  assert.equal(all.adSlot.hasAttribute('data-npa'), false);
  assert.equal(all.appendedScripts.length, 1);
  assert.equal(all.appendedScripts[0].requestNonPersonalizedAds, 0);
  assert.equal(all.adRequests.length, 1);
  assert.equal(all.adRequests[0].requestNonPersonalizedAds, 0);

  const reset = runStaticAdConsent(['min', 'all']);

  assert.equal(reset.requestNonPersonalizedAds, 0);
  assert.equal(reset.adSlot.hasAttribute('data-npa'), false);
  assert.equal(reset.appendedScripts.length, 1);
  assert.equal(reset.adRequests.length, 1);
});

test('static Necessary only privacy copy stays aligned with AdSense NPA runtime signal', () => {
  const app = read('site/app.js');
  const surface = [app, read('site/index.html')].join('\n');
  const promisesEnglishNpa = /Necessary only<\/em> keeps ads non-personali[sz]ed/i.test(surface);
  const promisesSwedishNpa =
    /Bara n[oö]dv[aä]ndiga<\/em> h[aå]ller annonserna icke-personaliserade/i.test(surface);

  if (promisesEnglishNpa || promisesSwedishNpa) {
    assert.match(app, /requestNonPersonalizedAds\s*=\s*1/);
  }
});
