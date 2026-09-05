# Implement ticket

1. Select one admitted ticket.
2. Load referenced spec/decisions, relevant product requirements, project rules, selected expertise, and relevant code only.
3. Mark `IN_PROGRESS` with repository-state provenance.
4. Implement strictly within allowed scope.
5. Run `verify-ticket`.
6. Record evidence.
7. Transition to `REVIEW_REQUIRED`.

If a material missing decision is discovered, stop and mark `REPLAN_REQUIRED` or `BLOCKED`; do not invent it.
