# State transition contract

Only transitions represented by the machine registry are legal.

## Ticket transitions
| From | To | Owner/workflow | Required basis |
|---|---|---|---|
| DRAFT | READY | Planner | current contract admitted |
| READY | IN_PROGRESS | Implementer | ticket selected |
| IN_PROGRESS | REVIEW_REQUIRED | Implementer/recovery | implementation and verification exist |
| REVIEW_REQUIRED | PASS | Reviewer | fresh current acceptance |
| REVIEW_REQUIRED | REPAIR_REQUIRED | Reviewer | bounded implementation defect |
| REVIEW_REQUIRED | REPLAN_REQUIRED | Reviewer | contract is materially invalid or insufficient |
| REPAIR_REQUIRED | REVIEW_REQUIRED | Implementer | repair applied and reverified |
| REPLAN_REQUIRED | DRAFT/READY | Planner | contract revised |
| PASS | REVIEW_REQUIRED | Orchestrator recovery | source contract current but acceptance basis missing/stale/unverifiable |
| PASS | REPLAN_REQUIRED | Orchestrator recovery | upstream source/contract revision invalidates current acceptance |
| PASS | CANCELLED | Human/Planner | accepted scope removed |

Repository identity mismatch alone does not establish `REPLAN_REQUIRED`.

Forbidden examples: `DRAFT -> PASS`, `READY -> PASS`, `REPAIR_REQUIRED -> PASS`, or Implementer-authored `PASS`.

Every transition increments `transition_sequence` and records a stable cause plus evidence. Historical PASS reviews remain immutable even when their authority becomes stale.
