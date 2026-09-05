# Review workflow

Review is a fresh, independent judgment of the actual diff and evidence against the admitted contract and relevant higher-level intent.

## Inputs

- actual diff/source fingerprints;
- ticket/ephemeral contract;
- relevant SPEC/PRD constraints;
- implementation evidence;
- ownership/authority/scope policy;
- applicable `_yaaw-core` modules and risk level.

## Outcomes

- `PASS` — implementation satisfies contract with required evidence.
- `REPAIR` — contract/plan is valid but implementation is defective; return findings to the same ticket/Implement loop. Do not create a new planning ticket for ordinary defects.
- `REPLAN` — contract/SPEC/architecture assumption is incomplete, contradictory, unsafe, or materially invalidated; return evidence to Planner and block affected dependent execution.
- `BLOCKED` — correctness cannot be established because required external evidence, authority, dependency, or environment is unavailable.

Review reports findings and classification; it does not redesign architecture or create the solution ticket for a planning failure. Planner owns plan mutation.

L0/L1 may use route-appropriate self/targeted verification. L2/L3 require fresh independent Review by default. L4 requires high-assurance review plus orthogonal executable evidence appropriate to the risk.
