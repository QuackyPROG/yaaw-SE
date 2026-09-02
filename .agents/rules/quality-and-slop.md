# Quality and Slop

Reject changes that satisfy the surface request by degrading the system underneath.

Watch for speculative abstractions, unrelated refactors, duplicated logic, fake/mocked tests that cannot fail on the real bug, swallowed errors, dead compatibility paths, unbounded TODOs, inconsistent terminology, and comments/docs that claim behavior the code does not have.

Prefer deep modules with small stable interfaces, externally meaningful verification seams, explicit invariants, and the simplest design that fits current accepted requirements.

Do not broaden work merely to make code aesthetically ideal.
