# Ticket sizing

A ticket is correctly sized when one fresh Implementer can complete one coherent engineering change and verify a concrete outcome without inventing material product or architecture decisions.

Too large: multiple unrelated subsystems, major architecture rediscovery, vague behavior, missing acceptance, or many unverified intermediate states.

Too small: bookkeeping with no coherent independently verifiable outcome.

A ticket cannot be `READY` unless its source spec/frontier is current and dependency states satisfy admission.
