const fs = require('node:fs');
const path = require('node:path');
const { install, writeAtomic, pruneEmptyDirs, hashFile } = require('./installer');

const SETUPS = {
  claude: { folder: '.claude', label: 'Claude Code' },
  kiro: { folder: '.kiro', label: 'Kiro' },
};

const readManifest = (root) => {
  const file = path.join(root, 'yaaw-se', 'manifest.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
};

// Returns the installed yaaw-se version of each setup under root, as { claude: '0.4.0' }.
function versionsUnder(root) {
  const found = {};
  for (const [name, { folder }] of Object.entries(SETUPS)) {
    const manifest = readManifest(path.join(root, folder));
    if (manifest) found[name] = manifest.version;
  }
  return found;
}

const detect = (dir) => versionsUnder(dir);
const findGlobal = (home) => versionsUnder(home);

// Adds each archive folder to the project's .gitignore, once. It is the only file outside yaaw-se's folders it changes.
function ignoreArchives(dir, setups) {
  const file = path.join(dir, '.gitignore');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const have = new Set(text.split(/\r?\n/).map((line) => line.trim()));
  const missing = setups.map((name) => `${SETUPS[name].folder}/yaaw-se/archive/`).filter((line) => !have.has(line));
  if (!missing.length) return;
  const sep = text && !text.endsWith('\n') ? '\n' : '';
  writeAtomic(file, `${text}${sep}${missing.join('\n')}\n`);
}

function installProject({ source, dir, setups, dryRun = false, log = console.log }) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error(`${dir} does not exist`);
  const results = {};
  for (const name of setups) {
    results[name] = install({ source, target: path.join(dir, SETUPS[name].folder), flavor: name, dryRun, log });
  }
  if (!dryRun) ignoreArchives(dir, setups);
  return results;
}

// Archives and removes a global install from an earlier version, keeping files yaaw-se never installed.
function removeGlobal({ home, flavor, log = console.log }) {
  const root = path.join(home, SETUPS[flavor].folder);
  const manifest = readManifest(root);
  if (!manifest) return [];
  const archive = path.join(root, 'yaaw-se', 'archive', `global-${manifest.version}`);
  const removed = [];
  for (const rel of Object.keys(manifest.files)) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    writeAtomic(path.join(archive, rel), fs.readFileSync(file));
    if (hashFile(file) !== manifest.files[rel]) log(`Edited by hand, archived: ${rel}`);
    fs.rmSync(file);
    pruneEmptyDirs(file, root);
    removed.push(rel);
  }
  fs.rmSync(path.join(root, 'yaaw-se', 'manifest.json'));
  return removed;
}

module.exports = { SETUPS, installProject, removeGlobal, detect, findGlobal };
