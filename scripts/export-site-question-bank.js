#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const checkMode = process.argv.includes('--check');
const BASE_STATIC_CHAPTER_LOCALES = new Set(['sv', 'en']);
const CHAPTER_LOCALIZATION_ENGLISH_WELFARE_GLOSS_PATTERN = /\(welfare\)/i;

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function localizedQuestionText(question) {
  return Object.assign(
    { en: question.questionEn, sv: question.questionSv },
    question.questionText || {},
  );
}

function localizedOptionText(option) {
  return Object.assign({ en: option.textEn, sv: option.textSv }, option.text || {});
}

function localizedExplanationText(question) {
  return Object.assign(
    { en: question.explanationEn, sv: question.explanationSv },
    question.explanationText || {},
  );
}

function localizedChapterTitle(chapter) {
  return Object.assign({ en: chapter.nameEn, sv: chapter.nameSv }, chapter.nameText || {});
}

function localizedChapterDescription(chapter) {
  return Object.assign(
    { en: chapter.descriptionEn, sv: chapter.descriptionSv },
    chapter.descriptionText || {},
  );
}

function parseChapterNumber(chapterId) {
  const match = /^ch(\d{2})$/.exec(chapterId);
  if (!match) throw new Error(`Invalid chapter id for static site export: ${chapterId}`);
  return Number.parseInt(match[1], 10);
}

