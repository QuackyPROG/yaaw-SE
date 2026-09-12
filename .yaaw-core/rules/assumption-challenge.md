# Assumption challenge

## Purpose
Improve decision quality inside PRD and Planning without creating a new role, workflow, lifecycle state, artifact, or authority layer.

A challenge is warranted only when resolving it could materially change product intent, engineering design, frontier readiness, scope, failure behavior, or downstream implementation.

## Applicability
This rule is consumed by PRD and Planner workflows only.

- **PRD** uses it to challenge product assumptions while preserving Human/PRD authority over product intent.
- **Planner** uses it to challenge engineering assumptions while preserving Planner authority over engineering decisions and Human/PRD authority over product meaning.
- **Orchestrator** does not challenge the user semantically; it routes to the role that owns the decision.
- **Implementer** does not use challenge behavior to reopen accepted product or engineering contracts. Missing material decisions return to Planner or PRD through existing routing.
- **Reviewer** scrutinizes implementation and contracts through independent review outcomes; Reviewer does not substitute for PRD/Planning by interrogating the user.

This rule does not introduce a public skill, `*.grill` workflow, lifecycle state, readiness result, schema field, or durable challenge artifact.

## Core principles

### Facts before questions
Establish inspectable facts before asking the human. Repository-answerable facts are the active role's responsibility. Planner must gather repository evidence before questioning about frameworks, existing capabilities, system boundaries, or code support.

### Material challenge triggers
Challenge material assumptions only when there is a concrete reason, such as:
- conflict with an accepted decision;
- conflict with repository evidence;
- ambiguous terminology;
- an unsupported or unproven assumption;
- a material tradeoff or difficult-to-reverse choice;
- a material failure, edge-case, security, data/state, migration, scope, or compatibility implication;
- a user-flow contradiction or a premature abstraction.

Do not generate filler merely to demonstrate rigor.

### Attack ambiguity, not people
Challenge the claim or model, never the person. State the concrete implication or contradiction, identify what must be resolved, and keep the tone analytical rather than adversarial.

### Stress-test concrete scenarios
When material, stress-test the proposed product behavior or engineering design with concrete success, failure, edge, state-transition, security, migration, operability, and compatibility scenarios. Do not invent irrelevant scenarios simply to expand the question count.

### Decision dependencies and current frontier
Respect decision dependencies. Never ask a dependent question while a prerequisite remains unresolved.

Work only the current frontier:
- settled reusable conclusions remain known decisions;
- material questions answerable now belong to the current frontier;
- issues that depend on future evidence remain future fog.

Questions whose prerequisites are unknown stay out of the current round.

### Recommendations and user ownership
When meaningful alternatives exist and analysis supports a direction, include a `Recommendation:` and a short reason that exposes the actual tradeoff. Free-form answers remain first-class; options are never a forced menu.

A recommendation must not become confirmation bias. If the tradeoff is preference-dependent or evidence is weak, say so rather than disguising uncertainty.

### Do not delegate owned decisions
Do not hand decisions back to the human merely because alternatives exist. The active role resolves decisions it owns when repository evidence, accepted constraints, and normal professional judgment are sufficient.

Planner owns routine reversible implementation decisions such as local naming, helper decomposition, obvious repository-convention reuse, routine test organization, and other minor implementation details unless they become materially consequential.

### Persistence and fresh-context recovery
Persist accepted conclusions rather than a conversation transcript. Durable artifacts record the supported decision, reason, material rejected alternatives where relevant, implications, provenance, remaining assumptions, and unresolved frontier/fog.

Do not persist `User said...`, `Assistant asked...`, debate history, or challenge wording merely because a challenge occurred.

### Recompute after meaningful answers
After accepted answers are durably recorded, recompute the frontier. Re-evaluate contradictions, assumptions, risks, newly exposed questions, and downstream invalidation before asking another round.

### Stop when the next owner can proceed
Stop challenging when the next owner can proceed without inventing a material product or engineering decision. Zero questions is valid.

Do not challenge a settled decision merely to demonstrate rigor.

Do not reopen accepted decisions without new evidence, contradiction, changed intent, or explicit human request.

## PRD specialization
PRD challenges whether the product meaning is sufficiently coherent and intentional. It may challenge:
- product abstractions that are broader than the demonstrated need;
- user, scope, behavior, flow, constraint, and non-goal assumptions;
- contradictions between accepted product statements;
- ambiguous domain/product terminology;
- material failure behavior and edge cases;
- premature product abstractions such as generic roles/permissions when only one concrete capability distinction is established.

PRD must not decide engineering implementation decisions such as transport, database, framework, queue, cache, rendering architecture, ORM, or protocol unless the human explicitly made that method a product constraint. PRD may recommend a product interpretation, but it must not silently reinterpret human product intent.

## Planner specialization
Planner challenges whether accepted product intent is being interpreted and designed correctly against repository reality. It may challenge:
- proposed architecture that exceeds the accepted requirement;
- engineering assumptions contradicted by repository evidence;
- unnecessary abstractions and new infrastructure;
- material architecture/data/interface/failure/security/migration/testing/operability tradeoffs;
- conflicts with accepted `ENG-*` decisions or known future constraints.

Planner must use repository evidence before questioning, must not ask the human to decide routine reversible implementation decisions, and must never invent product intent. A true product gap returns to PRD/human authority through the existing readiness/routing results.

Prefer the smallest architecture justified by accepted product requirements, repository constraints, known future constraints, and material quality requirements. Assumption challenging is not permission for speculative architecture or scope creep.

## Prohibited behaviors
- creating `@yaaw-grill`, `@yaaw-challenge`, `prd.grill`, or `planning.grill` as parallel semantic implementations;
- treating the maximum question count as a target;
- asking repository-answerable facts;
- asking dependent questions before prerequisites are settled;
- reopening accepted decisions without a valid trigger;
- converting a newly discovered adjacent idea into current scope automatically;
- storing challenge/debate transcripts as durable project memory;
- allowing PRD to choose architecture or Planner to invent product meaning;
- allowing Orchestrator, Implementer, or Reviewer to take over PRD/Planner user-question authority.
