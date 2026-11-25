# yaaw-se

yaaw-se (yet-another-ai-workflow) is a software engineering workflow for Claude Code and Kiro. A feature is probed with the user first, then planned into tickets by a planner agent. Each ticket is built test-first by a dev agent and checked by a read-only reviewer agent, with one commit per ticket.

The skills are customised from mattpocock/skills (how a feature is planned and built), ponytail (how code is written) and impeccable (UI and UX). `yaaw-design` is derived from impeccable and keeps its Apache-2.0 license. The decisions behind the design are in [docs/DESIGN.md](docs/DESIGN.md).

## Install

Node.js 20.12 or later must be installed. In the project folder, run:

```
npx yaaw-se install
```

The installer asks for the project directory (the current folder by default) and the setups to install: Claude Code, Kiro or both. It then shows the plan and installs once it is confirmed. yaaw-se is installed into one project only, never globally. Commit the new files so that the rest of the team gets yaaw-se from git.

The Claude Code setup goes into `.claude/`. It adds the skills, the agents and `.claude/rules/yaaw-se.md`, which holds the yaaw-se core rules and loads in every session. The project's own `CLAUDE.md` is not changed. Start a new Claude Code session to load them.

The Kiro setup goes into `.kiro/`. The agents are rewritten in Kiro's format: tools become Kiro selectors (`read`, `write`, `shell`, `web`), and each agent lists the core rules and its skills as resources, since Kiro custom agents load neither by default. The core rules go into `.kiro/steering/yaaw-core.md`, which Kiro loads in every session. Restart Kiro to load them.

The questions can be skipped with flags, for example in CI:

```
npx yaaw-se install --dir . --claude --kiro --yes
```

If an earlier version of yaaw-se was installed globally into `~/.claude` or `~/.kiro`, the installer offers to archive and remove it, so that the skills are not loaded twice.

## Update

Run `npx yaaw-se install` again. Files that the update changes or removes are archived in `.claude/yaaw-se/archive/<old-version>/` (or `.kiro/...`) first, and files edited by hand are listed in the plan. Only the newest 3 archives are kept, and the archive folders are added to `.gitignore`. Add `--dry-run` to see the plan without writing anything.

## Use

Run `/yaaw-se <feature>` to start a feature, or `/yaaw-se <slug>` to resume one. Feature files are kept in `docs/yaaw-se/<slug>/` in the project.

| Agent | Role | Preloaded skills |
|---|---|---|
| `yaaw-planner` | Researches and writes the spec and tickets | `yaaw-to-spec`, `yaaw-to-ticket`, `yaaw-architecture`, `yaaw-domain` |
| `yaaw-dev` | Builds one ticket test-first | `yaaw-lean`, `yaaw-tdd`, `yaaw-diagnose` |
| `yaaw-designer` | Builds one UI ticket to its design direction | `yaaw-design`, `yaaw-tdd`, `yaaw-diagnose` |
| `yaaw-reviewer` | Reviews one ticket, read-only | `yaaw-review`, `yaaw-design` |

Skills that can also be run on their own: `yaaw-probe`, `yaaw-probe-docs`, `yaaw-research`, `yaaw-prototype`, `yaaw-architecture-audit`, `yaaw-triage`, `yaaw-pr`, `yaaw-debt`, `yaaw-handoff` and `yaaw-agent-writing`.

## Development

Work happens on the `v3` branch. Run `npm install`, then `npm test` to test the installer and check the skills. Run `node bin/install.js install --dir <folder>` to try an install in a scratch project. Commits follow Conventional Commits. Merging `v3` into `main` lets release-please open a release PR. Merging that PR tags the release and publishes it to npm.
