# YAAW-SE distribution architecture

## Contract

The supported distribution entrypoint is:

```bash
npx yaaw-se install
```

A consumer project has exactly one YAAW root: `.yaaw-core/`.

- `.yaaw-core/core|roles|workflows|expertise|rules|registries|schemas|templates` are **PACKAGE_MANAGED**.
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

## Update invariant

`.yaaw-core/project/` is project data. Update, repair, reconfiguration, and uninstall code must never blanket-delete `.yaaw-core/`.

Package updates operate only on enumerated managed files/directories. The manifest is committed last.

## Root instruction files

`AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` use a managed section delimited by `<!-- yaaw-se:begin -->` and `<!-- yaaw-se:end -->`. Bytes outside the managed section are preserved as far as practical. Cline uses the fully namespaced `.cline/rules/yaaw-se.md`.

The repository-development `AGENTS.md` is never copied into consumer projects.
