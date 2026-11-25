#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SETUPS, installProject, removeGlobal, detect, findGlobal } = require('../lib/project');

const source = path.join(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8')).version;
const home = process.env.YAAW_SE_HOME || os.homedir();

// Colours the text amber, the yaaw-se accent. Plain when NO_COLOR is set or the output is not a terminal.
const plain = 'NO_COLOR' in process.env || !process.stdout.isTTY;
const paint = (code) => (text) => (plain ? text : `\x1b[${code}m${text}\x1b[0m`);
const amber = paint('38;5;214');
const dim = paint('2');
const bold = paint('1');

const WORDMARK = [
  '█▄█ ▄▀█ ▄▀█ █ █ █ ▄▄ █▀ █▀▀',
  ' █  █▀█ █▀█ ▀▄▀▄▀    ▄█ ██▄',
];

const HELP = `${bold('yaaw-se')} ${dim(`v${version}`)}  yet-another-ai-workflow

Usage: npx yaaw-se install [options]

Installs or updates yaaw-se in one project. Without options, it asks for the
project directory and the setups to install.

  --dir <path>    Project directory. Default: the current folder.
  --claude        Install the Claude Code setup into <dir>/.claude.
  --kiro          Install the Kiro setup into <dir>/.kiro.
  --yes           Skip the questions: use the defaults and install.
  --dry-run       Show what would change and write nothing.
  -h, --help      Show this help.`;

function parseArgs(argv) {
  const opts = { command: null, setups: [], yes: false, dryRun: false, dir: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dir') opts.dir = argv[++i];
    else if (arg === '--claude' || arg === '--kiro') opts.setups.push(arg.slice(2));
    else if (arg === '--yes' || arg === '-y') opts.yes = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!arg.startsWith('-') && !opts.command) opts.command = arg;
    else throw new Error(`Unknown option ${arg}. Run npx yaaw-se --help.`);
  }
  if (opts.dir === undefined) throw new Error('--dir needs a path.');
  return opts;
}

// Sums one setup's plan as "12 new, 3 changed", or "up to date".
function summary(r) {
  if (r.upToDate) return dim(`up to date (${r.version})`);
  const parts = [
    r.added.length && `${r.added.length} new`,
    r.changed.length && `${r.changed.length} changed`,
    r.removed.length && `${r.removed.length} removed`,
  ].filter(Boolean);
  const from = r.from ? `${r.from} → ${r.version}` : r.version;
  return `${from}  ${dim(parts.join(', '))}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || opts.command !== 'install') {
    console.log(HELP);
    process.exit(opts.help || !opts.command ? 0 : 1);
  }

  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  if (!interactive && !(opts.yes || (opts.setups.length && opts.dryRun))) {
    throw new Error('No terminal to ask in. Pass --claude and/or --kiro with --yes, or run it in a terminal.');
  }

  const p = await import('@clack/prompts');
  const stop = (value) => {
    if (p.isCancel(value)) {
      p.cancel('Nothing was installed.');
      process.exit(1);
    }
    return value;
  };

  console.log(`\n${WORDMARK.map(amber).join('\n')}\n${dim(`yet-another-ai-workflow · v${version}`)}\n`);
  p.intro(amber(' install '));

  const cwd = process.cwd();
  let dir = opts.dir ? path.resolve(opts.dir) : null;
  if (!dir) {
    dir = opts.yes
      ? cwd
      : path.resolve(stop(await p.text({
          message: 'Project directory',
          placeholder: cwd,
          defaultValue: cwd,
          validate: (value) => {
            const target = path.resolve(value || cwd);
            return fs.existsSync(target) && fs.statSync(target).isDirectory() ? undefined : `${target} does not exist.`;
          },
        })));
  }
  if (!fs.existsSync(dir)) throw new Error(`${dir} does not exist.`);

  const installed = detect(dir);
  if (Object.keys(installed).length) {
    const list = Object.entries(installed).map(([name, v]) => `${SETUPS[name].label} ${v}`).join(', ');
    const same = Object.values(installed).every((v) => v === version);
    p.log.info(`yaaw-se is already here (${list}).${same ? '' : ` This run updates it to ${version}.`}`);
  }

  let setups = opts.setups;
  if (!setups.length) {
    const preset = Object.keys(installed).length ? Object.keys(installed) : ['claude'];
    setups = opts.yes
      ? preset
      : stop(await p.multiselect({
          message: 'Setups',
          initialValues: preset,
          options: Object.entries(SETUPS).map(([value, { label, folder }]) => ({ value, label, hint: `${folder}/` })),
        }));
  }

  const global = Object.keys(findGlobal(home)).filter((name) => setups.includes(name));
  let dropGlobal = false;
  if (global.length && !opts.dryRun) {
    const where = global.map((name) => `~/${SETUPS[name].folder}`).join(' and ');
    dropGlobal = opts.yes || stop(await p.confirm({
      message: `A global yaaw-se install is in ${where}. Archive and remove it?`,
      initialValue: true,
    }));
  }

  const quiet = () => {};
  const plan = installProject({ source, dir, setups, dryRun: true, log: quiet });
  const shown = path.relative(cwd, dir) || '.';
  p.note(
    [
      `${dim('Project'.padEnd(14))} ${shown.startsWith('..') ? dir : shown}`,
      ...setups.map((name) => `${amber('◆')} ${SETUPS[name].label.padEnd(12)} ${summary(plan[name])}`),
    ].join('\n'),
    'Plan',
  );
  const edited = setups.flatMap((name) => plan[name].edited.map((rel) => `${SETUPS[name].folder}/${rel}`));
  if (edited.length) p.log.warn(`Edited by hand, archived before they are replaced:\n${edited.join('\n')}`);

  if (opts.dryRun) {
    p.outro('Dry run. Nothing was written.');
    return;
  }
  if (setups.every((name) => plan[name].upToDate) && !dropGlobal) {
    p.outro('Nothing to do.');
    return;
  }
  if (!opts.yes && !stop(await p.confirm({ message: 'Install?', initialValue: true }))) {
    p.cancel('Nothing was installed.');
    return;
  }

  const spin = p.spinner();
  spin.start('Installing');
  for (const name of dropGlobal ? global : []) removeGlobal({ home, flavor: name, log: quiet });
  installProject({ source, dir, setups, log: quiet });
  spin.stop('Installed');

  const next = [
    setups.includes('claude') && 'Start a new Claude Code session, then run /yaaw-se <feature>.',
    setups.includes('kiro') && 'Restart Kiro to load the agents and steering.',
    dropGlobal && `The global install was archived in ~/${SETUPS[global[0]].folder}/yaaw-se/archive/.`,
    'Commit the new files so that your team gets yaaw-se too.',
  ].filter(Boolean);
  p.note(next.join('\n'), 'Next');
  p.outro(amber('Done.'));
}

main().catch((err) => {
  console.error(`yaaw-se: ${err.message}`);
  process.exit(1);
});
