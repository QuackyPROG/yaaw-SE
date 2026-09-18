# Review ticket

## Purpose
Independently determine whether current implementation satisfies the exact current contract with meaningful evidence and acceptable engineering quality.

## Inputs
Exact handoff; one ticket in `REVIEW_REQUIRED`; exact current ticket/spec/product/ENG/rule/RSH revisions; immutable implementation evidence and prior reviews; selected expertise; actual admitted repository diff/state. Learned memory is optional only after all three primary lenses.

## Preconditions
Handoff names exactly one current ticket plus exact source revisions, evidence, and final repository identity.

## Procedure
1. Use a fresh review context when practical.
2. Execute `review.inspect-change` preflight against actual current repository state.
3. Execute `review.inspect-contract`.
4. Execute `review.inspect-test-validity`.
5. Execute `review.inspect-engineering-quality`.
6. Only now may optional learned project memory be consulted for verified historical leads; memory is never acceptance evidence and cannot manufacture `PASS`.
7. Execute `review.classify-findings`.
8. Execute `review.record-review` to write the next immutable review round.
9. Return exactly `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED` to Orchestrator; never mutate ticket lifecycle or dispatch a peer.

## Review immutability
PASS binds to the exact reviewed publishable application identity. Any changed application HEAD requires fresh verification and review.
