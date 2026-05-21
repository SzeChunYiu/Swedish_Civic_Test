const Module = require('node:module');
const path = require('node:path');

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
      let state;
      const setFn = (partial) => {
        const next = typeof partial === 'function' ? partial(state) : partial;
        if (next && next !== state) {
          Object.assign(state, next);
        }
      };
      const getFn = () => state;
      state = factory(setFn, getFn);

      const useStore = () => state;
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

  Module._resolveFilename = function patchedResolve(request, ...args) {
    if (stubs[request]) return `__storage_store_stub__:${request}`;
    return originalResolve.call(this, request, ...args);
  };
  Module._load = function patchedLoad(request, ...args) {
    if (stubs[request]) return stubs[request]();
    return originalLoad.call(this, request, ...args);
  };

  try {
    return require(targetPath);
  } finally {
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
  }
}

module.exports = {
  createMemoryMMKV,
  createThrowingReadMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
};
