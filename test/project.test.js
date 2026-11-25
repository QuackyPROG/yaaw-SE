const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { installProject, removeGlobal, detect, findGlobal } = require('../lib/project');
const { install } = require('../lib/installer');

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

// Builds a fake release folder: shared payload, Claude-only and Kiro-only files.
function release(version) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yaaw-se-src-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version }));
  write(path.join(dir, 'payload/skills/yaaw-lean/SKILL.md'), 'lean');
  write(path.join(dir, 'payload/agents/yaaw-dev.md'), '---\nname: yaaw-dev\ndescription: dev\ntools: Read, Bash\nskills:\n  - yaaw-lean\n---\n\nYou are the developer.\n');
  write(path.join(dir, 'claude/rules/yaaw-se.md'), 'claude rules');
  write(path.join(dir, 'kiro/steering/yaaw-core.md'), 'kiro rules');
  return dir;
}

const read = (file) => fs.readFileSync(file, 'utf8');
const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const quiet = { log: () => {} };

test('claude setup installs into the project .claude with the rules file and no Kiro files', () => {
  const dir = tmp('yaaw-se-proj-');
  installProject({ source: release('0.4.0'), dir, setups: ['claude'], ...quiet });

  assert.equal(read(path.join(dir, '.claude/skills/yaaw-lean/SKILL.md')), 'lean');
  assert.equal(read(path.join(dir, '.claude/rules/yaaw-se.md')), 'claude rules');
  assert.equal(fs.existsSync(path.join(dir, '.claude/steering')), false);
  assert.equal(fs.existsSync(path.join(dir, '.kiro')), false);
  assert.equal(JSON.parse(read(path.join(dir, '.claude/yaaw-se/manifest.json'))).version, '0.4.0');
});

test('kiro setup names its resources relative to the project, so the files work from any clone', () => {
  const dir = tmp('yaaw-se-proj-');
  installProject({ source: release('0.4.0'), dir, setups: ['kiro'], ...quiet });

  const agent = read(path.join(dir, '.kiro/agents/yaaw-dev.md'));
  assert.match(agent, /^ {2}- file:\/\/\.kiro\/steering\/yaaw-core\.md$/m);
  assert.match(agent, /^ {2}- skill:\/\/\.kiro\/skills\/yaaw-lean\/SKILL\.md$/m);
  assert.equal(read(path.join(dir, '.kiro/steering/yaaw-core.md')), 'kiro rules');
  assert.equal(fs.existsSync(path.join(dir, '.kiro/rules')), false);
});

test('both setups install in one run', () => {
  const dir = tmp('yaaw-se-proj-');
  installProject({ source: release('0.4.0'), dir, setups: ['claude', 'kiro'], ...quiet });

  assert.deepEqual(detect(dir), { claude: '0.4.0', kiro: '0.4.0' });
});

test('the archive folders are added to .gitignore once, keeping what was there', () => {
  const dir = tmp('yaaw-se-proj-');
  write(path.join(dir, '.gitignore'), 'node_modules/');
  const src = release('0.4.0');

  installProject({ source: src, dir, setups: ['claude'], ...quiet });
  installProject({ source: src, dir, setups: ['claude', 'kiro'], ...quiet });

  const lines = read(path.join(dir, '.gitignore')).split('\n').filter(Boolean);
  assert.deepEqual(lines, ['node_modules/', '.claude/yaaw-se/archive/', '.kiro/yaaw-se/archive/']);
});

test('dry run writes nothing, not even .gitignore', () => {
  const dir = tmp('yaaw-se-proj-');
  installProject({ source: release('0.4.0'), dir, setups: ['claude'], dryRun: true, ...quiet });

  assert.deepEqual(fs.readdirSync(dir), []);
});

test('a missing project folder is an error', () => {
  const dir = path.join(tmp('yaaw-se-proj-'), 'nope');
  assert.throws(() => installProject({ source: release('0.4.0'), dir, setups: ['claude'], ...quiet }), /does not exist/);
});

test('a global install is archived, removed and no longer found', () => {
  const home = tmp('yaaw-se-home-');
  const claudeHome = path.join(home, '.claude');
  install({ source: release('0.3.0'), target: claudeHome, ...quiet });
  write(path.join(claudeHome, 'skills/mine/SKILL.md'), 'not yaaw-se');

  assert.deepEqual(findGlobal(home), { claude: '0.3.0' });
  removeGlobal({ home, flavor: 'claude', ...quiet });

  assert.deepEqual(findGlobal(home), {});
  assert.equal(fs.existsSync(path.join(claudeHome, 'skills/yaaw-lean')), false);
  assert.equal(read(path.join(claudeHome, 'skills/mine/SKILL.md')), 'not yaaw-se');
  assert.equal(read(path.join(claudeHome, 'yaaw-se/archive/global-0.3.0/skills/yaaw-lean/SKILL.md')), 'lean');
});

test('the CLI installs with flags and no prompts', () => {
  const dir = tmp('yaaw-se-proj-');
  const home = tmp('yaaw-se-home-');
  const bin = path.join(__dirname, '..', 'bin', 'install.js');
  const run = spawnSync(process.execPath, [bin, 'install', '--dir', dir, '--claude', '--kiro', '--yes'], {
    encoding: 'utf8',
    env: { ...process.env, YAAW_SE_HOME: home, NO_COLOR: '1' },
  });

  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.ok(fs.existsSync(path.join(dir, '.claude/skills/yaaw-se/SKILL.md')));
  assert.ok(fs.existsSync(path.join(dir, '.claude/rules/yaaw-se.md')));
  assert.ok(fs.existsSync(path.join(dir, '.kiro/steering/yaaw-core.md')));
});

test('the CLI refuses to run without a terminal when flags leave a question open', () => {
  const dir = tmp('yaaw-se-proj-');
  const bin = path.join(__dirname, '..', 'bin', 'install.js');
  const run = spawnSync(process.execPath, [bin, 'install', '--dir', dir], { encoding: 'utf8', input: '' });

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /--claude|--kiro|--yes/);
});
