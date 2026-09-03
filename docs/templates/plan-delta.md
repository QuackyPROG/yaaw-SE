---yaaw-json
{
  "schema": "yaaw.plan-delta/v1",
  "id": "DELTA-<timestamp>-<slug>",
  "initiative": "INIT-<slug>",
  "triggering_work": "<ticket-id>",
  "date": "YYYY-MM-DD",
  "action": "CONTINUE",
  "human_authority_required": false
}
---
# PLAN_DELTA: <short title>

## Trigger evidence

Exact new evidence and provenance.

## Prior assumption

What was previously believed/accepted and why was it reasonable then?

## Delta decision

The machine `action` field is authoritative and must be one registered PLAN_DELTA action.

## Graph changes

- create:
- supersede/cancel:
- block/unblock/resequence:
- new frontier:

## Completed work impact

`NONE` or link corrective/reversal work. Never rewrite completion history.

## Verification / QA changes

- ...

## Human authority required

If metadata sets this to `true`, name the exact decision/approval still blocking dependent work.
