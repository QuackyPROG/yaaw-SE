# Invalidation propagation

Accepted artifacts are historical records, not eternally valid truth. When an upstream basis changes, preserve history and invalidate downstream trust explicitly.

## Product revision change
1. Increment `product.md` revision and record the changed requirement.
2. Identify `ENG-*` decisions whose product provenance depends on the changed requirement.
3. Mark affected decisions superseded/invalidated in `engineering.md`; move planning readiness to unresolved.
4. Mark dependent specs `STALE` rather than rewriting them in place.
5. Move dependent tickets, including prior `PASS` tickets when behavior is affected, to `REPLAN_REQUIRED` using the transition contract.
6. Prior reviews remain immutable historical evidence but no longer establish current acceptance.

## Engineering decision change
Apply the same propagation from affected `ENG-*` decisions -> specs -> tickets -> reviews.

## Repository drift
A review becomes stale when the reviewed repository identity no longer matches the relevant implementation state. Route to review if the contract remains valid; route to replan when drift invalidates the contract.

## No silent cascade
Every invalidated artifact records why it became stale and which upstream revision/decision caused it. Never delete prior decisions/specs/reviews merely to make current state look clean.
