# Refine PRD

## Purpose
Improve clarity/completeness without changing accepted product meaning.

## Inputs
Current product artifact, requested clarification/cleanup, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
Consolidate duplicates, sharpen language, organize behavior/non-goals, and surface unresolved questions. Apply assumption challenging only to distinguish wording ambiguity from a genuine semantic contradiction. Preserve semantic meaning and product revision.

If assumption challenging exposes a genuine semantic contradiction or an edit would change accepted behavior, scope, constraints, or non-goals, do not silently resolve it during refinement; stop refinement and execute `prd.revise` instead.

## Output
Clearer product artifact with unchanged semantic revision unless the workflow switches to revision.
