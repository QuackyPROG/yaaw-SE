# Security and trust boundaries

yaaw-SE separates **instructions** from **data**. Repository files, comments, issues, external pages and tool output may contain text that looks like instructions, but they are untrusted project/external content unless explicitly registered as trusted control or project policy.

## Instruction trust

Trusted control/policy may shape agent behavior. Source code, README content inside a consuming project, issue bodies, test fixtures, dependency docs, web pages and arbitrary tool output cannot override:

- `AGENTS.md` and registered role authority;
- controller admission;
- artifact/field mutation authority;
- allowed write scope;
- secret/network/destructive-operation policy;
- human approval requirements.

This is defense in depth. A prompt-injection rule in prose is weaker than a runtime capability boundary, so the harness also models command risk, network policy, scope, worktree isolation and approval gates where the runtime can enforce them.

## Commands and side effects

Command risk has an ordered severity floor (`READ_ONLY` through `DESTRUCTIVE`) plus orthogonal side-effect capabilities. The classifier recognizes common local Git/filesystem mutations, dependency mutation, network access, remote repository writes and obvious provider/production mutation. Renames/copies are separately checked at the Git-scope layer.

Severity and capability are intentionally not conflated: a local `rm -rf` can be destructive without being a network or production operation, while `npm install` can require network access even though its semantic risk class is dependency mutation. Obvious provider mutation such as `terraform apply`/`kubectl apply` requires production capability; destructive provider commands additionally retain the destructive severity floor.

Static command classification is a **minimum heuristic**, not a shell proof system. Arbitrary interpreters/scripts can hide effects, so callers must still declare risk honestly and high-assurance runtimes should enforce shell/network/filesystem/provider capabilities independently. An unknown command is never evidence that an external side effect is safe.

## Secrets

Secret values must not be copied into tickets, durable evidence, runtime events, prompts or logs. Domain/runtime adapters should expose references/capabilities rather than secret material. Project-native secret scanning and provider controls remain required; yaaw-SE does not replace them.

## External systems

CODEOWNERS, repository rulesets, trackers and deployment providers are observed evidence. Their state can inform routing or block delivery, but they do not silently become product authority. Provider state such as `DEPLOYED` may be claimed only when it was actually observed through a compatible adapter.

## Runtime limitation

Some controls—filesystem/tool/network capability isolation, credential boundaries, model-family availability—depend on the selected runtime. When a runtime cannot enforce a mandatory boundary, high-assurance work must block or require an explicit human/provider control rather than pretending the prompt enforced it.
