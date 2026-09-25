# YAAW-SE distribution architecture

## Contract

The supported distribution entrypoint is:

```bash
npx yaaw-se install
```

YAAW checks package freshness before command dispatch. Stable package versions check npm `latest`; prerelease package versions check `next`. If a newer version is available, YAAW resolves the tag once and hands the original argv to that exact immutable version.

Registry failure is non-fatal, and the freshness gate writes nothing to stdout so machine-readable output remains valid. Use `YAAW_DISABLE_AUTO_UPDATE=1` for deterministic exact-version and local-tarball workflows. Handoff children use `YAAW_UPDATE_HANDOFF` to prevent recursion.


A consumer workspace has exactly one YAAW root: `.yaaw-core/`. The workspace root is the directory containing that installation; `.yaaw-core/project/` is project memory and is not called the workspace root.

- `.yaaw-core/core|roles|workflows|expertise|rules|registries|schemas|templates|tools` are **PACKAGE_MANAGED**.
- `.yaaw-core/project/` is **PROJECT_DURABLE**. Package install/update/repair must never overwrite existing semantic project artifacts.
- `.yaaw-core/runtime/` is **RUNTIME_REPLACEABLE** coordination state.
- `.yaaw-core/install/` is **INSTALLER_MANAGED** metadata and never semantic project truth.

Provider folders are adapters only. They may contain thin `SKILL.md` wrappers and small host bootstrap instructions, never a second copy of YAAW workflow semantics.

## Security boundary

The user-selected project path is a hard permanent-write boundary. Every mutation is planned first, checked against the resolved project root and existing-parent realpaths, then executed transactionally. Symlink escapes, traversal, absolute-path injection, and manifest paths outside the project root are rejected.

## Installer vs Orchestrator authority

The npm CLI owns installation, package updates, adapters, managed-file hashes, repair, and uninstall mechanics.

The YAAW Orchestrator owns project lifecycle reconstruction, routing, recovery, ticket selection, review routing, and semantic continuation.

Neither may take over the other's authority.

Runtime semantic roles may inspect package health but may not mutate package-managed framework content. Orchestrator runs the installed read-only framework-integrity verifier before project reconciliation/dispatch. A non-`HEALTHY` result is an execution stop, not a ticket transition.

Framework drift and repository drift are different trust failures: repository drift may invalidate acceptance and route to Reviewer; framework drift invalidates the execution engine and requires installer repair.

## Executable freshness vs project mutation

Executable freshness is separate from project mutation. A fresher CLI may execute a command, but the startup gate does not rewrite `.yaaw-core/`, provider adapters, manifests, or durable project memory.

## Update invariant

`.yaaw-core/project/` is project data. Update, repair, reconfiguration, and uninstall code must never blanket-delete `.yaaw-core/`.

Package updates operate only on enumerated managed files/directories. The manifest is committed last.

For a tainted managed installation, `--conflict-policy backup-replace` first stores modified managed bytes beneath `.yaaw-core/install/backups/<timestamp>/`, then restores package files transactionally. Update/modify/repair invalidate replaceable runtime coordination caches after the package basis changes. Durable `.yaaw-core/project/**` artifacts are preserved.

Manifest-owned legacy `.yaaw-core/system/**` package files can be migrated by normal update/repair ownership logic. Modified legacy managed files require an explicit conflict policy such as `backup-replace`. Unmanaged/ownership-ambiguous legacy framework content fails closed instead of being deleted.

## Root instruction files

`AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` use a managed section delimited by `<!-- yaaw-se:begin -->` and `<!-- yaaw-se:end -->`. Bytes outside the managed section are preserved as far as practical. Cline uses the fully namespaced `.cline/rules/yaaw-se.md`.

The repository-development `AGENTS.md` is never copied into consumer projects.

## Runtime repository boundary

Provider process CWD is not authoritative. YAAW resolves the consumer workspace and scopes repository commands with `git -C <WORKSPACE_ROOT>`. In monorepos, identity/diffs are scoped to the YAAW workspace so unrelated siblings do not automatically invalidate review. Repository capability is separate from installer health: an installation may be healthy while the workspace is intentionally `UNVERSIONED`; implementation/review still require exact `READY` identity.
