# Testing module

Use whenever behavior/regression risk requires executable evidence.

Planner: identify the smallest tests that prove acceptance and protect relevant failure/edge cases; distinguish unit, integration, contract, migration, browser/e2e, security, and runtime evidence by risk.

Implement: run the narrowest useful tests during development, then the contract-required verification before handoff.

Review: do not accept claimed evidence without checking what actually ran and whether it observes the risky behavior. L4/high consequence work requires orthogonal evidence where appropriate, not merely more assertions from the same implementation path.
