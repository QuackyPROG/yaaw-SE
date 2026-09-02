---
name: bug-diagnosis
description: Diagnose difficult bugs and regressions by building a reproducing feedback loop, minimizing the failure, testing hypotheses, instrumenting evidence, fixing the cause and protecting it with regression verification.
---

# Bug Diagnosis

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.bug-diagnosis`.

- Read: bug report/ticket, reproduction seam, relevant code/tests/runtime evidence.
- Produce: `DISCOVERY_EVIDENCE`.
- Primary evidence destination is the current DISCOVERY ticket; use only the registered overflow locator for large evidence and link it back.
- This skill does not authorize product-code mutation; implementation occurs through the bounded implementation route.

## Loop

1. Parse reported and expected behavior.
2. Find the highest practical observable seam.
3. Reproduce; if reproduction fails, record exact conditions.
4. Minimize the failing case.
5. List concrete hypotheses.
6. Gather discriminating evidence with minimal instrumentation.
7. Identify the smallest causal fix compatible with the contract.
8. If cause changes owner/scope/architecture, `STOP_AND_REPLAN`.
9. Implement through the bounded implementation route.
10. Add/regenerate a regression check that would fail on the original defect when feasible.

Avoid shotgun edits, speculative cleanup, and tests that only encode implementation details.
