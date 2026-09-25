# YAAW-SE distribution architecture

## Contract

The supported stable distribution entrypoint is:

```bash
npx yaaw-se install
```

YAAW checks package freshness before command dispatch. Stable builds check the npm `latest` dist-tag; prerelease builds check `next`. If the registry reports a newer version, YAAW resolves the tag once and hands the original argv to that exact immutable package version. Stable users are never silently moved to prerelease builds.

If npm is unavailable, times out, returns malformed version metadata, or cannot be launched, the freshness gate fails open and the currently running YAAW continues. The updater writes nothing to command stdout, preserving machine-readable output such as `status --json` and `doctor --json`.

Use `YAAW_DISABLE_AUTO_UPDATE=1` for deterministic exact-version, local-tarball, migration, regression, and CI workflows. Handoff children use an internal `YAAW_UPDATE_HANDOFF` guard to prevent recursion.

A consumer workspace has exactly one YAAW root: `.yaaw-core/`.

```text
.yaaw-core/
├── system/   package-owned, replaceable framework
├── project/  durable semantic project memory
├── runtime/  replaceable coordination state
└── install/  installer metadata
```

### Ownership

- `.yaaw-core/system/` is **PACKAGE_MANAGED** and contains `core/`, `roles/`, `workflows/`, `expertise/`, `rules/`, `registries/`, `schemas/`, `templates/`, and `tools/`.
- `.yaaw-core/project/` is **PROJECT_DURABLE**. Normal install/update/repair/reconfiguration/uninstall must never overwrite or delete accepted project artifacts.
- `.yaaw-core/runtime/` is **RUNTIME_REPLACEABLE** coordination state.
- `.yaaw-core/install/` is **INSTALLER_MANAGED** metadata and never semantic project truth.

Provider folders are adapters only. They may contain thin `SKILL.md` wrappers and small host bootstrap instructions, never a second copy of YAAW workflow semantics. Codex additionally uses project-local `.codex/` runtime configuration, but that surface contains execution mechanics/model settings only; canonical semantics remain under `.yaaw-core/system/`.

## Executable freshness vs project mutation

Package freshness and project mutation are intentionally separate.

The startup freshness gate may replace the executable package used for a command, but it does not modify `.yaaw-core/system/`, provider configuration, manifests, or project memory. Project changes still occur only through explicit installer/configuration operations.

This preserves the rule that a read-only command such as `yaaw status` may use the freshest CLI without secretly rewriting the project.

## Security boundary

The user-selected project path is a hard permanent-write boundary. Every mutation is planned first, checked against the resolved project root and existing-parent realpaths, then executed transactionally. Symlink escapes, traversal, absolute-path injection, and manifest paths outside the project root are rejected.

A second hard boundary protects durable memory: installer-managed write/remove operations targeting `.yaaw-core/project/` are rejected during preflight even if a future planner bug creates such an operation. Only explicit project initialization-if-missing and registered project-schema migrations may create or transform durable state.

## Update model

Quick Update reuses the installed provider/skill configuration and performs this sequence:

```text
read + normalize manifest
        ↓
check package/schema/adapter compatibility
        ↓
build complete update plan
        ↓
preflight path + durable-memory guards
        ↓
stage/apply package-owned system + adapter changes
        ↓
apply declared project migration operations, if any
        ↓
verify installed system and adapters
        ↓
commit manifest last
```

If an operation or verification fails, the transaction restores pre-existing bytes and removes newly created package files.

Quick Update, Modify, and Repair invalidate only replaceable `.yaaw-core/runtime/observed-state.json`, `handoff.json`, and `intent.json` after a package-basis change. Durable project memory is not invalidated.

For tainted managed framework files, `--conflict-policy backup-replace` copies the modified bytes under `.yaaw-core/install/backups/<timestamp>/...` before restoring package-owned bytes.

Shared structured configuration such as `.codex/config.toml` is not whole-file-owned. Manifest v2 tracks `managedConfigKeys` using semantic scalar-value hashes. An inherited setting is omitted and unowned; an already-compatible user-owned value remains user-owned; YAAW-namespaced role entries are owned only when YAAW creates or explicitly replaces them. Uninstall removes only keys whose ownership/hash is still proven.

The updater never performs `rm -rf .yaaw-core`. Old package-owned files are removed only when the prior manifest proves installer ownership.

## Version domains

The manifest tracks these independently:

- `yaawVersion`: npm/YAAW release version.
- `systemSchema`: package-system structural contract.
- `installationSchema`: manifest/control-plane contract.
- `projectSchema`: durable project-memory contract.
- `integrations.<id>.adapterVersion`: provider adapter contract.

Provider configuration freshness is a separate domain again. A newer executable can know about newer Codex capabilities without silently changing a project's selected runtime/model settings.

## Existing v1 installations

The installer accepts `yaaw.installation/v1` manifests from the initial flat package layout. They are normalized in memory, then Quick Update installs the current package under `.yaaw-core/system/`, preserves `.yaaw-core/project/`, removes old flat package-owned directories only when ownership is proven, updates provider adapters, migrates legacy Codex runtime state, and emits the current installation manifest.

## Installer vs Orchestrator authority

The npm CLI owns installation, package updates, adapters, managed-file hashes, schema migration mechanics, repair, and uninstall mechanics.

The YAAW Orchestrator owns project lifecycle reconstruction, routing, recovery, ticket selection, review routing, and semantic continuation.

Neither may take over the other's authority.
