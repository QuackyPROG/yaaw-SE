# ticket-graph (deprecated compatibility shim)

## Status

**DEPRECATED.** Graph construction heuristics were merged into `progressive-planning`; graph validation/frontier computation moved into `scripts/yaaw/graph.py` and `scripts/validate_workflow_state.py`.

Existing callers may invoke this skill only as an alias to `progressive-planning`. Do not maintain separate ticket-graph procedure text here.

## Artifact contract

Resolve `.agents/artifacts.json`. This shim grants no authority beyond the current Planner/progressive-planning contract.
