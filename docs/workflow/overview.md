# yaaw-SE End-to-End Workflow

This is the generic control flow. Domain packs may add stack-specific commands, owners, specialist skills, deployment policy, or stricter gates without changing the core authority model.

```mermaid
flowchart TD
    U[Human request] --> O[Orchestrator intake]

    P0{Manual PRD requested?}
    U --> P0
    P0 -->|yes| PS[prd-creation skill]
    PS --> PRD[PRD<br/>human product-intent authority]
    P0 -->|no| O
    PRD --> O

    O --> R[Classify shape<br/>complexity L0-L4<br/>ownership + risk]
    R --> EX{Relevant accepted PRD exists?}
    EX -->|yes| INT[Attach product intent<br/>scope, non-goals, invariants]
    EX -->|no| ROUTE
    INT --> ROUTE{Cheapest safe route}

    ROUTE -->|L0 Micro| M0[Ephemeral micro-contract]
    ROUTE -->|L1 Bounded| M1[Bounded contract]
    ROUTE -->|L2 Planned Feature| PL[Planner]
    ROUTE -->|L3 Initiative| PL
    ROUTE -->|L4 Program / Architecture| PL

    M0 --> IMP0[Implement directly]
    M1 --> IMP[Fresh Implementer]

    PL --> PM[Engineering artifacts<br/>SPEC / ADR / Initiative Map]
    PM --> TG[Progressive ticket graph]
    TG --> FOG[Fog / not-yet-specified<br/>kept unplanned until knowable]
    TG --> FRONTIER[Ready frontier]

    FRONTIER --> TK{Ticket kind}
    TK -->|DISCOVERY| D[Discovery<br/>establish what is true]
    TK -->|DECISION| DEC[Decision<br/>choose what should be true<br/>within delegated authority]
    TK -->|DELIVERY| IMP

    D --> EVID[Evidence<br/>CONFIRMED / SUPPORTED / SUSPECTED / UNKNOWN]
    EVID --> PL
    DEC --> PL
    PL --> FRONTIER

    IMP --> CG[Contract gate<br/>fresh sources<br/>allowed/forbidden scope<br/>expected change surface<br/>preservation invariants]
    IMP0 --> CG0[Micro scope gate]

    CG --> WORK[Small cohesive implementation]
    CG0 --> WORK0[Small implementation]

    WORK --> V[Risk-weighted verification]
    WORK0 --> V0[Targeted self-verification]

    V --> DIFF[Inspect actual diff<br/>expected vs actual surface<br/>preservation invariants]
    V0 --> DONE0[Ship / record as required]

    DIFF --> SURPRISE{Material surprise?}
    SURPRISE -->|no| QAQ{Independent QA required?}
    SURPRISE -->|yes| STOP[STOP_AND_REPLAN<br/>with evidence]

    STOP --> PROD{Product intent itself<br/>must change?}
    PROD -->|yes| HUMAN[Human product authority]
    HUMAN -->|approved manual revision| PS
    PROD -->|no| DELTA[Planner PLAN_DELTA]

    DELTA --> ACT{Minimum graph mutation}
    ACT -->|continue / amend / split| TG
    ACT -->|insert prerequisite| TG
    ACT -->|add discovery / decision / follow-up| TG
    ACT -->|resequence / promote| TG
    ACT -->|correct completed work| TG

    QAQ -->|no, route explicitly allows| COMMIT[Coherent verified commit]
    QAQ -->|yes| QA[Fresh independent QA]

    QA --> QR{QA result}
    QR -->|PASS| COMMIT
    QR -->|REPAIR_REQUIRED| REPAIR[Eligible Implementer repair<br/>fresh by default]
    REPAIR --> V
    QR -->|STOP_AND_REPLAN| STOP

    COMMIT --> MSG[Ticket-linked commit<br/>what changed + why + verification]
    MSG --> REL[Release Engineer]
    REL --> CI[Configured CI / integration gates]
    CI --> PROMOTE{Promotion authority satisfied?}
    PROMOTE -->|yes| SHIP[Delivered / promoted]
    PROMOTE -->|no| HOLD[Hold with explicit blocker]

    SHIP --> NEXT{More ready work?}
    NEXT -->|yes| FRONTIER
    NEXT -->|no| COMPLETE[Route complete]

    classDef human fill:#f5f5f5,stroke:#333,stroke-width:1px;
    class U,HUMAN human;
```

## What each layer owns

| Layer | Owns | Does not own |
|---|---|---|
| Human / PRD | Product destination, scope, non-goals, product invariants, requirements | Engineering route or automatic backlog |
| Orchestrator | Intake, L0-L4 routing, ownership, freshness, frontier, dispatch | General planning or product implementation |
| Planner | SPEC/ADR/maps, DISCOVERY/DECISION/DELIVERY graph, PLAN_DELTA | Accepted PRD semantics or general coding |
| Discovery | Evidence about what is true | Product decisions |
| Implementer | One bounded delivery contract | Silent scope expansion or graph changes |
| QA | Fresh risk-based review of actual diff and evidence | Same-context repair |
| Release Engineer | Coherent commit/integration/CI/promotion record | Missing QA, product code, or invented deployment state |

## The planning rule

Large work is **not** decomposed into a fake complete backlog on day one.

```mermaid
flowchart LR
    K[Known now] --> T[Precise tickets]
    N[In scope but not knowable yet] --> F[Fog]
    T --> X[Execute ready frontier]
    X --> E[New evidence]
    E -->|makes fog precise| T
    E -->|changes engineering route| D[PLAN_DELTA]
    D --> T
```

## The truth rule

Observed state and desired intent are separate:

```mermaid
flowchart LR
    subgraph CURRENT[Observed truth: what exists now]
      RT[Runtime evidence] --> TEST[Tests / verification] --> CODE[Code / config]
    end

    subgraph INTENT[Intent truth: what should become true]
      H[Human decision] --> P[Accepted PRD] --> A[Accepted ADR / product decision] --> S[SPEC / map] --> T[Ticket]
    end
```

Missing code can prove that a requirement is not implemented yet. It cannot silently cancel an accepted requirement.

## The commit rule

A commit is one coherent verified outcome: independently understandable, reviewable, and reasonably revertible. Prefer ticket-aligned commits when the boundary is clean. Avoid both one-commit-per-keystroke noise and giant unrelated initiative commits.
