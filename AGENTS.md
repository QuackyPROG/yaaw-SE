# YAAW-SE repository instructions

This repository implements the artifact-first YAAW workflow architecture plus its project-local npm distribution layer.

## Instruction priority

Explicit user instructions take precedence over YAAW skill guidance unless a higher-priority safety, permission, or host requirement prevents the action. If a YAAW rule causes a pause or deviation, identify the exact file/rule and distinguish a hard requirement from interpretation.

## Non-negotiable architecture

- `skills/` is the canonical public Agent Skills authoring API; every `SKILL.md` stays thin.
- `.yaaw-core/` is the single consumer YAAW root.
- `.yaaw-core/system/` is the canonical package-owned semantic implementation and the only framework subtree that normal updates replace.
- Consumer durable memory lives only in `.yaaw-core/project/`.
- Replaceable coordination state lives only in `.yaaw-core/runtime/`.
- Installer metadata lives only in `.yaaw-core/install/`.
- Do not reintroduce a second project root for YAAW state.
- Provider folders such as `.agents/`, `.claude/`, `.gemini/`, and `.cline/` are generated discovery adapters only. They must not contain canonical workflow logic.
- Do not copy this repository-development `AGENTS.md` into consumer projects. Use `installer/templates/bootstrap/`.
- Roles define authority; workflows define process; shared rules/expertise provide reusable reasoning only.
- Resolve the consumer workspace root before shell/repository work; never assume ambient CWD and use `git -C <WORKSPACE_ROOT>` semantics from `.yaaw-core/system/core/execution-context.md`.
- Workflow routing is progressive: do not preload sibling/downstream workflow bodies, templates, or expertise before exactly one route is selected.
- External/vendor research and host skills require the durable admission basis in `.yaaw-core/system/rules/research-admission.md`.
- Orchestrator owns routing/reconciliation, never product/architecture/implementation/acceptance semantics.
- Consumer semantic roles must never modify package-managed `.yaaw-core/system/**` to unblock themselves. `.yaaw-core/system/core/framework-integrity.md` is fail-closed; only installer update/repair may replace framework content.
- Implementer never self-approves. Acceptance requires independent review tied to repository/source identity.
- Conversation must never be the only location of an accepted decision.
- State transitions follow `.yaaw-core/system/core/transitions.md`; upstream changes follow `.yaaw-core/system/core/invalidation.md`.

## Distribution and update invariants

- The supported entrypoint is `npx yaaw-se install`; users can explicitly request newest with `npx yaaw-se@latest install`.
- The user-selected project path is a hard permanent-write boundary.
- Every filesystem mutation is represented in an install plan and boundary-checked before execution.
- Installer-managed operations are hard-blocked from writing/removing anything under `.yaaw-core/project/`; only project initialization-if-missing or explicit declared project-schema migrations may touch durable state.
- Never blanket-delete or replace `.yaaw-core/`. Package refresh is scoped to `.yaaw-core/system/` and enumerated provider adapter files.
- Package-owned files and managed instruction sections are hash-tracked.
- Update/modify/repair invalidates replaceable runtime coordination caches so no dispatch survives a framework-basis change.
- `--conflict-policy backup-replace` is the preferred incident-recovery policy because it preserves modified managed bytes before restoring the package version.
- Existing `yaaw.installation/v1` manifests are accepted for upgrade; current installs emit `yaaw.installation/v2`.
- System, installation, project, and provider-adapter versions are tracked independently. Unsupported downgrades are blocked.
- Skipped-version project migrations must compose through the registered migration chain and execute as transaction-planned operations.
- Verification happens before the installation manifest is committed; transaction failure restores pre-update bytes.
- The installer owns distribution mechanics only; it must never make semantic project-lifecycle decisions.
- `package-lock.json` is committed release metadata; keep it synchronized with `package.json` and use `npm ci` in validation.

## Change discipline

When changing a skill, update registry/description together rather than copying workflow logic. When changing lifecycle states, routing, review outcomes, artifact metadata, evidence identity, repository requirements, role I/O, recovery semantics, package layout, schema versions, or installation ownership, update schemas/templates/rules/machine contracts/fixtures/tests together.

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
