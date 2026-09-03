---yaaw-json
{
  "schema": "yaaw.initiative-map/v1",
  "id": "INIT-<slug>",
  "level": 3,
  "status": "ACTIVE",
  "spec_ref": null,
  "prd_ref": null,
  "revision": 1
}
---
# <Initiative name>

## Destination

One or two lines describing the boundary that means this initiative is complete.

## Constraints / standing notes

- ...

## Decisions so far

- [<decision ticket/ADR>]: one-line gist; detail lives at the link.

## Current frontier

List/link only controller-computed READY work; ticket state remains authoritative.

## Not yet specified / fog

In-scope future territory that cannot yet be phrased precisely enough to ticket. Do not invent detail.

## Out of scope

Work deliberately beyond this destination.

## Integration / QA strategy

- isolation needs:
- required gates:
- rollback/compatibility:
- post-integration QA when required:

## Recovery / resumption

Record the durable state needed for a fresh Orchestrator to resume after interruption; never rely on chat history.
