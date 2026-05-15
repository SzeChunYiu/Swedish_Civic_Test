const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'swedish-civic-native-prebuild-'));
const excludedTopLevel = new Set([
  '.code-review-graph',
  '.expo',
  '.git',
  'dist-web',
  'node_modules',
  'tmp',
]);

function copyProject(destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(repoRoot, destination, {
    recursive: true,
    filter(source) {
      const relative = path.relative(repoRoot, source);
      if (!relative) {
        return true;
      }
      const topLevel = relative.split(path.sep)[0];
      return !excludedTopLevel.has(topLevel);
    },
  });

  fs.symlinkSync(
    path.join(repoRoot, 'node_modules'),
    path.join(destination, 'node_modules'),
    'dir',
  );
}

function runPrebuild(platform) {
  const destination = path.join(workRoot, platform);
  copyProject(destination);

  const result = spawnSync(
    'npx',
    ['expo', 'prebuild', '--no-install', '--platform', platform, '--clean'],
    {
      cwd: destination,
      encoding: 'utf8',
    },
  );
  const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n');

  if (result.status !== 0) {
    throw new Error(`${platform} prebuild failed\n${output}`);
  }

  if (/userInterfaceStyle: Install expo-system-ui/i.test(output)) {
    throw new Error(`${platform} prebuild emitted expo-system-ui warning\n${output}`);
  }

  const summary = output.includes('✔ Finished prebuild')
    ? '✔ Finished prebuild'
    : 'prebuild passed';
  return `${platform}: ${summary}`;
}

try {
  const results = [runPrebuild('android'), runPrebuild('ios')];
  console.log('Native prebuild smoke passed');
  for (const line of results) {
    console.log(`- ${line}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
} finally {
  fs.rmSync(workRoot, { recursive: true, force: true });
}
