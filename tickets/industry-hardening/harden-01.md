---yaaw-json
{
  "schema": "yaaw.ticket/v1",
  "id": "HARDEN-01",
  "kind": "DELIVERY",
  "status": "DONE",
  "level": 4,
  "parent": "INIT-INDUSTRY-HARDENING",
  "owner": "orchestrator",
  "blocked_by": [],
  "acceptance": [
    "Add typed ticket state, legal transitions, graph/frontier/cycle/deadlock computation and initial controller CLI."
  ],
  "qa": {
    "required": true,
    "profile": "HIGH_ASSURANCE"
  },
  "allowed_write": [
    "scripts/yaaw/**",
    ".agents/schemas/**",
    "tests/harness/**"
  ],
  "forbidden_write": [
    "main branch promotion without final validation"
  ],
  "expected_change_surface": [
    "scripts/yaaw/**",
    ".agents/schemas/**",
    "tests/harness/**"
  ],
  "source_fingerprints": {},
  "risk": [
    "agent-harness-control-plane"
  ],
  "side_effects": [
    "repository"
  ]
}
---
# HARDEN-01: Structured workflow state engine

## What to deliver

Add typed ticket state, legal transitions, graph/frontier/cycle/deadlock computation and initial controller CLI.

## Acceptance criteria

- [x] Add typed ticket state, legal transitions, graph/frontier/cycle/deadlock computation and initial controller CLI.
- [x] The coherent change is recorded as `cf0ed7207c956ef200957760b3af5f3fa54e1109`.

## Preservation invariants

- Core yaaw-SE authority boundaries remain intact.
- Completed history is not rewritten.

## Allowed write scope

- `scripts/yaaw/**`
- `.agents/schemas/**`
- `tests/harness/**`

## Forbidden write scope

- `main` promotion until the complete hardening initiative passes final validation.

## Expected change surface

- `scripts/yaaw/**`
- `.agents/schemas/**`
- `tests/harness/**`

## Canonical sources

- Initiative: `docs/initiatives/industry-hardening/map.md`
- Commit evidence: `cf0ed7207c956ef200957760b3af5f3fa54e1109`

## Verification

- GitHub Agent Harness CI associated with this phase or its corrective successor.
- Targeted harness unit/semantic checks appropriate to the phase.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- A new control-plane boundary, authority model, or incompatible source invalidates the bounded phase.
- A failed semantic invariant requires corrective work rather than weakening the validator.

## Implementation evidence

- commit/ref: `cf0ed7207c956ef200957760b3af5f3fa54e1109`
- outcome: Add typed ticket state, legal transitions, graph/frontier/cycle/deadlock computation and initial controller CLI.
- source of truth: repository diff and CI history.

## QA result

- result: `PASS` or subsequently corrected by an explicit follow-up ticket.
- residual risk: later phases may strengthen the same subsystem without rewriting this historical completion.

## Delivery

- commit/ref: `cf0ed7207c956ef200957760b3af5f3fa54e1109`
- stage: `COMMITTED`
- branch: `feat/industry-hardening`
