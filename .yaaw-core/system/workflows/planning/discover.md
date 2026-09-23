# Planning discovery

## Purpose
Establish workspace/repository-backed engineering facts before asking technical questions or performing vendor-specific research.

## Inputs
Current product revision, existing engineering artifact, project rules, observed repository capability, relevant specs/tickets, repository/application files when available, and `.yaaw-core/system/rules/assumption-challenge.md`.

## Procedure
- resolve workspace/repository context through `.yaaw-core/system/core/execution-context.md`;
- when repository status is `READY`, inspect with root-anchored, workspace-scoped commands;
- when status is `UNVERSIONED`, inspect filesystem/application reality without inventing Git history and record that limitation explicitly;
- inspect structure, language/framework/tooling, existing interfaces/data boundaries, tests, deployment/migration constraints, and relevant implementation areas;
- distinguish observed facts from assumptions;
- identify product requirements that interact with existing system constraints;
- apply the assumption-challenge rule to identify contradictions and challenge candidates;
- do not ask the user anything yet;
- do not perform vendor/framework web research yet; admission belongs to `planning.decision-frontier`.

## Output
Repository/system observations, assumptions, contradictions/constraints, challenge candidates, capability limitations, and evidence references for `planning.write-understanding`.
