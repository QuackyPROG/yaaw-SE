# Replan

## Purpose
Repair an invalid engineering contract without erasing prior decisions or acceptance history.

## Inputs
Exact handoff; current product/engineering/spec/ticket contract references and revisions; the concrete repository/review/invalidation evidence that triggered replanning; current project rules; and selected expertise. Optional learned memory is allowed only according to the Planner `context_policy` after authoritative inputs are understood.

## Preconditions
Repository evidence, product revision, review finding, or owner-coordinated invalidation has made current planning materially insufficient.

## Procedure
1. Identify exact current evidence and affected `ENG-*`/spec/ticket assumptions.
2. When memory is enabled, retrieve relevant prior rationale, rejected approaches, and earlier attempts before inventing a replacement; treat them as learned historical context and verify any claim that influences the new plan.
3. Mark superseded Planner-owned decisions/spec semantics explicitly; never overwrite their history.
4. Make new engineering decisions within current product authority and increment engineering revision. Memory alone cannot create or reinstate a decision.
5. Apply Planner-owned semantic invalidation to dependent engineering/spec contract artifacts and return ticket lifecycle invalidation/admission requirements to Orchestrator. Do not write `.yaaw/state.json`, runtime state, review/evidence records, or implementation files.
6. Rebuild the current decision frontier and rerun readiness before implementation resumes.
7. Revised ticket contract content must be re-admitted through legal `DRAFT`/`READY` lifecycle transitions persisted by Orchestrator; never jump directly back to PASS.
8. If replanning materially changes the goal, scope, or rationale of an initiative already captured by the active learned-memory provider, best-effort update the same initiative using its stable spec/frontier identity. Do not create a duplicate merely because a replan occurred. Provider failure is non-blocking and cannot affect the authoritative replan result.

## Output
Updated Planner-owned engineering/spec/ticket contract semantics, readiness/admission recommendation, and any lifecycle transition request for Orchestrator.
