const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(rel) {
  return require(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function makeRpcClient(data) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(functionName, params) {
        calls.push({ functionName, params });
        return { data, error: null };
      },
    },
  };
}

function makeMemoryAsyncStorage(initialValues = {}, options = {}) {
  const values = new Map(Object.entries(initialValues));
  const events = [];
  return {
    events,
    storage: {
      async deleteItemAsync(key) {
        events.push(['delete', key]);
        if (options.throwOnDelete) throw new Error('delete failed');
        values.delete(key);
      },
      async getItemAsync(key) {
        events.push(['get', key]);
        if (options.throwOnGet) throw new Error('get failed');
        return values.has(key) ? values.get(key) : null;
      },
      async setItemAsync(key, value) {
        events.push(['set', key, String(value)]);
        if (options.throwOnSet) throw new Error('set failed');
        values.set(key, String(value));
      },
    },
    values,
  };
}

test('referral code helpers normalize and generate bounded 8-character codes', () => {
  const {
    REFERRAL_CODE_ALPHABET,
    REFERRAL_CODE_LENGTH,
    generateReferralCode,
    isReferralCode,
    normalizeReferralCode,
  } = loadTs('lib/referral/generateCode.ts');

  assert.equal(REFERRAL_CODE_LENGTH, 8);
  assert.equal(normalizeReferralCode(' ab-cd 12ef '), 'ABCD12EF');
  assert.equal(isReferralCode('ABCD12EF'), true);
  assert.equal(isReferralCode('ABC'), false);
  assert.equal(isReferralCode('ABCD12E!'), false);
  assert.equal(
    generateReferralCode(() => 0),
    REFERRAL_CODE_ALPHABET[0].repeat(8),
  );
  assert.equal(
    generateReferralCode(() => 0.999),
    REFERRAL_CODE_ALPHABET.at(-1).repeat(8),
  );
});

test('referral migration defines protected profile grants, referral uniqueness, and RPC enforcement', () => {
  const migration = read('supabase/migrations/0003_referrals.sql');

  assert.match(migration, /add column if not exists referral_code text/);
  assert.match(migration, /pro_grant_expires_at timestamptz/);
  assert.match(migration, /successful_referrals integer not null default 0/);
  assert.match(migration, /referral_onboarding_completed_at timestamptz/);
  assert.match(migration, /gen_random_bytes\(8\)/);
  assert.match(migration, /check \(referral_code ~ '\^\[A-Z0-9\]\{8\}\$'\)/);
  assert.match(
    migration,
    /profiles_successful_referrals_range[\s\S]*successful_referrals >= 0 and successful_referrals <= 4/,
  );
  assert.match(migration, /create unique index if not exists profiles_referral_code_unique/);
  assert.match(migration, /create table if not exists public\.referrals/);
  assert.match(
    migration,
    /referee_user_id uuid not null references public\.profiles\(id\) on delete cascade/,
  );
  assert.match(migration, /unique \(referee_user_id\)/);
  assert.match(migration, /check \(referrer_user_id <> referee_user_id\)/);
  assert.match(
    migration,
    /revoke insert, update, delete on public\.referrals from anon, authenticated/,
  );
  assert.match(migration, /create policy "referrals_select_participant"/);
  assert.match(migration, /create or replace function public\.redeem_referral\(code text\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /'self_referral'::text/);
  assert.match(migration, /successful_referrals >= 4/);
  assert.match(migration, /'cap_reached'::text/);
  assert.match(migration, /referral_onboarding_completed_at is null/);
  assert.match(migration, /'onboarding_incomplete'::text/);
  assert.match(migration, /interval '7 days'/);
  assert.match(
    migration,
    /grant execute on function public\.redeem_referral\(text\) to authenticated/,
  );
});

test('referral migration prevents direct client writes to grant columns', () => {
  const migration = read('supabase/migrations/0003_referrals.sql');

  assert.match(migration, /revoke insert, update on public\.profiles from authenticated/);
  assert.match(migration, /grant insert \(id, display_name\) on public\.profiles to authenticated/);
  assert.match(
    migration,
    /grant update \(display_name, updated_at\) on public\.profiles to authenticated/,
  );
  assert.doesNotMatch(
    migration,
    /grant update \([^)]*pro_grant_expires_at[^)]*\) on public\.profiles to authenticated/,
  );
  assert.doesNotMatch(
    migration,
    /grant update \([^)]*successful_referrals[^)]*\) on public\.profiles to authenticated/,
  );
});

test('redeemReferral calls only the bounded redeem_referral RPC and maps grant expiry', async () => {
  const { redeemReferral } = loadTs('lib/referral/redeemReferral.ts');
  const { REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY } = loadTs(
    'lib/monetization/effectiveEntitlements.ts',
  );
  const { calls, client } = makeRpcClient([
    {
      pro_grant_expires_at: '2026-05-29T12:00:00+00:00',
      status: 'redeemed',
      successful_referrals: 1,
    },
  ]);

  const result = await redeemReferral(client, ' abcd-12ef ');

  assert.deepEqual(calls, [
    {
      functionName: 'redeem_referral',
      params: { code: 'ABCD12EF' },
    },
  ]);
  assert.deepEqual(result, {
    code: 'ABCD12EF',
    proGrantExpiresAtIso: '2026-05-29T12:00:00.000Z',
    status: 'redeemed',
    storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
    successfulReferrals: 1,
  });
});

