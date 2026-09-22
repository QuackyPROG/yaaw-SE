# Changeability expertise

Use this module when a ticket, design, or review has non-trivial maintainability implications. The canonical mandatory policy is `.yaaw-core/rules/changeability.md`; this module provides deeper reasoning and examples, not additional authority.

## Goal
Optimize the changed surface for future comprehension, modification, verification, and rollback while preserving the current product/spec/ticket contract and repository conventions.

## Reasoning sequence
1. Identify the actual domain behavior being changed.
2. Identify the minimum authorized code surface needed to implement it safely.
3. Locate relevant boundaries, state models, decision logic, errors, and tests.
4. Apply only the changeability principles that materially affect that surface.
5. Prefer the smallest design that removes concrete ambiguity/coupling/risk.
6. Verify behavior and the relevant structural property.
7. Leave unrelated cleanup out of scope.

## Principle heuristics

### Visible main path
Ask whether a fresh engineer can identify the success path quickly. Consider guard clauses, decomposition, or clearer branching when exceptional cases bury the operation. Avoid style-only rewrites.

### Domain naming
Ask whether important names expose what the value or operation means in this application. Generic names are acceptable for genuinely generic/local mechanics; they are weak when they hide a known domain concept.

### External boundaries
Look for provider SDK types, remote field names, transport objects, ORM/persistence records, or protocol-specific errors escaping into business code. Prefer adapters/mappers/ports where the accepted architecture benefits from containment.

### Invalid states
Look for broad optional structures, boolean combinations, unchecked sentinel values, or repeated `if value exists` logic that represent domain states poorly. Prefer explicit state variants, constructors, validators, schemas, or invariants when they materially reduce impossible combinations.

### Decisions versus actions
Look for important policy mixed into database/network/email/filesystem operations. Extracting decision logic is valuable when it improves deterministic tests and clarity; do not force a functional style where side effects are the actual domain operation.

### Useful failures
Prefer stable error identity plus human-readable meaning and safe context. Preserve local error conventions. Never improve diagnostics by exposing secrets or sensitive payloads.

### Focused changes
Treat scope control as the limiter on every other principle. A discovered smell is not automatically part of the ticket. Supporting refactors must be necessary for safe implementation or verification of the authorized behavior.

## Common agent failure modes
- mechanically replacing all nesting with guard clauses;
- renaming large surfaces without ticket need;
- creating abstraction layers for hypothetical future providers;
- over-modeling trivial states with excessive types/classes;
- extracting tiny pure functions that make navigation worse without improving tests;
- inventing a new error taxonomy instead of following project conventions;
- converting a feature ticket into a broad refactor because nearby code looks untidy;
- rejecting code based on personal style rather than concrete engineering impact.

## Review guidance
A reviewer should classify a changeability issue as `REPAIR` when the accepted contract remains valid and a bounded implementation correction resolves the problem. Use `REPLAN` only when satisfying the concern requires changing accepted architecture/spec meaning. Non-blocking style preferences should not create a review failure.

## Verification examples
- External boundary: adapter mapping tests prove provider fields do not become application contract fields.
- Invalid states: tests prove invalid combinations cannot be constructed/admitted through the boundary.
- Decision/action separation: pure decision tests exercise policy without invoking side effects.
- Useful errors: tests assert stable error code/shape and safe context.
- Focused changes: diff inspection shows unrelated modules were not rewritten.
