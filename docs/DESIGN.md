# yaaw-se design

yaaw-se is a software engineering workflow for Claude Code. It is a new workflow and is not related to yaaw. Versions 1 and 2 of this repository are retired and are kept only in the git history.

All decisions below were settled in a probe on 2026-11-19.

## Install and update

yaaw-se is installed into a project with one command:

```
npx yaaw-se install
```

The installer copies the `yaaw-*` skills and agents into the project's `.claude/` (or `.kiro/`). It does not use the Claude Code plugin system, so it can own its files and archive them on update. No hooks are installed.

The installer writes `<setup>/yaaw-se/manifest.json` with the installed version and a SHA-256 hash for every file. Running the same command again updates yaaw-se:

1. Every file that will be changed or removed is copied to `<setup>/yaaw-se/archive/<old-version>/` first.
2. A file whose hash differs from the manifest was edited by hand. It is archived like any other file and named in the output, so the edit is never lost silently.
3. New files are written through a temporary file and a rename. The manifest is written last, so an interrupted update is repaired by running the command again.
4. Only the newest 3 archives are kept.

### Project install and the CLI

Settled in a probe on 2026-11-26. yaaw-se was installed into `~/.claude`, so it could not ship its own rules and every project got the same copy.

- **yaaw-se installs into one project only.** There is no global install. yaaw-se is a whole AI workflow package, and a project may later need its own settings, `CLAUDE.md` setup, skills or MCP servers (see Later).
- **`npx yaaw-se install` asks 2 questions.** The first is `Project directory`, with the current folder shown as the default. Enter accepts it, or another path can be pasted. A folder that does not exist is an error. The second is a multi-select of setups: Claude Code (`.claude/`) and Kiro (`.kiro/`), with Claude checked. The plan is then shown, and nothing is written until it is confirmed.
- **The CLI uses `@clack/prompts` with its own look**, not a copy of BMAD or Spec Kit. It shows a `yaaw-se` wordmark, the tagline `yet-another-ai-workflow` and an amber accent.
- **Flags skip the prompts** for tests and CI: `--dir <path>`, `--claude`, `--kiro`, `--yes` and `--dry-run`.
- **Claude projects get `.claude/rules/yaaw-se.md`** with the yaaw-se core rules. A rule file with no `paths:` frontmatter is loaded at session start, with the same priority as `.claude/CLAUDE.md` (checked in the Claude Code memory docs). It is the Claude counterpart of Kiro's `steering/yaaw-core.md`. The project's own `CLAUDE.md` and `AGENTS.md` are never touched. These rules are separate to the ones in the old `yaaw` plugin.
- **Kiro agents name their resources relative to the project** (`file://.kiro/steering/yaaw-core.md`), so that the files work from any clone. Kiro's docs show relative `file://` paths, but not what they are relative to. This should be checked in Kiro.
- **A global install from an earlier version is archived and removed.** When `~/.claude/yaaw-se/manifest.json` or `~/.kiro/yaaw-se/manifest.json` exists, the CLI offers to remove it. Its files are archived in `~/.claude/yaaw-se/archive/global-<version>/` first. Otherwise Claude would see every skill twice.
- **The project commits everything except the archives.** The installer adds `.claude/yaaw-se/archive/` and `.kiro/yaaw-se/archive/` to `.gitignore`, so that teammates get yaaw-se from git with no install step. It is the only file outside its own folders that the installer changes.
- **Running it again in a project is an update.** The CLI shows the installed version and checks the installed setups. Unchecking a setup does not uninstall it.

### Later

These are planned, so that yaaw-se grows into a workflow factory. None of them are built yet.

- Install a project's Claude settings, a `CLAUDE.md` setup, more skills or MCP servers.
- A prompt to pick which of these pieces to install.
- Merging into files the project already owns, such as `settings.json` and `.mcp.json`.
- Per-setup source folders (`setups/claude/`, `setups/kiro/`), once a setup has more than a rules file of its own.
- An `uninstall` command.

### Why not the plugin system

A plugin is a cached copy that Claude Code swaps as a whole on update. The installer never sees which files changed, so it cannot archive them. The plugin system also gives namespacing and auto-update, which were not needed.

## Repository and releases

