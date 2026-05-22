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
