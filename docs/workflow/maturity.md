# Maturity and guarantees

Current maturity: **Beta / self-hosting control plane**.

yaaw-SE dogfoods its own ticket graph, schemas, controller gates, runtime-admission code, CI and failure history. That is meaningful engineering evidence, but it is **not blanket production autonomy**, not a certification for every repository or industry, and not proof that a particular model performs well on unrelated production repositories.

## Machine-enforced in the harness

The generic harness has executable coverage for:

- structured artifact schemas/versioning and declared migrations;
- deterministic ticket transitions, blockers, cycles and frontier;
- ownership resolution/conflict detection and artifact field authority;
- ticket-bound mutation scope, worktree leases, budgets and idempotent mutations;
- source/evidence freshness and QA/delivery admission;
- prompt-injection trust classification and command/action risk policy;
- an executable runtime gateway that, when used as the adapter's mutation boundary, derives its scope ceiling from the admitted ticket rather than caller-supplied globs and requires affected paths for filesystem/dependency/artifact/product mutations;
- correlated, redacted gateway/action traces and diagnostic metrics;
- capability-aware runtime profiles and fail-closed fallback;
- provider-neutral runtime invocation plus a registered generic command adapter contract;
- deterministic adversarial scenarios and repeated agent-loop evaluation machinery;
- workload provenance/comparison rules that preserve `NOT_RUN`, `BLOCKED`, `FAILED`, and `OBSERVED` and refuse to classify synthetic or manifest-mismatched results as empirical evidence.

These guarantees mean the implementation has code/tests for the named invariant. They do not mean every consuming runtime can enforce every OS/provider boundary.

## Evidence classes

Do not collapse evaluator correctness into model capability.

- **SIMULATED / UNPROVEN** — deterministic fake adapters and synthetic workloads used by CI. They validate harness/evaluator plumbing only.
- **OBSERVED / UNPROVEN** — an identified runtime may have actually executed, but the workload or immutable provenance is insufficient for an external empirical claim.
- **OBSERVED / EMPIRICAL** — requires a pinned external repository/ref/commit, explicit runtime/provider/model identity, and an agent-eval report whose manifest ID and SHA-256 fingerprint match the workload's expected evaluation configuration.

The repository currently contains **no committed external `EMPIRICAL` workload result**. A green Agent Harness therefore proves repository conformance, not external model success.

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

- whether the host exposes any shell/tool path that bypasses `RuntimeGateway` or an equivalent native enforcement hook;
- binding the authenticated executing agent/role/action identity to the request submitted to the gateway;
- OS/filesystem syscall containment and sandbox isolation beyond declared-path checks;
- network egress enforcement, credential isolation and production-provider permissions;
- access to specific models or distinct QA model families;
- real deployment/provider state;
- project-native build/test/security/observability quality;
- CODEOWNERS/ruleset/branch-protection APIs and external tracker freshness.

If a mandatory runtime capability is unavailable, the correct high-assurance result is BLOCKED/escalation, not a silent downgrade.

## Appropriate use

The harness is suitable for continued dogfooding, supervised real repository work and controlled automation where the consuming domain pack and runtime enforce the required boundaries. High-impact systems—financial transactions, healthcare/safety-critical software, irreversible migrations, production IAM/secrets and similar work—still require project-specific controls and human authority appropriate to the domain.

A stronger maturity label should be earned from broader observed external workload evidence and non-bypassable runtime/provider containment, not added because CI or prompts sound confident.