- `v3` is the working branch. `main` is the release channel.
- Releases are made by release-please. Merging `v3` into `main` opens a release PR, and merging that PR tags the version and writes the changelog. Commits follow Conventional Commits so that release-please can pick the version bump.
- **Each release is published to npm as `yaaw-se`.** The publish job runs after release-please creates a release and uses npm trusted publishing, so no npm token is stored. The trusted publisher must be set up once in the package settings on npmjs.com.
- **The first npm release is `0.4.0`.** The name `yaaw-se` already held versions up to `0.3.13` from the retired v1 and v2, and npm does not accept a lower version. Those versions are deprecated with `npm deprecate`. The bump is set with a `Release-As: 0.4.0` commit footer, as the `release-as` config option is deprecated.
- The repository and the npm package stay public.
- The dev loop is to test locally first (`node bin/install.js install --dir <folder>` from this folder), then push to `v3`, then install with npx and test again.

## How a feature runs

The main session is the orchestrator. The `/yaaw-se` skill is the entry point.

1. **Probe.** `yaaw-probe` runs in the main session, as only the main session can ask the user questions. Every decision the feature needs is settled here. When talking does not settle a decision about feel, the probe can offer a throwaway prototype.
2. **Plan.** The `yaaw-planner` subagent researches the codebase and the docs, then writes the spec and the tickets. Each ticket names its test seams, what to reuse first and its acceptance criteria.
3. **Approve.** The user approves the tickets once.
4. **Build.** For each ticket, `yaaw-dev` builds it test-first, then `yaaw-reviewer` checks it. There are at most 2 fix loops, then one commit per ticket. UI tickets go to `yaaw-designer`, which builds to the design direction settled in the probe.
5. **Improve.** In the full lane, `yaaw-planner` looks for deepening opportunities in the code the feature changed, and the orchestrator drafts lessons and code rules from the `STATE.md` Log. The user approves which to keep.
6. **Report.** The run stops only to report or when it is stuck.

Every question is asked before the build starts. This is what lets `yaaw-dev` work without stopping: it has nothing left to ask.

Feature files live in each project under `docs/yaaw-se/<slug>/`. `STATE.md` carries a `format:` line so that a newer yaaw-se can notice an older layout.

### Checks and the quick lane

Settled on 2026-11-21, after a project with 365 tests (an iOS app built with xtool in WSL, so the tests run only in GitHub CI) spent about 12 minutes per ticket and fix loop waiting for the full suite. The tests themselves took 20 seconds; the rest was CI setup and a fresh compile.

- **The full suite runs once per feature**, in a new Full check stage after the build. Build agents run only a `fast` check (build, type check, lint) and single test files.
- **Each project's commands live in `docs/yaaw-se/CHECKS.md`**: `fast`, `test`, `full`, where the full suite runs (`local` or `ci`) and the CI workflow. The orchestrator finds them itself and asks the user to confirm on first run. It does not touch the project's `CLAUDE.md`.
- **When tests run only in CI** (`test: none`), the build agents still write each seam test before its code and compile both. The one CI run at the end is the red and green proof. This is weaker per ticket, and the report says so.
- **Approve covers one push.** When the full suite runs in CI, approving the tickets also approves pushing the feature branch to run it. Fix rounds on the same branch need no new approval. A failing full check is traced to its ticket and sent back to that ticket's agent, with at most 2 rounds.
- **Test evidence is a summary**: the command and its result line, never the full output.
- **The quick lane** takes a small fix with no open decision past the probe and the planner: the orchestrator writes one ticket, the user approves it, and it is built and reviewed as usual. When unsure, the full lane is used.

### Prototype in the probe

Settled on 2026-11-22. `yaaw-prototype` was in the payload, but nothing in `/yaaw-se` called it.

- **The probe offers a prototype** when a decision is about feel (a state model or a look) and one round of talking has not settled it. The user decides whether to build it.
- **The main session builds it.** It is throwaway code, and the user has to drive it and react to it in the same conversation. `yaaw-dev` and `yaaw-designer` were not used, as they preload `yaaw-tdd` and `yaaw-lean`, which clash with the prototype's "no tests, no polish" rule. This is the only code the orchestrator writes.
- **It stays inside the probe stage.** A prototype question usually comes up in the middle of the probe, so it is not a stage of its own. The Log records when it starts and its verdict, so that a resume can find one that is under way.
- **The code goes to a local branch** named `prototype/<slug>-<question>`, which is never pushed. The feature's branch keeps only the verdict in `DECISIONS.md`.

