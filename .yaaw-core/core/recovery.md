# Recovery policy

Recovery compares **claimed state** with **observed reality**.

Evidence hierarchy is domain-specific:

- Product intent: approved `product.md`.
- Engineering decisions: `engineering.md` and accepted specs.
- Implementation reality: repository contents, diff, and git history.
- Acceptance: fresh review evidence tied to the reviewed repository state.
- Routing cache: `state.json`, reconciled against stronger evidence.

Rules:

- Never reimplement solely because state is stale.
- If implementation exists and required verification evidence is present but review is missing, reconcile toward `REVIEW_REQUIRED`.
- If state says `PASS` but implementation or fresh review evidence is absent, flag inconsistency; never preserve PASS blindly.
- If evidence is insufficient to repair state safely, return `BLOCKED` with the missing evidence.
