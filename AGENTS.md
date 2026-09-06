# YAAW-SE v2 repository instructions

This branch implements the artifact-first YAAW workflow architecture.

## Instruction priority
Explicit user instructions take precedence over YAAW skill guidance unless a higher-priority safety, permission, or host requirement prevents the action. If a YAAW rule causes a pause or deviation, identify the exact file/rule and distinguish a hard requirement from interpretation.

## Non-negotiable architecture
- `skills/` is the public Agent Skills API; every `SKILL.md` requires valid `name`/`description` YAML frontmatter and must stay thin.
- `.yaaw-core/` is the canonical private implementation.
- `docs/` is durable project knowledge in a target project: product intent, engineering understanding/decisions, accepted specs, and promoted project rules.
- `.yaaw/` is autonomous execution state: tickets, reviews, evidence, runtime coordination, and reconstructable `state.json`.
- Folder ownership follows `.yaaw-core/core/folder-ownership.md`; no role silently rewrites another role's semantic artifacts.
- Planner owns ticket contract content; Orchestrator owns ticket lifecycle; Implementer owns execution/evidence; Reviewer owns acceptance/review records.
- Do not reintroduce persistent named-agent personas.
- Roles define authority; workflows define process; expertise provides knowledge only.
- Orchestrator owns routing/reconciliation, never product/architecture/implementation/acceptance semantics.
- Implementer never self-approves. Acceptance requires independent review tied to repository/source identity.
- Conversation must never be the only location of an accepted decision.
- State transitions follow `core/transitions.md`; upstream changes follow `core/invalidation.md`.
- Behavioral oracles/fixtures are conformance infrastructure only. They must never become a second semantic runtime or override canonical workflow authority.

## Change discipline
When changing a skill, update registry/description together rather than copying workflow logic. When changing lifecycle states, routing, review outcomes, artifact metadata, evidence identity, recovery semantics, or folder ownership, update schemas/templates/rules/machine contracts/fixtures/tests together.

Run:
```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```
