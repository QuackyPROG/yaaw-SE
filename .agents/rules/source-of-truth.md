# Source of Truth

yaaw-SE keeps **observed truth** and **intent truth** separate because they answer different questions.

## Observed truth — what is true now

1. runtime/observable evidence when relevant;
2. executable tests/verification;
3. code and current configuration;
4. accepted architecture facts describing the current system;
5. canonical scoped documentation;
6. thread/session context;
7. assumptions.

## Intent truth — what should become true

1. explicit current human decision;
2. accepted relevant PRD;
3. accepted ADR/product decision within its scope;
4. active spec/initiative map;
5. current durable tickets;
6. agent inference.

The stacks do not override each other across categories. If an accepted PRD requires behavior missing from code, code proves the current absence; it does not cancel the requirement.

When same-category sources conflict, inspect the higher-authority source and update stale lower-authority artifacts when the change is in scope. Never make a conflict disappear by choosing whichever source is convenient.

Only explicit human authority may revise accepted PRD intent. Engineering discoveries flow through tickets and PLAN_DELTA unless the desired product outcome itself must change.

`UNKNOWN` is preferable to fabricated certainty.
