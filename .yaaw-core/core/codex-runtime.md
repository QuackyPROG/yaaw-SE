# Codex runtime and visible subagent policy

This policy configures the Codex host only. It does not change YAAW semantic authority, artifact ownership, lifecycle, or acceptance rules.

## Default controller

The main Codex session is the YAAW Orchestrator/controller and uses `gpt-5.6-luna`, `max` reasoning, and Fast service. Semantic work is delegated through the custom agents registered in `.codex/config.toml`.

## Mandatory subagent load protocol

Every PRD, Planner, Implementer, and Reviewer variant uses the same load sequence regardless of reasoning tier:

```text
read .yaaw/runtime/handoff.json FIRST
→ read AGENTS.md + exact role contract
→ resolve handoff.workflow via .yaaw-core/registries/workflows.json
→ read that exact workflow contract
→ load only handoff-authorized workflow inputs/expertise/repository evidence
→ apply context_policy / optional memory at its allowed phase
→ execute
→ return durable output + typed result to Orchestrator
```

A subagent must never infer a workflow file from its role label. `planner` can execute several different planning workflows; `implementer` can implement or repair; `reviewer` can run review subworkflows. The persisted `handoff.workflow` is the canonical dynamic selector.

If the exact workflow contract or one of its required authoritative inputs cannot be resolved, the subagent returns the appropriate prerequisite/stale-handoff result instead of searching for an alternate YAAW artifact or inventing the missing contract.

## Visible subagents

PRD, Planner, Implementer, and Reviewer are registered as named custom Codex agents. Their descriptions expose role and reasoning tier in the subagent UI. The concrete task passed at spawn must also include the active artifact identity (for example `SPEC-12`, `TASK-31`, or review round) so the UI answers both **who is running** and **what it is doing**.

The normal attempt always uses the base role (`prd`, `planner`, `implementer`, `reviewer`) at Luna High + Fast.

## Escalation ladder

Escalation is Orchestrator-owned and is allowed only when the previous attempt has concrete failure evidence or an unresolved typed result:

1. `ROLE` — Luna High + Fast.
2. `ROLE_xhigh` — Luna XHigh + Fast, receiving the same handoff plus the High failure evidence.
3. `ROLE_max` — Luna Max + Fast, receiving the same handoff plus all prior failure evidence.
4. If Max still cannot satisfy the contract, stop escalating and persist/return the role-appropriate `BLOCKED`, `REPLAN_REQUIRED`, prerequisite, repair, or review outcome.

An escalation is a retry of the **same semantic assignment**. It must preserve role, desired intent, active artifact, ticket/spec revisions, reads, writes, forbidden writes, acceptance criteria, workflow ID, context policy, and repository identity basis unless Orchestrator first performs a normal YAAW re-route because current evidence invalidated them.

Do not escalate merely because an agent expresses uncertainty. Escalate on failed verification, contradictory current evidence, an unresolved typed failure that higher reasoning can plausibly solve, or a reviewer ambiguity that remains after required evidence was inspected.

## No authority leakage

- Reasoning tier is execution policy, not semantic authority.
- Max does not get broader writes than High.
- Retry agents do not create tickets/specs unless the role/workflow already owns that operation.
- Reviewer retries remain independent and cannot use memory or higher reasoning to manufacture `PASS`.
- Orchestrator remains the only role that selects a successor or escalation variant.
- Subagents never spawn peers; Codex `max_depth = 1` reinforces this host-side.
- Project memory remains advisory under `context-policy.json` on every tier.

## Fast service

Every configured controller/subagent tier explicitly sets `service_tier = "fast"`; do not rely on inheritance. This makes Fast intent auditable in each agent file and prevents a future per-agent override from silently dropping the requested service tier.
