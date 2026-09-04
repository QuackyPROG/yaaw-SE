# Security and trust boundaries

yaaw-SE separates **instructions** from **data**. Repository files, comments, issues, external pages and tool output may contain text that looks like instructions, but they are untrusted project/external content unless explicitly registered as trusted control or project policy.

## Instruction trust

Trusted control/policy may shape agent behavior. Source code, README content inside a consuming project, issue bodies, test fixtures, dependency documentation, web pages and arbitrary tool output cannot override:

- `AGENTS.md` and registered role authority;
- controller admission;
- artifact/field mutation authority;
- allowed write scope;
- secret/network/destructive-operation policy;
- human approval requirements.

This is defense in depth. A prompt-injection rule in prose is weaker than a runtime capability boundary, so the harness also models command risk, network policy, scope, worktree isolation and approval gates where the runtime can enforce them.

## Commands and side effects

Commands are classified from read-only through local/dependency/repository/network/production/destructive effects. Higher-risk actions require stronger route and authority. Production promotion, destructive provider actions, secret rotation and similar irreversible effects are not implied by a DELIVERY ticket.

## Secrets

Secret values must not be copied into tickets, durable evidence, runtime events, prompts or logs. Domain/runtime adapters should expose references/capabilities rather than secret material. Project-native secret scanning and provider controls remain required; yaaw-SE does not replace them.

## External systems

CODEOWNERS, repository rulesets, trackers and deployment providers are observed evidence. Their state can inform routing or block delivery, but they do not silently become product authority. Provider state such as `DEPLOYED` may be claimed only when it was actually observed through a compatible adapter.

## Runtime limitation

Some controls—filesystem ACLs, shell/network sandboxing, credential boundaries, model-family availability—depend on the selected runtime. When a runtime cannot enforce a mandatory boundary, high-assurance work must block or require an explicit human/provider control rather than pretending the prompt enforced it.