### Probe records and pauses

Settled on 2026-11-22. `yaaw-probe-docs` and `yaaw-handoff` were in the payload, but nothing in `/yaaw-se` called them.

- **The probe uses `yaaw-probe-docs`** when the project has a glossary, ADRs or earlier specs, so that answers are checked against the record and hard decisions become ADRs as they settle. Otherwise it uses `yaaw-probe`.
- **`disable-model-invocation` was dropped** from `yaaw-probe-docs` and `yaaw-handoff`. The Claude Code skills docs say a skill with this flag cannot be invoked by Claude on its own, so `/yaaw-se` could not call them. They can still be typed as commands.
- **`DECISIONS.md` is written after every round**, marked `status: draft` until the user confirms it. The probe was the only stage whose progress lived only in the conversation.
- **A paused probe gets a handoff note** for what is not in a file yet. Its path is logged in `STATE.md`. The note stays in the OS temp folder, so the draft `DECISIONS.md` is what a resume relies on when the note is gone.

### Improve stage

Settled on 2026-11-22, after a comparison with Matt Pocock's loop, which ends with `/code-review` and `/improve-codebase-architecture` to make the next run easier. yaaw-se ended at the report, so nothing it learned reached the next feature.

- **The full lane runs an Improve stage after the full check.** A quick fix is one ticket with no decisions, so there is little to learn from it.
- **Architecture findings are proposals only.** `yaaw-planner` in improve mode writes `IMPROVE.md` for the changed code. Each candidate the user keeps becomes a new feature at `stage: probe`. No code changes after the full check, so the feature does not need a second one.
- **The planner runs the pass, not `yaaw-architecture-audit`.** The audit skill is user-invoked and interactive (an HTML report, then a probe). The planner already preloads `yaaw-architecture` and `yaaw-domain` and may write in the feature folder.
- **Process lessons live in `docs/yaaw-se/LESSONS.md`**, next to `CHECKS.md`. The probe and the planner read it at the start of a feature. Code lessons go to rule files (see Code rules). yaaw-se still does not touch the project's `CLAUDE.md`.
- **`STATE.md` gains a `base:` line** at approval, so that the Improve stage knows the feature's commit range. `format:` stays `1`, as older files without it still resume.

### Code rules

Settled on 2026-11-22, after a look at Wand-Enhancer (`k1tbyte/Wand-Enhancer`), which keeps its invariants in path-scoped `.claude/rules/` files and fails its build when a rule names a missing path. Only the probe and the planner read `LESSONS.md`, so a code lesson reached `yaaw-dev`, `yaaw-designer` and `yaaw-reviewer` only when the planner copied it into a ticket.

- **Code lessons become path-scoped rules** in the project's `.claude/rules/yaaw-<area>.md`, with `paths:` frontmatter. yaaw-se writes only its own `yaaw-` files. An overlap with a project's own rule file is shown to the user as a suggested change.
- **The build agents and the reviewer read the rules themselves.** Each reads every rule file whose `paths` match the files of its ticket or diff, and the reviewer judges the diff against them. This works whether or not a subagent loads path-scoped rules on its own (not checked) and on Kiro.
- **The Improve stage tags each lesson** `[process]`, `[code: <globs>]` or `[check]`, and the user can change the tag at approval. A `[check]` lesson could be a lint rule or a test, so it becomes a candidate feature instead of a rule, as a check enforces itself.
- **A lesson needs evidence and must be specific.** It comes from the Log (a correction, a fix loop, a repeated review finding or a full check failure) and names something specific to the project that Claude would get wrong without it. Generic advice is dropped, as it costs context in every ticket and changes nothing.
- **A rule file holds at most 8 rules.** A rule that would go past the cap comes with a merge or a retirement of an existing one in the same approval question, so that rules do not pile up.
- **Dead references are checked at the start of every new feature.** The orchestrator checks that every path named in `LESSONS.md` and the `yaaw-` rule files still exists, and that each rule file's `paths` match a file. A dead one is shown with a suggested fix and changed only on approval. No test file is added to the project, as it would fail other people's builds.

## Delegation research

Checked against the Claude Code docs (sub-agents, agent-teams and costs pages) on 2026-11-19.

