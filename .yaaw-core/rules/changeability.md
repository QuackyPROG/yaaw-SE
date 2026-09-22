# Changeability policy

The governing principle is: **make the next correct change easier without expanding the current authorized change.**

This policy is mandatory for Planner, Implementer, and Reviewer whenever software design or code is being shaped. It governs the quality of work already authorized by product/spec/ticket contracts; it never authorizes unrelated cleanup or speculative refactoring.

## 1. Keep the main path visible
Prefer control flow where the primary successful operation is easy to identify. Use guard clauses, extraction, or other simplifications when they reduce unnecessary nesting or branching. Do not flatten structure mechanically when nesting communicates real domain structure.

## 2. Name by domain meaning
Prefer names that expose business/domain meaning over generic containers such as `data`, `item`, `result`, or `obj` when a more specific concept is known. Names should reduce lookup/detective work without becoming needlessly verbose.

## 3. Contain external systems behind boundaries
Provider-specific schemas, field names, SDK types, transport details, and failure semantics should remain at the integration boundary unless the accepted architecture explicitly requires otherwise. Translate external representations into application/domain concepts at a narrow boundary so provider changes do not ripple through unrelated code.

## 4. Make invalid states harder to represent
When the domain distinguishes materially different valid states, prefer types, constructors, schemas, invariants, or validation boundaries that make impossible/invalid combinations difficult to create. Do not create type complexity unless it removes meaningful runtime uncertainty.

## 5. Separate decisions from actions
Keep important business decisions independently understandable and testable when practical. Separate policy/decision logic from database, network, filesystem, notification, or other side effects so rules can be verified without triggering the actions they control.

## 6. Make failures useful
Errors should provide useful human meaning plus stable machine-readable identity when the surrounding contract supports it. Preserve diagnostic context needed to investigate failures, but never log or expose passwords, authentication/session tokens, API keys, credentials, or sensitive payloads that are not explicitly safe to record.

## 7. Keep changes focused
A ticket should produce one coherent, reviewable change. A maintainability issue discovered during implementation does not automatically enter scope. Make a supporting change only when it is necessary to satisfy the admitted ticket safely; otherwise leave it unchanged and surface it as a future planning/refactoring candidate when materially valuable.

## Applicability
Not every principle produces a required code change on every ticket. Apply only the principles relevant to the changed surface and accepted architecture. `NOT_APPLICABLE` is a valid assessment when a principle has no meaningful bearing on the change.

## Review threshold
A preference is not a defect. A changeability finding is blocking only when concrete evidence shows one of the following:
- the current implementation violates an accepted engineering/architecture constraint;
- the design materially increases coupling, ambiguity, invalid-state risk, side-effect entanglement, failure opacity, or review/recovery risk in the changed surface;
- the change includes unrelated scope that weakens reviewability or rollback safety;
- the violation prevents adequate testing or makes the ticket contract materially harder to verify.

Review findings must cite the principle, concrete location/evidence, expected property, actual implementation, and required repair or replan action.
