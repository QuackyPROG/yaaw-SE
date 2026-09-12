# Planning discovery

## Purpose
Establish repository-backed engineering facts before asking technical questions.

## Inputs
Current product revision, existing engineering artifact, project rules, relevant specs/tickets, repository, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
- inspect repository structure, language/framework/tooling, existing interfaces/data boundaries, tests, deployment/migration constraints, and relevant implementation areas;
- distinguish observed facts from assumptions;
- identify product requirements that interact with existing system constraints;
- apply the assumption-challenge rule to identify contradictions between accepted product requirements and repository reality, architecture constraints, unsupported assumptions, and potential challenge candidates;
- do not ask the user anything yet.

## Output
Repository/system observations, assumptions, contradictions/constraints, challenge candidates, and evidence references for `planning.write-understanding`.
