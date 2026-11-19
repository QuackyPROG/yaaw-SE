---
name: yaaw-se
description: Entry point for the yaaw-se workflow - probe, plan, approve, then build ticket by ticket with yaaw-dev and yaaw-reviewer. Starts a new feature or resumes one.
disable-model-invocation: true
argument-hint: "A feature to start, or a feature slug to resume"
---

# yaaw-se

The main session is the **orchestrator**. It talks to the user, dispatches the subagents and keeps the feature's state. It does not write feature code itself.

Each feature lives in `docs/yaaw-se/<slug>/`:

```
DECISIONS.md   settled decisions from the probe
SPEC.md        written by yaaw-planner
tickets/       one file per ticket, written by yaaw-planner
STATE.md       stage, ticket status and log, kept by the orchestrator
```

## 0. Start or resume

- **A slug was passed and its folder exists**: read `STATE.md` and continue from its stage. When its `format:` line is not `1`, stop and tell the user that this feature was made by another version of yaaw-se.
- **Otherwise**: pick a short kebab-case slug for the feature, create the folder and write `STATE.md`:

```markdown
format: 1
stage: probe
feature: <one line>

## Tickets

## Log
- YYYY-MM-DD HH:MM: started
```

Append one line to the Log at every stage change, every ticket result and every correction from the user.

## 1. Probe

Run `yaaw-probe` in this session. Every question is asked here, as the agents that follow cannot ask the user anything. The stage is done when the user confirms the summary and `DECISIONS.md` is written. Set `stage: plan`.

## 2. Plan

Dispatch `yaaw-planner` with the slug and the path to `DECISIONS.md`. When its report lists open questions, put them to the user in a `yaaw-probe` round, append the answers to `DECISIONS.md` and dispatch the planner again.

The stage is done when `SPEC.md` has no open questions and the tickets are written. Set `stage: approve`.

## 3. Approve

Show the tickets as `NN: title (blocked by …) [agent]` with each ticket's seams. Ask the user to approve or change them. This is the last stop before the build. Once they are approved, list the tickets under `## Tickets` in `STATE.md` as `- [ ] NN: title`, then set `stage: build`.

## 4. Build

Work the **frontier**: the open tickets whose blockers are all done, lowest number first. For each ticket:

1. **Dispatch** the ticket's agent (`yaaw-dev` or `yaaw-designer`) with the ticket path, the spec path and the commit to diff from (`git rev-parse HEAD`). While `yaaw-designer` is not installed, UI tickets go to `yaaw-dev`.
2. **Review.** Dispatch `yaaw-reviewer` with the ticket path and the diff range.
3. **Fix loop.** When the verdict is not `Ship`, send the Must fix and Should fix findings back to the same build agent, then review again. Allow at most 2 fix loops per ticket.
4. **Commit** once the verdict is `Ship`: one commit per ticket with a Conventional Commits subject, such as `feat: <what the ticket delivers>`. Tick the ticket in `STATE.md`.

Stop the build and report to the user when:

- a ticket still fails review after 2 fix loops,
- an agent reports **Blocked**,
- an agent's **Flags** question the ticket's scope or an approved decision.

Otherwise keep going without asking. The stage is done when every ticket is ticked. Set `stage: done`.

## 5. Report

Run the full test suite and show its output. Report each ticket with its commit, the flags the agents raised and anything not checked.
