const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function createTsLoader(repoRoot) {
  function loadTs(relativePath, exportName, moduleCache = new Map(), moduleMocks = {}) {
    const filePath = path.join(repoRoot, relativePath);
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

    function localRequire(specifier) {
      if (Object.hasOwn(moduleMocks, specifier)) {
        return moduleMocks[specifier];
      }

      if (specifier.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(filePath), specifier);
        const tsPath = fs.existsSync(`${resolvedPath}.ts`) ? `${resolvedPath}.ts` : undefined;
        const tsxPath = fs.existsSync(`${resolvedPath}.tsx`) ? `${resolvedPath}.tsx` : undefined;
        const indexTsPath = fs.existsSync(path.join(resolvedPath, 'index.ts'))
          ? path.join(resolvedPath, 'index.ts')
          : undefined;
        const resolvedTsPath = tsPath ?? tsxPath ?? indexTsPath;

        if (resolvedTsPath?.startsWith(repoRoot)) {
          return loadTs(
            path.relative(repoRoot, resolvedTsPath),
            undefined,
            moduleCache,
            moduleMocks,
          );
        }
      }

      return require(specifier);
    }

    new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
    return exportName ? mod.exports[exportName] : mod.exports;
  }

  return loadTs;
}

function createReactHookStub() {
  return {
    useCallback(callback) {
      return callback;
    },
    useEffect() {},
    useMemo(factory) {
      return factory();
    },
    useState(initialValue) {
      return [initialValue, () => {}];
    },
  };
}

function createReactNativeWebStub() {
  return {
    Platform: { OS: 'web' },
  };
}

function createMemoryLocalStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(String(key)) ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
}

async function withGlobalProperties(overrides, fn) {
  const previous = new Map();

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    if (value === undefined) {
      delete globalThis[key];
    } else {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value,
        writable: true,
      });
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete globalThis[key];
      }
    }
  }
}

module.exports = {
  createMemoryLocalStorage,
  createReactHookStub,
  createReactNativeWebStub,
  createTsLoader,
  withGlobalProperties,
};
