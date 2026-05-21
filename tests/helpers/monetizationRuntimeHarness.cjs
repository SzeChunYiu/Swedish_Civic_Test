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

module.exports = {
  createReactHookStub,
  createReactNativeWebStub,
  createTsLoader,
};
