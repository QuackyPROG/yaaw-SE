---
schema: yaaw.product/v1
revision: 4
status: ready
---
# Product

## Goal
Support workspaces with clear ownership semantics.

## Target users
Workspace creators and members.

## User problems
Users need predictable responsibility for workspace-level administration.

## Expected behavior
A workspace always has one active owner in V1.

## Important flows
Create workspace, transfer ownership, manage members.

## Constraints
Ownership transfer cannot leave a workspace ownerless.

## Scope
Singular workspace ownership in V1.

## Non-goals
Shared/co-ownership is not part of the accepted V1 collaboration scope.

## Accepted product decisions
### Ownership
Decision: Each workspace has exactly one active owner in V1.
Reason: Shared ownership is not required by the accepted collaboration scope.
Implication: Ownership transfer must preserve exactly one active owner.
Provenance: Product revision 4 accepted after resolving the material ownership ambiguity.

## Unresolved product questions
None for the current frontier. Shared ownership can be reconsidered only if future product scope requires it.