- **Subagents** have their own context and return one result to the caller. They can preload skills through the `skills:` frontmatter field, run in a worktree with `isolation: worktree`, nest up to 3 levels deep and be limited to spawning certain agents with `tools: Agent(name, ...)`.
- **Agent teams** are experimental and off by default. Each teammate is a separate Claude Code instance with a shared task list and a mailbox. The docs put the cost at around 7 times a single session in plan mode, and say a single session or subagents do better for sequential tasks, same-file edits and work with many dependencies.
- **Practitioner reports** (vendor blogs, so anecdotal) agree that most multi-agent failures are coordination failures, that gaps in a plan carry downstream, that reviewers should be read-only and independent, and that retry loops need a cap.

yaaw-se uses subagents. Building one feature is mostly sequential and touches shared files, which is where agent teams do worse. Agent teams can be revisited for parallel research once they are no longer experimental.

## Sources of the skills

The skills are customised copies of 3 upstream sets. The hub's own `qd-*` versions were used as the starting point where they exist.

- **mattpocock/skills** (how a feature is planned and built): probe, to-spec, to-tickets, tdd, diagnose, code-review, codebase-design, domain-modeling, research, handoff, writing-for-agents, prototype, improve-codebase-architecture, triage and pr.
- **DietrichGebert/ponytail** (how code is written): ponytail, ponytail-review and ponytail-debt.
- **pbakaus/impeccable** (UI and UX): distilled into `yaaw-design`. See below.

Left out: `ask-matt`, `setup-matt-pocock-skills`, the misc and in-progress skills, and `retro` (its name clashes with yaaw).

### Ponytail and mattpocock clashes

| # | Clash | Fix in yaaw-se |
|---|---|---|
| 1 | Ponytail's SubagentStart hook injects its rules into every subagent, including planners and designers. | No hooks. `yaaw-lean` is preloaded only into `yaaw-dev`. |
| 2 | mattpocock `tdd` confirms seams with the user before any test, which stops a subagent. | The planner settles seams in each ticket. `yaaw-dev` never asks. |
| 3 | `tdd` runs red to green on every slice, while ponytail keeps one small test for non-trivial logic. | One rule: a red test first at each agreed seam, and nothing beyond it. |
| 4 | Ponytail's first rung ("does it need to exist?") and its ultra level push back on scope in the middle of a build. | Scope is cut in planning. `yaaw-dev` builds the ticket and flags doubts in its report. |
| 5 | `to-tickets` forbids file paths, but ponytail's reuse rung needs them. | Each ticket has a "Reuse first" line that names existing modules and dependencies. |
| 6 | `codebase-design` favours deep modules and injected dependencies, while ponytail cuts abstraction nobody asked for. | Both agree that one adapter is a hypothetical seam. A new seam is added only when a ticket names a second adapter. |
| 7 | `ponytail-review` and mattpocock `code-review` overlap. | Merged into `yaaw-review`. |

### yaaw-designer and impeccable

Settled in a probe on 2026-11-19, against impeccable 4.10.0 (commit `b49177d`).

impeccable is 1 skill with around 5,500 lines of reference, 24 interactive commands and a launcher that downloads a binary on first run. `yaaw-design` is a distilled copy: the craft floor, the modes, the Operate rules and the checks from polish and audit, rewritten for a subagent. The commands, the launcher and the detector are left out, as a subagent cannot ask questions and the installer does not install tools. impeccable is Apache-2.0, so its license is kept in the skill folder and the skill names its source.

| # | Clash | Fix in yaaw-se |
|---|---|---|
| 1 | impeccable asks product and look questions before it builds, but `yaaw-designer` cannot ask. | `yaaw-probe` asks the design questions for UI features. The planner writes the answers into each UI ticket's **Design direction**. |
| 2 | impeccable says "finish the job" and commit to the look, while `yaaw-lean` builds the smallest change. | `yaaw-designer` preloads `yaaw-design`, `yaaw-tdd` and `yaaw-diagnose`, not `yaaw-lean`. Behaviour is still built red test first at the ticket's seams. |
| 3 | impeccable verifies with its own screenshot tool. | `yaaw-designer` uses the project's own tools to render the page. A new tool is a new dependency and goes under Flags. |
| 4 | The design floor would only be checked by the agent that wrote the code. | `yaaw-reviewer` preloads `yaaw-design` and checks designer tickets against the craft floor. |

Ponytail's published numbers are its own. An independent JetBrains test measured around 15% less code and 10% less cost, with gains only where there was room to over-build.
