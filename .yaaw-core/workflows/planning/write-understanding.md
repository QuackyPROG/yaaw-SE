# Write engineering understanding

## Purpose
Create the durable checkpoint from which a fresh Planner can continue.

## Inputs
Product interpretation, discovery observations, and `.yaaw-core/rules/assumption-challenge.md` results.

## Procedure
Update `.yaaw/engineering.md` using existing semantic sections rather than adding a challenge log:
- repository observations -> Existing system;
- unsupported beliefs -> Assumptions;
- actual unresolved decisions -> Unresolved questions / Current decision frontier;
- future-dependent issues -> Future fog;
- material dangers -> Risks;
- accepted engineering solutions -> `ENG-*` decisions;
- compatibility-critical structure -> Architecture spine.

Also preserve product interpretation and engineering constraints. Never store challenge/debate transcripts.

Increment engineering revision when the durable engineering contract/understanding materially changes. Record provenance for repository observations and product dependencies.

## Output
Updated engineering artifact ready for frontier analysis or questioning.
