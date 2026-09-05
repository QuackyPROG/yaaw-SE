# State transition contract

State names are not enough; only the transitions below are legal unless an explicit recovery rule documents a narrower evidence-backed exception.

## Ticket transitions
| From | To | Owner/workflow | Required basis |
|---|---|---|---|
| DRAFT | READY | Planner | current spec/frontier valid; dependencies satisfied |
| DRAFT | CANCELLED | Planner/Human | scope removed |
| READY | IN_PROGRESS | Implementer | ticket selected; source revisions still current |
| READY | REPLAN_REQUIRED | Orchestrator/Planner | source invalidation or contradictory evidence |
| IN_PROGRESS | REVIEW_REQUIRED | Implementer or recovery | implementation exists; required verification evidence recorded |
| IN_PROGRESS | REPLAN_REQUIRED | Implementer/Reviewer/Orchestrator | material contract gap |
| IN_PROGRESS | BLOCKED | active role | required external evidence/permission unavailable |
| REVIEW_REQUIRED | PASS | Reviewer | fresh PASS review tied to current repository/ticket/spec revisions |
| REVIEW_REQUIRED | REPAIR_REQUIRED | Reviewer | implementation defect; contract remains valid |
| REVIEW_REQUIRED | REPLAN_REQUIRED | Reviewer | contract/architecture invalid or insufficient |
| REVIEW_REQUIRED | BLOCKED | Reviewer | review evidence unavailable |
| REPAIR_REQUIRED | REVIEW_REQUIRED | Implementer | required repair applied and reverified |
| REPAIR_REQUIRED | REPLAN_REQUIRED | Implementer | repair would change accepted contract |
| REPLAN_REQUIRED | DRAFT | Planner | contract revised but not yet re-admitted |
| REPLAN_REQUIRED | READY | Planner | revised contract passes readiness and dependencies |
| BLOCKED | DRAFT/READY/IN_PROGRESS/REVIEW_REQUIRED/REPAIR_REQUIRED/REPLAN_REQUIRED | owning role | blocker resolved and prior valid boundary proven |
| PASS | REPLAN_REQUIRED | Orchestrator/Planner | upstream revision invalidates current acceptance |
| PASS | CANCELLED | Human/Planner | accepted scope explicitly removed; history preserved |

Forbidden examples: `DRAFT -> PASS`, `READY -> PASS`, `REPAIR_REQUIRED -> PASS`, or Implementer-authored `PASS`.

## Project transitions
Normal phase order is `product -> planning -> implementation -> complete`. `blocked` may be entered from any phase and exited only when its blocker is resolved. A new accepted product revision may move `complete` back to `product` or `planning`; historical completion evidence remains immutable.

Every transition increments `transition_sequence` and writes `last_transition` in `.yaaw/state.json`.
