# PRD workflow

`yaaw-prd` is stakeholder-facing product discovery, not technical planning.

## Iterative loop

1. Read the current PRD/source intent and accepted decision log.
2. Rediscover the current document for material gaps: core flows, scope/non-goals, dependencies, lifecycle, ownership/permissions, failure/recovery, contradictions, edge cases, feature add/change/removal impact, security/privacy/abuse/destructive behavior, and useful optional opportunities.
3. Rank unresolved product decisions. Security/privacy/destructive behavior and contradictions outrank convenience details.
4. Ask at most five high-value questions in the compact format:

```text
1. One-line stakeholder question?
A. Choice
B. Choice
C. Choice
Recommended: B
```

The user may answer letters, prose, mixed responses, reject every option, or supply another behavior.
5. Record accepted answers as decision-of-record entries; do not store hidden reasoning.
6. Minimally edit only affected PRD sections while preserving already accepted intent.
7. Re-read the complete updated PRD and rediscover from the new state. Do not paginate a stale initial question list.
8. Repeat until no material unresolved product decision would change scope, user-visible behavior, ownership/permissions, lifecycle/recovery, security/privacy/destructive behavior, dependencies, or downstream engineering direction.

## Change/removal impact

Adding, changing, disabling, or removing a feature triggers dependency rediscovery before finalizing the PRD change. Resolve affected behaviors rather than deleting text and leaving holes.

## Authority

The workflow may recommend safer/better product behavior but may not silently add scope. Accepted product semantics remain HUMAN_PRODUCT_AUTHORITY.