const STATIC_SOURCE_PROVENANCE_COPY_KEYS = [
  'terms.s3.p',
  'sources.lede',
  'sources.s4.li1',
  'settings.sources.hint',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function singleQuotedJsString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function normalizeStaticInlineHtml(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function questionPhraseEn(count) {
  return `${count} ${count === 1 ? 'question' : 'questions'}`;
}

function uhrCitedQuestionPhraseEn(count) {
  return count === 1 ? `${count} UHR-cited question` : `${count} UHR-cited questions`;
}

function derivedQuestionPhraseEn(count) {
  return count === 1
    ? `${count} editorially derived question`
    : `${count} editorially derived questions`;
}

function questionPhraseSv(count) {
  return `${count} ${count === 1 ? 'fråga' : 'frågor'}`;
}

function directUhrPhraseSv(count) {
  return count === 1
    ? `${count} fråga med direkt hänvisning`
    : `${count} frågor med direkt hänvisning`;
}

function uhrCitedQuestionPhraseSv(count) {
  return count === 1 ? `${count} UHR-citerad fråga` : `${count} UHR-citerade frågor`;
}

function derivedQuestionPhraseSv(count) {
  return count === 1
    ? `${count} redaktionellt härledd fråga`
    : `${count} redaktionellt härledda frågor`;
}

function summarizeQuestionProvenance(questions) {
  const counts = { uhr: 0, derived: 0, editorial: 0 };

  questions.forEach((question) => {
    const provenance = question && question.questionProvenance;
    if (!Object.prototype.hasOwnProperty.call(counts, provenance)) {
      throw new Error(`Unsupported static question provenance: ${provenance || 'missing'}`);
    }
    counts[provenance] += 1;
  });

  return counts;
}

function buildStaticQuestionBankMetadata(questions, chapters) {
  return {
    questionCount: questions.length,
    chapterCount: chapters.length,
    provenanceCounts: summarizeQuestionProvenance(questions),
  };
}

function chapterLocalizationWelfareGlossOffenders(chapters, scope = 'static') {
  const offenders = [];
  for (const chapter of chapters || []) {
    for (const field of ['title', 'description']) {
      const localized = chapter[field] || {};
      for (const [locale, value] of Object.entries(localized)) {
        if (BASE_STATIC_CHAPTER_LOCALES.has(locale)) continue;
        if (
          typeof value === 'string' &&
          CHAPTER_LOCALIZATION_ENGLISH_WELFARE_GLOSS_PATTERN.test(value)
        ) {
          offenders.push(`${scope}.chapter${chapter.id}.${field}.${locale}`);
        }
      }
    }
  }

  return offenders;
}

function buildStaticSourceProvenanceTranslations(provenanceCounts) {
  const counts = {
    uhr: Number(provenanceCounts.uhr) || 0,
    derived: Number(provenanceCounts.derived) || 0,
    editorial: Number(provenanceCounts.editorial) || 0,
  };
  const uhrQuestionsEn = questionPhraseEn(counts.uhr);
  const derivedQuestionsEn = questionPhraseEn(counts.derived);
  const uhrCitedQuestionsEn = uhrCitedQuestionPhraseEn(counts.uhr);
  const derivedTaggedQuestionsEn = derivedQuestionPhraseEn(counts.derived);
  const uhrQuestionsSv = directUhrPhraseSv(counts.uhr);
  const derivedQuestionsSv = derivedQuestionPhraseSv(counts.derived);

  return {
    en: {
      'terms.s3.p': `The current question bank has ${uhrQuestionsEn} cited directly to UHR's public study material <em>Sverige i fokus</em> and ${derivedTaggedQuestionsEn} from those same UHR themes. Every question carries a <strong>UHR</strong> or <strong>Derived</strong> provenance badge so you always know which is which, and Settings → Question sources lets you restrict practice + mock to UHR only. Humans miss things — if you find an error, the <a href="#/support">support page</a> is the fastest fix.`,
      'sources.lede': `The current question bank has two provenance families and every question is badged: <strong>UHR</strong> (${uhrQuestionsEn} cited directly to <em>Sverige i fokus</em>) and <strong>Derived</strong> (${derivedQuestionsEn} written editorially from those same UHR themes for additional practice volume). You can restrict practice + mock to UHR only in Settings → Question sources.`,
      'sources.s4.li1': `The bank has ${uhrCitedQuestionsEn} and ${derivedTaggedQuestionsEn}; the per-question badge tells you which family each one belongs to, and Settings → Question sources lets you opt out of derived content.`,
      'settings.sources.hint': `All sources includes UHR-cited and derived practice questions. UHR only limits practice and mock exams to the ${uhrQuestionsEn} traceable to Sverige i fokus citations.`,
    },
    sv: {
      'terms.s3.p': `Den nuvarande frågebanken har ${uhrQuestionsSv} till UHR:s offentliga studiematerial <em>Sverige i fokus</em> och ${derivedQuestionPhraseSv(counts.derived)} som bygger på samma UHR-teman. Varje fråga är märkt med <strong>UHR</strong> eller <strong>Härledd</strong> så du alltid vet vilken familj den tillhör, och i Inställningar → Frågekällor kan du begränsa övning + provsim till enbart UHR. Människor missar saker — hittar du fel är <a href="#/support">supportsidan</a> snabbaste vägen.`,
      'sources.lede': `Den nuvarande frågebanken har två källfamiljer och varje fråga är märkt: <strong>UHR</strong> (${uhrQuestionsSv} till <em>Sverige i fokus</em>) och <strong>Härledd</strong> (${derivedQuestionsSv} från samma UHR-teman för extra övningsmängd). Du kan begränsa övning + provsim till enbart UHR i Inställningar → Frågekällor.`,
      'sources.s4.li1': `Frågebanken har ${uhrCitedQuestionPhraseSv(counts.uhr)} och ${derivedQuestionsSv}; märkningen per fråga visar vilken familj varje fråga tillhör, och i Inställningar → Frågekällor kan du välja bort härlett innehåll.`,
      'settings.sources.hint': `Alla källor visar UHR-hänvisade frågor och härledda övningsfrågor. Endast UHR begränsar övning och övningsprov till de ${questionPhraseSv(counts.uhr)} som kan spåras till hänvisningar i Sverige i fokus.`,
    },
  };
}

function applyStaticSourceProvenanceCountsToAppJs(source, provenanceCounts) {
  const translations = buildStaticSourceProvenanceTranslations(provenanceCounts);
  let nextSource = source;

  STATIC_SOURCE_PROVENANCE_COPY_KEYS.forEach((key) => {
    const pattern = new RegExp(`('${escapeRegExp(key)}':\\s*)'((?:\\\\.|[^'\\\\])*)'`, 'g');
    let occurrence = 0;
    nextSource = nextSource.replace(pattern, (match, prefix) => {
      occurrence += 1;
      const lang = occurrence === 1 ? 'en' : occurrence === 2 ? 'sv' : null;
      if (!lang) return match;
      return `${prefix}${singleQuotedJsString(translations[lang][key])}`;
    });

    if (occurrence !== 2) {
      throw new Error(
        `Expected two site/app.js translation entries for ${key}, found ${occurrence}`,
      );
    }
  });

  return nextSource;
}

function replaceStaticFallbackValue(source, key, value) {
  const pattern = new RegExp(
    `(<([a-z][a-z0-9-]*)\\b(?=[^>]*\\bdata-i18n="${escapeRegExp(key)}")[^>]*>)([\\s\\S]*?)(</\\2>)`,
  );
  const match = pattern.exec(source);
  if (!match) {
    throw new Error(`Missing site/index.html fallback element for ${key}`);
  }

  return source.replace(
    pattern,
    (fullMatch, openingTag, tagName, innerHtml, closingTag, offset) => {
      if (normalizeStaticInlineHtml(innerHtml) === normalizeStaticInlineHtml(value)) {
        return fullMatch;
      }
      const lineMatch = source.slice(0, offset).match(/(?:^|\n)([ \t]*)[^\n]*$/);
      const outerIndent = lineMatch ? lineMatch[1] : '';
      const innerIndent = `${outerIndent}  `;
      return `${openingTag}\n${innerIndent}${value}\n${outerIndent}${closingTag}`;
    },
  );
}

function applyStaticSourceProvenanceCountsToIndexHtml(source, provenanceCounts) {
  const translations = buildStaticSourceProvenanceTranslations(provenanceCounts).en;
  return STATIC_SOURCE_PROVENANCE_COPY_KEYS.reduce(
    (nextSource, key) => replaceStaticFallbackValue(nextSource, key, translations[key]),
    source,
  );
}

function loadCanonicalExportInputs() {
  const questionModule = loadTs('data/questions.ts');
  return {
    questions: questionModule.questions,
    sourceQuestions: questionModule.sourceQuestions,
    chapters: loadTs('data/chapters.ts', 'chapters'),
    getQuestionProvenance: loadTs('lib/content/provenance.ts', 'getQuestionProvenance'),
  };
}

function buildPublishedQuestionListFromSourceQuestions(sourceQuestions) {
  const derivePublishedQuestions = loadTs(
    'lib/content/derivedQuestions.ts',
    'derivePublishedQuestions',
  );
  const applyQuestionLocalizationPilot = loadTs(
    'data/questionLocalizations.ts',
    'applyQuestionLocalizationPilot',
  );
  const generatedQuestions = derivePublishedQuestions(sourceQuestions, sourceQuestions.length + 1);
  return [
    ...sourceQuestions,
    ...generatedQuestions.map((question) =>
      typeof applyQuestionLocalizationPilot === 'function'
        ? applyQuestionLocalizationPilot(question)
        : question,
    ),
  ];
}

function buildSiteQuestionBank(inputs = {}) {
  const needsCanonical = !inputs.questions || !inputs.chapters || !inputs.getQuestionProvenance;
  const canonical = needsCanonical ? loadCanonicalExportInputs() : {};
  const questions = inputs.questions || canonical.questions;
  const chapters = inputs.chapters || canonical.chapters;
  const getQuestionProvenance = inputs.getQuestionProvenance || canonical.getQuestionProvenance;
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const chapterEmoji = new Map([
    ['ch01', '🌍'],
    ['ch02', '🏛'],
    ['ch03', '🗳'],
    ['ch04', '🗳'],
    ['ch05', '⚖️'],
    ['ch06', '📰'],
    ['ch07', '🤝'],
    ['ch08', '💼'],
    ['ch09', '🏥'],
    ['ch10', '📜'],
    ['ch11', '🌐'],
    ['ch12', '🕊'],
    ['ch13', '🕯'],
  ]);

  const siteQuestions = questions.map((question) => {
    const chapter = chapterById.get(question.chapterId);
    if (!chapter) throw new Error(`Missing chapter metadata for ${question.id}`);

    const answer = question.options.findIndex((option) => option.id === question.correctOptionId);
    if (answer < 0) {
      throw new Error(`Missing correct option ${question.correctOptionId} for ${question.id}`);
    }

    const chapterNumber = parseChapterNumber(question.chapterId);
    return {
      id: question.id,
      chapterId: chapterNumber,
      chapter: `Ch. ${String(chapterNumber).padStart(2, '0')} · ${chapter.nameEn}`,
      type: question.type,
      q: localizedQuestionText(question),
      opts: question.options.map(localizedOptionText),
      answer,
      why: localizedExplanationText(question),
      source: {
        title: 'Sverige i fokus',
        chapter: question.uhrReference.chapter,
        section: question.uhrReference.section,
        page: question.uhrReference.pageApprox,
        ...(question.supplementalSources
          ? { supplementalSources: question.supplementalSources }
          : {}),
      },
      questionProvenance: getQuestionProvenance(question),
      difficulty: question.difficulty,
      tags: question.tags,
    };
  });

  const chapterMeta = chapters.map((chapter) => {
    const chapterNumber = parseChapterNumber(chapter.id);
    return {
      id: chapterNumber,
      emoji: chapterEmoji.get(chapter.id) || '•',
      title: localizedChapterTitle(chapter),
      description: localizedChapterDescription(chapter),
      questionCount: chapter.questionCount,
    };
  });

  return {
    questions: siteQuestions,
    chapters: chapterMeta,
    metadata: buildStaticQuestionBankMetadata(siteQuestions, chapterMeta),
  };
}

function generateStaticSiteQuestionBankJs(inputs = {}) {
  const bank = buildSiteQuestionBank(inputs);
  return `/* Almost Swedish - generated static question bank.
   Source: data/questions.ts and data/chapters.ts.
   Run: node scripts/export-site-question-bank.js
*/

(function () {
  "use strict";

  window.SMT_QUESTIONS = ${JSON.stringify(bank.questions, null, 2)};

  window.SMT_CHAPTERS_META = ${JSON.stringify(bank.chapters, null, 2)};

  window.SMT_QUESTION_BANK_META = ${JSON.stringify(bank.metadata, null, 2)};
})();
`;
}

function parseStaticSiteQuestionBank(source, filename = 'site/questions.js') {
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename, timeout: 3000 });
  const questions = context.window.SMT_QUESTIONS;
  const chapters = context.window.SMT_CHAPTERS_META;
  const metadata = context.window.SMT_QUESTION_BANK_META;
  if (!Array.isArray(questions)) {
    throw new Error(`${filename} did not expose window.SMT_QUESTIONS`);
  }
  if (!Array.isArray(chapters)) {
    throw new Error(`${filename} did not expose window.SMT_CHAPTERS_META`);
  }
  return { questions, chapters, metadata };
}

