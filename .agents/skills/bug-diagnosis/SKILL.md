---
name: bug-diagnosis
description: Diagnose difficult bugs and regressions by building a reproducing feedback loop, minimizing the failure, testing hypotheses, instrumenting evidence, fixing the cause and protecting it with regression verification.
---

# Bug Diagnosis

## Loop

1. Parse the reported behavior and expected behavior.
2. Find the highest practical seam where the failure can be observed.
3. Reproduce. If reproduction fails, record exact environment/conditions rather than asserting the report is false.
4. Minimize the failing case.
5. List plausible hypotheses tied to concrete code/runtime behavior.
6. Gather evidence that discriminates among hypotheses; instrument only as much as needed.
7. Identify the smallest causal fix compatible with the contract.
8. Before implementation, check whether the discovered cause changes owner/scope/architecture. If so, `STOP_AND_REPLAN`.
9. Implement through the bounded implementation route.
10. Add/regenerate a regression check that would fail on the original defect when feasible.

Avoid shotgun edits, speculative cleanup, and tests that merely encode the implementation instead of the observed failure.
