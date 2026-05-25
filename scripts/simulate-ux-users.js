const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const defaultReportDir = path.join(repoRoot, 'reports');
const reportDir = process.env.UX_SIM_OUTPUT_DIR
  ? path.resolve(repoRoot, process.env.UX_SIM_OUTPUT_DIR)
  : defaultReportDir;
const userCount = Number(process.env.UX_SIM_USER_COUNT ?? 10000);
const jsonPath = path.join(reportDir, '2026-05-15-10000-user-ux-simulation.json');
const markdownPath = path.join(reportDir, '2026-05-15-10000-user-ux-simulation.md');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function has(relativePath, pattern) {
  return pattern.test(read(relativePath));
}

function getGeneratedAt() {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8')).generatedAt;
  } catch {
    return process.env.UX_SIM_GENERATED_AT ?? new Date().toISOString();
  }
}

function readFeatureEvidenceOverrides() {
  if (!process.env.UX_SIM_FEATURE_EVIDENCE_OVERRIDES) return {};

  const parsed = JSON.parse(process.env.UX_SIM_FEATURE_EVIDENCE_OVERRIDES);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('UX_SIM_FEATURE_EVIDENCE_OVERRIDES must be a JSON object');
  }

  return Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => typeof value === 'boolean'),
  );
}

function formatMarkdownTable(columns, rows) {
  const widths = columns.map((column, columnIndex) =>
    Math.max(column.label.length, ...rows.map((row) => String(row[columnIndex]).length)),
  );
  const formatCell = (value, columnIndex) => {
    const text = String(value);
    return columns[columnIndex].align === 'right'
      ? text.padStart(widths[columnIndex], ' ')
      : text.padEnd(widths[columnIndex], ' ');
  };
  const header = `| ${columns
    .map((column, columnIndex) => formatCell(column.label, columnIndex))
    .join(' | ')} |`;
  const separator = `| ${columns
    .map((column, columnIndex) =>
      column.align === 'right'
        ? `${'-'.repeat(widths[columnIndex] - 1)}:`
        : '-'.repeat(widths[columnIndex]),
    )
    .join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map(formatCell).join(' | ')} |`);

  return [header, separator, ...body].join('\n');
}

const featureEvidence = {
  animatedProgress: has('components/ProgressBar.tsx', /Animated\.timing/),
  bookmarkPractice: has('app/(tabs)/practice.tsx', /toggleBookmark/),
  bookmarkReview:
    has('app/(tabs)/mistakes.tsx', /bookmarkedReviewQuestions/) &&
    has('app/(tabs)/mistakes.tsx', /questionProgress\[question\.id\]\?\.bookmarked/),
  sourceReference: has('app/(tabs)/practice.tsx', /UHRReferenceCard/),
  audioSupport: has('app/(tabs)/practice.tsx', /AudioButton/),
  googleAdsNative: fs.existsSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
  ),
  webAdPreviewSafe:
    has('components/monetization/AdBanner.tsx', /WEB_AD_FALLBACK_CONSENT_DECISION/) &&
    has('lib/monetization/adCopy.ts', /Sponsored ad preview/),
  homeNextAction: has('app/(tabs)/home.tsx', /nextAction/),
  homeFeedbackCard:
    has('app/(tabs)/home.tsx', /feedbackTitle/) &&
    has('app/(tabs)/home.tsx', /feedbackLinkAccessibilityLabel/) &&
    has('app/(tabs)/home.tsx', /href="\/mistakes"/),
  settingsLink:
    has('app/(tabs)/profile.tsx', /openSettingsAccessibilityLabel/) &&
    has('app/(tabs)/profile.tsx', /pathname: '\/settings'/),
  ...readFeatureEvidenceOverrides(),
};