test('redeemReferral fails closed for malformed codes and unknown RPC statuses', async () => {
  const { redeemReferral } = loadTs('lib/referral/redeemReferral.ts');
  const malformed = makeRpcClient([]);

  assert.equal((await redeemReferral(malformed.client, 'bad')).status, 'invalid_code');
  assert.deepEqual(malformed.calls, []);

  const unknown = makeRpcClient([{ status: 'grant_everything', successful_referrals: 10 }]);
  const result = await redeemReferral(unknown.client, 'ABCD12EF');

  assert.equal(result.status, 'error');
  assert.equal(result.successfulReferrals, null);
});

test('fetchReferralGrantSnapshot reads only the signed-in profile grant expiry', async () => {
  const { fetchReferralGrantSnapshot } = loadTs('lib/referral/redeemReferral.ts');
  const calls = [];
  const client = {
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-1' } } };
      },
    },
    from(table) {
      calls.push({ table });
      return {
        select(columns) {
          calls.push({ columns });
          return this;
        },
        eq(column, value) {
          calls.push({ column, value });
          return this;
        },
        async maybeSingle() {
          return { data: { pro_grant_expires_at: '2026-05-29T12:00:00+00:00' }, error: null };
        },
      };
    },
    async rpc() {
      throw new Error('fetchReferralGrantSnapshot should not redeem');
    },
  };

  assert.deepEqual(await fetchReferralGrantSnapshot(client), {
    expiresAtIso: '2026-05-29T12:00:00.000Z',
  });
  assert.deepEqual(calls, [
    { table: 'profiles' },
    { columns: 'pro_grant_expires_at' },
    { column: 'id', value: 'user-1' },
  ]);
});

