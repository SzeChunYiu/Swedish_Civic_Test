const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('release blocker snapshot run-validate path allows large preflight JSON evidence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-blocker-large-json-'));
  const mockPath = path.join(tmpDir, 'mock-preflight-spawn.js');
  const reportPath = path.join(tmpDir, 'release-blockers.md');
  fs.writeFileSync(
    mockPath,
    `
const childProcess = require('node:child_process');
const fs = require('node:fs');

childProcess.spawnSync = (_command, args, options = {}) => {
  if (!Array.isArray(args) || args[0] !== 'scripts/release-preflight.js') {
    return { status: 1, stdout: '', stderr: 'unexpected spawn target' };
  }
  const stdoutFd = Array.isArray(options.stdio) ? options.stdio[1] : undefined;
  if (typeof stdoutFd !== 'number') {
    return { status: 1, stdout: '', stderr: 'expected release-preflight stdout fd' };
  }
  const largeEvidence = 'large-json-evidence:'.concat('x'.repeat(1024 * 1024), ':complete');
  fs.writeFileSync(
    stdoutFd,
    JSON.stringify({
      status: 'BLOCKED',
      readyForSubmission: false,
      generatedAt: '2026-05-20T00:00:00.000Z',
      gates: [
        {
          id: 'local-validation',
          label: 'Local validation suite',
          status: 'BLOCKED',
          evidence: largeEvidence,
          nextAction: 'Fix validation.',
        },
      ],
    }),
  );
  return { status: 0, stdout: '', stderr: '' };
};
`,
  );

  const result = spawnSync(
    process.execPath,
    [
      '--require',
      mockPath,
      'scripts/write-release-blocker-snapshot.js',
      '--run-validate',
      '--out',
      reportPath,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const source = fs.readFileSync(
    path.join(repoRoot, 'scripts/write-release-blocker-snapshot.js'),
    'utf8',
  );

  assert.equal(result.status, 1, result.stdout || result.stderr);
  assert.match(result.stdout, /Release blocker snapshot BLOCKED/i);
  assert.match(report, /large-json-evidence:x+/);
  assert.match(report, /:complete/);
  assert.match(source, /stdio:\s*\['ignore', stdoutFd, 'pipe'\]/);
  assert.match(source, /fs\.mkdtempSync\(path\.join\(os\.tmpdir\(\), 'release-blockers-'\)\)/);
  assert.match(source, /--run-validate embeds the full local validation transcript/);
});
