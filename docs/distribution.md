# YAAW-SE distribution architecture

## Contract

The supported distribution entrypoint is:

```bash
npx yaaw-se install
```

YAAW performs an application-level package freshness check before Commander dispatch. Stable builds check the npm `latest` dist-tag; prerelease builds check `next`. When a newer version is available, YAAW resolves the dist-tag once and hands the original argv to that exact immutable version.

If npm is unavailable, times out, returns malformed version metadata, or cannot be launched, the gate fails open and the currently running package continues. The update gate writes nothing to command stdout, preserving machine-readable commands such as `status --json` and `doctor --json`.

For deterministic exact-version, local-tarball, migration, regression, and CI workflows:

```bash
YAAW_DISABLE_AUTO_UPDATE=1 npx yaaw-se@0.3.0 status
```

The handoff child uses the internal `YAAW_UPDATE_HANDOFF` guard to prevent recursive update checks.

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

## Security boundary

The user-selected project path is a hard permanent-write boundary. Every mutation is planned first, checked against the resolved project root and existing-parent realpaths, then executed transactionally. Symlink escapes, traversal, absolute-path injection, and manifest paths outside the project root are rejected.

A second hard boundary protects durable memory: installer-managed write/remove operations targeting `.yaaw-core/project/` are rejected during preflight even if a future planner bug creates such an operation. Only explicit project initialization-if-missing and registered project-schema migrations may create or transform durable state.

## Update model

Executable/package freshness is separate from project mutation. A read-only command may run through a fresher CLI package without rewriting `.yaaw-core/system/`, provider configuration, the manifest, or durable project memory. Project mutation still occurs only through explicit installer/configuration operations.

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

Quick Update, Modify, and Repair invalidate only replaceable `.yaaw-core/runtime/observed-state.json`, `handoff.json`, `intent.json`, and `dispatch-failures.json` after a package-basis change. Durable project memory is not invalidated.

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

A new YAAW package can therefore refresh `.yaaw-core/system/` without migrating project data when `projectSchema` is unchanged.

If the installed project or adapter schema is newer than the running package understands, the update is blocked before mutation. Downgrades are not inferred.

Project migrations are registered as adjacent schema steps and composed for skipped versions. For example, a future project schema `1 -> 4` must have a valid chain such as `1->2`, `2->3`, `3->4`.

## Existing v1 installations

The installer accepts `yaaw.installation/v1` manifests from the initial flat package layout. They are normalized in memory, then Quick Update:

1. installs the current package under `.yaaw-core/system/`;
2. preserves `.yaaw-core/project/`;
3. removes old flat package-owned directories only when their v1 manifest hashes prove ownership;
4. updates provider adapters;
5. upgrades a legacy Codex adapter to v2 using `auto` runtime with all Codex overrides inherited;
6. emits `yaaw.installation/v2`.

No separate `.yaaw/` project root is introduced.

## Root instruction files

`AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` use a managed section delimited by `<!-- yaaw-se:begin -->` and `<!-- yaaw-se:end -->`. Bytes outside the managed section are preserved as far as practical. Cline uses the fully namespaced `.cline/rules/yaaw-se.md`.

The repository-development `AGENTS.md` is never copied into consumer projects.

## Installer vs Orchestrator authority

The npm CLI owns installation, package updates, adapters, managed-file hashes, schema migration mechanics, repair, and uninstall mechanics.

The YAAW Orchestrator owns project lifecycle reconstruction, routing, recovery, ticket selection, review routing, and semantic continuation.

Neither may take over the other's authority.

Semantic roles may inspect package health but may never mutate `.yaaw-core/system/**` to unblock themselves. Orchestrator checks framework integrity before reconciliation and again before dispatch. A non-`HEALTHY` package basis is an execution stop, not a ticket transition.

Framework drift and repository drift are different: repository drift may invalidate acceptance and route to Reviewer; framework drift invalidates the execution engine and requires installer repair.

## Runtime repository boundary

Provider process CWD is not authoritative. YAAW resolves the consumer workspace and scopes repository commands with `git -C <WORKSPACE_ROOT>`. In monorepos, identity/diffs are scoped to the YAAW workspace so unrelated siblings do not automatically invalidate review. Repository capability is separate from installer health.


## Provider configuration revisions

Provider configuration freshness is intentionally separate from package, adapter, installation, system, and project schema versions. A framework update may carry newer provider capability knowledge while preserving the project's chosen runtime/model settings.

Interactive Quick Update records that a displayed capability notice has been seen only when the framework transaction succeeds. Headless updates report pending provider configuration updates without acknowledging them automatically.

Configuration-only changes use `yaaw config [integration]` and do not refresh package-managed system files or unrelated integration surfaces.
