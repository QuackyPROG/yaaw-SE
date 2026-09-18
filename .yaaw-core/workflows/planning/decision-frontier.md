# Decision frontier

## Purpose
Classify every unresolved planning item so facts, decisions, product gaps, future fog, and out-of-scope work follow the correct authority path.

## Inputs
Current product/engineering state, repository evidence, pending RSH artifacts, and current frontier.

## Classification
Every unresolved item is exactly one of:
- `VERIFIED_REPOSITORY_FACT`: inspect current repository; a reported claim is not a verified fact.
- `EXTERNAL_FACT_REQUIRED`: create `RSH-NNN`, append it to `research_pending`, and return `RESEARCH_REQUIRED`.
- `ENGINEERING_DECISION`: Planner decides routine/reversible tradeoffs; ask the human only when materially consequential.
- `PRODUCT_GAP`: route `HUMAN_INPUT_REQUIRED` through Orchestrator; never convert product ambiguity into engineering authority.
- `FUTURE_FOG`: does not block the current frontier.
- `OUT_OF_SCOPE`: record explicitly and remove from fog.
- `PROTOTYPE_CANDIDATE` may be recorded but prototype execution is deferred.

## Fog test
If the question can be stated precisely now, it belongs in the live frontier or research. If it cannot be stated precisely because another decision must happen first, it belongs in Future Fog.

## Output
Updated planning destination, current frontier, research state, future fog, and out-of-scope boundary.
