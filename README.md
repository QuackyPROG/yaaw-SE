# YAAW-SE

YAAW-SE is an artifact-first autonomous software-engineering workflow with durable project memory and thin coding-tool entrypoints.

> **Agents are disposable. Artifacts are durable.**

## Install into any project

```bash
cd my-project
npx yaaw-se install
```

The installer defaults to the current directory, lets you select coding tools and public skill entrypoints, previews filesystem changes, and keeps every permanent write inside the selected project.

Tier-1 integrations:

- Codex
- Claude Code
- Gemini CLI
- Cline

Headless example:

```bash
npx yaaw-se install --directory . --tools codex,claude-code --skills standard --yes
```

Preview without writing:

```bash
npx yaaw-se install --tools codex --dry-run
```

## What gets installed

A consuming project has exactly one canonical YAAW root:

```text
.yaaw-core/
├── core/            package-managed workflow contracts
├── roles/
├── workflows/
├── expertise/
├── rules/
├── registries/
├── schemas/
├── templates/
├── project/         durable project-owned YAAW memory
│   ├── product.md
│   ├── engineering.md
│   ├── state.json
│   ├── research/        admitted Planner research (RSH-*)
│   ├── specs/
│   ├── tickets/
│   ├── reviews/
│   ├── evidence/
│   └── rules/
├── runtime/         replaceable coordination state
└── install/         installer metadata
```

Selected coding tools receive only adapters:

```text
.agents/skills/yaaw-*/       Codex
.claude/skills/yaaw-*/       Claude Code
.gemini/skills/yaaw-*/       Gemini CLI
.cline/skills/yaaw-*/        Cline
```

Codex, Claude Code, and Gemini receive a small managed block in their project instruction file. Cline receives the namespaced `.cline/rules/yaaw-se.md`. Provider folders never contain a second YAAW workflow engine.

## Public YAAW entrypoints

Smart entrypoints:

- `@yaaw-orchestrator` — reconstruct project reality and choose the next valid workflow.
- `@yaaw-prd` — create/continue product definition.
- `@yaaw-planner` — continue repository-backed engineering planning.
- `@yaaw-implement` — implement one admitted ticket.
- `@yaaw-review` — independently review current work.

Direct shortcuts:

- `@yaaw-revise-prd`
- `@yaaw-refine-prd`
- `@yaaw-planning-review`
- `@yaaw-create-spec`
- `@yaaw-create-ticket`
- `@yaaw-create-tickets`
- `@yaaw-repair`

The Standard profile exposes all public entrypoints. Core exposes the five smart entrypoints. Custom changes only which shortcuts a coding tool discovers; it never removes canonical workflows from `.yaaw-core`.

## Update, modify, repair

Rerun the installer:

```bash
npx yaaw-se install
```

Existing installations offer Quick Update, Modify Installation, Repair Installation, or safe Uninstall.

Headless examples:

```bash
npx yaaw-se install --action quick-update --yes
npx yaaw-se install --action modify --tools codex,gemini-cli --skills core --yes
npx yaaw-se doctor --repair
```

Managed files are hashed. Local modifications block headless replacement unless `--force-managed` is explicit. That flag applies only to installer-managed files/sections and never authorizes overwriting `.yaaw-core/project`.

Safe uninstall removes package-managed framework files and adapters but preserves durable `.yaaw-core/project` data.

## Diagnostics

```bash
npx yaaw-se status
npx yaaw-se doctor
```

`status` reports installation health and managed-file drift. `doctor` performs read-only checks for manifest integrity, path ownership, missing/modified managed files, and the one-root path registry.

## Architecture

Each execution composes **Role** (authority) + **Workflow** (process) + applicable **Shared Rules** + relevant **Expertise**. Shared rules and expertise never grant authority.

The npm installer owns distribution mechanics. The YAAW Orchestrator owns semantic lifecycle continuity. Neither is a second implementation of the other.

See:

- `docs/distribution.md`
- `docs/integrations.md`
- `docs/releasing.md`

## Development

Python still validates the canonical semantic engine during the migration period. The published npm package does not require Python.

```bash
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python scripts/validate_distribution.py
python -m unittest discover -s tests -v

npm ci
npm test
npm run build
npm pack --dry-run
```

The dependency graph is committed in `package-lock.json`; CI and release verification use `npm ci`. The first npm release is intentionally published manually.

## Deterministic runtime context

YAAW distinguishes the consumer **workspace root** from `.yaaw-core/project/`, the durable **project memory root**. Repository commands are rooted explicitly at the workspace rather than inheriting a provider shell CWD. Product work can continue in an unversioned greenfield directory; workflows that create/review executable code require exact repository identity.

Planning uses progressive disclosure: routers select one canonical workflow before loading its body/templates/expertise. Vendor-specific research or host skills require an explicit repository/product/engineering/current-candidate basis and material blocking research is stored under `.yaaw-core/project/research/`.