test('referral client wrapper source does not write profile grant state directly', () => {
  const source = read('lib/referral/redeemReferral.ts');

  assert.match(source, /client\.rpc\('redeem_referral'/);
  assert.match(source, /from\('profiles'\)/);
  assert.match(source, /select\('pro_grant_expires_at'\)/);
  assert.doesNotMatch(source, /\.insert\(/);
  assert.doesNotMatch(source, /\.upsert\(/);
  assert.doesNotMatch(source, /\.update\(/);
  assert.doesNotMatch(source, /pro_grant_expires_at:\s*expires/);
});

test('pending referral store normalizes links and consumes codes exactly once', async () => {
  const {
    PENDING_REFERRAL_CODE_STORAGE_KEY,
    consumePendingReferralCode,
    peekPendingReferralCode,
    referralDeepLinkForCode,
    referralRouteForCode,
    storePendingReferralCode,
  } = loadTs('lib/referral/pendingReferralStore.ts');
  const { events, storage, values } = makeMemoryAsyncStorage();

  assert.equal(await storePendingReferralCode(' abcd-12ef ', { storage }), 'ABCD12EF');
  assert.equal(values.get(PENDING_REFERRAL_CODE_STORAGE_KEY), 'ABCD12EF');
  assert.equal(await peekPendingReferralCode({ storage }), 'ABCD12EF');
  assert.equal(referralRouteForCode(' abcd-12ef '), '/r/ABCD12EF');
  assert.equal(referralDeepLinkForCode(' abcd-12ef '), 'almost-swedish://r/ABCD12EF');

  assert.equal(await consumePendingReferralCode({ storage }), 'ABCD12EF');
  assert.equal(await consumePendingReferralCode({ storage }), null);
  assert.equal(values.has(PENDING_REFERRAL_CODE_STORAGE_KEY), false);

  assert.equal(await storePendingReferralCode('__proto__', { storage }), null);
  assert.equal(await storePendingReferralCode('ABC', { storage }), null);
  assert.equal(values.has(PENDING_REFERRAL_CODE_STORAGE_KEY), false);
  assert.ok(events.some((event) => event[0] === 'delete'));
});

test('referral grant store accepts only canonical server expiry timestamps', async () => {
  const { REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY } = loadTs(
    'lib/monetization/effectiveEntitlements.ts',
  );
  const { getReferralGrantSnapshot, persistReferralGrantSnapshot } = loadTs(
    'lib/monetization/referralGrantStore.ts',
  );
  const { storage, values } = makeMemoryAsyncStorage();

  assert.deepEqual(await persistReferralGrantSnapshot('2026-05-29T12:00:00.000Z', { storage }), {
    expiresAtIso: '2026-05-29T12:00:00.000Z',
  });
  assert.equal(values.get(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY), '2026-05-29T12:00:00.000Z');
  assert.deepEqual(await getReferralGrantSnapshot({ storage }), {
    expiresAtIso: '2026-05-29T12:00:00.000Z',
  });

  assert.equal(await persistReferralGrantSnapshot('2026-05-29T12:00:00+00:00', { storage }), null);
  assert.equal(values.has(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY), false);
});

test('pending referral grant flow redeems once and writes only the server canonical grant', async () => {
  const { REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY } = loadTs(
    'lib/monetization/effectiveEntitlements.ts',
  );
  const { PENDING_REFERRAL_CODE_STORAGE_KEY } = loadTs('lib/referral/pendingReferralStore.ts');
  const { consumePendingReferralGrant } = loadTs('lib/referral/pendingReferralFlow.ts');
  const pending = makeMemoryAsyncStorage({
    [PENDING_REFERRAL_CODE_STORAGE_KEY]: 'ABCD12EF',
  });
  const grant = makeMemoryAsyncStorage();
  const redeemCalls = [];
  const redeem = async (_client, code) => {
    redeemCalls.push(code);
    return {
      code,
      proGrantExpiresAtIso: '2026-05-29T12:00:00.000Z',
      status: 'redeemed',
      storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
      successfulReferrals: 1,
    };
  };

  assert.deepEqual(
    await consumePendingReferralGrant({
      client: {},
      grantStorage: grant.storage,
      pendingStorage: pending.storage,
      redeem,
    }),
    {
      code: 'ABCD12EF',
      proGrantExpiresAtIso: '2026-05-29T12:00:00.000Z',
      redemption: {
        code: 'ABCD12EF',
        proGrantExpiresAtIso: '2026-05-29T12:00:00.000Z',
        status: 'redeemed',
        storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
        successfulReferrals: 1,
      },
      status: 'redeemed',
    },
  );
  assert.deepEqual(redeemCalls, ['ABCD12EF']);
  assert.equal(pending.values.has(PENDING_REFERRAL_CODE_STORAGE_KEY), false);
  assert.equal(
    grant.values.get(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY),
    '2026-05-29T12:00:00.000Z',
  );

  assert.equal(
    (
      await consumePendingReferralGrant({
        client: {},
        grantStorage: grant.storage,
        pendingStorage: pending.storage,
        redeem,
      })
    ).status,
    'no_pending_code',
  );
  assert.deepEqual(redeemCalls, ['ABCD12EF']);
});

test('pending referral grant flow fails closed on storage and redemption failures', async () => {
  const { REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY } = loadTs(
    'lib/monetization/effectiveEntitlements.ts',
  );
  const { PENDING_REFERRAL_CODE_STORAGE_KEY } = loadTs('lib/referral/pendingReferralStore.ts');
  const { consumePendingReferralGrant } = loadTs('lib/referral/pendingReferralFlow.ts');

  const deleteFailure = makeMemoryAsyncStorage(
    { [PENDING_REFERRAL_CODE_STORAGE_KEY]: 'ABCD12EF' },
    { throwOnDelete: true },
  );
  let redeemCalled = false;
  assert.equal(
    (
      await consumePendingReferralGrant({
        client: {},
        pendingStorage: deleteFailure.storage,
        redeem: async () => {
          redeemCalled = true;
          throw new Error('must not redeem before pending code is cleared');
        },
      })
    ).status,
    'storage_unavailable',
  );
  assert.equal(redeemCalled, false);

  const pending = makeMemoryAsyncStorage({ [PENDING_REFERRAL_CODE_STORAGE_KEY]: 'ABCD12EF' });
  const grant = makeMemoryAsyncStorage({
    [REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY]: '2026-05-29T12:00:00.000Z',
  });
  const result = await consumePendingReferralGrant({
    client: {},
    grantStorage: grant.storage,
    pendingStorage: pending.storage,
    redeem: async (_client, code) => ({
      code,
      proGrantExpiresAtIso: null,
      status: 'cap_reached',
      storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
      successfulReferrals: 4,
    }),
  });

  assert.equal(result.status, 'cap_reached');
  assert.equal(grant.values.has(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY), false);
});

test('referral deep-link client flow is wired into routes, auth, and entitlement resolution', () => {
  const appConfig = JSON.parse(read('app.json'));
  const nativeIntentSource = read('app/+native-intent.ts');
  const layoutSource = read('app/_layout.tsx');
  const referralRouteSource = read('app/r/[code].tsx');
  const authSource = read('lib/auth/AuthContext.tsx');
  const proHookSource = read('lib/monetization/useProLifetimeEntitlements.ts');

  assert.equal(appConfig.expo.scheme, 'almost-swedish');
  assert.match(
    nativeIntentSource,
    /const referralRoutePattern = \/\^\\\/r\\\/\[A-Z0-9\]\{8\}\$\/;/,
  );
  assert.match(layoutSource, /<Stack\.Screen name="r\/\[code\]"/);
  assert.match(referralRouteSource, /useLocalSearchParams/);
  assert.match(referralRouteSource, /storePendingReferralCode\(normalizedCode\)/);
  assert.match(authSource, /consumePendingReferralGrant\(\{[\s\S]*client: supabase/);
  assert.match(proHookSource, /getReferralGrantSnapshot\(\)/);
  assert.match(proHookSource, /resolveEffectiveEntitlement\(\{[\s\S]*referralGrant/);
});