const personas = [
  { segment: 'new-arrival beginner', needsAudio: true, needsGuidance: true, adSensitive: false },
  { segment: 'busy commuter', needsAudio: true, needsGuidance: true, adSensitive: true },
  {
    segment: 'intermediate Swedish learner',
    needsAudio: false,
    needsGuidance: true,
    adSensitive: false,
  },
  { segment: 'anxious test taker', needsAudio: false, needsGuidance: true, adSensitive: true },
  {
    segment: 'accessibility-focused learner',
    needsAudio: true,
    needsGuidance: false,
    adSensitive: true,
  },
  { segment: 'power reviewer', needsAudio: false, needsGuidance: false, adSensitive: false },
  { segment: 'low-time parent', needsAudio: true, needsGuidance: true, adSensitive: true },
  {
    segment: 'source-checking learner',
    needsAudio: false,
    needsGuidance: false,
    adSensitive: false,
  },
  {
    segment: 'older learner returning to school',
    needsAudio: true,
    needsGuidance: true,
    adSensitive: false,
  },
  { segment: 'exam retaker', needsAudio: false, needsGuidance: true, adSensitive: true },
  {
    segment: 'rural learner with short sessions',
    needsAudio: true,
    needsGuidance: true,
    adSensitive: true,
  },
  {
    segment: 'high-confidence skimmer',
    needsAudio: false,
    needsGuidance: false,
    adSensitive: false,
  },
];

const origins = [
  'Syria',
  'Ukraine',
  'India',
  'Chile',
  'Eritrea',
  'Iran',
  'Somalia',
  'Poland',
  'Brazil',
  'Turkey',
];
const occupations = [
  'nurse assistant',
  'software tester',
  'truck driver',
  'parent on leave',
  'restaurant worker',
  'engineer',
  'student',
  'care worker',
  'shop owner',
  'teacher',
];
const studyWindows = [
  'tram rides',
  'late evenings',
  'lunch breaks',
  'weekend mornings',
  'after SFI class',
  'before work',
  'library visits',
  'child nap times',
];
const goals = [
  'pass the first attempt',
  'understand civic vocabulary',
  'stop repeating old mistakes',
  'study without stress',
  'trust the sources',
  'practice Swedish listening',
];

const issueCatalog = [
  {
    id: 'guidance',
    label: 'Needs clearer next step after each session',
    applies: (persona) => persona.needsGuidance,
    resolvedBy: () => featureEvidence.homeNextAction,
  },
  {
    id: 'save-hard-questions',
    label: 'Wants a way to save hard questions for later',
    applies: () => true,
    resolvedBy: () => featureEvidence.bookmarkPractice && featureEvidence.bookmarkReview,
  },
  {
    id: 'motion-feedback',
    label: 'Progress feels more motivating with visible motion feedback',
    applies: () => true,
    resolvedBy: () => featureEvidence.animatedProgress,
  },
  {
    id: 'audio',
    label: 'Needs read-aloud support for Swedish question text',
    applies: (persona) => persona.needsAudio,
    resolvedBy: () => featureEvidence.audioSupport,
  },
  {
    id: 'trust',
    label: 'Needs source-backed explanations to trust unofficial practice',
    applies: () => true,
    resolvedBy: () => featureEvidence.sourceReference,
  },
  {
    id: 'ad-safety',
    label: 'Ads should not interrupt focused studying or exams',
    applies: (persona) => persona.adSensitive,
    resolvedBy: () => featureEvidence.googleAdsNative && featureEvidence.webAdPreviewSafe,
  },
  {
    id: 'feedback-visibility',
    label: 'Wants visible proof that learner feedback changed the app',
    applies: () => true,
    resolvedBy: () => featureEvidence.homeFeedbackCard,
  },
];

