---
schema: yaaw.engineering/v1
revision: 8
status: ready
product_revision: 4
current_frontier: F-007
readiness: PASS
---
# Engineering

## Product interpretation
Implement singular workspace ownership exactly as accepted in product revision 4.

## Existing system
The repository already centralizes workspace membership changes behind a service boundary.

## Engineering constraints
Ownership changes must use the existing membership service boundary and preserve one active owner atomically.

## Decisions
### ENG-007
Status: DECIDED
Decision: Model one active owner per workspace and perform ownership transfer through the existing membership service boundary.
Reason: This directly implements product revision 4 while reusing the repository's established mutation boundary.
Rejected alternatives: Generic multi-owner/RBAC abstraction; direct persistence mutation from handlers.
Implications: Transfer validation must reject states with zero or multiple active owners; tickets should reuse the membership service.
Provenance: Product revision 4 plus repository observation of the existing membership service boundary.

## Assumptions
The existing membership transaction boundary can update old/new owner state atomically; verify during implementation and replan if repository evidence disproves it.

## Unresolved questions
None for F-007.

## Risks
A non-atomic transfer could transiently violate the singular-owner invariant.

## Current decision frontier
F-007 is executable without inventing ownership semantics.

## Future fog
Shared ownership remains future fog unless product scope changes.

## Architecture spine
Ownership transfer -> membership service -> persistence transaction.

## Readiness status
PASS for F-007.
