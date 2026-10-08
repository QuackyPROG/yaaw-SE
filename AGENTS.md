# YAAW-SE repository instructions

This repository implements the artifact-first YAAW workflow architecture plus its project-local npm distribution layer.

## Instruction priority
Explicit user instructions take precedence over YAAW skill guidance unless a higher-priority safety, permission, or host requirement prevents the action. If a YAAW rule causes a pause or deviation, identify the exact compact-kernel contract and distinguish a hard requirement from interpretation.

## Non-negotiable architecture
- `skills/` is the canonical public Agent Skills authoring API; every `SKILL.md` stays thin.
- `.yaaw-core/` is the single consumer YAAW root.
- `.yaaw-core/system/` is package-owned and compact: `SYSTEM.md`, `kernel.yaml`, `roles/`, `modules/`, `schemas/`, `templates/`, `engine/`.
- `SYSTEM.md` is the human-readable invariant contract; `kernel.yaml` is the machine-readable authority for paths, roles, workflows, handoffs, skills, modules, and lifecycle transitions.
- Consumer durable memory lives only in `.yaaw-core/project/`. There is no durable global `state.json`.
- Ticket lifecycle truth lives in each ticket's frontmatter `status`; runtime observation derives aggregate state from artifacts.
- Replaceable coordination lives only in `.yaaw-core/runtime/`. Deleting the whole runtime directory must not lose semantic truth.
- Installer metadata lives only in `.yaaw-core/install/`.
- Provider folders such as `.agents/`, `.claude/`, `.gemini/`, and `.cline/` are generated discovery/execution adapters only; they contain no canonical semantic logic.
- Do not copy this repository-development `AGENTS.md` into consumer projects. Use `installer/templates/bootstrap/`.
- Roles define authority and contain their operations. Optional modules add expertise only after routing; they grant no authority.
- Resolve the consumer workspace root before repository work and use `.yaaw-core/system/engine/runtime.mjs` as the deterministic orchestration entrypoint.
- Routing is progressive: do not preload unrelated role operations, downstream artifacts, or optional modules before one workflow is selected.
- Orchestrator owns observation/routing/reconciliation, never product, engineering, implementation, research, or acceptance semantics.
- Semantic roles never modify package-managed `.yaaw-core/system/**` to unblock themselves. Integrity failures are fail-closed; only installer update/repair may replace framework content.
- Implementer never self-approves. Acceptance requires independent review tied to exact repository identity, ticket/spec revisions, ticket content basis, and verification evidence.
- Conversation is never the only location of an accepted decision. Store conclusions, not cognition.

## Distribution and update invariants
- Supported entrypoint: `npx yaaw-se install`; users can explicitly request newest with `npx yaaw-se@latest install`.
- The selected project path is a hard permanent-write boundary.
- Every filesystem mutation is represented in an install plan and boundary-checked before execution.
- Installer-managed operations cannot mutate `.yaaw-core/project/**`; only initialization-if-missing or explicit typed project-schema migrations may do so.
- Never blanket-delete `.yaaw-core/`. Package refresh replaces managed `.yaaw-core/system/**` plus enumerated provider adapter files.
- Package-owned files and managed instruction sections are hash-tracked.
- Update/modify/repair invalidates replaceable runtime caches.
- `--conflict-policy backup-replace` is the preferred framework incident-recovery policy.
- Existing installation manifests and project schemas migrate through registered chains; unsupported downgrades are blocked.
- Project schema v3 migrates legacy lifecycle values from `project/state.json` into ticket frontmatter, then removes only that legacy derived ledger.
- Verification happens before the installation manifest is committed; transaction failure restores pre-update bytes.
- The installer owns distribution mechanics only; semantic project decisions remain artifact/role authority.
- `package-lock.json` is committed release metadata; keep it synchronized and validate with `npm ci`.

## Change discipline
When changing lifecycle, routing, handoffs, artifact metadata, evidence/review identity, repository requirements, role I/O, recovery, package layout, schemas, or installation ownership, update `SYSTEM.md`, `kernel.yaml`, relevant role/module/schema/template/engine code, fixtures, and tests together. Do not recreate one-file-per-step registries or duplicate machine truth into prose.

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
