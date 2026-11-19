# yaaw-se

yaaw-se is a software engineering workflow for Claude Code. A feature is probed with the user first, then planned into tickets by a planner agent. Each ticket is built test-first by a dev agent and checked by a read-only reviewer agent, with one commit per ticket.

The skills are customised from mattpocock/skills (how a feature is planned and built), ponytail (how code is written) and impeccable (UI and UX). The decisions behind the design are in [docs/DESIGN.md](docs/DESIGN.md).

## Install

Node.js 18 or later and Claude Code must be installed. Run:

```
npx github:QuackyPROG/yaaw-SE
```

The skills and agents are copied into `~/.claude/skills/` and `~/.claude/agents/`. Start a new Claude Code session to load them.

## Update

Run the same command again. Files that the update changes or removes are archived in `~/.claude/yaaw-se/archive/<old-version>/` first, and files edited by hand are listed in the output. Only the newest 3 archives are kept. Add `--dry-run` to see the changes without writing anything.

## Use

Run `/yaaw-se <feature>` to start a feature, or `/yaaw-se <slug>` to resume one. Feature files are kept in `docs/yaaw-se/<slug>/` in the project.

| Agent | Role | Preloaded skills |
|---|---|---|
| `yaaw-planner` | Researches and writes the spec and tickets | `yaaw-to-spec`, `yaaw-to-ticket`, `yaaw-architecture`, `yaaw-domain` |
| `yaaw-dev` | Builds one ticket test-first | `yaaw-lean`, `yaaw-tdd`, `yaaw-diagnose` |
| `yaaw-reviewer` | Reviews one ticket, read-only | `yaaw-review` |

Skills that can also be run on their own: `yaaw-probe`, `yaaw-probe-docs`, `yaaw-research`, `yaaw-prototype`, `yaaw-architecture-audit`, `yaaw-triage`, `yaaw-pr`, `yaaw-debt`, `yaaw-handoff` and `yaaw-agent-writing`.

## Development

Work happens on the `v3` branch. Run `npm test` to test the installer and check the skills, then `node bin/install.js --target <folder>` to try an install without touching `~/.claude`. Commits follow Conventional Commits. Merging `v3` into `main` lets release-please open a release PR, and merging that PR tags the release.
