const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const KEEP_ARCHIVES = 3;

const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// Lists every file under dir as forward-slash paths relative to dir.
function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  });
}

// Compares versions by their numeric parts, so 0.10.0 sorts after 0.2.0.
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

// Writes through a temp file and a rename, so a file is never left half written.
function writeAtomic(dest, srcFile) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.yaaw-se-tmp`;
  fs.copyFileSync(srcFile, tmp);
  fs.renameSync(tmp, dest);
}

// Removes empty folders between file and stopAt, such as a skill folder whose last file was removed.
function pruneEmptyDirs(file, stopAt) {
  let dir = path.dirname(file);
  while (dir.startsWith(stopAt) && dir !== stopAt && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

function install({ source, target, dryRun = false, log = console.log }) {
  const version = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8')).version;
  const payload = path.join(source, 'payload');
  const stateDir = path.join(target, 'yaaw-se');
  const manifestFile = path.join(stateDir, 'manifest.json');
  const old = fs.existsSync(manifestFile)
    ? JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
    : { version: null, files: {} };

  const next = {};
  for (const rel of walk(payload)) next[rel] = hash(path.join(payload, rel));

  const result = { version, from: old.version, added: [], changed: [], removed: [], edited: [], upToDate: false };
  const toArchive = [];

  for (const [rel, newHash] of Object.entries(next)) {
    const dest = path.join(target, rel);
    if (!fs.existsSync(dest)) {
      result.added.push(rel);
      continue;
    }
    const diskHash = hash(dest);
    if (diskHash !== (old.files[rel] ?? null)) result.edited.push(rel);
    if (diskHash !== newHash) {
      result.changed.push(rel);
      toArchive.push(rel);
    }
  }
  for (const rel of Object.keys(old.files)) {
    if (rel in next) continue;
    result.removed.push(rel);
    const dest = path.join(target, rel);
    if (!fs.existsSync(dest)) continue;
    if (hash(dest) !== old.files[rel]) result.edited.push(rel);
    toArchive.push(rel);
  }

  result.upToDate = old.version === version && !result.added.length && !result.changed.length && !result.removed.length;
  report(result, log, dryRun);
  if (dryRun || result.upToDate) return result;

  const archiveDir = path.join(stateDir, 'archive', old.version ?? 'unmanaged');
  for (const rel of toArchive) writeAtomic(path.join(archiveDir, rel), path.join(target, rel));
  for (const rel of [...result.added, ...result.changed]) writeAtomic(path.join(target, rel), path.join(payload, rel));
  for (const rel of result.removed) {
    const dest = path.join(target, rel);
    if (!fs.existsSync(dest)) continue;
    fs.rmSync(dest);
    pruneEmptyDirs(dest, target);
  }

  // Written last: an interrupted run keeps the old manifest, and running again finishes the job.
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(manifestFile, JSON.stringify({ version, files: next }, null, 2));
  pruneArchives(path.join(stateDir, 'archive'));
  return result;
}

function pruneArchives(dir) {
  if (!fs.existsSync(dir)) return;
  const versions = fs.readdirSync(dir).filter((name) => /^\d+(\.\d+)*$/.test(name)).sort(compareVersions);
  for (const name of versions.slice(0, -KEEP_ARCHIVES)) fs.rmSync(path.join(dir, name), { recursive: true });
}

function report(r, log, dryRun) {
  if (r.upToDate) return log(`yaaw-se ${r.version} is already installed and up to date.`);
  const verb = dryRun ? 'Would install' : 'Installed';
  log(r.from ? `${verb} yaaw-se ${r.version} (was ${r.from}).` : `${verb} yaaw-se ${r.version}.`);
  const list = (label, items) => items.length && log(`${label} (${items.length}):\n${items.map((i) => `  ${i}`).join('\n')}`);
  list('Added', r.added);
  list('Changed', r.changed);
  list('Removed', r.removed);
  if (r.edited.length) {
    const where = `~/.claude/yaaw-se/archive/${r.from ?? 'unmanaged'}/`;
    log(`These files had been edited by hand. Your copies were archived in ${where}:\n${r.edited.map((i) => `  ${i}`).join('\n')}`);
  }
  if (!dryRun) log('Start a new Claude Code session to load the changes.');
}

module.exports = { install, compareVersions };
