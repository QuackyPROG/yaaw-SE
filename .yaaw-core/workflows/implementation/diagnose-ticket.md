# Diagnose ticket

## Purpose
Reproduce exactly one `bug_repro` ticket symptom before choosing a fix.

## Inputs
Exact active ticket/spec, reported symptom, planned test seam/oracle, admitted repository surface, project tooling, and evidence write path.

## Procedure
1. Build one tight pass/fail feedback loop targeting the exact reported symptom: automated test, CLI/HTTP request, browser automation, request replay, deterministic harness, or differential comparison.
2. Run it before forming the final fix and confirm it fails for the correct reason.
3. Minimize the reproducer. For difficult bugs, state several falsifiable hypotheses and test one variable at a time.
4. Turn the minimized reproducer into a regression test at the planned seam when possible.
5. If no valid seam exists, use an external objective harness; if architecture must change to make the behavior verifiable, return `REPLAN_REQUIRED`.
6. Persist immutable `kind: diagnosis` evidence with `acceptance_ready: false`.
7. Continue within the same exact Implementer handoff; do not spawn peers.

## Output
Diagnosis evidence plus a bounded reproduction result. Diagnosis evidence never proves review readiness.
