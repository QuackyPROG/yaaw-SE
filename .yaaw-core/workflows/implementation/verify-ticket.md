# Verify ticket

## Purpose
Produce reproducible implementation evidence without self-accepting the ticket.

## Inputs
Exact active ticket requirements/tests, changed surface, project tooling/rules, current repository identity, and the evidence write path supplied by handoff.

## Procedure
1. Run every test/check required by the ticket.
2. Add targeted regression checks justified by the changed surface.
3. Record commands, exit/result, relevant checks, ticket/spec revisions, and exact repository identity in the next immutable `.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json` using the evidence schema.
4. Preserve failed evidence; never overwrite an earlier evidence version as success.
5. Return evidence identity/result to the calling Implementer workflow; do not mutate lifecycle state.

## Output
Immutable evidence record(s). Verification never accepts the ticket; only Reviewer can classify acceptance and only Orchestrator persists lifecycle.

## Final publication-clean verification boundary

Final ticket verification occurs only after every publishable application change for the ticket has been committed through validated checkpoints. YAAW local state may remain mutable. Bind verification evidence to the exact `yaaw.repository-identity/v2` application HEAD and require `dirty_publishable = false` before returning `REVIEW_REQUIRED`.


## Verification-mode requirements
- `red_green`: RED existed and failed for the expected behavior reason; GREEN passed; FINAL required checks pass.
- `bug_repro`: original symptom reproduced; regression signal catches it; GREEN passes after fix; original reproduction no longer reproduces; FINAL suite passes.
- `characterization`: BASELINE intended behavior captured before change; post-change behavior matches; project tooling passes.
- `verification_only`: run the documented objective checks and preserve the reason other modes do not apply.

Reject a missing required phase, a RED/REPRO signal that never actually failed, an oracle derived from the same implementation, or a dirty final publishable identity. Diagnosis/RED/failed evidence always has `acceptance_ready: false`. Top-level repository identity is the final acceptance/recovery identity.
