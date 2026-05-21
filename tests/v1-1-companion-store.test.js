// Tests for v1.1 companion store (PR10).
// Run with: node --test tests/v1-1-companion-store.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryMMKV,
  createThrowingReadMMKV,
  createThrowingSetMMKV,
  loadTsModule,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(rel) {
  return loadTsModule(repoRoot, rel);
}

test('resolveCompanionId: returns valid mascot id unchanged', () => {
  const { resolveCompanionId } = loadTs('lib/storage/companionStore.ts');
  assert.equal(resolveCompanionId('lucia'), 'lucia');
  assert.equal(resolveCompanionId('skoglimpa'), 'skoglimpa');
  assert.equal(resolveCompanionId('dala-horse'), 'dala-horse');
});

test('resolveCompanionId: falls back to DEFAULT on unknown / non-string', () => {
  const { resolveCompanionId } = loadTs('lib/storage/companionStore.ts');
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  assert.equal(resolveCompanionId('not-a-mascot'), DEFAULT_COMPANION_ID);
  assert.equal(resolveCompanionId(null), DEFAULT_COMPANION_ID);
  assert.equal(resolveCompanionId(undefined), DEFAULT_COMPANION_ID);
  assert.equal(resolveCompanionId(42), DEFAULT_COMPANION_ID);
});

test('companion store source: never Pro-gated (invariant)', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/storage/companionStore.ts'), 'utf8');
  const pickerSource = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/CompanionPicker.tsx'),
    'utf8',
  );
  const cardSource = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/StudyCompanionCard.tsx'),
    'utf8',
  );
  assert.ok(
    !/hasProEntitlement|isPremiumUser|adsDisabled|ProTierEntitlements/.test(source),
    'companion picker must never be Pro-gated',
  );
  assert.ok(
    !/hasProEntitlement|isPremiumUser|adsDisabled|ProTierEntitlements/.test(pickerSource),
    'companion picker UI must never be Pro-gated',
  );
  assert.ok(
    !/hasProEntitlement|isPremiumUser|adsDisabled|ProTierEntitlements/.test(cardSource),
    'practice companion card must never be Pro-gated',
  );
});

test('companion picker source consumes favorite ordering and store-compatible ids', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/CompanionPicker.tsx'),
    'utf8',
  );
  assert.match(source, /getCompanionPickerMascots/);
  assert.match(source, /FAVORITE_COMPANION_IDS/);
  assert.match(source, /onSelect\(mascot\.id\)/);
  assert.match(source, /accessibilityRole="radiogroup"/);
  assert.match(source, /accessibilityRole="radio"/);
  assert.match(source, /aria-checked=\{selected\}/);
  assert.match(source, /accessibilityState=\{\{ checked: selected \}\}/);
  assert.doesNotMatch(source, /aria-selected=\{selected\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ selected \}\}/);
});

test('settings route renders the free companion picker with persistence warning handling', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.match(
    source,
    /import \{ CompanionPicker \} from '\.\.\/components\/mascot\/CompanionPicker';/,
  );
  assert.match(source, /import \{ useCompanionStore \} from '\.\.\/lib\/storage\/companionStore';/);
  assert.match(
    source,
    /const selectedCompanionId = useCompanionStore\(\(state\) => state\.selectedId\);/,
  );
  assert.match(
    source,
    /const setSelectedCompanion = useCompanionStore\(\(state\) => state\.setSelected\);/,
  );
  assert.match(
    source,
    /const companionPersistenceWarning = useCompanionStore\(\(state\) => state\.persistenceWarning\);/,
  );
  assert.match(source, /warning=\{companionPersistenceWarning\}/);
  assert.match(source, /onDismiss=\{clearCompanionPersistenceWarning\}/);
  assert.match(source, /selectedId=\{selectedCompanionId\}/);
  assert.match(source, /onSelect=\{setSelectedCompanion\}/);
  assert.match(source, /companionTitle: 'Studiekompis'/);
  assert.match(source, /companionTitle: 'Study companion'/);
  assert.doesNotMatch(source, /hasProEntitlement|isPremiumUser|ProTierEntitlements/);
});

test('practice route renders the selected companion from the free companion store', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.match(
    source,
    /import \{ StudyCompanionCard \} from '\.\.\/\.\.\/components\/mascot\/StudyCompanionCard';/,
  );
  assert.match(
    source,
    /import \{ useCompanionStore \} from '\.\.\/\.\.\/lib\/storage\/companionStore';/,
  );
  assert.match(
    source,
    /const selectedCompanionId = useCompanionStore\(\(state\) => state\.selectedId\);/,
  );
  assert.match(source, /const companionFeedbackState = hasSelectedAnswer/);
  assert.match(source, /<StudyCompanionCard[\s\S]*feedbackState=\{companionFeedbackState\}/);
  assert.match(source, /language=\{language\}[\s\S]*mascotId=\{selectedCompanionId\}/);
  assert.doesNotMatch(source, /selectedCompanionId[\s\S]{0,120}recordAnswer/);
  assert.doesNotMatch(source, /hasProEntitlement|isPremiumUser|ProTierEntitlements/);
});

