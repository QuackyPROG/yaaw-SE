# Codebase-design expertise

This module is advisory and grants zero workflow authority.

## Vocabulary
module, interface, implementation, seam, adapter, depth, leverage, locality.

## Rules
- Prefer deep modules: small stable interface plus meaningful behavior.
- The interface is the normal test surface.
- Prefer existing useful seams over inventing new ones.
- Add abstraction only for a real current variation/testability/locality reason.
- Make dependencies injectable at a meaningful seam when practical.
- Separate decision logic from hard side effects when that materially improves testability/locality.
- Planner loads this when deciding interfaces/seams; Implementer only when a ticket changes those boundaries; Reviewer when reviewing the resulting design.