function changedIds(expectedItems, actualItems) {
  const expectedById = new Map(expectedItems.map((item) => [String(item.id), item]));
  const actualById = new Map(actualItems.map((item) => [String(item.id), item]));
  const ids = [...new Set([...expectedById.keys(), ...actualById.keys()])].sort();
  return ids.filter(
    (id) => JSON.stringify(expectedById.get(id)) !== JSON.stringify(actualById.get(id)),
  );
}

function summarizeStaticQuestionBankDrift(
  existingSource,
  expectedBank = buildSiteQuestionBank(),
  generatedSource,
) {
  const actualBank = parseStaticSiteQuestionBank(existingSource);
  const questionIds = changedIds(expectedBank.questions, actualBank.questions);
  const chapterIds = changedIds(expectedBank.chapters, actualBank.chapters);
  const hasSemanticDrift = questionIds.length > 0 || chapterIds.length > 0;
  const hasGeneratedSource = typeof generatedSource === 'string';
  return {
    questionIds,
    chapterIds,
    hasSemanticDrift,
    formatOnly: hasGeneratedSource && !hasSemanticDrift && existingSource !== generatedSource,
    sourceMatchesGenerated: hasGeneratedSource ? existingSource === generatedSource : undefined,
  };
}

function formatIdList(ids) {
  const visible = ids.slice(0, 24).join(', ');
  const suffix = ids.length > 24 ? `, ... +${ids.length - 24} more` : '';
  return visible ? `${visible}${suffix}` : 'none';
}

