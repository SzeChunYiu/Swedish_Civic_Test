const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function readProvenanceBadgeSource() {
  return fs.readFileSync(path.join(repoRoot, 'components/quiz/ProvenanceBadge.tsx'), 'utf8');
}

function assertProvenanceBadgeSourceNoteDisclosure(source) {
  const provenanceHelperSource = fs.readFileSync(
    path.join(repoRoot, 'lib/content/provenance.ts'),
    'utf8',
  );
  const requiredRules = [
    [/import \{ useState \} from 'react';/, 'source-note state'],
    [/Pressable, StyleSheet, Text, View/, 'pressable badge imports'],
    [/getProvenanceDescription,/, 'localized provenance description import'],
    [/export interface ProvenanceBadgeProps \{/, 'explicit props interface'],
    [/const \[sourceNoteVisible, setSourceNoteVisible\] = useState\(false\);/, 'collapsed default'],
    [
      /const sourceNoteText = getProvenanceDescription\(provenance, language\);/,
      'localized source note lookup',
    ],
    [/sourceNotePrefix: 'Källanteckning'/, 'Swedish source-note prefix'],
    [/sourceNotePrefix: 'Source note'/, 'English source-note prefix'],
    [/accessibilityRole="button"/, 'button role'],
    [/accessibilityState=\{\{ expanded: sourceNoteVisible \}\}/, 'expanded state'],
    [/hitSlop=\{space\[1\]\}/, 'token hit slop'],
    [/onFocus=\{\(\) => setSourceNoteVisible\(true\)\}/, 'focus disclosure'],
    [/onPress=\{\(\) => setSourceNoteVisible\(true\)\}/, 'press disclosure'],
    [/sourceNoteVisible \? \(/, 'conditional source-note render'],
    [/\{noteLabel\}/, 'visible source-note label'],
  ];

  for (const [pattern, label] of requiredRules) {
    assert.match(source, pattern, `ProvenanceBadge missing ${label}`);
  }

  assert.match(
    provenanceHelperSource,
    /descriptionSv: 'Direkt från UHR:s utbildningsmaterial Sverige i fokus\.'/,
    'provenance helper missing Swedish UHR source note',
  );
  assert.match(
    provenanceHelperSource,
    /descriptionEn: "Directly from UHR's study material Sverige i fokus\."/,
    'provenance helper missing English UHR source note',
  );
  assert.doesNotMatch(
    source,
    /accessibilityRole="text"[\s\S]*style=\{\[styles\.badge, tone\]\}/,
    'ProvenanceBadge should not regress to a static text-only badge',
  );
}

test('quiz QuestionCard keeps question text and accessibility summary in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/quiz/QuestionCard.tsx'), 'utf8');
  const helperSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/questionText.ts'), 'utf8');

  assert.equal(summary.questionCardAccessibilityRulesValidated, 20);
  assert.equal(summary.questionCardAccessibilityParityValidated, true);
  assert.match(source, /const questionAccessibilityLabel =/);
  assert.match(source, /language\?: AppLanguage/);
  assert.match(source, /const copy = questionCardCopy\[language\];/);
  assert.match(
    source,
    /difficultyValueLabels: Record<PracticeQuestion\['difficulty'\] \| 'practice', string>/,
  );
  assert.match(source, /easy: 'Lätt'/);
  assert.match(source, /medium: 'Medel'/);
  assert.match(source, /hard: 'Svår'/);
  assert.match(source, /practice: 'Övning'/);
  assert.match(source, /easy: 'Easy'/);
  assert.match(source, /medium: 'Medium'/);
  assert.match(source, /hard: 'Hard'/);
  assert.match(source, /practice: 'Practice'/);
  assert.match(source, /const difficultyLabel = copy\.difficultyValueLabels\[difficulty\];/);
  assert.match(source, /getQuestionDisplayText\(question, language\)/);
  assert.match(source, /getQuestionTranslationText\(question, language\)/);
  assert.match(source, /getQuestionSourceCitation\(question, language\)/);
  assert.match(source, /difficultyLabel: 'Svårighetsgrad'/);
  assert.match(source, /questionLabel: 'Fråga'/);
  assert.match(source, /secondaryLabel: 'Engelsk översättning'/);
  assert.match(source, /sourceCitationLabel: 'Källhänvisning'/);
  assert.match(source, /difficultyLabel: 'Difficulty'/);
  assert.match(source, /\$\{copy\.difficultyLabel\}: \$\{difficultyLabel\}/);
  assert.match(source, /\$\{copy\.questionLabel\}: \$\{questionText\}/);
  assert.match(
    source,
    /questionTranslation \? `\$\{copy\.secondaryLabel\}: \$\{questionTranslation\}` : null/,
  );
  assert.match(source, /\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}/);
  assert.match(source, /Swedish original/);
  assert.doesNotMatch(source, /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/);
  assert.match(
    source,
    /<Card>\s*<Text accessibilityLabel=\{questionAccessibilityLabel\} style=\{styles\.accessibilitySummary\}>/,
  );
  assert.match(source, /accessibilitySummary: \{/);
  assert.match(source, /<Text style=\{styles\.label\}>\{difficultyLabel\}<\/Text>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.question\}>/);
  assert.match(source, /\{questionText\}/);
  assert.match(source, /<Text style=\{styles\.sourceCitation\}>\{sourceCitation\}<\/Text>/);
  assert.match(source, /\{questionTranslation\}/);
  assert.match(helperSource, /const QUESTION_DISPLAY_FALLBACKS/);
  assert.match(helperSource, /sv: 'Fråga saknas'/);
  assert.match(helperSource, /en: 'Question unavailable'/);
  assert.match(helperSource, /fallback = QUESTION_DISPLAY_FALLBACKS\[language\]/);
});

