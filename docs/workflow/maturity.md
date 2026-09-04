# Maturity and guarantees

Current maturity: **Beta / self-hosting control plane**.

yaaw-SE now dogfoods its own ticket graph, schemas, controller gates, CI and failure history. That is meaningful evidence, but it is **not blanket production autonomy** and is not a certification for every repository or industry.

## Machine-enforced

The generic harness has executable coverage for:

- structured artifact schemas/versioning and declared migrations;
- deterministic ticket transitions, blockers, cycles and frontier;
- ownership resolution/conflict detection and artifact field authority;
- scope verification, worktree leases, budgets and idempotent mutations;
- source/evidence freshness and QA/delivery admission;
- prompt-injection trust classification and command/action risk policy;
- capability-aware runtime profiles and fail-closed fallback;
- provider-neutral integration/retrieval contracts;
- stable QA finding/risk identity, artifact indexing and diagnostic metrics;
- adversarial scenarios covering important workflow failure modes.

These guarantees mean the implementation has code/tests for the named invariant. They do not mean every consuming runtime can enforce every OS/provider boundary.

## Agent judgment

LLMs still perform engineering judgment such as:

- interpreting ambiguous requests and observed behavior;
- designing architecture and decomposing meaningful vertical work;
- deciding whether evidence materially invalidates a plan;
- implementing code correctly;
- reviewing semantic correctness beyond mechanical checks;
- identifying sophisticated risks that static policy cannot enumerate.

Fresh QA reduces anchoring; it does not mathematically guarantee defect detection.

## Runtime-dependent

The following depend on the selected runtime/provider/project and must be observed rather than assumed:

- filesystem/tool/network capability isolation;
- access to specific models or distinct QA model families;
- provider credentials and production promotion authority;
- real deployment/provider state;
- project-native build/test/security/observability quality;
- CODEOWNERS/ruleset APIs and external tracker freshness.

If a mandatory runtime capability is unavailable, the correct high-assurance result is BLOCKED/escalation, not a silent downgrade.

## Appropriate use

The harness is suitable for continued dogfooding, supervised real repository work and controlled automation where the consuming domain pack and runtime enforce the required boundaries. High-impact systems—financial transactions, healthcare/safety-critical software, irreversible migrations, production IAM/secrets and similar work—still require project-specific controls and human authority appropriate to the domain.

A stronger maturity label should be earned from broader empirical workload evidence, not added because the prompts sound confident.