function formatStaticQuestionBankDrift(drift) {
  return [
    `Format-only drift: ${drift.formatOnly ? 'yes' : 'no'}`,
    `Changed question ids: ${formatIdList(drift.questionIds)}`,
    `Changed chapter ids: ${formatIdList(drift.chapterIds)}`,
  ].join('\n');
}

function main() {
  const outPath = path.join(repoRoot, 'site', 'questions.js');
  const appPath = path.join(repoRoot, 'site', 'app.js');
  const indexPath = path.join(repoRoot, 'site', 'index.html');
  const generated = generateStaticSiteQuestionBankJs();
  const bank = buildSiteQuestionBank();

  if (checkMode) {
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    let hasDrift = false;
    if (existing !== generated) {
      try {
        const drift = summarizeStaticQuestionBankDrift(existing, bank, generated);
        if (!drift.hasSemanticDrift) {
          console.log(
            `Static site question-bank semantic parity OK (${bank.questions.length} questions, ${bank.chapters.length} chapters)`,
          );
          if (drift.formatOnly) {
            console.log(formatStaticQuestionBankDrift(drift));
          }
        } else {
          hasDrift = true;
          console.error(
            'site/questions.js is semantically out of sync; run node scripts/export-site-question-bank.js',
          );
          console.error(formatStaticQuestionBankDrift(drift));
        }
      } catch (error) {
        hasDrift = true;
        console.error(`Could not summarize static question-bank drift: ${error.message}`);
      }
    } else {
      console.log(
        `Static site question-bank parity OK (${bank.questions.length} questions, ${bank.chapters.length} chapters)`,
      );
    }

    [
      [appPath, applyStaticSourceProvenanceCountsToAppJs],
      [indexPath, applyStaticSourceProvenanceCountsToIndexHtml],
    ].forEach(([filePath, applyCounts]) => {
      const currentSource = fs.readFileSync(filePath, 'utf8');
      const expectedSource = applyCounts(currentSource, bank.metadata.provenanceCounts);
      if (currentSource !== expectedSource) {
        hasDrift = true;
        console.error(
          `${path.relative(repoRoot, filePath)} has stale provenance count copy; run node scripts/export-site-question-bank.js`,
        );
      }
    });

    if (hasDrift) process.exit(1);
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, generated);
  fs.writeFileSync(
    appPath,
    applyStaticSourceProvenanceCountsToAppJs(
      fs.readFileSync(appPath, 'utf8'),
      bank.metadata.provenanceCounts,
    ),
  );
  fs.writeFileSync(
    indexPath,
    applyStaticSourceProvenanceCountsToIndexHtml(
      fs.readFileSync(indexPath, 'utf8'),
      bank.metadata.provenanceCounts,
    ),
  );
  console.log(
    `Exported ${bank.questions.length} questions and ${bank.chapters.length} chapters to ${path.relative(
      repoRoot,
      outPath,
    )}`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  applyStaticSourceProvenanceCountsToAppJs,
  applyStaticSourceProvenanceCountsToIndexHtml,
  buildPublishedQuestionListFromSourceQuestions,
  buildSiteQuestionBank,
  buildStaticSourceProvenanceTranslations,
  chapterLocalizationWelfareGlossOffenders,
  formatStaticQuestionBankDrift,
  generateStaticSiteQuestionBankJs,
  loadCanonicalExportInputs,
  parseStaticSiteQuestionBank,
  summarizeQuestionProvenance,
  summarizeStaticQuestionBankDrift,
};
