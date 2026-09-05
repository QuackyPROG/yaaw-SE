# YAAW-SE v2 repository instructions

This branch implements the YAAW artifact-first workflow architecture.

## Non-negotiable architecture

- `skills/` is the public workflow API. Keep skill wrappers thin.
- `.yaaw-core/` is the canonical private implementation.
- `.yaaw/` is project-specific durable state created in a target project, not a second implementation layer.
- Do not reintroduce persistent named-agent personas.
- Roles define authority; workflows define process; expertise modules provide knowledge only.
- Orchestrator owns routing and reconciliation, never product or architecture semantics.
- Implementer never self-approves. Acceptance requires independent review evidence.
- Conversation must never be the only location of an accepted decision.

## Change discipline

When changing a public skill, update the corresponding registry mapping rather than copying workflow logic into the skill. When changing lifecycle states or review outcomes, update schemas, registries, rules, and tests together.

Run `python scripts/validate_core.py` and `python -m unittest discover -s tests` after structural changes.
