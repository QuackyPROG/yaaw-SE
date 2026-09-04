---
name: qa-regression
description: Use after implementation for fresh risk-first review of the actual diff, evidence, and regression risk.
---

# qa-regression

## Purpose

Risk-first independent review procedure for a completed implementation/integrated diff.

## Artifact contract

Resolve `.agents/artifacts.json` and `.agents/authority.json`. Produces `QA_REPORT`; never repairs product code in the same context.

## Review order

1. Establish exact base/head diff and changed/untracked surface.
2. Load originating acceptance, accepted intent/decisions, preservation invariants, risk tags and domain verification contracts.
3. Test highest-consequence transitions first: authorization, payments, data loss, secrets/privacy, destructive writes, migrations, compatibility, concurrency, retries/idempotency, external side effects, recovery and irreversible state.
4. Evaluate contract fidelity, preservation, ownership/scope, standards, evidence provenance/freshness and durable documentation.
5. Prefer real integration seams when mocks can hide material risk.
6. Record findings with stable QA IDs, severity and evidence; distinguish confirmed defects from residual uncertainty.
7. Return `PASS`, `REPAIR_REQUIRED`, or `STOP_AND_REPLAN`.

## High assurance

L4/critical work needs orthogonal executable evidence appropriate to its risk matrix and may require integration-stage QA. A fresh LLM thread by itself does not satisfy high-assurance independence.
