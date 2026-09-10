# Record engineering decisions

## Purpose
Convert accepted engineering answers into durable, independently resumable decisions.

## Inputs
Exact handoff, current product/engineering revisions, latest accepted engineering answers, and the current repository evidence/provenance referenced by those answers.

## Procedure
1. Create/update `ENG-NNN` entries with Status, Decision, Reason, material rejected alternatives, implications, and product/repository provenance.
2. Increment engineering revision for material contract changes.
3. Update unresolved questions, assumptions, risks, current frontier, future fog, and architecture spine.
4. If an existing accepted decision/spec/ticket basis is superseded, apply only Planner-owned semantic invalidation allowed by the handoff to engineering/spec contract artifacts and return any ticket lifecycle invalidation requirement to Orchestrator; never mutate `.yaaw/state.json`, runtime routing state, reviews, evidence, or application files.
5. Record durable decisions before another question round.

## Output
Updated Planner-owned engineering/spec contract artifacts with stable decision IDs and provenance, plus any lifecycle invalidation request for Orchestrator.
