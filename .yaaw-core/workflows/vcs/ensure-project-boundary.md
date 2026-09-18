# Ensure project VCS boundary

## Purpose

Activate and verify project-only VCS isolation before any YAAW-controlled application publication operation.

## Inputs

- `.yaaw/install.json`
- `.yaaw/vcs.json`
- canonical artifact registry
- canonical VCS policy registry
- current Git common directory and local Git configuration

## Process

1. Require the project marker before enforcing project policy.
2. Classify canonical/shared paths and fail on ownership collisions.
3. Verify `.gitignore` was not changed by YAAW.
4. Ensure the managed `info/exclude` block is present through the Git common directory.
5. Verify local guards and hook chaining are healthy.
6. Detect tracked/local-history/remote-history contamination and fail closed.
7. Record observed VCS facts without changing semantic ticket state.

## Results

Return `BOUNDARY_READY` or a typed operational blocker such as `PATH_OWNERSHIP_CONFLICT`, `TRACKED_YAAW_ARTIFACT`, `LOCAL_HISTORY_CONTAMINATION`, `REMOTE_HISTORY_CONTAMINATION`, or `HOOK_INSTALL_CONFLICT`.
