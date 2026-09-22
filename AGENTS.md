# YAAW-SE v2 repository instructions

This branch implements the artifact-first YAAW workflow architecture plus its project-local npm distribution layer.

## Instruction priority

Explicit user instructions take precedence over YAAW skill guidance unless a higher-priority safety, permission, or host requirement prevents the action. If a YAAW rule causes a pause or deviation, identify the exact file/rule and distinguish a hard requirement from interpretation.

## Non-negotiable architecture

- `skills/` is the canonical public Agent Skills authoring API; every `SKILL.md` stays thin.
- `.yaaw-core/` is the canonical semantic implementation.
- Consumer durable memory lives only in `.yaaw-core/project/`.
- Replaceable coordination state lives only in `.yaaw-core/runtime/`.
- Installer metadata lives only in `.yaaw-core/install/`.
- Do not reintroduce a second project root for YAAW state.
- Provider folders such as `.agents/`, `.claude/`, `.gemini/`, and `.cline/` are generated discovery adapters only. They must not contain canonical workflow logic.
- Do not copy this repository-development `AGENTS.md` into consumer projects. Use `installer/templates/bootstrap/`.
- Roles define authority; workflows define process; shared rules/expertise provide reusable reasoning only.
- Orchestrator owns routing/reconciliation, never product/architecture/implementation/acceptance semantics.
- Implementer never self-approves. Acceptance requires independent review tied to repository/source identity.
- Conversation must never be the only location of an accepted decision.
- State transitions follow `core/transitions.md`; upstream changes follow `core/invalidation.md`.

## Distribution invariants

- The supported entrypoint is `npx yaaw-se install`.
- The user-selected project path is a hard permanent-write boundary.
- Every filesystem mutation is represented in an install plan and boundary-checked before execution.
- `.yaaw-core/project/` is project-owned data and must never be blanket-deleted or overwritten during update, repair, reconfiguration, or ordinary uninstall.
- Package-owned files and managed instruction sections are hash-tracked.
- Verification happens before the installation manifest is committed.
- The installer owns distribution mechanics only; it must never make semantic project-lifecycle decisions.
- `package-lock.json` is committed release metadata; keep it synchronized with `package.json` and use `npm ci` in validation.
- npm publishing is manual for the first release.

## Change discipline

When changing a skill, update registry/description together rather than copying workflow logic. When changing lifecycle states, routing, review outcomes, artifact metadata, evidence identity, recovery semantics, or installation ownership, update schemas/templates/rules/machine contracts/fixtures/tests together.

When changing cross-role decision interaction behavior, update the canonical shared reasoning rule and every declared consumer together. Do not duplicate the complete shared rule into role/workflow files.

Run:

```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python scripts/validate_distribution.py
python -m unittest discover -s tests -v
npm ci
npm test
npm run build
```
