# Testing expertise

## Behavior over implementation
Tests prove what a caller/user can observe, not incidental implementation mechanics.

## Seam discipline
Use the highest stable seam that proves the behavior without making the test unnecessarily broad or slow. Prefer HTTP/CLI/public module/UI/event/adapter contracts over private helpers unless the helper is itself an explicit module contract.

## Oracle independence
Expected results must come from accepted behavior, worked examples, protocols/specifications, known-good literals/previous versions, invariants/properties, or external reference systems. Never derive the expected answer from the implementation under test or copy its algorithm into the test.

## Sensitivity
For `red_green` and `bug_repro`, preserve evidence that the test/reproducer actually failed before the implementation/fix for the expected behavioral reason.

## Anti-patterns
Reject tautologies, constant-equals-itself checks, copied production algorithms, private-method fixation, mock-only interaction assertions with no behavior proof, weak did-not-throw assertions, blind snapshots regenerated from current output, and tests that pass both before and after the intended behavior change.

## Vertical TDD
For `red_green`: one behavior slice -> one meaningful failing test -> minimum implementation -> pass -> next slice. Do not prebuild an imagined entire test suite.

## Refactor exception
Do not fake RED for behavior-preserving refactors/migrations. Use `characterization` and prove baseline behavior is preserved.
