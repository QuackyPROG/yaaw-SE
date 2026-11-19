const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install } = require('../lib/installer');

// Builds a fake release folder: package.json version plus payload files.
function release(version, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yaaw-se-src-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version }));
  for (const [rel, body] of Object.entries(files)) write(path.join(dir, 'payload', rel), body);
  return dir;
}

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

const read = (file) => fs.readFileSync(file, 'utf8');
const target = () => fs.mkdtempSync(path.join(os.tmpdir(), 'yaaw-se-home-'));
const quiet = { log: () => {} };

test('fresh install copies the payload and writes the manifest', () => {
  const home = target();
  const src = release('0.1.0', { 'skills/yaaw-a/SKILL.md': 'a1', 'agents/yaaw-dev.md': 'd1' });

  const result = install({ source: src, target: home, ...quiet });

  assert.equal(read(path.join(home, 'skills/yaaw-a/SKILL.md')), 'a1');
  assert.equal(read(path.join(home, 'agents/yaaw-dev.md')), 'd1');
  const manifest = JSON.parse(read(path.join(home, 'yaaw-se/manifest.json')));
  assert.equal(manifest.version, '0.1.0');
  assert.deepEqual(Object.keys(manifest.files).sort(), ['agents/yaaw-dev.md', 'skills/yaaw-a/SKILL.md']);
  assert.deepEqual(result.added.sort(), ['agents/yaaw-dev.md', 'skills/yaaw-a/SKILL.md']);
});

test('update archives changed and removed files under the old version', () => {
  const home = target();
  install({ source: release('0.1.0', { 'skills/yaaw-a/SKILL.md': 'a1', 'skills/yaaw-b/SKILL.md': 'b1' }), target: home, ...quiet });

  const result = install({ source: release('0.2.0', { 'skills/yaaw-a/SKILL.md': 'a2', 'skills/yaaw-c/SKILL.md': 'c1' }), target: home, ...quiet });

  assert.equal(read(path.join(home, 'skills/yaaw-a/SKILL.md')), 'a2');
  assert.equal(read(path.join(home, 'skills/yaaw-c/SKILL.md')), 'c1');
  assert.equal(fs.existsSync(path.join(home, 'skills/yaaw-b')), false, 'removed skill folder is cleaned up');
  const archive = path.join(home, 'yaaw-se/archive/0.1.0');
  assert.equal(read(path.join(archive, 'skills/yaaw-a/SKILL.md')), 'a1');
  assert.equal(read(path.join(archive, 'skills/yaaw-b/SKILL.md')), 'b1');
  assert.deepEqual(result.changed, ['skills/yaaw-a/SKILL.md']);
  assert.deepEqual(result.removed, ['skills/yaaw-b/SKILL.md']);
});

test('a file edited by hand is reported and archived before it is replaced', () => {
  const home = target();
  install({ source: release('0.1.0', { 'skills/yaaw-a/SKILL.md': 'a1' }), target: home, ...quiet });
  write(path.join(home, 'skills/yaaw-a/SKILL.md'), 'my edit');

  const result = install({ source: release('0.2.0', { 'skills/yaaw-a/SKILL.md': 'a2' }), target: home, ...quiet });

  assert.deepEqual(result.edited, ['skills/yaaw-a/SKILL.md']);
  assert.equal(read(path.join(home, 'yaaw-se/archive/0.1.0/skills/yaaw-a/SKILL.md')), 'my edit');
  assert.equal(read(path.join(home, 'skills/yaaw-a/SKILL.md')), 'a2');
});

test('a file of the same name that yaaw-se never installed is archived, not overwritten silently', () => {
  const home = target();
  write(path.join(home, 'skills/yaaw-a/SKILL.md'), 'mine');

  const result = install({ source: release('0.1.0', { 'skills/yaaw-a/SKILL.md': 'a1' }), target: home, ...quiet });

  assert.deepEqual(result.edited, ['skills/yaaw-a/SKILL.md']);
  assert.equal(read(path.join(home, 'yaaw-se/archive/unmanaged/skills/yaaw-a/SKILL.md')), 'mine');
});

test('running the same version again changes nothing', () => {
  const home = target();
  const src = release('0.1.0', { 'skills/yaaw-a/SKILL.md': 'a1' });
  install({ source: src, target: home, ...quiet });

  const result = install({ source: src, target: home, ...quiet });

  assert.equal(result.upToDate, true);
  assert.equal(fs.existsSync(path.join(home, 'yaaw-se/archive')), false);
});

test('dry run writes nothing', () => {
  const home = target();
  const result = install({ source: release('0.1.0', { 'skills/yaaw-a/SKILL.md': 'a1' }), target: home, dryRun: true, ...quiet });

  assert.deepEqual(result.added, ['skills/yaaw-a/SKILL.md']);
  assert.deepEqual(fs.readdirSync(home), []);
});

test('only the newest 3 archives are kept', () => {
  const home = target();
  for (const [i, v] of ['0.1.0', '0.2.0', '0.10.0', '0.11.0', '0.12.0'].entries()) {
    install({ source: release(v, { 'skills/yaaw-a/SKILL.md': `a${i}` }), target: home, ...quiet });
  }

  const kept = fs.readdirSync(path.join(home, 'yaaw-se/archive')).sort();
  assert.deepEqual(kept, ['0.10.0', '0.11.0', '0.2.0']);
});
