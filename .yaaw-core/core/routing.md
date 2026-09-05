# Routing contract

Routing chooses one next workflow from observed project reality.

Priority order:

1. Resolve material state inconsistency or blocked recovery.
2. Complete product definition required by accepted scope.
3. Complete current engineering decision frontier.
4. Create missing durable spec for a ready frontier.
5. Create missing tickets for an accepted spec.
6. Review work that exists but lacks fresh acceptance.
7. Repair a ticket with `REPAIR_REQUIRED`.
8. Implement the next dependency-satisfied `READY` ticket.
9. Reassess the next frontier when current tickets pass.
10. Declare `COMPLETE` only when accepted scope and evidence support it.

The orchestrator selects the route; the target role owns all semantic judgments inside that workflow.
