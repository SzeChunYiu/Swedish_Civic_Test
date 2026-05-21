const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const expectedGeneratedMediaStatements = [
  [
    'q781',
    'Reklamfinansierade medier drivs ofta av privata företag och får inkomster genom reklam.',
    'Advertising-funded media are often run by private companies and earn income from advertising.',
  ],
  [
    'q782',
    'Reklamfinansierade medier får aldrig sälja reklamplats.',
    'Advertising-funded media may never sell advertising space.',
  ],
  [
    'q785',
    'Många tidningar finns också på internet och uppdateras med nyheter flera gånger per dag.',
    'Many newspapers are also available online and updated with news several times per day.',
  ],
  [
    'q786',
    'Många tidningar får bara säljas som ett exemplar per år.',
    'Many newspapers may be sold only as one copy per year.',
  ],
  [
    'q789',
    'På webben och i sociala medier kan vem som helst skapa innehåll, och innehållet kontrolleras inte alltid som i andra medier.',
    'On the web and in social media, anyone can create content, and it is not always checked the same way as in other media.',
  ],
  [
    'q790',
    'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg.',
    'On the web and in social media, only responsible publishers may write posts.',
  ],
];

test('generated media true/false stems are standalone civic propositions', () => {
  const csv = read('content/question-bank.csv');
  const staticBank = read('site/questions.js');

  for (const [id, questionSv, questionEn] of expectedGeneratedMediaStatements) {
    assert.match(
      csv,
      new RegExp(
        `"${id}","ch06","true_false","${questionSv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
      ),
    );
    assert.match(
      staticBank,
      new RegExp(
        `"id": "${id}"[\\s\\S]*"sv": "${questionSv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
      ),
    );
    assert.match(
      staticBank,
      new RegExp(
        `"id": "${id}"[\\s\\S]*"en": "${questionEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
      ),
    );
  }

  [
    /^"q78[125690]","ch06","true_false","De /m,
    /^"q789","ch06","true_false","Vem som helst kan skapa innehåll där/m,
    /^"q790","ch06","true_false","Bara ansvariga utgivare får skriva inlägg där/m,
  ].forEach((pattern) => assert.doesNotMatch(csv, pattern));
});
