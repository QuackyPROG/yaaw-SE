---
name: yaaw-se
description: Entry point for the yaaw-se workflow - probe, plan, approve, then build ticket by ticket with yaaw-dev and yaaw-reviewer, and run the full suite once at the end. Starts a new feature or a quick fix, or resumes one.
disable-model-invocation: true
argument-hint: "A feature or fix to start, or a slug to resume"
---

# yaaw-se

The main session is the **orchestrator**. It talks to the user, dispatches the subagents and keeps the feature's state. It does not write feature code itself. The one exception is a prototype in the probe, which is throwaway code.

Each feature lives in `docs/yaaw-se/<slug>/`:

```
DECISIONS.md   settled decisions from the probe (full lane only)
SPEC.md        written by yaaw-planner (full lane only)
tickets/       one file per ticket
IMPROVE.md     architecture candidates from the Improve stage (full lane only)
STATE.md       lane, stage, ticket status and log, kept by the orchestrator
```

The project's checks live in `docs/yaaw-se/CHECKS.md`, and its approved lessons live in `docs/yaaw-se/LESSONS.md`. Both are shared by every feature.

## 0. Start or resume

1. **Checks.** When `docs/yaaw-se/CHECKS.md` is missing, write it before anything else. Find each command yourself in the project's scripts, README and CI config, then show the file to the user and ask them to confirm or correct it.

```markdown
format: 1
fast: <command>          run by the build agent for every ticket: build, type check, lint
test: <command> | none   runs one test file, with {file} for its path; none when tests cannot run locally
full: <command>          the full suite, run once per feature
full runs in: local | ci
ci: <workflow file> | none
```

2. **A slug was passed and its folder exists**: read `STATE.md` and continue from its stage. When its `format:` line is not `1`, stop and tell the user that this feature was made by another version of yaaw-se. A `STATE.md` without a `lane:` line is in the full lane.
3. **Otherwise**: pick the lane, then a short kebab-case slug, create the folder and write `STATE.md`.

- **Quick lane**: a small fix that fits in one ticket and leaves no decision open, such as a bug with a known cause or a copy change. Set `stage: ticket`.
- **Full lane**: everything else. Set `stage: probe`.

When unsure, use the full lane. A quick fix that turns out to need a decision moves to the full lane at the probe: change `lane:` and log it.

```markdown
format: 1
lane: quick | full
stage: ticket | probe
feature: <one line>

## Tickets

## Log
- YYYY-MM-DD HH:MM: started
```

Append one line to the Log at every stage change, every ticket result, every full check and every correction from the user.

## 1. Probe (full lane)

When `docs/yaaw-se/LESSONS.md` exists, read it first, so that the probe does not repeat a past mistake. Run `yaaw-probe` in this session. Every question is asked here, as the agents that follow cannot ask the user anything. The stage is done when the user confirms the summary and `DECISIONS.md` is written. Set `stage: plan`.

**Prototype.** When a decision is about how something feels, such as whether a state model holds up or what a screen should look like, and talking has not settled it after one round, offer a prototype. Build it only when the user says yes.

1. Note the current branch, then create `prototype/<slug>-<question>` from it, where `<question>` is a short kebab-case name for the question. Log `prototype started: <branch>`.
2. Build the prototype in this session with `yaaw-prototype`, and hand it to the user to try.
3. Commit it to the prototype branch, switch back to the noted branch and check that the working tree is clean. Never push the prototype branch.
4. Write the verdict into `DECISIONS.md` with the question it settled and the branch name, and log `prototype verdict: <one line>`. Carry on with the probe.

When a prototype is under way, the Log line `prototype started: <branch>` has no `prototype verdict:` line after it. On resume, switch back to that branch and continue from step 2.

## 2. Plan (full lane)

Dispatch `yaaw-planner` with the slug, the path to `DECISIONS.md` and the path to `LESSONS.md` when it exists. When its report lists open questions, put them to the user in a `yaaw-probe` round, append the answers to `DECISIONS.md` and dispatch the planner again.

The stage is done when `SPEC.md` has no open questions and the tickets are written. Set `stage: approve`.

## 2Q. Ticket (quick lane)

Read the code the fix touches, then write `tickets/01.md` yourself in the `yaaw-to-ticket` format: what changes, the **Seams**, a **Reuse first** line and the acceptance criteria. Set `stage: approve`.

