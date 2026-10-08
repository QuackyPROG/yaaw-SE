# Changeability expertise

Use this optional module when a ticket, design, or review has non-trivial maintainability implications. The mandatory policy is summarized in `SYSTEM.md`; this module provides deeper reasoning and examples, not additional authority.

## Goal
Optimize the changed surface for future comprehension, modification, verification, and rollback while preserving the current product/spec/ticket contract and repository conventions.

## Reasoning sequence
1. Identify the actual domain behavior being changed.
2. Identify the minimum authorized code surface needed to implement it safely.
3. Locate relevant boundaries, state models, decision logic, errors, and tests.
4. Apply only principles that materially affect that surface.
5. Prefer the smallest design that removes concrete ambiguity/coupling/risk.
6. Verify behavior and the relevant structural property.
7. Leave unrelated cleanup out of scope.

## Heuristics
- **Visible main path:** use guard clauses/decomposition when exceptional cases bury the operation; avoid mechanical style rewrites.
- **Domain naming:** expose business meaning where known; generic names are fine for genuinely generic mechanics.
- **External boundaries:** keep provider/transport/ORM schemas and failures at narrow adapters when the accepted architecture benefits.
- **Invalid states:** prefer explicit variants/constructors/validators when they remove meaningful runtime uncertainty.
- **Decisions versus actions:** keep important policy independently testable from side effects when practical.
- **Useful failures:** preserve stable machine identity plus safe human context; never expose secrets.
- **Focused changes:** a discovered smell is not automatically ticket scope; supporting refactors must be necessary for safe implementation or verification.

## Review guidance
Classify a concrete bounded changeability defect as REPAIR when the accepted contract remains valid. Use REPLAN only when satisfying it changes accepted architecture/spec meaning. Style preference alone is non-blocking.
