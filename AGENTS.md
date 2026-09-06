# YAAW-SE v2 repository instructions

This branch implements the artifact-first YAAW workflow architecture.

## Instruction priority
Explicit user instructions take precedence over YAAW skill guidance unless a higher-priority safety, permission, or host requirement prevents the action. If a YAAW rule causes a pause or deviation, identify the exact file/rule and distinguish a hard requirement from interpretation.

## Non-negotiable architecture
- `skills/` is the public Agent Skills API; every public skill expresses a `desired_intent` and enters through `orchestration.route`.
- `.yaaw-core/` is the canonical private implementation.
- `docs/` is durable project knowledge; `.yaaw/` is autonomous execution state.
- Canonical paths come from `.yaaw-core/registries/artifacts.json`; roles must not invent alternate artifact locations.
- Default role read/write authority comes from `.yaaw-core/registries/role-io.json`; every semantic dispatch receives exact `reads`, `writes`, and `forbidden_writes` in `.yaaw/runtime/handoff.json`.
- Roles never spawn peer roles. Roles produce durable output + typed results; Orchestrator alone chooses the next role/workflow.
- Planner owns ticket contract content; Orchestrator owns ticket lifecycle; Implementer owns execution/evidence; Reviewer owns acceptance/review records.
- Implementer must not run without one exact admitted ticket and current source spec. No ticket/spec is a prerequisite-routing condition, never permission to invent work.
- Orchestrator owns routing/reconciliation/lifecycle persistence, never product/architecture/implementation/acceptance semantics.
- Implementer never self-approves. Acceptance requires independent review tied to repository/source identity.
- Conversation must never be the only location of an accepted decision.
- State transitions follow `core/transitions.md` / `registries/transitions.json`; upstream changes follow `core/invalidation.md`.
- Do not reintroduce persistent named-agent personas.

## Change discipline
When changing skills, routing, role authority, artifact paths, handoff fields, lifecycle states, review outcomes, evidence identity, recovery semantics, or folder ownership, update machine registries/schemas/templates/fixtures/tests together.

Run:
```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```