## 3. Approve

Show the tickets as `NN: title (blocked by …) [agent]` with each ticket's seams. Ask the user to approve or change them. This is the last stop before the build.

When `CHECKS.md` says `full runs in: ci`, say in the same question that approving also allows one push of the current branch at the end of the build, to run CI. When the current branch is the repository's default branch, ask for a feature branch name first and create it.

Once they are approved, list the tickets under `## Tickets` in `STATE.md` as `- [ ] NN: title`, add a `base: <sha>` line with the output of `git rev-parse HEAD`, then set `stage: build`.

## 4. Build

Work the **frontier**: the open tickets whose blockers are all done, lowest number first. For each ticket:

1. **Dispatch** the ticket's agent (`yaaw-dev` or `yaaw-designer`) with the ticket path, the spec path (full lane), the path to `CHECKS.md` and the commit to diff from (`git rev-parse HEAD`).
2. **Review.** Dispatch `yaaw-reviewer` with the ticket path and the diff range.
3. **Fix loop.** When the verdict is not `Ship`, send the Must fix and Should fix findings back to the same build agent, then review again. Allow at most 2 fix loops per ticket.
4. **Commit** once the verdict is `Ship`: one commit per ticket with a Conventional Commits subject, such as `feat: <what the ticket delivers>`. Tick the ticket in `STATE.md`.

The build agents run only the fast check and single test files. Nobody runs the full suite or starts CI during the build.

Stop the build and report to the user when:

- a ticket still fails review after 2 fix loops,
- an agent reports **Blocked**,
- an agent's **Flags** question the ticket's scope or an approved decision.

Otherwise keep going without asking. The stage is done when every ticket is ticked. Set `stage: check`.

## 5. Full check

Run the full suite once for the whole feature.

- **local**: run the `full` command.
- **ci**: push the current branch (the push approved in stage 3), then find the run with `gh run list --commit <sha>`, wait for it with `gh run watch <id> --exit-status` in the background, and read failures with `gh run view <id> --log-failed`. When `ci:` names a workflow that only starts by hand, start it with `gh workflow run <file> --ref <branch>`.

Read only the totals and the failures, never the full log.

When it fails, trace each failure to the ticket whose change caused it (`git log` on the failing files and the code they test). Dispatch that ticket's agent with the failure and the instruction to use `yaaw-diagnose`, review the fix as in stage 4, and commit it as `fix: <what broke>`. Then run the full check again. Each new CI run needs no new approval when it is the same branch. Allow at most 2 full check rounds, then stop and report.

The stage is done when the full check passes. Set `stage: improve` in the full lane, or `stage: done` in the quick lane.

## 6. Improve (full lane)

This stage makes the next feature easier. It changes no code, as the full check has already passed.

1. **Architecture.** Dispatch `yaaw-planner` in improve mode with the slug and the commit range `<base>..HEAD`. When `STATE.md` has no `base:` line, use the commits made since the Log's `started` line. The planner writes `IMPROVE.md`.
2. **Lessons.** Read the `STATE.md` Log yourself and look for corrections from the user, tickets that needed fix loops, review findings that came up more than once and full check failures. Draft one lesson for each pattern, as a rule for the next feature with a short reason.
3. **Approve.** Show the `IMPROVE.md` candidates as `NN: title [strength]` and the draft lessons, numbered, in one question. Ask the user which candidates to keep and which lessons to save.
4. **Save.** Append each approved lesson to `docs/yaaw-se/LESSONS.md` as `- <rule>. <reason>. (from <slug>)`. For each approved candidate, create `docs/yaaw-se/<new-slug>/STATE.md` in the full lane at `stage: probe`, with the candidate's title as `feature:` and a Log line that names this feature and `IMPROVE.md`. It is picked up later with `/yaaw-se <new-slug>`.

When the planner finds no candidates and the Log shows no pattern, say so and move on. The stage is done when the approved items are saved. Set `stage: done`.

## 7. Report

Show the full check as its command, totals and any failures. Report each ticket with its commit, the flags the agents raised and anything not checked. In the full lane, list the lessons saved and the new slugs created in the Improve stage. When tests could not run locally (`test: none`), say that each ticket's red and green were proven only by the full check.
