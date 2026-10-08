# Expertise: python

## Description
Repository-aware Python design, typing, runtime, IO/error, async, tooling, and review guidance. It grants no workflow authority.

## Required context
`pyproject.toml`/tool configuration, supported Python version, relevant package boundaries, target files, and project test/lint/type conventions.

## Rules
Always prefer repository rules over generic preferences. Planner accounts for package/API boundaries and runtime compatibility. Implementer follows local idioms, preserves typing/error contracts, and manages resources correctly. Reviewer checks behavior, exceptions, typing assumptions, async/sync boundaries, and tooling compliance.

## Anti-patterns
Overriding local conventions, broad exception swallowing, unexamined sync/async mixing, unnecessary abstraction, or assuming a Python/tool version without inspecting the repo.

## Verification expectations
Relevant project tooling passes; error/resource behavior is exercised; typing/runtime assumptions are compatible with the repository.