function simulateUser(index) {
  const persona = personas[index % personas.length];
  const origin = origins[index % origins.length];
  const occupation = occupations[Math.floor(index / origins.length) % occupations.length];
  const studyWindow =
    studyWindows[Math.floor(index / (origins.length * occupations.length)) % studyWindows.length];
  const goal =
    goals[
      Math.floor(index / (origins.length * occupations.length * studyWindows.length)) % goals.length
    ];
  const seenIssues = issueCatalog.filter((issue) => issue.applies(persona));
  const resolved = seenIssues.filter((issue) => issue.resolvedBy());
  const unresolved = seenIssues.filter((issue) => !issue.resolvedBy());
  const taskCompletion = Math.round((resolved.length / seenIssues.length) * 100);
  const satisfaction = Math.max(1, Math.min(5, Number((2.2 + resolved.length * 0.48).toFixed(1))));

  const story = `${origin}-born ${occupation} studies during ${studyWindow} to ${goal}; simulation case ${index + 1}.`;
  const review =
    unresolved.length === 0
      ? `The app fits my ${studyWindow} routine: I can see progress, save hard questions, verify sources, and keep exam practice calm.`
      : `I like the source-backed practice, but ${unresolved.map((issue) => issue.label.toLowerCase()).join('; ')}.`;

  return {
    id: `U${String(index + 1).padStart(5, '0')}`,
    segment: persona.segment,
    background: { origin, occupation, studyWindow, goal },
    story,
    review,
    taskCompletion,
    satisfaction,
    positiveFeedback: resolved.map((issue) => issue.label),
    painPoints: unresolved.map((issue) => issue.label),
  };
}

const users = Array.from({ length: userCount }, (_, index) => simulateUser(index));
const averageSatisfaction = Number(
  (users.reduce((sum, user) => sum + user.satisfaction, 0) / users.length).toFixed(2),
);
const averageTaskCompletion = Number(
  (users.reduce((sum, user) => sum + user.taskCompletion, 0) / users.length).toFixed(1),
);
const painPointCounts = Object.fromEntries(issueCatalog.map((issue) => [issue.label, 0]));
for (const user of users) {
  for (const painPoint of user.painPoints) painPointCounts[painPoint] += 1;
}
const topPainPoints = Object.entries(painPointCounts)
  .sort((a, b) => b[1] - a[1])
  .filter(([, count]) => count > 0)
  .map(([label, count]) => ({ label, count }));

const report = {
  generatedAt: getGeneratedAt(),
  simulatedUserCount: users.length,
  featureEvidence,
  averageSatisfaction,
  averageTaskCompletion,
  topPainPoints,
  recommendationSummary:
    topPainPoints.length === 0
      ? 'No blocking synthetic UX pain point remains in the modeled study loop.'
      : 'Address the top unresolved synthetic UX pain points before release.',
  users,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

const segmentRows = personas.map((persona) => {
  const matching = users.filter((user) => user.segment === persona.segment);
  const avg = matching.reduce((sum, user) => sum + user.satisfaction, 0) / matching.length;
  return [persona.segment, matching.length, avg.toFixed(2)];
});
const painRows = topPainPoints.length
  ? topPainPoints.map((item) => [item.label, item.count])
  : [['None', 0]];
const segmentTable = formatMarkdownTable(
  [
    { label: 'Segment' },
    { align: 'right', label: 'Users' },
    { align: 'right', label: 'Avg satisfaction' },
  ],
  segmentRows,
);
const painTable = formatMarkdownTable(
  [{ label: 'Pain point' }, { align: 'right', label: 'Users affected' }],
  painRows,
);

fs.writeFileSync(
  markdownPath,
  `# 10,000-user synthetic UX simulation\n\n` +
    `Generated: ${report.generatedAt}\n\n` +
    `## Summary\n\n` +
    `- Simulated users: ${users.length}\n` +
    `- Average satisfaction: ${averageSatisfaction}/5\n` +
    `- Average task completion: ${averageTaskCompletion}%\n` +
    `- Recommendation: ${report.recommendationSummary}\n\n` +
    `## Segment results\n\n${segmentTable}\n\n` +
    `## Remaining pain points\n\n${painTable}\n\n` +
    `## Feature evidence checked\n\n\`\`\`json\n${JSON.stringify(featureEvidence, null, 2)}\n\`\`\`\n`,
);

console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);
console.log(`Average satisfaction: ${averageSatisfaction}/5`);
console.log(`Average task completion: ${averageTaskCompletion}%`);
console.log(`Unique stories: ${new Set(users.map((user) => user.story)).size}`);
