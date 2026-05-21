const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

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
    fileName: filePath,
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

function loadTsWithExternalModules(relativePath, externalModules) {
  const filePath = path.resolve(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filePath,
  }).outputText;
  const mod = { exports: {} };

  function localRequire(request) {
    if (Object.prototype.hasOwnProperty.call(externalModules, request)) {
      const value = externalModules[request];
      if (typeof value === 'function') return value();
      if (value instanceof Error) throw value;
      return value;
    }
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

function createCurrentStudyReminderState(overrides = {}) {
  return {
    studyReminderEnabled: false,
    studyReminderHour: 18,
    studyReminderMinute: 0,
    studyReminderPermissionStatus: 'undetermined',
    studyReminderNotificationId: null,
    ...overrides,
  };
}

function createGrantedRuntime() {
  const scheduledRequests = [];
  const cancelledIds = [];

  return {
    cancelledIds,
    scheduledRequests,
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    scheduleNotificationAsync: async (request) => {
      scheduledRequests.push(request);
      return 'scheduled-reminder';
    },
    cancelScheduledNotificationAsync: async (identifier) => {
      cancelledIds.push(identifier);
    },
    dailyTriggerType: 'daily',
    platformOS: 'ios',
  };
}

test('study reminder time sanitizer accepts only finite integer clock values', () => {
  const { formatStudyReminderTime, sanitizeStudyReminderTime } = loadTs(
    'lib/notifications/studyReminder.ts',
  );

  [
    [0, 0, '00:00'],
    [8, 0, '08:00'],
    [18, 0, '18:00'],
    [20, 30, '20:30'],
    [23, 59, '23:59'],
  ].forEach(([hour, minute, formatted]) => {
    assert.deepEqual(sanitizeStudyReminderTime(hour, minute), { hour, minute });
    assert.equal(formatStudyReminderTime(hour, minute), formatted);
  });
});

test('study reminder sanitizer falls back instead of clamping malformed time inputs', () => {
  const { formatStudyReminderTime, sanitizeStudyReminderTime } = loadTs(
    'lib/notifications/studyReminder.ts',
  );
  const fallback = { hour: 20, minute: 30 };

  [
    [Number.NaN, 30],
    [Infinity, 0],
    [-Infinity, 0],
    ['8', 0],
    [null, 0],
    [undefined, 0],
    [8.5, 0],
    [8, 30.5],
    [-1, 0],
    [24, 0],
    [8, -1],
    [8, 60],
  ].forEach(([hour, minute]) => {
    assert.deepEqual(sanitizeStudyReminderTime(hour, minute, fallback), fallback);
    assert.equal(formatStudyReminderTime(hour, minute), '18:00');
  });

  assert.deepEqual(sanitizeStudyReminderTime(Number.NaN, 0, { hour: 99, minute: 0 }), {
    hour: 18,
    minute: 0,
  });
});

test('enableStudyReminder never persists or schedules non-finite trigger parts', async () => {
  const { enableStudyReminder } = loadTs('lib/notifications/studyReminder.ts');
  const runtime = createGrantedRuntime();

  const state = await enableStudyReminder({
    current: createCurrentStudyReminderState({
      studyReminderEnabled: true,
      studyReminderHour: 20,
      studyReminderMinute: 30,
      studyReminderNotificationId: 'old-reminder',
    }),
    hour: Number.NaN,
    minute: Infinity,
    language: 'en',
    runtime,
  });

  assert.equal(state.studyReminderEnabled, true);
  assert.equal(state.studyReminderHour, 20);
  assert.equal(state.studyReminderMinute, 30);
  assert.equal(state.studyReminderNotificationId, 'scheduled-reminder');
  assert.deepEqual(runtime.cancelledIds, ['old-reminder']);
  assert.equal(runtime.scheduledRequests.length, 1);
  assert.deepEqual(runtime.scheduledRequests[0].trigger, {
    type: 'daily',
    hour: 20,
    minute: 30,
    channelId: 'study-reminders',
  });
});

test('enableStudyReminder falls back to the preset when current reminder time is corrupt', async () => {
  const { enableStudyReminder } = loadTs('lib/notifications/studyReminder.ts');
  const runtime = createGrantedRuntime();

  const state = await enableStudyReminder({
    current: createCurrentStudyReminderState({
      studyReminderHour: Number.NaN,
      studyReminderMinute: 120,
    }),
    hour: '18',
    minute: null,
    language: 'sv',
    runtime,
  });

  assert.equal(state.studyReminderHour, 18);
  assert.equal(state.studyReminderMinute, 0);
  assert.deepEqual(runtime.scheduledRequests[0].trigger, {
    type: 'daily',
    hour: 18,
    minute: 0,
    channelId: 'study-reminders',
  });
});

test('createExpoStudyReminderRuntime returns null when native notifications are unavailable', async () => {
  const { createExpoStudyReminderRuntime } = loadTsWithExternalModules(
    'lib/notifications/studyReminder.ts',
    {
      'expo-notifications': new Error('Cannot find module expo-notifications'),
      'react-native': { Platform: { OS: 'ios' } },
    },
  );

  assert.equal(await createExpoStudyReminderRuntime(), null);
});

test('createExpoStudyReminderRuntime skips expo-notifications on web', async () => {
  let notificationsRequested = false;
  const { createExpoStudyReminderRuntime } = loadTsWithExternalModules(
    'lib/notifications/studyReminder.ts',
    {
      'expo-notifications': () => {
        notificationsRequested = true;
        throw new Error('web should not import native notifications');
      },
      'react-native': { Platform: { OS: 'web' } },
    },
  );

  assert.equal(await createExpoStudyReminderRuntime(), null);
  assert.equal(notificationsRequested, false);
});

test('createExpoStudyReminderRuntime exposes native notification APIs when configured', async () => {
  const notifications = {
    AndroidImportance: { DEFAULT: 3 },
    SchedulableTriggerInputTypes: { DAILY: 'daily' },
    cancelScheduledNotificationAsync: async () => undefined,
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    scheduleNotificationAsync: async () => 'native-reminder',
    setNotificationChannelAsync: async () => undefined,
  };
  const { createExpoStudyReminderRuntime } = loadTsWithExternalModules(
    'lib/notifications/studyReminder.ts',
    {
      'expo-notifications': notifications,
      'react-native': { Platform: { OS: 'android' } },
    },
  );

  const runtime = await createExpoStudyReminderRuntime();

  assert.equal(runtime.platformOS, 'android');
  assert.equal(runtime.androidImportanceDefault, 3);
  assert.equal(runtime.dailyTriggerType, 'daily');
  assert.equal(runtime.getPermissionsAsync, notifications.getPermissionsAsync);
  assert.equal(runtime.requestPermissionsAsync, notifications.requestPermissionsAsync);
  assert.equal(runtime.scheduleNotificationAsync, notifications.scheduleNotificationAsync);
  assert.equal(
    runtime.cancelScheduledNotificationAsync,
    notifications.cancelScheduledNotificationAsync,
  );
  assert.equal(runtime.setNotificationChannelAsync, notifications.setNotificationChannelAsync);
});

test('study reminder notification dependency is declared or fail-closed', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));
  const source = fs.readFileSync(path.join(repoRoot, 'lib/notifications/studyReminder.ts'), 'utf8');
  const declaresDependency = Boolean(
    packageJson.dependencies?.['expo-notifications'] ||
    packageJson.devDependencies?.['expo-notifications'],
  );
  const plugins = appJson.expo?.plugins ?? [];
  const declaresPlugin = plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === 'expo-notifications' : plugin === 'expo-notifications',
  );
  const failClosed =
    /try\s*\{[\s\S]*import\('expo-notifications'\)[\s\S]*catch\s*\{[\s\S]*return null;\s*\}/.test(
      source,
    );

  assert.ok(
    (declaresDependency && declaresPlugin) || failClosed,
    'study reminder runtime must either declare expo-notifications or fail closed when it is missing',
  );
  assert.doesNotMatch(
    source,
    /Promise\.all\(\[[\s\S]*import\('expo-notifications'\)/,
    'web and missing-module paths must not eagerly import expo-notifications before platform checks',
  );
});
