# State transition contract

State names are not enough; only the transitions below are legal unless an explicit recovery rule documents a narrower evidence-backed exception.

The machine-readable transition table used by conformance tests lives in `.yaaw-core/registries/transitions.json`. This document is the human-readable explanation. In the table, **Owner/workflow means semantic outcome owner**: the role whose durable result/evidence justifies that edge. **Orchestrator persists every ticket lifecycle transition** and writes transition provenance to `.yaaw/state.json`; semantic roles do not write lifecycle state unless an explicit write contract says otherwise.

A role may detect/report a condition that belongs to a different semantic owner. Example: Implementer may report that a repair requires replanning, but Planner owns the revised contract/replan outcome and Orchestrator persists the lifecycle edge.

## Ticket transitions
| From | To | Owner/workflow | Required basis |
|---|---|---|---|
| DRAFT | READY | Planner | current spec/frontier valid; dependencies satisfied |
| DRAFT | CANCELLED | Planner | current product/planning authority removes scope; human request may trigger |
| READY | IN_PROGRESS | Implementer | ticket selected; source revisions still current |
| READY | REPLAN_REQUIRED | Planner | source invalidation or contradictory evidence requires contract reconsideration |
| IN_PROGRESS | REVIEW_REQUIRED | Implementer | implementation exists; required verification evidence recorded |
| IN_PROGRESS | REPLAN_REQUIRED | Planner | material contract gap confirmed for replanning; another role may have reported the trigger |
| IN_PROGRESS | BLOCKED | Implementer | required external evidence/permission unavailable during execution |
| REVIEW_REQUIRED | PASS | Reviewer | fresh PASS review tied to current repository/ticket/spec revisions |
| REVIEW_REQUIRED | REPAIR_REQUIRED | Reviewer | implementation defect; contract remains valid |
| REVIEW_REQUIRED | REPLAN_REQUIRED | Reviewer | review establishes contract/architecture invalid or insufficient |
| REVIEW_REQUIRED | BLOCKED | Reviewer | required review evidence unavailable |
| REPAIR_REQUIRED | REVIEW_REQUIRED | Implementer | required repair applied and reverified |
| REPAIR_REQUIRED | REPLAN_REQUIRED | Planner | repair evidence shows accepted contract must change; Implementer may report trigger |
| REPLAN_REQUIRED | DRAFT | Planner | contract revised but not yet re-admitted |
| REPLAN_REQUIRED | READY | Planner | revised contract passes readiness and dependencies |
| PASS | REPLAN_REQUIRED | Planner | upstream revision invalidates current acceptance |
| PASS | CANCELLED | Planner | accepted scope explicitly removed by current product/planning authority; history preserved |

`BLOCKED` recovery may restore only one of `DRAFT`, `READY`, `IN_PROGRESS`, `REVIEW_REQUIRED`, `REPAIR_REQUIRED`, or `REPLAN_REQUIRED`, and only when current evidence proves the prior valid boundary and its semantic owner still supports that boundary. Orchestrator persists the restored lifecycle state.

Forbidden examples: `DRAFT -> PASS`, `READY -> PASS`, `REPAIR_REQUIRED -> PASS`, or Implementer-authored `PASS`.

## Project transitions
Normal phase order is `product -> planning -> implementation -> complete`. `blocked` may be entered from any phase and exited only when its blocker is resolved. A new accepted product revision may move `complete` back to `product` or `planning`; historical completion evidence remains immutable.

Every ticket transition persisted by Orchestrator increments `transition_sequence` and writes `last_transition` in `.yaaw/state.json`.
