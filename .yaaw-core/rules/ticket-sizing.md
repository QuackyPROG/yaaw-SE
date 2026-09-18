# Ticket sizing

A ticket is correctly sized when one fresh Implementer can complete one coherent engineering change and verify a concrete outcome without inventing material product or architecture decisions.

Too large: multiple unrelated subsystems, major architecture rediscovery, vague behavior, missing acceptance, or many unverified intermediate states.

Too small: bookkeeping with no coherent independently verifiable outcome.

A ticket cannot be `READY` unless its source spec/frontier is current and dependency states satisfy admission.


## Tracer-bullet default
A normal feature ticket is a narrow complete tracer bullet: it cuts through the layers needed for one observable behavior, includes its relevant tests/evidence, is independently reviewable/verifiable, and fits one fresh Implementer context. Do not split tests into a separate ticket. Use `prefactor` only for bounded behavior-preserving preparation. Wide refactors use `expand -> migrate batch(es) -> contract`; every migration batch states what is independently verifiable. Dependencies encode true blockers only.
