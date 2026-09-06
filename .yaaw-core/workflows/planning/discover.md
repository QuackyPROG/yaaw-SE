# Planning discovery

## Purpose
Establish repository-backed engineering facts before asking technical questions, while avoiding repeated broad rediscovery of knowledge the project already accumulated.

## Inputs
Current product revision, existing engineering artifact, project rules, relevant specs/tickets, repository, exact handoff, and optional project memory according to `context_policy`.

## Procedure
1. Read the exact current product/engineering references and identify the current frontier/context question.
2. When memory is enabled, search curated project knowledge first for the relevant components, conventions, historical decisions, prior initiatives, and known traps. Read a page or use deep history only if the focused search is insufficient and policy allows it.
3. Treat retrieved memory as historical leads, not current facts. Verify any claim that will influence planning against current repository/application reality or current canonical artifacts.
4. Inspect targeted repository structure, language/framework/tooling, entry points, interfaces/data boundaries, tests, deployment/migration constraints, and implementation areas relevant to the frontier.
5. Expand repository exploration beyond those targets only when unresolved material gaps remain; do not read every file merely to rebuild a component map already available in memory.
6. Distinguish current observed facts, current authoritative decisions, assumptions, and historical remembered context.
7. Identify product requirements that interact with existing system constraints; do not ask engineering questions yet.

## Output
Repository/system observations with evidence references, plus any useful historical leads clearly separated from verified current facts, for `planning.write-understanding`.