test('study companion card localizes answer states and links back to Settings', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/StudyCompanionCard.tsx'),
    'utf8',
  );
  const artworkSource = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/MascotArtwork.tsx'),
    'utf8',
  );

  assert.match(source, /export interface StudyCompanionCardProps/);
  assert.match(source, /feedbackState\?: StudyCompanionFeedbackState/);
  assert.match(source, /Din studiekompis/);
  assert.match(source, /Your study companion/);
  assert.match(source, /correctBody: \(label\) =>/);
  assert.match(source, /incorrectBody: \(label\) =>/);
  assert.match(source, /neutralBody: \(label, anchor\) =>/);
  assert.match(source, /href="\/settings"/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /accessibilityLabel=\{copy\.accessibilityLabel\(label, body\)\}/);
  assert.match(source, /getMascot\(mascotId\) \?\? getMascot\(DEFAULT_COMPANION_ID\)!/);
  assert.match(source, /import \{ MascotArtwork, mascotArtworkExpressionForFeedbackState \}/);
  assert.match(
    source,
    /const artworkExpression = mascotArtworkExpressionForFeedbackState\(feedbackState\);/,
  );
  assert.match(
    source,
    /<MascotArtwork[\s\S]*expression=\{artworkExpression\}[\s\S]*mascotId=\{mascot\.id\}/,
  );
  assert.doesNotMatch(source, /label\.slice\(0,\s*1\)\.toUpperCase\(\)/);
  assert.match(artworkSource, /SvgUri/);
  assert.match(artworkSource, /accessibilityElementsHidden/);
  assert.match(artworkSource, /importantForAccessibility="no-hide-descendants"/);
  assert.match(artworkSource, /correct'\) return 'happy'/);
  assert.match(artworkSource, /incorrect'\) return 'oops'/);
  assert.match(artworkSource, /return 'idle'/);
  assert.match(artworkSource, /mascotAssetPath\(mascotId, expression\)/);
  assert.doesNotMatch(source, /hasProEntitlement|isPremiumUser|ProTierEntitlements/);
  assert.doesNotMatch(artworkSource, /hasProEntitlement|isPremiumUser|ProTierEntitlements/);
});

test('companion store uses MMKV id "companion" (separate from settings)', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/storage/companionStore.ts'), 'utf8');
  assert.match(source, /const companionStorageId = ['"]companion['"]/);
  assert.match(source, /createMMKV\(\{ id: companionStorageId \}\)/);
});

test('companion store: storage key is versioned for forward-compat', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/storage/companionStore.ts'), 'utf8');
  assert.match(source, /companion\.selectedId\.v1/);
});

test('companion store: valid persisted mascot hydrates selection', () => {
  const storage = createMemoryMMKV({ 'companion.selectedId.v1': 'skoglimpa' });
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });

  assert.equal(useCompanionStore.getState().selectedId, 'skoglimpa');
  assert.equal(useCompanionStore.getState().persistenceWarning, null);
});

test('companion store: invalid persisted mascot falls back without warning', () => {
  const storage = createMemoryMMKV({ 'companion.selectedId.v1': 'not-a-mascot' });
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');

  assert.equal(useCompanionStore.getState().selectedId, DEFAULT_COMPANION_ID);
  assert.equal(useCompanionStore.getState().persistenceWarning, null);
});

test('companion store: throwing MMKV reads fall back and record warning', () => {
  const storage = createThrowingReadMMKV('companion read failed');
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  const state = useCompanionStore.getState();

  assert.equal(state.selectedId, DEFAULT_COMPANION_ID);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'companion');
  assert.equal(state.persistenceWarning.key, 'companion.selectedId.v1');
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.match(state.persistenceWarning.errorMessage, /read failed/);
});

test('companion store: throwing MMKV writes keep selected mascot in memory and record warning', () => {
  const storage = createThrowingSetMMKV('companion disk full');
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });

  useCompanionStore.getState().setSelected('lucia');
  const state = useCompanionStore.getState();

  assert.equal(state.selectedId, 'lucia');
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'companion');
  assert.equal(state.persistenceWarning.key, 'companion.selectedId.v1');
  assert.match(state.persistenceWarning.errorMessage, /disk full/);
});

test('companion store: throwing MMKV reads fall back to the default companion', () => {
  const storage = createThrowingReadMMKV('companion read failed');
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  const state = useCompanionStore.getState();

  assert.equal(state.selectedId, DEFAULT_COMPANION_ID);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'companion');
  assert.equal(state.persistenceWarning.key, 'companion.selectedId.v1');
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.match(state.persistenceWarning.errorMessage, /read failed/);
});

test('companion store: successful writes persist and clear persistence warning', () => {
  const storage = createMemoryMMKV();
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });

  useCompanionStore.getState().setSelected('dala-horse');
  assert.equal(useCompanionStore.getState().selectedId, 'dala-horse');
  assert.equal(useCompanionStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('companion.selectedId.v1'), 'dala-horse');

  useCompanionStore.getState().reset();
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  assert.equal(useCompanionStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('companion.selectedId.v1'), DEFAULT_COMPANION_ID);
});
