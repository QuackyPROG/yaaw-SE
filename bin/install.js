#!/usr/bin/env node
const os = require('node:os');
const path = require('node:path');
const { install } = require('../lib/installer');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npx github:QuackyPROG/yaaw-SE [--dry-run] [--target <dir>]

Installs or updates the yaaw-se skills and agents in ~/.claude.
Files that an update changes or removes are archived in ~/.claude/yaaw-se/archive/<old-version>/.

  --dry-run         Show what would change and write nothing.
  --target <dir>    Install into <dir> instead of ~/.claude.`);
  process.exit(0);
}

const targetIndex = args.indexOf('--target');
const target = targetIndex >= 0 ? path.resolve(args[targetIndex + 1]) : path.join(os.homedir(), '.claude');

try {
  install({ source: path.join(__dirname, '..'), target, dryRun: args.includes('--dry-run') });
} catch (err) {
  console.error(`yaaw-se install failed: ${err.message}`);
  process.exit(1);
}
