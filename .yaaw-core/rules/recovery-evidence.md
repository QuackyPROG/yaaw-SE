# Recovery evidence rules

State files are claims. Observed repository evidence is stronger for implementation reality.

Safe reconciliation requires enough evidence to identify the last trustworthy boundary and exact repository identity. Use evidence records, current artifact revisions, git history/diff, and review records together.

Optional project-memory results are advisory leads only and are never proof of a lifecycle boundary, test result, implementation state, review outcome, or current repository identity.

When the boundary cannot be established, preserve evidence, avoid destructive re-execution, and return `BLOCKED` with exact missing proof.

Never execute a runtime handoff whose repository or source-revision basis is stale.


Diagnosis evidence is not completion evidence. RED evidence is not completion evidence. Failed evidence is not completion evidence. For contract-v2 tickets, only final acceptance-ready verification tied to the current application identity can prove `REVIEW_REQUIRED`. Legacy accepted contracts may use their original verification semantics.
