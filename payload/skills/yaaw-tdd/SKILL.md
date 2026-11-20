---
name: yaaw-tdd
description: Test-driven development at agreed seams, one red-to-green slice at a time. Preloaded into yaaw-dev. Use when building a feature or fixing a bug test-first, or when the user mentions red-green or integration tests.
---

# yaaw-tdd

TDD is the red to green loop. This skill is what makes the loop produce tests worth keeping. Read `GLOSSARY.md` when it exists, so test names use the project's domain language, and respect the ADRs in `docs/adr/` for the area you touch.

## Seams

A **seam** is the public interface where behaviour is observed without reaching inside. Tests live at seams, never against internals.

Test only at the seams the ticket names. They were agreed with the user in planning, which is how testing effort lands on the critical paths instead of every edge case.

- **The ticket names seams**: use them.
- **The ticket names none and you are running as a subagent**: pick the highest existing seam that covers the behaviour, and list it under **Flags** in your report.
- **You are in the main session**: propose the seams to the user, each with one line on what it catches and what it misses, and wait for a yes.

When the shape of the interface itself is in question, read `yaaw-architecture` for the module, interface, depth and seam vocabulary.

## Rules of the loop

- **Red first.** Write one failing test at a seam and run it. Show that it fails for the right reason before writing code.
- **Green.** Write only enough code to pass it, following `yaaw-lean`.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle. Each test is a **tracer bullet** that responds to what the last cycle taught you.
- **Stop at the seams.** When every seam the ticket names has a passing test, the tests are done. Refactoring belongs to review, not to this loop.
- Run the single test file often. Under `/yaaw-se` the orchestrator runs the full suite once per feature, so finish with the `fast` check from `docs/yaaw-se/CHECKS.md` instead. Elsewhere, run the full suite once at the end.
- **Tests that cannot run locally** (`test: none` in `CHECKS.md`, such as an iOS suite that only runs in CI): still write each seam test before its code, and make sure both compile with the `fast` check. The full check proves red and green later, so say in your report that they were not run.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods or verifies through a side channel. The tell: the test breaks on a refactor that keeps the behaviour.
- **Tautological**: the expected value is computed the way the code computes it, so the test passes by construction. Expected values come from an independent source: a literal, a worked example or the spec.
- **Horizontal slicing**: all the tests first, then all the code. These tests check imagined behaviour. Work in vertical slices instead.

Examples of good and bad tests are in [tests.md](tests.md). When and how to mock is in [mocking.md](mocking.md).
