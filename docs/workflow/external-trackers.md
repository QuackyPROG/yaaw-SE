# External Tracker Contract

Local Markdown is the reference adapter, not a mandatory UI. An external tracker is valid when the controller can deterministically read/write the same workflow fields.

Required adapter semantics:

- stable yaaw work ID distinct from mutable title;
- kind and legal state;
- blockers by stable ID;
- owner and level/risk;
- observable acceptance and canonical source refs/fingerprints;
- DELIVERY write scope and QA disposition;
- field-level mutation authority;
- event/revision identity sufficient to reject stale updates.

If an external tracker cannot provide one of these fields, store only the missing control metadata in a small repository sidecar keyed by the external item ID. Do not duplicate the full ticket body in two canonical stores.
