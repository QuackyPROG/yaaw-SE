# Project VCS boundary

## Purpose

Define the single normative publication boundary for YAAW when it is embedded in an application repository.

## Modes

### Framework mode

The YAAW framework repository versions its own source normally. Files such as `.yaaw-core/**`, `skills/**`, `.codex/**`, tests, scripts, `AGENTS.md`, and `WORKFLOW.md` are product source and are publishable.

Project rules MUST NOT activate merely because those paths exist.

### Project mode

Project mode is active only when `.yaaw/install.json` declares:

```json
{"mode":"project","vcs_isolation":"enabled"}
```

In project mode YAAW is a local control plane. Its semantic, planning, execution, review, runtime, memory-control, and installation artifacts are authoritative to YAAW but never application publication content.

## Canonical invariants

1. Artifact ownership and VCS visibility come from `.yaaw-core/registries/artifacts.json`.
2. YAAW control-plane paths additionally come from the project installation manifest; generic paths are never claimed merely by name.
3. YAAW never edits the project repository's `.gitignore`.
4. Local visibility convenience uses the actual Git common directory and `info/exclude`.
5. Exclusion is not the security boundary. Staging is positive, exact-path selection only.
6. `git add .`, `git add -A`, and `git add --all` are prohibited YAAW operations.
7. Topic/worktree branches are local only and have no upstream.
8. Remote publication is allowed only for explicitly configured integration branches, defaulting to `main`.
9. Both the local source branch and remote destination branch must be allowlisted and equal.
10. Commit messages describe application behavior and may not contain YAAW lifecycle identifiers.
11. `--no-verify`, force push, force-with-lease, autonomous tag publication, and autonomous guard bypass are prohibited.
12. Every outgoing commit is scanned for protected paths; deletion in a later commit does not repair contaminated history.
13. Reviewer acceptance binds to publishable application identity, not local YAAW control-plane mutation.
14. Rebase, amend, squash, cherry-pick, or any application-history rewrite after PASS invalidates that acceptance basis.
15. Hindsight or any learned-memory provider is advisory only and cannot change path visibility, branch publication, acceptance, or routing.

## Path ownership and collisions

Shared locations such as `docs/**`, `AGENTS.md`, and `.codex/**` can contain application-owned content. Bootstrap classifies paths before adoption as YAAW-owned, application-owned, or collision/unknown. A pre-existing canonical YAAW document that is not recognizably a YAAW artifact causes `PATH_OWNERSHIP_CONFLICT`; YAAW must not silently make it local-only.

## Operational ownership

VCS is an operational capability, not a sixth semantic authority.

- Implementer determines coherent checkpoint meaning, exact admitted application paths, and application-focused commit summary.
- Orchestrator/deterministic VCS workflow validates the candidate and performs staging, commit, integration, publication audit, and allowlisted push.
- Reviewer owns acceptance of the exact publishable repository identity.
- PRD and Planner have no Git publication authority.

## Failure vocabulary

Operational failures use typed reasons such as:

- `VCS_POLICY_VIOLATION`
- `PATH_OWNERSHIP_CONFLICT`
- `TRACKED_YAAW_ARTIFACT`
- `LOCAL_HISTORY_CONTAMINATION`
- `REMOTE_HISTORY_CONTAMINATION`
- `REMOTE_POLICY_CONFLICT`
- `HOOK_INSTALL_CONFLICT`
- `PUBLICATION_NOT_ALLOWED`

These are orchestration blockers/reasons, never ticket lifecycle states.
