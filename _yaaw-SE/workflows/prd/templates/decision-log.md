# PRD Decision Log

Append-only decision-of-record memory for `yaaw-prd`.

This file stores accepted stakeholder decisions and workflow events needed to resume product discovery. It is **not** chain-of-thought and should not contain hidden reasoning.

## Entry format

```text
### D-<NNN> — <TYPE>
Date: YYYY-MM-DD
Status: ACTIVE | SUPERSEDED | REJECTED | DEFERRED | OPEN
Source: stakeholder | source-prd | discovery

Decision / fact:
<one concise durable statement>

Affects:
<PRD sections / requirements / features, when useful>

Supersedes:
<D-ID or none>
```

## Allowed entry types

- `PRODUCT_DECISION` — stakeholder-approved product behavior.
- `NON_GOAL` — explicitly excluded behavior/scope.
- `PRODUCT_CHANGE` — stakeholder-approved revision of existing intent.
- `SUGGESTION_DISPOSITION` — accepted, rejected, or deferred suggested capability.
- `OPEN_DECISION` — material product behavior still requiring stakeholder authority.
- `DISCOVERY_EVENT` — resumable workflow event such as an impact scan requirement or readiness verdict.

## Rules

1. Never rewrite or reorder old entries.
2. Supersede by appending a new entry that references the old one.
3. Do not store technical implementation decisions here unless they were explicitly defined by the stakeholder as a product constraint.
4. Do not store model reasoning, scratch work, hidden analysis, or transcript summaries.
5. The clean PRD is the current product document; this log explains durable stakeholder decisions and supports resume/re-derivation.
6. A recommendation is not a decision until the stakeholder accepts it.
7. When a feature is removed or materially changed, append the change decision and an `impact scan required` discovery event before treating dependent behavior as resolved.
