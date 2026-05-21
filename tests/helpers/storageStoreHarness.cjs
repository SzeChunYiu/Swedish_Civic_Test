const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function createMemoryMMKV(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getBoolean(key) {
      const value = values.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber(key) {
      const value = values.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getString(key) {
      const value = values.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    set(key, value) {
      values.set(key, value);
    },
  };
}

function createThrowingSetMMKV(message = 'MMKV set failed') {
  return {
    getBoolean() {
      return undefined;
    },
    getNumber() {
      return undefined;
    },
    getString() {
      return undefined;
    },
    set() {
      throw new Error(message);
    },
  };
}

function createThrowingReadMMKV(message = 'MMKV read failed') {
  return {
    getBoolean() {
      throw new Error(message);
    },
    getNumber() {
      throw new Error(message);
    },
    getString() {
      throw new Error(message);
    },
    set() {},
  };
}

function createZustandStub() {
  return {
    create: (factory) => {
      const state = {};
      const setFn = (partial, replace = false) => {
        const next = typeof partial === 'function' ? partial(state) : partial;
        if (next && typeof next === 'object' && next !== state) {
          if (replace) {
            for (const key of Object.keys(state)) delete state[key];
          }
          Object.assign(state, next);
        }
      };
      const getFn = () => state;
      Object.assign(state, factory(setFn, getFn));

      const useStore = (selector) => (typeof selector === 'function' ? selector(state) : state);
      useStore.getState = () => state;
      useStore.setState = (partial) => setFn(partial);
      return useStore;
    },
  };
}

function clearModuleCache(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch {
    // Module may not have been loaded yet.
  }
}

function compileTypeScriptModule(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
}

function withTypeScriptLoader(callback) {
  const originalTsLoader = require.extensions['.ts'];
  const originalTsxLoader = require.extensions['.tsx'];

  require.extensions['.ts'] = compileTypeScriptModule;
  require.extensions['.tsx'] = compileTypeScriptModule;

  try {
    return callback();
  } finally {
    if (originalTsLoader) {
      require.extensions['.ts'] = originalTsLoader;
    } else {
      delete require.extensions['.ts'];
    }
    if (originalTsxLoader) {
      require.extensions['.tsx'] = originalTsxLoader;
    } else {
      delete require.extensions['.tsx'];
    }
  }
}

function resolveLocalTypeScriptModule(parent, request) {
  if (!parent?.filename || (!request.startsWith('.') && !request.startsWith('..'))) {
    return null;
  }

  const base = path.resolve(path.dirname(parent.filename), request);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];
  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function loadTsWithStorage(repoRoot, relativePath, storageById, moduleStubs = {}) {
  const targetPath = path.join(repoRoot, relativePath);
  clearModuleCache(targetPath);
  const storageDir = path.join(repoRoot, 'lib/storage');
  const audioDir = path.join(repoRoot, 'lib/audio');
  for (const cacheKey of Object.keys(require.cache)) {
    if (cacheKey.startsWith(storageDir)) delete require.cache[cacheKey];
    if (cacheKey.startsWith(audioDir)) delete require.cache[cacheKey];
  }

  const originalResolve = Module._resolveFilename;
  const originalLoad = Module._load;
  const stubs = {
    'react-native-mmkv': () => ({
      createMMKV: ({ id }) => storageById[id] ?? null,
    }),
    'expo-speech': () => ({
      speak() {},
      stop() {},
    }),
    zustand: createZustandStub,
    ...moduleStubs,
  };

  Module._resolveFilename = function patchedResolve(request, parent, ...args) {
    if (stubs[request]) return `__storage_store_stub__:${request}`;
    try {
      return originalResolve.call(this, request, parent, ...args);
    } catch (error) {
      const localTypeScriptModule = resolveLocalTypeScriptModule(parent, request);
      if (localTypeScriptModule) return localTypeScriptModule;
      throw error;
    }
  };
  Module._load = function patchedLoad(request, ...args) {
    if (stubs[request]) return stubs[request]();
    return originalLoad.call(this, request, ...args);
  };

  try {
    return withTypeScriptLoader(() => require(targetPath));
  } finally {
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
  }
}

function loadTsModule(repoRoot, relativePath, moduleStubs = {}) {
  return loadTsWithStorage(repoRoot, relativePath, {}, moduleStubs);
}

module.exports = {
  createMemoryMMKV,
  createThrowingReadMMKV,
  createThrowingSetMMKV,
  loadTsModule,
  loadTsWithStorage,
};
