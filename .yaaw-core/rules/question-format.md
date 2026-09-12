# Question format

Before formatting a PRD or Planning question round, the active role applies `.yaaw-core/rules/assumption-challenge.md` to determine which questions belong on the current frontier. This file owns presentation and sequencing only; contradiction detection, stress testing, facts-before-questions, terminology analysis, and role authority remain canonical in the assumption-challenge and authority contracts.

Question rounds contain at most 10 meaningful questions and never filler. The maximum is not a target; zero questions is valid when the active role can safely proceed.

Preferred structure:

```text
1. Question?
A. Option
B. Option
C. Option
Recommendation: B
Reason: ...
```

Use options and recommendations where useful. Free-form answers are first-class and must never be forced into the offered choices. New unknowns discovered from an answer belong in the next round unless they block recording the current answer safely.

Before presenting another round, persist the accepted answers and update unresolved questions/frontier.
