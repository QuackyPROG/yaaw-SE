---
name: yaaw-architecture
description: Shared vocabulary for module design - module, interface, depth, seam, adapter, leverage and locality. Use when designing or changing a module's interface, deciding where a seam goes, or making code more testable, or when another yaaw skill needs this vocabulary.
---

# yaaw-architecture

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam and tested through that interface. The aim is leverage for callers, locality for maintainers and testability for everyone.

## Glossary

Use these terms exactly. Consistent language is the point.

- **Module**: anything with an interface and an implementation, at any scale: a function, class, package or a slice across tiers.
- **Interface**: everything a caller must know to use the module correctly. This is the type signature plus invariants, ordering, error modes, required config and performance.
- **Implementation**: the code inside a module.
- **Depth**: leverage at the interface. A module is **deep** when a lot of behaviour sits behind a small interface, and **shallow** when the interface is nearly as complex as the implementation.
- **Seam**: a place where behaviour can change without editing that place. It is where a module's interface lives.
- **Adapter**: a concrete thing that fills an interface at a seam.
- **Leverage**: what callers get from depth. One implementation pays back across many call sites and tests.
- **Locality**: what maintainers get from depth. Change, bugs and verification concentrate in one place.

Say **seam** or **interface** in place of "boundary", "component", "service" or "API".

## Principles

- **Depth belongs to the interface.** A deep module can be built from small internal parts, as long as they stay out of the interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through. If it reappears across many callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. Needing to test past the interface means the module is the wrong shape.
- **One adapter is a hypothetical seam. Two adapters is a real one.** A seam is added only when something actually varies across it, such as a production adapter and a test adapter. This is where `yaaw-lean` and this skill agree: no abstraction without a second adapter.

## Designing for testability

1. Accept dependencies at real seams instead of creating them inside.
2. Return results instead of producing side effects.
3. Keep the surface small. Fewer methods need fewer tests.

## Going deeper

- Deepening a cluster of shallow modules, given its dependencies: [DEEPENING.md](DEEPENING.md).
- Comparing several radically different interfaces with parallel subagents: [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md).