test('QuestionCard provenance badge reveals localized source notes on press or focus', () => {
  assertProvenanceBadgeSourceNoteDisclosure(readProvenanceBadgeSource());
});

test('QuestionCard provenance badge parity rejects static source-note drift', () => {
  const mutatedSource = readProvenanceBadgeSource().replace(
    '        onFocus={() => setSourceNoteVisible(true)}\n',
    '',
  );

  assert.throws(() => assertProvenanceBadgeSourceNoteDisclosure(mutatedSource), /focus disclosure/);
});

test('QuestionCard accessibility parity rejects English-only missing-question fallback', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/questionText.ts')) {
    return String(originalReadFileSync.call(this, filePath, ...args))
      .replace("sv: 'Fråga saknas'", "sv: 'Question unavailable'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing localized question display fallback/,
  );
});

test('QuestionCard accessibility parity rejects mixed-language source citation prefixes', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/questionText.ts')) {
    return String(originalReadFileSync.call(this, filePath, ...args))
      .replace(/Källa: Sverige i fokus/g, 'Källa/Source: Sverige i fokus')
      .replace(/Source: Sverige i fokus/g, 'Källa/Source: Sverige i fokus');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard source citation helper still exposes mixed Källa\/Source prefix/,
  );
});

test('QuestionCard accessibility parity rejects dropped question header', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('accessibilityRole="header" style={styles.question}', 'style={styles.question}');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing question header text for accessibility parity/,
  );
});

test('QuestionCard accessibility parity rejects parent card grouping of source controls', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<Card>', '<Card accessibilityLabel={questionAccessibilityLabel}>');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard parent Card must not group nested source controls/,
  );
});

test('QuestionCard accessibility parity rejects hidden source citation drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<Text style={styles.sourceCitation}>{sourceCitation}</Text>', 'null');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing visible source citation line for accessibility parity/,
  );
});

test('QuestionCard accessibility parity rejects raw difficulty enum display', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text style={styles.label}>{difficultyLabel}</Text>',
        '<Text style={styles.label}>{difficulty}</Text>',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing visible difficulty label for accessibility parity/,
  );
});
